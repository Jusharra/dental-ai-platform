# SETUP GUIDE - DENTAL AI PLATFORM

**Complete step-by-step setup instructions for your developer**

---

## 🎯 OVERVIEW

You're building a Next.js + Supabase platform to replace Airtable as the backend for your dental AI automation system.

**Current System:**
- Make.com scenarios → Airtable → Retell AI

**New System:**
- Make.com scenarios → Supabase (via webhooks) → Next.js Dashboard

---

## ✅ PREREQUISITES

Install these before starting:

1. **Node.js 20+**
   - Download: https://nodejs.org
   - Verify: `node --version`

2. **pnpm** (or npm/yarn)
   ```bash
   npm install -g pnpm
   ```

3. **Git**
   - Verify: `git --version`

4. **Supabase Account**
   - Sign up: https://supabase.com

5. **Vercel Account** (for deployment)
   - Sign up: https://vercel.com

---

## 📦 STEP 1: PROJECT SETUP (10 minutes)

### 1.1 Clone/Download Project

```bash
# If using Git
git clone <your-repo-url>
cd dental-ai-platform

# OR if you have the ZIP
unzip dental-ai-platform.zip
cd dental-ai-platform
```

### 1.2 Install Dependencies

```bash
pnpm install
```

This will install:
- Next.js 14
- Supabase JS Client
- TypeScript
- Tailwind CSS
- All other dependencies

---

## 🗄️ STEP 2: SUPABASE SETUP (15 minutes)

### 2.1 Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name:** dental-ai-platform
   - **Database Password:** (Save this!)
   - **Region:** Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### 2.2 Get API Credentials

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

### 2.3 Run Database Migrations

1. In Supabase Studio, go to **SQL Editor**
2. Click "New query"
3. Open file: `supabase/migrations/20260227_initial_schema.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success. No rows returned"

**Verify Tables Created:**

Run this query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 15+ tables including:
- practices
- users
- patients
- appointments
- call_logs
- compliance_policies
- etc.

---

## 🔐 STEP 3: ENVIRONMENT SETUP (5 minutes)

### 3.1 Create .env.local File

```bash
cp .env.local.example .env.local
```

### 3.2 Edit .env.local

Open `.env.local` and fill in:

```env
# From Supabase (Step 2.2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

# Generate random secret for webhooks
WEBHOOK_SECRET=your-random-32-character-secret

# Optional (can add later)
MAKE_API_KEY=
RETELL_API_KEY=
```

**Generate Webhook Secret:**
```bash
# macOS/Linux
openssl rand -hex 32

# Or just use any random 32+ character string
```

---

## 🚀 STEP 4: RUN DEVELOPMENT SERVER (2 minutes)

```bash
pnpm dev
```

You should see:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 1.2s
```

Open browser to: **http://localhost:3000**

---

## ✅ STEP 5: TEST AUTHENTICATION (10 minutes)

### 5.1 Create First User

You have two options:

**Option A: Use Supabase Studio (Easiest)**

1. Go to Supabase → Authentication → Users
2. Click "Add user"
3. Fill in:
   - Email: admin@example.com
   - Password: Test123!@#
   - Auto confirm: ✓ YES
4. Click "Create user"
5. Go to SQL Editor and run:
   ```sql
   -- Create demo practice
   INSERT INTO practices (id, name, subscription_tier, subscription_status)
   VALUES (
     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'Demo Practice',
     'professional',
     'active'
   );
   
   -- Link user to practice
   UPDATE users 
   SET practice_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
       role = 'practice_owner'
   WHERE email = 'admin@example.com';
   ```

**Option B: Build Sign-Up Page (Later)**

Create `src/app/(auth)/signup/page.tsx` with sign-up form.

### 5.2 Test Login

Try logging in with your test credentials.

---

## 📊 STEP 6: TEST DATABASE QUERIES (10 minutes)

### 6.1 Add Test Patient

In Supabase SQL Editor:

```sql
INSERT INTO patients (
  practice_id,
  first_name,
  last_name,
  phone,
  email,
  status
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'John',
  'Doe',
  '+1234567890',
  'john@example.com',
  'active'
);
```

### 6.2 Query from Next.js

Create test page: `src/app/test/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = createClient()
  
  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .limit(10)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test: Patients</h1>
      <pre>{JSON.stringify(patients, null, 2)}</pre>
    </div>
  )
}
```

Visit: http://localhost:3000/test

You should see your test patient!

---

## 🔗 STEP 7: TEST WEBHOOK (15 minutes)

### 7.1 Test Locally with curl

```bash
curl -X POST http://localhost:3000/api/webhooks/inbound \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-webhook-secret" \
  -d '{
    "call_id": "test_123",
    "practice_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "patient_phone": "+19876543210",
    "patient_name": "Jane Smith",
    "call_duration": 120,
    "call_outcome": "appointment_booked",
    "appointment_date": "2026-03-20",
    "appointment_time": "14:00:00",
    "provider_name": "Dr. Johnson",
    "transcript": "Test call transcript",
    "recording_url": "https://example.com/recording.mp3"
  }'
```

Expected response:
```json
{
  "success": true,
  "patient_id": "...",
  "appointment_id": "..."
}
```

### 7.2 Verify in Database

Check Supabase:

```sql
-- Check patient created
SELECT * FROM patients WHERE phone = '+19876543210';

-- Check appointment created
SELECT * FROM appointments WHERE provider_name = 'Dr. Johnson';

-- Check call logged
SELECT * FROM call_logs WHERE retell_call_id = 'test_123';
```

