export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
    env: {
      VITE_SUPABASE_URL: Boolean(supabaseUrl),
      VITE_SUPABASE_ANON_KEY: Boolean(supabaseKey),
      NODE_ENV: process.env.NODE_ENV || 'unknown',
    },
  });
}
