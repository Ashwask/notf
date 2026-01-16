#!/bin/bash

# Upload YAML/Markdown files to Supabase Storage
# Usage: ./upload-to-supabase.sh <SUPABASE_SERVICE_ROLE_KEY>

set -e

SUPABASE_URL="https://abblyaukkoxmgzwretvm.supabase.co"
BUCKET="notf"

if [ -z "$1" ]; then
    echo "Error: Supabase service role key required"
    echo "Usage: $0 <SUPABASE_SERVICE_ROLE_KEY>"
    exit 1
fi

SERVICE_KEY="$1"
DATA_DIR="/Users/sathya/Documents/GitHub/notf/data"

echo "========================================"
echo "Uploading files to Supabase Storage"
echo "========================================"
echo ""

# Function to upload a file
upload_file() {
    local local_path="$1"
    local remote_path="$2"

    echo "Uploading: $remote_path"

    curl -X POST \
        "$SUPABASE_URL/storage/v1/object/$BUCKET/$remote_path" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "Content-Type: application/x-yaml" \
        --data-binary "@$local_path" \
        -s -o /dev/null -w "HTTP %{http_code}\n"
}

# Upload Solution Providers
echo "Uploading Solution Providers..."
count=0
for file in "$DATA_DIR/solution-providers"/*.yaml; do
    if [ -f "$file" ] && [[ ! $(basename "$file") =~ ^_ ]]; then
        filename=$(basename "$file")
        upload_file "$file" "solution-providers/$filename"
        ((count++))
    fi
done
echo "✓ Uploaded $count solution providers"
echo ""

# Upload Communities (Bengaluru)
echo "Uploading Communities (Bengaluru)..."
count=0
for file in "$DATA_DIR/communities/bengaluru"/*.md; do
    if [ -f "$file" ] && [[ ! $(basename "$file") =~ ^_ ]]; then
        filename=$(basename "$file")
        upload_file "$file" "communities/bengaluru/$filename"
        ((count++))
    fi
done
echo "✓ Uploaded $count communities"
echo ""

# Create placeholder files for other cities
echo "Creating placeholder files for other cities..."
for city in mumbai ahmedabad bhubaneswar; do
    echo "Creating communities/$city/.gitkeep"
    echo "# $city Communities Directory" | curl -X POST \
        "$SUPABASE_URL/storage/v1/object/$BUCKET/communities/$city/.gitkeep" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "Content-Type: text/plain" \
        --data-binary @- \
        -s -o /dev/null -w "HTTP %{http_code}\n"
done

echo ""
echo "========================================"
echo "✅ Upload Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Update load-data.js to fetch from Supabase"
echo "2. Add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel env vars"
echo "3. Test the build with Supabase data"
