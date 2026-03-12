'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, X, Mic, MicOff, PhoneOff } from 'lucide-react'

type CallStatus = 'idle' | 'connecting' | 'active' | 'ending'

export function VapiWidget() {
  const [open, setOpen] = useState(false)
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null)

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID

  useEffect(() => {
    if (!publicKey) return
    import('@vapi-ai/web').then(({ default: Vapi }) => {
      const vapi = new Vapi(publicKey)
      vapi.on('call-start', () => setCallStatus('active'))
      vapi.on('call-end', () => { setCallStatus('idle'); setIsMuted(false) })
      vapi.on('error', () => setCallStatus('idle'))
      vapiRef.current = vapi
    })
    return () => {
      vapiRef.current?.stop()
    }
  }, [publicKey])

  async function startCall() {
    if (!vapiRef.current || !assistantId) return
    setCallStatus('connecting')
    try {
      await vapiRef.current.start(assistantId)
    } catch {
      setCallStatus('idle')
    }
  }

  function endCall() {
    setCallStatus('ending')
    vapiRef.current?.stop()
  }

  function toggleMute() {
    if (!vapiRef.current) return
    vapiRef.current.setMuted(!isMuted)
    setIsMuted(!isMuted)
  }

  if (!publicKey || !assistantId) return null

  return (
    <>
      {/* Floating panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Talk to Serenity</p>
                <p className="text-orange-100 text-xs">AI Dental Assistant</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            {callStatus === 'idle' && (
              <>
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  Have a question? Talk to Serenity — our AI assistant — about pricing, features, or how the platform can work for your practice.
                </p>
                <button
                  onClick={startCall}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Start Voice Call
                </button>
              </>
            )}

            {callStatus === 'connecting' && (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-slate-300 text-sm">Connecting to Serenity...</p>
              </div>
            )}

            {callStatus === 'active' && (
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex gap-1 items-end h-8">
                    {[3, 5, 8, 5, 3, 7, 4].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-orange-500 rounded-full animate-pulse"
                        style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-white font-medium text-sm mb-1">Connected to Serenity</p>
                <p className="text-slate-400 text-xs mb-4">AI assistant is listening</p>
                <div className="flex gap-3">
                  <button
                    onClick={toggleMute}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    onClick={endCall}
                    className="flex-1 bg-red-500 hover:bg-red-400 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Call
                  </button>
                </div>
              </div>
            )}

            {callStatus === 'ending' && (
              <div className="text-center py-4">
                <p className="text-slate-300 text-sm">Ending call...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          callStatus === 'active'
            ? 'bg-green-500 animate-pulse'
            : 'bg-orange-500 hover:bg-orange-400'
        }`}
        aria-label="Talk to Serenity AI"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <Phone className="w-6 h-6 text-white" />}
        {callStatus === 'active' && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />
        )}
      </button>
    </>
  )
}
