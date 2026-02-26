import fetch from "node-fetch";

const rawArgs = process.argv[2];
const accounts = JSON.parse(rawArgs);

async function run() {
    for (let acc of accounts) {
        if (!acc.ad_account_id || !acc.fb_token) continue;
        const id = acc.ad_account_id.replace("act_", "");
        const url = `https://graph.facebook.com/v19.0/act_${id}/insights?fields=spend,actions&date_preset=this_month&access_token=${acc.fb_token}`;
        console.log("----", acc.client_name, "----")
        
        try {
            const r = await fetch(url);
            const d = await r.json();
            if (d.data && d.data.length > 0) {
               console.log("Spend:", d.data[0].spend);
               console.log("Actions:", JSON.stringify(d.data[0].actions, null, 2));
            } else {
               console.log("No data:", JSON.stringify(d));
            }
        } catch (e) {
            console.error("Fetch Error:", e.message)
        }
    }
}
run();
