# DEVELOPER PROMPT - DENTAL AI PLATFORM

## 🎯 PROJECT GOAL

Build a Next.js + Supabase web platform to replace Airtable as the backend for our dental AI automation system.

**Current System:**
```
Retell AI → Make.com → Airtable (manual viewing)
```

**New System:**
```
Retell AI → Make.com → Supabase → Next.js Dashboard (professional portal)
```

---

## 📦 WHAT YOU'RE GETTING

This complete starter package with:

✅ **Full database schema** (Supabase SQL - ready to run)  
✅ **Next.js 14 project structure** (App Router + TypeScript)  
✅ **Supabase authentication** (setup examples)  
✅ **Webhook API routes** (example inbound call webhook)  
✅ **Complete documentation** (3 comprehensive guides)  
✅ **Environment setup** (all configs ready)

---

## 🏗️ TECH STACK

**Frontend:** Next.js 14 (React + TypeScript + Tailwind CSS)  
**Database:** Supabase (PostgreSQL + Auth + Storage)  
**API:** Next.js API Routes (serverless functions)  
**Hosting:** Vercel (one-click deploy)  
**External:** Make.com (automation) + Retell AI (voice agents)

**NO separate backend server needed - Next.js API routes handle everything**

---

## 📁 PROJECT FILES

```
dental-ai-platform-nextjs/
├── DEVELOPER_HANDOFF.md          ⭐ READ THIS FIRST (complete guide)
├── SETUP.md                      ⭐ Step-by-step setup (follow this)
├── README.md                     ⭐ Quick reference
│
├── supabase/
│   └── migrations/
│       └── 20260227_initial_schema.sql  ⭐ Database schema (run in Supabase)
│
├── src/
│   ├── app/
│   │   └── api/webhooks/inbound/
│   │       └── route.ts          ⭐ Example webhook (shows how to receive Make.com data)
│   └── lib/supabase/
│       ├── client.ts             ⭐ Browser client setup
│       └── server.ts             ⭐ Server client setup
│
├── .env.local.example            ⭐ Copy to .env.local and fill in
├── package.json                  ⭐ All dependencies listed
├── next.config.js
├── tsconfig.json
└── tailwind.config.ts
```

---

## 🚀 YOUR TASK (4-6 Weeks)

### Week 1: Foundation
- [ ] Set up Supabase project
- [ ] Run database migrations
- [ ] Configure environment variables
- [ ] Get dev server running
- [ ] Test authentication
- [ ] Test database queries

### Week 2: Core Features
- [ ] Build dashboard layout
- [ ] Patient list page (CRUD operations)
- [ ] Appointment calendar view
- [ ] Call logs display
- [ ] Search/filter functionality

### Week 3: Webhooks & Integration
- [ ] Create all webhook endpoints (inbound, recall, confirmation)
- [ ] Test webhooks locally
- [ ] Migrate Airtable data to Supabase
- [ ] Update Make.com scenarios to hit new webhooks
- [ ] Verify end-to-end flow works

### Week 4: Compliance Module
- [ ] Policy management UI
- [ ] BAA tracker
- [ ] Training records
- [ ] License tracking
- [ ] Compliance dashboard

### Week 5: Polish & Deploy
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] Deploy to Vercel
- [ ] Production testing

---

## 📋 KEY DELIVERABLES

### 1. Authentication System
- User sign up/sign in
- Password reset
- Session management
- Role-based access (owner, manager, staff)

### 2. Dashboard
- Today's stats (appointments, calls, no-show rate)
- Upcoming appointments
- Recent activity feed
- Quick actions

### 3. Patient Management
- Patient list (searchable, sortable)
- Patient details page
- Add/edit patient
- Patient history

### 4. Appointment Management
- Calendar view
- Create/edit appointments
- Confirmation status tracking
- Appointment actions (confirm, cancel, reschedule)

### 5. Call Logs
- All call history
- Filter by type (inbound, recall, confirmation)
- View transcripts
- Play recordings

### 6. Compliance Module
- Policy library
- BAA tracker with expiration alerts
- Training records
- License/credential tracking
- Compliance score dashboard

### 7. Webhooks (CRITICAL)
- `/api/webhooks/inbound` - Receive inbound calls
- `/api/webhooks/recall` - Receive recall campaign updates
- `/api/webhooks/confirmation` - Receive confirmation statuses
- All webhooks save to Supabase database

---

## 🔑 CRITICAL REQUIREMENTS

### Security (HIPAA Compliance)
✅ Row-level security (RLS) enabled - users only see their practice data  
✅ All PHI encrypted at rest (Supabase handles this)  
✅ HTTPS only (Vercel handles this)  
✅ Audit logging - log all data access  
✅ Session timeout - 30 minutes  
✅ Webhook authentication - verify secret header

