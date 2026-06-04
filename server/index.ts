import express from 'express';
import dotenv from 'dotenv';
import { query, pool } from './db';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '5000');

// ─── Helper: map snake_case DB rows to camelCase frontend objects ───

function mapUser(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    assignedClientId: row.assigned_client_id || undefined,
    loginCount: row.login_count,
  };
}

function mapPackage(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    unitCost: parseFloat(row.unit_cost),
    taxRate: parseFloat(row.tax_rate),
  };
}

function mapClient(row: any) {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    address: row.address,
    staffPopulation: row.staff_population,
    contractStatus: row.contract_status,
    packageId: row.package_id,
    notes: row.notes,
    isArchived: row.is_archived,
  };
}

function mapCampaign(row: any) {
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id,
    screeningDate: row.screening_date instanceof Date ? row.screening_date.toISOString().split('T')[0] : row.screening_date,
    venue: row.venue,
    assignedTeam: row.assigned_team,
    targetParticipantCount: row.target_participant_count,
    status: row.status,
    notes: row.notes,
  };
}

function mapParticipant(row: any) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    fullName: row.full_name,
    dob: row.dob instanceof Date ? row.dob.toISOString().split('T')[0] : row.dob,
    age: row.age,
    phone: row.phone,
    email: row.email,
    department: row.department,
    companyId: row.company_id,
    campaignId: row.campaign_id,
    emergencyContact: row.emergency_contact,
    consentConfirmed: row.consent_confirmed,
    registrationDate: row.registration_date instanceof Date ? row.registration_date.toISOString().split('T')[0] : row.registration_date,
  };
}

function mapTest(row: any, corrections: any[] = []) {
  return {
    id: row.id,
    participantId: row.participant_id,
    sampleId: row.sample_id,
    collectionDate: row.collection_date instanceof Date ? row.collection_date.toISOString().split('T')[0] : row.collection_date,
    processingDate: row.processing_date ? (row.processing_date instanceof Date ? row.processing_date.toISOString().split('T')[0] : row.processing_date) : null,
    laboratoryOfficer: row.laboratory_officer,
    psaValue: row.psa_value !== null ? parseFloat(row.psa_value) : null,
    status: row.status,
    remarks: row.remarks,
    classification: row.classification,
    history: corrections.map((c: any) => ({
      timestamp: c.timestamp instanceof Date ? c.timestamp.toISOString() : c.timestamp,
      modifiedBy: c.modified_by,
      prevValue: c.prev_value !== null ? parseFloat(c.prev_value) : null,
      newValue: c.new_value !== null ? parseFloat(c.new_value) : null,
      reason: c.reason,
    })),
  };
}

function mapReview(row: any) {
  return {
    id: row.id,
    testId: row.test_id,
    participantId: row.participant_id,
    specialistName: row.specialist_name,
    reviewDate: row.review_date instanceof Date ? row.review_date.toISOString().split('T')[0] : row.review_date,
    clinicalObservations: row.clinical_observations,
    recommendations: row.recommendations,
    requestRepeatTest: row.request_repeat_test,
    scheduleReferral: row.schedule_referral,
    status: row.status,
  };
}

function mapInvoice(row: any, payments: any[] = []) {
  return {
    id: row.id,
    clientId: row.client_id,
    campaignId: row.campaign_id,
    packageId: row.package_id,
    numberScreened: row.number_screened,
    unitCost: parseFloat(row.unit_cost),
    subtotal: parseFloat(row.subtotal),
    tax: parseFloat(row.tax),
    totalAmount: parseFloat(row.total_amount),
    outstandingBalance: parseFloat(row.outstanding_balance),
    paymentStatus: row.payment_status,
    issuedDate: row.issued_date instanceof Date ? row.issued_date.toISOString().split('T')[0] : row.issued_date,
    dueDate: row.due_date instanceof Date ? row.due_date.toISOString().split('T')[0] : row.due_date,
    payments: payments.map((p: any) => ({
      id: p.id,
      amount: parseFloat(p.amount),
      date: p.date instanceof Date ? p.date.toISOString().split('T')[0] : p.date,
      method: p.method,
      transactionRef: p.transaction_ref,
    })),
  };
}

function mapAuditLog(row: any) {
  return {
    id: row.id,
    user: row.user_info,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
    action: row.action,
    recordAffected: row.record_affected,
    previousValue: row.previous_value,
    newValue: row.new_value,
  };
}

function mapNotification(row: any) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
    recipient: row.recipient,
    isRead: row.is_read,
  };
}

