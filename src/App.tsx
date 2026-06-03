/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  Briefcase,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  ClipboardList,
  Settings,
  History,
  ShieldCheck,
  Bell,
  LogOut,
  Sparkles,
  Search,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
  FlaskConical,
  User,
  Key,
  Database,
  Lock
} from 'lucide-react';

import {
  UserRole,
  User as SystemUser,
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

import { getInitialDatabase, saveDatabase } from './mockData';

// Modular child views
import DashboardAnalytics from './components/DashboardAnalytics';
import ClientManagement from './components/ClientManagement';
import CampaignManagement from './components/CampaignManagement';
import ParticipantRegistration from './components/ParticipantRegistration';
import LaboratoryQueue from './components/LaboratoryQueue';
import ClinicalReview from './components/ClinicalReview';
import BillingManagement from './components/BillingManagement';
import ReportingSuite from './components/ReportingSuite';

// Role access metadata mapping
const ROLE_PERMISSIONS: Record<UserRole, {
  canManageClients: boolean;
  canManageCampaigns: boolean;
  canRegisterParticipants: boolean;
  canEnterLabResults: boolean;
  canPerformClinicalReview: boolean;
  canManageBilling: boolean;
  canViewReportsSpecial: boolean;
  canViewReportsCorporate: boolean;
  canViewAuditLogs: boolean;
  canManageUsers: boolean;
}> = {
  'Super Administrator': {
    canManageClients: true,
    canManageCampaigns: true,
    canRegisterParticipants: true,
    canEnterLabResults: true,
    canPerformClinicalReview: true,
    canManageBilling: true,
    canViewReportsSpecial: true,
    canViewReportsCorporate: true,
    canViewAuditLogs: true,
    canManageUsers: true
  },
  'Administrator': {
    canManageClients: true,
    canManageCampaigns: true,
    canRegisterParticipants: true,
    canEnterLabResults: false,
    canPerformClinicalReview: false,
    canManageBilling: true,
    canViewReportsSpecial: true,
    canViewReportsCorporate: true,
    canViewAuditLogs: true,
    canManageUsers: false
  },
  'Registration Officer': {
    canManageClients: false,
    canManageCampaigns: false,
    canRegisterParticipants: true,
    canEnterLabResults: false,
    canPerformClinicalReview: false,
    canManageBilling: false,
    canViewReportsSpecial: false,
    canViewReportsCorporate: false,
    canViewAuditLogs: false,
    canManageUsers: false
  },
  'Laboratory Officer': {
    canManageClients: false,
    canManageCampaigns: false,
    canRegisterParticipants: false,
    canEnterLabResults: true,
    canPerformClinicalReview: false,
    canManageBilling: false,
    canViewReportsSpecial: false,
    canViewReportsCorporate: false,
    canViewAuditLogs: false,
    canManageUsers: false
  },
  'Doctor / Specialist': {
    canManageClients: false,
    canManageCampaigns: false,
    canRegisterParticipants: false,
    canEnterLabResults: false,
    canPerformClinicalReview: true,
    canManageBilling: false,
    canViewReportsSpecial: true,
    canViewReportsCorporate: true,
    canViewAuditLogs: false,
    canManageUsers: false
  },
  'Accounts Officer': {
    canManageClients: true,
    canManageCampaigns: false,
    canRegisterParticipants: false,
    canEnterLabResults: false,
    canPerformClinicalReview: false,
    canManageBilling: true,
    canViewReportsSpecial: false,
    canViewReportsCorporate: true,
    canViewAuditLogs: false,
    canManageUsers: false
  },
  'Corporate Viewer': {
    canManageClients: false,
    canManageCampaigns: false,
    canRegisterParticipants: false,
    canEnterLabResults: false,
    canPerformClinicalReview: false,
    canManageBilling: false,
    canViewReportsSpecial: false,
    canViewReportsCorporate: true,
    canViewAuditLogs: false,
    canManageUsers: false
  }
};

export default function App() {
  // Master local database states
  const [db, setDb] = useState(() => getInitialDatabase());
  
  // Current session configurations
  const [currentUser, setCurrentUser] = useState<SystemUser>(db.users[0]); // default Super Admin
  const [sessionToken, setSessionToken] = useState<string>('PC-AUTH-SESSION-TOKEN-883011');
  const [activeTab, setActiveTab ] = useState<string>('dashboard');
  const [notificationsPopover, setNotificationsPopover] = useState(false);

  // Authentication & Access Control States (Module 1)
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);
  const [isAccountLocked, setIsAccountLocked] = useState(false);

  // Sync state mutations to local storage whenever DB changes
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  // General Notification Triggering Helper (Module 12)
  const triggerSystemNotification = (title: string, message: string, recipient: string) => {
    const newNotif: Notification = {
      id: `NTF-${Date.now()}`,
      type: 'In-App',
      title,
      message,
      timestamp: new Date().toISOString(),
      recipient,
      isRead: false
    };

    setDb(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications]
    }));
  };

  // Compliance Auditing Helper (Module 11)
  const addAuditEntry = (action: string, recordAffected: string, previousValue: string | null, newValue: string | null) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      user: `${currentUser.name} (${currentUser.role})`,
      timestamp: new Date().toISOString(),
      action,
      recordAffected,
      previousValue,
      newValue
    };

    setDb(prev => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs]
    }));
  };

  // Module 1 Simulated password verification / Lockout
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAccountLocked) {
      alert('Security lock-out active. Too many failed password entries. Contact the PrimeCare Super Administrator.');
      return;
    }

    const matchedUser = db.users.find(u => u.email === loginEmail);
    if (!matchedUser || loginPassword !== 'password') {
      const attempts = failedLoginAttempts + 1;
      setFailedLoginAttempts(attempts);
      
      const auditLogMsg = `Failed login attempt with email: ${loginEmail}`;
      // Add failed attempt log
      const newLogVal: AuditLog = {
        id: `LOG-FAIL-${Date.now()}`,
        user: 'Anonymous (Guest)',
        timestamp: new Date().toISOString(),
        action: 'FAILED_LOGIN_ATTEMPT',
        recordAffected: `Email ${loginEmail}`,
        previousValue: null,
        newValue: `Password attempt count: ${attempts}`
      };

      setDb(prev => ({
        ...prev,
        auditLogs: [newLogVal, ...prev.auditLogs]
      }));

      if (attempts >= 4) {
        setIsAccountLocked(true);
        alert('Security Account Locked: 4 failed password attempts. Account locked to prevent clinical database breaches.');
      } else {
        alert(`Authentication Error: Credential mismatch. You have ${4 - attempts} attempts remaining.`);
      }
      return;
    }

    if (!matchedUser.isActive) {
      alert('Authentication Restricted: This staff credential has been flagged as Deactivated. See Clinical Operations supervisor.');
      return;
    }

    // Success Authentication
    setCurrentUser(matchedUser);
    setFailedLoginAttempts(0);
    setIsLoggedOut(false);
    setActiveTab('dashboard');
    
    // Log success entry
    const newLogVal: AuditLog = {
      id: `LOG-SUC-${Date.now()}`,
      user: `${matchedUser.name} (${matchedUser.role})`,
      timestamp: new Date().toISOString(),
      action: 'SUCCESSFUL_LOGIN',
      recordAffected: `User Account ${matchedUser.id}`,
      previousValue: null,
      newValue: `Login session authenticated successfully`
    };

    setDb(prev => ({
      ...prev,
      auditLogs: [newLogVal, ...prev.auditLogs]
    }));
  };

  const handleLogout = () => {
    setIsLoggedOut(true);
    addAuditEntry('USER_LOGOUT', `User ${currentUser.id}`, 'Session active', 'Logged out');
  };

  // Module 2 Clients callbacks
  const handleAddClient = (newClient: Omit<CorporateClient, 'id' | 'isArchived'>) => {
    const clId = `CL-${Math.floor(100 + Math.random() * 900)}`;
    const fullClient: CorporateClient = {
      ...newClient,
      id: clId,
      isArchived: false
    };

    setDb(prev => ({
      ...prev,
      clients: [fullClient, ...prev.clients]
    }));

    addAuditEntry('CLIENT_ONBOARDED', `Client ${clId}`, null, `Onboarded ${newClient.name}`);
    triggerSystemNotification('New Client Onboarded', `Corporate client ${newClient.name} successfully created.`, 'Super Administrator');
  };

  const handleEditClient = (updated: CorporateClient) => {
    const prev = db.clients.find(c => c.id === updated.id);
    setDb(prevDb => ({
      ...prevDb,
      clients: prevDb.clients.map(c => c.id === updated.id ? updated : c)
    }));

    addAuditEntry(
      'CLIENT_UPDATED',
      `Client ${updated.id}`,
      JSON.stringify(prev),
      JSON.stringify(updated)
    );
  };

  const handleArchiveClient = (id: string) => {
    const prev = db.clients.find(c => c.id === id);
    setDb(prevDb => ({
      ...prevDb,
      clients: prevDb.clients.map(c => c.id === id ? { ...c, isArchived: true } : c)
    }));

    addAuditEntry('CLIENT_ARCHIVED', `Client ${id}`, prev?.isArchived ? 'Archived' : 'Active', 'Archived');
  };

  const handleRestoreClient = (id: string) => {
    const prev = db.clients.find(c => c.id === id);
    setDb(prevDb => ({
      ...prevDb,
      clients: prevDb.clients.map(c => c.id === id ? { ...c, isArchived: false } : c)
    }));

    addAuditEntry('CLIENT_RESTORED', `Client ${id}`, prev?.isArchived ? 'Archived' : 'Active', 'Active');
  };

  // Module 3 Campaigns callbacks
  const handleAddCampaign = (newC: Omit<ScreeningCampaign, 'id'>) => {
    const campId = `CMP-${Math.floor(200 + Math.random() * 800)}`;
    const fullCampaign: ScreeningCampaign = {
      ...newC,
      id: campId
    };

    setDb(prev => ({
      ...prev,
      campaigns: [...prev.campaigns, fullCampaign]
    }));

    addAuditEntry('CAMPAIGN_SCHEDULED', `Campaign ${campId}`, null, `Created campaign ${newC.name}`);
    triggerSystemNotification('New Outreach Campaign Scheduled', `Campaign ${newC.name} is scheduled on ${newC.screeningDate}.`, 'Registration Officer');
  };

  const handleEditCampaign = (updated: ScreeningCampaign) => {
    const prev = db.campaigns.find(c => c.id === updated.id);
    setDb(prevDb => ({
      ...prevDb,
      campaigns: prevDb.campaigns.map(c => c.id === updated.id ? updated : c)
    }));

    addAuditEntry(
      'CAMPAIGN_MODIFIED',
      `Campaign ${updated.id}`,
      JSON.stringify(prev),
      JSON.stringify(updated)
    );

    // If campaign has been updated to completed, trigger automated invoices preparation alert
    if (prev?.status !== 'Completed' && updated.status === 'Completed') {
      triggerSystemNotification('Screening Campaign Completed', `Campaign ${updated.name} completed. Outpatient billings ready for accounts officer.`, 'Accounts Officer');
    }
  };

  // Module 4 Participant callbacks
  const handleRegisterParticipant = (newP: Omit<Participant, 'id' | 'registrationDate' | 'age'>) => {
    const pId = `PRT-${Math.floor(300 + Math.random() * 700)}`;
    const birthVal = new Date(newP.dob);
    const age = new Date('2026-06-03').getFullYear() - birthVal.getFullYear();

    const fullParticipant: Participant = {
      ...newP,
      id: pId,
      age,
      registrationDate: new Date().toISOString().split('T')[0]
    };

    // Automated associated PSA Test Collection queue trigger (Module 5)
    const testId = `TST-${Math.floor(6000 + Math.random() * 3000)}`;
    const assocTest: PSATest = {
      id: testId,
      participantId: pId,
      sampleId: `SMP-${Math.floor(1000 + Math.random() * 9000)}`,
      collectionDate: new Date().toISOString().split('T')[0],
      processingDate: null,
      laboratoryOfficer: null,
      psaValue: null,
      status: 'Sample Collected',
      remarks: 'Registered. Diagnostic vial dispatched.',
      classification: 'Pending',
      history: []
    };

    setDb(prev => ({
      ...prev,
      participants: [...prev.participants, fullParticipant],
      tests: [assocTest, ...prev.tests]
    }));

    addAuditEntry('PARTICIPANT_REGISTERED', `Participant ${pId}`, null, `Registered ${newP.fullName} & generated test queue.`);
  };

  const handleEditParticipant = (updated: Participant) => {
    setDb(prevDb => ({
      ...prevDb,
      participants: prevDb.participants.map(p => p.id === updated.id ? updated : p)
    }));

    addAuditEntry('PARTICIPANT_DEMOGRAPHICS_CORRECTED', `Participant ${updated.id}`, null, `Amended registration metrics for ${updated.fullName}`);
  };

  // Module 5 & 6 PSA Lab Analytes callbacks
  const handleUploadResult = (testId: string, value: number, remark: string) => {
    // Classification rules of corporate workflow
    let classification: PSATest['classification'] = 'Normal';
    if (value >= 4.0 && value < 10.0) {
      classification = 'Borderline';
    } else if (value >= 10.0) {
      classification = 'Elevated';
    }

    setDb(prevDb => ({
      ...prevDb,
      tests: prevDb.tests.map(t => {
        if (t.id === testId) {
          return {
            ...t,
            psaValue: value,
            remarks: remark,
            processingDate: new Date().toISOString().split('T')[0],
            laboratoryOfficer: currentUser.name,
            status: 'Completed',
            classification
          };
        }
        return t;
      })
    }));

    addAuditEntry('TEST_RESULT_UPLOADED', `PSATest ${testId}`, 'psaValue: null', `psaValue: ${value}, classification: ${classification}`);

    // If result is borderline or elevated, trigger specialized doctors diagnostic review flags (Module 12)
    if (classification !== 'Normal') {
      triggerSystemNotification(
        'Elevated PSA Detection',
        `PSA value of ${value} ng/mL registered for sample ${testId}. Specialist urologist assessment recommended.`,
        'Doctor / Specialist'
      );
    }
  };

  const handleModifyResultWithHistory = (testId: string, newValue: number, reason: string) => {
    const prevTest = db.tests.find(t => t.id === testId);
    if (!prevTest) return;

    let classification: PSATest['classification'] = 'Normal';
    if (newValue >= 4.0 && newValue < 10.0) {
      classification = 'Borderline';
    } else if (newValue >= 10.0) {
      classification = 'Elevated';
    }

    // Capture historic override corrections strictly (medical records MUST never be deleted or destroyed)
    const correctionLog = {
      timestamp: new Date().toISOString(),
      modifiedBy: `${currentUser.name} (${currentUser.role})`,
      prevValue: prevTest.psaValue,
      newValue,
      reason
    };

    setDb(prevDb => ({
      ...prevDb,
      tests: prevDb.tests.map(t => {
        if (t.id === testId) {
          return {
            ...t,
            psaValue: newValue,
            classification,
            processingDate: new Date().toISOString().split('T')[0],
            laboratoryOfficer: currentUser.name,
            remarks: `Corrected assay. Reason: ${reason}`,
            history: [correctionLog, ...t.history]
          };
        }
        return t;
      })
    }));

    addAuditEntry(
      'TEST_RESULT_CORRECTED',
      `PSATest ${testId}`,
      `psaValue: ${prevTest.psaValue}`,
      `psaValue: ${newValue}, correction reason logged`
    );

    if (classification !== 'Normal') {
      triggerSystemNotification(
        'Corrected Elevated PSA Value',
        `Assay override: corrected PSA to ${newValue} ng/mL for sample ${testId}. Diagnostic review modified.`,
        'Doctor / Specialist'
      );
    }
  };

  // Module 7 Doctor assessment reviews
  const handleAddReview = (newRev: Omit<SpecialistReview, 'id' | 'reviewDate' | 'specialistName'>) => {
    const revId = `REV-${Math.floor(1000 + Math.random() * 8000)}`;
    const finalReview: SpecialistReview = {
      ...newRev,
      id: revId,
      reviewDate: new Date().toISOString().split('T')[0],
      specialistName: currentUser.name
    };

    // Upsert specialist observations
    setDb(prev => {
      const exists = prev.reviews.some(r => r.testId === newRev.testId);
      const updatedReviews = exists
        ? prev.reviews.map(r => r.testId === newRev.testId ? finalReview : r)
        : [...prev.reviews, finalReview];

      return {
        ...prev,
        reviews: updatedReviews
      };
    });

    addAuditEntry('CLINICAL_DIAGNOSIS_COMMITTED', `SpecialistReview ${revId}`, null, `Physician diagnosis logs recorded for sample ${newRev.testId}`);
    
    // If outpatient referral clinic was scheduled, push compliance reminder to alerts feed
    if (newRev.scheduleReferral !== 'None') {
      triggerSystemNotification('Urology Referral Dispatched', `Patient reference ${newRev.participantId} referred to ${newRev.scheduleReferral}.`, 'Super Administrator');
    }
  };

  // Module 8 Billings & Invoicing callbacks
  const handleGenerateInvoice = (newInv: Omit<Invoice, 'id' | 'issuedDate' | 'payments' | 'outstandingBalance' | 'paymentStatus' | 'subtotal' | 'tax' | 'totalAmount'>) => {
    const invId = `INV-2026-${Math.floor(100 + Math.random() * 800)}`;
    const subtotal = newInv.numberScreened * newInv.unitCost;
    const tax = subtotal * 0.05; // 5% flat output tax
    const totalAmount = subtotal + tax;

    const fullInvoice: Invoice = {
      ...newInv,
      id: invId,
      subtotal,
      tax,
      totalAmount,
      outstandingBalance: totalAmount,
      paymentStatus: 'Unpaid',
      issuedDate: new Date().toISOString().split('T')[0],
      payments: []
    };

    setDb(prev => ({
      ...prev,
      invoices: [fullInvoice, ...prev.invoices]
    }));

    addAuditEntry('INVOICE_ISSUED', `Invoice ${invId}`, null, `Issued invoice of $${totalAmount.toFixed(2)} to client ${newInv.clientId}`);
  };

  const handleRecordPayment = (invId: string, amount: number, method: 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash', ref: string) => {
    const prevInv = db.invoices.find(i => i.id === invId);
    if (!prevInv) return;

    const remaining = prevInv.outstandingBalance - amount;
    const status: Invoice['paymentStatus'] = remaining <= 0 ? 'Fully Paid' : 'Partially Paid';

    const newPaymentRecord = {
      id: `PMT-${Date.now()}`,
      amount,
      date: new Date().toISOString().split('T')[0],
      method,
      transactionRef: ref
    };

    setDb(prevDb => ({
      ...prevDb,
      invoices: prevDb.invoices.map(i => {
        if (i.id === invId) {
          return {
            ...i,
            outstandingBalance: remaining,
            paymentStatus: status,
            payments: [...i.payments, newPaymentRecord]
          };
        }
        return i;
      })
    }));

    addAuditEntry(
      'INVOICE_PAYMENT_SETTLED',
      `Invoice ${invId}`,
      `outstandingBalance: ${prevInv.outstandingBalance}`,
      `Recorded payment of $${amount.toFixed(2)} via ${method}, outstanding: $${remaining.toFixed(2)}`
    );
  };

  // Module 1 User states modifications (Super Admin Settings Control)
  const handleToggleUserStatus = (uId: string) => {
    const target = db.users.find(u => u.id === uId);
    if (!target) return;

    setDb(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === uId ? { ...u, isActive: !u.isActive } : u)
    }));

    addAuditEntry(
      'USER_CREDENTIALS_TOGGLED',
      `User ${uId}`,
      `isActive: ${target.isActive}`,
      `isActive: ${!target.isActive}`
    );
  };

  const handleRoleChange = (uId: string, newRole: UserRole) => {
    const target = db.users.find(u => u.id === uId);
    if (!target) return;

    setDb(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === uId ? { ...u, role: newRole } : u)
    }));

    addAuditEntry(
      'USER_ROLE_REALLOCATED',
      `User ${uId}`,
      `role: ${target.role}`,
      `role: ${newRole}`
    );
  };

  // Role permissions checking helper
  const perm = ROLE_PERMISSIONS[currentUser.role];

  // System statistics derived
  const unreadNotifCount = db.notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-800" id="primecare-app-root">
      
      {/* 🛡️ Simulated Active Role Credentials Switcher Banner */}
      <div className="bg-blue-50/70 border-b border-blue-100 py-2.5 px-6 flex flex-col md:flex-row items-center justify-between text-xs gap-3 font-sans">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 select-none animate-pulse" />
          <span className="text-blue-950 font-sans">
            <strong className="font-semibold text-blue-900">Simulated Authority Swapper:</strong> Interactively toggle active roles to audit medical workflows.
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-slate-500 font-sans font-medium text-xs">Active Session:</span>
          <select
            value={currentUser.role}
            onChange={(e) => {
              const matched = db.users.find(u => u.role === e.target.value);
              if (matched) {
                setCurrentUser(matched);
                // Also trigger login audit trace
                const dummyLog: AuditLog = {
                  id: `LOG-SWAP-${Date.now()}`,
                  user: `${matched.name} (${matched.role})`,
                  timestamp: new Date().toISOString(),
                  action: 'SESSION_ROLE_SWAPPED',
                  recordAffected: `Active session`,
                  previousValue: null,
                  newValue: `Swapped role authorization to ${matched.role}`
                };
                setDb(prev => ({ ...prev, auditLogs: [dummyLog, ...prev.auditLogs] }));
                // Automatically switch tabs if permissions are restricted for new role
                if (matched.role === 'Corporate Viewer') {
                  setActiveTab('reports');
                } else if (matched.role === 'Laboratory Officer') {
                  setActiveTab('laboratory');
                } else if (matched.role === 'Doctor / Specialist') {
                  setActiveTab('clinical');
                } else if (matched.role === 'Registration Officer') {
                  setActiveTab('participants');
                } else {
                  setActiveTab('dashboard');
                }
              }
            }}
            className="bg-white text-slate-700 py-1 px-3 rounded-lg border border-slate-200 font-sans cursor-pointer text-xs font-semibold hover:bg-slate-50 transition shadow-2xs"
          >
            {db.users.map(u => (
              <option key={u.id} value={u.role}>{u.name} — ({u.role})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Layout */}
      {isLoggedOut ? (
        /* Module 1: Login Form Layout */
        <div className="flex-1 flex items-center justify-center p-6 min-h-[85vh]">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-8 w-full max-w-md space-y-6 font-sans">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none font-display">US PrimeCare Portal</h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest block uppercase font-semibold">MED-RESPONSIBLE IMMUNODIAGNOSTICS</span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5 font-sans">
                <label className="text-xs font-medium text-slate-500">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah.jenkins@primecare.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-hidden transition duration-150"
                />
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-xs font-medium text-slate-500">Access Password (Enter: "password")</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-hidden transition duration-150 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isAccountLocked}
                className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition duration-150 ${
                  isAccountLocked ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }`}
              >
                {isAccountLocked ? 'Account Security Locked' : 'Secure Authorization Login'}
              </button>
            </form>

            <div className="p-3.5 bg-slate-550/5 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed font-sans space-y-1">
              <span className="font-semibold uppercase tracking-wider block text-[9px] text-slate-400">Simulated Safe-Auth credentials:</span>
              <p>• Sarah Jenkins email: <strong className="font-mono text-slate-700">sarah.jenkins@primecare.com</strong></p>
              <p>• Password: <strong className="font-mono text-slate-700">password</strong></p>
              <p className="text-slate-400 text-[10px] pt-1">Select other profiles using the authority swapper bar at the top.</p>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Frame */
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* LEFT COMPACT NAVIGATION SIDEBAR */}
          <aside className="w-full md:w-64 bg-white text-slate-600 flex flex-col justify-between shrink-0 border-r border-slate-200 font-sans">
            <div>
              {/* Institution Title */}
              <div className="p-6 border-b border-slate-100 text-center md:text-left space-y-1 bg-[#F8FAFC]/55">
                <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-2.5 font-display">
                  <div className="p-1 bg-blue-600 rounded-lg text-white">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  US PrimeCare
                </h1>
                <span className="text-[10px] font-mono text-slate-400 tracking-widest block font-bold uppercase pl-7">PSA LIFECYCLE</span>
              </div>

              {/* Sidebar Action Menu Tabs List */}
              <nav className="p-4 space-y-1 text-xs">
                {currentUser.role !== 'Corporate Viewer' && (
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2.5 font-medium transition duration-150 cursor-pointer ${
                      activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                    }`}
                  >
                    <Activity className="w-4.5 h-4.5" />
                    Operational Center
                  </button>
                )}

                {(perm.canManageClients) && (
                  <button
                    onClick={() => setActiveTab('clients')}
                    className={`w-full px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2.5 font-medium transition duration-150 cursor-pointer ${
                      activeTab === 'clients' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                    }`}
                  >
                    <Briefcase className="w-4.5 h-4.5" />
                    Clients Onboarding
                  </button>
                )}

                {(perm.canManageCampaigns) && (
                  <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`w-full px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2.5 font-medium transition duration-150 cursor-pointer ${
                      activeTab === 'campaigns' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                    }`}
                  >
                    <Calendar className="w-4.5 h-4.5" />
                    Screening Campaigns
                  </button>
                )}

                {(perm.canRegisterParticipants) && (
                  <button
                    onClick={() => setActiveTab('participants')}
                    className={`w-full px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2.5 font-medium transition duration-150 cursor-pointer ${
                      activeTab === 'participants' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                    }`}
                  >
                    <Users className="w-4.5 h-4.5" />
                    Participant Intake
                  </button>
                )}

                {(perm.canEnterLabResults) && (
                  <button
                    onClick={() => setActiveTab('laboratory')}
                    className={`w-full px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2.5 font-medium transition duration-150 cursor-pointer ${
                      activeTab === 'laboratory' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                    }`}
                  >
                    <FlaskConical className="w-4.5 h-4.5" />
                    Laboratory Assays
                  </button>
                )}

                {(perm.canPerformClinicalReview) && (
                  <button
                    onClick={() => setActiveTab('clinical')}
                    className={`w-full px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2.5 font-medium transition duration-150 cursor-pointer ${
                      activeTab === 'clinical' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                    }`}
                  >
                    <Stethoscope className="w-4.5 h-4.5" />
                    Board Clinical Review
                  </button>
                )}

                {(perm.canManageBilling) && (
                  <button
                    onClick={() => setActiveTab('billing')}
                    className={`w-full px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2.5 font-medium transition duration-150 cursor-pointer ${
                      activeTab === 'billing' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                    }`}
                  >
                    <DollarSign className="w-4.5 h-4.5" />
                    Billing & Finance
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2.5 font-medium transition duration-150 cursor-pointer ${
                    activeTab === 'reports' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                    }`}
                >
                  <FileText className="w-4.5 h-4.5" />
                  Printable Reports
                </button>

                {(perm.canViewAuditLogs) && (
                    <button
                      onClick={() => setActiveTab('audits')}
                      className={`w-full px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2.5 font-medium transition duration-150 cursor-pointer ${
                        activeTab === 'audits' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                      }`}
                    >
                      <History className="w-4.5 h-4.5" />
                      Full Audits Trail
                    </button>
                )}

                {(currentUser.role === 'Super Administrator') && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full px-3.5 py-2.5 rounded-lg inline-flex items-center gap-2.5 font-medium transition duration-150 cursor-pointer ${
                      activeTab === 'settings' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                    }`}
                  >
                    <Settings className="w-4.5 h-4.5" />
                    System Access Settings
                  </button>
                )}
              </nav>
            </div>

            {/* Bottom active profile user line */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block font-sans">Active Profile</span>
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{currentUser.name}</p>
                <div className="text-[10px] text-blue-600 font-medium truncate mt-0.5">{currentUser.role}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-lg justify-center inline-flex items-center gap-1.5 cursor-pointer text-xs transition duration-150 font-medium shadow-2xs"
                  title="Logout Session"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  Lock Session
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT VIEWWORKSPACE CONTAINER */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
            
            {/* TOP BAR ACTION BAR */}
            <header className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 font-sans">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-500 font-medium select-none">
                <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>PrimeCare Outreach Node Active // 2026-06-03</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Notification Bell popover toggle */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsPopover(!notificationsPopover)}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition relative"
                    title="Real-time Operational Alerts"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-1 -right-1 leading-none bg-red-600 text-white font-mono font-extrabold text-[8px] rounded-full h-4 w-4 inline-flex items-center justify-center p-0.5 border border-white">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {/* Popover Feed block */}
                  {notificationsPopover && (
                    <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-xl shadow-md border border-slate-200 p-4 z-40 space-y-3 font-sans">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <strong className="text-slate-800 text-xs font-semibold">Workflow Alert Notifications</strong>
                        <button
                          onClick={() => {
                            setDb(prev => ({
                              ...prev,
                              notifications: prev.notifications.map(n => ({ ...n, isRead: true }))
                            }));
                          }}
                          className="text-[10px] text-blue-700 font-bold hover:underline"
                        >
                          Clear All Alerts
                        </button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {db.notifications.length > 0 ? (
                          db.notifications.map(n => (
                             <div key={n.id} className={`p-2.5 rounded-lg border text-[11px] leading-relaxed transition ${
                              n.isRead ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-blue-50/50 text-slate-700 border-blue-100'
                            }`}>
                              <p className="font-bold text-slate-800">{n.title}</p>
                              <p className="mt-0.5 text-slate-500">{n.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-slate-400 py-4 text-xs font-sans">No alerts parsed in session.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-right font-sans">
                  <span className="text-xs font-semibold text-slate-800 leading-none">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.role} Credentials</span>
                </div>
              </div>
            </header>

            {/* --- WORKSPACE CORE DISPLAY MOUNT --- */}
            <div className="p-6 max-w-7xl w-full mx-auto flex-1">
              {activeTab === 'dashboard' && currentUser.role !== 'Corporate Viewer' && (
                <DashboardAnalytics
                  clients={db.clients}
                  campaigns={db.campaigns}
                  participants={db.participants}
                  tests={db.tests}
                  reviews={db.reviews}
                  invoices={db.invoices}
                  userRole={currentUser.role}
                />
              )}

              {activeTab === 'dashboard' && currentUser.role === 'Corporate Viewer' && (
                <ReportingSuite
                  tests={db.tests}
                  participants={db.participants}
                  clients={db.clients}
                  campaigns={db.campaigns}
                  reviews={db.reviews}
                  invoices={db.invoices}
                  userRole={currentUser.role}
                />
              )}

              {activeTab === 'clients' && perm.canManageClients && (
                <ClientManagement
                  clients={db.clients}
                  packages={db.packages}
                  campaigns={db.campaigns}
                  onAddClient={handleAddClient}
                  onEditClient={handleEditClient}
                  onArchiveClient={handleArchiveClient}
                  onRestoreClient={handleRestoreClient}
                  userRole={currentUser.role}
                />
              )}

              {activeTab === 'campaigns' && perm.canManageCampaigns && (
                <CampaignManagement
                  campaigns={db.campaigns}
                  clients={db.clients}
                  participants={db.participants}
                  onAddCampaign={handleAddCampaign}
                  onEditCampaign={handleEditCampaign}
                  userRole={currentUser.role}
                />
              )}

              {activeTab === 'participants' && perm.canRegisterParticipants && (
                <ParticipantRegistration
                  participants={db.participants}
                  clients={db.clients}
                  campaigns={db.campaigns}
                  onRegisterParticipant={handleRegisterParticipant}
                  onEditParticipant={handleEditParticipant}
                  userRole={currentUser.role}
                />
              )}

              {activeTab === 'laboratory' && perm.canEnterLabResults && (
                <LaboratoryQueue
                  tests={db.tests}
                  participants={db.participants}
                  clients={db.clients}
                  onUploadResult={handleUploadResult}
                  onModifyResultWithHistory={handleModifyResultWithHistory}
                  userRole={currentUser.role}
                />
              )}

              {activeTab === 'clinical' && perm.canPerformClinicalReview && (
                <ClinicalReview
                  tests={db.tests}
                  participants={db.participants}
                  reviews={db.reviews}
                  clients={db.clients}
                  onAddReview={handleAddReview}
                  userRole={currentUser.role}
                />
              )}

              {activeTab === 'billing' && perm.canManageBilling && (
                <BillingManagement
                  invoices={db.invoices}
                  clients={db.clients}
                  campaigns={db.campaigns}
                  packages={db.packages}
                  onGenerateInvoice={handleGenerateInvoice}
                  onRecordPayment={handleRecordPayment}
                  userRole={currentUser.role}
                />
              )}

              {activeTab === 'reports' && (
                <ReportingSuite
                  tests={db.tests}
                  participants={db.participants}
                  clients={db.clients}
                  campaigns={db.campaigns}
                  reviews={db.reviews}
                  invoices={db.invoices}
                  userRole={currentUser.role}
                />
              )}

              {activeTab === 'audits' && perm.canViewAuditLogs && (
                /* Module 11: Audits Logs Table */
                <div className="space-y-4" id="auditing-auditlogs-root">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-1.5">
                      <History className="w-5 h-5 text-indigo-600 animate-pulse" />
                      Hospital Regulatory Auditing Checklist
                    </h2>
                    <p className="text-xs text-slate-400">Chronological list of all medical manipulations and role accesses for compliance review</p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-100 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-3xs font-mono uppercase tracking-wider">
                            <th className="py-3 px-4">Log Reference</th>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">Action / Event</th>
                            <th className="py-3 px-4">Debtor Entity Affected</th>
                            <th className="py-3 px-4">Audited User / Role</th>
                            <th className="py-3 px-4">Previous Value Log</th>
                            <th className="py-3 px-4">Corrected Value Log</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600 divide-y divide-slate-50">
                          {db.auditLogs.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">{l.id}</td>
                              <td className="py-3 px-4 font-mono text-[10px] whitespace-nowrap text-slate-400">{l.timestamp}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase font-mono bg-indigo-50 text-indigo-800">
                                  {l.action}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap truncate max-w-[150px]" title={l.recordAffected}>{l.recordAffected}</td>
                              <td className="py-3 px-4 italic truncate max-w-[150px]" title={l.user}>{l.user}</td>
                              <td className="py-3 px-4 truncate max-w-[150px] text-[11px] text-slate-405 font-mono" title={l.previousValue || ''}>{l.previousValue || '--'}</td>
                              <td className="py-3 px-4 truncate max-w-[150px] text-[11px] text-slate-800 font-mono" title={l.newValue || ''}>{l.newValue || '--'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && currentUser.role === 'Super Administrator' && (
                /* Module 1: User Logins, locked accounts and settings */
                <div className="space-y-6" id="system-configurations-root">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 tracking-tight">System Access Controls</h2>
                    <p className="text-xs text-slate-400">Configure corporate user roles and safety thresholds</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Security credentials lists */}
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs space-y-4 col-span-2">
                      <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-50 pb-2">Active Hospital Associates</h3>
                      
                      <div className="space-y-3 font-sans text-xs">
                        {db.users.map(u => (
                          <div key={u.id} className="p-3 border border-slate-105 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <strong className="text-slate-800 text-sm block leading-none">{u.name}</strong>
                              <span className="text-3xs text-slate-400 block font-mono mt-1">Credentials Email: {u.email}</span>
                              <span className="text-[10px] text-indigo-700 font-bold block mt-0.5">Assigned: {u.role}</span>
                            </div>

                            <div className="flex items-center gap-3 justify-end shrink-0">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                className="text-3xs p-1 bg-white border border-slate-205 rounded-md text-slate-600 font-bold"
                              >
                                {(['Super Administrator', 'Administrator', 'Registration Officer', 'Laboratory Officer', 'Doctor / Specialist', 'Accounts Officer', 'Corporate Viewer'] as const).map(roleOption => (
                                  <option key={roleOption} value={roleOption}>{roleOption}</option>
                                ))}
                              </select>

                              <button
                                onClick={() => handleToggleUserStatus(u.id)}
                                className={`px-2.5 py-1 text-3xs font-extrabold uppercase rounded-full cursor-pointer transition ${
                                  u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800 font-bold'
                                }`}
                              >
                                {u.isActive ? 'Active' : 'Deactivated'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operational system configurations */}
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs space-y-4 h-fit font-sans text-xs">
                      <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-50 pb-2">System Guardrails</h3>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold block">HIPAA Anonymity Level</label>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 font-mono">
                            ● HIGH PROTECTION STANDARDS
                          </span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold block">Failed Login Retries Threshold</label>
                          <span className="font-mono text-xs block text-slate-700 font-bold">4 Attempts lock-out</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold block">Assay Calibration Scope</label>
                          <span className="font-mono text-xs block text-slate-700 font-bold">Immunoassay EIA standard [CLIA]</span>
                        </div>

                        <div className="pt-3 border-t border-slate-100 text-slate-400 text-[11px] leading-relaxed flex items-start gap-2">
                          <Lock className="w-5 h-5 text-indigo-400 shrink-0 select-none" />
                          <span>All medical results edited inside the <strong>Laboratory Assays module</strong> retain full override log checklists indefinitely for regulatory conformance.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </main>
        </div>
      )}
    </div>
  );
}
