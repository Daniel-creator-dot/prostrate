/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  Edit,
  Building,
  ClipboardList,
  Compass,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Settings
} from 'lucide-react';
import { ScreeningCampaign, CorporateClient, Participant } from '../types';

interface CampaignManagementProps {
  campaigns: ScreeningCampaign[];
  clients: CorporateClient[];
  participants: Participant[];
  onAddCampaign: (campaign: Omit<ScreeningCampaign, 'id'>) => void;
  onEditCampaign: (campaign: ScreeningCampaign) => void;
  userRole: string;
}

export default function CampaignManagement({
  campaigns,
  clients,
  participants,
  onAddCampaign,
  onEditCampaign,
  userRole
}: CampaignManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<ScreeningCampaign | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [screeningDate, setScreeningDate] = useState('');
  const [venue, setVenue] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('');
  const [targetParticipantCount, setTargetParticipantCount] = useState(100);
  const [status, setStatus] = useState<ScreeningCampaign['status']>('Scheduled');
  const [notes, setNotes] = useState('');

  const canEdit = userRole === 'Super Administrator' || userRole === 'Administrator';

  const resetForm = () => {
    setName('');
    setClientId(clients[0]?.id || '');
    setScreeningDate('');
    setVenue('');
    setAssignedTeam('');
    setTargetParticipantCount(100);
    setStatus('Scheduled');
    setNotes('');
    setEditingCampaign(null);
  };

  const handleEditClick = (campaign: ScreeningCampaign) => {
    setEditingCampaign(campaign);
    setName(campaign.name);
    setClientId(campaign.clientId);
    setScreeningDate(campaign.screeningDate);
    setVenue(campaign.venue);
    setAssignedTeam(campaign.assignedTeam);
    setTargetParticipantCount(campaign.targetParticipantCount);
    setStatus(campaign.status);
    setNotes(campaign.notes);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId || !screeningDate || !venue) {
      alert('Please fill out all mandatory fields (Campaign Name, Corporate Client, Date, Venue)');
      return;
    }

    if (editingCampaign) {
      onEditCampaign({
        ...editingCampaign,
        name,
        clientId,
        screeningDate,
        venue,
        assignedTeam,
        targetParticipantCount: Number(targetParticipantCount),
        status,
        notes
      });
    } else {
      onAddCampaign({
        name,
        clientId,
        screeningDate,
        venue,
        assignedTeam,
        targetParticipantCount: Number(targetParticipantCount),
        status,
        notes
      });
    }
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="space-y-6" id="campaign-management-root">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">Outreach Screening Campaigns</h2>
          <p className="text-xs text-slate-400 mt-0.5">Schedule localized work campaigns, assign equipment and team rosters</p>
        </div>

        {canEdit && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold tracking-wide uppercase transition duration-150"
          >
            <Plus className="w-4 h-4" />
            Schedule Campaign
          </button>
        )}
      </div>

      {/* Campaign Listing Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <th className="py-3.5 px-5">Campaign Info</th>
                <th className="py-3.5 px-5">Employer Client</th>
                <th className="py-3.5 px-5">Screening Date</th>
                <th className="py-3.5 px-5">Venue Location</th>
                <th className="py-3.5 px-5">Roster / Team</th>
                <th className="py-3.5 px-5">Progress (Registrants / Target)</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {campaigns.length > 0 ? (
                campaigns.map(c => {
                  const client = clients.find(cl => cl.id === c.clientId);
                  const enrolledCount = participants.filter(p => p.campaignId === c.id).length;
                  const completionPct = c.targetParticipantCount > 0
                    ? Math.round((enrolledCount / c.targetParticipantCount) * 100)
                    : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      {/* Campaign Info */}
                      <td className="py-4 px-5">
                        <strong className="font-bold text-slate-900 text-sm block">{c.name}</strong>
                        {c.notes && <span className="text-[10px] text-slate-400 block italic max-w-[150px] truncate" title={c.notes}>{c.notes}</span>}
                      </td>

                      {/* Employer Client */}
                      <td className="py-4 px-5 font-semibold text-slate-700">
                        {client ? client.name : 'Unknown Corp'}
                      </td>

                      {/* Screening Date */}
                      <td className="py-4 px-5 font-mono text-slate-600 font-medium">
                        {c.screeningDate}
                      </td>

                      {/* Venue Location */}
                      <td className="py-4 px-5 truncate max-w-[150px] font-medium text-slate-600" title={c.venue}>
                        {c.venue}
                      </td>

                      {/* Roster / Team */}
                      <td className="py-4 px-5 italic text-slate-500 font-medium">
                        {c.assignedTeam || 'None assigned'}
                      </td>

                      {/* Progress Bar */}
                      <td className="py-4 px-5">
                        <div className="space-y-1.5 w-44">
                          <div className="flex justify-between items-center text-[10px] font-mono font-medium text-slate-500">
                            <span>{enrolledCount} / {c.targetParticipantCount}</span>
                            <span>{completionPct}%</span>
                          </div>
                          <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-slate-100">
                            <div
                              style={{ width: `${Math.min(100, completionPct)}%` }}
                              className={`flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-300 rounded-full ${
                                c.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                          c.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' :
                          c.status === 'In-Progress' ? 'bg-blue-50 text-blue-800 border-blue-150' :
                          c.status === 'Scheduled' ? 'bg-slate-50 text-slate-600 border-slate-150' :
                          'bg-rose-50 text-rose-800 border-rose-150'
                        }`}>
                          ● {c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex gap-2 justify-end">
                          {canEdit ? (
                            <button
                              onClick={() => handleEditClick(c)}
                              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Settings className="w-3 h-3" />
                              Configure
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-350 uppercase font-mono tracking-wider">Read-Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold bg-white">
                    No outreach screening campaigns scheduled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold font-display text-slate-900 tracking-tight text-lg">
                {editingCampaign ? 'Configure Outreach Campaign' : 'Schedule Screening Lifecycle'}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pacific Maritime fleet outreach screening 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Client *</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden bg-white text-slate-700"
                  >
                    <option value="" disabled>Select Company...</option>
                    {clients.filter(cl => !cl.isArchived).map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Date *</label>
                  <input
                    type="date"
                    required
                    value={screeningDate}
                    onChange={(e) => setScreeningDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Venue *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boardroom 12, Pier 54 Staff Lounge"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Assigned Team</label>
                  <input
                    type="text"
                    placeholder="e.g. Outreach Team B (Specialist Jenkins)"
                    value={assignedTeam}
                    onChange={(e) => setAssignedTeam(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Target Count</label>
                  <input
                    type="number"
                    min={1}
                    value={targetParticipantCount}
                    onChange={(e) => setTargetParticipantCount(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px] block mb-1">Status</label>
                <div className="flex gap-4">
                  {(['Scheduled', 'In-Progress', 'Completed', 'Cancelled'] as const).map(st => (
                    <label key={st} className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="campaignStatus"
                        value={st}
                        checked={status === st}
                        onChange={() => setStatus(st)}
                        className="text-blue-600 focus:ring-blue-500 scale-95"
                      />
                      <span className="text-xs text-slate-700">{st}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Specify refrigerator cold chain compliance, access badges, safety clearances..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl font-bold bg-white text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  {editingCampaign ? 'Save Changes' : 'Confirm Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
