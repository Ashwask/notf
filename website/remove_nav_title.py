#!/usr/bin/env python3
"""
Remove the nav-title span (brand text) from all city pages.
"""

import os
import re
from pathlib import Path

def remove_nav_title(filepath):
    """Remove nav-title span from navbar."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if no nav-title
    if 'nav-title' not in content:
        return False

    # Remove the nav-title span line (with any surrounding whitespace)
    pattern = r'\s*<span class="nav-title">.*?</span>\s*\n'
    new_content = re.sub(pattern, '\n', content)

    # Only write if content changed
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True

    return False

def main():
    """Process all HTML files."""
    public_dir = Path('/Users/sathya/Documents/GitHub/notf/website/public')

    updated_count = 0
    skipped_count = 0

    # Find all HTML files
    for html_file in public_dir.rglob('*.html'):
        try:
            if remove_nav_title(html_file):
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
