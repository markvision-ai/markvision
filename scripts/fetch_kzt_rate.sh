#!/bin/bash
# Fetches current USD to KZT exchange rate using a free API

# Use curl to fetch data (silent mode, follow redirects)
RESPONSE=$(curl -sL "https://api.exchangerate-api.com/v4/latest/USD")

# Check if response is valid JSON
if ! echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
    echo "Error: Failed to fetch valid JSON response" >&2
    exit 1
fi

# Extract KZT rate
RATE=$(echo "$RESPONSE" | jq -r '.rates.KZT')

# Check if rate is a valid number
if [[ -z "$RATE" || "$RATE" == "null" ]]; then
    echo "Error: KZT rate not found in response" >&2
    exit 1
fi

# Output rate
echo "$RATE"
