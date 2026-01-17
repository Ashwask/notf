#!/usr/bin/env python3
"""
Add coordinates to markdown frontmatter from database

This script:
1. Queries file_metadata table for all communities with coordinates
2. Reads each markdown file
3. Adds location.latitude and location.longitude to YAML frontmatter
4. Preserves all existing fields and markdown body content
"""

import os
import re
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
import requests

# Supabase configuration
SUPABASE_URL = "https://abblyaukkoxmgzwretvm.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not SUPABASE_SERVICE_KEY:
    print("❌ Error: SUPABASE_SERVICE_KEY environment variable not set")
    print("Usage: export SUPABASE_SERVICE_KEY='your-service-key'")
    exit(1)

BASE_DIR = Path("/Users/sathya/Documents/GitHub/notf/data")


def get_coordinates_from_db() -> Dict[str, Dict[str, float]]:
    """
    Query database for all communities with coordinates

    Returns:
        Dict mapping file_path to {'latitude': float, 'longitude': float}
    """
    url = f"{SUPABASE_URL}/rest/v1/file_metadata"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json"
    }

    # Select only communities with coordinates
    params = {
        "file_type": "eq.community",
        "select": "file_path,latitude,longitude,slug",
        "latitude": "not.is.null",
        "longitude": "not.is.null"
    }

    response = requests.get(url, headers=headers, params=params)

    if response.status_code != 200:
        print(f"❌ Database query failed: {response.status_code}")
        print(response.text)
        exit(1)

    data = response.json()

    coordinates = {}
    for row in data:
        file_path = row['file_path']
        lat = float(row['latitude'])
        lon = float(row['longitude'])
        coordinates[file_path] = {'latitude': lat, 'longitude': lon}

    return coordinates


def parse_markdown_file(file_path: Path) -> tuple[Dict[str, Any], str]:
    """
    Parse markdown file with YAML frontmatter

    Returns:
        (frontmatter_dict, markdown_body)
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split frontmatter and body
    if not content.startswith('---'):
        print(f"⚠️  Warning: {file_path.name} doesn't start with frontmatter delimiter")
        return {}, content

    parts = content.split('---', 2)
    if len(parts) < 3:
        print(f"⚠️  Warning: {file_path.name} has malformed frontmatter")
        return {}, content

    yaml_content = parts[1]
    markdown_body = parts[2]

    try:
        frontmatter = yaml.safe_load(yaml_content) or {}
    except yaml.YAMLError as e:
        print(f"❌ YAML parse error in {file_path.name}: {e}")
        return {}, markdown_body

    return frontmatter, markdown_body


def write_markdown_file(file_path: Path, frontmatter: Dict[str, Any], body: str):
    """
    Write markdown file with YAML frontmatter
    """
    # Convert frontmatter to YAML
    yaml_str = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)

    # Construct file content
    content = f"---\n{yaml_str}---{body}"

    # Write to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


def add_coordinates_to_file(file_path: Path, latitude: float, longitude: float) -> bool:
    """
    Add coordinates to markdown file frontmatter

    Returns:
        True if file was updated, False if coordinates already present
    """
    frontmatter, body = parse_markdown_file(file_path)

    # Check if location field already exists
    if 'location' in frontmatter:
        # If location is already a dict with coordinates, check if they match
        if isinstance(frontmatter['location'], dict):
            existing_lat = frontmatter['location'].get('latitude')
            existing_lon = frontmatter['location'].get('longitude')

            if existing_lat == latitude and existing_lon == longitude:
                return False  # Already has correct coordinates

        # If location is a string (like "Bengaluru"), we'll overwrite it with dict
        # This is intentional - coordinates are more valuable than city name string

    # Add/update location field as dict with coordinates
    frontmatter['location'] = {
        'latitude': latitude,
        'longitude': longitude
    }

    # Write updated file
    write_markdown_file(file_path, frontmatter, body)
    return True


def main():
    print("=" * 70)
    print("🗺️  ADDING COORDINATES TO MARKDOWN FILES")
    print("=" * 70)
    print()

    # Get coordinates from database
    print("📊 Querying database for coordinates...")
    coordinates = get_coordinates_from_db()
    print(f"✅ Found {len(coordinates)} communities with coordinates\n")

    # Process each file
    updated = 0
    skipped = 0
    errors = []

    print("=" * 70)
    print("📝 UPDATING FILES")
    print("=" * 70)
    print()

    for file_path, coords in sorted(coordinates.items()):
        # Convert storage path to local path
        # e.g., "communities/bengaluru/shanthinagar.md" -> "/data/communities/bengaluru/shanthinagar.md"
        local_path = BASE_DIR / file_path

        if not local_path.exists():
            print(f"⚠️  {local_path.name}: File not found locally")
            errors.append((local_path.name, "File not found"))
            continue

        slug = local_path.stem
        print(f"{slug}...", end=" ", flush=True)

        try:
            was_updated = add_coordinates_to_file(
                local_path,
                coords['latitude'],
                coords['longitude']
            )

            if was_updated:
                print("✅ Updated")
                updated += 1
            else:
                print("⏭️  Already has coordinates")
                skipped += 1

        except Exception as e:
            print(f"❌ Error: {e}")
            errors.append((slug, str(e)))

    # Summary
    print()
    print("=" * 70)
    print("📊 MIGRATION SUMMARY")
    print("=" * 70)
    print(f"✅ Files updated: {updated}")
    print(f"⏭️  Files skipped (already had coordinates): {skipped}")

    if errors:
        print(f"⚠️  Errors: {len(errors)}")
        for slug, msg in errors[:10]:
            print(f"  - {slug}: {msg}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more")
    else:
        print("🎉 All files processed successfully!")

    print()
    print("✨ Next steps:")
    print("  1. Review changes: git diff data/communities/bengaluru/")
    print("  2. Commit changes: git add data/communities/bengaluru/*.md")
    print("  3. Push to git: git commit -m 'Add location coordinates to frontmatter'")
    print("  4. Sync to Supabase: python scripts/sync-to-supabase.py")


if __name__ == '__main__':
    main()
