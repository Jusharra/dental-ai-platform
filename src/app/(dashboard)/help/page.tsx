'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  LayoutDashboard, Users, Calendar, Phone, CreditCard, Megaphone,
  BarChart3, FileText, Shield, Settings, MessageSquare, Search,
  Webhook, Key, RefreshCw, BookOpen,
} from 'lucide-react'
import Link from 'next/link'

// ── Content ───────────────────────────────────────────────────────────────────

const OVERVIEW_CARDS = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    href: '/dashboard',
    desc: 'Real-time KPIs — active patients, upcoming appointments, recent calls, and monthly revenue at a glance.',
  },
  {
    icon: Users,
    title: 'Patients',
    href: '/patients',
    desc: 'Manage your full patient list. View contact info, appointment history, last contact date, and recall status.',
  },
  {
    icon: Calendar,
    title: 'Appointments',
    href: '/appointments',
    desc: 'Track upcoming appointments and their AI confirmation call status — pending, confirmed, declined, or no response.',
  },
  {
    icon: Phone,
    title: 'Call Logs',
    href: '/calls',
    desc: 'Every AI call logged automatically — outcome, duration, cost, transcript, and recording link.',
  },
  {
    icon: CreditCard,
    title: 'Insurance Verification',
    href: '/insurance',
    desc: 'Send digital intake forms to patients before their appointment. Track form status and received information.',
  },
  {
    icon: Megaphone,
    title: 'Recall Campaigns',
    href: '/recalls',
    desc: 'Automated AI calling campaigns to reactivate patients who are overdue for their cleaning or check-up.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    href: '/analytics',
    desc: 'Deep-dive metrics — call trends, confirmation rates, no-show rates, recall ROI, and cost per call.',
  },
  {
    icon: FileText,
    title: 'Reports',
    href: '/reports',
    desc: 'Generate and export PDF or email reports — call performance, confirmations, recall, insurance, and executive summaries.',
  },
  {
    icon: Shield,
    title: 'Compliance',
    href: '/compliance',
    desc: 'HIPAA compliance center — manage policies, BAAs, staff training records, licenses, and incident logs.',
  },
  {
    icon: Settings,
    title: 'Settings',
    href: '/settings',
    desc: 'Configure your practice info, webhook credentials, PMS integration, team members, and notification preferences.',
  },
  {
    icon: MessageSquare,
    title: 'Support',
    href: '/support',
    desc: 'Submit a support ticket and get direct help from the team. Track your tickets and conversation history.',
  },
]

