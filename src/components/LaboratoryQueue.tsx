/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  Award,
  AlertOctagon,
  Clock,
  RefreshCw,
  Edit,
  Save,
  CheckCircle,
  HelpCircle,
  History,
  TrendingDown,
  User,
  FlaskConical,
  ListFilter
} from 'lucide-react';
import { PSATest, Participant, CorporateClient } from '../types';

interface LaboratoryQueueProps {
  tests: PSATest[];
  participants: Participant[];
  clients: CorporateClient[];
  onUploadResult: (testId: string, value: number, remark: string) => void;
  onModifyResultWithHistory: (testId: string, newValue: number, reason: string) => void;
  userRole: string;
}

export default function LaboratoryQueue({
  tests,
  participants,
  clients,
  onUploadResult,
  onModifyResultWithHistory,
  userRole
}: LaboratoryQueueProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTestIdForm, setActiveTestIdForm] = useState<string | null>(null);
  const [psaValueInput, setPsaValueInput] = useState<string>('');
  const [remarksInput, setRemarksInput] = useState<string>('');
  
  // Correction Mode States
  const [correctionTestId, setCorrectionTestId] = useState<string | null>(null);
  const [correctionValue, setCorrectionValue] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // History viewer state
  const [viewHistoryTest, setViewHistoryTest] = useState<PSATest | null>(null);

  const canEdit = userRole === 'Super Administrator' || userRole === 'Laboratory Officer' || userRole === 'Doctor / Specialist';

  const classifyPSA = (val: number): PSATest['classification'] => {
    if (val < 4.0) return 'Normal';
    if (val >= 4.0 && val < 10.0) return 'Borderline';
    return 'Elevated'; // automatically flags for review
  };

  const handleOpenForm = (test: PSATest) => {
    setActiveTestIdForm(test.id);
    setPsaValueInput(test.psaValue !== null ? String(test.psaValue) : '');
    setRemarksInput(test.remarks || '');
  };

  const handleOpenCorrection = (test: PSATest) => {
    setCorrectionTestId(test.id);
    setCorrectionValue(test.psaValue !== null ? String(test.psaValue) : '');
    setCorrectionReason('');
  };

  const submitResult = (e: React.FormEvent, testId: string) => {
    e.preventDefault();
    const value = parseFloat(psaValueInput);
    if (isNaN(value) || value < 0) {
      alert('Clinical Error: PSA values must be registered as positive numeric values (ng/mL).');
      return;
    }

    if (value > 250) {
      const confirmExceeds = window.confirm(`Assay Calibration Warning: PSA value is extremely high (${value} ng/mL). Please confirm sample dilution calibration is accurate before final recording.`);
      if (!confirmExceeds) return;
    }

    onUploadResult(testId, value, remarksInput);
    setActiveTestIdForm(null);
    setPsaValueInput('');
    setRemarksInput('');
  };

  const submitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTestId) return;

    const value = parseFloat(correctionValue);
    if (isNaN(value) || value < 0) {
      alert('Clinical Error: Corrected PSA values must be positive numeric values.');
      return;
    }

    if (!correctionReason.trim()) {
      alert('Regulatory Error: Quality compliance rules dictate a justification reason must be logged to correct medical records.');
      return;
    }

    onModifyResultWithHistory(correctionTestId, value, correctionReason);
    setCorrectionTestId(null);
    setCorrectionValue('');
    setCorrectionReason('');
  };

  const filteredTests = tests.filter(t => {
    if (filterStatus === 'pending') {
      return t.status !== 'Completed';
    }
    if (filterStatus === 'completed') {
      return t.status === 'Completed';
    }
    return true;
  });

  return (
    <div className="space-y-6" id="laboratory-queue-root">
      {/* Upper Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FlaskConical className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">PENDING SAMPLES</span>
            <strong className="text-xl text-slate-900 font-bold font-mono">
              {tests.filter(t => t.status !== 'Completed').length} vial{tests.filter(t => t.status !== 'Completed').length !== 1 ? 's' : ''}
            </strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">COMPLETED ASSAYS</span>
            <strong className="text-xl text-slate-900 font-bold font-mono">
              {tests.filter(t => t.status === 'Completed').length} records
            </strong>
          </div>
        </div>

        {/* Classification rules reference card */}
        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 col-span-1 md:col-span-2 text-[10px] font-mono text-slate-500 flex flex-col justify-center space-y-1">
          <span className="font-bold text-slate-700 uppercase tracking-wider mb-1">PSA Threshold Rules:</span>
          <p>• Normal Segment: &lt; 4.0 ng/mL</p>
          <p>• Borderline Segment: 4.0 ng/mL - 9.9 ng/mL (Flagged for basic review)</p>
          <p>• Elevated Segment: &ge; 10.0 ng/mL (Requires Clinical Specialist Intervention)</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table header with filters */}
        <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h3 className="font-bold font-display text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-blue-600" />
            Lab Testing Queue
          </h3>

          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-white border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 rounded-lg focus:outline-hidden cursor-pointer"
            >
              <option value="all">View All Samples</option>
              <option value="pending">Awaiting Lab Values</option>
              <option value="completed">Completed Analytes</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <th className="py-3.5 px-5">Sample ID</th>
                <th className="py-3.5 px-5">Participant Detail</th>
                <th className="py-3.5 px-5">Collection Date</th>
                <th className="py-3.5 px-5">Laboratory Status</th>
                <th className="py-3.5 px-5">Registered PSA Value</th>
                <th className="py-3.5 px-5">Assigned Classification</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {filteredTests.length > 0 ? (
                filteredTests.map(t => {
                  const participant = participants.find(p => p.id === t.participantId);
                  const client = participant ? clients.find(cl => cl.id === participant.companyId) : null;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition duration-150">
                      {/* Sample ID */}
                      <td className="py-4 px-5 font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs tracking-tight">{t.sampleId}</div>
                        <span className="text-[10px] text-slate-400 block font-medium">Vial Ref: {t.id}</span>
                      </td>

                      {/* Participant */}
                      <td className="py-4 px-5">
                        {participant ? (
                          <div>
                            <span className="font-semibold text-slate-800">{participant.fullName}</span>
                            <span className="text-[10px] text-slate-400 block font-medium truncate max-w-[200px]">
                              {client?.name} (Emp ID: {participant.employeeId})
                            </span>
                          </div>
                        ) : (
                          <span className="text-rose-500 font-mono font-bold">Unidentified participant</span>
                        )}
                      </td>

                      {/* Collection Date */}
                      <td className="py-4 px-5 font-mono text-2xs text-slate-500 whitespace-nowrap">
                        {t.collectionDate}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          t.status === 'Completed' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' :
                          t.status === 'Sample Collected' ? 'bg-indigo-50 border border-indigo-100 text-indigo-800' :
                          t.status === 'Processing' ? 'bg-amber-50 border border-amber-100 text-amber-800' :
                          'bg-slate-50 border border-slate-200 text-slate-600'
                        }`}>
                          {t.status}
                        </span>
                      </td>

                      {/* Registered PSA */}
                      <td className="py-4 px-5 font-mono whitespace-nowrap">
                        {t.psaValue !== null ? (
                          <strong className="text-slate-900 text-xs font-bold">{t.psaValue.toFixed(2)} <span className="text-[9px] text-slate-400 font-normal">ng/mL</span></strong>
                        ) : (
                          <span className="text-slate-355 italic font-medium">pending analysis</span>
                        )}
                      </td>

                      {/* Classification */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          t.classification === 'Normal' ? 'bg-emerald-50 text-emerald-700' :
                          t.classification === 'Borderline' ? 'bg-amber-50 text-amber-700' :
                          t.classification === 'Elevated' || t.classification === 'Requires Specialist Review' ? 'bg-rose-50 text-rose-750 font-bold' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {t.classification}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap space-x-1.5">
                        {/* History button if corrections lookups exist */}
                        {t.history.length > 0 && (
                          <button
                            onClick={() => setViewHistoryTest(t)}
                            className="px-2 py-1 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-1 hover:bg-slate-100 cursor-pointer text-[10px] font-mono font-bold uppercase transition"
                            title="Audit Corrections Trail"
                          >
                            <History className="w-3.5 h-3.5" />
                            {t.history.length} corrections
                          </button>
                        )}

                        {canEdit && (
                          <>
                            {t.status !== 'Completed' ? (
                              <button
                                onClick={() => handleOpenForm(t)}
                                className="px-2.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition inline-flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                              >
                                <FlaskConical className="w-3.5 h-3.5" />
                                Run Assay
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenCorrection(t)}
                                className="px-2.5 py-1.5 text-xs border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-semibold text-slate-600 transition inline-flex items-center gap-1 cursor-pointer"
                                title="Clinically Correct Bioassay Result"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Correct Value
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No matching clinical samples in target workspace directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assay Entrance Modal Form */}
      {activeTestIdForm && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <h3 className="font-bold font-display text-slate-900 tracking-tight text-base flex items-center gap-1.5">
                <FlaskConical className="w-4.5 h-4.5 text-blue-600" />
                Register Assay Result
              </h3>
              <button onClick={() => setActiveTestIdForm(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer">&times;</button>
            </div>

            <form onSubmit={(e) => submitResult(e, activeTestIdForm)} className="space-y-4 text-xs">
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-850 space-y-1">
                <p>Assumed Chemical Method: <strong>Chemiluminescence Immunoassay (CLIA)</strong></p>
                <p className="text-[10px] text-indigo-600">Verify vial numbers match the computer screen before submitting!</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Total Prostate Specific Antigen (ng/mL) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1.25, 4.54, 15.02"
                  value={psaValueInput}
                  onChange={(e) => setPsaValueInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-base font-bold text-slate-800 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Lab Remarks / Chemical Anomalies</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared calibration standards with minimal variance."
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTestIdForm(null)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-500 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  Publish Lab Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Correction Form with Clinical Override Justification */}
      {correctionTestId && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <h3 className="font-bold font-display text-slate-900 tracking-tight text-base flex items-center gap-1.5 text-amber-600">
                <AlertOctagon className="w-4.5 h-4.5 text-amber-500" />
                Correct Assay Record
              </h3>
              <button onClick={() => setCorrectionTestId(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer">&times;</button>
            </div>

            <form onSubmit={submitCorrection} className="space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl text-amber-850 leading-relaxed text-[10px] font-mono">
                🛑 <strong>Compliance Notice:</strong> Corrections are audit-tracked. Permitted only for measurement errors, sample swaps, or calibration issues. Previous values are permanently archived.
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Corrected PSA Antigen Metric (ng/mL) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={correctionValue}
                  onChange={(e) => setCorrectionValue(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-base font-bold text-slate-800 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Correction Reason *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe why override is medically and logistically required..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCorrectionTestId(null)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-500 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Validate & Log Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Lookup Modal */}
      {viewHistoryTest && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold font-display text-slate-900 tracking-tight text-base flex items-center gap-1.5">
                <History className="w-4.5 h-4.5 text-blue-600" />
                Correction Log
              </h3>
              <button onClick={() => setViewHistoryTest(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer">&times;</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 px-3 py-2 text-[11px] font-medium rounded-lg text-slate-500 border border-slate-200">
                Tracking history for: <strong>Sample Ref: {viewHistoryTest.sampleId}</strong> (Vial ID: {viewHistoryTest.id})
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {viewHistoryTest.history.map((h, i) => (
                  <div key={i} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>Log date: {h.timestamp}</span>
                      <span className="font-bold text-slate-500">Modified by: {h.modifiedBy}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-slate-400 font-medium">Correction values:</span>
                      <strong className="font-mono text-slate-800">
                        {h.prevValue !== null ? h.prevValue.toFixed(2) : 'N/A'} ng/mL &rarr; {h.newValue !== null ? h.newValue.toFixed(2) : 'N/A'} ng/mL
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                      &ldquo;{h.reason}&rdquo;
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewHistoryTest(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold cursor-pointer uppercase tracking-wider text-[10px]"
                >
                  Close Audit Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
