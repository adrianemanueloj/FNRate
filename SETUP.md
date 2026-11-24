# Putting FNRate online (about 20 minutes, works on a phone)

You need three free accounts: GitHub (you have it), Supabase (database and sign-in)
and Vercel (hosting). Do the steps in order.

## 1. Create the database (Supabase)

1. Go to **supabase.com** and tap **Start your project**. Sign up with GitHub.
2. Tap **New project**. Name: `fnrate`. Make up a database password and save it
   somewhere (you won't need it day to day). Pick the region closest to you
   (e.g. *Central EU (Frankfurt)* or *North EU (Stockholm)*). Tap **Create new project**
   and wait a minute or two.
3. In the left menu open **SQL Editor**, then **New query**.
4. Open `supabase/schema.sql` from the GitHub repo, tap **Raw**, copy everything,
   paste it into the query box and tap **Run**. You should see "Success. No rows returned".
5. Get your keys: left menu **Project Settings** (gear) > **API** (or **Data API** / **API Keys**).
   Copy two things:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (a long text starting with `eyJ...`, sometimes called the
     "publishable" key). **Never** copy the `service_role` / secret key.

## 2. Put the site online (Vercel)

1. Go to **vercel.com** and sign up with GitHub.
2. Tap **Add New… > Project**, find **fnrate** and tap **Import**.
3. Open **Environment Variables** and add two:
   - Name `NEXT_PUBLIC_SUPABASE_URL`, value = your Project URL
   - Name `NEXT_PUBLIC_SUPABASE_ANON_KEY`, value = your anon public key
4. Tap **Deploy**. After a minute you get a link like `https://fnrate.vercel.app`.
   Copy it.

(If you ever change these values later, go to the project's **Deployments** tab and
**Redeploy**, otherwise the site keeps the old ones.)

## 3. Tell Supabase your site address (makes sign-in work)

1. In Supabase: **Authentication > URL Configuration**.
2. **Site URL**: paste your Vercel link, e.g. `https://fnrate.vercel.app`.
3. **Redirect URLs** > **Add URL**: `https://fnrate.vercel.app/**` (your link plus `/**`).
4. Save.

Email sign-in now works. Supabase's built-in email sender only allows a few emails
per hour, which is fine for testing; for a real launch, set up a free email sender
under **Authentication > Emails > SMTP** (e.g. Resend).

## 4. Turn on Discord sign-in (optional, ~5 minutes)

1. Go to **discord.com/developers/applications** and tap **New Application**.
   Name it `FNRate`.
2. Open **OAuth2**. Copy the **Client ID**. Tap **Reset Secret** and copy the
   **Client Secret**.
3. In Supabase: **Authentication > Sign In / Providers > Discord**. Turn it on and paste
   the Client ID and Client Secret. Copy the **Callback URL** shown there
   (ends in `/auth/v1/callback`). Save.
4. Back in Discord **OAuth2 > Redirects > Add Redirect**: paste that Callback URL. Save.

## Handy later

- **Banned words**: Supabase > **Table Editor > banned_words**. Add a row to block a word.
- **Hidden reviews**: Supabase > **Table Editor > reviews**, filter `hidden = true`. Set it
  back to `false` to un-hide a review.
