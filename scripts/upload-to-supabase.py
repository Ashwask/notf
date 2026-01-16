#!/usr/bin/env python3
"""
Upload all YAML/MD files to Supabase Storage and create metadata records
"""

import os
import requests
from pathlib import Path
import sys

# Supabase configuration
SUPABASE_URL = "https://abblyaukkoxmgzwretvm.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not SUPABASE_SERVICE_KEY:
    print("❌ Error: SUPABASE_SERVICE_KEY environment variable not set")
    print("Usage: SUPABASE_SERVICE_KEY='your-key' python3 upload-to-supabase.py")
    sys.exit(1)

BUCKET_NAME = "notf"
BASE_DIR = Path("/Users/sathya/Documents/GitHub/notf/data")

def upload_file(local_path, storage_path):
    """Upload a file to Supabase Storage"""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{storage_path}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/octet-stream"
    }

    with open(local_path, 'rb') as f:
        response = requests.post(url, headers=headers, data=f)

    if response.status_code in [200, 201]:
        return True, None
    else:
        return False, response.text

def main():
    print("🚀 Starting upload to Supabase Storage...\n")

    # Upload solution providers
    print("📦 Uploading Solution Providers...")
    providers_dir = BASE_DIR / "solution-providers"
    provider_count = 0
    provider_errors = []

    for yaml_file in providers_dir.glob("*.yaml"):
        storage_path = f"solution-providers/{yaml_file.name}"
        success, error = upload_file(yaml_file, storage_path)

        if success:
            provider_count += 1
            print(f"  ✓ {yaml_file.name}")
        else:
            provider_errors.append((yaml_file.name, error))
            print(f"  ✗ {yaml_file.name}: {error}")

    print(f"\n✅ Uploaded {provider_count} solution providers")

    # Upload communities
    print("\n🏘️  Uploading Communities...")
    communities_dir = BASE_DIR / "communities" / "bengaluru"
    community_count = 0
    community_errors = []

    for md_file in communities_dir.glob("*.md"):
        storage_path = f"communities/bengaluru/{md_file.name}"
        success, error = upload_file(md_file, storage_path)

        if success:
            community_count += 1
            print(f"  ✓ {md_file.name}")
        else:
            community_errors.append((md_file.name, error))
            print(f"  ✗ {md_file.name}: {error}")

    print(f"\n✅ Uploaded {community_count} communities")

    # Summary
    print("\n" + "="*60)
    print("📊 UPLOAD SUMMARY")
    print("="*60)
    print(f"Solution Providers: {provider_count} uploaded")
    print(f"Communities: {community_count} uploaded")
    print(f"Total: {provider_count + community_count} files")

    if provider_errors or community_errors:
        print(f"\n⚠️  Errors: {len(provider_errors) + len(community_errors)}")
        for name, error in provider_errors + community_errors:
            print(f"  - {name}")
    else:
        print("\n🎉 All files uploaded successfully!")

if __name__ == '__main__':
    main()
