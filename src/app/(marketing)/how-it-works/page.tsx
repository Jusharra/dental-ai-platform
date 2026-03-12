'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Phone, Calendar, BarChart3, Shield, ArrowRight, CheckCircle } from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }

const steps = [
  {
    num: '01',
    icon: Phone,
    title: 'Patient Calls — or Serenity Calls Them',
    body: 'Every inbound call is answered instantly by Serenity — no hold times, no voicemail. For recalls and confirmations, Serenity proactively reaches out to patients based on your schedule and recall lists, automatically triggered by your Make.com scenarios.',
    points: ['24/7 inbound call answering', 'Automated recall outreach', 'Appointment confirmation calls', 'After-hours coverage'],
  },
  {
    num: '02',
    icon: Calendar,
    title: 'Serenity Handles the Conversation',
    body: "Using advanced voice AI from Retell AI, Serenity conducts natural, empathetic conversations. It verifies patient identity, books appointments, confirms existing ones, handles reschedules, and answers common questions — all without any human intervention.",
    points: ['Natural, human-like voice AI', 'Identity verification', 'Appointment scheduling & rescheduling', 'FAQs and insurance queries'],
  },
  {
    num: '03',
    icon: BarChart3,
    title: 'Dashboard Updated in Real Time',
    body: 'Every call outcome is instantly logged in your dashboard. Appointments booked, confirmed, declined, or rescheduled — all synced with your PMS via the integration layer. You always know exactly where every patient stands.',
    points: ['Real-time call logging', 'Automatic PMS sync via external_id', 'Full call transcripts & recordings', 'Outcome tracking by call type'],
  },
  {
    num: '04',
    icon: Shield,
    title: 'Compliance Tracked Automatically',
    body: 'While Serenity manages patient communications, the platform simultaneously tracks your HIPAA compliance posture — policy status, BAA signatures, staff training records, license expirations, and audit logs — all in one place.',
    points: ['HIPAA policy management', 'BAA tracking', 'Staff training records', 'Automated compliance alerts'],
  },
]

const integrations = [
  'Retell AI Voice Engine',
  'Make.com Automation',
  'Dentrix',
  'Eaglesoft',
  'OpenDental',
  'Curve Dental',
  'Supabase (HIPAA-ready)',
  'Vercel Hosting',
]

export default function HowItWorksPage() {
  return (
    <div className="pt-16">
      {/* Header */}
      <section className="bg-slate-950 py-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.p variants={fadeUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
            How It Works
          </motion.p>
          <motion.h1 variants={fadeUp} className="text-5xl font-bold text-white mb-5">
            From first call to full compliance — automated.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg leading-relaxed">
            The platform integrates with your existing tools and has Serenity handle patient communications end-to-end, while keeping your practice fully compliant.
          </motion.p>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}
              >
                {/* Visual */}
                <div className="flex-1 flex justify-center">
                  <div className="relative">
                    <div className="text-[120px] font-black text-orange-500/10 leading-none select-none">{step.num}</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                        <step.icon className="w-12 h-12 text-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h2>
                  <p className="text-slate-500 leading-relaxed mb-6">{step.body}</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {step.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-3">Integrates with your existing stack</h2>
            <p className="text-slate-400 mb-10">The platform works with the tools dental practices already use.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {integrations.map((name) => (
                <span key={name} className="bg-slate-800 border border-slate-700 text-slate-300 text-sm px-4 py-2 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-orange-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to see Serenity in action?</h2>
          <p className="text-orange-100 mb-8">Set up takes hours, not weeks. Start automating today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl hover:scale-105 transition-all">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 border-2 border-white/30 hover:border-white text-white font-medium px-8 py-3.5 rounded-xl transition-all">
              See Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
