/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  AlertOctagon,
  Award,
  Building,
  User,
  Activity,
  Heart,
  DollarSign,
  Briefcase,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  FileCheck2,
  Calendar,
  Lock,
  Stethoscope
} from 'lucide-react';
import { PSATest, Participant, CorporateClient, ScreeningCampaign, SpecialistReview, Invoice } from '../types';

interface ReportingSuiteProps {
  tests: PSATest[];
  participants: Participant[];
  clients: CorporateClient[];
  campaigns: ScreeningCampaign[];
  reviews: SpecialistReview[];
  invoices: Invoice[];
  userRole: string;
}

export default function ReportingSuite({
  tests,
  participants,
  clients,
  campaigns,
  reviews,
  invoices,
  userRole
}: ReportingSuiteProps) {
  const [activeReportTab, setActiveReportTab] = useState<'individual' | 'corporate' | 'followup' | 'billing'>('individual');
  
  // Selection States
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(participants[0]?.id || '');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');

  // Mock export action trigger
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const calculateAge = (born: string) => {
    if (!born) return 0;
    const now = new Date('2026-06-03');
    const b = new Date(born);
    let diff = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) diff--;
    return diff;
  };

  const handleExport = (format: 'PDF' | 'Excel' | 'Print') => {
    setExportMessage(`Standardizing report content... Fetching HIPAA credentials...`);
    setTimeout(() => {
      if (format === 'Print') {
        window.print();
        setExportMessage(null);
      } else {
        setExportMessage(`Successfully exported report to certified ${format} file format successfully!`);
        setTimeout(() => setExportMessage(null), 3500);
      }
    }, 800);
  };

  // 1. Calculations for Individual PSA Result Slip
  const selectedParticipant = participants.find(p => p.id === selectedParticipantId) || participants[0];
  const participantTest = selectedParticipant ? tests.find(t => t.participantId === selectedParticipant.id) : null;
  const testReview = participantTest ? reviews.find(r => r.testId === participantTest.id) : null;
  const participantClient = selectedParticipant ? clients.find(cl => cl.id === selectedParticipant.companyId) : null;
  const participantCampaign = selectedParticipant ? campaigns.find(c => c.id === selectedParticipant.campaignId) : null;

  // 2. Calculations for Aggregated Corporate Report
  const corporateClient = clients.find(cl => cl.id === selectedClientId) || clients[0];
  const corporateCampaigns = campaigns.filter(c => c.clientId === corporateClient?.id);
  const corporateParticipants = participants.filter(p => p.companyId === corporateClient?.id);
  
  const corporateTests = tests.filter(t => 
    corporateParticipants.some(p => p.id === t.participantId)
  );

  const corpCompleted = corporateTests.filter(t => t.status === 'Completed');
  const corpNormal = corpCompleted.filter(t => t.classification === 'Normal').length;
  const corpBorderline = corpCompleted.filter(t => t.classification === 'Borderline').length;
  const corpElevated = corpCompleted.filter(t => t.classification === 'Elevated' || t.classification === 'Requires Specialist Review').length;

  // 3. Billing Calculations
  const clientInvoices = invoices.filter(inv => inv.clientId === selectedClientId);
  const totalBilled = clientInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalDue = clientInvoices.reduce((acc, curr) => acc + curr.outstandingBalance, 0);

  return (
    <div className="space-y-6" id="reporting-suite-root">
      {/* Top Banner Control options */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-slate-950 font-display tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Certifications & Reporting Suite
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium leading-relaxed">Generate compliant result matrices, individual slips, or billing summaries</p>
        </div>

        {/* Mock Exports */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleExport('PDF')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition uppercase tracking-wider cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            Export Certified PDF
          </button>
          <button
            onClick={() => handleExport('Excel')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition uppercase tracking-wider cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Excel Sheet
          </button>
          <button
            onClick={() => handleExport('Print')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition uppercase tracking-wider cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Render Print Layout
          </button>
        </div>
      </div>

      {/* Export status notifier toast */}
      {exportMessage && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 font-semibold flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-indigo-500 animate-spin" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Primary Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-0.5">
        {userRole !== 'Corporate Viewer' && (
          <button
            onClick={() => setActiveReportTab('individual')}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition uppercase tracking-widest ${
              activeReportTab === 'individual'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            1. Individual Result Slips
          </button>
        )}

        <button
          onClick={() => setActiveReportTab('corporate')}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition uppercase tracking-widest ${
            activeReportTab === 'corporate'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-400 hover:text-slate-800'
          }`}
        >
          2. Corporate Summary Reports (Anonymized)
        </button>

        {userRole !== 'Corporate Viewer' && (
          <>
            <button
              onClick={() => setActiveReportTab('followup')}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition uppercase tracking-widest ${
                activeReportTab === 'followup'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-400 hover:text-slate-800'
              }`}
            >
              3. Clinical Follow-Up Case Lists
            </button>

            <button
              onClick={() => setActiveReportTab('billing')}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition uppercase tracking-widest ${
                activeReportTab === 'billing'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-400 hover:text-slate-800'
              }`}
            >
              4. Corporate Finance Audits
            </button>
          </>
        )}
      </div>

      {/* --- TAB 1: INDIVIDUAL PSA RESULT SLIP --- */}
      {activeReportTab === 'individual' && userRole !== 'Corporate Viewer' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Picker Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h4 className="font-bold font-display text-slate-900 text-sm tracking-tight border-b border-slate-200 pb-3">
              Select Patient Record
            </h4>
            
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Search Resident Registrant:</label>
              <select
                value={selectedParticipantId}
                onChange={(e) => setSelectedParticipantId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-hidden"
              >
                {participants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] leading-relaxed text-slate-500 space-y-1.5 font-mono">
              <span className="font-bold text-slate-700 block uppercase tracking-wider">HIPAA Compliance Rules:</span>
              <p>Certified individual slips must be kept strictly confidential. Access is logged in the system audits record on every lookup attempt.</p>
            </div>
          </div>

          {/* Printable Slip Preview Container */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm col-span-2 space-y-6" id="individual-slip-printable">
            {/* Slip Header */}
            <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold text-blue-900 tracking-tight leading-none uppercase">US PrimeCare Outreach</h1>
                <span className="text-[10px] text-slate-450 block font-mono font-bold tracking-widest mt-2">CERTIFIED LABORATORY CLINICAL EXAMINATION REPORT</span>
              </div>
              <div className="text-right flex flex-col font-mono text-[9px] text-slate-450 uppercase tracking-wider">
                <span>Validation Ref: CERT-{participantTest?.id || 'PENDING'}</span>
                <span>Timestamp: 2026-06-03 13:49:33</span>
              </div>
            </div>

            {selectedParticipant ? (
              <>
                {/* Patient Demographics Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-5 border-b border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block mb-0.5">Patient Name</span>
                    <strong className="text-slate-900 font-bold leading-none">{selectedParticipant.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block mb-0.5">Unique ID Reference</span>
                    <strong className="text-slate-800 font-mono leading-none block">{selectedParticipant.id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block mb-0.5">Birth Date / Age</span>
                    <strong className="text-slate-800 font-mono leading-none block">
                      {selectedParticipant.dob} <span className="text-slate-400 text-[10px] font-normal">({selectedParticipant.age} yrs)</span>
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block mb-0.5">Corporate Client</span>
                    <strong className="text-slate-800 font-bold truncate block leading-none">{participantClient ? participantClient.name : 'Unknown Corp'}</strong>
                  </div>
                </div>

                {/* Laboratory Assay Findings */}
                <div className="space-y-4 py-2">
                  <h3 className="font-bold text-slate-705 text-[10px] uppercase tracking-widest">
                    BIOCHEMICAL SPECS ANALYTE PROFILE
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col justify-center text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Enzyme-Immunoassay PSA</span>
                      <strong className="text-2xl text-slate-900 font-mono mt-1 font-bold">
                        {participantTest?.psaValue !== null && participantTest?.psaValue !== undefined
                          ? `${participantTest.psaValue.toFixed(2)} ng/mL`
                          : 'AWAITING LAB RUN'}
                      </strong>
                    </div>

                    <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col justify-center text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Clinical Status Marker</span>
                      <strong className={`text-base font-mono mt-2 uppercase font-bold ${
                        participantTest?.classification === 'Normal' ? 'text-emerald-700' :
                        participantTest?.classification === 'Borderline' ? 'text-amber-700' :
                        'text-rose-750 font-bold'
                      }`}>
                        {participantTest?.classification || 'PENDING PROCESSING'}
                      </strong>
                    </div>

                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-[10px] leading-relaxed text-slate-500 space-y-1 font-mono font-medium">
                      <span>• Sample ID: {participantTest?.sampleId || 'N/A'}</span>
                      <span>• Logistics Campaign: {participantCampaign?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Specialist Clinical Review Observes */}
                <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200 space-y-3.5">
                  <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Specialized Medical Practitioner Assessment
                  </h4>

                  {testReview ? (
                    <div className="space-y-4 text-xs leading-relaxed text-slate-650">
                      <div>
                        <span className="text-slate-400 font-bold tracking-wider text-[9px] block mb-1 uppercase">Chief Clinical Observations:</span>
                        <p className="italic bg-white p-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold">&ldquo;{testReview.clinicalObservations}&rdquo;</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold tracking-wider text-[9px] block mb-1 uppercase">Direct Outpatient Recommendations:</span>
                        <p className="italic bg-white p-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold">&ldquo;{testReview.recommendations}&rdquo;</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-2xs font-mono border-t border-slate-200 pt-3.5 font-bold">
                        <div>
                          <span className="text-slate-400">Repeat Blood extraction recommended:</span>
                          <span className="text-slate-800 ml-1.5 uppercase font-bold">{testReview.requestRepeatTest ? 'YES (CHAMPIONED)' : 'NO'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Referral Oncology Clinic:</span>
                          <span className="text-slate-800 ml-1.5">{testReview.scheduleReferral}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic font-semibold leading-relaxed">
                      {participantTest?.classification === 'Normal'
                        ? 'No additional specialist clinical reviews are required for this patient, as Total PSA results clear nominal screening thresholds.'
                        : 'Awaiting board medical review. Elevated result has been automatically dispatched to Dr. Robert Chen MD clinic.'}
                    </p>
                  )}
                </div>

                {/* Sign off and regulatory stamps */}
                <div className="flex justify-between items-end pt-6 border-t border-slate-200 text-xs leading-relaxed">
                  <div className="text-[10px] text-slate-400 space-y-0.5 font-bold uppercase tracking-wider">
                    <p>PrimeCare Hospital Outreach Diagnostics Center</p>
                    <p>CLIA Laboratory Certificate: #993D10A21</p>
                    <p className="font-mono text-indigo-500">HIPAA Redaction Standard Enforced</p>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="border-b border-slate-350 w-44 mx-auto py-1 font-mono text-[11px] text-blue-700 font-bold italic select-none">
                      Dr. Robert Chen, MD
                    </div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">Specialist Clinician, Urology Services</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center py-6 text-slate-400 font-bold uppercase animate-pulse">Loading screening metrics data...</p>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: AGGREGATED CORPORATE SUMMARY --- */}
      {activeReportTab === 'corporate' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Picker Panel */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h4 className="font-semibold text-slate-800 text-sm tracking-tight border-b border-slate-200 pb-2">
              Corporate Account Scope
            </h4>
            
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium block">Select Corporate Employer:</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
              >
                {clients.map(cl => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-[10px] leading-relaxed text-slate-500 space-y-1.5 font-mono">
              <span className="font-bold text-slate-700 block uppercase">PRIVACY ASSURANCE:</span>
              <p className="text-rose-600 font-bold">● RESTRICTED FROM CORPORATE VIEWERS</p>
              <p>This report is strictly aggregated. Federal HIPAA protocols prohibit corporate clients from accessing specific or identifying blood levels for their personnel.</p>
            </div>
          </div>

          {/* Aggregated Report Details */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-3 space-y-6" id="corporate-report-printable">
            {/* Report Header Logo */}
            <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-200">
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-snug">Aggregated Corporate Screening Metrics</h1>
                <p className="text-[10px] text-slate-400 font-mono font-bold tracking-wider mt-0.5 uppercase">Employer: {corporateClient?.name}</p>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-400 shrink-0">
                <span>Date: 2026-06-03</span>
                <span className="block text-emerald-700">✓ Patient privacy verified</span>
              </div>
            </div>

            {/* General metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block pb-0.5">Total Registered Workforce</span>
                <strong className="text-slate-800 text-base font-mono">{corporateParticipants.length} persons</strong>
              </div>
              <div>
                <span className="text-slate-400 block pb-0.5">Completed Lab Trials</span>
                <strong className="text-emerald-700 text-base font-mono">{corpCompleted.length} samples</strong>
              </div>
              <div>
                <span className="text-slate-400 block pb-0.5">Pending Processing</span>
                <strong className="text-amber-600 text-base font-mono">
                  {corporateTests.filter(t => t.status !== 'Completed').length} samples
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block pb-0.5">Fulfillment Rate</span>
                <strong className="text-blue-700 text-base font-mono">
                  {corporateParticipants.length > 0 ? Math.round((corpCompleted.length / corporateParticipants.length) * 100) : 0}%
                </strong>
              </div>
            </div>

            {/* AGGREGATED DISTRIBUTION SPECIFICATION (Privacy Redacted View) */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider font-mono">
                WORKFORCE PSA HEALTH CATEGORIES PROFILE (Anonymized)
              </h4>

              <div className="space-y-3.5 text-xs">
                {/* Normal Row */}
                <div className="flex items-center gap-4 justify-between">
                  <div className="w-1/3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-emerald-50 text-emerald-700">
                      Normal Segment (&lt; 4.0)
                    </span>
                  </div>
                  <div className="w-1/2 bg-slate-105 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${corpCompleted.length > 0 ? (corpNormal / corpCompleted.length) * 100 : 0}%` }} className="bg-emerald-500 h-full rounded-full"></div>
                  </div>
                  <div className="w-1/6 text-right text-slate-700 font-mono font-bold">
                    {corpNormal} cases ({corpCompleted.length > 0 ? Math.round((corpNormal / corpCompleted.length) * 100) : 0}%)
                  </div>
                </div>

                {/* Borderline Row */}
                <div className="flex items-center gap-4 justify-between">
                  <div className="w-1/3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-amber-50 text-amber-700">
                      Borderline (4.0 - 9.9)
                    </span>
                  </div>
                  <div className="w-1/2 bg-slate-105 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${corpCompleted.length > 0 ? (corpBorderline / corpCompleted.length) * 100 : 0}%` }} className="bg-amber-500 h-full rounded-full"></div>
                  </div>
                  <div className="w-1/6 text-right text-slate-700 font-mono font-bold">
                    {corpBorderline} cases ({corpCompleted.length > 0 ? Math.round((corpBorderline / corpCompleted.length) * 100) : 0}%)
                  </div>
                </div>

                {/* Elevated Row */}
                <div className="flex items-center gap-4 justify-between">
                  <div className="w-1/3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-rose-50 text-rose-700">
                      Elevated (&ge; 10.0)
                    </span>
                  </div>
                  <div className="w-1/2 bg-slate-105 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${corpCompleted.length > 0 ? (corpElevated / corpCompleted.length) * 100 : 0}%` }} className="bg-rose-500 h-full rounded-full"></div>
                  </div>
                  <div className="w-1/6 text-right text-slate-700 font-mono font-bold">
                    {corpElevated} cases ({corpCompleted.length > 0 ? Math.round((corpElevated / corpCompleted.length) * 100) : 0}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Active scheduled campaigns list */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider font-mono">
                Logistics Campaigns History
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] text-slate-400">
                      <th className="p-2.5">Campaign Name</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Venue Location</th>
                      <th className="p-2.5">Target</th>
                      <th className="p-2.5">Execution Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corporateCampaigns.map(cc => (
                      <tr key={cc.id} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50/50">
                        <td className="p-2.5 font-semibold text-slate-700">{cc.name}</td>
                        <td className="p-2.5 font-mono text-slate-500">{cc.screeningDate}</td>
                        <td className="p-2.5 truncate max-w-[150px]">{cc.venue}</td>
                        <td className="p-2.5 font-mono">{cc.targetParticipantCount}</td>
                        <td className="p-2.5 font-semibold text-[10px] uppercase font-mono">{cc.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* REDACTION NOTICE */}
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-150 text-[11px] leading-relaxed flex items-start gap-2.5">
              <Lock className="w-4.5 h-4.5 text-emerald-600 shrink-0 select-none mt-0.5" />
              <div>
                <strong>Redaction protocol certified.</strong> All direct identifiers (names, employee IDs, dates of birth) are withheld from this interface view. To review detailed clinical diagnostic files, medical credentials must be uploaded to the <strong>US PrimeCare Specialty Doctor Portal</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: CLINICAL CLINIC FOLLOW UPS --- */}
      {activeReportTab === 'followup' && userRole !== 'Corporate Viewer' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4" id="followup-report-printable">
          <div>
            <h3 className="font-semibold text-slate-800 tracking-tight text-base">Clinician Critical Follow-Up Case Registry</h3>
            <p className="text-[10px] text-slate-400 font-mono">PATIENT TARGET LIST WITH PSA &ge; 4.0 ng/mL</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold font-mono tracking-wider text-[10px] uppercase">
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Patient Detail</th>
                  <th className="p-3">Employer</th>
                  <th className="p-3">Measured PSA</th>
                  <th className="p-3">Specialist Doctor</th>
                  <th className="p-3">Referral Center Address</th>
                  <th className="p-3">Clinical Action Plan</th>
                  <th className="p-3">Follow-Up Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-50">
                {reviews.map(rev => {
                  const participant = participants.find(p => p.id === rev.participantId);
                  const client = participant ? clients.find(cl => cl.id === participant.companyId) : null;
                  const test = tests.find(t => t.id === rev.testId);

                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-blue-700">{rev.participantId}</td>
                      <td className="p-3">
                        <strong className="text-slate-800 font-medium block">{participant?.fullName}</strong>
                        <span className="text-2xs text-slate-400">DOB: {participant?.dob} (Age {participant?.age})</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{client?.name}</td>
                      <td className="p-3 font-mono text-red-600 font-bold">{test?.psaValue !== null ? test?.psaValue.toFixed(2) : '--'} ng/mL</td>
                      <td className="p-3 italic">{rev.specialistName}</td>
                      <td className="p-3 truncate max-w-[150px]">{rev.scheduleReferral}</td>
                      <td className="p-3 truncate max-w-[200px]" title={rev.recommendations}>{rev.recommendations}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-amber-50 border border-amber-100 text-amber-700">
                          {rev.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: BILLING REPORT --- */}
      {activeReportTab === 'billing' && userRole !== 'Corporate Viewer' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6" id="billing-report-printable">
          {/* Billing upper header */}
          <div className="flex justify-between border-b border-slate-50 pb-4">
            <div>
              <h3 className="font-semibold text-slate-800 tracking-tight text-base flex items-center gap-1">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Corporate Financial Audit Checklist
              </h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase">Outstanding accounts receivable balances</p>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] tracking-wider uppercase text-slate-400">
                  <th className="p-3">Invoice Reference</th>
                  <th className="p-3">Corporate Client</th>
                  <th className="p-3">Diagnostics Campaign</th>
                  <th className="p-3">Volume Screened</th>
                  <th className="p-3">Invoice Total</th>
                  <th className="p-3">Amount Received</th>
                  <th className="p-3">Outstanding Balance</th>
                  <th className="p-3">Due Timeline</th>
                  <th className="p-3">Payment status</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-50">
                {invoices.map(inv => {
                  const client = clients.find(cl => cl.id === inv.clientId);
                  const campaign = campaigns.find(c => c.id === inv.campaignId);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-800">{inv.id}</td>
                      <td className="p-3 font-bold text-slate-700">{client?.name}</td>
                      <td className="p-3 truncate max-w-[150px]">{campaign?.name}</td>
                      <td className="p-3 font-mono">{inv.numberScreened} employees</td>
                      <td className="p-3 font-mono font-semibold">${inv.totalAmount.toFixed(2)}</td>
                      <td className="p-3 font-mono text-emerald-700">${(inv.totalAmount - inv.outstandingBalance).toFixed(2)}</td>
                      <td className={`p-3 font-mono font-bold ${inv.outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        ${inv.outstandingBalance.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono whitespace-nowrap">{inv.dueDate}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          inv.paymentStatus === 'Fully Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
