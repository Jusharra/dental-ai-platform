# DENTAL AI PLATFORM

> HIPAA-Compliant Dental Practice Automation & Compliance Management System

**Built with:** Next.js 14 + Supabase + TypeScript

---

## 🚀 QUICK START

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Set Up Supabase

1. Create account at [https://supabase.com](https://supabase.com)
2. Create new project
3. Copy your project URL and anon key
4. Run the database schema:
   - Go to Supabase Studio → SQL Editor
   - Copy/paste entire `supabase/migrations/20260227_initial_schema.sql`
   - Click "Run"

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEBHOOK_SECRET=generate-random-secret
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 PROJECT STRUCTURE

```
dental-ai-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages
│   │   ├── (dashboard)/       # Protected routes
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── lib/                   # Utilities
│   │   └── supabase/         # Supabase clients
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # Database schema
├── .env.local.example         # Environment template
└── package.json
```

---

## 🔐 AUTHENTICATION

### Sign Up New User

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'Dr. Smith',
      practice_id: 'practice-uuid',
      role: 'practice_owner'
    }
  }
})
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### Get Current User

```typescript
const { data: { user } } = await supabase.auth.getUser()
```

---

## 🗄️ DATABASE

### Query Patients

```typescript
const { data: patients, error } = await supabase
  .from('patients')
  .select('*')
  .eq('practice_id', practiceId)
  .order('last_name', { ascending: true })
```

### Create Patient

```typescript
const { data, error } = await supabase
  .from('patients')
  .insert({
    practice_id: practiceId,
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1234567890',
    email: 'john@example.com'
  })
  .select()
  .single()
```

### Update Patient

```typescript
const { data, error } = await supabase
  .from('patients')
  .update({ phone: '+0987654321' })
  .eq('id', patientId)
```

---

## 🔗 WEBHOOK ENDPOINTS

### Inbound Call Webhook

**Endpoint:** `POST /api/webhooks/inbound`

Create file: `src/app/api/webhooks/inbound/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook secret
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse payload
    const payload = await request.json()
    
    // 3. Create Supabase client (service role for webhooks)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. Find or create patient
    let patient
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', payload.patient_phone)
      .eq('practice_id', payload.practice_id)
      .single()
    
    if (existingPatient) {
      patient = existingPatient
    } else {
      const { data: newPatient } = await supabase
        .from('patients')
        .insert({
          practice_id: payload.practice_id,
          first_name: payload.patient_name?.split(' ')[0] || '',
          last_name: payload.patient_name?.split(' ')[1] || '',
          phone: payload.patient_phone,
        })
        .select()
        .single()
      
      patient = newPatient
    }

    // 5. Create appointment if booked
    if (payload.call_outcome === 'appointment_booked') {
      await supabase.from('appointments').insert({
        practice_id: payload.practice_id,
        patient_id: patient.id,
        provider_name: payload.provider_name || 'TBD',
        appointment_date: payload.appointment_date,
        appointment_time: payload.appointment_time,
        status: 'scheduled',
      })
    }

    // 6. Log the call
    await supabase.from('call_logs').insert({
      practice_id: payload.practice_id,
      patient_id: patient.id,
      call_type: 'inbound',
      retell_call_id: payload.call_id,
      phone_number: payload.patient_phone,
      call_date: new Date().toISOString().split('T')[0],
      call_time: new Date().toISOString().split('T')[1].split('.')[0],
      call_duration_seconds: payload.call_duration,
      call_outcome: payload.call_outcome,
      transcript: payload.transcript,
      recording_url: payload.recording_url,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Make.com Configuration

In your Make.com scenario, add HTTP module at the end:

```
URL: https://your-app.vercel.app/api/webhooks/inbound
Method: POST
Headers:
  x-webhook-secret: your-webhook-secret
