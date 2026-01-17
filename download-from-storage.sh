#!/bin/bash
# Download files from Supabase Storage (bypasses Dashboard cache)

SERVICE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYmx5YXVra294bWd6d3JldHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIzMTg1NCwiZXhwIjoyMDgzODA3ODU0fQ.zh3LcYK1aXoqKXAn2p9rsNSj_3PxFYkuqrLPQ5VLNO8'

if [ -z "$1" ]; then
    echo "Usage: ./download-from-storage.sh <file_path>"
    echo "Example: ./download-from-storage.sh communities/bengaluru/cifos.md"
    exit 1
fi

FILE_PATH="$1"
OUTPUT_FILE=$(basename "$FILE_PATH")

echo "Downloading: $FILE_PATH"
curl -s "https://abblyaukkoxmgzwretvm.supabase.co/storage/v1/object/notf/$FILE_PATH" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -o "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Downloaded to: $OUTPUT_FILE"
    echo "   Size: $(wc -c < "$OUTPUT_FILE") bytes"
else
    echo "❌ Download failed"
fi
