'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Play, Pause, CheckCircle, Loader2 } from 'lucide-react'

type Campaign = {
  id: string
  status: string
}

export function CampaignActions({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function doAction(action: 'activate' | 'pause' | 'complete') {
    setLoading(true)
    await fetch(`/api/recalls/${campaign.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setLoading(false)
    router.refresh()
  }

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  }

  return (
    <div className="flex items-center gap-1">
      {campaign.status === 'draft' && (
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
          onClick={() => doAction('activate')}>
          <Play className="h-3 w-3" /> Activate
        </Button>
      )}
      {campaign.status === 'active' && (
        <>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => doAction('pause')}>
            <Pause className="h-3 w-3" /> Pause
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => doAction('complete')}>
            <CheckCircle className="h-3 w-3" /> Complete
          </Button>
        </>
      )}
      {campaign.status === 'paused' && (
        <>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => doAction('activate')}>
            <Play className="h-3 w-3" /> Resume
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => doAction('complete')}>
            <CheckCircle className="h-3 w-3" /> Complete
          </Button>
        </>
      )}
    </div>
  )
}
