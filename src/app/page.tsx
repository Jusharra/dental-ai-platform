'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Phone, Calendar, Shield, BarChart3, CheckCircle, ArrowRight, Zap, Clock, Users, Star } from 'lucide-react'
import { MarketingLayoutWrapper } from '@/components/marketing/layout-wrapper'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const features = [
  {
    icon: Phone,
    title: 'AI Voice Automation',
    description: 'Serenity answers every inbound call, handles recall campaigns, and confirms appointments — 24/7, without hold times.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Automated appointment booking with real-time provider availability. Syncs directly with your practice management system.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Shield,
    title: 'HIPAA Compliance',
    description: 'Full compliance management for HIPAA, OSHA, and state board requirements — policies, BAAs, training records, and audits in one place.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: BarChart3,
    title: 'Practice Analytics',
    description: 'Real-time dashboards showing call performance, appointment confirmation rates, recall success, and revenue impact.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
]

const stats = [
  { value: '24/7', label: 'AI Coverage' },
  { value: '< 2s', label: 'Answer Time' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: 'HIPAA', label: 'Compliant' },
]

const steps = [
  {
    num: '01',
    title: 'Patient Calls or Is Due for Recall',
    desc: 'The system monitors your schedule and patient list around the clock — automatically triggering outbound calls for confirmations and recalls.',
  },
  {
    num: '02',
    title: 'Serenity Handles the Conversation',
    desc: "Our AI voice assistant conducts natural, empathetic conversations — scheduling, confirming, and answering questions just like your front desk would.",
  },
  {
    num: '03',
    title: 'Dashboard Updated Instantly',
    desc: 'Every call outcome is logged in real time — appointment booked, confirmed, or rescheduled — all synced to your PMS.',
  },
]

export default function HomePage() {
  return (
    <MarketingLayoutWrapper>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center bg-slate-950 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium px-4 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5" />
                Dental AI Growth System
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6"
            >
              Your Practice
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Never Closes.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-xl text-slate-400 leading-relaxed mb-4 max-w-2xl"
            >
              Meet <span className="text-orange-400 font-semibold">Serenity</span> — your AI dental voice assistant, available 24/7 for inbound calls, recall campaigns, and appointment confirmations. HIPAA-compliant, PMS-integrated, and built for practices of every size.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/25"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 font-medium px-8 py-3.5 rounded-xl text-base transition-all duration-200"
              >
                See How It Works
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-6">
              {['No setup fee', 'HIPAA-ready from day one', 'Cancel anytime'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
              Everything You Need
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-slate-900 mb-4">
              One platform. Complete automation.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-slate-500 max-w-2xl mx-auto">
              From the first patient call to full compliance documentation, the Dental AI Growth System handles the operational work so your team can focus on care.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group p-6 rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 cursor-default"
              >
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
              How It Works
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-white mb-4">
              Set up in hours. Runs forever.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-slate-400 max-w-2xl mx-auto">
              The Dental AI Growth System integrates with your existing tools and starts handling patient communications from day one.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-orange-500/50 to-transparent -translate-y-px z-0" />
                )}
                <div className="relative z-10">
                  <div className="text-6xl font-black text-orange-500/20 leading-none mb-4">{step.num}</div>
                  <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              See the full breakdown <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: Clock, title: 'Zero Hold Times', desc: 'Serenity picks up every call instantly — no queues, no missed calls, no after-hours voicemails.' },
              { icon: Users, title: 'Works for Every Practice', desc: 'Whether you are a solo dentist or a multi-site DSO, the Dental AI Growth System scales to match your patient volume.' },
              { icon: Star, title: 'Enterprise-Grade Security', desc: 'SOC 2-ready infrastructure, encrypted PHI storage, and a full HIPAA Business Associate Agreement included.' },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
                  <item.icon className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.p variants={fadeUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-slate-500 mb-8">
              Plans starting at <span className="font-semibold text-slate-900">$195/month</span>. Scale as your practice grows with no hidden fees.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105"
              >
                View All Plans <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 font-medium px-8 py-3 rounded-xl transition-all"
              >
                Talk to Sales
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-white mb-4">
              Ready to grow your practice with AI?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-orange-100 text-lg mb-8">
              Join dental practices already using the Dental AI Growth System to reduce front desk burden and never miss a patient call.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-white border-2 border-white/30 hover:border-white font-medium px-8 py-3.5 rounded-xl transition-all"
              >
                Schedule a Demo
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </MarketingLayoutWrapper>
  )
}
