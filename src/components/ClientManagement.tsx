/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit,
  Archive,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  Briefcase,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { CorporateClient, BillingPackage, ScreeningCampaign } from '../types';

interface ClientManagementProps {
  clients: CorporateClient[];
  packages: BillingPackage[];
  campaigns: ScreeningCampaign[];
  onAddClient: (client: Omit<CorporateClient, 'id' | 'isArchived'>) => void;
  onEditClient: (client: CorporateClient) => void;
  onArchiveClient: (clientId: string) => void;
  onRestoreClient: (clientId: string) => void;
  userRole: string;
}

export default function ClientManagement({
  clients,
  packages,
  campaigns,
  onAddClient,
  onEditClient,
  onArchiveClient,
  onRestoreClient,
  userRole
}: ClientManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<CorporateClient | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [viewingClient, setViewingClient] = useState<CorporateClient | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [staffPopulation, setStaffPopulation] = useState(100);
  const [contractStatus, setContractStatus] = useState<CorporateClient['contractStatus']>('Pending');
  const [packageId, setPackageId] = useState(packages[0]?.id || '');
  const [notes, setNotes] = useState('');

  const canEdit = userRole === 'Super Administrator' || userRole === 'Administrator' || userRole === 'Accounts Officer';

  const resetForm = () => {
    setName('');
    setIndustry('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setStaffPopulation(100);
    setContractStatus('Pending');
    setPackageId(packages[0]?.id || '');
    setNotes('');
    setEditingClient(null);
  };

  const handleEditClick = (client: CorporateClient) => {
    setEditingClient(client);
    setName(client.name);
    setIndustry(client.industry);
    setContactPerson(client.contactPerson);
    setPhone(client.phone);
    setEmail(client.email);
    setAddress(client.address);
    setStaffPopulation(client.staffPopulation);
    setContractStatus(client.contractStatus);
    setPackageId(client.packageId);
    setNotes(client.notes);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !industry || !contactPerson || !email) {
      alert('Please fill out all mandatory fields (Company Name, Industry, Contact, Email)');
      return;
    }

    if (editingClient) {
      onEditClient({
        ...editingClient,
        name,
        industry,
        contactPerson,
        phone,
        email,
        address,
        staffPopulation: Number(staffPopulation),
        contractStatus,
        packageId,
        notes
      });
    } else {
      onAddClient({
        name,
        industry,
        contactPerson,
        phone,
        email,
        address,
        staffPopulation: Number(staffPopulation),
        contractStatus,
        packageId,
        notes
      });
    }
    setShowModal(false);
    resetForm();
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArchive = showArchived ? c.isArchived : !c.isArchived;

    return matchesSearch && matchesArchive;
  });

  return (
    <div className="space-y-6" id="client-management-root">
      {/* Top Bar with filtering */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">Corporate Client Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">Onboarding and logistics control board for hospital partnerships</p>
        </div>
        
        {/* Action moved into filter bar below for improved layout */}
      </div>

      {/* Filtering Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by company name, contact, industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
          />
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-xs inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold uppercase tracking-wider transition ${
              showArchived
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            {showArchived ? 'Viewing Archived Clients' : 'View Archived Clients'}
          </button>
          {canEdit && (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              Onboard Client
            </button>
          )}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('primecare:navigate', { detail: 'campaigns' }))}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold tracking-wide uppercase hover:bg-slate-50 transition ml-2"
            title="Go to Campaigns"
          >
            <Calendar className="w-3.5 h-3.5" />
            Campaigns
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <th className="py-3.5 px-5">Client Info</th>
                <th className="py-3.5 px-5">Contact Person</th>
                <th className="py-3.5 px-5">Package / Population</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {filteredClients.length > 0 ? (
                filteredClients.map(c => {
                  const clientPkg = packages.find(p => p.id === c.packageId);
                  const clientCampaigns = campaigns.filter(campaign => campaign.clientId === c.id);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      {/* Client Info */}
                      <td className="py-4 px-5">
                        <strong className="font-bold text-slate-900 text-sm block">{c.name}</strong>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">{c.industry}</span>
                      </td>

                      {/* Contact Person */}
                      <td className="py-4 px-5 font-semibold text-slate-700">
                        {c.contactPerson}
                      </td>

                      {/* Package / Population */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <strong className="text-blue-700 font-semibold">{clientPkg ? clientPkg.name : 'Unassigned'}</strong>
                          <span className="text-slate-400 font-mono text-[10px]">{c.staffPopulation} employees</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                          c.contractStatus === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' :
                          c.contractStatus === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-150' :
                          c.contractStatus === 'Suspended' ? 'bg-rose-50 text-rose-800 border-rose-150' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          ● {c.contractStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setViewingClient(c)}
                            className="px-2.5 py-1.5 text-[11px] text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 rounded-lg inline-flex items-center gap-1 font-semibold transition cursor-pointer"
                            title="View client details"
                          >
                            <User className="w-3 h-3" />
                            View
                          </button>

                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleEditClick(c)}
                                className="px-2.5 py-1.5 text-[11px] text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 rounded-lg inline-flex items-center gap-1 font-semibold transition cursor-pointer"
                                title="Update Profile"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </button>

                              <button
                                onClick={() => c.isArchived ? onRestoreClient(c.id) : onArchiveClient(c.id)}
                                className={`px-2.5 py-1.5 text-[11px] rounded-lg inline-flex items-center gap-1 font-semibold border transition cursor-pointer ${
                                  c.isArchived
                                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100'
                                }`}
                                title={c.isArchived ? 'Restore Client' : 'Archive Client'}
                              >
                                {c.isArchived ? (
                                  <>
                                    <RotateCcw className="w-3 h-3" />
                                    Restore
                                  </>
                                ) : (
                                  <>
                                    <Archive className="w-3 h-3" />
                                    Archive
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold bg-white">
                    No matching corporate client profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Profile Editor Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold font-display text-slate-900 tracking-tight text-lg">
                {editingClient ? 'Edit Corporate Profile' : 'Onboard New Corporate Client'}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gotham Holdings Inc."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Industry *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Logistics, Aerospace, finance"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marc Jacobs"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1-555-001-9281"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. outreach@gothamholdings.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Address</label>
                <textarea
                  rows={2}
                  placeholder="Street suite details, Zip Code and State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Staff Count</label>
                  <input
                    type="number"
                    min={1}
                    value={staffPopulation}
                    onChange={(e) => setStaffPopulation(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden transition bg-slate-50/50 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Package</label>
                  <select
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-hidden bg-white"
                  >
                    {packages.map(p => (
                       <option key={p.id} value={p.id}>
                        {p.name} (${p.unitCost}/person)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px] block mb-1">Contract Status</label>
                <div className="flex gap-4">
                  {(['Active', 'Pending', 'Expired', 'Suspended'] as const).map(status => (
                    <label key={status} className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="contractStatus"
                        value={status}
                        checked={contractStatus === status}
                        onChange={() => setContractStatus(status)}
                        className="text-blue-600 focus:ring-blue-500 scale-95"
                      />
                      <span className="text-xs text-slate-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Describe operational constraints, scheduling preferences or historical review patterns..."
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
                  {editingClient ? 'Submit Updates' : 'Confirm Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read-only view modal */}
      {viewingClient && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold font-display text-slate-900 tracking-tight text-lg">Client Details</h3>
              <button onClick={() => setViewingClient(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer">&times;</button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div>
                <div className="text-slate-500 text-[11px] uppercase font-semibold">Company</div>
                <div className="font-bold text-slate-900">{viewingClient.name}</div>
              </div>

              <div>
                <div className="text-slate-500 text-[11px] uppercase font-semibold">Contact</div>
                <div className="text-slate-800">{viewingClient.contactPerson} • {viewingClient.phone || 'N/A'}</div>
                <div className="text-slate-600 font-mono">{viewingClient.email}</div>
              </div>

              <div>
                <div className="text-slate-500 text-[11px] uppercase font-semibold">Address</div>
                <div className="text-slate-800">{viewingClient.address || 'N/A'}</div>
              </div>

              <div>
                <div className="text-slate-500 text-[11px] uppercase font-semibold">Notes</div>
                <div className="text-slate-800 whitespace-pre-wrap">{viewingClient.notes || '—'}</div>
              </div>

              <div className="text-right">
                <button onClick={() => setViewingClient(null)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
