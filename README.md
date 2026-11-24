# FNRate

Rate your teammates. Search any Epic name, see their overall score (1-100) plus
Toxicity, Teamwork, Comms and Skill, and leave a rating with optional reviews.

Built with Next.js, Supabase (database + sign-in) and Vercel (hosting).
FNRate is a fan project and is not affiliated with or endorsed by Epic Games.

## Rules the site enforces

- Sign in with email (magic link) or Discord.
- 3 ratings per user per day, 10 with Plus (resets at midnight UTC).
- Each user can rate a given player only once, ever.
- Reviews always belong to one category; slurs from the `banned_words` table are blocked.
- Reviews are hidden automatically after 3 reports.
- Users can pin one player as "my account"; it shows at the top of the home page and can't be rated by them.
- Every score is "higher is better". For Toxicity, 100 means not toxic at all.
- Leaderboards: best teammates, most toxic, best comms, most skilled (3+ ratings to appear).
- Each profile shows its top review, picked by "Helpful" votes.
- FNRate Plus (10 ratings a day) and a paid Supporter badge are built in the database and UI,
  but payments aren't live yet; the Plus page says "Coming soon". Paying never changes scores.

## Setup

See [SETUP.md](SETUP.md) for step-by-step instructions (no coding needed).

## Developing locally

```bash
cp .env.example .env.local   # fill in your Supabase URL and anon key
npm install
npm run dev
```

The database lives in `supabase/schema.sql`.
