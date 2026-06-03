/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  CorporateClient,
  ScreeningCampaign,
  Participant,
  PSATest,
  SpecialistReview,
  BillingPackage,
  Invoice,
  AuditLog,
  Notification
} from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@primecare.com',
    role: 'Super Administrator',
    isActive: true,
    loginCount: 42
  },
  {
    id: 'USR-002',
    name: 'Michael Carter',
    email: 'm.carter@primecare.com',
    role: 'Administrator',
    isActive: true,
    loginCount: 28
  },
  {
    id: 'USR-003',
    name: 'David Ortiz',
    email: 'd.ortiz@primecare.com',
    role: 'Registration Officer',
    isActive: true,
    loginCount: 89
  },
  {
    id: 'USR-004',
    name: 'Dr. Evelyn Foster',
    email: 'e.foster@primecare.com',
    role: 'Laboratory Officer',
    isActive: true,
    loginCount: 56
  },
  {
    id: 'USR-005',
    name: 'Dr. Robert Chen, MD',
    email: 'r.chen@primecare.com',
    role: 'Doctor / Specialist',
    isActive: true,
    loginCount: 31
  },
  {
    id: 'USR-006',
    name: 'Angela Vance',
    email: 'a.vance@primecare.com',
    role: 'Accounts Officer',
    isActive: true,
    loginCount: 19
  },
  {
    id: 'USR-007',
    name: 'Harvey Dent',
    email: 'h.dent@gothamcorp.com',
    role: 'Corporate Viewer',
    isActive: true,
    assignedClientId: 'CL-001', // Gotham Holdings
    loginCount: 5
  }
];

export const INITIAL_PACKAGES: BillingPackage[] = [
  {
    id: 'PKG-001',
    name: 'Standard PSA Screening',
    description: 'Basic Total PSA enzyme immunoassay (EIA) screening and validation.',
    unitCost: 45.0,
    taxRate: 0.05
  },
  {
    id: 'PKG-002',
    name: 'Comprehensive Prostate Health Outreach',
    description: 'Includes Total PSA, Free PSA Ratio, and personalized specialist recommendations.',
    unitCost: 75.0,
    taxRate: 0.05
  },
  {
    id: 'PKG-003',
    name: 'Premium Hospital Outpatient Package',
    description: 'PSA total testing plus advanced risk assessment, specialist reviews, and clinical priority referrals.',
    unitCost: 120.0,
    taxRate: 0.05
  }
];

export const INITIAL_CLIENTS: CorporateClient[] = [
  {
    id: 'CL-001',
    name: 'Gotham Holdings Inc.',
    industry: 'Financial Services',
    contactPerson: 'Bruce Wayne',
    phone: '+1 (555) 019-2834',
    email: 'bwayne@gothamholdings.com',
    address: '1007 Mountain Drive, Gotham City, NJ 07401',
    staffPopulation: 450,
    contractStatus: 'Active',
    packageId: 'PKG-002',
    notes: 'Renewed annually in November. Prefers on-site boardroom screening format.',
    isArchived: false
  },
  {
    id: 'CL-002',
    name: 'Pacific Maritime Logistics',
    industry: 'Logistics and Shipping',
    contactPerson: 'Captain John Sterling',
    phone: '+1 (555) 021-4958',
    email: 'j.sterling@pacmaritime.com',
    address: 'Pier 54, Maritime Boulevard, Seattle, WA 98101',
    staffPopulation: 1200,
    contractStatus: 'Active',
    packageId: 'PKG-001',
    notes: 'Large industrial workforce. Requires multiple shift campaigns (day and graveyard shifts).',
    isArchived: false
  },
  {
    id: 'CL-003',
    name: 'BioGen Research Labs',
    industry: 'Biotechnology',
    contactPerson: 'Dr. Rebecca Mercer',
    phone: '+1 (555) 034-1188',
    email: 'rmercer@biogenlabs.internal',
    address: '888 Helix Way, South San Francisco, CA 94080',
    staffPopulation: 340,
    contractStatus: 'Pending',
    packageId: 'PKG-003',
    notes: 'Contract draft finalized. Eagerly waiting for initial campaign setup in Q3.',
    isArchived: false
  },
  {
    id: 'CL-004',
    name: 'Apex Manufacturing',
    industry: 'Heavy Industry',
    contactPerson: 'Marcus Brody',
    phone: '+1 (555) 045-8833',
    email: 'm.brody@apexind.com',
    address: '12 Industrial Parkway, Detroit, MI 48201',
    staffPopulation: 850,
    contractStatus: 'Suspended',
    packageId: 'PKG-001',
    notes: 'Suspended due to internal corporate restructuring. Re-evaluate partnership in 2027.',
    isArchived: false
  },
  {
    id: 'CL-005',
    name: 'Nouveau Tech Consulting',
    industry: 'Technology Services',
    contactPerson: 'Clara Oswald',
    phone: '+1 (555) 012-7473',
    email: 'coswald@nouveau.tech',
    address: '404 Cloud Street, Suite 900, Austin, TX 78701',
    staffPopulation: 250,
    contractStatus: 'Expired',
    packageId: 'PKG-002',
    notes: 'Onboarded in 2024. Screening campaign successfully wrapped up in April 2025. Contract needs renewal.',
    isArchived: true
  }
];

