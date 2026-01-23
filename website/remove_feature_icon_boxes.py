#!/usr/bin/env python3
"""
Remove colored boxes from feature-icon-large elements and apply colors directly to icons.
"""

import os
import re
from pathlib import Path

# Color mapping from CSS variables to hex values
COLOR_MAP = {
    'var(--slate-blue)': '#3F5F7A',
    'var(--forest-green)': '#2F4A2C',
    'var(--terracotta)': '#C45A2A',
    'var(--olive-green)': '#B9C98A',
    'var(--mustard-yellow)': '#F5B82E'
}

def update_feature_icons(filepath):
    """Remove box styling from feature icons and apply colors to icons."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if no feature-icon-large
    if 'feature-icon-large' not in content:
        return False

    original_content = content

    # Update CSS - remove background and border-radius
    css_pattern = r'\.feature-icon-large \{[^}]+\}'
    new_css = '''.feature-icon-large {
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }'''
    content = re.sub(css_pattern, new_css, content, flags=re.DOTALL)

    # Update icon CSS - remove color constraint, increase size
    icon_css_pattern = r'\.feature-icon-large i \{[^}]+\}'
    new_icon_css = '''.feature-icon-large i {
            font-size: 64px;
        }'''
    content = re.sub(icon_css_pattern, new_icon_css, content, flags=re.DOTALL)

    # Remove climate-preview specific background
    climate_css_pattern = r'\.climate-preview \.feature-icon-large \{[^}]+\}'
    content = re.sub(climate_css_pattern, '', content, flags=re.DOTALL)

    # Find all feature-icon-large divs and process them
    # Pattern: <div class="feature-icon-large"...> followed by <i class="..."></i>
    pattern = r'(<div class="feature-icon-large")(.*?)(>)\s*(<i class="[^"]*")(.*?)(>)'

    def replace_icon(match):
        div_start = match.group(1)
        div_attrs = match.group(2)
        div_end = match.group(3)
        icon_start = match.group(4)
        icon_attrs = match.group(5)
        icon_end = match.group(6)

        # Extract background color from div attributes
        bg_match = re.search(r'background:\s*(var\([^)]+\))', div_attrs)
        color = None

        if bg_match:
            css_var = bg_match.group(1)
            color = COLOR_MAP.get(css_var, '#3F5F7A')  # Default to slate-blue
        else:
            # Check if it's a climate-preview section (uses olive-green)
            # We'll handle this by checking context in the full content
            color = '#B9C98A'  # olive-green for climate

        # Build new div without inline styles
        new_div = f'{div_start}{div_end}'

        # Build new icon with color
        new_icon = f'{icon_start} style="color: {color} !important;"{icon_end}'

        return f'{new_div}\n                            {new_icon}'

    content = re.sub(pattern, replace_icon, content)

    # Handle feature-icon-large in climate sections specifically
    # Find climate-preview sections and set their icons to olive-green
    climate_pattern = r'(<div class="feature-card-large climate-preview">.*?<div class="feature-icon-large">.*?<i class="[^"]*")(.*?)(>)'

    def replace_climate_icon(match):
        icon_part = match.group(1)
        attrs = match.group(2)
        end = match.group(3)

        # Remove existing style if any
        icon_part = re.sub(r' style="[^"]*"', '', icon_part)

        return f'{icon_part} style="color: #B9C98A !important;"{end}'

    content = re.sub(climate_pattern, replace_climate_icon, content, flags=re.DOTALL)

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
                    if update_feature_icons(index_file):
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