// ─── GET /api/db — Load the entire database state for the frontend ───

app.get('/api/db', async (_req, res) => {
  try {
    const [usersRes, pkgsRes, clientsRes, campaignsRes, participantsRes, testsRes, correctionsRes, reviewsRes, invoicesRes, paymentsRes, logsRes, notifsRes] = await Promise.all([
      query('SELECT * FROM users ORDER BY id'),
      query('SELECT * FROM billing_packages ORDER BY id'),
      query('SELECT * FROM corporate_clients ORDER BY id'),
      query('SELECT * FROM screening_campaigns ORDER BY id'),
      query('SELECT * FROM participants ORDER BY id'),
      query('SELECT * FROM psa_tests ORDER BY id'),
      query('SELECT * FROM psa_test_corrections ORDER BY test_id, id'),
      query('SELECT * FROM specialist_reviews ORDER BY id'),
      query('SELECT * FROM invoices ORDER BY id'),
      query('SELECT * FROM payments ORDER BY invoice_id, id'),
      query('SELECT * FROM audit_logs ORDER BY timestamp DESC'),
      query('SELECT * FROM notifications ORDER BY timestamp DESC'),
    ]);

    // Group corrections by test_id
    const correctionsByTest: Record<string, any[]> = {};
    for (const c of correctionsRes.rows) {
      if (!correctionsByTest[c.test_id]) correctionsByTest[c.test_id] = [];
      correctionsByTest[c.test_id].push(c);
    }

    // Group payments by invoice_id
    const paymentsByInvoice: Record<string, any[]> = {};
    for (const p of paymentsRes.rows) {
      if (!paymentsByInvoice[p.invoice_id]) paymentsByInvoice[p.invoice_id] = [];
      paymentsByInvoice[p.invoice_id].push(p);
    }

    res.json({
      users: usersRes.rows.map(mapUser),
      packages: pkgsRes.rows.map(mapPackage),
      clients: clientsRes.rows.map(mapClient),
      campaigns: campaignsRes.rows.map(mapCampaign),
      participants: participantsRes.rows.map(mapParticipant),
      tests: testsRes.rows.map(r => mapTest(r, correctionsByTest[r.id] || [])),
      reviews: reviewsRes.rows.map(mapReview),
      invoices: invoicesRes.rows.map(r => mapInvoice(r, paymentsByInvoice[r.id] || [])),
      auditLogs: logsRes.rows.map(mapAuditLog),
      notifications: notifsRes.rows.map(mapNotification),
    });
  } catch (err) {
    console.error('GET /api/db error:', err);
    res.status(500).json({ error: 'Failed to load database' });
  }
});

// ─── CLIENTS ───

