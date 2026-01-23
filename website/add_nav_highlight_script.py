#!/usr/bin/env python3
"""
Add nav-highlight.js script to all HTML files with navbars.
"""

import os
import re
from pathlib import Path

# Script tag to insert
SCRIPT_TAG = '    <script src="/assets/js/nav-highlight.js"></script>\n'

def add_script_to_file(filepath):
    """Add nav-highlight script to a single HTML file if not present."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already has the script
    if 'nav-highlight.js' in content:
        return False

    # Skip if no nav-menu (like search redirect page)
    if 'nav-menu' not in content:
        return False

    # Skip test files
    if 'test-' in filepath.name:
        return False

    # Find the closing </body> tag and insert script before it
    pattern = r'(</body>)'

    def replacement(match):
        return '\n' + SCRIPT_TAG + '\n' + match.group(1)

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

        # Skip admin pages (they don't have public nav)
        if 'admin/' in str(html_file):
            skipped_count += 1
            continue

        try:
            if add_script_to_file(html_file):
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
