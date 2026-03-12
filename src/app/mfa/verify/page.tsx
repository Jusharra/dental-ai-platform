'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, AlertTriangle, KeyRound } from 'lucide-react'

type Mode = 'totp' | 'recovery' | 'breakglass'

function MfaVerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/dashboard'
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('totp')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.from('users').select('role').single().then(({ data }) => {
      if (data?.role === 'super_admin') setIsAdmin(true)
    })
  }, [supabase])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'totp') {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.[0]
      if (!totp) { setError('No authenticator enrolled'); setLoading(false); return }

      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: totp.id })
      if (cErr) { setError(cErr.message); setLoading(false); return }

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challenge.id,
        code,
      })
      if (vErr) { setError('Invalid code — try again'); setLoading(false); return }

    } else if (mode === 'recovery') {
      const res = await fetch('/api/mfa/use-recovery-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Invalid recovery code'); setLoading(false); return }

      // Refresh session — MFA factor has been deleted, AAL1 is now valid
      await supabase.auth.refreshSession()

    } else if (mode === 'breakglass') {
      const res = await fetch('/api/admin/break-glass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyCode: code }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Invalid emergency code'); setLoading(false); return }

      // Refresh session — factor deleted server-side
      await supabase.auth.refreshSession()
    }

    router.push(nextPath)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
            <Shield className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'totp' && 'Enter the code from your authenticator app'}
            {mode === 'recovery' && 'Enter one of your saved recovery codes'}
            {mode === 'breakglass' && 'Enter the emergency access code'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                {mode === 'totp' && '6-digit code'}
                {mode === 'recovery' && 'Recovery code'}
                {mode === 'breakglass' && 'Emergency access code'}
              </label>
              <input
                type={mode === 'totp' ? 'text' : 'password'}
                inputMode={mode === 'totp' ? 'numeric' : undefined}
                maxLength={mode === 'totp' ? 6 : undefined}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={mode === 'totp' ? '000000' : ''}
                autoFocus
                required
                className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mode === 'totp' ? 'text-center text-xl font-mono tracking-widest' : 'text-sm font-mono'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-center">
            {mode !== 'totp' && (
              <button onClick={() => { setMode('totp'); setCode(''); setError(null) }} className="text-sm text-blue-600 hover:underline block w-full">
                Use authenticator app instead
              </button>
            )}
            {mode !== 'recovery' && (
              <button onClick={() => { setMode('recovery'); setCode(''); setError(null) }} className="text-sm text-gray-500 hover:text-gray-700 block w-full">
                Use a recovery code
              </button>
            )}
            {isAdmin && mode !== 'breakglass' && (
              <button
                onClick={() => { setMode('breakglass'); setCode(''); setError(null) }}
                className="text-xs text-red-500 hover:text-red-700 flex items-center justify-center gap-1 w-full mt-1"
              >
                <KeyRound className="w-3 h-3" />
                Emergency access (break glass)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MfaVerifyPage() {
  return (
    <Suspense>
      <MfaVerifyForm />
    </Suspense>
  )
}
