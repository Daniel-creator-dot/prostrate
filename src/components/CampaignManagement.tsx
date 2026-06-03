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

      {/* Campaign Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(c => {
          const client = clients.find(cl => cl.id === c.clientId);
          const enrolledCount = participants.filter(p => p.campaignId === c.id).length;
          const completionPct = c.targetParticipantCount > 0
            ? Math.round((enrolledCount / c.targetParticipantCount) * 100)
            : 0;

          return (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition duration-150 p-6 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header Context */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {client ? client.name : 'Unknown Corp'}
                    </span>
                    <h4 className="font-bold font-display text-slate-900 text-base tracking-tight leading-snug">{c.name}</h4>
                  </div>

                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 font-mono tracking-tight leading-none border ${
                    c.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' :
                    c.status === 'In-Progress' ? 'bg-blue-50 text-blue-800 border-blue-150' :
                    c.status === 'Scheduled' ? 'bg-slate-50 text-slate-600 border-slate-150' :
                    'bg-rose-50 text-rose-800 border-rose-150'
                  }`}>
                    ● {c.status}
                  </span>
                </div>

                {/* Logistics breakdown */}
                <div className="space-y-2.5 pt-3.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono font-medium text-slate-700">{c.screeningDate}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-600 font-medium">{c.venue}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate italic text-slate-500 font-medium">Roster: {c.assignedTeam || 'None assigned'}</span>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="pt-4 space-y-2 border-t border-slate-100 mt-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 flex items-center gap-1 font-semibold">
                      <Users className="w-3.5 h-3.5" />
                      Registrants:
                    </span>
                    <strong className="text-slate-700 font-mono">
                      {enrolledCount} / {c.targetParticipantCount} <span className="text-slate-400 font-normal">({completionPct}%)</span>
                    </strong>
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

                {c.notes && (
                  <p className="text-[11px] text-slate-400 italic pt-2 line-clamp-2 leading-relaxed">
                    &ldquo;{c.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                {canEdit ? (
                  <button
                    onClick={() => handleEditClick(c)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-805 rounded-lg inline-flex items-center gap-1.5 transition"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configure Campaign
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-300 uppercase font-mono tracking-wider">Read Only Access</span>
                )}
              </div>
            </div>
          );
        })}
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
