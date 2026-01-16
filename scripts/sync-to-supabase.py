#!/usr/bin/env python3
"""
Complete Supabase Sync Script
- Uploads YAML/MD files to Supabase Storage
- Populates file_metadata table with parsed data
- Creates deployment trigger entries
"""

import os
import requests
import json
import yaml
from pathlib import Path
import sys
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://abblyaukkoxmgzwretvm.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not SUPABASE_SERVICE_KEY:
    print("❌ Error: SUPABASE_SERVICE_KEY environment variable not set")
    print("\nTo get your service key:")
    print("1. Go to https://supabase.com/dashboard/project/abblyaukkoxmgzwretvm")
    print("2. Click Settings → API")
    print("3. Copy the 'service_role' key (NOT the anon key!)")
    print("\nUsage: SUPABASE_SERVICE_KEY='your-key' python3 sync-to-supabase.py")
    sys.exit(1)

BUCKET_NAME = "notf"
BASE_DIR = Path("/Users/sathya/Documents/GitHub/notf/data")

def upload_to_storage(local_path, storage_path):
    """Upload file to Supabase Storage"""
    # Delete existing file first (upsert behavior)
    delete_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{storage_path}"
    headers = {"Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
    requests.delete(delete_url, headers=headers)

    # Upload new file
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{storage_path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "text/plain"
    }

    with open(local_path, 'rb') as f:
        response = requests.post(upload_url, headers=headers, data=f)

    return response.status_code in [200, 201], response.text

def parse_yaml_file(file_path):
    """Parse YAML file and extract metadata"""
    with open(file_path, 'r') as f:
        content = f.read()

    # Handle markdown files with frontmatter
    if file_path.suffix == '.md':
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                yaml_content = parts[1]
                data = yaml.safe_load(yaml_content)
                return data
    else:
        # Regular YAML file
        data = yaml.safe_load(content)
        return data

    return {}

def upsert_metadata(file_path, file_type, city, slug, metadata_json):
    """Insert or update file_metadata in Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/file_metadata"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    data = {
        "file_path": file_path,
        "file_type": file_type,
        "slug": slug,
        "city": city,
        "status": metadata_json.get('status', 'active'),
        "metadata": metadata_json
    }

    response = requests.post(url, headers=headers, json=data)
    return response.status_code in [200, 201], response.text

def main():
    print("🚀 Starting Supabase Sync...")
    print(f"📅 Timestamp: {datetime.now().isoformat()}\n")

    total_uploaded = 0
    total_metadata = 0
    errors = []

    # Process Solution Providers
    print("="*60)
    print("📦 SOLUTION PROVIDERS")
    print("="*60)

    providers_dir = BASE_DIR / "solution-providers"
    for yaml_file in sorted(providers_dir.glob("*.yaml")):
        slug = yaml_file.stem
        storage_path = f"solution-providers/{yaml_file.name}"

        print(f"\n{slug}")

        # Upload to storage
        success, msg = upload_to_storage(yaml_file, storage_path)
        if success:
            print(f"  ✓ Uploaded to storage")
            total_uploaded += 1
        else:
            print(f"  ✗ Storage upload failed: {msg}")
            errors.append((slug, "storage", msg))
            continue

        # Parse and upsert metadata
        try:
            metadata = parse_yaml_file(yaml_file)
            success, msg = upsert_metadata(
                storage_path,
                "solution-provider",
                None,
                slug,
                metadata
            )
            if success:
                print(f"  ✓ Metadata updated")
                total_metadata += 1
            else:
                print(f"  ✗ Metadata failed: {msg}")
                errors.append((slug, "metadata", msg))
        except Exception as e:
            print(f"  ✗ Parse error: {str(e)}")
            errors.append((slug, "parse", str(e)))

    # Process Communities
    print("\n")
    print("="*60)
    print("🏘️  COMMUNITIES")
    print("="*60)

    communities_dir = BASE_DIR / "communities" / "bengaluru"
    for md_file in sorted(communities_dir.glob("*.md")):
        slug = md_file.stem
        storage_path = f"communities/bengaluru/{md_file.name}"

        print(f"\n{slug}")

        # Upload to storage
        success, msg = upload_to_storage(md_file, storage_path)
        if success:
            print(f"  ✓ Uploaded to storage")
            total_uploaded += 1
        else:
            print(f"  ✗ Storage upload failed: {msg}")
            errors.append((slug, "storage", msg))
            continue

        # Parse and upsert metadata
        try:
            metadata = parse_yaml_file(md_file)
            success, msg = upsert_metadata(
                storage_path,
                "community",
                "bengaluru",
                slug,
                metadata
            )
            if success:
                print(f"  ✓ Metadata updated")
                total_metadata += 1
            else:
                print(f"  ✗ Metadata failed: {msg}")
                errors.append((slug, "metadata", msg))
        except Exception as e:
            print(f"  ✗ Parse error: {str(e)}")
            errors.append((slug, "parse", str(e)))

    # Summary
    print("\n")
    print("="*60)
    print("📊 SYNC SUMMARY")
    print("="*60)
    print(f"✅ Files uploaded to storage: {total_uploaded}")
    print(f"✅ Metadata records created: {total_metadata}")

    if errors:
        print(f"\n⚠️  Errors encountered: {len(errors)}")
        for slug, error_type, msg in errors[:10]:  # Show first 10
            print(f"  - {slug} ({error_type}): {msg[:80]}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more")
    else:
        print("\n🎉 All files synced successfully!")

    print("\n✨ Next Steps:")
    print("1. Verify data in Supabase Dashboard → Table Editor → file_metadata")
    print("2. Check storage files at Supabase → Storage → notf bucket")
    print("3. Run the Edge Function setup script")
    print("4. Update website code to fetch from Supabase")

if __name__ == '__main__':
    main()
