import Link from 'next/link'
import { Activity, Shield, Mail } from 'lucide-react'

const solutions = [
  { href: '/solutions', label: 'Individual Practices' },
  { href: '/solutions', label: 'Group Practices' },
  { href: '/solutions', label: 'DSOs' },
]

const product = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faqs', label: 'FAQs' },
]

const company = [
  { href: '/contact', label: 'Contact Us' },
  { href: '/login', label: 'Sign In' },
  { href: '/signup', label: 'Get Started' },
]

export function MarketingFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <span className="text-white font-bold text-sm block">Dental AI Growth System</span>
                <span className="text-orange-400 text-[10px] font-medium tracking-widest uppercase">by First-Choice Cyber</span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              AI-powered patient operations for modern dental practices. Powered by Serenity, your intelligent voice assistant.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Shield className="w-4 h-4 text-green-500" />
              HIPAA Compliant
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Solutions</h4>
            <ul className="space-y-2">
              {solutions.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2">
              {product.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2">
              {company.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <Mail className="w-4 h-4" />
              <a href="mailto:hello@firstchoicecyber.com" className="hover:text-white transition-colors">
                hello@firstchoicecyber.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Dental AI Growth System. A product by{' '}
            <span className="text-orange-500 font-medium">First-Choice Cyber</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/hipaa" className="hover:text-white transition-colors">HIPAA Notice</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
