export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Dental Patient Operations</h1>
          <p className="text-muted-foreground mt-1 font-semibold">&amp; Compliance Platform</p>
        </div>
        {children}
      </div>
    </div>
  )
}