app.post('/api/clients', async (req, res) => {
  try {
    const c = req.body;
    const id = `CL-${Date.now().toString().slice(-6)}`;
    await query(
      'INSERT INTO corporate_clients (id, name, industry, contact_person, phone, email, address, staff_population, contract_status, package_id, notes, is_archived) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [id, c.name, c.industry, c.contactPerson, c.phone, c.email, c.address, c.staffPopulation, c.contractStatus, c.packageId, c.notes, false]
    );
    const result = await query('SELECT * FROM corporate_clients WHERE id = $1', [id]);
    res.status(201).json(mapClient(result.rows[0]));
  } catch (err) {
    console.error('POST /api/clients error:', err);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const c = req.body;
    await query(
      'UPDATE corporate_clients SET name=$1, industry=$2, contact_person=$3, phone=$4, email=$5, address=$6, staff_population=$7, contract_status=$8, package_id=$9, notes=$10, is_archived=$11 WHERE id=$12',
      [c.name, c.industry, c.contactPerson, c.phone, c.email, c.address, c.staffPopulation, c.contractStatus, c.packageId, c.notes, c.isArchived ?? false, req.params.id]
    );
    const result = await query('SELECT * FROM corporate_clients WHERE id = $1', [req.params.id]);
    res.json(mapClient(result.rows[0]));
  } catch (err) {
    console.error('PUT /api/clients error:', err);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

app.patch('/api/clients/:id/archive', async (req, res) => {
  try {
    await query('UPDATE corporate_clients SET is_archived = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive client' });
  }
});

app.patch('/api/clients/:id/restore', async (req, res) => {
  try {
    await query('UPDATE corporate_clients SET is_archived = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore client' });
  }
});

// ─── CAMPAIGNS ───

app.post('/api/campaigns', async (req, res) => {
  try {
    const c = req.body;
    const id = `CMP-${Date.now().toString().slice(-6)}`;
    await query(
      'INSERT INTO screening_campaigns (id, name, client_id, screening_date, venue, assigned_team, target_participant_count, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, c.name, c.clientId, c.screeningDate, c.venue, c.assignedTeam, c.targetParticipantCount, c.status, c.notes]
    );
    const result = await query('SELECT * FROM screening_campaigns WHERE id = $1', [id]);
    res.status(201).json(mapCampaign(result.rows[0]));
  } catch (err) {
    console.error('POST /api/campaigns error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

app.put('/api/campaigns/:id', async (req, res) => {
  try {
    const c = req.body;
    await query(
      'UPDATE screening_campaigns SET name=$1, client_id=$2, screening_date=$3, venue=$4, assigned_team=$5, target_participant_count=$6, status=$7, notes=$8 WHERE id=$9',
      [c.name, c.clientId, c.screeningDate, c.venue, c.assignedTeam, c.targetParticipantCount, c.status, c.notes, req.params.id]
    );
    const result = await query('SELECT * FROM screening_campaigns WHERE id = $1', [req.params.id]);
    res.json(mapCampaign(result.rows[0]));
  } catch (err) {
    console.error('PUT /api/campaigns error:', err);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// ─── PARTICIPANTS ───

app.post('/api/participants', async (req, res) => {
  try {
    const p = req.body;
    const countRes = await query('SELECT COUNT(*) FROM participants');
    const num = parseInt(countRes.rows[0].count) + 200 + 1;
    const id = `PRT-${num}`;
    const regDate = new Date().toISOString().split('T')[0];

    // Calculate age
    const dob = new Date(p.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

    await query(
      'INSERT INTO participants (id, employee_id, full_name, dob, age, phone, email, department, company_id, campaign_id, emergency_contact, consent_confirmed, registration_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [id, p.employeeId, p.fullName, p.dob, age, p.phone, p.email, p.department, p.companyId, p.campaignId, p.emergencyContact, p.consentConfirmed, regDate]
    );

    // Also create a pending test record for this participant
    const testCountRes = await query('SELECT COUNT(*) FROM psa_tests');
    const testNum = parseInt(testCountRes.rows[0].count) + 800 + 1;
    const testId = `TST-${testNum}`;
    const smpNum = parseInt(testCountRes.rows[0].count) + 5000 + 1;
    const sampleId = `SMP-${smpNum}`;

    await query(
      'INSERT INTO psa_tests (id, participant_id, sample_id, collection_date, processing_date, laboratory_officer, psa_value, status, remarks, classification) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [testId, id, sampleId, regDate, null, null, null, 'Pending Collection', 'Queued for sample collection.', 'Pending']
    );

    const participantRes = await query('SELECT * FROM participants WHERE id = $1', [id]);
    const testRes = await query('SELECT * FROM psa_tests WHERE id = $1', [testId]);
    res.status(201).json({
      participant: mapParticipant(participantRes.rows[0]),
      test: mapTest(testRes.rows[0], []),
    });
  } catch (err) {
    console.error('POST /api/participants error:', err);
    res.status(500).json({ error: 'Failed to register participant' });
  }
});

app.put('/api/participants/:id', async (req, res) => {
  try {
    const p = req.body;
    await query(
      'UPDATE participants SET employee_id=$1, full_name=$2, dob=$3, age=$4, phone=$5, email=$6, department=$7, company_id=$8, campaign_id=$9, emergency_contact=$10, consent_confirmed=$11 WHERE id=$12',
      [p.employeeId, p.fullName, p.dob, p.age, p.phone, p.email, p.department, p.companyId, p.campaignId, p.emergencyContact, p.consentConfirmed, req.params.id]
    );
    const result = await query('SELECT * FROM participants WHERE id = $1', [req.params.id]);
    res.json(mapParticipant(result.rows[0]));
  } catch (err) {
    console.error('PUT /api/participants error:', err);
    res.status(500).json({ error: 'Failed to update participant' });
  }
});

// ─── PSA TESTS (Lab results upload & corrections) ───

app.put('/api/tests/:id/result', async (req, res) => {
  try {
    const { psaValue, remarks } = req.body;
    let classification = 'Pending';
    if (psaValue !== null && psaValue !== undefined) {
      if (psaValue < 4.0) classification = 'Normal';
      else if (psaValue < 10.0) classification = 'Borderline';
      else classification = 'Elevated';
    }
    const processingDate = new Date().toISOString().split('T')[0];

    await query(
      'UPDATE psa_tests SET psa_value=$1, remarks=$2, classification=$3, status=$4, processing_date=$5 WHERE id=$6',
      [psaValue, remarks, classification, 'Completed', processingDate, req.params.id]
    );
    const result = await query('SELECT * FROM psa_tests WHERE id = $1', [req.params.id]);
    const corrections = await query('SELECT * FROM psa_test_corrections WHERE test_id = $1 ORDER BY id', [req.params.id]);
    res.json(mapTest(result.rows[0], corrections.rows));
  } catch (err) {
    console.error('PUT /api/tests/:id/result error:', err);
    res.status(500).json({ error: 'Failed to upload result' });
  }
});

app.put('/api/tests/:id/correct', async (req, res) => {
  try {
    const { newValue, reason, modifiedBy } = req.body;

    // Get the current value
    const currentRes = await query('SELECT psa_value FROM psa_tests WHERE id = $1', [req.params.id]);
    const prevValue = currentRes.rows[0]?.psa_value !== null ? parseFloat(currentRes.rows[0].psa_value) : null;

    // Insert correction record
    await query(
      'INSERT INTO psa_test_corrections (test_id, modified_by, prev_value, new_value, reason) VALUES ($1,$2,$3,$4,$5)',
      [req.params.id, modifiedBy, prevValue, newValue, reason]
    );

    // Update the test value
    let classification = 'Pending';
    if (newValue < 4.0) classification = 'Normal';
    else if (newValue < 10.0) classification = 'Borderline';
    else classification = 'Elevated';

    await query(
      'UPDATE psa_tests SET psa_value=$1, classification=$2 WHERE id=$3',
      [newValue, classification, req.params.id]
    );

    const result = await query('SELECT * FROM psa_tests WHERE id = $1', [req.params.id]);
    const corrections = await query('SELECT * FROM psa_test_corrections WHERE test_id = $1 ORDER BY id', [req.params.id]);
    res.json(mapTest(result.rows[0], corrections.rows));
  } catch (err) {
    console.error('PUT /api/tests/:id/correct error:', err);
    res.status(500).json({ error: 'Failed to correct test result' });
  }
});

// ─── SPECIALIST REVIEWS ───

app.post('/api/reviews', async (req, res) => {
  try {
    const r = req.body;
    const id = `REV-${Date.now().toString().slice(-6)}`;
    const reviewDate = new Date().toISOString().split('T')[0];
    const specialistName = r.specialistName || 'Dr. Robert Chen, MD';

    // Check for existing review
    const existing = await query('SELECT id FROM specialist_reviews WHERE test_id = $1', [r.testId]);
    if (existing.rows.length > 0) {
      // Update existing review
      await query(
        'UPDATE specialist_reviews SET clinical_observations=$1, recommendations=$2, request_repeat_test=$3, schedule_referral=$4, status=$5, review_date=$6 WHERE test_id=$7',
        [r.clinicalObservations, r.recommendations, r.requestRepeatTest, r.scheduleReferral, r.status, reviewDate, r.testId]
      );
      const result = await query('SELECT * FROM specialist_reviews WHERE test_id = $1', [r.testId]);
      return res.json(mapReview(result.rows[0]));
    }

    await query(
      'INSERT INTO specialist_reviews (id, test_id, participant_id, specialist_name, review_date, clinical_observations, recommendations, request_repeat_test, schedule_referral, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [id, r.testId, r.participantId, specialistName, reviewDate, r.clinicalObservations, r.recommendations, r.requestRepeatTest, r.scheduleReferral, r.status]
    );
    const result = await query('SELECT * FROM specialist_reviews WHERE id = $1', [id]);
    res.status(201).json(mapReview(result.rows[0]));
  } catch (err) {
    console.error('POST /api/reviews error:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// ─── INVOICES & PAYMENTS ───

app.post('/api/invoices', async (req, res) => {
  try {
    const inv = req.body;
    const countRes = await query('SELECT COUNT(*) FROM invoices');
    const num = parseInt(countRes.rows[0].count) + 1;
    const id = `INV-2026-${String(num).padStart(3, '0')}`;
    const issuedDate = new Date().toISOString().split('T')[0];
    const subtotal = inv.numberScreened * inv.unitCost;
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + tax;

    await query(
      'INSERT INTO invoices (id, client_id, campaign_id, package_id, number_screened, unit_cost, subtotal, tax, total_amount, outstanding_balance, payment_status, issued_date, due_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [id, inv.clientId, inv.campaignId, inv.packageId, inv.numberScreened, inv.unitCost, subtotal, tax, totalAmount, totalAmount, 'Unpaid', issuedDate, inv.dueDate]
    );
    const result = await query('SELECT * FROM invoices WHERE id = $1', [id]);
    res.status(201).json(mapInvoice(result.rows[0], []));
  } catch (err) {
    console.error('POST /api/invoices error:', err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

app.post('/api/invoices/:id/payments', async (req, res) => {
  try {
    const { amount, method, transactionRef } = req.body;
    const paymentId = `PMT-${Date.now().toString().slice(-6)}`;
    const paymentDate = new Date().toISOString().split('T')[0];

    await query(
      'INSERT INTO payments (id, invoice_id, amount, date, method, transaction_ref) VALUES ($1,$2,$3,$4,$5,$6)',
      [paymentId, req.params.id, amount, paymentDate, method, transactionRef]
    );

    // Update invoice outstanding balance
    const invoiceRes = await query('SELECT outstanding_balance FROM invoices WHERE id = $1', [req.params.id]);
    const currentBalance = parseFloat(invoiceRes.rows[0].outstanding_balance);
    const newBalance = Math.max(0, currentBalance - amount);
    const status = newBalance <= 0 ? 'Fully Paid' : 'Partially Paid';

    await query(
      'UPDATE invoices SET outstanding_balance=$1, payment_status=$2 WHERE id=$3',
      [newBalance, status, req.params.id]
    );

    // Return the full updated invoice
    const result = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    const payments = await query('SELECT * FROM payments WHERE invoice_id = $1 ORDER BY id', [req.params.id]);
    res.status(201).json(mapInvoice(result.rows[0], payments.rows));
  } catch (err) {
    console.error('POST /api/invoices/:id/payments error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// ─── USERS ───

app.post('/api/users', async (req, res) => {
  try {
    const u = req.body;
    const id = `USR-${Date.now().toString().slice(-6)}`;
    await query(
      'INSERT INTO users (id, name, email, role, is_active, assigned_client_id, login_count) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, u.name, u.email, u.role, u.isActive ?? true, u.assignedClientId || null, 0]
    );
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    res.status(201).json(mapUser(result.rows[0]));
  } catch (err) {
    console.error('POST /api/users error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const u = req.body;
    await query(
      'UPDATE users SET name=$1, email=$2, role=$3, is_active=$4, assigned_client_id=$5 WHERE id=$6',
      [u.name, u.email, u.role, u.isActive, u.assignedClientId || null, req.params.id]
    );
    const result = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    res.json(mapUser(result.rows[0]));
  } catch (err) {
    console.error('PUT /api/users error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/users error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── AUDIT LOGS ───

app.post('/api/audit-logs', async (req, res) => {
  try {
    const l = req.body;
    const id = `LOG-${Date.now()}`;
    await query(
      'INSERT INTO audit_logs (id, user_info, timestamp, action, record_affected, previous_value, new_value) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, l.user, new Date().toISOString(), l.action, l.recordAffected, l.previousValue || null, l.newValue || null]
    );
    const result = await query('SELECT * FROM audit_logs WHERE id = $1', [id]);
    res.status(201).json(mapAuditLog(result.rows[0]));
  } catch (err) {
    console.error('POST /api/audit-logs error:', err);
    res.status(500).json({ error: 'Failed to add audit log' });
  }
});

// ─── NOTIFICATIONS ───

app.post('/api/notifications', async (req, res) => {
  try {
    const n = req.body;
    const id = `NTF-${Date.now()}`;
    await query(
      'INSERT INTO notifications (id, type, title, message, timestamp, recipient, is_read) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, n.type || 'In-App', n.title, n.message, new Date().toISOString(), n.recipient, false]
    );
    const result = await query('SELECT * FROM notifications WHERE id = $1', [id]);
    res.status(201).json(mapNotification(result.rows[0]));
  } catch (err) {
    console.error('POST /api/notifications error:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

app.patch('/api/notifications/read', async (req, res) => {
  try {
    const { ids } = req.body;
    if (ids && ids.length > 0) {
      const placeholders = ids.map((_: any, i: number) => `$${i + 1}`).join(',');
      await query(`UPDATE notifications SET is_read = TRUE WHERE id IN (${placeholders})`, ids);
    } else {
      await query('UPDATE notifications SET is_read = TRUE');
    }
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/notifications/read error:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// ─── Server startup ───

app.listen(PORT, () => {
  console.log(`PrimeCare API server running on http://localhost:${PORT}`);
});