export const INITIAL_CAMPAIGNS: ScreeningCampaign[] = [
  {
    id: 'CMP-101',
    name: 'Gotham Spring 2026 Screening',
    clientId: 'CL-001',
    screeningDate: '2026-04-15',
    venue: 'Gotham HQ Executive Wing Clinic',
    assignedTeam: 'Outreach Team A (Specialists Foster & Carter)',
    targetParticipantCount: 60,
    status: 'Completed',
    notes: 'Excellent turnout. Minimal delays, streamlined check-in process.'
  },
  {
    id: 'CMP-102',
    name: 'Pacific Maritime Fleet Outreach 1',
    clientId: 'CL-002',
    screeningDate: '2026-06-12',
    venue: 'Seattle Port Terminal 3 Medical Room',
    assignedTeam: 'Outreach Team B (Specialist Jenkins & Lab Officer Foster)',
    targetParticipantCount: 150,
    status: 'In-Progress',
    notes: 'Currently enrolling and collecting samples. Day shifts scheduled this week.'
  },
  {
    id: 'CMP-103',
    name: 'Pacific Maritime Fleet Outreach 2',
    clientId: 'CL-002',
    screeningDate: '2026-08-20',
    venue: 'Tacoma Pier 5 Staff Lounge',
    assignedTeam: 'Outreach Team B (Specialist Jenkins)',
    targetParticipantCount: 100,
    status: 'Scheduled',
    notes: 'Arrangement pending confirmation from the local labor union representative.'
  }
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'PRT-201',
    employeeId: 'GH-3392',
    fullName: 'Alfred Pennyworth',
    dob: '1961-09-12',
    age: 64,
    phone: '+1 (555) 123-5656',
    email: 'apennyworth@gothamholdings.com',
    department: 'Executive Administration',
    companyId: 'CL-001',
    campaignId: 'CMP-101',
    emergencyContact: 'Bruce Wayne (+1-555-019-2834)',
    consentConfirmed: true,
    registrationDate: '2026-04-15'
  },
  {
    id: 'PRT-202',
    employeeId: 'GH-0941',
    fullName: 'Lucius Fox',
    dob: '1963-04-03',
    age: 63,
    phone: '+1 (555) 123-9090',
    email: 'lfox@gothamholdings.com',
    department: 'Applied Sciences',
    companyId: 'CL-001',
    campaignId: 'CMP-101',
    emergencyContact: 'Tanya Fox (+1-555-883-9921)',
    consentConfirmed: true,
    registrationDate: '2026-04-15'
  },
  {
    id: 'PRT-203',
    employeeId: 'GH-8812',
    fullName: 'Thomas Elliot',
    dob: '1970-11-20',
    age: 55,
    phone: '+1 (555) 746-3829',
    email: 'telliot@gothamholdings.com',
    department: 'Clinical Consulting',
    companyId: 'CL-001',
    campaignId: 'CMP-101',
    emergencyContact: 'Marsha Elliot (+1-555-123-8472)',
    consentConfirmed: true,
    registrationDate: '2026-04-15'
  },
  {
    id: 'PRT-204',
    employeeId: 'PM-4491',
    fullName: 'Gary Abernathy',
    dob: '1968-02-14',
    age: 58,
    phone: '+1 (555) 301-9281',
    email: 'g.abernathy@pacmaritime.com',
    department: 'Port Logistics',
    companyId: 'CL-002',
    campaignId: 'CMP-102',
    emergencyContact: 'Sylvia Abernathy (+1-555-301-9289)',
    consentConfirmed: true,
    registrationDate: '2026-06-01'
  },
  {
    id: 'PRT-205',
    employeeId: 'PM-1029',
    fullName: 'Alistair Vance',
    dob: '1959-05-30',
    age: 67,
    phone: '+1 (555) 441-2093',
    email: 'a.vance@pacmaritime.com',
    department: 'Maritime Deck Ops',
    companyId: 'CL-002',
    campaignId: 'CMP-102',
    emergencyContact: 'Gregory Vance (+1-555-441-2000)',
    consentConfirmed: true,
    registrationDate: '2026-06-02'
  },
  {
    id: 'PRT-206',
    employeeId: 'PM-9944',
    fullName: 'Ronald McDonald',
    dob: '1974-08-01',
    age: 51,
    phone: '+1 (555) 939-2049',
    email: 'r.mcdonald@pacmaritime.com',
    department: 'Vessel Maintenance',
    companyId: 'CL-002',
    campaignId: 'CMP-102',
    emergencyContact: 'Jane McDonald (+1-555-939-2000)',
    consentConfirmed: true,
    registrationDate: '2026-06-03'
  }
];

