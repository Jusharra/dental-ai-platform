'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle, AlertCircle, Upload, X, Shield, ChevronRight } from 'lucide-react'

type Step = 'loading' | 'error' | 'subscriber' | 'insurance' | 'upload' | 'submitting' | 'success'

type CardPreview = { file: File; preview: string } | null

export default function InsuranceVerificationForm({ token }: { token?: string }) {
  const [step, setStep] = useState<Step>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [patientName, setPatientName] = useState('')

  // Form state
  const [subscriberName, setSubscriberName] = useState('')
  const [subscriberDob, setSubscriberDob] = useState('')
  const [relationship, setRelationship] = useState('self')
  const [carrier, setCarrier] = useState('')
  const [memberId, setMemberId] = useState('')
  const [groupNumber, setGroupNumber] = useState('')
  const [cardFront, setCardFront] = useState<CardPreview>(null)
  const [cardBack, setCardBack] = useState<CardPreview>(null)

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStep('error')
      setErrorMsg('No verification token provided. Please use the link from your email.')
      return
    }

    fetch(`/api/insurance/validate-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setStep('error')
          setErrorMsg(data.error)
        } else {
          setPatientName(data.patient_name)
          // Pre-fill subscriber name with patient name if relationship is self
          setSubscriberName(data.patient_name)
          setStep('subscriber')
        }
      })
      .catch(() => {
        setStep('error')
        setErrorMsg('Something went wrong. Please try again or contact your dental office.')
      })
  }, [token])

  function handleFileSelect(
    file: File,
    setter: (v: CardPreview) => void
  ) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload an image (JPG, PNG) or PDF file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10 MB.')
      return
    }
    const preview = URL.createObjectURL(file)
    setter({ file, preview })
  }

  async function handleSubmit() {
    setStep('submitting')

    const fd = new FormData()
    fd.append('token', token!)
    fd.append('subscriber_name', subscriberName)
    fd.append('subscriber_dob', subscriberDob)
    fd.append('subscriber_relationship', relationship)
    fd.append('insurance_carrier', carrier)
    fd.append('member_id', memberId)
    fd.append('group_number', groupNumber)
    if (cardFront) fd.append('card_front', cardFront.file)
    if (cardBack) fd.append('card_back', cardBack.file)

    try {
      const res = await fetch('/api/insurance/submit', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setStep('success')
      } else {
        setStep('error')
        setErrorMsg(data.error || 'Submission failed. Please try again.')
      }
    } catch {
      setStep('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Verifying your link...</p>
        </div>
      </div>
    )
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Link unavailable</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    )
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Information received!</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Thank you, {patientName.split(' ')[0]}. Our team will complete the verification
            and contact you if we need any additional information.
          </p>
        </div>
      </div>
    )
  }

  // ── SUBMITTING ────────────────────────────────────────────────────────────
  if (step === 'submitting') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Submitting your information…</p>
          <p className="text-slate-400 text-sm mt-1">Please do not close this page.</p>
        </div>
      </div>
    )
  }

  const progressSteps = ['Subscriber', 'Insurance', 'Card Upload']
  const currentStepIdx = step === 'subscriber' ? 0 : step === 'insurance' ? 1 : 2

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 px-3 py-1.5 rounded-full text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            Secure & HIPAA-Compliant
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Insurance Verification</h1>
          <p className="text-slate-500 text-sm mt-1">Hi {patientName.split(' ')[0]}, please complete the form below.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {progressSteps.map((label, idx) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${idx === currentStepIdx ? 'text-orange-600' : idx < currentStepIdx ? 'text-green-600' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === currentStepIdx ? 'bg-orange-500 text-white' : idx < currentStepIdx ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {idx < currentStepIdx ? '✓' : idx + 1}
                </div>
                {label}
              </div>
              {idx < progressSteps.length - 1 && (
                <div className={`w-8 h-px ${idx < currentStepIdx ? 'bg-green-400' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">

          {/* ── STEP 1: SUBSCRIBER INFO ─────────────────────────────────── */}
          {step === 'subscriber' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Subscriber Information</h2>
                <p className="text-sm text-slate-500">The primary policyholder on the dental insurance plan.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Subscriber Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subscriberName}
                  onChange={(e) => setSubscriberName(e.target.value)}
                  placeholder="Full legal name"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Subscriber Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={subscriberDob}
                  onChange={(e) => setSubscriberDob(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Patient&apos;s Relationship to Subscriber <span className="text-red-500">*</span>
                </label>
                <select
                  value={relationship}
                  onChange={(e) => {
                    setRelationship(e.target.value)
                    // If self, sync subscriber name with patient name
                    if (e.target.value === 'self') setSubscriberName(patientName)
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
                >
                  <option value="self">Self (I am the subscriber)</option>
                  <option value="spouse">Spouse / Domestic Partner</option>
                  <option value="child">Child / Dependent</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                onClick={() => {
                  if (!subscriberName || !subscriberDob) {
                    alert('Please fill in subscriber name and date of birth.')
                    return
                  }
                  setStep('insurance')
                }}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 2: INSURANCE INFO ───────────────────────────────────── */}
          {step === 'insurance' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Insurance Information</h2>
                <p className="text-sm text-slate-500">Found on the front of your insurance card.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Insurance Carrier / Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. Delta Dental, Cigna, Aetna"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Member ID / Policy Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="Found on front of insurance card"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Group Number
                </label>
                <input
                  type="text"
                  value={groupNumber}
                  onChange={(e) => setGroupNumber(e.target.value)}
                  placeholder="Optional — found on insurance card"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('subscriber')}
                  className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold py-3.5 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!carrier || !memberId) {
                      alert('Please fill in insurance carrier and member ID.')
                      return
                    }
                    setStep('upload')
                  }}
                  className="flex-[2] bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: CARD UPLOAD ──────────────────────────────────────── */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Insurance Card Photos</h2>
                <p className="text-sm text-slate-500">
                  Upload photos or scans of both sides of your insurance card.
                  Images should be clear and all text readable.
                </p>
              </div>

              {/* Front */}
              <CardUploadField
                label="Front of Insurance Card"
                required
                preview={cardFront}
                inputRef={frontInputRef}
                onSelect={(f) => handleFileSelect(f, setCardFront)}
                onRemove={() => setCardFront(null)}
              />

              {/* Back */}
              <CardUploadField
                label="Back of Insurance Card"
                required={false}
                preview={cardBack}
                inputRef={backInputRef}
                onSelect={(f) => handleFileSelect(f, setCardBack)}
                onRemove={() => setCardBack(null)}
              />

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
                <strong>Privacy notice:</strong> Your insurance card photos are securely stored and used only for insurance verification purposes by your dental practice team.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('insurance')}
                  className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold py-3.5 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!cardFront) {
                      alert('Please upload the front of your insurance card.')
                      return
                    }
                    handleSubmit()
                  }}
                  className="flex-[2] bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3.5 rounded-xl transition"
                >
                  Submit Verification
                </button>
              </div>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Secured by PatientGuard AI · HIPAA-Compliant
        </p>
      </div>
    </div>
  )
}

function CardUploadField({
  label,
  required,
  preview,
  inputRef,
  onSelect,
  onRemove,
}: {
  label: string
  required: boolean
  preview: CardPreview
  inputRef: React.RefObject<HTMLInputElement>
  onSelect: (f: File) => void
  onRemove: () => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200">
          {preview.file.type.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.preview} alt={label} className="w-full h-44 object-cover" />
          ) : (
            <div className="h-44 bg-slate-100 flex items-center justify-center">
              <p className="text-sm text-slate-500">{preview.file.name}</p>
            </div>
          )}
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white border border-slate-200 rounded-full flex items-center justify-center shadow"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-200 hover:border-orange-300 rounded-xl p-6 text-center transition group"
        >
          <Upload className="w-6 h-6 text-slate-400 group-hover:text-orange-400 mx-auto mb-2 transition" />
          <p className="text-sm text-slate-500 group-hover:text-slate-700 transition">
            Tap to upload or take a photo
          </p>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG, or PDF · Max 10 MB</p>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onSelect(f)
        }}
      />
    </div>
  )
}
