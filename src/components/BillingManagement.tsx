/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Receipt,
  RotateCcw,
  Percent,
  CheckCircle,
  FileCheck,
  CreditCard,
  Building,
  User,
  Calendar,
  Layers,
  History,
  TrendingDown,
  Info
} from 'lucide-react';
import { Invoice, CorporateClient, ScreeningCampaign, BillingPackage } from '../types';

interface BillingManagementProps {
  invoices: Invoice[];
  clients: CorporateClient[];
  campaigns: ScreeningCampaign[];
  packages: BillingPackage[];
  onGenerateInvoice: (invoice: Omit<Invoice, 'id' | 'issuedDate' | 'payments' | 'outstandingBalance' | 'paymentStatus' | 'subtotal' | 'tax' | 'totalAmount'>) => void;
  onRecordPayment: (invoiceId: string, amount: number, method: 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash', ref: string) => void;
  userRole: string;
}

export default function BillingManagement({
  invoices,
  clients,
  campaigns,
  packages,
  onGenerateInvoice,
  onRecordPayment,
  userRole
}: BillingManagementProps) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<Invoice | null>(null);

  // Form Fields Issue Invoice State
  const [invoiceClientId, setInvoiceClientId] = useState('');
  const [invoiceCampaignId, setInvoiceCampaignId] = useState('');
  const [invoicePackageId, setInvoicePackageId] = useState('');
  const [invoiceNumberScreened, setInvoiceNumberScreened] = useState(1);
  const [invoiceUnitCost, setInvoiceUnitCost] = useState(0);
  const [dueDateInput, setDueDateInput] = useState('');

  // Form Fields Record Payment State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');

  const canEdit = userRole === 'Super Administrator' || userRole === 'Accounts Officer' || userRole === 'Administrator';

  const resetInvoiceForm = () => {
    setInvoiceClientId(clients[0]?.id || '');
    setInvoiceCampaignId(campaigns[0]?.id || '');
    setInvoicePackageId(packages[0]?.id || '');
    setInvoiceNumberScreened(1);
    const cost = packages[0]?.unitCost || 0;
    setInvoiceUnitCost(cost);
    setDueDateInput('');
  };

  const handleOpenIssueModal = () => {
    resetInvoiceForm();
    setShowGenerateModal(true);
  };

  const handleClientChange = (id: string) => {
    setInvoiceClientId(id);
    const client = clients.find(cl => cl.id === id);
    if (client) {
      setInvoicePackageId(client.packageId);
      const pkg = packages.find(p => p.id === client.packageId);
      if (pkg) {
        setInvoiceUnitCost(pkg.unitCost);
      }
    }
  };

  const handlePackageChange = (id: string) => {
    setInvoicePackageId(id);
    const pkg = packages.find(p => p.id === id);
    if (pkg) {
      setInvoiceUnitCost(pkg.unitCost);
    }
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceClientId || !invoiceCampaignId || !invoicePackageId || !dueDateInput) {
      alert('Verification Error: Please fill out all mandatory fields.');
      return;
    }

    onGenerateInvoice({
      clientId: invoiceClientId,
      campaignId: invoiceCampaignId,
      packageId: invoicePackageId,
      numberScreened: Number(invoiceNumberScreened),
      unitCost: Number(invoiceUnitCost),
      dueDate: dueDateInput
    });

