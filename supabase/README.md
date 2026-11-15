# Resume manager setup

The portfolio remains a static GitHub Pages site. The admin UI calls two Supabase Edge Functions; only those functions receive the Storage service-role key. The `portfolio-resumes` bucket is private, and public resume links use a resolver that creates short-lived signed URLs.

## One-time setup

1. Create a Supabase project and add the administrator account under **Authentication → Users**. There is no public sign-up route.
2. From the repository root, authenticate and link the Supabase CLI:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

3. Set the Edge Function secrets. `SUPABASE_SERVICE_ROLE_KEY` is the privileged key from the Supabase project; keep it in Supabase secrets only.

   ```powershell
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" RESUME_ADMIN_EMAIL="YOUR_ADMIN_EMAIL" SITE_ORIGIN="https://lohithcoders.github.io"
   ```

4. Deploy both functions:

   ```powershell
   npx supabase functions deploy resume-admin
   npx supabase functions deploy resume-public
   ```

5. In GitHub, open **Settings → Secrets and variables → Actions → Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`: the project URL.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the public publishable key (the legacy anon key also works).

   These two values are public client configuration. Never add the service-role key to GitHub Pages variables, source code, or `.env.example`.
6. Run the **Build and deploy portfolio** workflow again. Open `/Lohith-Portfolio/admin/resume/`, sign in with the configured administrator account, then upload, preview, and publish a PDF.

The SQL migration creates the private bucket and version table. Resume updates and restores change the database’s active-version pointer only after the object is verified, so they do not require a website redeploy.
