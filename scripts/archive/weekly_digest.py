#!/usr/bin/env python3
"""
Generate weekly digest of NOTF activity.
"""

import yaml
import glob
import re
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict

def extract_frontmatter(filepath):
    """Extract YAML frontmatter from markdown file."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        return yaml.safe_load(match.group(1))
    return None

def get_files_modified_last_week(pattern):
    """Get files modified in the last 7 days."""
    files = []
    week_ago = datetime.now() - timedelta(days=7)
    
    for filepath in glob.glob(pattern):
        if '_TEMPLATE' in filepath:
            continue
        path = Path(filepath)
        mtime = datetime.fromtimestamp(path.stat().st_mtime)
        if mtime >= week_ago:
            files.append(filepath)
    
    return files

def generate_digest():
    """Generate weekly digest."""
    digest = []
    digest.append("=" * 70)
    digest.append("NOTF WEEKLY DIGEST")
    digest.append(f"Week of {datetime.now().strftime('%Y-%m-%d')}")
    digest.append("=" * 70)
    digest.append("")
    
    # New members
    new_members = get_files_modified_last_week('data/members/**/*.yaml')
    if new_members:
        digest.append("## 🎉 NEW MEMBERS")
        digest.append("")
        for filepath in new_members:
            with open(filepath, 'r') as f:
                data = yaml.safe_load(f)
            name = data.get('name', 'Unknown')
            location = data.get('location', 'Unknown')
            digest.append(f"  - {name} ({location})")
        digest.append("")
    
    # New asks
    new_asks = get_files_modified_last_week('data/asks-offers/asks/*.md')
    if new_asks:
        digest.append("## 🙋 NEW ASKS")
        digest.append("")
        for filepath in new_asks:
            data = extract_frontmatter(filepath)
            if data:
                title = data.get('title', 'Unknown')
                category = data.get('category', 'Unknown')
                digest.append(f"  - [{category}] {title}")
        digest.append("")
    
    # New offers
    new_offers = get_files_modified_last_week('data/asks-offers/offers/*.md')
    if new_offers:
        digest.append("## 🤝 NEW OFFERS")
        digest.append("")
        for filepath in new_offers:
            data = extract_frontmatter(filepath)
            if data:
                title = data.get('title', 'Unknown')
                category = data.get('category', 'Unknown')
                digest.append(f"  - [{category}] {title}")
        digest.append("")
    
    # Summary by city
    digest.append("## 📊 ACTIVITY BY CITY")
    digest.append("")
    
    city_stats = defaultdict(int)
    for filepath in glob.glob('data/members/**/*.yaml'):
        if '_TEMPLATE' in filepath:
            continue
        with open(filepath, 'r') as f:
            data = yaml.safe_load(f)
        location = data.get('location', 'Unknown')
        city_stats[location] += 1
    
    for city, count in sorted(city_stats.items()):
        digest.append(f"  - {city}: {count} member(s)")
    
    digest.append("")
    digest.append("=" * 70)
    
    return "\n".join(digest)

def main():
    digest = generate_digest()
    print(digest)
    
    # Save digest
    digest_file = f"digest_{datetime.now().strftime('%Y-%m-%d')}.txt"
    with open(digest_file, 'w') as f:
        f.write(digest)
    print(f"\nDigest saved to: {digest_file}")

if __name__ == '__main__':
    main()
