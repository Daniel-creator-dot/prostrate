/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Activity,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  Smile,
  ShieldAlert,
  Clock,
  DollarSign,
  Briefcase,
  FileCheck
} from 'lucide-react';
import { CorporateClient, ScreeningCampaign, Participant, PSATest, SpecialistReview, Invoice } from '../types';

interface DashboardProps {
  clients: CorporateClient[];
  campaigns: ScreeningCampaign[];
  participants: Participant[];
  tests: PSATest[];
  reviews: SpecialistReview[];
  invoices: Invoice[];
  userRole: string;
}

export default function DashboardAnalytics({
  clients,
  campaigns,
  participants,
  tests,
  reviews,
  invoices,
  userRole
}: DashboardProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');

  // Filter lists based on campaign selection
  const filteredParticipants = selectedCampaignId === 'all'
    ? participants
    : participants.filter(p => p.campaignId === selectedCampaignId);

  const filteredTests = selectedCampaignId === 'all'
    ? tests
    : tests.filter(t => {
        const p = participants.find(part => part.id === t.participantId);
        return p && p.campaignId === selectedCampaignId;
      });

  const filteredInvoices = selectedCampaignId === 'all'
    ? invoices
    : invoices.filter(inv => inv.campaignId === selectedCampaignId);

  // Derive counts
  const totalClients = clients.filter(c => !c.isArchived).length;
  const activeCampaigns = campaigns.filter(c => c.status === 'In-Progress' || c.status === 'Scheduled').length;
  
  // PSA Categories
  const normalTests = filteredTests.filter(t => t.classification === 'Normal').length;
  const borderlineTests = filteredTests.filter(t => t.classification === 'Borderline').length;
  const elevatedTests = filteredTests.filter(t => t.classification === 'Elevated' || t.classification === 'Requires Specialist Review').length;
  const pendingTests = filteredTests.filter(t => t.status !== 'Completed' && t.status !== 'Rejected' && t.classification === 'Pending').length;

  const pendingReviews = reviews.filter(r => r.status === 'Pending Review' || r.status === 'Follow-Up Required').length;

  // Revenue Totals
  const totalRevenue = filteredInvoices.reduce((acc, curr) => {
    const paidAmount = curr.totalAmount - curr.outstandingBalance;
    return acc + paidAmount;
  }, 0);
  
  const totalOutstanding = filteredInvoices.reduce((acc, curr) => acc + curr.outstandingBalance, 0);

  // SVG Chart Dimensions & Computations
  const chartHeight = 220;
  const chartWidth = 500;
  
  // 1. PSA classification breakdown for display
  const totalClassified = normalTests + borderlineTests + elevatedTests;
  const normalPct = totalClassified > 0 ? (normalTests / totalClassified) * 100 : 0;
  const borderlinePct = totalClassified > 0 ? (borderlineTests / totalClassified) * 100 : 0;
  const elevatedPct = totalClassified > 0 ? (elevatedTests / totalClassified) * 100 : 0;

  // 2. Campaign Comparison metrics (e.g., Target vs Registered)
  const campaignStats = campaigns.slice(0, 5).map(c => {
    const registered = participants.filter(p => p.campaignId === c.id).length;
    const client = clients.find(cl => cl.id === c.clientId);
    return {
      name: c.name.length > 20 ? c.name.substring(0, 18) + '...' : c.name,
      clientName: client ? client.name : 'Unknown',
      target: c.targetParticipantCount || 50,
      registered: registered,
      status: c.status
    };
  });

  return (
    <div className="space-y-6" id="dashboard-analytics-root">
      {/* Filters Head */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">Clinical Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Logged in as: <span className="font-mono text-slate-500 font-medium">{userRole}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Campaign:</label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 outline-hidden focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
          >
            <option value="all">All Screening Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bento Grid Stats */}
      {userRole !== 'Corporate Viewer' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition duration-150 flex items-start justify-between min-h-28">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Clients</span>
              <p className="text-3xl font-bold text-slate-900 tracking-tight font-display">{totalClients}</p>
              <span className="text-[11px] text-slate-400 block">Hospital corporate partners</span>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition duration-150 flex items-start justify-between min-h-28">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Campaigns</span>
              <p className="text-3xl font-bold text-slate-900 tracking-tight font-display">{activeCampaigns}</p>
              <span className="text-[11px] text-emerald-600 block font-medium">Scheduled & running</span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition duration-150 flex items-start justify-between min-h-28">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Screened</span>
              <p className="text-3xl font-bold text-slate-900 tracking-tight font-display">
                {filteredParticipants.length}
              </p>
              <span className="text-[11px] text-slate-400 block">Staff members registered</span>
            </div>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition duration-150 flex items-start justify-between min-h-28">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Clinical Reviews</span>
              <p className="text-3xl font-bold text-amber-600 tracking-tight font-display">{pendingReviews}</p>
              <span className="text-[11px] text-amber-500 block font-medium">Awaiting board signatures</span>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>
      ) : (
        /* Reduced Dashboard for Corporate Viewer to protect privacy */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Campaign Scope</span>
              <p className="text-lg font-bold text-slate-900 tracking-tight mt-1 font-display">
                {selectedCampaignId === 'all' ? 'All Active Corporate Campaigns' : campaigns.find(c => c.id === selectedCampaignId)?.name}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">Aggregated metrics (privacy-restricted)</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Registrants</span>
              <p className="text-3xl font-bold text-slate-900 tracking-tight font-display mt-1">{filteredParticipants.length}</p>
              <span className="text-xs text-slate-400 block mt-1">Samples drawn / in execution</span>
            </div>
            <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Compliance Status</span>
              <div className="mt-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-150 px-2.5 py-1 rounded-full font-mono inline-flex items-center">
                ● HIPAA Compliant Secure
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Individual clinical traces sanitized</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Smile className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Clinical Distribution & Financial analytics */}
      {userRole !== 'Corporate Viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medical Status Card - Circular Ring or Percentage bars */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">PSA Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Out of {totalClassified} completed tests</p>
            </div>

            <div className="space-y-4 pt-1">
              <div className="relative">
                <div className="flex mb-1.5 items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold inline-block py-0.5 px-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md">
                      Normal (PSA &lt; 4.0 ng/mL)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-700">
                      {normalTests} ({Math.round(normalPct)}%)
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100">
                  <div style={{ width: `${normalPct}%` }} className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 rounded-full transition-all duration-300"></div>
                </div>
              </div>

              <div className="relative">
                <div className="flex mb-1.5 items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold inline-block py-0.5 px-2 bg-amber-50 text-amber-800 border border-amber-100 rounded-md">
                      Borderline (PSA 4.0 - 9.9 ng/mL)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-700">
                      {borderlineTests} ({Math.round(borderlinePct)}%)
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100">
                  <div style={{ width: `${borderlinePct}%` }} className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500 rounded-full transition-all duration-300"></div>
                </div>
              </div>

              <div className="relative">
                <div className="flex mb-1.5 items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold inline-block py-0.5 px-2 bg-rose-50 text-rose-800 border border-rose-100 rounded-md">
                      Elevated (PSA &ge; 10.0 ng/mL)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-700">
                      {elevatedTests} ({Math.round(elevatedPct)}%)
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100">
                  <div style={{ width: `${elevatedPct}%` }} className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-500 rounded-full transition-all duration-300"></div>
                </div>
              </div>

              {pendingTests > 0 && (
                <div className="mt-4 p-3 bg-blue-50/50 border border-blue-105 rounded-xl flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs text-blue-800 leading-relaxed">
                    <strong>{pendingTests}</strong> pipeline result(s) are actively awaiting evaluation inside the laboratory assays.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SVG Campaign Target vs Enrolled bar diagram */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campaign Enrollment</h3>
              <p className="text-xs text-slate-400 mt-0.5">Comparing target size versus actual registrations</p>
            </div>

            <div className="overflow-x-auto w-full">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto max-h-[220px]">
                {/* Horizontal gridlines */}
                {[0, 50, 100, 150].map((val, i) => {
                  const y = chartHeight - 40 - (val * (chartHeight - 70)) / 150;
                  return (
                    <g key={i}>
                      <line x1="55" y1={y} x2={chartWidth - 20} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      <text x="15" y={y + 4} className="text-[10px] font-mono fill-slate-400 text-right">{val}</text>
                    </g>
                  );
                })}

                {/* Bars */}
                {campaignStats.map((stat, i) => {
                  const barSpacing = (chartWidth - 80) / Math.max(1, campaignStats.length);
                  const x = 65 + i * barSpacing;
                  
                  // Heights based on scale where 150 participants takes max height
                  const targetHeight = (stat.target * (chartHeight - 70)) / 150;
                  const regHeight = (stat.registered * (chartHeight - 70)) / 150;

                  const yTarget = chartHeight - 40 - targetHeight;
                  const yReg = chartHeight - 40 - regHeight;

                  return (
                    <g key={i} className="group cursor-pointer">
                      {/* Target bar */}
                      <rect
                        x={x}
                        y={yTarget}
                        width="18"
                        height={Math.max(2, targetHeight)}
                        fill="#e2e8f0"
                        rx="3"
                        className="opacity-90 hover:fill-slate-350 transition duration-155"
                      />
                      {/* Registered bar */}
                      <rect
                        x={x + 22}
                        y={yReg}
                        width="18"
                        height={Math.max(2, regHeight)}
                        fill="#3b82f6"
                        rx="3"
                        className="hover:fill-blue-600 transition duration-155"
                      />
                      {/* X label */}
                      <text
                        x={x + 20}
                        y={chartHeight - 20}
                        className="text-[10px] fill-slate-500 font-medium"
                        textAnchor="middle"
                      >
                        {stat.name}
                      </text>
                      
                      {/* Hover stats label */}
                      <title>{`${stat.clientName}\nTarget: ${stat.target}\nRegistered: ${stat.registered}`}</title>
                    </g>
                  );
                })}

                {/* Legend */}
                <g transform={`translate(${chartWidth - 210}, 10)`}>
                  <rect x="0" y="0" width="10" height="10" fill="#e2e8f0" rx="2" />
                  <text x="16" y="9" className="text-[10px] fill-slate-500 font-medium">Target Size</text>
                  <rect x="85" y="0" width="10" height="10" fill="#3b82f6" rx="2" />
                  <text x="101" y="9" className="text-[10px] fill-slate-500 font-medium">Screened</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Viewer Aggregated Charts */}
      {userRole === 'Corporate Viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">PSA Health Summary</h3>
              <p className="text-xs text-slate-400">Normal vs Flagged Screening Outliers (Anonymized)</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex mb-1 items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Nominal Screening Profile</span>
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  {normalTests} case(s) ({totalClassified > 0 ? Math.round(normalPct) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div style={{ width: `${normalPct}%` }} className="bg-emerald-500 rounded-l-full"></div>
                <div style={{ width: `${borderlinePct + elevatedPct}%` }} className="bg-amber-500 rounded-r-full"></div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-500 space-y-3">
                <p>
                  🛡️ <strong className="font-semibold text-slate-700">Aesthetic Integrity Notice:</strong> All individual employee identifiers are mathematically redacted in this profile. The Corporate Client portal has absolute restricted access controls to comply with HIPAA, medical security standards, and federal healthcare data governance.
                </p>
                <p>
                  To request official certification files, contact your assigned <strong className="font-semibold text-slate-700">PrimeCare Outreach Director</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campaign Statistics</h3>
              <p className="text-xs text-slate-400">Total screened participants and campaign completions</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Fulfillment Rate</span>
                {campaignStats.length > 0 ? (
                  <p className="text-3xl font-bold font-display text-slate-900 mt-1">
                    {Math.round((campaignStats.reduce((sum, current) => sum + current.registered, 0) / 
                      campaignStats.reduce((sum, current) => sum + current.target, 0)) * 100)}%
                  </p>
                ) : (
                  <p className="text-3xl font-bold font-display text-slate-900 mt-1">N/A</p>
                )}
                <span className="text-[11px] text-slate-400 block mt-1">Of target population reached</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Campaigns</span>
                <p className="text-3xl font-bold font-display text-emerald-600 mt-1">
                  {campaigns.filter(c => c.status === 'In-Progress').length}
                </p>
                <span className="text-[11px] text-slate-400 block mt-1">Field operations in execution</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finance Analytics Section for authorized roles */}
      {userRole !== 'Corporate Viewer' && (userRole === 'Accounts Officer' || userRole === 'Super Administrator' || userRole === 'Administrator') && (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Revenue Tracker
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Tracking paid corporate revenue versus overdue values</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* SVG Interactive Revenue Horizontal Bar */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Invoiced Revenue Realized</span>
                  <span className="text-emerald-600 font-mono">GH₵{totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Outstanding Receivables</span>
                  <span className="text-rose-500 font-mono">GH₵{totalOutstanding.toFixed(2)}</span>
                </div>
              </div>

              <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${totalRevenue + totalOutstanding > 0 ? (totalRevenue / (totalRevenue + totalOutstanding)) * 100 : 100}%` }}
                  className="bg-emerald-500"
                />
                <div
                  style={{ width: `${totalRevenue + totalOutstanding > 0 ? (totalOutstanding / (totalRevenue + totalOutstanding)) * 100 : 0}%` }}
                  className="bg-rose-400"
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Paid (Settled)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> Unpaid / Outstanding</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-5 rounded-xl space-y-2 border border-slate-200">
              <span className="font-semibold text-slate-800 block">Financial Performance Audit:</span>
              <p>• Total corporate billings issued: <strong className="text-slate-800 font-mono">GH₵{(totalRevenue + totalOutstanding).toFixed(2)}</strong></p>
              <p>• Fully paid invoices: <strong className="text-emerald-700">{filteredInvoices.filter(i => i.paymentStatus === 'Fully Paid').length} contracts</strong></p>
              <p>• Outstanding: <strong className="text-rose-600">{filteredInvoices.filter(i => i.paymentStatus === 'Unpaid' || i.paymentStatus === 'Partially Paid').length} invoices</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
