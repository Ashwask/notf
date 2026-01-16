#!/usr/bin/env python3
"""
Convert NOTF Directory Excel file to YAML files for Communities and Solution Providers
"""

import pandas as pd
import yaml
import os
import re
from pathlib import Path

def slugify(text):
    """Convert text to a URL-friendly slug"""
    if pd.isna(text):
        return "unknown"
    text = str(text).lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def parse_list_field(value):
    """Parse a field that might contain a list of items"""
    if pd.isna(value):
        return []

    text = str(value).strip()
    if not text:
        return []

    # Split by newlines or semicolons or bullet points
    items = re.split(r'\n|;|•|-(?=\s)', text)
    items = [item.strip() for item in items if item.strip()]

    # Remove empty strings and numbering
    items = [re.sub(r'^\d+[\.\)]\s*', '', item) for item in items]
    items = [item for item in items if item]

    return items

def clean_text(value):
    """Clean text fields"""
    if pd.isna(value):
        return None
    text = str(value).strip()
    return text if text else None

def map_status(status_value):
    """Map Excel status to YAML status"""
    if pd.isna(status_value):
        return "pending"

    status = str(status_value).lower()
    if any(word in status for word in ['active', 'connected', 'partner']):
        return "active"
    return "pending"

def convert_community_orgs(excel_file, output_dir):
    """Convert Community Orgs sheet to YAML files"""
    df = pd.read_excel(excel_file, sheet_name='Community Orgs')

    # Create output directory
    output_path = Path(output_dir) / 'communities' / 'bengaluru'
    output_path.mkdir(parents=True, exist_ok=True)

    count = 0
    for idx, row in df.iterrows():
        org_name = row.get('Organization Name')
        if pd.isna(org_name) or not str(org_name).strip():
            continue

        slug = slugify(org_name)

        # Build YAML structure
        data = {
            'name': clean_text(org_name),
            'type': 'community-org'
        }

        # Add optional fields
        if clean_text(row.get('What do they do')):
            data['description'] = clean_text(row.get('What do they do'))

        if clean_text(row.get('State/City')):
            data['city'] = clean_text(row.get('State/City'))

        if clean_text(row.get('Location/Geography')):
            data['neighborhood'] = clean_text(row.get('Location/Geography'))

        if clean_text(row.get('Ward/Constituency')):
            data['ward'] = clean_text(row.get('Ward/Constituency'))

        # Contact info
        contact = {}
        if clean_text(row.get(' (PoC) ')):
            contact['person'] = clean_text(row.get(' (PoC) '))
        if clean_text(row.get('PoC Email')):
            contact['email'] = clean_text(row.get('PoC Email'))
        if clean_text(row.get('PoC Phone')):
            # Clean phone number
            phone = str(row.get('PoC Phone')).strip()
            # Remove .0 if it's a float
            if phone.endswith('.0'):
                phone = phone[:-2]
            contact['phone'] = phone

        if contact:
            data['contact'] = contact

        # Gives and Asks
        gives = parse_list_field(row.get('Gives'))
        if gives:
            data['offers'] = gives

        asks = parse_list_field(row.get('Asks'))
        if asks:
            data['asks'] = asks

        # Status
        data['status'] = map_status(row.get('Collaboration Status'))

        # Notes
        if clean_text(row.get('Notes/Remark')):
            data['notes'] = clean_text(row.get('Notes/Remark'))

        # Rainmatters partner
        if clean_text(row.get('Rainmatters partner or not')):
            data['rainmatters_partner'] = True

        # Stories field (empty for now, to be filled in later)
        data['stories'] = None

        # Write to YAML file
        output_file = output_path / f'{slug}.md'

        # Create markdown file with frontmatter
        with open(output_file, 'w') as f:
            f.write('---\n')
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
            f.write('---\n\n')
            f.write('<!-- Add community stories and updates here in Markdown format -->\n')

        count += 1
        print(f'Created: {output_file}')

    print(f'\nConverted {count} Community Orgs')
    return count

