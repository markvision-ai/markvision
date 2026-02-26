import fs from 'fs';
import fetch from 'node-fetch';

const url = 'https://pyscczcuersdjvpmkiec.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY1ODI4NSwiZXhwIjoyMDgyMjM0Mjg1fQ.oLXVUjT7oB163L4rsS9XMHwe43THPPKyJLU-LgnnIuE';

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function run() {
    console.log("Starting backfill for February 1 to 25 with dynamic rates...");
    for (let day = 1; day <= 25; day++) {
        const dateStr = `2026-02-${String(day).padStart(2, '0')}`;
        console.log(`\nBackfilling for: ${dateStr}`);

        try {
            const res = await fetch(`${url}/functions/v1/sync-agency-spend`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "apikey": key,
                    "Authorization": `Bearer ${key}`
                },
                body: JSON.stringify({ date: dateStr })
            });

            const data = await res.json();
            if (data.success) {
                console.log(`Success -> Exchange Rate: ${data.exchange_rate}`);
                console.log(`Results ->`, data.details.results.length, "accounts synced");
            } else {
                console.error(`Error ->`, data);
            }
        } catch (e) {
            console.error(`Fetch error for ${dateStr}:`, e.message);
        }

        await sleep(1000);
    }
    console.log("\nBackfill complete.");
}
run();