### Performance
✅ Page load < 2 seconds  
✅ API response < 500ms  
✅ Database queries optimized (indexes already created)  
✅ Images optimized (use Next.js Image component)

### Multi-Tenant
✅ Each practice sees ONLY their data  
✅ practice_id filter on all queries  
✅ RLS policies enforce isolation  
✅ Support for multi-location practices (same practice_id)

---

## 📚 DOCUMENTATION TO READ (In Order)

1. **DEVELOPER_HANDOFF.md** (30 min read)
   - Complete project overview
   - Architecture details
   - Database schema explained
   - Webhook integration guide
   - Code examples

2. **SETUP.md** (Follow step-by-step)
   - Initial setup (30 min)
   - Supabase configuration
   - Environment setup
   - Test database
   - Deploy to Vercel

3. **README.md** (Quick reference)
   - Commands cheat sheet
   - Code snippets
   - Troubleshooting

---

## 🔗 RESOURCES

**Your Stack:**
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com (component library)

**Example Projects:**
- Next.js + Supabase Auth: https://github.com/vercel/next.js/tree/canary/examples/with-supabase
- shadcn/ui Dashboard: https://ui.shadcn.com/examples/dashboard

---

## ⚠️ COMMON PITFALLS TO AVOID

1. **DON'T build authentication from scratch** - use Supabase Auth (already configured)

2. **DON'T use client-side only** - use Server Components for data fetching

3. **DON'T forget RLS** - every query must filter by practice_id

4. **DON'T commit .env.local** - it's in .gitignore, keep it that way

5. **DON'T skip webhook security** - always verify x-webhook-secret header

6. **DON'T use localStorage for PHI** - use Supabase (encrypted)

7. **DON'T hardcode practice_id** - get from user session

---

## 🎯 ACCEPTANCE CRITERIA

### Minimum Viable Product (MVP)

✅ **Authentication**
- Users can sign up/sign in/sign out
- Role-based access working

✅ **Patients**
- View list of patients
- Search/filter patients
- View patient details
- Add/edit patient

✅ **Appointments**
- View appointments on calendar
- Create appointment
- Update status (confirmed, cancelled, etc.)

✅ **Call Logs**
- View all calls
- Filter by type/date
- View transcript

✅ **Webhooks**
- Inbound call webhook receiving data
- Data saved to Supabase correctly
- Make.com → Supabase flow working

✅ **Compliance**
- Basic compliance dashboard
- Policy list
- BAA tracker

✅ **Deployment**
- Deployed to Vercel
- Production Supabase connected
- Webhooks working in production

---

## 🧪 TESTING CHECKLIST

Before calling it done:

- [ ] Sign up new user works
- [ ] Sign in works
- [ ] Create patient works
- [ ] Search patients works
- [ ] Create appointment works
- [ ] Webhook receives data correctly
- [ ] RLS prevents cross-practice data access
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] Production deployment works

---

## 💰 TIMELINE & BUDGET ESTIMATE

**Timeline:** 4-6 weeks (full-time developer)  
**Complexity:** Medium  
**Hours Estimate:** 160-240 hours

**Week 1:** 40 hours - Setup + Foundation  
**Week 2:** 40 hours - Core features  
**Week 3:** 40 hours - Webhooks + Integration  
**Week 4:** 40 hours - Compliance module  
**Week 5-6:** 40-80 hours - Polish + Deploy

---

## 📞 SUPPORT & QUESTIONS

**Project Owner:** [Your Name]  
**Email:** [Your Email]  
**Availability:** [Your hours]

**For Questions:**
1. Read the docs first (DEVELOPER_HANDOFF.md, SETUP.md)
2. Check Supabase/Next.js docs
3. Google the error
4. Ask project owner

---

## 🎁 BONUS FEATURES (If Time Permits)

After MVP, consider:
- [ ] Email notifications (appointment reminders)
- [ ] SMS integration (Twilio)
- [ ] Advanced analytics/reporting
- [ ] PDF generation (compliance reports)
- [ ] Export data (CSV, PDF)
- [ ] Multi-language support
- [ ] Mobile app (React Native)

---

## ✅ START HERE

1. **Read DEVELOPER_HANDOFF.md** (30 minutes)
2. **Follow SETUP.md** (1-2 hours to get running)
3. **Test webhook with curl** (verify it works)
4. **Build first feature** (patient list page)
5. **Iterate from there**

---

**Everything you need is in this folder. You got this!** 🚀

**Questions before starting?** Ask now!

**Ready to start?** Begin with `DEVELOPER_HANDOFF.md`

---

**Last Updated:** February 27, 2026  
**Version:** 1.0  
**Project:** Dental AI Platform - Next.js + Supabase
