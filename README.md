# sofiaamin-web

Sofia's little corner of the internet: a landing page with just her name, plus a private
admin for making Partiful-style party invitations and collecting RSVPs.

- `/` — the landing page
- `/e/<slug>` — a party page guests RSVP on
- `/admin` — create/edit parties, see RSVPs (Google sign-in, allowlisted emails only)

**Stack:** Next.js 16 (standalone output) · Postgres + Drizzle · Auth.js v5 (Google) · Tailwind v4.
Cover photos are stored in Postgres, so the app container is stateless.

## How parties work

- **Sections.** Every party page is a list of sections you can reorder, hide, or add:
  event details, text, callouts (dress code, parking…), schedule, links, Q&A, and guest list.
  The editor shows a live preview as you type.
- **Look & feel.** 8 themes, 6 title fonts, 6 background effects, and a cover that's either an
  uploaded photo or a big emoji.
- **Active / inactive.** A party switches to inactive on its own once it ends (end time, or 4 hours
  after the start if no end is set). You can also flip it manually from the list or editor.
  Inactive pages stay online but RSVPs close with a thank-you note.
- **RSVPs.** Going / Maybe / Can't go, with optional adults + kids count, phone or email, and a note.
  Guests can change their answer later (remembered by a cookie). Optional spot limit and RSVP deadline.
  Export any guest list as CSV.

## Local development

```bash
cp .env.example .env.local   # fill in values (DEV_LOGIN_EMAIL lets you skip Google locally)
npm install
npm run db:up                # Postgres in Docker on port 5434
npm run db:migrate          # optional: the dev server also migrates on start
npm run dev
```

Migrations run automatically when the server starts. After changing `src/db/schema.ts`,
run `npm run db:generate` to create a new migration in `drizzle/` and commit it.

## Deploying on Dokploy

1. **Database.** In your Dokploy project, create a **Postgres** service. Copy its
   *Internal Connection URL*.
2. **Google OAuth.** In Google Cloud Console → APIs & Services → Credentials, create an
   *OAuth client ID* (Web application). Add the redirect URI
   `https://<your-domain>/api/auth/callback/google`.
3. **App.** Create an **Application** from this repo with build type **Dockerfile**
   (path `./Dockerfile`), and set these environment variables:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | the Postgres internal URL |
   | `AUTH_SECRET` | output of `npx auth secret` or `openssl rand -base64 33` |
   | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | from step 2 |
   | `AUTH_URL` | `https://<your-domain>` |
   | `ADMIN_EMAILS` | comma-separated Google accounts allowed into `/admin` |

4. **Domain.** Under *Domains*, add your domain pointing at container port **3000** with HTTPS on.
5. Deploy. The container applies any pending migrations on boot, then serves on port 3000.

Back up the Postgres service from Dokploy's *Backups* tab; it holds everything, including photos.