const FAQS: { category: string; question: string; answer: string }[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How does the platform work?',
    answer:
      'The Dental AI Growth System connects your practice to an AI phone system powered by Retell AI. Make.com automations run on a schedule to check appointments and trigger AI calls — for confirmations (7-day, 3-day, 1-day, 3-hour reminders) and recall campaigns. Inbound calls are answered instantly by the AI receptionist. After each call, the result is automatically logged to your platform via secure webhooks.',
  },
  {
    category: 'Getting Started',
    question: 'What do I need to set up before calls start working?',
    answer:
      'Three things:\n1. Copy your Practice ID and Webhook Secret from Settings → Webhooks and add them as headers (x-practice-id and x-webhook-secret) in each Make.com HTTP module.\n2. Ensure your Make.com scenarios are active.\n3. Make sure your subscription is active — Starter tier includes inbound calls only; Professional and Enterprise include recall and confirmation calls as well.',
  },
  {
    category: 'Getting Started',
    question: 'How do I add my team members?',
    answer:
      'Go to Settings → Team Members and invite them by email. They\'ll receive a link to set their password. You can assign them the "Admin" or "Staff" role. Admins can manage settings; Staff can view all data but cannot change practice configuration.',
  },
  // Calls & Confirmations
  {
    category: 'Calls & Confirmations',
    question: 'When do confirmation calls go out?',
    answer:
      'Make.com runs four scheduled confirmation reminder scenarios:\n• 7-day reminder\n• 3-day reminder\n• 1-day reminder\n• 3-hour reminder\n\nEach scenario queries your appointments for the relevant date, then triggers the AI to call each patient. Results are logged automatically under Call Logs and the appointment\'s confirmation status is updated.',
  },
  {
    category: 'Calls & Confirmations',
    question: 'What are the possible confirmation statuses?',
    answer:
      'After each confirmation call, the appointment is marked:\n• Confirmed — patient confirmed they\'ll attend\n• Declined — patient cancelled or declined\n• No Response — no answer, went to voicemail, or call failed\n• Pending — not yet called',
  },
  {
    category: 'Calls & Confirmations',
    question: 'How do inbound calls work?',
    answer:
      'When a patient calls your practice number, the AI receptionist (powered by Retell AI) answers immediately. It can greet the patient, answer questions, and book appointments. When the call ends, Make.com sends the call data to the platform, which logs it under Call Logs and creates or updates the patient record automatically.',
  },
  {
    category: 'Calls & Confirmations',
    question: 'Why is a call showing the wrong outcome?',
    answer:
      'Call outcomes are determined by the AI based on the conversation. If an outcome seems incorrect, check the transcript under Call Logs → click the call → view Transcript. If there\'s a systematic issue, submit a Support ticket and include the call ID from the transcript.',
  },
  // Patients & Appointments
  {
    category: 'Patients & Appointments',
    question: 'How are patients added to the system?',
    answer:
      'Patients are added automatically when:\n• An inbound call comes in from a number not already in the system\n• A recall campaign successfully books an appointment\n\nYou can also add patients manually from the Patients page using the "Add Patient" button.',
  },
  {
    category: 'Patients & Appointments',
    question: 'How do I add or edit an appointment manually?',
    answer:
      'Go to Appointments and click "Add Appointment". Select the patient (or add a new one), choose the date/time, provider, and procedure type. You can also edit existing appointments by clicking on them. Note that confirmation calls are triggered by Make.com based on appointment dates — newly added appointments will be picked up on the next scheduled run.',
  },
  {
    category: 'Patients & Appointments',
    question: 'Can I see a patient\'s full call history?',
    answer:
      'Yes — go to Patients, click on the patient\'s name, and their detail page shows all call logs, appointments, and contact history for that patient.',
  },
  // Recall Campaigns
  {
    category: 'Recall Campaigns',
    question: 'What is a recall campaign?',
    answer:
      'A recall campaign automatically contacts patients who are overdue for their regular cleaning, check-up, or other recurring visit. Make.com queries patients based on their last visit date, then the AI calls each one to schedule a new appointment. Booked appointments appear in your Appointments tab automatically.',
  },
  {
    category: 'Recall Campaigns',
    question: 'How do I start a recall campaign?',
    answer:
      'Go to Recall Campaigns → click "New Campaign". Choose the campaign type (6-Month Cleaning, Annual Check-Up, Follow-Up, or Custom), set the target criteria (e.g., patients with last visit > 6 months ago), and activate it. Make.com will pick up the campaign on its next daily run.',
  },
  {
    category: 'Recall Campaigns',
    question: 'Why aren\'t recall calls going out?',
    answer:
      'Check:\n1. Your subscription is Professional or Enterprise (Starter does not include recall)\n2. The campaign status is "Active"\n3. Your Make.com "Daily Recall Trigger" scenario is active and scheduled\n4. The webhook secret and practice ID headers are correctly set in the Make.com HTTP module',
  },
  // Insurance Verification
  {
    category: 'Insurance Verification',
    question: 'How does insurance verification work?',
    answer:
      'Go to Insurance → click "Send Verification Form". Enter the patient\'s name and email — they\'ll receive a secure link to fill in their insurance details before their appointment. You can track whether the form has been sent, opened, or completed from the Insurance page.',
  },
  // Analytics & Reports
  {
    category: 'Analytics & Reports',
    question: 'What\'s the difference between Analytics and Reports?',
    answer:
      'Analytics is a real-time dashboard with charts and trend data — great for monitoring performance day-to-day. Reports generates formatted documents (PDF or email) covering a specific date range, ideal for sharing with your office manager or reviewing monthly performance.',
  },
  {
    category: 'Analytics & Reports',
    question: 'How do I export a report?',
    answer:
      'Go to Reports, select the report type and date range, then click "Download PDF" to save a PDF, or "Email Report" to send it directly to your inbox. The Executive Summary report covers all KPIs in one document.',
  },
  // Compliance
  {
    category: 'Compliance',
    question: 'What does the Compliance module cover?',
    answer:
      'The Compliance module helps you stay HIPAA-compliant. It includes:\n• Policies — upload and track HIPAA policy documents\n• BAAs — manage Business Associate Agreements with vendors\n• Training — log staff HIPAA training completions\n• Licenses — track professional license renewal dates\n• Risk Assessments — document annual security risk assessments\n• Sterilization Logs — track equipment sterilization cycles\n• Incident Logs — record and manage breach or incident reports',
  },
  // Webhooks & Settings
  {
    category: 'Webhooks & Settings',
    question: 'Where do I find my webhook credentials for Make.com?',
    answer:
      'Go to Settings → scroll to the "Webhook Configuration" section. You\'ll see:\n• Practice ID — add as the x-practice-id header in every Make.com HTTP module\n• Webhook Secret — add as the x-webhook-secret header\n\nThese credentials authenticate each call from Make.com to the platform and ensure calls are only accepted for your practice.',
  },
  {
    category: 'Webhooks & Settings',
    question: 'What happens if my webhook secret is wrong?',
    answer:
      'Requests with an incorrect secret will be rejected with a 401 error and logged to the webhook audit log (visible to admins). Call data will not be saved. If you suspect your secret has been compromised, contact support to have it rotated.',
  },
  {
    category: 'Webhooks & Settings',
    question: 'How do I connect my Practice Management System (PMS)?',
    answer:
      'Go to Settings → PMS Integration. The platform currently supports webhook-based sync from common PMS systems. Enter your PMS type and configure the sync schedule. Contact support if you need help with a specific PMS integration.',
  },
  // Billing & Subscription
  {
    category: 'Billing & Subscription',
    question: 'What is included in each subscription tier?',
    answer:
      'Serenity Capture ($295/mo) — Inbound AI receptionist only\nSerenity Complete ($495/mo) — Inbound + Recall campaigns + Appointment confirmations\nSerenity Enterprise ($895/mo) — All features + priority support\n\nYou can view and manage your subscription under Settings → Billing.',
  },
  {
    category: 'Billing & Subscription',
    question: 'How do I upgrade my subscription?',
    answer:
      'Go to Settings → Billing and click "Upgrade Plan". You\'ll be redirected to the secure billing portal to complete the change. Upgrades take effect immediately.',
  },
  // Support
  {
    category: 'Support',
    question: 'How do I contact support?',
    answer:
      'Click "Support" in the sidebar to open the Support Center. Submit a ticket with your issue, category, and description — the team will respond as quickly as possible. You can track the status and reply to tickets from the same page.',
  },
  {
    category: 'Support',
    question: 'How do I reset my password?',
    answer:
      'Click "Forgot password?" on the login page and enter your email address. You\'ll receive a password reset link. Click the link in the email — it will take you to a page where you can set a new password. The link expires after 1 hour.',
  },
]

