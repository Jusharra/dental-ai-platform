'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Patient } from '@/types/database'

interface PatientTableProps {
  patients: Patient[]
  currentPage: number
  totalPages: number
}

export function PatientTable({ patients, currentPage, totalPages }: PatientTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function goToPage(page: number) {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('page', page.toString())
    router.push(`/patients?${params.toString()}`)
  }

  if (!patients.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No patients found</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Visit</TableHead>
            <TableHead>Recall Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Link href={`/patients/${patient.id}`} className="font-medium text-primary hover:underline">
                  {patient.patient_name}
                </Link>
              </TableCell>
              <TableCell>{patient.phone}</TableCell>
              <TableCell className="text-muted-foreground">{patient.email || '—'}</TableCell>
              <TableCell>
                <Badge variant={
                  patient.status === 'active' ? 'default' :
                  patient.status === 'inactive' ? 'secondary' : 'outline'
                }>
                  {patient.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{patient.last_visit_date || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{patient.recall_due_date || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
