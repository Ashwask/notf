#!/usr/bin/env python3
"""
Remove the colored box styling from city-icon-large and keep only the colored icon.
"""

import os
import re
from pathlib import Path

def update_city_icon_styling(filepath):
    """Remove box styling from city icons."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if no city-icon-large
    if 'city-icon-large' not in content:
        return False

    original_content = content

    # Update CSS in <style> section - remove background, border-radius, keep size
    css_pattern = r'\.city-icon-large \{[^}]+\}'
    new_css = '''.city-icon-large {
            width: 100px;
            height: 100px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }'''
    content = re.sub(css_pattern, new_css, content, flags=re.DOTALL)

    # Update icon size in CSS
    icon_css_pattern = r'\.city-icon-large i \{[^}]+\}'
    new_icon_css = '''.city-icon-large i {
            font-size: 80px;
        }'''
    content = re.sub(icon_css_pattern, new_icon_css, content, flags=re.DOTALL)

    # Remove inline styles from the div (background, border, box-shadow)
    # Keep the icon color
    div_pattern = r'(<div class="city-icon-large")([^>]*)(>)'
    content = re.sub(div_pattern, r'\1\3', content)

    # Only write if content changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True

    return False

def main():
    """Process all city HTML files."""
    public_dir = Path('/Users/sathya/Documents/GitHub/notf/website/public')

    updated_count = 0
    skipped_count = 0

    # Find all city hub index.html files (not map pages)
    cities_dir = public_dir / 'cities'
    for city_dir in cities_dir.iterdir():
        if city_dir.is_dir():
            index_file = city_dir / 'index.html'
            if index_file.exists():
                try:
                    if update_city_icon_styling(index_file):
                        print(f"✓ Updated: {index_file.relative_to(public_dir)}")
                        updated_count += 1
                    else:
                        skipped_count += 1
                except Exception as e:
                    print(f"✗ Error processing {index_file}: {e}")

    print(f"\n{'='*60}")
    print(f"Updated: {updated_count} files")
    print(f"Skipped: {skipped_count} files")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