const HOW_TO_GUIDES = [
  {
    title: 'Set up Make.com webhook headers',
    steps: [
      'Go to Settings → scroll to Webhook Configuration',
      'Copy your Practice ID',
      'Copy your Webhook Secret (click the eye icon to reveal)',
      'In Make.com, open each HTTP module that calls your platform',
      'Add header: x-practice-id → paste your Practice ID',
      'Add header: x-webhook-secret → paste your Webhook Secret',
      'Save the scenario and run a test call to verify',
    ],
    icon: Webhook,
    href: '/settings',
    linkLabel: 'Go to Settings',
  },
  {
    title: 'Start your first recall campaign',
    steps: [
      'Go to Recall Campaigns in the sidebar',
      'Click "New Campaign"',
      'Choose a campaign type (e.g., 6-Month Cleaning)',
      'The campaign will target patients overdue for that visit type',
      'Click "Activate Campaign"',
      'Make.com\'s Daily Recall scenario will pick it up on the next run',
      'Monitor progress from the campaign\'s detail page',
    ],
    icon: Megaphone,
    href: '/recalls',
    linkLabel: 'Go to Recall Campaigns',
  },
  {
    title: 'Send an insurance verification form',
    steps: [
      'Go to Insurance in the sidebar',
      'Click "Send Verification Form"',
      'Enter the patient\'s name and email address',
      'Click "Send" — the patient receives a secure link',
      'Track status from the Insurance page (Sent → Opened → Completed)',
      'Completed forms are stored and linked to the patient\'s record',
    ],
    icon: CreditCard,
    href: '/insurance',
    linkLabel: 'Go to Insurance',
  },
  {
    title: 'Generate and email a report',
    steps: [
      'Go to Reports in the sidebar',
      'Select the report type (e.g., Executive Summary)',
      'Choose a date range or use a preset (Last 30 days, This Month, etc.)',
      'Click "Load Report" to preview the data',
      'Click "Download PDF" to save, or "Email Report" to send to your inbox',
    ],
    icon: FileText,
    href: '/reports',
    linkLabel: 'Go to Reports',
  },
  {
    title: 'Add a new team member',
    steps: [
      'Go to Settings → Team Members section',
      'Click "Invite Member"',
      'Enter their email address and select a role (Admin or Staff)',
      'They\'ll receive an invitation email with a link to set their password',
      'Once they sign in, they\'ll have access to the practice dashboard',
    ],
    icon: Users,
    href: '/settings',
    linkLabel: 'Go to Settings',
  },
  {
    title: 'Review and resolve a compliance item',
    steps: [
      'Go to Compliance in the sidebar',
      'Click on the relevant sub-module (e.g., Training or Licenses)',
      'View overdue or expiring items highlighted in red or amber',
      'Click on an item to update its status, add notes, or upload a document',
      'Use the Overview page to see your overall compliance score',
    ],
    icon: Shield,
    href: '/compliance',
    linkLabel: 'Go to Compliance',
  },
]

