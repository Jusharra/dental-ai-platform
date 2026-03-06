'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, CreditCard, CheckCircle, Clock, AlertCircle, ExternalLink, Send } from 'lucide-react'
import type { InsuranceVerification, Patient } from '@/types/database'

// CDT procedure definitions grouped by category
const CDT_GROUPS = [
  {
    label: 'Diagnostic',
    codes: [
      { key: 'd0150', code: 'D0150', name: 'Comprehensive Oral Exam' },
      { key: 'd0220', code: 'D0220', name: 'Periapical X-Ray (PA)' },
      { key: 'd0274', code: 'D0274', name: 'Bitewing X-Rays (BWX) — 4 films' },
      { key: 'd0210', code: 'D0210', name: 'Full Mouth X-Rays (FMX)' },
      { key: 'd0330', code: 'D0330', name: 'Panoramic X-Ray (PAN)' },
    ],
  },
  {
    label: 'Preventive',
    codes: [
      { key: 'd1110', code: 'D1110', name: 'Adult Prophy (Cleaning)' },
      { key: 'd1120', code: 'D1120', name: 'Child Prophy (Cleaning)' },
      { key: 'd1208', code: 'D1208', name: 'Fluoride Treatment' },
      { key: 'd1351', code: 'D1351', name: 'Sealants (per tooth)' },
    ],
  },
  {
    label: 'Basic (Restorative)',
    codes: [
      { key: 'd2140', code: 'D2140', name: 'Amalgam — 1 surface' },
      { key: 'd2150', code: 'D2150', name: 'Amalgam — 2 surfaces' },
      { key: 'd2391', code: 'D2391', name: 'Composite — 1 surface, posterior' },
      { key: 'd2392', code: 'D2392', name: 'Composite — 2 surfaces, posterior' },
      { key: 'd7140', code: 'D7140', name: 'Simple Extraction' },
      { key: 'd7210', code: 'D7210', name: 'Surgical Extraction' },
    ],
  },
  {
    label: 'Periodontal',
    codes: [
      { key: 'd4341', code: 'D4341', name: 'SRP — per quad (4+ teeth)' },
      { key: 'd4342', code: 'D4342', name: 'SRP — per quad (1–3 teeth)' },
      { key: 'd4910', code: 'D4910', name: 'Periodontal Maintenance' },
    ],
  },
  {
    label: 'Major (Restorative)',
    codes: [
      { key: 'd2740', code: 'D2740', name: 'Crown — All Ceramic' },
      { key: 'd2750', code: 'D2750', name: 'Crown — PFM' },
      { key: 'd6010', code: 'D6010', name: 'Implant Body' },
      { key: 'd6240', code: 'D6240', name: 'Implant Crown — PFM' },
      { key: 'd5110', code: 'D5110', name: 'Complete Denture — Upper' },
      { key: 'd5120', code: 'D5120', name: 'Complete Denture — Lower' },
      { key: 'd5211', code: 'D5211', name: 'Partial Denture — Resin' },
    ],
  },
  {
    label: 'Orthodontics',
    codes: [
      { key: 'd8080', code: 'D8080', name: 'Comprehensive Ortho — Child' },
      { key: 'd8090', code: 'D8090', name: 'Comprehensive Ortho — Adult' },
    ],
  },
]

type CdtEntry = { pct: string; freq: string; wait: string }
type CdtMap = Record<string, CdtEntry>

function initCdtMap(): CdtMap {
  const m: CdtMap = {}
  for (const g of CDT_GROUPS) {
    for (const c of g.codes) {
      m[c.key] = { pct: '', freq: '', wait: '' }
    }
  }
  return m
}

function coverageToMap(breakdown: Record<string, { pct?: number | null; freq?: string | null; wait?: string | null }> | null): CdtMap {
  const m = initCdtMap()
  if (!breakdown) return m
  for (const key of Object.keys(breakdown)) {
    if (m[key] !== undefined) {
      m[key] = {
        pct: breakdown[key].pct != null ? String(breakdown[key].pct) : '',
        freq: breakdown[key].freq ?? '',
        wait: breakdown[key].wait ?? '',
      }
    }
  }
  return m
}

function mapToBreakdown(map: CdtMap) {
  const out: Record<string, { pct: number | null; freq: string | null; wait: string | null }> = {}
  for (const [key, val] of Object.entries(map)) {
    if (val.pct !== '' || val.freq !== '') {
      out[key] = {
        pct: val.pct !== '' ? parseInt(val.pct, 10) : null,
        freq: val.freq || null,
        wait: val.wait || null,
      }
    }
  }
  return out
}

interface InsurancePanelProps {
  patient: Patient
  verifications: InsuranceVerification[]
}

