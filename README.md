# PotSecret

PotSecret est une application de cagnotte surprise discrete construite avec Next.js App Router, TypeScript, Tailwind CSS, Supabase et Stripe.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + RLS
- Stripe Checkout + Webhooks

## Variables d'environnement

Creez `.env.local` a partir de `.env.example` :

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Demarrage local

```bash
npm install
cp .env.example .env.local
npx supabase db push
npm run dev
```

## Verifications

```bash
npm run typecheck
npm run test
npm run build
```

## Webhook Stripe en local

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Copiez ensuite le `whsec_...` retourne par Stripe CLI dans `STRIPE_WEBHOOK_SECRET`.

## Deploiement Vercel + Supabase + Stripe

1. Creez le projet Supabase et appliquez les migrations :

```bash
npx supabase db push
```

2. Dans Supabase Dashboard :
- activez `Authentication > Providers > Email`
- configurez `Authentication > URL Configuration`
- ajoutez les URLs de callback :
  - `http://localhost:3000/auth/callback`
  - `https://votre-domaine/auth/callback`

3. Dans Stripe Dashboard :
- recuperez `STRIPE_SECRET_KEY`
- creez un webhook vers `https://votre-domaine/api/stripe/webhook`
- abonnez-le au minimum a :
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`
  - `payment_intent.payment_failed`

4. Dans Vercel :
- ajoutez toutes les variables d'environnement de `.env.example`
- definissez `NEXT_PUBLIC_APP_URL` sur l'URL publique finale
- deployez la branche principale

## Checklist V1

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npx supabase db push`
- verifier le login par magic link
- verifier la creation de pot
- verifier un paiement Stripe test complet
- verifier le webhook Stripe
- verifier les acces organisateur vs public
