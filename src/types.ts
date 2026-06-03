/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'Super Administrator'
  | 'Administrator'
  | 'Registration Officer'
  | 'Laboratory Officer'
  | 'Doctor / Specialist'
  | 'Accounts Officer'
  | 'Corporate Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  assignedClientId?: string; // For Corporate Viewer role
  loginCount: number;
}

export interface CorporateClient {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  staffPopulation: number;
  contractStatus: 'Active' | 'Pending' | 'Expired' | 'Suspended';
  packageId: string;
  notes: string;
  isArchived: boolean;
}

export interface ScreeningCampaign {
  id: string;
  name: string;
  clientId: string;
  screeningDate: string;
  venue: string;
  assignedTeam: string;
  targetParticipantCount: number;
  status: 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled';
  notes: string;
}

export interface Participant {
  id: string; // Unique screening ID, e.g. "PSA-2026-001"
  employeeId: string;
  fullName: string;
  dob: string;
  age: number;
  phone: string;
  email: string;
  department: string;
  companyId: string; // Client ID
  campaignId: string;
  emergencyContact: string;
  consentConfirmed: boolean;
  registrationDate: string;
}

export interface PSATestCorrection {
  timestamp: string;
  modifiedBy: string;
  prevValue: number | null;
  newValue: number | null;
  reason: string;
}

export interface PSATest {
  id: string; // Test ID, e.g. "TST-501"
  participantId: string;
  sampleId: string; // e.g. "SMP-901"
  collectionDate: string;
  processingDate: string | null;
  laboratoryOfficer: string | null;
  psaValue: number | null;
  status: 'Pending Collection' | 'Sample Collected' | 'Processing' | 'Completed' | 'Rejected';
  remarks: string;
  classification: 'Pending' | 'Normal' | 'Borderline' | 'Elevated' | 'Requires Specialist Review';
  history: PSATestCorrection[];
}

export interface SpecialistReview {
  id: string;
  testId: string;
  participantId: string;
  specialistName: string;
  reviewDate: string;
  clinicalObservations: string;
  recommendations: string;
  requestRepeatTest: boolean;
  scheduleReferral: string; // e.g. "Urology Clinic @ PrimeCare Hospital" or "None"
  status: 'Pending Review' | 'Reviewed' | 'Follow-Up Required' | 'Referred' | 'Closed';
}

export interface BillingPackage {
  id: string;
  name: string;
  description: string;
  unitCost: number;
  taxRate: number; // e.g., 0.05 for 5%
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash';
  transactionRef: string;
}

export interface Invoice {
  id: string; // e.g., INV-2026-001
  clientId: string;
  campaignId: string;
  packageId: string;
  numberScreened: number;
  unitCost: number;
  subtotal: number;
  tax: number;
  totalAmount: number;
  outstandingBalance: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Fully Paid';
  issuedDate: string;
  dueDate: string;
  payments: PaymentRecord[];
}

export interface AuditLog {
  id: string;
  user: string; // "Full Name (Role)"
  timestamp: string;
  action: string;
  recordAffected: string;
  previousValue: string | null;
  newValue: string | null;
}

export interface Notification {
  id: string;
  type: 'In-App' | 'Email' | 'SMS';
  title: string;
  message: string;
  timestamp: string;
  recipient: string;
  isRead: boolean;
}
