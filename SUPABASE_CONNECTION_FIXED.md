# Supabase connection fixed

The frontend is configured to use the same Supabase project shown in the Supabase dashboard:

`https://ryyhsbkuukbctflcetcn.supabase.co`

`supabase-config.js` and `supabase-data.js` now use that exact project URL.

After deploying this build to Vercel, do not use an older cached deployment. Hard-refresh the site or open an Incognito window for testing.
