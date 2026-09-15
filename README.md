# Auth starter for your Next.js app

## What's in here

```
app/
  layout.tsx        root layout, wraps everything in AuthProvider + Navbar
  page.tsx           landing page (hero + Sign in / Get started)
  globals.css         tailwind directives (merge with your existing one)
  signin/page.tsx     sign in form
  signup/page.tsx     sign up form
  dashboard/page.tsx  placeholder page, protected — redirects to /signin if not logged in
components/
  Navbar.tsx          top nav: Sign in/Sign up, or Dashboard/Sign out once logged in
lib/
  api.ts              fetch calls to your NestJS backend (/auth/login, /auth/register)
  auth-context.tsx    React context holding the JWT, exposes useAuth()
  config.ts           product name/tagline/description — edit this to change the copy
```

## Install

1. Copy `app/`, `components/`, and `lib/` into your project root (merge `app/globals.css`
   with your existing one if you already have Tailwind set up — just keep the three
   `@tailwind` lines).
2. Make sure you have the `@/*` path alias in `tsconfig.json` pointing at your project
   root (this is the default `create-next-app` gives you):
   ```json
   "paths": { "@/*": ["./*"] }
   ```
3. Add a `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
   (point it at wherever your NestJS API runs)

## Connecting to your NestJS backend

`lib/api.ts` posts to `POST {API_URL}/auth/login` and `POST {API_URL}/auth/register`,
sending `{ email, password }` (and `name` for register), and expects back:

```json
{ "accessToken": "...", "user": { "id": "...", "email": "..." } }
```

If your NestJS controller uses different paths or field names (e.g. `access_token`
instead of `accessToken`, or `/auth/signup` instead of `/auth/register`), edit the
paths and the `AuthResponse` type at the top of `lib/api.ts` — everything else
(context, forms, redirects) works off that one file.

**CORS:** since the frontend and backend are different origins in dev, enable CORS on
the NestJS side for your frontend's origin, e.g. in `main.ts`:
```ts
app.enableCors({ origin: "http://localhost:3000" });
```

## How auth flows

- Sign in/up forms call `useAuth().signIn` / `signUp` (from `lib/auth-context.tsx`).
- On success, the JWT is saved to `localStorage` and the user is redirected to `/dashboard`.
- `Navbar` reads `isAuthenticated` from the same context to switch between
  Sign in/Sign up and Dashboard/Sign out.
- `/dashboard` checks `isAuthenticated` on mount and redirects to `/signin` if there's
  no token — that's the pattern to copy for any other page you want behind auth.
- To attach the token to future API calls, read `useAuth().token` and send it as
  `Authorization: Bearer ${token}`.

Note: the token is stored in `localStorage`, which is simple but readable by any JS
on the page (XSS risk). If you want stronger protection later, switch to an httpOnly
cookie set by the backend and verify it in Next.js middleware instead.

## Customize

Edit `lib/config.ts` for the product name, tagline, and description shown on the
landing page and in the `<title>` tag.

can you set more futuristic and at the same time simple and minimalistic design.
Create content inside(i created concept ) so page will be not empty.
The concept is this:
This is app that will consists of 3 subapps that will be comunicating some how with each other.
1st app is about food: recipies, plans what to eat, menu, receipts and so on,
2nd app is about finance, how many  earned, how much spent, and so on
3rd app is  about future, plans what to do, simple todo lists, and so on