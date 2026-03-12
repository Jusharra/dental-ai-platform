'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Copy, Check, AlertTriangle } from 'lucide-react'

type Step = 'intro' | 'scan' | 'codes' | 'done'

export default function MfaSetupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('intro')
  const [qrSvg, setQrSvg] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function startEnrollment() {
    setLoading(true)
    setError(null)
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'Dental Patient Ops',
    })
    if (enrollError || !data) {
      setError(enrollError?.message ?? 'Failed to start enrollment')
      setLoading(false)
      return
    }
    setQrSvg(data.totp.qr_code)
    setSecret(data.totp.secret)
    setFactorId(data.id)
    setStep('scan')
    setLoading(false)
  }

  async function verifyAndEnroll() {
    if (totpCode.length !== 6) { setError('Enter the 6-digit code from your authenticator app'); return }
    setLoading(true)
    setError(null)

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError) { setError(challengeError.message); setLoading(false); return }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: totpCode,
    })
    if (verifyError) { setError('Invalid code — check your authenticator app and try again'); setLoading(false); return }

    // Generate recovery codes
    const res = await fetch('/api/mfa/recovery-codes', { method: 'POST' })
    const { codes, error: codesError } = await res.json()
    if (codesError) { setError(codesError); setLoading(false); return }

    // Mark enrolled in users table
    await fetch('/api/mfa/enrolled', { method: 'POST' })

    setRecoveryCodes(codes)
    setStep('codes')
    setLoading(false)
  }

  async function copyCodes() {
    await navigator.clipboard.writeText(recoveryCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function finish() {
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Two-Factor Authentication</h1>
          <p className="text-gray-500 text-sm mt-1">Required for HIPAA compliance</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {step === 'intro' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Two-factor authentication adds an extra layer of security. You&apos;ll need an authenticator app
                such as <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>1Password</strong>.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  Install an authenticator app on your phone
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  Scan the QR code
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  Save your recovery codes
                </li>
              </ul>
              <button
                onClick={startEnrollment}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition mt-2"
              >
                {loading ? 'Loading…' : 'Get Started'}
              </button>
            </div>
          )}

          {step === 'scan' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Scan this QR code with your authenticator app:</p>
              <div
                className="flex justify-center p-4 bg-white border border-gray-200 rounded-xl"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <details className="text-xs text-gray-400">
                <summary className="cursor-pointer hover:text-gray-600">Can&apos;t scan? Enter manually</summary>
                <p className="mt-2 font-mono bg-gray-100 p-2 rounded break-all select-all">{secret}</p>
              </details>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Enter the 6-digit code to confirm</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={verifyAndEnroll}
                disabled={loading || totpCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
              >
                {loading ? 'Verifying…' : 'Verify & Enable'}
              </button>
            </div>
          )}

          {step === 'codes' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>Save these recovery codes now.</strong> They will not be shown again.
                  Each code can be used once if you lose access to your authenticator app.
                </p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code) => (
                    <span key={code} className="text-green-400">{code}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyCodes}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg text-sm transition"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy all'}
                </button>
                <button
                  onClick={finish}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition"
                >
                  I&apos;ve saved my codes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