Body:
{
  "call_id": "{{retell_call_id}}",
  "practice_id": "{{practice_id}}",
  "patient_phone": "{{patient_phone}}",
  "patient_name": "{{patient_name}}",
  "call_duration": {{call_duration}},
  "call_outcome": "{{call_outcome}}",
  "appointment_date": "{{appointment_date}}",
  "appointment_time": "{{appointment_time}}",
  "transcript": "{{transcript}}",
  "recording_url": "{{recording_url}}"
}
```

---

## 🎨 UI COMPONENTS

### Install shadcn/ui

```bash
npx shadcn-ui@latest init
```

### Add Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
```

### Example: Patient List Component

```typescript
// src/components/patients/patient-list.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function PatientList({ practiceId }: { practiceId: string }) {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPatients() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('practice_id', practiceId)
        .order('last_name', { ascending: true })
      
      if (data) setPatients(data)
      setLoading(false)
    }
    
    loadPatients()
  }, [practiceId])

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      {patients.map(patient => (
        <div key={patient.id} className="p-4 border rounded">
          <h3 className="font-semibold">
            {patient.first_name} {patient.last_name}
          </h3>
          <p className="text-sm text-gray-600">{patient.phone}</p>
          <p className="text-sm text-gray-600">{patient.email}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 📊 DATA MIGRATION FROM AIRTABLE

### Export Airtable Data

1. Go to each Airtable base
2. Export as CSV
3. Save to `data/airtable-exports/`

### Import to Supabase

Option 1: Use Supabase Studio CSV import

Option 2: Write migration script:

```typescript
// scripts/migrate-airtable.ts
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import csv from 'csv-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migratePatients() {
  const patients: any[] = []
  
  fs.createReadStream('data/airtable-exports/patients.csv')
    .pipe(csv())
    .on('data', (row) => {
      patients.push({
        practice_id: 'your-practice-id',
        first_name: row['First Name'],
        last_name: row['Last Name'],
        phone: row['Phone'],
        email: row['Email'],
        // Map other fields...
      })
    })
    .on('end', async () => {
      const { data, error } = await supabase
        .from('patients')
        .insert(patients)
      
      if (error) {
        console.error('Migration error:', error)
      } else {
        console.log(`✓ Migrated ${data.length} patients`)
      }
    })
}

migratePatients()
```

Run with:
```bash
npx tsx scripts/migrate-airtable.ts
```

---

## 🚀 DEPLOYMENT

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Add environment variables
5. Deploy!

### Environment Variables in Vercel

Go to Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
WEBHOOK_SECRET=...
```

### Update Make.com Webhooks

Change all webhook URLs from Airtable to:
```
https://your-app.vercel.app/api/webhooks/[endpoint]
```

---

## 🔒 SECURITY

### Row Level Security (RLS)

Already configured in database schema. Users can only access data from their practice.

### API Security

All webhooks verify secret in header:

```typescript
const secret = request.headers.get('x-webhook-secret')
if (secret !== process.env.WEBHOOK_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### HTTPS

Vercel provides automatic HTTPS for all deployments.

---

## 📚 DOCUMENTATION

- **DEVELOPER_HANDOFF.md** - Complete developer guide
- **supabase/migrations/** - Database schema
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)

---

## 🆘 TROUBLESHOOTING

### Database Connection Failed

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### RLS Errors

If getting "permission denied" errors, check:
1. User is authenticated
2. User has practice_id set
3. RLS policies are enabled

### Webhook Not Receiving Data

1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check Make.com scenario is running
4. View logs in Vercel dashboard

---

## 📞 SUPPORT

**Project Owner:** [Your Name]  
**Email:** [Your Email]  
**Documentation:** See DEVELOPER_HANDOFF.md

---

## ✅ CHECKLIST

- [ ] Supabase project created
- [ ] Database schema migrated
- [ ] Environment variables configured
- [ ] Development server running
- [ ] Authentication tested
- [ ] Database queries working
- [ ] Webhook endpoint created
- [ ] Make.com webhooks updated
- [ ] Data migrated from Airtable
- [ ] Deployed to Vercel

---

**Ready to build!** 🚀

Start with `DEVELOPER_HANDOFF.md` for complete instructions.