const CATEGORIES = ['All', ...Array.from(new Set(FAQS.map(f => f.category)))]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HelpCenterPage() {
  const [search, setSearch]     = useState('')
  const [activeCategory, setCat] = useState('All')

  const filteredFAQs = useMemo(() => {
    const q = search.toLowerCase()
    return FAQS.filter(f => {
      const matchesCat = activeCategory === 'All' || f.category === activeCategory
      const matchesSearch = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [search, activeCategory])

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Help Center
        </h1>
        <p className="text-muted-foreground">
          Everything you need to get the most out of your Dental AI Growth System
        </p>
      </div>

      {/* Platform Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Platform Overview</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OVERVIEW_CARDS.map(card => (
            <Link key={card.href} href={card.href}>
              <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <card.icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">{card.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCat(cat)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredFAQs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No questions match &quot;{search}&quot;. Try a different term or{' '}
            <Link href="/support" className="underline text-primary">submit a support ticket</Link>.
          </p>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {filteredFAQs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="text-sm font-medium text-left hover:no-underline py-4">
                  <span className="flex items-start gap-3">
                    <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{faq.category}</Badge>
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>

      {/* How-To Guides */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">How-To Guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOW_TO_GUIDES.map((guide, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <guide.icon className="h-4 w-4 text-primary shrink-0" />
                  {guide.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                  {guide.steps.map((step, j) => (
                    <li key={j} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
                <Link href={guide.href} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                  {guide.linkLabel} →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Still need help */}
      <section>
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="pt-6 pb-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div>
              <p className="font-semibold">Still need help?</p>
              <p className="text-sm text-muted-foreground">
                Can&apos;t find what you&apos;re looking for? Submit a support ticket and the team will get back to you.
              </p>
            </div>
            <Link href="/support/new">
              <button className="shrink-0 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                Open a Ticket
              </button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
