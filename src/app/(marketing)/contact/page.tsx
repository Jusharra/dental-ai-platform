'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Clock, CheckCircle, Send } from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    // Simulate submit — wire to your preferred form handler (Resend, Formspree, etc.)
    await new Promise((r) => setTimeout(r, 1000))
    setSubmitted(true)
    setLoading(false)
  }

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
          <motion.p variants={fadeUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-3">Contact</motion.p>
          <motion.h1 variants={fadeUp} className="text-5xl font-bold text-white mb-5">Let&apos;s talk.</motion.h1>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg">
            Have questions about the platform, or want a personalized demo? Our team is ready to help.
          </motion.p>
        </motion.div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-16">
            {/* Info */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="md:col-span-2 space-y-8"
            >
              <motion.div variants={fadeUp}>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Get in touch</h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Email</p>
                      <a href="mailto:info@firstchoicecyber.com" className="text-slate-500 text-sm hover:text-orange-500 transition-colors">
                        info@firstchoicecyber.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Sales & Demo</p>
                      <p className="text-slate-500 text-sm">Request via form or email</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Support Hours</p>
                      <p className="text-slate-500 text-sm">Monday – Friday, 9am – 5pm CST</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <p className="font-bold text-slate-900 text-sm mb-1">Dental Patient Operations & Compliance Platform</p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We build compliant, AI-driven technology for healthcare-adjacent industries. Powered by Serenity, our flagship dental practice automation platform.
                </p>
              </motion.div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-3"
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Message received!</h3>
                  <p className="text-slate-500 text-sm max-w-sm">We&apos;ll get back to you within one business day. In the meantime, explore our <a href="/faqs" className="text-orange-500 hover:underline">FAQs</a>.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name *</label>
                      <input required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" placeholder="Jane" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name *</label>
                      <input required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" placeholder="Smith" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                    <input required type="email" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" placeholder="jane@mypractice.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Practice Name</label>
                    <input className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" placeholder="Smile Dental Group" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">How can we help? *</label>
                    <select required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white">
                      <option value="">Select a topic...</option>
                      <option>Schedule a product demo</option>
                      <option>Sales & pricing inquiry</option>
                      <option>Technical support</option>
                      <option>Enterprise / DSO inquiry</option>
                      <option>General question</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
                    <textarea required rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none" placeholder="Tell us about your practice and what you're looking for..." />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Send Message <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
