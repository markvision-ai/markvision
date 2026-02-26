import fs from 'fs';
import * as dotenv from 'dotenv';
const envConfig = dotenv.parse(fs.readFileSync('.env'))

const url = `${envConfig.VITE_SUPABASE_URL}/functions/v1/sync-agency-spend`;
console.log("Calling URL:", url);

async function check() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${envConfig.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (e) {
    console.error("Failed:", e);
  }
}
check();
