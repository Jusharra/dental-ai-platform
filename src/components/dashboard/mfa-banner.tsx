'use client'

import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

interface MfaBannerProps {
  graceEnds: string // ISO date string
}

export function MfaBanner({ graceEnds }: MfaBannerProps) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(graceEnds).getTime() - Date.now()) / 86400000),
  )

  const urgent = daysLeft <= 3

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
      urgent
        ? 'bg-red-600 text-white'
        : 'bg-amber-500 text-white'
    }`}>
      <ShieldAlert className="w-4 h-4 shrink-0" />
      <span className="flex-1">
        <strong>Two-factor authentication required.</strong>{' '}
        {daysLeft === 0
          ? 'Your grace period expires today.'
          : `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to set up MFA before access is restricted.`}
      </span>
      <Link
        href="/mfa/setup"
        className={`shrink-0 font-semibold underline hover:no-underline ${
          urgent ? 'text-white' : 'text-white'
        }`}
      >
        Set up now →
      </Link>
    </div>
  )
}
