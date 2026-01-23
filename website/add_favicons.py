#!/usr/bin/env python3
"""
Add favicon references to all HTML files that don't have them yet.
"""

import os
import re
from pathlib import Path

# Favicon HTML block to insert
FAVICON_BLOCK = '''
    <!-- Favicons -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">

'''

def add_favicons_to_file(filepath):
    """Add favicon references to a single HTML file if not present."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already has favicon
    if 'favicon' in content.lower():
        return False

    # Skip test files
    if 'test-' in filepath.name:
        return False

    # Find the title tag and insert favicons after it
    # Pattern: <title>...</title>\n followed by any whitespace and then next tag
    pattern = r'(<title>.*?</title>\n)(\s*)(<link|<meta|<style)'

    def replacement(match):
        return match.group(1) + FAVICON_BLOCK + match.group(2) + match.group(3)

    new_content = re.sub(pattern, replacement, content, count=1)

    # Only write if content changed
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True

    return False

def main():
    """Process all HTML files in the public directory."""
    public_dir = Path('/Users/sathya/Documents/GitHub/notf/website/public')

    updated_count = 0
    skipped_count = 0

    # Find all HTML files recursively
    for html_file in public_dir.rglob('*.html'):
        # Skip test files
        if 'test-' in html_file.name:
            skipped_count += 1
            continue

        try:
            if add_favicons_to_file(html_file):
                print(f"✓ Updated: {html_file.relative_to(public_dir)}")
                updated_count += 1
            else:
                skipped_count += 1
        except Exception as e:
            print(f"✗ Error processing {html_file}: {e}")

    print(f"\n{'='*60}")
    print(f"Updated: {updated_count} files")
    print(f"Skipped: {skipped_count} files (already have favicons or test files)")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
