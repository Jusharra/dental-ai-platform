'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText } from 'lucide-react'

interface CallTranscriptDialogProps {
  callId: string
  transcript: string
  recordingUrl: string | null
}

export function CallTranscriptDialog({ callId, transcript, recordingUrl }: CallTranscriptDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileText className="h-4 w-4 mr-1" /> View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Call Transcript</DialogTitle>
        </DialogHeader>
        {recordingUrl && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Recording</p>
            <audio controls className="w-full">
              <source src={recordingUrl} />
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
        <ScrollArea className="h-[400px]">
          <div className="text-sm whitespace-pre-wrap leading-relaxed p-4 bg-muted rounded-lg">
            {transcript}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
