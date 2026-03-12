export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">PatientGuard AI</h1>
          <p className="text-muted-foreground mt-1">Dental Patient Operations &amp; Compliance Platform</p>
        </div>
        {children}
      </div>
    </div>
  )
}
