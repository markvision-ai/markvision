import urllib.request
import json
import os
import re

env_file = '.env'
with open(env_file, 'r') as f:
    text = f.read()

url_match = re.search(r'VITE_SUPABASE_URL\s*=\s*"?([^"\n]+)"?', text)
key_match = re.search(r'VITE_SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?([^"\n]+)"?', text)

if not url_match or not key_match:
    print("Cannot find keys")
    exit(1)

url = url_match.group(1).strip()
key = key_match.group(1).strip()

req = urllib.request.Request(f"{url}/rest/v1/clients_config?select=ad_account_id,client_name,fb_token", headers={
    'apikey': key,
    'Authorization': f'Bearer {key}'
})

try:
    with urllib.request.urlopen(req) as response:
        accounts = json.loads(response.read().decode())
        print(f"Loaded {len(accounts)} accounts")
        for acc in accounts:
            if not acc.get('ad_account_id') or not acc.get('fb_token'):
                continue
            id_clean = acc['ad_account_id'].replace('act_', '')
            fb_url = f"https://graph.facebook.com/v19.0/act_{id_clean}/insights?fields=spend,actions&date_preset=this_month&access_token={acc['fb_token']}"
            fb_req = urllib.request.Request(fb_url)
            try:
                with urllib.request.urlopen(fb_req) as fb_res:
                    data = json.loads(fb_res.read().decode())
                    if data.get('data') and len(data['data']) > 0:
                        row = data['data'][0]
                        print(f"[{acc['client_name']}] Spend: {row.get('spend')}")
                        if 'actions' in row:
                            actions_summary = [f"{a.get('action_type')}:{a.get('value')}" for a in row['actions']]
                            print(f"  Actions: {', '.join(actions_summary)}")
                        else:
                            print("  No actions")
                    else:
                        print(f"[{acc['client_name']}] No spend/data.")
            except Exception as e:
                print(f"[{acc['client_name']}] Meta API Error: {e}")
except Exception as e:
    print(f"Supabase Error: {e}")