---

## 📤 STEP 8: MIGRATE DATA FROM AIRTABLE (30 minutes)

### 8.1 Export Airtable Data

1. Go to each Airtable base
2. Click "..." → Export to CSV
3. Download all tables:
   - Patients
   - Appointments
   - Call Logs (if any historical data)

### 8.2 Clean CSV Data

Open CSVs and:
- Remove Airtable ID columns
- Rename columns to match Supabase schema
- Save as UTF-8

### 8.3 Import to Supabase

**Option A: Supabase Studio (Easiest for small datasets)**

1. Go to Table Editor
2. Select table (e.g., patients)
3. Click "Insert" → "Import data from CSV"
4. Upload your CSV
5. Map columns
6. Click "Import"

**Option B: Write Migration Script (Better for large datasets)**

See `README.md` for example migration script.

---

## 🔄 STEP 9: UPDATE MAKE.COM SCENARIOS (20 minutes)

### 9.1 Deploy to Vercel First

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Copy your production URL (e.g., `https://dental-ai-platform.vercel.app`)

### 9.2 Update Each Make.com Scenario

For each scenario (Inbound, Recall, Confirmation, Reminders):

1. Find the **Airtable module** at the end
2. Replace with **HTTP module**
3. Configure:
   - **URL:** `https://your-app.vercel.app/api/webhooks/[endpoint]`
   - **Method:** POST
   - **Headers:**
     - `Content-Type`: application/json
     - `x-webhook-secret`: your-webhook-secret
   - **Body:** Map fields from Retell AI to expected payload

**Example for Inbound:**

```json
{
  "call_id": "{{1.call_id}}",
  "practice_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "patient_phone": "{{1.from_number}}",
  "patient_name": "{{1.customer_name}}",
  "call_duration": {{1.duration}},
  "call_outcome": "{{1.outcome}}",
  "appointment_date": "{{1.appointment_date}}",
  "appointment_time": "{{1.appointment_time}}",
  "provider_name": "{{1.provider}}",
  "transcript": "{{1.transcript}}",
  "recording_url": "{{1.recording_url}}"
}
```

### 9.3 Test Make.com → Supabase Flow

1. Trigger a test call in Retell AI
2. Check Make.com scenario runs successfully
3. Verify data appears in Supabase
4. Check Next.js dashboard shows new data

---

## 🎨 STEP 10: BUILD DASHBOARD UI (Ongoing)

### 10.1 Install shadcn/ui

```bash
npx shadcn-ui@latest init
```

Follow prompts (accept defaults).

### 10.2 Add Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add calendar
```

### 10.3 Build Pages

Priority order:
1. **Dashboard** - Overview stats
2. **Patients** - List, search, view details
3. **Appointments** - Calendar view
4. **Call Logs** - Activity feed
5. **Compliance** - Compliance tracker

See `DEVELOPER_HANDOFF.md` for detailed feature requirements.

---

## 🚢 STEP 11: PRODUCTION DEPLOYMENT

### 11.1 Vercel Setup

1. Push code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import GitHub repository
5. Configure:
   - Framework: Next.js
   - Root Directory: ./
   - Build Command: `pnpm build`
   - Output Directory: .next
6. Add environment variables (same as .env.local)
7. Click "Deploy"

### 11.2 Supabase Production

Your development database can be production for now.

Later, create separate production project:
1. Create new Supabase project (production)
2. Run same migration
3. Update Vercel env vars to production credentials

### 11.3 Custom Domain (Optional)

1. Buy domain (e.g., yourpractice.com)
2. In Vercel → Settings → Domains
3. Add custom domain
4. Update DNS records

---

## ✅ VERIFICATION CHECKLIST

- [ ] Node.js installed
- [ ] Project dependencies installed
- [ ] Supabase project created
- [ ] Database schema migrated
- [ ] Environment variables configured
- [ ] Development server running
- [ ] Test user created
- [ ] Database queries working
- [ ] Webhook receiving data
- [ ] Airtable data migrated
- [ ] Make.com scenarios updated
- [ ] Dashboard UI started
- [ ] Deployed to Vercel
- [ ] Production webhooks working

---

## 🆘 TROUBLESHOOTING

### Port 3000 Already in Use

```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

### Database Connection Failed

Check:
1. Supabase URL correct
2. API keys correct
3. RLS policies not blocking queries

### Webhook Returns 401

Check:
1. `x-webhook-secret` header included
2. Secret matches `.env.local`
3. Using POST method

### RLS Permission Denied

Make sure:
1. User is authenticated
2. User has `practice_id` set
3. Query includes `practice_id` filter

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild
pnpm build
```

---

## 📞 NEED HELP?

1. **Check documentation:**
   - README.md
   - DEVELOPER_HANDOFF.md
   - This file (SETUP.md)

2. **Supabase Docs:**
   https://supabase.com/docs

3. **Next.js Docs:**
   https://nextjs.org/docs

4. **Project Owner:**
   [Contact info]

---

## 🎓 NEXT STEPS

After setup:

1. **Week 1:**
   - Build authentication flow
   - Create main dashboard
   - Patient list page

2. **Week 2:**
   - Appointment calendar
   - Call logs
   - Search functionality

3. **Week 3:**
   - Compliance module
   - Document uploads
   - Reporting

4. **Week 4:**
   - Testing
   - Polish
   - Production deployment

---

**You're all set! Start building!** 🚀