    setShowGenerateModal(false);
  };

  const handleOpenPayment = (invoice: Invoice) => {
    setActiveInvoiceForPayment(invoice);
    setPaymentAmount(String(invoice.outstandingBalance));
    setPaymentRef('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoiceForPayment) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Accounting Error: Settlement values must be greater than $0.00.');
      return;
    }

    if (amount > activeInvoiceForPayment.outstandingBalance) {
      alert(`Accounting Error: Payment of $${amount.toFixed(2)} exceeds the actual outstanding invoices balance of $${activeInvoiceForPayment.outstandingBalance.toFixed(2)}.`);
      return;
    }

    if (!paymentRef.trim()) {
      alert('Accounting Error: A transaction reference (cheque number, wire confirmation) must be logged.');
      return;
    }

    onRecordPayment(activeInvoiceForPayment.id, amount, paymentMethod, paymentRef);
    setShowPaymentModal(false);
    setActiveInvoiceForPayment(null);
  };

  return (
    <div className="space-y-6" id="billing-management-root">
      {/* Financial Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest block font-sans uppercase">SECURED BILLINGS</span>
            <strong className="text-2xl text-emerald-600 font-bold font-mono">
              ${invoices.reduce((acc, curr) => acc + (curr.totalAmount - curr.outstandingBalance), 0).toFixed(2)}
            </strong>
            <span className="text-3xs text-emerald-500 font-medium block">Secured bank transfers</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest block font-sans uppercase">RECEIVABLES AGING</span>
            <strong className="text-2xl text-rose-600 font-bold font-mono">
              ${invoices.reduce((acc, curr) => acc + curr.outstandingBalance, 0).toFixed(2)}
            </strong>
            <span className="text-3xs text-rose-500 font-medium block">Invoices awaiting clearance</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1 font-sans">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest block font-sans uppercase">CONTRACTED TIER RATES</span>
            <strong className="text-xl text-slate-900 font-bold font-sans block">{packages.length} Tier Structures</strong>
            <span className="text-3xs text-slate-400 font-medium block">Multi-tenant volume rates configured</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Corporate Invoices Listing */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="font-bold font-display text-slate-900 text-sm tracking-tight flex items-center gap-1.5 font-sans">
              <Receipt className="w-4 h-4 text-blue-600" />
              Corporate Invoices & Billings Desk
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Manage Corporate Invoicing Lifecycles</p>
          </div>

          {canEdit && (
            <button
              onClick={handleOpenIssueModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Issue Campaign Invoice
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold text-[10px] font-sans uppercase tracking-widest">
                <th className="py-3.5 px-5">Invoice ID</th>
                <th className="py-3.5 px-5">Employer Client / Campaign</th>
                <th className="py-3.5 px-5">Price Package</th>
                <th className="py-3.5 px-5">Screened Count</th>
                <th className="py-3.5 px-5">Total Amount</th>
                <th className="py-3.5 px-5">Due Date</th>
                <th className="py-3.5 px-5">Outstanding Bal.</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100 font-sans">
              {invoices.length > 0 ? (
                invoices.map(inv => {
                  const client = clients.find(cl => cl.id === inv.clientId);
                  const campaign = campaigns.find(c => c.id === inv.campaignId);
                  const pkg = packages.find(p => p.id === inv.packageId);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition duration-150">
                      {/* Invoice ID */}
                      <td className="py-4 px-5 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {inv.id}
                      </td>

                      {/* Employer */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-800 block truncate max-w-[160px]">
                          {client ? client.name : 'Unknown Client'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[200px] font-medium">
                          {campaign ? campaign.name : 'Unknown Campaign'}
                        </span>
                      </td>

                      {/* Package */}
                      <td className="py-4 px-5 text-[11px] leading-relaxed">
                        <div className="font-bold text-slate-800">{pkg ? pkg.name : 'Custom'}</div>
                        <span className="text-[10px] text-slate-400 block font-mono font-medium">${inv.unitCost}/person rates</span>
                      </td>

                      {/* Number screened */}
                      <td className="py-4 px-5 font-mono text-center font-bold text-slate-800">
                        {inv.numberScreened}
                      </td>

                      {/* Total bill price */}
                      <td className="py-4 px-5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        ${inv.totalAmount.toFixed(2)}
                      </td>

                      {/* Due date */}
                      <td className="py-4 px-5 font-mono whitespace-nowrap text-2xs text-slate-500">
                        {inv.dueDate}
                      </td>

                      {/* Outstanding */}
                      <td className={`py-4 px-5 font-mono font-bold whitespace-nowrap ${
                        inv.outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        ${inv.outstandingBalance.toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          inv.paymentStatus === 'Fully Paid' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' :
                          inv.paymentStatus === 'Partially Paid' ? 'bg-amber-50 border border-amber-100 text-amber-800' :
                          'bg-rose-50 border border-rose-100 text-rose-800'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap font-sans">
                        {canEdit && inv.outstandingBalance > 0 ? (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Record Payment
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-end gap-1 font-sans">
                            ✓ Fully Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium font-sans">
                    No billing invoices generated.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Invoice Modal Form */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold font-display text-slate-900 tracking-tight text-base flex items-center gap-1.5">
                <Receipt className="w-5 h-5 text-blue-600 animate-pulse" />
                Issue Campaign Invoicing Statement
              </h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="space-y-1.5 font-sans">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Recipient Corporate Client *</label>
                <select
                  required
                  value={invoiceClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-hidden"
                >
                  <option value="" disabled>Select corporate debtor...</option>
                  {clients.filter(cl => !cl.isArchived).map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 font-sans">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Outreach Campaign *</label>
                  <select
                    required
                    value={invoiceCampaignId}
                    onChange={(e) => setInvoiceCampaignId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-hidden"
                  >
                    <option value="" disabled>Select outreach event...</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Contract Package Tier *</label>
                  <select
                    required
                    value={invoicePackageId}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-hidden"
                  >
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.unitCost})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Staff Screening Count *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={invoiceNumberScreened}
                    onChange={(e) => setInvoiceNumberScreened(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-base font-bold text-slate-800 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Unit Diagnostic Base Cost ($) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={invoiceUnitCost}
                    onChange={(e) => setInvoiceUnitCost(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-base font-bold text-slate-800 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 font-sans">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 bg-slate-50/50"
                  />
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl flex flex-col justify-center space-y-1.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Calculated Invoice Valuation</span>
                  <div className="text-xs text-slate-700 font-bold font-mono">
                    Subtotal: ${(invoiceNumberScreened * invoiceUnitCost).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Tax Prep (5%): ${(invoiceNumberScreened * invoiceUnitCost * 0.05).toFixed(2)}
                  </div>
                  <div className="text-sm text-indigo-700 font-extrabold font-mono border-t border-slate-200 pt-1.5 mt-1">
                    TOTAL: ${(invoiceNumberScreened * invoiceUnitCost * 1.05).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-500 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Publish Bill Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Settlement Modal Form */}
      {showPaymentModal && activeInvoiceForPayment && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-sm overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <h3 className="font-bold font-display text-slate-900 tracking-tight text-base flex items-center gap-1.5 text-emerald-600">
                <CreditCard className="w-4.5 h-4.5" />
                Settle Invoice Receivables
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 font-sans text-xs">
              <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl flex justify-between font-mono items-center">
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold tracking-wider uppercase">INVOICE PREVIEW</span>
                  <span className="font-bold text-slate-800 text-xs tracking-tight">{activeInvoiceForPayment.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block font-sans font-bold tracking-wider uppercase">OUTSTANDING</span>
                  <span className="font-bold text-rose-600 text-base leading-none block">${activeInvoiceForPayment.outstandingBalance.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Recording Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-base font-bold text-slate-800 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Clearing Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700"
                >
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Credit Card">Corporate Credit Card</option>
                  <option value="Cheque">Physical Cheque</option>
                  <option value="Cash">Petty Cash</option>
                </select>
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Bank / Cheque Transaction Reference ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WIRE_CHEVRON_882033"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-xs font-bold uppercase tracking-wide bg-slate-50/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-500 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Validate Settlement Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
