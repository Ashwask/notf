#!/usr/bin/env python3
"""
Update all city pages to use the terracotta logo instead of the old logo.
"""

import os
import re
from pathlib import Path

def update_logo_in_file(filepath):
    """Update logo path from notf-logo.png to notf-terracotta.png."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already using terracotta logo
    if 'notf-terracotta.png' in content:
        return False

    # Replace old logo with terracotta logo
    new_content = content.replace(
        '/assets/images/notf-logo.png',
        '/assets/images/notf-terracotta.png'
    )

    # Only write if content changed
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True

    return False

def main():
    """Process all city HTML files."""
    public_dir = Path('/Users/sathya/Documents/GitHub/notf/website/public')

    updated_count = 0
    skipped_count = 0

    # Find all HTML files in cities directory
    cities_dir = public_dir / 'cities'
    for html_file in cities_dir.rglob('*.html'):
        try:
            if update_logo_in_file(html_file):
                print(f"✓ Updated: {html_file.relative_to(public_dir)}")
                updated_count += 1
            else:
                skipped_count += 1
        except Exception as e:
            print(f"✗ Error processing {html_file}: {e}")

    print(f"\n{'='*60}")
    print(f"Updated: {updated_count} files")
    print(f"Skipped: {skipped_count} files")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
