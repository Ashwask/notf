#!/usr/bin/env python3
"""
Upload YAML/Markdown files to Supabase Storage and populate metadata table
"""

import os
import yaml
import json
import requests
from pathlib import Path
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://abblyaukkoxmgzwretvm.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_SERVICE_KEY environment variable not set")
    print("Usage: export SUPABASE_SERVICE_KEY='your-service-key' && python3 upload-and-sync-supabase.py")
    exit(1)

BUCKET_NAME = "notf"
DATA_DIR = Path("/Users/sathya/Documents/GitHub/notf/data")

headers = {
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "apikey": SUPABASE_SERVICE_KEY
}

def upload_file_to_storage(local_path, remote_path):
    """Upload a file to Supabase Storage"""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{remote_path}"

    with open(local_path, 'rb') as f:
        file_content = f.read()

    # Determine content type
    content_type = "application/x-yaml" if local_path.suffix == '.yaml' else "text/markdown"

    upload_headers = {
        **headers,
        "Content-Type": content_type
    }

    # Try to upload (upsert)
    response = requests.post(url, headers=upload_headers, data=file_content)

    if response.status_code in [200, 201]:
        print(f"✓ Uploaded: {remote_path}")
        return True
    elif response.status_code == 409:  # File exists, try update
        response = requests.put(url, headers=upload_headers, data=file_content)
        if response.status_code in [200, 201]:
            print(f"✓ Updated: {remote_path}")
            return True

    print(f"✗ Failed to upload {remote_path}: {response.status_code} - {response.text}")
    return False

def parse_yaml_frontmatter(file_path):
    """Parse YAML frontmatter from markdown or pure YAML"""
    with open(file_path, 'r') as f:
        content = f.read()

    if file_path.suffix == '.md':
        # Parse frontmatter from markdown
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 2:
                return yaml.safe_load(parts[1])
    else:
        # Pure YAML file
        return yaml.safe_load(content)

    return {}

def insert_file_metadata(file_path, file_type, slug, city=None):
    """Insert or update file metadata in database"""
    url = f"{SUPABASE_URL}/rest/v1/file_metadata"

    # Parse the file to get metadata
    local_file = DATA_DIR / file_path.replace('solution-providers/', 'solution-providers/').replace('communities/bengaluru/', 'communities/bengaluru/')

    if file_type == 'solution-provider':
        local_file = DATA_DIR / "solution-providers" / f"{slug}.yaml"
    else:
        local_file = DATA_DIR / "communities" / city / f"{slug}.md"

    metadata = parse_yaml_frontmatter(local_file)

    data = {
        "file_path": file_path,
        "file_type": file_type,
        "slug": slug,
        "city": city,
        "status": metadata.get('status', 'active'),
        "metadata": metadata
    }

    # Upsert (insert or update if exists)
    upsert_headers = {
        **headers,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    response = requests.post(url, headers=upsert_headers, json=data)

    if response.status_code in [200, 201]:
        print(f"  → Metadata synced")
        return True
    else:
        print(f"  → Metadata sync failed: {response.status_code} - {response.text}")
        return False

def upload_solution_providers():
    """Upload all solution provider YAML files"""
    print("\n" + "="*60)
    print("UPLOADING SOLUTION PROVIDERS")
    print("="*60 + "\n")

    providers_dir = DATA_DIR / "solution-providers"
    count = 0

    for yaml_file in providers_dir.glob("*.yaml"):
        if yaml_file.name.startswith('_'):
            continue

        slug = yaml_file.stem
        remote_path = f"solution-providers/{yaml_file.name}"

        # Upload file
        if upload_file_to_storage(yaml_file, remote_path):
            # Sync metadata
            insert_file_metadata(remote_path, 'solution-provider', slug)
            count += 1

    print(f"\n✅ Uploaded {count} solution providers\n")
    return count

def upload_communities():
    """Upload all community markdown files"""
    print("="*60)
    print("UPLOADING COMMUNITIES")
    print("="*60 + "\n")

    communities_dir = DATA_DIR / "communities" / "bengaluru"
    count = 0

    for md_file in communities_dir.glob("*.md"):
        if md_file.name.startswith('_'):
            continue

        slug = md_file.stem
        remote_path = f"communities/bengaluru/{md_file.name}"

        # Upload file
        if upload_file_to_storage(md_file, remote_path):
            # Sync metadata
            insert_file_metadata(remote_path, 'community', slug, city='bengaluru')
            count += 1

    print(f"\n✅ Uploaded {count} communities\n")
    return count

def create_placeholder_directories():
    """Create placeholder .gitkeep files for other cities"""
    print("="*60)
    print("CREATING PLACEHOLDER DIRECTORIES")
    print("="*60 + "\n")

    cities = ['mumbai', 'ahmedabad', 'bhubaneswar']

    for city in cities:
        content = f"# {city.title()} Communities Directory\n"
        remote_path = f"communities/{city}/.gitkeep"

        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{remote_path}"

        response = requests.post(
            url,
            headers={**headers, "Content-Type": "text/plain"},
            data=content.encode('utf-8')
        )

        if response.status_code in [200, 201]:
            print(f"✓ Created: {remote_path}")
        elif response.status_code == 409:
            print(f"  {remote_path} already exists")

    print()

def verify_upload():
    """Verify the uploads by checking metadata table"""
    print("="*60)
    print("VERIFICATION")
    print("="*60 + "\n")

    url = f"{SUPABASE_URL}/rest/v1/file_metadata?select=file_type,status&file_type=eq.solution-provider"
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        providers = response.json()
        active_providers = [p for p in providers if p['status'] == 'active']
        print(f"Solution Providers in DB: {len(active_providers)} active")

    url = f"{SUPABASE_URL}/rest/v1/file_metadata?select=file_type,status&file_type=eq.community"
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        communities = response.json()
        active_communities = [c for c in communities if c['status'] == 'active']
        print(f"Communities in DB: {len(active_communities)} active")

    print()

def main():
    print("\n" + "="*60)
    print("SUPABASE UPLOAD & SYNC UTILITY")
    print("="*60)
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Data Directory: {DATA_DIR}")
    print("="*60 + "\n")

    # Upload solution providers
    providers_count = upload_solution_providers()

    # Upload communities
    communities_count = upload_communities()

    # Create placeholder directories
    create_placeholder_directories()

    # Verify
    verify_upload()

    print("="*60)
    print("✅ UPLOAD & SYNC COMPLETE!")
    print("="*60)
    print(f"\nTotal uploaded:")
    print(f"  - {providers_count} solution providers")
    print(f"  - {communities_count} communities")
    print(f"\nNext steps:")
    print("  1. Update website/load-data.js to fetch from Supabase")
    print("  2. Set up Edge Function for Vercel webhook")
    print("  3. Add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel")
    print("  4. Deploy and test!")
    print()

if __name__ == '__main__':
    main()
