import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buildReport, type ReportType, type ExecutiveData, type CallPerformanceData, type ConfirmationData, type RecallData, type InsuranceData } from '@/lib/reports'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:        { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header:      { marginBottom: 24 },
  brand:       { fontSize: 9, color: '#6b7280', marginBottom: 4 },
  title:       { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 2 },
  subtitle:    { fontSize: 10, color: '#6b7280' },
  divider:     { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginVertical: 16 },
  section:     { marginBottom: 20 },
  sectionTitle:{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 10 },
  kpiRow:      { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpiCard:     { flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  kpiLabel:    { fontSize: 8, color: '#6b7280', marginBottom: 3, textTransform: 'uppercase' },
  kpiValue:    { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  kpiSub:      { fontSize: 8, color: '#94a3b8', marginTop: 1 },
  table:       { width: '100%', marginTop: 6 },
  tableHead:   { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 2 },
  tableRow:    { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  thCell:      { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#475569', flex: 1 },
  tdCell:      { fontSize: 9, color: '#0f172a', flex: 1 },
  footer:      { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:  { fontSize: 8, color: '#9ca3af' },
  badge:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  badgeText:   { fontSize: 8, fontFamily: 'Helvetica-Bold' },
})

function fmtCents(c: number) { return `$${(c / 100).toFixed(2)}` }
function fmtSecs(s: number)  { return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s` }
function fmtDate(d: string)  { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
function capitalize(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }

// ─── PDF Components ───────────────────────────────────────────────────────────
function Header({ title, practiceName, start, end }: { title: string; practiceName: string; start: string; end: string }) {
  return (
    <View style={s.header}>
      <Text style={s.brand}>FIRST-CHOICE CYBER · DENTAL AI GROWTH SYSTEM</Text>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{practiceName} · {fmtDate(start)} – {fmtDate(end)}</Text>
      <View style={s.divider} />
    </View>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={s.kpiCard}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={s.kpiValue}>{value}</Text>
      {sub && <Text style={s.kpiSub}>{sub}</Text>}
    </View>
  )
}

function Footer({ page }: { page: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Generated {new Date().toLocaleDateString()} · Confidential</Text>
      <Text style={s.footerText}>Page {page}</Text>
    </View>
  )
}

// ─── Report Pages ─────────────────────────────────────────────────────────────
function CallPerformancePage({ data, practiceName, start, end }: { data: CallPerformanceData; practiceName: string; start: string; end: string }) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Call Performance Report" practiceName={practiceName} start={start} end={end} />
      <View style={s.kpiRow}>
        <KpiCard label="Total Calls" value={String(data.total_calls)} />
        <KpiCard label="Total Cost" value={fmtCents(data.total_cost_cents)} sub={data.total_calls ? `${fmtCents(Math.round(data.total_cost_cents / data.total_calls))} avg/call` : undefined} />
        <KpiCard label="Avg Duration" value={fmtSecs(data.avg_duration_seconds)} />
        <KpiCard label="Total Talk Time" value={fmtSecs(data.total_duration_seconds)} />
      </View>

      {/* By Type */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Calls by Type</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            {['Call Type', 'Count', 'Avg Duration', 'Total Cost'].map(h => <Text key={h} style={s.thCell}>{h}</Text>)}
          </View>
          {Object.entries(data.by_type).map(([type, v]) => (
            <View key={type} style={s.tableRow}>
              <Text style={s.tdCell}>{capitalize(type)}</Text>
              <Text style={s.tdCell}>{v.count}</Text>
              <Text style={s.tdCell}>{fmtSecs(v.count ? Math.round(v.duration_s / v.count) : 0)}</Text>
              <Text style={s.tdCell}>{fmtCents(v.cost_cents)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* By Outcome */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Call Outcomes</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            {['Outcome', 'Count', '% of Total'].map(h => <Text key={h} style={s.thCell}>{h}</Text>)}
          </View>
          {Object.entries(data.by_outcome).sort(([,a],[,b]) => b - a).map(([outcome, count]) => (
            <View key={outcome} style={s.tableRow}>
              <Text style={s.tdCell}>{capitalize(outcome)}</Text>
              <Text style={s.tdCell}>{count}</Text>
              <Text style={s.tdCell}>{data.total_calls ? `${Math.round((count / data.total_calls) * 100)}%` : '—'}</Text>
            </View>
          ))}
        </View>
      </View>
      <Footer page={1} />
    </Page>
  )
}

function ConfirmationPage({ data, practiceName, start, end }: { data: ConfirmationData; practiceName: string; start: string; end: string }) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Appointment Confirmation Report" practiceName={practiceName} start={start} end={end} />
      <View style={s.kpiRow}>
        <KpiCard label="Calls Sent" value={String(data.total_outbound)} />
        <KpiCard label="Confirmed" value={String(data.confirmed)} />
        <KpiCard label="Declined" value={String(data.declined)} />
        <KpiCard label="Confirmation Rate" value={`${data.confirmation_rate}%`} />
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>By Call Type</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            {['Type', 'Sent', 'Confirmed', 'Rate'].map(h => <Text key={h} style={s.thCell}>{h}</Text>)}
          </View>
          {data.by_type.map(r => (
            <View key={r.type} style={s.tableRow}>
              <Text style={s.tdCell}>{capitalize(r.type)}</Text>
              <Text style={s.tdCell}>{r.sent}</Text>
              <Text style={s.tdCell}>{r.confirmed}</Text>
              <Text style={s.tdCell}>{r.rate}%</Text>
            </View>
          ))}
        </View>
      </View>
      <Footer page={1} />
    </Page>
  )
}

function RecallPage({ data, practiceName, start, end }: { data: RecallData; practiceName: string; start: string; end: string }) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Recall Campaign Report" practiceName={practiceName} start={start} end={end} />
      <View style={s.kpiRow}>
        <KpiCard label="Recall Calls" value={String(data.total_recall_calls)} />
        <KpiCard label="Appointments Booked" value={String(data.appointments_booked)} />
        <KpiCard label="Reactivation Rate" value={`${data.reactivation_rate}%`} />
        <KpiCard label="Unique Patients" value={String(data.unique_patients_contacted)} />
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Outcome Breakdown</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            {['Outcome', 'Count'].map(h => <Text key={h} style={s.thCell}>{h}</Text>)}
          </View>
          {[
            ['Appointments Booked', data.appointments_booked],
            ['No Answer', data.no_answer],
            ['Voicemail', data.voicemail],
          ].map(([label, val]) => (
            <View key={label as string} style={s.tableRow}>
              <Text style={s.tdCell}>{label as string}</Text>
              <Text style={s.tdCell}>{val as number}</Text>
            </View>
          ))}
        </View>
      </View>
      <Footer page={1} />
    </Page>
  )
}

function InsurancePage({ data, practiceName, start, end }: { data: InsuranceData; practiceName: string; start: string; end: string }) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Insurance Verification Report" practiceName={practiceName} start={start} end={end} />
      <View style={s.kpiRow}>
        <KpiCard label="Forms Sent" value={String(data.forms_sent)} />
        <KpiCard label="Patient Submitted" value={String(data.patient_submitted)} />
        <KpiCard label="Staff Verified" value={String(data.staff_verified)} />
        <KpiCard label="Completion Rate" value={`${data.completion_rate}%`} />
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Status Breakdown</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            {['Status', 'Count'].map(h => <Text key={h} style={s.thCell}>{h}</Text>)}
          </View>
          {[
            ['Pending Patient', data.pending_patient],
            ['Pending Staff Review', data.pending_staff],
            ['Verified', data.staff_verified],
            ['Expired', data.expired],
          ].map(([label, val]) => (
            <View key={label as string} style={s.tableRow}>
              <Text style={s.tdCell}>{label as string}</Text>
              <Text style={s.tdCell}>{val as number}</Text>
            </View>
          ))}
        </View>
      </View>
      <Footer page={1} />
    </Page>
  )
}

function ExecutiveSummaryDoc({ data }: { data: ExecutiveData }) {
  const { call_performance: cp, confirmation: conf, recall: rec, insurance: ins, practice_name, date_range } = data
  return (
    <Document title={`Executive Summary — ${practice_name}`}>
      {/* Cover */}
      <Page size="A4" style={{ ...s.page, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 12, textAlign: 'center' }}>FIRST-CHOICE CYBER · DENTAL AI GROWTH SYSTEM</Text>
        <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#0f172a', textAlign: 'center', marginBottom: 6 }}>Executive Summary</Text>
        <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 4 }}>{practice_name}</Text>
        <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>{fmtDate(date_range.start)} – {fmtDate(date_range.end)}</Text>
      </Page>
      {/* KPI Overview */}
      <Page size="A4" style={s.page}>
        <Header title="Platform Overview" practiceName={practice_name} start={date_range.start} end={date_range.end} />
        <View style={s.kpiRow}>
          <KpiCard label="Total AI Calls" value={String(cp.total_calls)} />
          <KpiCard label="Total AI Cost" value={fmtCents(cp.total_cost_cents)} />
          <KpiCard label="Confirmations Sent" value={String(conf.total_outbound)} />
          <KpiCard label="Confirmation Rate" value={`${conf.confirmation_rate}%`} />
        </View>
        <View style={s.kpiRow}>
          <KpiCard label="Recall Calls" value={String(rec.total_recall_calls)} />
          <KpiCard label="Patients Reactivated" value={String(rec.appointments_booked)} sub={`${rec.reactivation_rate}% rate`} />
          <KpiCard label="Insurance Forms" value={String(ins.forms_sent)} />
          <KpiCard label="Ins. Verified" value={String(ins.staff_verified)} sub={`${ins.completion_rate}% complete`} />
        </View>
        <Footer page={2} />
      </Page>
      <CallPerformancePage data={cp} practiceName={practice_name} start={date_range.start} end={date_range.end} />
      <ConfirmationPage data={conf} practiceName={practice_name} start={date_range.start} end={date_range.end} />
      <RecallPage data={rec} practiceName={practice_name} start={date_range.start} end={date_range.end} />
      <InsurancePage data={ins} practiceName={practice_name} start={date_range.start} end={date_range.end} />
    </Document>
  )
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as ReportType
  const start = searchParams.get('start')!
  const end = searchParams.get('end')!
  const practiceIdParam = searchParams.get('practice_id')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role, practice_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const practiceId = (profile.role === 'super_admin' && practiceIdParam) ? practiceIdParam : profile.practice_id!
  const service = createServiceClient()

  const reportData = await buildReport(service, type, practiceId, start, end)

  // Fetch practice name for non-executive reports
  let practiceName = ''
  if (type !== 'executive') {
    const { data: p } = await service.from('practices').select('name').eq('id', practiceId).single()
    practiceName = p?.name ?? ''
  }

  let doc: React.ReactElement
  if (type === 'executive') {
    doc = React.createElement(ExecutiveSummaryDoc, { data: reportData as ExecutiveData })
  } else if (type === 'call_performance') {
    doc = React.createElement(Document, null,
      React.createElement(CallPerformancePage, { data: reportData as CallPerformanceData, practiceName, start, end })
    )
  } else if (type === 'confirmation') {
    doc = React.createElement(Document, null,
      React.createElement(ConfirmationPage, { data: reportData as ConfirmationData, practiceName, start, end })
    )
  } else if (type === 'recall') {
    doc = React.createElement(Document, null,
      React.createElement(RecallPage, { data: reportData as RecallData, practiceName, start, end })
    )
  } else {
    doc = React.createElement(Document, null,
      React.createElement(InsurancePage, { data: reportData as InsuranceData, practiceName, start, end })
    )
  }

  const buffer = await renderToBuffer(doc)
  const filename = `${type}-report-${start}-${end}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}