export function InsurancePanel({ patient, verifications }: InsurancePanelProps) {
  const [sendEmail, setSendEmail] = useState(patient.email || '')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  const latest = verifications[0] ?? null

  async function handleSendForm() {
    if (!sendEmail) return
    setSending(true)
    setSendResult(null)
    const res = await fetch('/api/insurance/send-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patient.id, email: sendEmail }),
    })
    const data = await res.json()
    setSending(false)
    if (data.success) {
      setSendResult(data.warning ? `Sent (warning: ${data.warning})` : 'Verification form sent!')
    } else {
      setSendResult(`Error: ${data.error}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Send Form Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-orange-500" />
            Send Verification Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="Patient email address"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSendForm}
              disabled={sending || !sendEmail}
              className="bg-orange-500 hover:bg-orange-400 text-white"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Mail className="w-4 h-4 mr-2" />Send</>
              )}
            </Button>
          </div>
          {sendResult && (
            <p className={`text-xs mt-2 ${sendResult.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
              {sendResult}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Patient will receive a secure link valid for 7 days to complete their insurance information.
          </p>
        </CardContent>
      </Card>

      {/* Latest Verification Status */}
      {latest ? (
        <VerificationRecord verification={latest} />
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">No insurance verification on file.</p>
            <p className="text-xs text-muted-foreground mt-1">Send a verification form above to get started.</p>
          </CardContent>
        </Card>
      )}

      {/* Previous verifications */}
      {verifications.length > 1 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Previous Verifications ({verifications.length - 1})</h3>
          <div className="space-y-2">
            {verifications.slice(1).map((v) => (
              <div key={v.id} className="border rounded-lg p-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{v.p_insurance_carrier || 'Unknown carrier'}</span>
                  <span className="text-muted-foreground ml-2">{v.created_at.split('T')[0]}</span>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function VerificationRecord({ verification: v }: { verification: InsuranceVerification }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Staff form state
  const [planName, setPlanName] = useState(v.plan_name || '')
  const [networkType, setNetworkType] = useState(v.network_type || '')
  const [feeSchedule, setFeeSchedule] = useState(v.fee_schedule || '')
  const [effectiveDate, setEffectiveDate] = useState(v.effective_date || '')
  const [terminationDate, setTerminationDate] = useState(v.termination_date || '')
  const [annualMax, setAnnualMax] = useState(v.annual_maximum != null ? String(v.annual_maximum) : '')
  const [indDeductible, setIndDeductible] = useState(v.individual_deductible != null ? String(v.individual_deductible) : '')
  const [famDeductible, setFamDeductible] = useState(v.family_deductible != null ? String(v.family_deductible) : '')
  const [indDeductibleMet, setIndDeductibleMet] = useState(v.individual_deductible_met != null ? String(v.individual_deductible_met) : '')
  const [famDeductibleMet, setFamDeductibleMet] = useState(v.family_deductible_met != null ? String(v.family_deductible_met) : '')
  const [orthoMax, setOrthoMax] = useState(v.ortho_lifetime_max != null ? String(v.ortho_lifetime_max) : '')
  const [missingTooth, setMissingTooth] = useState(v.missing_tooth_clause)
  const [aob, setAob] = useState(v.aob_accepted)
  const [cdtMap, setCdtMap] = useState<CdtMap>(() => coverageToMap(v.coverage_breakdown))
  const [spokeTo, setSpokeTo] = useState(v.spoke_to || '')
  const [refNumber, setRefNumber] = useState(v.reference_number || '')
  const [verifiedDate, setVerifiedDate] = useState(v.verified_date || '')
  const [notes, setNotes] = useState(v.verification_notes || '')

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('insurance_verifications')
      .update({
        status: 'verified',
        plan_name: planName || null,
        network_type: networkType || null,
        fee_schedule: feeSchedule || null,
        effective_date: effectiveDate || null,
        termination_date: terminationDate || null,
        annual_maximum: annualMax ? parseFloat(annualMax) : null,
        individual_deductible: indDeductible ? parseFloat(indDeductible) : null,
        family_deductible: famDeductible ? parseFloat(famDeductible) : null,
        individual_deductible_met: indDeductibleMet ? parseFloat(indDeductibleMet) : null,
        family_deductible_met: famDeductibleMet ? parseFloat(famDeductibleMet) : null,
        ortho_lifetime_max: orthoMax ? parseFloat(orthoMax) : null,
        missing_tooth_clause: missingTooth,
        aob_accepted: aob,
        coverage_breakdown: mapToBreakdown(cdtMap),
        spoke_to: spokeTo || null,
        reference_number: refNumber || null,
        verified_date: verifiedDate || null,
        verification_notes: notes || null,
        staff_verified_at: new Date().toISOString(),
      })
      .eq('id', v.id)

    setSaving(false)
    setEditing(false)
    // Reload page to reflect updated data
    window.location.reload()
  }

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={v.status} />
          <span className="text-xs text-muted-foreground">
            {v.status === 'pending_patient' && `Sent ${v.sent_at ? v.sent_at.split('T')[0] : '—'} · Awaiting patient`}
            {v.status === 'pending_staff' && `Patient submitted ${v.patient_submitted_at?.split('T')[0]} · Awaiting staff verification`}
            {v.status === 'verified' && `Verified ${v.staff_verified_at?.split('T')[0]}`}
            {v.status === 'expired' && 'Link expired'}
          </span>
        </div>
        {(v.status === 'pending_staff' || v.status === 'verified') && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            {v.status === 'verified' ? 'Edit' : 'Complete Verification'}
          </Button>
        )}
      </div>

      {/* Patient-supplied section */}
      {(v.status === 'pending_staff' || v.status === 'verified') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Patient-Supplied Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <InfoRow label="Subscriber Name" value={v.p_subscriber_name} />
              <InfoRow label="Subscriber DOB" value={v.p_subscriber_dob} />
              <InfoRow label="Relationship" value={v.p_subscriber_relationship} />
              <InfoRow label="Insurance Carrier" value={v.p_insurance_carrier} />
              <InfoRow label="Member ID" value={v.p_member_id} />
              <InfoRow label="Group Number" value={v.p_group_number} />
            </div>
            {(v.p_card_front_url || v.p_card_back_url) && (
              <div className="flex gap-3 mt-4">
                {v.p_card_front_url && (
                  <a href={v.p_card_front_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-orange-600 hover:underline border border-orange-200 rounded-lg px-3 py-2 bg-orange-50">
                    <CreditCard className="w-3.5 h-3.5" />Card Front <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {v.p_card_back_url && (
                  <a href={v.p_card_back_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-orange-600 hover:underline border border-orange-200 rounded-lg px-3 py-2 bg-orange-50">
                    <CreditCard className="w-3.5 h-3.5" />Card Back <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Staff verification form */}
      {editing && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Staff Verification — Benefits Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Complete after calling the insurance company to verify benefits.</p>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Policy Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Policy Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Plan Name</Label>
                  <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Delta Premier" className="mt-1.5" />
                </div>
                <div>
                  <Label>Network</Label>
                  <select value={networkType} onChange={(e) => setNetworkType(e.target.value)}
                    className="mt-1.5 w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select...</option>
                    <option value="in_network">In-Network</option>
                    <option value="out_of_network">Out-of-Network</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <Label>Fee Schedule</Label>
                  <Input value={feeSchedule} onChange={(e) => setFeeSchedule(e.target.value)} placeholder="e.g. Table 3" className="mt-1.5" />
                </div>
                <div>
                  <Label>Effective Date</Label>
                  <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Termination Date</Label>
                  <Input type="date" value={terminationDate} onChange={(e) => setTerminationDate(e.target.value)} className="mt-1.5" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Maximums & Deductibles */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Maximums & Deductibles</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Annual Maximum ($)</Label>
                  <Input type="number" value={annualMax} onChange={(e) => setAnnualMax(e.target.value)} placeholder="1500" className="mt-1.5" />
                </div>
                <div>
                  <Label>Ortho Lifetime Max ($)</Label>
                  <Input type="number" value={orthoMax} onChange={(e) => setOrthoMax(e.target.value)} placeholder="1000" className="mt-1.5" />
                </div>
                <div>
                  <Label>Ind. Deductible ($)</Label>
                  <Input type="number" value={indDeductible} onChange={(e) => setIndDeductible(e.target.value)} placeholder="50" className="mt-1.5" />
                </div>
                <div>
                  <Label>Ind. Deductible Met ($)</Label>
                  <Input type="number" value={indDeductibleMet} onChange={(e) => setIndDeductibleMet(e.target.value)} placeholder="0" className="mt-1.5" />
                </div>
                <div>
                  <Label>Family Deductible ($)</Label>
                  <Input type="number" value={famDeductible} onChange={(e) => setFamDeductible(e.target.value)} placeholder="150" className="mt-1.5" />
                </div>
                <div>
                  <Label>Family Deductible Met ($)</Label>
                  <Input type="number" value={famDeductibleMet} onChange={(e) => setFamDeductibleMet(e.target.value)} placeholder="0" className="mt-1.5" />
                </div>
              </div>
              <div className="flex gap-6 mt-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={missingTooth} onChange={(e) => setMissingTooth(e.target.checked)} className="rounded" />
                  Missing Tooth Clause
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={aob} onChange={(e) => setAob(e.target.checked)} className="rounded" />
                  Assignment of Benefits (AOB)
                </label>
              </div>
            </div>

            <Separator />

            {/* CDT Coverage Breakdown */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">CDT Code Coverage Breakdown</h3>
              <p className="text-xs text-muted-foreground mb-4">Enter coverage % and frequency for each applicable procedure.</p>
              <div className="space-y-5">
                {CDT_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b">
                            <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium w-20">Code</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium">Procedure</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium w-20">Cov %</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium w-36">Frequency</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium w-32">Waiting Period</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.codes.map((c, idx) => {
                            const entry = cdtMap[c.key]
                            return (
                              <tr key={c.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="px-3 py-1.5 font-mono text-xs text-slate-500">{c.code}</td>
                                <td className="px-3 py-1.5 text-slate-700">{c.name}</td>
                                <td className="px-3 py-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={entry.pct}
                                    onChange={(e) => setCdtMap((m) => ({ ...m, [c.key]: { ...m[c.key], pct: e.target.value } }))}
                                    placeholder="—"
                                    className="w-16 border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                  />
                                </td>
                                <td className="px-3 py-1.5">
                                  <input
                                    type="text"
                                    value={entry.freq}
                                    onChange={(e) => setCdtMap((m) => ({ ...m, [c.key]: { ...m[c.key], freq: e.target.value } }))}
                                    placeholder="e.g. 2x/year"
                                    className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                  />
                                </td>
                                <td className="px-3 py-1.5">
                                  <input
                                    type="text"
                                    value={entry.wait}
                                    onChange={(e) => setCdtMap((m) => ({ ...m, [c.key]: { ...m[c.key], wait: e.target.value } }))}
                                    placeholder="e.g. 12 months"
                                    className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Verification Meta */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Verification Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Spoke To (Rep Name)</Label>
                  <Input value={spokeTo} onChange={(e) => setSpokeTo(e.target.value)} placeholder="Rep name" className="mt-1.5" />
                </div>
                <div>
                  <Label>Reference / Confirmation #</Label>
                  <Input value={refNumber} onChange={(e) => setRefNumber(e.target.value)} placeholder="Call reference #" className="mt-1.5" />
                </div>
                <div>
                  <Label>Date Verified</Label>
                  <Input type="date" value={verifiedDate} onChange={(e) => setVerifiedDate(e.target.value)} className="mt-1.5" />
                </div>
              </div>
              <div className="mt-4">
                <Label>Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes about the coverage, exclusions, pre-auth requirements..."
                  className="mt-1.5 w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-[2] bg-green-600 hover:bg-green-500 text-white">
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><CheckCircle className="w-4 h-4 mr-2" />Save & Mark Verified</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verified summary (read-only) */}
      {v.status === 'verified' && !editing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Verified Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <InfoRow label="Plan Name" value={v.plan_name} />
              <InfoRow label="Network" value={v.network_type?.replace('_', '-')} />
              <InfoRow label="Fee Schedule" value={v.fee_schedule} />
              <InfoRow label="Effective Date" value={v.effective_date} />
              <InfoRow label="Annual Maximum" value={v.annual_maximum != null ? `$${v.annual_maximum.toLocaleString()}` : null} />
              <InfoRow label="Ind. Deductible" value={v.individual_deductible != null ? `$${v.individual_deductible}` : null} />
              <InfoRow label="Deductible Met" value={v.individual_deductible_met != null ? `$${v.individual_deductible_met}` : null} />
              <InfoRow label="Spoke To" value={v.spoke_to} />
              <InfoRow label="Ref #" value={v.reference_number} />
            </div>
            {v.coverage_breakdown && Object.keys(v.coverage_breakdown).length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Coverage Breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(v.coverage_breakdown).map(([code, val]) => (
                    val.pct != null && (
                      <span key={code} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-mono">
                        {code.toUpperCase()}: {val.pct}%
                        {val.freq && <span className="text-slate-400">· {val.freq}</span>}
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending_patient: { label: 'Awaiting Patient', variant: 'secondary' },
    pending_staff: { label: 'Needs Review', variant: 'default' },
    verified: { label: 'Verified', variant: 'default' },
    expired: { label: 'Expired', variant: 'destructive' },
  }
  const config = map[status] ?? { label: status, variant: 'outline' }
  const icons: Record<string, React.ReactNode> = {
    pending_patient: <Clock className="w-3 h-3" />,
    pending_staff: <AlertCircle className="w-3 h-3" />,
    verified: <CheckCircle className="w-3 h-3" />,
    expired: <AlertCircle className="w-3 h-3" />,
  }

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {icons[status]}
      {config.label}
    </Badge>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value || '—'}</p>
    </div>
  )
}
