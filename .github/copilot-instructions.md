# Copilot Instructions for EdenRAE

## Project Overview
- **Framework:** Next.js (App Router, TypeScript, TailwindCSS)
- **Purpose:** Data-driven analytics and expert consultation platform for agriculture/crop data, with user, expert, and AI expert flows.
- **Key Features:**
  - API-driven data collection and caching on client devices
  - Expert onboarding, selection (AI/Human), and chat
  - Analytics dashboard referencing cached data
  - Secure, user-specific conversation storage (MongoDB, encrypted)

## Architecture & Data Flow
- **API Layer:**
  - All API endpoints are under `app/api/` (e.g., `app/api/experts/`, `app/api/users/`, etc.)
  - API responses are cached per endpoint in client device storage as JSON files (see `utils/dataCache/`)
- **Client Caching:**
  - Each API call's response is stored in a dedicated cache file (e.g., `utils/dataCache/experts.json`)
  - Analytics and data-driven UI (e.g., `app/analytics/data/page.jsx`) reference these cache files for fast, offline-friendly access
- **Expert Flow:**
  - On `/Experts/`, users are onboarded to select data for analysis (from cache), then choose an expert (AI or human)
  - Human experts are users labeled as `Expert` in the users DB; AI experts are React components, not DB entries
  - Conversations are registered in MongoDB (`model/conversation.ts`), encrypted per user, and accessed via `/Experts/chat/[id]`
- **Session & Access:**
  - User sessions are managed and checked for access to conversations (see `lib/sessionHelper.ts`, `lib/encryption.ts`)

## Key Patterns & Conventions
- **Component Organization:**
  - UI components in `components/` (with subfolders for domain areas)
  - Page-level logic in `app/` (App Router structure)
- **Data Caching:**
  - Use `utils/dataCache/` for all persistent client-side API data
  - Cache files are named after their API (e.g., `experts.json`, `users.json`)
- **Expert Search:**
  - Search bar on expert selection queries users with `Expert` label in DB
  - AI experts are handled in React, not DB
- **Security:**
  - All conversation data is encrypted and user-specific
  - Access to chat is validated against session and conversation ownership

## Developer Workflows
- **Start Dev Server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Analytics/Data UI:** Update cache via API, then reference in analytics pages
- **Expert Onboarding:** Update onboarding flow in `app/Experts/page.tsx` and related components

## Integration Points
- **MongoDB:** Models in `app/model/` (e.g., `conversation.ts`, `user.ts`)
- **Stripe/Payments:** See `lib/paymentService.ts`, `scripts/setup-stripe-products.js`
- **Location/Weather APIs:** See `app/api/location/`, `app/api/weather/`

## Examples
- To add a new API and cache its data:
  1. Create endpoint in `app/api/[your-api]/`
  2. Add cache logic in `utils/dataCache/[your-api].json`
  3. Reference cache in relevant UI (e.g., analytics, onboarding)
- To add a new expert type:
  1. For human: label user as `Expert` in DB
  2. For AI: add React component in `components/ExpertsOnboard.tsx`

---

For questions, see `README.mdx` or ask maintainers.
