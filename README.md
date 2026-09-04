# 🎯 Nextfit.ai — AI-Powered Personalized Fitness Assistant

> **Talk to an AI. Get a custom workout + meal plan in 3 minutes.**
> A production-ready, serverless full-stack application showcasing modern web architecture, AI integration, and real-time data synchronization.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Convex](https://img.shields.io/badge/Convex-Serverless-000?style=flat-square)](https://convex.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[🎬 **WATCH DEMO VIDEO**](https://youtu.be/MNqjn9QVTFc?si=LnS4DNLvhiifvdKO)

</div>

---

## 🚀 What Makes This Special

This isn't a CRUD app or a tutorial project. **Nextfit.ai** demonstrates:

✅ **Full-Stack Architecture** — Production-grade serverless stack with zero backend infrastructure to manage  
✅ **AI Integration** — Voice + LLM orchestration with error recovery (validates AI outputs before persistence)  
✅ **Real-Time Sync** — Reactive queries that push updates instantly (no polling, no stale data)  
✅ **Webhook Handling** — Secure Clerk webhook verification with Svix, bidirectional user sync  
✅ **Complex State Management** — Voice call state machine, Vapi lifecycle, plan deactivation logic  
✅ **Type Safety** — 100% TypeScript, auto-generated Convex types catch bugs at compile time  
✅ **Security** — Auth context propagation, environment-secret isolation, webhook signature verification  
✅ **User Experience** — Cyberpunk design system, smooth animations, responsive on all devices

---

## 🎬 Demo

**[→ Watch the demo video](https://youtu.be/MNqjn9QVTFc?si=LnS4DNLvhiifvdKO)** to see:
- User authentication (Clerk)
- AI voice conversation flow
- Real-time plan generation with Google Gemini
- Plan instantly appearing on profile via Convex real-time sync
- Cyberpunk UI in action

---

## 💡 The Problem & Solution

### The Problem
Getting a personalized fitness plan typically requires:
- Filling out long web forms (tedious)
- Waiting 24+ hours for a human coach's response
- Paying $100+ for personalization

### The Solution
**Talk to an AI. Get your plan in 3 minutes. Free.**

```
User: "I'm 28, weigh 180 lbs, have lower back pain, and want to lose weight"
AI: *listens, asks clarifying questions, generates plan*
Convex: *saves workout + diet plan to DB*
Profile: *updates instantly with your new plan*
```

---

## 🏗️ Architecture Overview

### User Journey (End-to-End Data Flow)

```
FRONTEND                          BACKEND                           EXTERNAL SERVICES
─────────────────────────────────────────────────────────────────────────────────────

User clicks "Start Call"
    │
    └──> vapi.start(assistantId, { variableValues: { user_id: "user_2ab..." } })
         │
         └──────────────────────────────────> [Vapi Cloud] 🎙️
                                              │
                                              ├─ Speech-to-Text (AI listens)
                                              │
                                              ├─ LLM Conversation (guides questions)
                                              │
                                              └─ Text-to-Speech (AI speaks)
                                                    │
                                                    ↓ (when ready to generate)
                                                    
                                              POST /vapi/generate-program
                                              (Convex HTTP Action)
                                                    │
                                                    ├──────────────> [Google Gemini] 🧠
                                                    │                 ├─ Validates age/weight/goals
                                                    │                 ├─ Generates workout JSON
                                                    │
                                                    ├──────────────> [Google Gemini] 🧠
                                                    │                 └─ Generates diet JSON
                                                    │
                                                    ├─ Validates outputs (coerce types, strip hallucinations)
                                                    │
                                                    ├─ Writes to Convex DB (transactional)
                                                    │
                                                    └─ Returns { results: [...] } ✅
                                                    
Voice call ends → Auto-redirect to /profile
                                                    
                                                    ↓
useQuery(api.plans.getUserPlans) 
    │
    └──────────────────────────────> [Convex Query] ⚡
                                     (real-time subscription)
                                           │
                                           └─ Pushes new plan to UI
                                              (renders instantly, no refresh)
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 16 + React 19 + TypeScript | Modern SSR, type safety, instant updates |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Utility-first, production-ready components |
| **Database & Backend** | Convex | Serverless, real-time subscriptions, built-in auth, transactional |
| **Auth** | Clerk + Svix | Passwordless, webhook-verified, scales with users |
| **Voice AI** | Vapi (@vapi-ai/web) | Orchestrates voice flow, handles state |
| **LLM** | Google Gemini Flash Lite | Fast, cheap, great for structured JSON output |
| **Hosting** | Vercel (frontend) + Convex (backend) | Both serverless, auto-scale, 99.99% uptime |

---

## 📁 Project Structure

```
codeflex/
├── src/app/
│   ├── (auth)/                          # 🔐 Clerk auth routes (sign-in, sign-up)
│   ├── page.tsx                         # 🏠 Landing page (hero, gallery, CTAs)
│   ├── generate-program/page.tsx        # 🎙️ Voice call interface (state machine, Vapi integration)
│   ├── profile/page.tsx                 # 📊 View & manage fitness plans
│   ├── layout.tsx                       # 🌍 Root layout (providers, grid background)
│   └── globals.css                      # 🎨 Tailwind + cyberpunk theme
│
├── src/components/
│   ├── Navbar.tsx                       # Navigation with auth state
│   ├── UserPrograms.tsx                 # Landing page program gallery
│   ├── ProfileHeader.tsx                # User info card
│   ├── ui/                              # shadcn/ui components (Button, Card, Tabs, etc.)
│   └── ...
│
├── src/providers/
│   ├── ConvexClerkProvider.tsx          # 🔗 Clerk auth + Convex DB provider
│   └── StoreUser.tsx                    # 💾 Idempotent user sync on sign-in
│
├── src/lib/
│   ├── vapi.ts                          # Vapi client initialization
│   └── utils.ts                         # Utility functions
│
├── convex/
│   ├── schema.ts                        # 📋 Database schema (users, plans)
│   ├── users.ts                         # 👤 User CRUD + Clerk webhook sync
│   ├── plans.ts                         # 💪 Plan queries & mutations
│   ├── http.ts                          # 🌐 HTTP webhooks + Vapi integration ⭐
│   ├── auth.config.ts                   # 🔑 Clerk issuer configuration
│   └── _generated/                      # Auto-generated API types (TypeScript)
│
├── public/
│   └── hero-ai*.jpeg                    # Hero images
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .env.example                         # 🔑 Template for environment variables
└── README.md                            # This file
```

---

## 🎨 Design System

The UI follows a **cyberpunk aesthetic** to stand out in a recruiter's portfolio:

- **Typography** — Monospace fonts (Geist Mono) for terminal feel
- **Colors** — Electric blue (#00D9FF) on deep gray/black
- **Effects** — Scanline animations, grid backgrounds, neon glows
- **Components** — Terminal-style cards, corner brackets, pulsing indicators
- **Responsive** — Pixel-perfect on mobile, tablet, desktop

The design is not just pretty—it's **intentional and cohesive**, showing attention to UX detail.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (with npm/yarn)
- Free accounts: Convex, Clerk, Vapi, Google Gemini

### 1️⃣ Clone & Install
```bash
git clone https://github.com/yourusername/codeflex.git
cd codeflex
npm install
```

### 2️⃣ Set Up Convex (Serverless Backend)
```bash
npx convex dev
```
This creates a free Convex account and generates `.env.local`.

### 3️⃣ Configure Secrets
```bash
cp .env.example .env.local
```

Fill in your keys:
- **Clerk** — [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys
- **Vapi** — [dashboard.vapi.ai](https://dashboard.vapi.ai) → Create Assistant
- **Gemini** — [ai.google.dev](https://ai.google.dev/tutorials/setup) → Create API Key
- **Convex** — Auto-generated by `npx convex dev`

### 4️⃣ Set Up Clerk Webhooks
- Go to [Clerk Dashboard](https://dashboard.clerk.com) → Webhooks
- Create endpoint: `https://<convex-url>.convex.site/clerk-webhook`
- Subscribe to: `user.created`, `user.updated`, `user.deleted`
- Copy webhook secret → `.env.local` as `CLERK_WEBHOOK_SECRET`

### 5️⃣ Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 6️⃣ Test the App
1. Sign up with email
2. Click "Build Your Program"
3. Talk to the AI (say your age, weight, fitness goal)
4. Plan appears on `/profile` instantly

---

## 🔑 Environment Variables

```env
# Authentication (get from Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-instance.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_...

# Backend (auto-generated by `npx convex dev`)
CONVEX_DEPLOYMENT=dev:your-project
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.site
NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3000

# Voice AI (get from Vapi Dashboard)
NEXT_PUBLIC_VAPI_ASSISTANT_ID=a_...
NEXT_PUBLIC_VAPI_API_KEY=...

# AI Plan Generation (get from Google AI Studio)
GEMINI_API_KEY=...
```

> **Security Note:** Never commit `.env` or `.env.local`. They contain secrets. Use `.env.example` as a template.

---

## 📊 Database Schema

### `users` Table
```typescript
{
  _id: string;              // Convex auto-generated
  clerkId: string;          // Clerk ID (user_xxx)
  name: string;
  email: string;
  image?: string;           // Profile picture
  _creationTime: number;
}
// Index: by_clerk_id
```

### `plans` Table
```typescript
{
  _id: string;
  userId: string;           // Clerk ID (not Convex _id)
  name: string;             // "Weight Loss Plan - 9/4/2026"
  workoutPlan: {
    schedule: string[];     // ["Monday", "Wednesday", "Friday"]
    exercises: Array<{
      day: string;
      routines: Array<{
        name: string;
        sets: number;
        reps: number;
      }>;
    }>;
  };
  dietPlan: {
    dailyCalories: number;
    meals: Array<{
      name: string;
      foods: string[];
    }>;
  };
  isActive: boolean;        // Only one active per user
  _creationTime: number;
}
// Indexes: by_user_id, by_active
```

---

## 🔒 Security Highlights

✅ **Type-Safe Mutations** — Convex validators prevent invalid data at the database layer  
✅ **Auth Context** — User identity derived from JWT, not function arguments  
✅ **Webhook Verification** — Svix signature validation on every Clerk event  
✅ **Secret Isolation** — Sensitive keys (Gemini) only in server-side actions, never sent to frontend  
✅ **Route Protection** — Clerk middleware guards authenticated routes  
✅ **HTTPS-Only** — All external API calls over HTTPS with proper certificate validation

### Known Considerations
- Vapi endpoint is currently unauthenticated (fix: add API key validation)
- Plans query loads all plans into memory (fix: implement pagination for 100+ plans)
- Gemini calls are sequential (fix: use `Promise.all()` to parallelize)

---

## 🎯 Key Technical Decisions

### Why Convex?
- **Zero backend ops** — No servers to manage, scale, or monitor
- **Real-time subscriptions** — Plans appear on profile instantly without polling
- **Type safety** — Auto-generated TypeScript types for all queries/mutations
- **Transactional** — Multi-document updates are atomic (when you deactivate old plans and create new ones)

### Why Vapi for Voice?
- **State machine abstraction** — Handles call lifecycle, transcription, text-to-speech
- **LLM-agnostic** — Works with any LLM provider (OpenAI, Gemini, Anthropic, etc.)
- **Custom tool calling** — Our HTTP endpoint becomes a tool the assistant can invoke

### Why Google Gemini?
- **Structured output** — `responseMimeType: "application/json"` enforces JSON schema
- **Fast & cheap** — Flash Lite model is perfect for deterministic outputs (not creative content)
- **Validation layer** — Code validates and coerces Gemini's response before writing to DB

---

## 📈 What This Demonstrates (For Recruiters)

- ✅ **Full-stack development** — Frontend + backend + DevOps
- ✅ **Production architecture** — Serverless, scalable, maintainable
- ✅ **AI/LLM integration** — Voice, structured outputs, error recovery
- ✅ **Database design** — Indexes, queries, schema validation
- ✅ **Security** — Auth, webhooks, secret management
- ✅ **State management** — Complex flows (Vapi state machine)
- ✅ **Real-time systems** — Live data synchronization
- ✅ **Type safety** — TypeScript throughout
- ✅ **API design** — RESTful + reactive patterns
- ✅ **User experience** — Responsive, animated, accessible design
- ✅ **Error handling** — Graceful failures, informative messages
- ✅ **Testing mindset** — Defensive validation (Gemini output checking)

---

## 🚢 Deployment

### Deploy Frontend (Vercel)
```bash
npm run build
git push origin main  # Auto-deploys
```

### Deploy Backend (Convex)
```bash
npx convex deploy
```

Update Clerk webhook to production URL:
```
https://<production-deployment>.convex.site/clerk-webhook
```

---

## 🐛 Troubleshooting

**"No Clerk user" error?**
- Make sure you're signed in
- Check that Clerk keys in `.env.local` match your dashboard

**Webhook not triggering?**
- Verify endpoint URL is publicly accessible
- Check Clerk dashboard → Webhooks → logs
- Retry failed events with "Try Again"

**Plans not appearing after call?**
- Check Convex dashboard → Logs for `/vapi/generate-program` errors
- Verify `GEMINI_API_KEY` is valid
- Open DevTools → Network tab → check for failures

**Voice call won't start?**
- Verify `NEXT_PUBLIC_VAPI_ASSISTANT_ID` is set
- Check Vapi dashboard for assistant configuration
- Verify microphone permissions in browser

---

## 📚 Key Files to Review

For code reviewers / recruiters, these files showcase the technical depth:

1. **[convex/http.ts](convex/http.ts)** (418 lines) — Webhook handling, Vapi integration, AI validation
2. **[src/app/generate-program/page.tsx](src/app/generate-program/page.tsx)** (346 lines) — State machine, Vapi lifecycle
3. **[convex/schema.ts](convex/schema.ts)** — Type-safe schema design
4. **[src/providers/ConvexClerkProvider.tsx](src/providers/ConvexClerkProvider.tsx)** — Auth context setup
5. **[src/app/layout.tsx](src/app/layout.tsx)** — Provider composition, styling setup

---

## 🎓 What I Learned Building This

- Voice AI orchestration (Vapi tool calling, state management)
- Serverless database patterns (reactive queries, transactional updates)
- AI output validation (never trust LLM output directly to persistence)
- Webhook security (Svix verification, idempotency)
- Real-time UX (when data appears instantly, users feel delighted)
- Design systems (consistency through constraints)

---

## 🤝 Contributing

Want to improve Nextfit.ai? Contributions welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: your change"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

### Ideas for Contributors
- [ ] Pagination for users with 100+ plans
- [ ] Parallelize Gemini calls (use `Promise.all()`)
- [ ] Add auth to Vapi endpoint
- [ ] Implement plan editing
- [ ] Add export to PDF
- [ ] Dark/light theme toggle
- [ ] Mobile app (React Native)

---

## 📜 License

MIT License — Feel free to use this as a portfolio project or starting point for your own.

---

## 🎬 Demo & Links

| Link | Purpose |
|------|---------|
| 🎥 [**DEMO VIDEO**](https://youtu.be/MNqjn9QVTFc?si=LnS4DNLvhiifvdKO) | See the app in action (end-to-end flow) |
| 📦 [GitHub Repo](#) | Source code |
| 📖 [Convex Docs](https://docs.convex.dev) | Backend framework |
| 🔐 [Clerk Docs](https://clerk.com/docs) | Authentication |
| 🎙️ [Vapi Docs](https://docs.vapi.ai) | Voice AI platform |
| 🧠 [Gemini Docs](https://ai.google.dev) | LLM documentation |

---



