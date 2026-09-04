# Deployment

Works out of the box on Vercel:

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add the same environment variables as `.env.local`, including the
   server-only `SUPABASE_SERVICE_ROLE_KEY` and `STREAM_API_SECRET`.
4. Deploy.
