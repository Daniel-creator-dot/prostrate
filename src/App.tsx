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
  // Master local database states — initialized from API
  const [db, setDb] = useState<{
    users: SystemUser[];
    packages: BillingPackage[];
    clients: CorporateClient[];
    campaigns: ScreeningCampaign[];
    participants: Participant[];
    tests: PSATest[];
    reviews: SpecialistReview[];
    invoices: Invoice[];
    auditLogs: AuditLog[];
    notifications: Notification[];
  }>({
    users: [],
    packages: [],
    clients: [],
    campaigns: [],
    participants: [],
    tests: [],
    reviews: [],
    invoices: [],
    auditLogs: [],
    notifications: [],
  });
  const [dbLoaded, setDbLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Current session configurations
  const [currentUser, setCurrentUser] = useState<SystemUser>({
    id: 'USR-000',
    name: 'Loading...',
    email: '',
    role: 'Super Administrator',
    isActive: true,
    loginCount: 0
  });
  const [sessionToken, setSessionToken] = useState<string>('PC-AUTH-SESSION-TOKEN-883011');
  const [activeTab, setActiveTab ] = useState<string>('dashboard');
  const [notificationsPopover, setNotificationsPopover] = useState(false);
  const [aiPopover, setAiPopover] = useState(false);

  // Authentication & Access Control States (Module 1)
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);
  const [isAccountLocked, setIsAccountLocked] = useState(false);

  // Load data from the PostgreSQL-backed API on mount
  useEffect(() => {
    fetch('/api/db')
      .then(res => {
        if (!res.ok) throw new Error('Database server returned error status');
        return res.json();
      })
      .then(data => {
        setDb(data);
        if (data.users && data.users.length > 0) {
          setCurrentUser(data.users[0]);
        }
        setDbLoaded(true);
      })
      .catch(err => {
        console.error('API connection failed:', err);
        setErrorMsg('Could not fetch data from database server. Ensure backend is running.');
        setDbLoaded(true);
      });
  }, []);

  useEffect(() => {
    const handleBeforePrint = () => document.body.classList.add('printing-mode');
    const handleAfterPrint = () => document.body.classList.remove('printing-mode');

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // General Notification Triggering Helper (Module 12)
  const triggerSystemNotification = async (title: string, message: string, recipient: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'In-App', title, message, recipient }),
      });
      if (!response.ok) throw new Error('Failed to create notification');
      const created = await response.json();
      setDb(prev => ({
        ...prev,
        notifications: [created, ...prev.notifications]
      }));
    } catch (err) {
      console.error('Failed to trigger notification:', err);
    }
  };

  // Compliance Auditing Helper (Module 11)
  const addAuditEntry = async (
    action: string,
    recordAffected: string,
    previousValue: string | null,
    newValue: string | null,
    userOverride?: string
  ) => {
    const userVal = userOverride || (currentUser ? `${currentUser.name} (${currentUser.role})` : 'Anonymous (Guest)');
    try {
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userVal,
          action,
          recordAffected,
          previousValue,
          newValue
        }),
      });
      if (!response.ok) throw new Error('Failed to add audit log');
      const created = await response.json();
      setDb(prev => ({
        ...prev,
        auditLogs: [created, ...prev.auditLogs]
      }));
    } catch (err) {
      console.error('Failed to add audit log:', err);
    }
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
      addAuditEntry(
        'FAILED_LOGIN_ATTEMPT',
        `Email ${loginEmail}`,
        null,
        `Password attempt count: ${attempts}`,
        'Anonymous (Guest)'
      );

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
    addAuditEntry(
      'SUCCESSFUL_LOGIN',
      `User Account ${matchedUser.id}`,
      null,
      `Login session authenticated successfully`,
      `${matchedUser.name} (${matchedUser.role})`
    );
  };

  const handleLogout = () => {
    setIsLoggedOut(true);
    addAuditEntry('USER_LOGOUT', `User ${currentUser.id}`, 'Session active', 'Logged out');
  };

  // Module 2 Clients callbacks
  const handleAddClient = async (newClient: Omit<CorporateClient, 'id' | 'isArchived'>) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
      const created = await res.json();
      setDb(prev => ({ ...prev, clients: [created, ...prev.clients] }));
      addAuditEntry('CLIENT_ONBOARDED', `Client ${created.id}`, null, `Onboarded ${newClient.name}`);
      triggerSystemNotification('New Client Onboarded', `Corporate client ${newClient.name} successfully created.`, 'Super Administrator');
    } catch (err) {
      console.error(err);
      alert('Failed to save client to database. Ensure connection is active.');
    }
  };

  const handleEditClient = async (updated: CorporateClient) => {
    const prev = db.clients.find(c => c.id === updated.id);
    try {
      await fetch(`/api/clients/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setDb(prevDb => ({
        ...prevDb,
        clients: prevDb.clients.map(c => c.id === updated.id ? updated : c)
      }));
      addAuditEntry('CLIENT_UPDATED', `Client ${updated.id}`, JSON.stringify(prev), JSON.stringify(updated));
    } catch (err) {
      console.error(err);
      alert('Failed to update client in database.');
    }
  };

  const handleArchiveClient = async (id: string) => {
    const prev = db.clients.find(c => c.id === id);
    try {
      await fetch(`/api/clients/${id}/archive`, { method: 'PATCH' });
      setDb(prevDb => ({
        ...prevDb,
        clients: prevDb.clients.map(c => c.id === id ? { ...c, isArchived: true } : c)
      }));
      addAuditEntry('CLIENT_ARCHIVED', `Client ${id}`, prev?.isArchived ? 'Archived' : 'Active', 'Archived');
    } catch (err) {
      console.error(err);
      alert('Failed to archive client in database.');
    }
  };

  const handleRestoreClient = async (id: string) => {
    const prev = db.clients.find(c => c.id === id);
    try {
      await fetch(`/api/clients/${id}/restore`, { method: 'PATCH' });
      setDb(prevDb => ({
        ...prevDb,
        clients: prevDb.clients.map(c => c.id === id ? { ...c, isArchived: false } : c)
      }));
      addAuditEntry('CLIENT_RESTORED', `Client ${id}`, prev?.isArchived ? 'Archived' : 'Active', 'Active');
    } catch (err) {
      console.error(err);
      alert('Failed to restore client in database.');
    }
  };

  // Module 3 Campaigns callbacks
  const handleAddCampaign = async (newC: Omit<ScreeningCampaign, 'id'>) => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newC),
      });
      const created = await res.json();
      setDb(prev => ({ ...prev, campaigns: [...prev.campaigns, created] }));
      addAuditEntry('CAMPAIGN_SCHEDULED', `Campaign ${created.id}`, null, `Created campaign ${newC.name}`);
      triggerSystemNotification('New Outreach Campaign Scheduled', `Campaign ${newC.name} is scheduled on ${newC.screeningDate}.`, 'Registration Officer');
    } catch (err) {
      console.error(err);
      alert('Failed to save campaign to database.');
    }
  };

  const handleEditCampaign = async (updated: ScreeningCampaign) => {
    const prev = db.campaigns.find(c => c.id === updated.id);
    try {
      await fetch(`/api/campaigns/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setDb(prevDb => ({
        ...prevDb,
        campaigns: prevDb.campaigns.map(c => c.id === updated.id ? updated : c)
      }));
      addAuditEntry('CAMPAIGN_MODIFIED', `Campaign ${updated.id}`, JSON.stringify(prev), JSON.stringify(updated));
      if (prev?.status !== 'Completed' && updated.status === 'Completed') {
        triggerSystemNotification('Screening Campaign Completed', `Campaign ${updated.name} completed. Outpatient billings ready for accounts officer.`, 'Accounts Officer');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update campaign in database.');
    }
  };

  // Module 4 Participant callbacks
  const handleRegisterParticipant = async (newP: Omit<Participant, 'id' | 'registrationDate' | 'age'>) => {
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newP),
      });
      const { participant, test } = await res.json();
      setDb(prev => ({
        ...prev,
        participants: [...prev.participants, participant],
        tests: [test, ...prev.tests]
      }));
      addAuditEntry('PARTICIPANT_REGISTERED', `Participant ${participant.id}`, null, `Registered ${newP.fullName} & generated test queue.`);
    } catch (err) {
      console.error(err);
      alert('Failed to register participant in database.');
    }
  };

  const handleEditParticipant = async (updated: Participant) => {
    try {
      await fetch(`/api/participants/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setDb(prevDb => ({
        ...prevDb,
        participants: prevDb.participants.map(p => p.id === updated.id ? updated : p)
      }));
      addAuditEntry('PARTICIPANT_DEMOGRAPHICS_CORRECTED', `Participant ${updated.id}`, null, `Amended registration metrics for ${updated.fullName}`);
    } catch (err) {
      console.error(err);
      alert('Failed to update participant details in database.');
    }
  };

  // Module 5 & 6 PSA Lab Analytes callbacks
  const handleUploadResult = async (testId: string, value: number, remark: string) => {
    let classification: PSATest['classification'] = 'Normal';
    if (value >= 4.0 && value < 10.0) classification = 'Borderline';
    else if (value >= 10.0) classification = 'Elevated';

    try {
      const res = await fetch(`/api/tests/${testId}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ psaValue: value, remarks: remark }),
      });
      const updatedTest = await res.json();
      setDb(prevDb => ({ ...prevDb, tests: prevDb.tests.map(t => t.id === testId ? updatedTest : t) }));
      addAuditEntry('TEST_RESULT_UPLOADED', `PSATest ${testId}`, 'psaValue: null', `psaValue: ${value}, classification: ${classification}`);
      if (classification !== 'Normal') {
        triggerSystemNotification('Elevated PSA Detection', `PSA value of ${value} ng/mL registered for sample ${testId}. Specialist urologist assessment recommended.`, 'Doctor / Specialist');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload test result to database.');
    }
  };

  const handleModifyResultWithHistory = async (testId: string, newValue: number, reason: string) => {
    const prevTest = db.tests.find(t => t.id === testId);
    if (!prevTest) return;

    let classification: PSATest['classification'] = 'Normal';
    if (newValue >= 4.0 && newValue < 10.0) classification = 'Borderline';
    else if (newValue >= 10.0) classification = 'Elevated';

    try {
      const res = await fetch(`/api/tests/${testId}/correct`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newValue, reason, modifiedBy: `${currentUser.name} (${currentUser.role})` }),
      });
      const updatedTest = await res.json();
      setDb(prevDb => ({ ...prevDb, tests: prevDb.tests.map(t => t.id === testId ? updatedTest : t) }));
      addAuditEntry('TEST_RESULT_CORRECTED', `PSATest ${testId}`, `psaValue: ${prevTest.psaValue}`, `psaValue: ${newValue}, correction reason logged`);
      if (classification !== 'Normal') {
        triggerSystemNotification('Corrected Elevated PSA Value', `Assay override: corrected PSA to ${newValue} ng/mL for sample ${testId}. Diagnostic review modified.`, 'Doctor / Specialist');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to correct test result in database.');
    }
  };

  // Module 7 Doctor assessment reviews
  const handleAddReview = async (newRev: Omit<SpecialistReview, 'id' | 'reviewDate' | 'specialistName'>) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRev, specialistName: currentUser.name }),
      });
      const created = await res.json();
      setDb(prev => {
        const exists = prev.reviews.some(r => r.testId === newRev.testId);
        return { ...prev, reviews: exists ? prev.reviews.map(r => r.testId === newRev.testId ? created : r) : [...prev.reviews, created] };
      });
      addAuditEntry('CLINICAL_DIAGNOSIS_COMMITTED', `SpecialistReview ${created.id}`, null, `Physician diagnosis logs recorded for sample ${newRev.testId}`);
      if (newRev.scheduleReferral !== 'None') {
        triggerSystemNotification('Urology Referral Dispatched', `Patient reference ${newRev.participantId} referred to ${newRev.scheduleReferral}.`, 'Super Administrator');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save clinical review to database.');
    }
  };

  // Module 8 Billings & Invoicing callbacks
  const handleGenerateInvoice = async (newInv: Omit<Invoice, 'id' | 'issuedDate' | 'payments' | 'outstandingBalance' | 'paymentStatus' | 'subtotal' | 'tax' | 'totalAmount'>) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInv),
      });
      const created = await res.json();
      setDb(prev => ({ ...prev, invoices: [created, ...prev.invoices] }));
      addAuditEntry('INVOICE_ISSUED', `Invoice ${created.id}`, null, `Issued invoice of GH₵${created.totalAmount.toFixed(2)} to client ${newInv.clientId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate invoice in database.');
    }
  };

  const handleRecordPayment = async (invId: string, amount: number, method: 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash', ref: string) => {
    const prevInv = db.invoices.find(i => i.id === invId);
    if (!prevInv) return;

    try {
      const res = await fetch(`/api/invoices/${invId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method, transactionRef: ref }),
      });
      const updatedInvoice = await res.json();
      setDb(prevDb => ({ ...prevDb, invoices: prevDb.invoices.map(i => i.id === invId ? updatedInvoice : i) }));
      addAuditEntry('INVOICE_PAYMENT_SETTLED', `Invoice ${invId}`, `outstandingBalance: ${prevInv.outstandingBalance}`, `Recorded payment of GH₵${amount.toFixed(2)} via ${method}`);
    } catch (err) {
      console.error(err);
      alert('Failed to record payment in database.');
    }
  };

  // Module 1 User states modifications (Super Admin Settings Control)
  const handleToggleUserStatus = async (uId: string) => {
    const target = db.users.find(u => u.id === uId);
    if (!target) return;

    const updated = { ...target, isActive: !target.isActive };
    try {
      await fetch(`/api/users/${uId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setDb(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === uId ? updated : u)
      }));
      addAuditEntry(
        'USER_CREDENTIALS_TOGGLED',
        `User ${uId}`,
        `isActive: ${target.isActive}`,
        `isActive: ${updated.isActive}`
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update user status in database.');
    }
  };

  const handleRoleChange = async (uId: string, newRole: UserRole) => {
    const target = db.users.find(u => u.id === uId);
    if (!target) return;

    const updated = { ...target, role: newRole };
    try {
      await fetch(`/api/users/${uId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setDb(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === uId ? updated : u)
      }));
      addAuditEntry(
        'USER_ROLE_REALLOCATED',
        `User ${uId}`,
        `role: ${target.role}`,
        `role: ${newRole}`
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update user role in database.');
    }
  };

  // Role permissions checking helper
  const perm = ROLE_PERMISSIONS[currentUser.role];

  // System statistics derived
  const unreadNotifCount = db.notifications.filter(n => !n.isRead).length;

  if (!dbLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-sm font-semibold tracking-wide text-slate-400">Connecting to PrimeCare Clinical Database...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans p-6">
        <div className="max-w-md w-full bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto font-bold text-xl">!</div>
          <h2 className="text-lg font-bold text-white">Database Connection Error</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{errorMsg}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] flex flex-col antialiased text-slate-800" id="primecare-app-root">

      {/* Primary Layout */}
      {isLoggedOut ? (
        /* Module 1: Login Form Layout */
        <div className="flex-1 flex items-center justify-center p-6 min-h-[85vh] animate-fade-in">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-md space-y-6">
            <div className="text-center space-y-1.5 pb-5 border-b border-slate-100">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none font-display">PrimeCare Portal</h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-[0.15em] block uppercase font-semibold">PSA Screening Management</span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 tracking-wide">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah.jenkins@primecare.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white transition duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 tracking-wide">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white transition duration-150 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isAccountLocked}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition duration-150 ${
                  isAccountLocked ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {isAccountLocked ? 'Account Locked' : 'Sign In'}
              </button>
            </form>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 leading-relaxed space-y-1">
              <span className="font-semibold uppercase tracking-wider block text-[9px] text-slate-400">Demo credentials:</span>
              <p>Email: <strong className="font-mono text-slate-700">sarah.jenkins@primecare.com</strong></p>
              <p>Password: <strong className="font-mono text-slate-700">password</strong></p>
              <p className="text-slate-400 text-[10px] pt-1">Use the small AI helper button in the header for quick access.</p>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Frame */
        <div className="flex-1 flex flex-row min-h-0">
          
          {/* LEFT COMPACT NAVIGATION SIDEBAR */}
          <aside className="w-64 h-full bg-white text-slate-700 flex flex-col justify-between shrink-0 border-r border-slate-200 shadow-xl">
            <div>
              {/* Institution Title */}
              <div className="p-5 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-2xl bg-slate-900 text-white shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 tracking-tight">PrimeCare</p>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">PSA Lifecycle</p>
                  </div>
                </div>
              </div>

              {/* Sidebar Action Menu Tabs List */}
              <div className="p-4 flex-1 min-h-0 overflow-y-auto">
                <nav className="space-y-2 sidebar-menu">
                  {currentUser.role !== 'Corporate Viewer' && (
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`w-full rounded-2xl flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer ${
                        activeTab === 'dashboard' ? 'active bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      <Activity className="w-4 h-4" />
                      Dashboard
                    </button>
                  )}

                  {(perm.canManageClients) && (
                    <button
                      onClick={() => setActiveTab('clients')}
                      className={`w-full rounded-2xl flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer ${
                        activeTab === 'clients' ? 'active bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      <Briefcase className="w-4 h-4" />
                      Clients
                    </button>
                  )}

                  {(perm.canManageCampaigns) && (
                    <button
                      onClick={() => setActiveTab('campaigns')}
                      className={`w-full rounded-2xl flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer ${
                        activeTab === 'campaigns' ? 'active bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      <Calendar className="w-4 h-4" />
                      Campaigns
                    </button>
                  )}

                  {(perm.canRegisterParticipants) && (
                    <button
                      onClick={() => setActiveTab('participants')}
                      className={`w-full rounded-2xl flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer ${
                        activeTab === 'participants' ? 'active bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      <Users className="w-4 h-4" />
                      Participants
                    </button>
                  )}

                  {(perm.canEnterLabResults) && (
                    <button
                      onClick={() => setActiveTab('laboratory')}
                      className={`w-full rounded-2xl flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer ${
                        activeTab === 'laboratory' ? 'active bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      <FlaskConical className="w-4 h-4" />
                      Laboratory
                    </button>
                  )}

                  {(perm.canPerformClinicalReview) && (
                    <button
                      onClick={() => setActiveTab('clinical')}
                      className={`w-full rounded-2xl flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer ${
                        activeTab === 'clinical' ? 'active bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      <Stethoscope className="w-4 h-4" />
                      Clinical Review
                    </button>
                  )}

                  {(perm.canManageBilling) && (
                    <button
                      onClick={() => setActiveTab('billing')}
                      className={`w-full rounded-2xl flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer ${
                        activeTab === 'billing' ? 'active bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      <DollarSign className="w-4 h-4" />
                      Billing
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`w-full rounded-2xl flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer ${
                      activeTab === 'reports' ? 'active bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                    <FileText className="w-4 h-4" />
                    Reports
                  </button>

                  {(perm.canViewAuditLogs) && (
                      <button
                        onClick={() => setActiveTab('audits')}
                        className={`w-full rounded-2xl flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer ${
                          activeTab === 'audits' ? 'active bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                        }`}>
                        <History className="w-4 h-4" />
                        Audit Trail
                      </button>
                  )}

                  {(currentUser.role === 'Super Administrator') && (
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`w-full rounded-2xl flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer ${
                        activeTab === 'settings' ? 'active bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  )}
                </nav>
              </div>
            </div>

            {/* Bottom active profile user line */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-[0.12em] font-semibold block">Signed in as</span>
                <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{currentUser.name}</p>
                <div className="text-[11px] text-slate-500 font-medium truncate">{currentUser.role}</div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg justify-center inline-flex items-center gap-1.5 cursor-pointer text-xs transition duration-150 font-medium"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                Sign Out
              </button>
            </div>
          </aside>

          {/* RIGHT VIEWWORKSPACE CONTAINER */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
            
            {/* TOP BAR ACTION BAR */}
            <header className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-[10px] font-mono text-slate-500 font-medium select-none">
                <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>PrimeCare Active</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => {
                      setAiPopover(!aiPopover);
                      setNotificationsPopover(false);
                    }}
                    className="inline-flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md cursor-pointer transition"
                    title="AI assistant"
                  >
                    <Sparkles className="w-4 h-4 text-slate-600" />
                    <span className="text-[11px] font-semibold">AI</span>
                  </button>

                  {aiPopover && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-40 space-y-2 animate-fade-in text-slate-700">
                      <p className="text-slate-900 text-sm font-semibold">PrimeCare AI</p>
                      <p className="text-xs text-slate-500 leading-relaxed">Use this quick assistant for workflow guidance, insights, or a fast system check.</p>
                      <button
                        type="button"
                        className="w-full text-left rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Open AI helper
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsPopover(!notificationsPopover);
                      setAiPopover(false);
                    }}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md cursor-pointer transition relative"
                    title="Notifications"
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
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-40 space-y-3 animate-fade-in">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <strong className="text-slate-800 text-xs font-semibold">Notifications</strong>
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

                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[13px] font-semibold text-slate-800 leading-none">{currentUser.name}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">{currentUser.role}</span>
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
                <div className="space-y-4 animate-fade-in" id="auditing-auditlogs-root">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <History className="w-5 h-5 text-slate-400" />
                      Audit Trail
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Chronological record of all actions and role accesses</p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
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
                <div className="space-y-5 animate-fade-in" id="system-configurations-root">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Settings</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Manage user roles and system configuration</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 col-span-2">
                      <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Team Members</h3>
                      
                      <div className="space-y-2.5 text-xs">
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
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 h-fit text-xs">
                      <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">System Configuration</h3>
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
