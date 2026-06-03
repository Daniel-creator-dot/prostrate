/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  User,
  Building,
  Check,
  ShieldCheck,
  QrCode,
  Calendar,
  Phone,
  Mail,
  Users,
  Printer
} from 'lucide-react';
import { Participant, CorporateClient, ScreeningCampaign } from '../types';

interface ParticipantRegistrationProps {
  participants: Participant[];
  clients: CorporateClient[];
  campaigns: ScreeningCampaign[];
  onRegisterParticipant: (p: Omit<Participant, 'id' | 'registrationDate' | 'age'>) => void;
  onEditParticipant: (p: Participant) => void;
  userRole: string;
}

export default function ParticipantRegistration({
  participants,
  clients,
  campaigns,
  onRegisterParticipant,
  onEditParticipant,
  userRole
}: ParticipantRegistrationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  // Form Fields State
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  // Barcode Preview Modal
  const [activeBarcodeParticipant, setActiveBarcodeParticipant] = useState<Participant | null>(null);

  const canRegister = userRole === 'Super Administrator' || userRole === 'Administrator' || userRole === 'Registration Officer';

  const resetForm = () => {
    setEmployeeId('');
    setFullName('');
    setDob('');
    setPhone('');
    setEmail('');
    setDepartment('');
    setCompanyId(clients[0]?.id || '');
    setCampaignId(campaigns[0]?.id || '');
    setEmergencyContact('');
    setConsentConfirmed(false);
    setEditingParticipant(null);
  };

  const handleEditClick = (p: Participant) => {
    setEditingParticipant(p);
    setEmployeeId(p.employeeId);
    setFullName(p.fullName);
    setDob(p.dob);
    setPhone(p.phone);
    setEmail(p.email);
    setDepartment(p.department);
    setCompanyId(p.companyId);
    setCampaignId(p.campaignId);
    setEmergencyContact(p.emergencyContact);
    setConsentConfirmed(p.consentConfirmed);
    setShowModal(true);
  };

  const calculateAge = (birthdate: string): number => {
    if (!birthdate) return 0;
    const today = new Date('2026-06-03'); // Current context local date
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId || !fullName || !dob || !companyId || !campaignId) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    if (!consentConfirmed) {
      alert('Participant consent signature is MANDATORY to proceed with blood extraction clinical processes.');
      return;
    }

    // Duplicate detection: Ensure no duplicate employee identifier is logged for the same campaign (unless updating current)
    const duplicate = participants.find(part => 
      part.employeeId === employeeId && 
      part.campaignId === campaignId && 
      part.id !== editingParticipant?.id
    );

    if (duplicate) {
      alert(`Duplicate Registration Error: Employee ID ${employeeId} is already registered under this specific campaign.`);
      return;
    }

    // Compute nominal age limit
    const age = calculateAge(dob);

    if (editingParticipant) {
      onEditParticipant({
        ...editingParticipant,
        employeeId,
        fullName,
        dob,
        age,
        phone,
        email,
        department,
        companyId,
        campaignId,
        emergencyContact,
        consentConfirmed
      });
    } else {
      onRegisterParticipant({
        employeeId,
        fullName,
        dob,
        phone,
        email,
        department,
        companyId,
        campaignId,
        emergencyContact,
        consentConfirmed
      });
    }

    setShowModal(false);
    resetForm();
  };

  const activeCampaigns = campaigns.filter(c => c.status !== 'Completed' && c.status !== 'Cancelled');

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCampaign = selectedCampaignId === 'all' || p.campaignId === selectedCampaignId;

    return matchesSearch && matchesCampaign;
  });

  return (
    <div className="space-y-6" id="participant-registration-root">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">Staff / Participant Intake Registry</h2>
          <p className="text-xs text-slate-400 mt-0.5">Log employee consent forms and dispatch unique laboratory tracking codes</p>
        </div>

        {canRegister && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-2xs transition duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Check-In Participant
          </button>
        )}
      </div>

      {/* Query Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Employee ID, full name, or screening ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end font-sans">
          <label className="text-xs font-semibold text-slate-400">Filter Campaign:</label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden bg-white text-slate-700"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Register List - Responsive Table layout */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold text-[10px] font-sans uppercase tracking-widest">
                <th className="py-3.5 px-5">Screening ID</th>
                <th className="py-3.5 px-5">Employee ID</th>
                <th className="py-3.5 px-5">Full Name</th>
                <th className="py-3.5 px-5">DOB / Age</th>
                <th className="py-3.5 px-5">Corporate Client</th>
                <th className="py-3.5 px-5">Consent Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100 font-sans">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map(p => {
                  const client = clients.find(cl => cl.id === p.companyId);
                  const campaign = campaigns.find(c => c.id === p.campaignId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      {/* Screening ID */}
                      <td className="py-4 px-5 font-mono font-bold text-blue-600 tracking-tight whitespace-nowrap">
                        {p.id}
                      </td>

                      {/* Employee ID */}
                      <td className="py-4 px-5 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {p.employeeId}
                      </td>

                      {/* Full Name & Department */}
                      <td className="py-4 px-5 whitespace-nowrap font-medium text-slate-800">
                        <div className="font-semibold">{p.fullName}</div>
                        <span className="text-[10px] text-slate-400 font-medium font-sans block">{p.department}</span>
                      </td>

                      {/* DOB / Age */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-semibold text-slate-750">{p.dob}</div>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{p.age} years old</span>
                      </td>

                      {/* Company Campaign context */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-705 truncate max-w-[150px]">
                          {client ? client.name : 'Unknown'}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px] font-medium font-sans">
                          {campaign ? campaign.name : 'Unknown Campaign'}
                        </p>
                      </td>

                      {/* Consent Checkmark */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {p.consentConfirmed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full font-bold font-sans uppercase text-[9px] leading-none">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full font-bold font-sans uppercase text-[9px] leading-none">
                            Declined/Missing
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap font-sans">
                        <button
                          onClick={() => setActiveBarcodeParticipant(p)}
                          className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
                          title="Generate Clinical Barcode Dispatch Badge"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Barcode Badge
                        </button>

                        {canRegister && (
                          <button
                            onClick={() => handleEditClick(p)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg inline-flex items-center gap-0.5 transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans font-medium">
                    No matching screening candidate logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Preview Modal */}
      {activeBarcodeParticipant && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 relative font-sans">
            <button
              onClick={() => setActiveBarcodeParticipant(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
            >
              &times;
            </button>
            
            {/* Real printable bar card container */}
            <div className="border border-dashed border-slate-300 p-5 rounded-2xl text-center space-y-4" id="barcode-card-printable">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest font-sans block">PrimeCare Clinical Routing Lab Card</span>
              
              <div className="py-4 bg-slate-50 rounded-xl flex flex-col items-center justify-center space-y-2 border border-slate-200/60">
                {/* Simulated high fidelity barcode using flex grids */}
                <div className="flex bg-white py-4 px-6 border border-slate-200 rounded-sm shadow-3xs">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const sizes = [1, 3, 1, 4, 2, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 1, 4, 2, 1, 3];
                    const size = sizes[i % sizes.length];
                    return (
                      <span
                        key={i}
                        className="h-12 bg-slate-900 inline-block font-mono"
                        style={{ width: `${size}px`, marginRight: `${(i % 3 === 0) ? 2 : 1}px` }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 tracking-widest uppercase block">
                  *{activeBarcodeParticipant.id}*
                </span>
              </div>

              <div className="space-y-1 text-slate-500 text-xs">
                <p className="font-bold font-display text-slate-900 text-base tracking-tight">{activeBarcodeParticipant.fullName}</p>
                <p className="font-mono text-2xs truncate text-slate-500 font-medium">Employee ID: {activeBarcodeParticipant.employeeId}</p>
                <div className="flex justify-center gap-3 text-2xs font-mono pt-1">
                  <span>Age: {activeBarcodeParticipant.age}</span>
                  <span>•</span>
                  <span>DOB: {activeBarcodeParticipant.dob}</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-2xs font-mono text-slate-400">
                <span>Sample Routing Track</span>
                <span className="text-emerald-700 font-bold">Consent Verified ✓</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-950 inline-flex items-center justify-center gap-1.5 transition uppercase tracking-wider cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Lab Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intake check-in register modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-lg max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold font-display text-slate-900 tracking-tight text-lg">
                {editingParticipant ? 'Configure Registrant Profile' : 'Onsite Participant Intake'}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="p-3.5 bg-blue-50/50 rounded-xl flex items-center gap-2.5 border border-blue-100/50">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 select-none" />
                <span className="text-[11px] text-blue-700 font-sans font-medium leading-relaxed">
                  Assay logistics is strictly HIPAA compliant. Registered employee IDs stay localized to campaigning files.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Corporate Employer</label>
                  <select
                    value={companyId}
                    onChange={(e) => {
                      setCompanyId(e.target.value);
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden bg-white text-slate-700"
                  >
                    {clients.filter(cl => !cl.isArchived).map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Screening Campaign</label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden bg-white text-slate-700"
                  >
                    {activeCampaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 font-sans">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Corporate Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GH-0941"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50 font-mono text-slate-850"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alister Jenkins"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50 font-mono text-slate-850"
                  />
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Staff Department Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Shipping / Administration"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 font-sans">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1-555-092-2291"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Corporate Email Address</label>
                  <input
                    type="email"
                    placeholder="ajenkins@gothamcorp.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Emergency Contact Name & Phone</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins (+1-555-092-2339)"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                />
              </div>

              {/* Consent check form */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="consent" className="text-[11px] leading-relaxed text-slate-500 select-none cursor-pointer font-medium font-sans">
                  <strong>Patient Physical Consent Affirmation:</strong> I certify that the participant has voluntarily declared consent for the drawing of blood samples for total prostatic diagnostic immunochemistry and understands the results will be reviewed clinically. *
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-500 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-3xs cursor-pointer"
                >
                  {editingParticipant ? 'Save Demographics' : 'Register Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