def convert_solution_providers(excel_file, output_dir):
    """Convert Solution Providers sheet to YAML files"""
    df = pd.read_excel(excel_file, sheet_name='Solution Providers')

    # Create output directory
    output_path = Path(output_dir) / 'solution-providers'
    output_path.mkdir(parents=True, exist_ok=True)

    count = 0
    for idx, row in df.iterrows():
        org_name = row.get('Name')
        if pd.isna(org_name) or not str(org_name).strip():
            continue

        slug = slugify(org_name)

        # Build YAML structure
        data = {
            'name': clean_text(org_name),
            'type': 'solution-provider'
        }

        # Add optional fields
        if clean_text(row.get('Theme')):
            data['theme'] = clean_text(row.get('Theme'))

        if clean_text(row.get('What do they do')):
            data['description'] = clean_text(row.get('What do they do'))

        if clean_text(row.get('State/City')):
            data['location'] = clean_text(row.get('State/City'))

        if clean_text(row.get('Location/Geography')):
            data['geography'] = clean_text(row.get('Location/Geography'))

        if clean_text(row.get('Ward/Constituency')):
            data['ward'] = clean_text(row.get('Ward/Constituency'))

        # Contact info
        contact = {}
        if clean_text(row.get(' (PoC) ')):
            contact['person'] = clean_text(row.get(' (PoC) '))
        if clean_text(row.get('PoC Email')):
            contact['email'] = clean_text(row.get('PoC Email'))
        if clean_text(row.get('PoC Phone')):
            # Clean phone number
            phone = str(row.get('PoC Phone')).strip()
            if phone.endswith('.0'):
                phone = phone[:-2]
            contact['phone'] = phone

        if contact:
            data['contact'] = contact

        # Gives and Asks
        gives = parse_list_field(row.get('Gives'))
        if gives:
            data['offers'] = gives

        asks = parse_list_field(row.get('Asks'))
        if asks:
            data['asks'] = asks

        # Infrastructure
        infrastructure = {}
        infra_gives = parse_list_field(row.get('Infra Give'))
        if infra_gives:
            infrastructure['offers'] = infra_gives

        infra_asks = parse_list_field(row.get('Infra Ask'))
        if infra_asks:
            infrastructure['asks'] = infra_asks

        if infrastructure:
            data['infrastructure'] = infrastructure

        # Status
        data['status'] = map_status(row.get('Status'))

        # Aspirational Geography
        if clean_text(row.get('Aspirational Geography')):
            data['aspirational_geography'] = clean_text(row.get('Aspirational Geography'))

        # Notes
        if clean_text(row.get('Notes/Remark')):
            data['notes'] = clean_text(row.get('Notes/Remark'))

        # Rainmatters partner
        if clean_text(row.get('Rainmatters partner or not')):
            data['rainmatters_partner'] = True

        # Stories field (empty for now, to be filled in later)
        data['stories'] = None

        # Write to YAML file
        output_file = output_path / f'{slug}.yaml'

        with open(output_file, 'w') as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

        count += 1
        print(f'Created: {output_file}')

    print(f'\nConverted {count} Solution Providers')
    return count

def main():
    excel_file = '/Users/sathya/Documents/GitHub/notf/supporting documents/NOTF directory.xlsx'
    output_dir = '/Users/sathya/Documents/GitHub/notf/data'

    print('Converting NOTF Directory Excel to YAML...\n')

    # Convert Community Orgs
    print('=== Converting Community Orgs ===')
    community_count = convert_community_orgs(excel_file, output_dir)

    print('\n=== Converting Solution Providers ===')
    provider_count = convert_solution_providers(excel_file, output_dir)

    print(f'\n✅ Conversion Complete!')
    print(f'   Community Orgs: {community_count}')
    print(f'   Solution Providers: {provider_count}')
    print(f'\nOutput directory: {output_dir}')

if __name__ == '__main__':
    main()
