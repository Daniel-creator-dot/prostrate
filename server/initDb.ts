import pg from 'pg';
import dotenv from 'dotenv';
import {
  INITIAL_USERS,
  INITIAL_PACKAGES,
  INITIAL_CLIENTS,
  INITIAL_CAMPAIGNS,
  INITIAL_PARTICIPANTS,
  INITIAL_TESTS,
  INITIAL_REVIEWS,
  INITIAL_INVOICES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../src/mockData';

dotenv.config();

const { Client, Pool } = pg;

async function ensureDatabaseExists() {
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'admin';
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432');
  const dbName = process.env.DB_NAME || 'postrate';

  // Connect to the default 'postgres' database to check/create the target database
  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating it now...`);
      // CREATE DATABASE cannot run inside a transaction, must run on its own
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Error ensuring database exists:', err);
    throw err;
  } finally {
    await client.end();
  }
}

async function initializeSchemaAndSeed() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'postrate',
  });

  try {
    console.log('Connecting to target database for schema creation...');
    
    // Drop existing tables in reverse dependency order
    await pool.query('DROP TABLE IF EXISTS notifications CASCADE');
    await pool.query('DROP TABLE IF EXISTS audit_logs CASCADE');
    await pool.query('DROP TABLE IF EXISTS payments CASCADE');
    await pool.query('DROP TABLE IF EXISTS invoices CASCADE');
    await pool.query('DROP TABLE IF EXISTS specialist_reviews CASCADE');
    await pool.query('DROP TABLE IF EXISTS psa_test_corrections CASCADE');
    await pool.query('DROP TABLE IF EXISTS psa_tests CASCADE');
    await pool.query('DROP TABLE IF EXISTS participants CASCADE');
    await pool.query('DROP TABLE IF EXISTS screening_campaigns CASCADE');
    await pool.query('DROP TABLE IF EXISTS corporate_clients CASCADE');
    await pool.query('DROP TABLE IF EXISTS billing_packages CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('Existing tables dropped.');

    // Create tables
    await pool.query(`
      CREATE TABLE users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        assigned_client_id VARCHAR(50),
        login_count INT NOT NULL DEFAULT 0
      )
    `);

    await pool.query(`
      CREATE TABLE billing_packages (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        unit_cost NUMERIC(10, 2) NOT NULL,
        tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.05
      )
    `);

    await pool.query(`
      CREATE TABLE corporate_clients (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255) NOT NULL,
        address TEXT,
        staff_population INT NOT NULL,
        contract_status VARCHAR(50) NOT NULL,
        package_id VARCHAR(50) REFERENCES billing_packages(id),
        notes TEXT,
        is_archived BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    await pool.query(`
      CREATE TABLE screening_campaigns (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        client_id VARCHAR(50) REFERENCES corporate_clients(id),
        screening_date DATE NOT NULL,
        venue VARCHAR(255) NOT NULL,
        assigned_team VARCHAR(255),
        target_participant_count INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE participants (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        age INT NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        department VARCHAR(255),
        company_id VARCHAR(50) REFERENCES corporate_clients(id),
        campaign_id VARCHAR(50) REFERENCES screening_campaigns(id),
        emergency_contact VARCHAR(255),
        consent_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
        registration_date DATE NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE psa_tests (
        id VARCHAR(50) PRIMARY KEY,
        participant_id VARCHAR(50) REFERENCES participants(id),
        sample_id VARCHAR(50) UNIQUE NOT NULL,
        collection_date DATE NOT NULL,
        processing_date TIMESTAMP,
        laboratory_officer VARCHAR(255),
        psa_value NUMERIC(6, 2),
        status VARCHAR(50) NOT NULL,
        remarks TEXT,
        classification VARCHAR(50) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE psa_test_corrections (
        id SERIAL PRIMARY KEY,
        test_id VARCHAR(50) REFERENCES psa_tests(id) ON DELETE CASCADE,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        modified_by VARCHAR(255) NOT NULL,
        prev_value NUMERIC(6, 2),
        new_value NUMERIC(6, 2),
        reason TEXT NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE specialist_reviews (
        id VARCHAR(50) PRIMARY KEY,
        test_id VARCHAR(50) REFERENCES psa_tests(id),
        participant_id VARCHAR(50) REFERENCES participants(id),
        specialist_name VARCHAR(255) NOT NULL,
        review_date DATE NOT NULL,
        clinical_observations TEXT NOT NULL,
        recommendations TEXT NOT NULL,
        request_repeat_test BOOLEAN NOT NULL DEFAULT FALSE,
        schedule_referral VARCHAR(255),
        status VARCHAR(50) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE invoices (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES corporate_clients(id),
        campaign_id VARCHAR(50) REFERENCES screening_campaigns(id),
        package_id VARCHAR(50) REFERENCES billing_packages(id),
        number_screened INT NOT NULL,
        unit_cost NUMERIC(10, 2) NOT NULL,
        subtotal NUMERIC(10, 2) NOT NULL,
        tax NUMERIC(10, 2) NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        outstanding_balance NUMERIC(10, 2) NOT NULL,
        payment_status VARCHAR(50) NOT NULL,
        issued_date DATE NOT NULL,
        due_date DATE NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE payments (
        id VARCHAR(50) PRIMARY KEY,
        invoice_id VARCHAR(50) REFERENCES invoices(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        date DATE NOT NULL,
        method VARCHAR(50) NOT NULL,
        transaction_ref VARCHAR(255) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        user_info VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        action VARCHAR(255) NOT NULL,
        record_affected VARCHAR(255) NOT NULL,
        previous_value TEXT,
        new_value TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE notifications (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        recipient VARCHAR(255) NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    console.log('All tables created successfully.');

    // Seed Users
    console.log('Seeding users...');
    for (const u of INITIAL_USERS) {
      await pool.query(
        'INSERT INTO users (id, name, email, role, is_active, assigned_client_id, login_count) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [u.id, u.name, u.email, u.role, u.isActive, u.assignedClientId || null, u.loginCount]
      );
    }

    // Seed Billing Packages
    console.log('Seeding billing packages...');
    for (const p of INITIAL_PACKAGES) {
      await pool.query(
        'INSERT INTO billing_packages (id, name, description, unit_cost, tax_rate) VALUES ($1, $2, $3, $4, $5)',
        [p.id, p.name, p.description, p.unitCost, p.taxRate]
      );
    }

    // Seed Clients
    console.log('Seeding corporate clients...');
    for (const c of INITIAL_CLIENTS) {
      await pool.query(
        'INSERT INTO corporate_clients (id, name, industry, contact_person, phone, email, address, staff_population, contract_status, package_id, notes, is_archived) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [c.id, c.name, c.industry, c.contactPerson, c.phone, c.email, c.address, c.staffPopulation, c.contractStatus, c.packageId, c.notes, c.isArchived]
      );
    }

    // Seed Campaigns
    console.log('Seeding screening campaigns...');
    for (const c of INITIAL_CAMPAIGNS) {
      await pool.query(
        'INSERT INTO screening_campaigns (id, name, client_id, screening_date, venue, assigned_team, target_participant_count, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [c.id, c.name, c.clientId, c.screeningDate, c.venue, c.assignedTeam, c.targetParticipantCount, c.status, c.notes]
      );
    }

    // Seed Participants
    console.log('Seeding participants...');
    for (const p of INITIAL_PARTICIPANTS) {
      await pool.query(
        'INSERT INTO participants (id, employee_id, full_name, dob, age, phone, email, department, company_id, campaign_id, emergency_contact, consent_confirmed, registration_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        [p.id, p.employeeId, p.fullName, p.dob, p.age, p.phone, p.email, p.department, p.companyId, p.campaignId, p.emergencyContact, p.consentConfirmed, p.registrationDate]
      );
    }

    // Seed PSA Tests
    console.log('Seeding PSA tests...');
    for (const t of INITIAL_TESTS) {
      await pool.query(
        'INSERT INTO psa_tests (id, participant_id, sample_id, collection_date, processing_date, laboratory_officer, psa_value, status, remarks, classification) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [t.id, t.participantId, t.sampleId, t.collectionDate, t.processingDate, t.laboratoryOfficer, t.psaValue, t.status, t.remarks, t.classification]
      );
    }

    // Seed Specialist Reviews
    console.log('Seeding specialist reviews...');
    for (const r of INITIAL_REVIEWS) {
      await pool.query(
        'INSERT INTO specialist_reviews (id, test_id, participant_id, specialist_name, review_date, clinical_observations, recommendations, request_repeat_test, schedule_referral, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [r.id, r.testId, r.participantId, r.specialistName, r.reviewDate, r.clinicalObservations, r.recommendations, r.requestRepeatTest, r.scheduleReferral, r.status]
      );
    }

    // Seed Invoices and Payments
    console.log('Seeding invoices and payment records...');
    for (const inv of INITIAL_INVOICES) {
      await pool.query(
        'INSERT INTO invoices (id, client_id, campaign_id, package_id, number_screened, unit_cost, subtotal, tax, total_amount, outstanding_balance, payment_status, issued_date, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        [inv.id, inv.clientId, inv.campaignId, inv.packageId, inv.numberScreened, inv.unitCost, inv.subtotal, inv.tax, inv.totalAmount, inv.outstandingBalance, inv.paymentStatus, inv.issuedDate, inv.dueDate]
      );

      // Seed payments for this invoice
      for (const p of inv.payments) {
        await pool.query(
          'INSERT INTO payments (id, invoice_id, amount, date, method, transaction_ref) VALUES ($1, $2, $3, $4, $5, $6)',
          [p.id, inv.id, p.amount, p.date, p.method, p.transactionRef]
        );
      }
    }

    // Seed Audit Logs
    console.log('Seeding audit logs...');
    for (const l of INITIAL_AUDIT_LOGS) {
      await pool.query(
        'INSERT INTO audit_logs (id, user_info, timestamp, action, record_affected, previous_value, new_value) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [l.id, l.user, l.timestamp, l.action, l.recordAffected, l.previousValue, l.newValue]
      );
    }

    // Seed Notifications
    console.log('Seeding notifications...');
    for (const n of INITIAL_NOTIFICATIONS) {
      await pool.query(
        'INSERT INTO notifications (id, type, title, message, timestamp, recipient, is_read) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [n.id, n.type, n.title, n.message, n.timestamp, n.recipient, n.isRead]
      );
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error during schema creation and seeding:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

async function main() {
  try {
    await ensureDatabaseExists();
    await initializeSchemaAndSeed();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during DB initialization:', err);
    process.exit(1);
  }
}

main();
