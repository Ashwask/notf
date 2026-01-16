#!/usr/bin/env python3
"""
Categorize existing YAML files and add 'stories' field
Determine if they are community-orgs or solution-providers based on their type field
"""

import yaml
import os
from pathlib import Path
import shutil

# Organizations that provide solutions/services (not neighborhood-based)
SOLUTION_PROVIDER_INDICATORS = [
    'research', 'ngo', 'social enterprise', 'consultancy',
    'training', 'technology', 'solutions', 'services'
]

# Community-based organizations (neighborhood level)
COMMUNITY_ORG_INDICATORS = [
    'rwa', 'residents', 'welfare', 'neighborhood', 'forum',
    'citizens', 'layout', 'rising', 'initiative'
]

def load_yaml_file(filepath):
    """Load and parse a YAML file"""
    with open(filepath, 'r') as f:
        return yaml.safe_load(f)

def save_yaml_file(filepath, data):
    """Save data to a YAML file"""
    with open(filepath, 'w') as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

def categorize_organization(data, filename):
    """Determine if organization is a solution-provider or community-org"""

    org_type = data.get('type', '').lower()
    org_name = data.get('name', '').lower()
    description = data.get('description', '').lower() if data.get('description') else ''
    domains = ' '.join(data.get('domains', [])).lower()

    # Check explicit type
    if org_type in ['solution-provider', 'anchor', 'ngo']:
        return 'solution-provider'

    if org_type in ['cbo', 'community-org', 'rwa']:
        return 'community-org'

    # Check name and description for indicators
    combined_text = f"{org_name} {description} {domains}"

    community_score = sum(1 for indicator in COMMUNITY_ORG_INDICATORS if indicator in combined_text)
    solution_score = sum(1 for indicator in SOLUTION_PROVIDER_INDICATORS if indicator in combined_text)

    # Specific name patterns for communities
    if any(word in filename for word in ['rwa', 'forum', 'rising', 'welfare', 'layout', 'residents']):
        return 'community-org'

    # Research institutions, consultancies are solution providers
    if any(word in org_name for word in ['institute', 'university', 'research', 'foundation', 'trust', 'centre', 'center']):
        return 'solution-provider'

    # If community score is higher, it's a community org
    if community_score > solution_score:
        return 'community-org'

    # Default to solution-provider for established organizations
    return 'solution-provider'

def add_stories_field(data):
    """Add stories field if it doesn't exist"""
    if 'stories' not in data:
        data['stories'] = None
    return data

def main():
    old_dir = Path('/Users/sathya/Documents/GitHub/notf/data/members/organizations')
    community_dir = Path('/Users/sathya/Documents/GitHub/notf/data/communities/bengaluru')
    solution_dir = Path('/Users/sathya/Documents/GitHub/notf/data/solution-providers')

    # Ensure directories exist
    community_dir.mkdir(parents=True, exist_ok=True)
    solution_dir.mkdir(parents=True, exist_ok=True)

    # Track categorization
    categorization = {
        'community-org': [],
        'solution-provider': []
    }

    # Process each YAML file
    yaml_files = list(old_dir.glob('*.yaml'))

    for filepath in yaml_files:
        # Skip template files
        if filepath.name.startswith('_'):
            continue

        print(f'\nProcessing: {filepath.name}')

        # Load YAML
        data = load_yaml_file(filepath)

        # Add stories field
        data = add_stories_field(data)

        # Categorize
        category = categorize_organization(data, filepath.name)

        # Update type field
        if category == 'community-org':
            data['type'] = 'community-org'
        else:
            data['type'] = 'solution-provider'

        # Determine destination
        if category == 'community-org':
            # Convert to markdown for communities
            dest_file = community_dir / filepath.name.replace('.yaml', '.md')

            # Save as markdown with frontmatter
            with open(dest_file, 'w') as f:
                f.write('---\n')
                yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
                f.write('---\n\n')
                f.write('<!-- Add community stories and updates here in Markdown format -->\n')

            categorization['community-org'].append(filepath.name)
            print(f'  → Community Org: {dest_file}')
        else:
            # Keep as YAML for solution providers
            dest_file = solution_dir / filepath.name
            save_yaml_file(dest_file, data)

            categorization['solution-provider'].append(filepath.name)
            print(f'  → Solution Provider: {dest_file}')

    # Print summary
    print('\n' + '='*60)
    print('CATEGORIZATION SUMMARY')
    print('='*60)
    print(f'\nCommunity Orgs ({len(categorization["community-org"])}):')
    for name in sorted(categorization['community-org']):
        print(f'  - {name}')

    print(f'\nSolution Providers ({len(categorization["solution-provider"])}):')
    for name in sorted(categorization['solution-provider']):
        print(f'  - {name}')

    print(f'\n✅ Categorized {len(yaml_files) - 2} files')  # -2 for templates
    print(f'   Community Orgs: {len(categorization["community-org"])}')
    print(f'   Solution Providers: {len(categorization["solution-provider"])}')

if __name__ == '__main__':
    main()
