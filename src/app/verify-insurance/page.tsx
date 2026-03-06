import { Suspense } from 'react'
import InsuranceVerificationForm from './insurance-verification-form'

export const metadata = {
  title: 'Insurance Verification | Dental AI Growth System',
  description: 'Complete your insurance verification securely.',
}

export default function VerifyInsurancePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense fallback={<LoadingState />}>
        <InsuranceVerificationForm token={searchParams.token} />
      </Suspense>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}
