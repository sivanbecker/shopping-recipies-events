# This file contain all the date needed to rotate secrets in the project

## SNYK ##

snyk is used in this proj in various ways:

1. [vscode extension](#snyk-vscode-extension)
2. [snyk own repo scanning](#snyk-own-repo-scanning)
3. [CI/CD (using SNYK_TOKEN)](#snyk-in-cicd) 

### SNYK VSCODE EXTENSION
#### what is it for: 
in order to use snyk extension with vscode, 

#### where do i create/invoke/update (url, path description): 
to revoke goto https://app.snyk.io/account/manage/authorized-apps + change auth method in vscode snyk conf just to trigger re-auth of the extention.

#### where do i set it so it can be used (report file/gh configuration etc):
snyk auth method configuration in vscode is oauth and to 
authenticate, click the snyk icon on the left bar, and  
reauthenticate. once authenticated, a new authorized app
appear in snyk account.

_________________________________________________________________________________

### SNYK OWN REPO SCANNING
#### snyk oauth app authorization in github 

#### where do i create/invoke/update (url, path description): 
when im in snyk dashboard, connecting snyk to my github account
in order to choose which repos to scan, i authenticate to github 
and tell github that snyk is as authorized app in my gh account.
https://github.com/settings/applications

#### what is it for: 
the OAuth app isn't only for initial setup — if  Snyk's own repo scanning is enabled (on snyk.io), it keeps using OAuth to pull code.

#### where do i set it so it can be used (report file/gh configuration etc):
once i authorized snyk in github, its on. no need to do anytthing else.

_________________________________________________________________________________

### SNYK IN CI/CD
#### SNYK_TOKEN used in github actions of this 
#### specific repo

#### where do i create/invoke/update:
to create the PAT (personal access token) in snyk goto: https://app.snyk.io/account/personal-access-tokens

#### what is it for:
during CI, snyk test is one of the checks. its defined in ci.yml 

#### where do i set it so it can be used (report file/gh configuration etc):
this is where i set it in gh: https://github.com/<owner>/<repo>/settings/secrets/actions


## SUPABASE ##

the app uses the supabase **publishable** api key (`sb_publishable_...`) as the
browser client key (browser-safe; access is still governed by RLS policies).
legacy `anon` JWT keys are being deprecated by supabase — use publishable keys instead.
no `service_role` / secret key is used anywhere in this project.

the same publishable key value is stored in three places and all three must be
updated together when rotating:

1. [supabase dashboard (the source of truth)](#supabase-dashboard)
2. [.env.local (local dev)](#supabase-in-envlocal)
3. [vercel env variables (prod + preview deploys)](#supabase-in-vercel)
4. [github actions secret (CI E2E job)](#supabase-in-github-actions)

### SUPABASE DASHBOARD
#### what is it for:
this is where the key itself is created and revoked. the value created here
is what gets copied into .env.local, vercel, and github actions.

#### where do i create/invoke/update:
https://supabase.com/dashboard/project/<supabase-project-ref>/settings/api-keys
→ create a new publishable key.
keep the old key enabled until .env.local, vercel, and github actions are all
updated and verified, then disable the old key from the same page.

#### where do i set it so it can be used (report file/gh configuration etc):
nothing to set in supabase itself — the key takes effect the moment it exists.
consumers are configured in the three locations below.

_________________________________________________________________________________

### SUPABASE IN .env.local
#### what is it for:
used by `npm run dev` for local development. read by vite at dev-server startup
(see src/lib/supabase.ts).

#### where do i create/invoke/update:
edit the local file `.env.local` at the repo root (gitignored — never commit it).
set `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...` to the value from the
supabase dashboard.

#### where do i set it so it can be used (report file/gh configuration etc):
restart the dev server (`npm run dev`) so vite picks up the new env value.

_________________________________________________________________________________

### SUPABASE IN VERCEL
#### what is it for:
used by the vercel production and preview deploys. vite reads it at build time
and bakes it into the client bundle.

#### where do i create/invoke/update:
https://vercel.com/<vercel-team>/<project>/settings/environment-variables
→ update `VITE_SUPABASE_PUBLISHABLE_KEY` for **Production**, **Preview**, and
**Development** environments.

#### where do i set it so it can be used (report file/gh configuration etc):
trigger a new deploy (vercel does NOT auto-redeploy when env vars change). either
push a commit or click **Redeploy** on the latest production deployment.

_________________________________________________________________________________

### SUPABASE IN GITHUB ACTIONS
#### what is it for:
used by the E2E job in `.github/workflows/ci.yml` (runs on push to main) so
playwright can hit a real supabase instance.

#### where do i create/invoke/update:
https://github.com/<owner>/<repo>/settings/secrets/actions
→ update the `VITE_SUPABASE_PUBLISHABLE_KEY` repo secret.

#### where do i set it so it can be used (report file/gh configuration etc):
no further wiring needed — ci.yml already references
`${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}`. next CI run on main will use the
new value.