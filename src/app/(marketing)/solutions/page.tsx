'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Building2, Building, CheckCircle, ArrowRight } from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }

const solutions = [
  {
    icon: User,
    segment: 'Individual Practices',
    headline: 'Run a lean practice without sacrificing patient experience.',
    body: "As a solo or small practice, your front desk is stretched thin. Serenity handles inbound calls, recall outreach, and appointment confirmations so your team can focus on in-office care — not phone tag.",
    features: [
      'Answer every call, even after hours',
      'Automated 6-month cleaning reminders',
      'Appointment confirmations 7 days, 3 days, and 3 hours out',
      'Core Analytics dashboard',
      'HIPAA compliance tracking',
    ],
    plan: 'Serenity Capture or Core',
    href: '/pricing',
    accent: 'border-blue-400',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    icon: Building2,
    segment: 'Group Practices',
    headline: 'Standardize operations across every provider and location.',
    body: 'Group practices face the challenge of consistency — different providers, different schedules, and multiple front desk staff. The PracticeGuard AI centralizes patient communication and compliance management under one platform.',
    features: [
      'Multi-provider scheduling logic',
      'Role-based staff access',
      'Centralized compliance tracking',
      'Real-time PMS integration',
      'Analytics across all providers',
    ],
    plan: 'Serenity Complete',
    href: '/pricing',
    accent: 'border-orange-400',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
  },
  {
    icon: Building,
    segment: 'DSOs & Enterprise',
    headline: 'Scale automation across dozens of locations.',
    body: "DSOs demand enterprise-grade reliability, custom integrations, and dedicated support. Our Enterprise plan is built for organizations that need custom workflows, unlimited call volume, and a compliance-ready audit trail.",
    features: [
      'Custom or unlimited AI-handled minutes',
      'API access and advanced integrations',
      'Dedicated success team',
      'Custom workflows and reporting',
      'Full HIPAA compliance with BAA',
    ],
    plan: 'Enterprise (Custom)',
    href: '/contact',
    accent: 'border-purple-400',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
]

export default function SolutionsPage() {
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
            Solutions
          </motion.p>
          <motion.h1 variants={fadeUp} className="text-5xl font-bold text-white mb-5">
            Built for every practice size.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg leading-relaxed">
            Whether you are a solo dentist or a 50-location DSO, the PracticeGuard AI scales to meet you exactly where you are.
          </motion.p>
        </motion.div>
      </section>

      {/* Solutions */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {solutions.map((s, i) => (
              <motion.div
                key={s.segment}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${i % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-start`}
              >
                <div className="flex-1">
                  <div className={`inline-flex items-center gap-2 ${s.iconBg} px-4 py-2 rounded-xl mb-5`}>
                    <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                    <span className={`font-semibold text-sm ${s.iconColor}`}>{s.segment}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">{s.headline}</h2>
                  <p className="text-slate-500 leading-relaxed mb-6">{s.body}</p>
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-all hover:scale-105 text-sm"
                  >
                    {s.plan === 'Enterprise (Custom)' ? 'Contact Sales' : 'View Plan'} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className={`flex-1 bg-slate-50 rounded-2xl p-8 border-2 ${s.accent}`}>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">
                    What&apos;s included for {s.segment}
                  </p>
                  <ul className="space-y-3">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-slate-700 text-sm">
                        <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${s.iconColor}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className={`mt-6 pt-5 border-t border-slate-200 text-xs ${s.iconColor} font-semibold`}>
                    Recommended plan: {s.plan}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">Not sure which fits your practice?</h2>
            <p className="text-slate-400 mb-8">Our team will walk you through the right solution for your specific patient volume, PMS, and growth goals.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3.5 rounded-xl hover:scale-105 transition-all">
                Talk to Sales <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-medium px-8 py-3.5 rounded-xl transition-all">
                Compare Plans
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
