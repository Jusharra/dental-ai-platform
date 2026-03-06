import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Handshake, GraduationCap, Award, AlertTriangle, ClipboardList, Beaker, AlertOctagon } from 'lucide-react'
import Link from 'next/link'

export default async function CompliancePage() {
  const profile = await getUserProfile()
  const practiceId = profile?.practice_id
  if (!practiceId) return null

  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { count: activePolicies },
    { count: activeBAAs },
    { count: expiringBAAs },
    { count: trainingRecords },
    { count: expiringTraining },
    { count: activeLicenses },
    { count: expiringLicenses },
    { count: riskAssessments },
    { count: sterilizationLogs },
    { count: openIncidents },
  ] = await Promise.all([
    supabase.from('compliance_policies').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'active'),
    supabase.from('business_associate_agreements').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'active'),
    supabase.from('business_associate_agreements').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'active').lte('expiration_date', thirtyDaysFromNow).gte('expiration_date', today),
    supabase.from('training_records').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId),
    supabase.from('training_records').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'completed').lte('expiration_date', thirtyDaysFromNow).gte('expiration_date', today),
    supabase.from('licenses_credentials').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'active'),
    supabase.from('licenses_credentials').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).eq('status', 'active').lte('expiration_date', thirtyDaysFromNow).gte('expiration_date', today),
    supabase.from('risk_assessments').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId),
    supabase.from('sterilization_logs').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId),
    supabase.from('incident_logs').select('*', { count: 'exact', head: true }).eq('practice_id', practiceId).in('status', ['open', 'investigating']),
  ])

  const totalExpiring = (expiringBAAs || 0) + (expiringTraining || 0) + (expiringLicenses || 0)

  const modules = [
    {
      title: 'Policies',
      description: 'HIPAA & OSHA policies',
      icon: FileText,
      href: '/compliance/policies',
      count: activePolicies || 0,
      label: 'active policies',
      alert: false,
    },
    {
      title: 'Business Associate Agreements',
      description: 'BAA tracking & management',
      icon: Handshake,
      href: '/compliance/baas',
      count: activeBAAs || 0,
      label: 'active BAAs',
      alert: (expiringBAAs || 0) > 0,
      alertCount: expiringBAAs,
    },
    {
      title: 'Training Records',
      description: 'Staff training & certifications',
      icon: GraduationCap,
      href: '/compliance/training',
      count: trainingRecords || 0,
      label: 'records',
      alert: (expiringTraining || 0) > 0,
      alertCount: expiringTraining,
    },
    {
      title: 'Licenses & Credentials',
      description: 'Professional license tracking',
      icon: Award,
      href: '/compliance/licenses',
      count: activeLicenses || 0,
      label: 'active licenses',
      alert: (expiringLicenses || 0) > 0,
      alertCount: expiringLicenses,
    },
    {
      title: 'Risk Assessments',
      description: 'HIPAA Security Risk Analysis',
      icon: ClipboardList,
      href: '/compliance/risk-assessments',
      count: riskAssessments || 0,
      label: 'assessments',
      alert: false,
    },
    {
      title: 'Sterilization Logs',
      description: 'Autoclave & infection control testing',
      icon: Beaker,
      href: '/compliance/sterilization',
      count: sterilizationLogs || 0,
      label: 'test records',
      alert: false,
    },
    {
      title: 'Incident Reports',
      description: 'HIPAA breaches, OSHA & safety incidents',
      icon: AlertOctagon,
      href: '/compliance/incidents',
      count: openIncidents || 0,
      label: 'open incidents',
      alert: (openIncidents || 0) > 0,
      alertCount: openIncidents,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance</h1>
        <p className="text-muted-foreground">HIPAA, OSHA & regulatory compliance management</p>
      </div>

      {totalExpiring > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">
                  {totalExpiring} item{totalExpiring > 1 ? 's' : ''} expiring within 30 days
                </p>
                <p className="text-sm text-orange-700">
                  Review and renew expiring BAAs, training records, and licenses.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <module.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                  {module.alert && (
                    <Badge variant="destructive">{module.alertCount} expiring</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{module.count}</div>
                <p className="text-sm text-muted-foreground">{module.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
