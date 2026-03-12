'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Zap, Crown, Star } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const individualPlans = [
  {
    name: 'Serenity Capture',
    badge: 'Most Flexible',
    badgeIcon: Zap,
    price: '$495',
    period: '/month',
    description: 'Best for overflow, after-hours, or practices not ready for integration',
    features: [
      '100 AI-handled calls included per month',
      '$2.50 per call after 100 calls',
      'Basic appointment scheduling (non-integrated)',
      'Core Analytics dashboard',
      'Patient intake & verification workflows',
    ],
    cta: 'Get Started',
    href: '/signup',
    highlight: false,
    accentColor: 'border-slate-200',
  },
  {
    name: 'Serenity Core',
    badge: 'Most Popular',
    badgeIcon: Star,
    price: '$295',
    period: '/month',
    description: 'Best for lower-volume practices or teams easing into automation',
    features: [
      '$4.00 per call starting at call 1',
      '24/7 automated web based appointment scheduling with multiple providers',
      'Real-time PMS integration (e.g., Dentrix, Eaglesoft, OpenDental, and more)',
      "Customizable web interface to match your practice's brand",
      'Analytics and performance tracking',
      'Multi-user access with role-based permissions',
      'Support available M–F, 9–5 CST',
    ],
    cta: 'Get Started',
    href: '/signup',
    highlight: false,
    accentColor: 'border-slate-200',
  },
  {
    name: 'Serenity Complete',
    badge: 'Best Value',
    badgeIcon: Crown,
    price: '$895',
    period: '/month',
    description: 'Best for established or higher-volume practices',
    features: [
      'Includes all features in Serenity Core',
      '150 AI-handled calls included per month',
      '$2.50 per call after 150 calls',
      '24/7 automated web based appointment scheduling with multiple providers',
      'Real-time PMS integration (e.g., Dentrix, Eaglesoft, OpenDental, and more)',
    ],
    cta: 'Get Started',
    href: '/signup',
    highlight: true,
    accentColor: 'border-orange-400',
  },
]

const enterpriseFeatures = [
  'Includes all features in Serenity Complete',
  'Custom or unlimited AI-handled minutes',
  'API access and advanced integration support',
  'Full HIPAA compliance with dedicated success team',
  'Custom workflows and roadmap influence',
]

const faqs = [
  { q: 'Is there a free trial?', a: 'Yes — all Individual plans include a 14-day free trial with no credit card required.' },
  { q: 'Can I change plans later?', a: 'Absolutely. You can upgrade, downgrade, or cancel at any time from your dashboard settings.' },
  { q: 'What PMS systems are supported?', a: 'Serenity Core and Complete plans support Dentrix, Eaglesoft, OpenDental, Curve, and more via API integration.' },
  { q: 'Is the platform HIPAA compliant?', a: 'Yes. The platform includes a Business Associate Agreement (BAA) and all data is encrypted at rest and in transit.' },
]

export default function PricingPage() {
  const [tab, setTab] = useState<'individual' | 'enterprise'>('individual')

  return (
    <div className="pt-16">
      {/* Header */}
      <section className="bg-slate-950 py-20">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.p variants={fadeUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">
            Pricing
          </motion.p>
          <motion.h1 variants={fadeUp} className="text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </motion.h1>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg">
            No setup fees. No hidden costs. Cancel anytime.
          </motion.p>

          {/* Toggle */}
          <motion.div variants={fadeUp} className="mt-8 inline-flex bg-slate-800 p-1 rounded-xl gap-1">
            <button
              onClick={() => setTab('individual')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'individual' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setTab('enterprise')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'enterprise' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Enterprise
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Plans */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {tab === 'individual' ? (
            <motion.div
              key="individual"
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-3 gap-6 items-start"
            >
              {individualPlans.map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  className={`bg-white rounded-2xl p-8 border-2 ${plan.accentColor} ${
                    plan.highlight ? 'shadow-xl shadow-orange-500/10 relative' : 'shadow-sm'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      BEST VALUE
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`text-xl font-bold ${plan.highlight ? 'text-orange-500' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      <plan.badgeIcon className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                  <div className="mb-3">
                    <span className="text-sm text-slate-500">From </span>
                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-slate-500">{plan.period}</span>
                  </div>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">{plan.description}</p>
                  <Link
                    href={plan.href}
                    className={`block text-center font-semibold py-3 rounded-xl mb-6 transition-all duration-200 hover:scale-[1.02] ${
                      plan.highlight
                        ? 'bg-orange-500 hover:bg-orange-400 text-white'
                        : 'bg-slate-900 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm text-slate-600">
                        <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-orange-500' : 'text-slate-400'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="enterprise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl p-10 border-2 border-slate-200 shadow-sm text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Multi-Location / Enterprise</h3>
                <div className="text-4xl font-black text-slate-900 mb-2">Custom pricing</div>
                <p className="text-slate-500 text-sm mb-8">For DSOs and multi-site practices with custom needs</p>
                <Link
                  href="/contact"
                  className="inline-block bg-slate-900 hover:bg-slate-700 text-white font-bold px-10 py-3.5 rounded-xl w-full text-center transition-all hover:scale-[1.02] mb-8"
                >
                  Contact Sales
                </Link>
                <ul className="space-y-3 text-left">
                  {enterpriseFeatures.map((f) => (
                    <li key={f} className="flex gap-3 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Pricing questions</h2>
            <p className="text-slate-500">Need more detail? <Link href="/faqs" className="text-orange-500 hover:underline">See all FAQs</Link></p>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="border border-slate-200 rounded-xl p-6"
              >
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-orange-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Not sure which plan is right?</h2>
          <p className="text-orange-100 mb-8">Talk to our team and we will help you find the perfect fit for your practice.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl hover:scale-105 transition-all"
          >
            Schedule a Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
