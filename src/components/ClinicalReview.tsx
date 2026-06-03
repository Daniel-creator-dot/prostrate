/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Activity,
  Heart,
  Calendar,
  Layers,
  Search,
  CheckSquare,
  AlertTriangle,
  UserCheck,
  Stethoscope,
  ChevronRight,
  ClipboardList,
  MapPin,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { PSATest, Participant, SpecialistReview, CorporateClient } from '../types';

interface ClinicalReviewProps {
  tests: PSATest[];
  participants: Participant[];
  reviews: SpecialistReview[];
  clients: CorporateClient[];
  onAddReview: (review: Omit<SpecialistReview, 'id' | 'reviewDate' | 'specialistName'>) => void;
  userRole: string;
}

export default function ClinicalReview({
  tests,
  participants,
  reviews,
  clients,
  onAddReview,
  userRole
}: ClinicalReviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string>('all');
  const [activeTestToReview, setActiveTestToReview] = useState<PSATest | null>(null);

  // Specialist Form Fields Action State
  const [observations, setObservations] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [requestRepeatTest, setRequestRepeatTest] = useState(false);
  const [referralClinic, setReferralClinic] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<SpecialistReview['status']>('Reviewed');

  const isSpecialist = userRole === 'Super Administrator' || userRole === 'Doctor / Specialist';

  // Filters tests matching reviews and searches
  const reviewableTests = tests.filter(t => {
    // Only allow reviewing tests once they have values
    if (t.psaValue === null) return false;
    
    // Auto flag if psaValue is >= 4.0 (borderline/elevated) or already has a review
    const hasReview = reviews.some(r => r.testId === t.id);
    return t.classification !== 'Normal' || hasReview;
  });

  const handleOpenReview = (test: PSATest) => {
    setActiveTestToReview(test);
    const existing = reviews.find(r => r.testId === test.id);
    if (existing) {
      setObservations(existing.clinicalObservations);
      setRecommendations(existing.recommendations);
      setRequestRepeatTest(existing.requestRepeatTest);
      setReferralClinic(existing.scheduleReferral);
      setFollowUpStatus(existing.status);
    } else {
      setObservations('');
      setRecommendations('');
      setRequestRepeatTest(false);
      setReferralClinic('');
      // Default to Follow-Up Required if elevated
      setFollowUpStatus(test.classification === 'Elevated' ? 'Follow-Up Required' : 'Reviewed');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTestToReview) return;

    if (!observations.trim() || !recommendations.trim()) {
      alert('Verification Error: Clinical observations and follow up recommendations are required fields.');
      return;
    }

    onAddReview({
      testId: activeTestToReview.id,
      participantId: activeTestToReview.participantId,
      clinicalObservations: observations,
      recommendations,
      requestRepeatTest,
      scheduleReferral: referralClinic.trim() || 'None',
      status: followUpStatus
    });

    setActiveTestToReview(null);
    setObservations('');
    setRecommendations('');
    setRequestRepeatTest(false);
    setReferralClinic('');
  };

  const filteredReviewTests = reviewableTests.filter(t => {
    const p = participants.find(part => part.id === t.participantId);
    const matchesSearch = p ? p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    
    const linkedReview = reviews.find(r => r.testId === t.id);
    const revStatus = linkedReview ? linkedReview.status : 'Pending Review';

    const matchesStatus = selectedReviewStatus === 'all' || 
      (selectedReviewStatus === 'Pending Review' && !linkedReview) ||
      (linkedReview && revStatus === selectedReviewStatus);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="clinical-review-root">
      {/* Clinician Overview Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">CRITICAL CASEWORK</span>
            <strong className="text-2xl text-slate-900 font-bold font-mono">
              {reviewableTests.filter(t => !reviews.some(r => r.testId === t.id)).length} pending
            </strong>
            <span className="text-[10px] text-rose-500 font-medium block">Requires physician authorization</span>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
            <Stethoscope className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">FOLLOW-UP ACTIVE</span>
            <strong className="text-2xl text-slate-900 font-bold font-mono">
              {reviews.filter(r => r.status === 'Follow-Up Required' || r.status === 'Referred').length} cases
            </strong>
            <span className="text-[10px] text-slate-400 font-medium block">Outpatient scheduling ongoing</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Activity className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">CASES CONCLUDED</span>
            <strong className="text-2xl text-slate-900 font-bold font-mono">
              {reviews.filter(r => r.status === 'Closed' || r.status === 'Reviewed').length} files
            </strong>
            <span className="text-[10px] text-emerald-600 font-medium block">Patient files compiled</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <ShieldCheck className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Specialist Workspace Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="font-bold font-display text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              Prosthetic Biomarker Specialised Clinic desk
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">Filter flags for patients with PSA &ge; 4.0 ng/m<span className="normal-case">L</span></p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search participant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden text-slate-700 bg-white"
              />
            </div>

            <select
              value={selectedReviewStatus}
              onChange={(e) => setSelectedReviewStatus(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 cursor-pointer text-slate-700 rounded-lg focus:outline-hidden"
            >
              <option value="all">View All Flagged Cases</option>
              <option value="Pending Review">Pending Specialist Feedback</option>
              <option value="Reviewed">Reviewed & Standard</option>
              <option value="Follow-Up Required">Follow-Up Formulated</option>
              <option value="Referred">Referred out to Urology specialty</option>
              <option value="Closed">Assessment case closed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <th className="py-3.5 px-5">Screening ID</th>
                <th className="py-3.5 px-5">Demographics</th>
                <th className="py-3.5 px-5">Employer Client</th>
                <th className="py-3.5 px-5">Measured PSA Value</th>
                <th className="py-3.5 px-5">Specialist Diagnosis Status</th>
                <th className="py-3.5 px-5">Critical Referrals</th>
                <th className="py-3.5 px-5 text-right">Observation Desk</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {filteredReviewTests.length > 0 ? (
                filteredReviewTests.map(t => {
                  const participant = participants.find(p => p.id === t.participantId);
                  const client = participant ? clients.find(cl => cl.id === participant.companyId) : null;
                  const review = reviews.find(r => r.testId === t.id);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="py-4 px-5 font-mono font-bold text-blue-600 tracking-tight whitespace-nowrap">
                        {t.participantId}
                      </td>

                      <td className="py-4 px-5">
                        {participant ? (
                          <div>
                            <span className="font-semibold text-slate-800">{participant.fullName}</span>
                            <span className="text-[10px] text-slate-400 block font-medium">Age {participant.age} • DOB {participant.dob}</span>
                          </div>
                        ) : (
                          <span className="text-rose-500 font-mono font-bold">Unknown</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-700">{client ? client.name : 'Unknown'}</span>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="font-mono bg-rose-50 border border-rose-100 text-rose-800 font-bold px-2.5 py-1 text-xs rounded-lg inline-block">
                          {t.psaValue !== null ? t.psaValue.toFixed(2) : '--'} ng/mL
                        </span>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        {review ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            review.status === 'Reviewed' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' :
                            review.status === 'Follow-Up Required' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                            review.status === 'Referred' ? 'bg-indigo-50 border border-indigo-100 text-indigo-800' :
                            'bg-slate-50 border border-slate-200 text-slate-600'
                          }`}>
                            {review.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 border border-rose-100 text-rose-800 animate-pulse">
                            Awaiting Assessment
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 truncate max-w-[150px] text-[11px] text-slate-500 italic font-medium">
                        {review && review.scheduleReferral !== 'None' ? (
                          <span className="inline-flex items-center gap-1.5" title={review.scheduleReferral}>
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {review.scheduleReferral}
                          </span>
                        ) : (
                          <span className="text-slate-400 not-italic">No active referrals</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {isSpecialist ? (
                          <button
                            onClick={() => handleOpenReview(t)}
                            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            {review ? 'Update Diagnosis' : 'Diagnose Case'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Physician Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No clinical risk profiles flagged in active laboratory registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Specialist Review Intake Modal Form */}
      {activeTestToReview && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between animate-fade-in">
              <h3 className="font-bold font-display text-slate-900 tracking-tight text-base flex items-center gap-1.5">
                <Stethoscope className="w-5 h-5 text-blue-600 shrink-0" />
                Specialist Diagnostic Assessment
              </h3>
              <button onClick={() => setActiveTestToReview(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-xl justify-between">
                <div>
                  <span className="text-slate-400 block font-semibold tracking-wider uppercase text-[9px] mb-0.5">PATIENT DEMOGRAPHICS</span>
                  <strong className="text-slate-900 text-xs font-bold leading-none block">
                    {participants.find(p => p.id === activeTestToReview.participantId)?.fullName}
                  </strong>
                  <p className="text-[10px] font-mono text-slate-450 mt-1 font-semibold uppercase">
                    Screen ID: {activeTestToReview.participantId} • Age {participants.find(p => p.id === activeTestToReview.participantId)?.age}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 block font-semibold tracking-wider uppercase text-[9px] mb-0.5">TOTAL PSA VALUE</span>
                  <strong className="text-sm font-mono font-bold text-rose-600 block leading-none">
                    {activeTestToReview.psaValue !== null ? activeTestToReview.psaValue.toFixed(2) : '--'} ng/mL
                  </strong>
                  <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase font-bold tracking-wider">
                    {activeTestToReview.classification}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Physician Clinical Observations *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Annotate prostate density markers, urinary baseline, or historical evaluations..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Follow-Up Clinical Recommendations *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Recommend diagnostic repeat timeframes, transrectal ultrasound details or prostate biopsies..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="repeatTest"
                    checked={requestRepeatTest}
                    onChange={(e) => setRequestRepeatTest(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded-lg cursor-pointer"
                  />
                  <label htmlFor="repeatTest" className="text-slate-600 font-bold cursor-pointer select-none text-[11px] leading-relaxed">
                    Request Bioassay Repeat Rerunning
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Referral Diagnostics Clinic, if any</label>
                  <input
                    type="text"
                    placeholder="e.g. PrimeCare Urology Hub"
                    value={referralClinic}
                    onChange={(e) => setReferralClinic(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-400 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Diagnosis Validation Status Override</label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {(['Reviewed', 'Follow-Up Required', 'Referred', 'Closed'] as const).map(st => (
                    <label key={st} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewStatus"
                        value={st}
                        checked={followUpStatus === st}
                        onChange={() => setFollowUpStatus(st)}
                        className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-slate-600 text-xs font-semibold">{st}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTestToReview(null)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-500 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Submit Clinical Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
