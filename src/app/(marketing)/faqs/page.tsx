'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

const categories = [
  {
    label: 'General',
    faqs: [
      { q: 'What is the PatientGuard AI?', a: 'The PatientGuard AI is an AI-powered patient operations platform for dental practices. It handles inbound calls, appointment recall, confirmation reminders, and HIPAA compliance management — 24/7, without any staff involvement.' },
      { q: 'Who is Serenity?', a: 'Serenity is the AI voice assistant at the core of the PatientGuard AI. She answers calls, handles recall outreach, and confirms appointments around the clock — sounding natural, professional, and empathetic.' },
      { q: 'Who makes the PatientGuard AI?', a: 'The PatientGuard AI is built by a team of healthcare technology specialists focused on compliant, AI-driven solutions for dental and healthcare-adjacent industries.' },
      { q: 'Do I need technical knowledge to use it?', a: 'No. The platform is designed to be set up and managed by practice managers and front-desk staff — no coding required. Our onboarding team handles all integration configuration.' },
    ],
  },
  {
    label: 'AI & Voice',
    faqs: [
      { q: 'How does Serenity work?', a: "Serenity uses Retell AI's voice engine to conduct natural, human-like phone conversations. She can book appointments, verify patient identity, confirm upcoming appointments, answer common questions, and handle recall outreach — all via outbound or inbound phone calls." },
      { q: 'Can patients tell they are talking to an AI?', a: 'Serenity is transparent by design — she identifies herself as an automated assistant. Most patients appreciate the instant availability and professionalism. You can customize her script and voice to reflect your practice\'s brand.' },
      { q: 'What languages does Serenity support?', a: 'Currently English. Additional language support is on our roadmap. Contact us if you have a multilingual patient base — our Enterprise plan may be configured for specific needs.' },
      { q: 'What happens if Serenity cannot handle a call?', a: 'If Serenity encounters a complex question or the patient requests a human, the call is flagged and logged in your dashboard for follow-up. You can configure escalation rules per your practice preferences.' },
    ],
  },
  {
    label: 'Integrations & PMS',
    faqs: [
      { q: 'Which PMS systems does the platform integrate with?', a: 'Serenity Core and Complete plans support real-time API integration with Dentrix, Eaglesoft, OpenDental, Curve Dental, and more. The Serenity Capture plan uses non-integrated scheduling.' },
      { q: 'How does data sync between the platform and my PMS?', a: 'Patient records and appointments are linked via external_id — a shared identifier between your dashboard and PMS. Make.com automation scenarios handle the bidirectional sync in real time.' },
      { q: 'What if my PMS is not on the supported list?', a: 'Contact our team. We support custom integrations on Enterprise plans, and our integration roadmap is regularly updated based on customer demand.' },
    ],
  },
  {
    label: 'Compliance & Security',
    faqs: [
      { q: 'Is the PatientGuard AI HIPAA compliant?', a: 'Yes. The platform is built HIPAA-compliant from the ground up. All patient data is encrypted at rest and in transit. A Business Associate Agreement (BAA) is included with every plan.' },
      { q: 'Where is patient data stored?', a: 'All data is stored in Supabase (PostgreSQL), which offers HIPAA-eligible infrastructure with encryption, access controls, and audit logging. Data is hosted in the US.' },
      { q: 'Does the platform store call recordings?', a: 'Yes. Call recordings and full transcripts are stored and accessible in your dashboard. You control retention policies and access permissions by staff role.' },
      { q: 'What compliance frameworks are covered?', a: 'The platform tracks HIPAA, OSHA, State Dental Board requirements, BAAs, staff training records, license expirations, sterilization logs, risk assessments, and incident reports.' },
    ],
  },
  {
    label: 'Pricing & Plans',
    faqs: [
      { q: 'Is there a free trial?', a: 'Yes. All Individual plans come with a 14-day free trial. No credit card required to start.' },
      { q: 'Can I switch plans?', a: 'Yes, you can upgrade or downgrade at any time from the settings dashboard. Changes take effect at the next billing cycle.' },
      { q: 'Are there any setup or cancellation fees?', a: 'No setup fees and no cancellation fees. The platform is billed monthly and you can cancel at any time.' },
      { q: 'What counts as an AI-handled call?', a: 'Any inbound or outbound call answered and managed by Serenity — including appointment confirmations, recall outreach, and inbound scheduling — counts as one AI-handled call.' },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-900 text-sm pr-4">{q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-slate-500 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqsPage() {
  const [activeCategory, setActiveCategory] = useState('General')

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
          <motion.p variants={fadeUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">FAQs</motion.p>
          <motion.h1 variants={fadeUp} className="text-5xl font-bold text-white mb-5">Frequently asked questions</motion.h1>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg">Everything you need to know about the PatientGuard AI. Can&apos;t find your answer? <Link href="/contact" className="text-orange-400 hover:underline">Contact us</Link>.</motion.p>
        </motion.div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((c) => (
              <button
                key={c.label}
                onClick={() => setActiveCategory(c.label)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === c.label
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {categories.filter((c) => c.label === activeCategory).map((cat) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {cat.faqs.map((faq) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Still have questions?</h2>
          <p className="text-slate-500 mb-6">Our team is here to help. Reach out and we will get back to you within one business day.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8 py-3 rounded-xl hover:scale-105 transition-all">
            Contact Support <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