export const INITIAL_TESTS: PSATest[] = [
  {
    id: 'TST-801',
    participantId: 'PRT-201',
    sampleId: 'SMP-3011',
    collectionDate: '2026-04-15',
    processingDate: '2026-04-16',
    laboratoryOfficer: 'Dr. Evelyn Foster',
    psaValue: 1.5,
    status: 'Completed',
    remarks: 'Sample clear. Standard assay profile.',
    classification: 'Normal',
    history: []
  },
  {
    id: 'TST-802',
    participantId: 'PRT-202',
    sampleId: 'SMP-3012',
    collectionDate: '2026-04-15',
    processingDate: '2026-04-16',
    laboratoryOfficer: 'Dr. Evelyn Foster',
    psaValue: 5.6,
    status: 'Completed',
    remarks: 'Borderline elevated value. Verified via duplicate assay calibration.',
    classification: 'Borderline',
    history: []
  },
  {
    id: 'TST-803',
    participantId: 'PRT-203',
    sampleId: 'SMP-3013',
    collectionDate: '2026-04-15',
    processingDate: '2026-04-16',
    laboratoryOfficer: 'Dr. Evelyn Foster',
    psaValue: 12.4,
    status: 'Completed',
    remarks: 'Significant elevation confirmed. Flagged instantly for expert clinical assessment.',
    classification: 'Elevated',
    history: []
  },
  {
    id: 'TST-804',
    participantId: 'PRT-204',
    sampleId: 'SMP-5022',
    collectionDate: '2026-06-01',
    processingDate: '2026-06-02',
    laboratoryOfficer: 'Dr. Evelyn Foster',
    psaValue: 2.1,
    status: 'Completed',
    remarks: 'Tested with normal metrics. Validated.',
    classification: 'Normal',
    history: []
  },
  {
    id: 'TST-805',
    participantId: 'PRT-205',
    sampleId: 'SMP-5023',
    collectionDate: '2026-06-02',
    processingDate: null,
    laboratoryOfficer: null,
    psaValue: null,
    status: 'Sample Collected',
    remarks: 'Sample stored in cold chain. Transported to Lab A.',
    classification: 'Pending',
    history: []
  },
  {
    id: 'TST-806',
    participantId: 'PRT-206',
    sampleId: 'SMP-5024',
    collectionDate: '2026-06-03',
    processingDate: null,
    laboratoryOfficer: null,
    psaValue: null,
    status: 'Pending Collection',
    remarks: 'Queued for outreach drawing.',
    classification: 'Pending',
    history: []
  }
];

