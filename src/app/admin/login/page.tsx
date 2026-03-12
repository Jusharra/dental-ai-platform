'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }

    // Verify super_admin role before redirecting
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      await supabase.auth.signOut()
      setError('Access denied. This portal is for platform administrators only.')
      setLoading(false)
      return
    }

    window.location.href = '/admin/dashboard'
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 rounded-2xl mb-4 border border-orange-500/20">
            <Shield className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Portal</h1>
          <p className="text-slate-300 text-sm mt-1 font-medium">PatientGuard AI</p>
          <p className="text-slate-500 text-xs mt-0.5">Dental Patient Operations &amp; Compliance Platform</p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@firstchoicecyber.com"
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In to Admin'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Practice staff? <a href="/login" className="text-slate-400 hover:text-white transition">Sign in here</a>
        </p>
      </div>
    </div>
  )
}