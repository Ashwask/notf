#!/usr/bin/env python3
"""
Add Turf.js CDN and boundary-loader.js to all HTML pages
"""

import os
import re

# HTML files to update
html_files = [
    '/Users/sathya/Documents/GitHub/notf/website/public/index.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/join/index.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/communities/index.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/admin/matcher.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/admin/index.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/admin/login.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/admin/geocode-tool.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/admin/organizations.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/admin/communities.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/search/index.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/map/index.html',
    '/Users/sathya/Documents/GitHub/notf/website/public/solution-providers/index.html'
]

turf_cdn = '    <script src="https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js"></script>'
boundary_loader = '    <script src="/assets/chat/boundary-loader.js"></script>'

for html_file in html_files:
    if not os.path.exists(html_file):
        print(f"⚠️  File not found: {html_file}")
        continue

    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # Check if Turf.js is already added
    if 'turf' not in content.lower():
        # Add Turf.js before Fuse.js or before chatbot scripts
        if '<!-- Chatbot Scripts -->' in content:
            pattern = r'(<!-- Chatbot Scripts -->)\s*\n'
            replacement = r'\1\n' + turf_cdn + '\n'
            content = re.sub(pattern, replacement, content)
            print(f"✓  Added Turf.js to {os.path.basename(html_file)}")
            modified = True
        else:
            print(f"⚠️  No chatbot scripts section in {os.path.basename(html_file)}")
    else:
        print(f"✓  Turf.js already exists in {os.path.basename(html_file)}")

    # Check if boundary-loader.js is already added
    if 'boundary-loader.js' not in content:
        # Add boundary-loader.js before boundary-validator.js
        if 'boundary-validator.js' in content:
            pattern = r'(\s*<script src="/assets/chat/boundary-validator.js"></script>)'
            replacement = boundary_loader + '\n' + r'\1'
            content = re.sub(pattern, replacement, content)
            print(f"✓  Added boundary-loader.js to {os.path.basename(html_file)}")
            modified = True
        else:
            print(f"⚠️  No boundary-validator.js found in {os.path.basename(html_file)}")
    else:
        print(f"✓  boundary-loader.js already exists in {os.path.basename(html_file)}")

    if modified:
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(content)

    print("")

print("✓ Boundary scripts integration complete!")