export const INITIAL_REVIEWS: SpecialistReview[] = [
  {
    id: 'REV-901',
    testId: 'TST-803',
    participantId: 'PRT-203',
    specialistName: 'Dr. Robert Chen, MD',
    reviewDate: '2026-04-17',
    clinicalObservations: 'Patient has a history of mild urinary hesitance. PSA of 12.4 ng/mL is significantly elevated above age nominal baseline (which is normally < 4.0). Recommended formal multi-parametric MRI and prostate examination.',
    recommendations: 'Urology referral for biopsy consideration. Avoid strenuous physical activity and repeat blood draw in 4 weeks to observe velocity trend.',
    requestRepeatTest: true,
    scheduleReferral: 'PrimeCare Urology and Specialty Diagnostic Center',
    status: 'Follow-Up Required'
  },
  {
    id: 'REV-902',
    testId: 'TST-802',
    participantId: 'PRT-202',
    specialistName: 'Dr. Robert Chen, MD',
    reviewDate: '2026-04-18',
    clinicalObservations: 'PSA is 5.6 ng/mL, indicative of a borderline condition which may represent mild benign prostatic hyperplasia (BPH) or subclinical prostatitis.',
    recommendations: 'Annual prostate health screening follow up, lifestyle modification, and clinical monitoring of voiding habits.',
    requestRepeatTest: false,
    scheduleReferral: 'None',
    status: 'Reviewed'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-001',
    clientId: 'CL-001',
    campaignId: 'CMP-101',
    packageId: 'PKG-002',
    numberScreened: 3, // based on Gotham spring participants
    unitCost: 75.0,
    subtotal: 225.0,
    tax: 11.25,
    totalAmount: 236.25,
    outstandingBalance: 0.0,
    paymentStatus: 'Fully Paid',
    issuedDate: '2026-04-20',
    dueDate: '2026-05-20',
    payments: [
      {
        id: 'PMT-1001',
        amount: 236.25,
        date: '2026-04-28',
        method: 'Bank Transfer',
        transactionRef: 'BT_GOTHAM_883011'
      }
    ]
  },
  {
    id: 'INV-2026-002',
    clientId: 'CL-002',
    campaignId: 'CMP-102',
    packageId: 'PKG-001',
    numberScreened: 3,
    unitCost: 45.0,
    subtotal: 135.0,
    tax: 6.75,
    totalAmount: 141.75,
    outstandingBalance: 141.75,
    paymentStatus: 'Unpaid',
    issuedDate: '2026-06-03',
    dueDate: '2026-07-03',
    payments: []
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-001',
    user: 'Sarah Jenkins (Super Administrator)',
    timestamp: '2026-06-03T10:00:00Z',
    action: 'USER_LOGIN',
    recordAffected: 'User USR-001',
    previousValue: null,
    newValue: 'Successful login IP 192.168.1.15'
  },
  {
    id: 'LOG-002',
    user: 'Dr. Evelyn Foster (Laboratory Officer)',
    timestamp: '2026-06-03T11:15:00Z',
    action: 'LAB_RESULT_UPLOAD',
    recordAffected: 'PSATest TST-804',
    previousValue: 'psaValue: null',
    newValue: 'psaValue: 2.1, classification: Normal'
  },
  {
    id: 'LOG-003',
    user: 'David Ortiz (Registration Officer)',
    timestamp: '2026-06-03T13:42:00Z',
    action: 'PARTICIPANT_REGISTERED',
    recordAffected: 'Participant PRT-206',
    previousValue: null,
    newValue: 'Registered Ronald McDonald for Campaign CMP-102'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'NTF-001',
    type: 'In-App',
    title: 'New Flagged Results',
    message: 'High PSA levels detected for Participant Reference PRT-203. Specialist review is required.',
    timestamp: '2026-04-16T17:00:00Z',
    recipient: 'Doctors/Specialists',
    isRead: false
  },
  {
    id: 'NTF-002',
    type: 'In-App',
    title: 'Campaign Complete',
    message: 'Campaign Gotham Spring 2026 Screening has been marked as Completed. Ready for corporate invoice preparation.',
    timestamp: '2026-04-16T18:30:00Z',
    recipient: 'Accounts Officer',
    isRead: false
  },
  {
    id: 'NTF-003',
    type: 'In-App',
    title: 'Upcoming Campaign Alert',
    message: 'Campaign Pacific Maritime Fleet Outreach 1 is in-progress. Ensure lab supplies are allocated.',
    timestamp: '2026-06-02T08:00:00Z',
    recipient: 'Laboratory Officer',
    isRead: false
  }
];

export function getInitialDatabase() {
  const stored = localStorage.getItem('primecare_psa_db');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading localStorage, reverting to defaults", e);
    }
  }

  const db = {
    users: INITIAL_USERS,
    packages: INITIAL_PACKAGES,
    clients: INITIAL_CLIENTS,
    campaigns: INITIAL_CAMPAIGNS,
    participants: INITIAL_PARTICIPANTS,
    tests: INITIAL_TESTS,
    reviews: INITIAL_REVIEWS,
    invoices: INITIAL_INVOICES,
    auditLogs: INITIAL_AUDIT_LOGS,
    notifications: INITIAL_NOTIFICATIONS
  };

  localStorage.setItem('primecare_psa_db', JSON.stringify(db));
  return db;
}

export function saveDatabase(db: any) {
  localStorage.setItem('primecare_psa_db', JSON.stringify(db));
}
