# Textile POS and Billing Software

Next.js 14 (App Router) + TypeScript + Tailwind, PostgreSQL (Neon) with Prisma, JWT auth in httpOnly cookies.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`
3. `npx prisma migrate dev --name init`
4. `npm run db:seed`
5. `npm run dev` and open http://localhost:3000

## Test accounts (created by the seed)
- Admin: admin@textile.test / Admin@123
- Staff: staff@textile.test / Staff@123
https://pos-billing-software-gules.vercel.app
## Access rules
- `/admin`, `/m` (mobile admin) and `/api/admin/*`: ADMIN only
- `/billing` and `/api/billing/*`: STAFF and ADMIN
- Enforced in middleware and again inside each API route
