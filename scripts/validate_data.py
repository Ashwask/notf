#!/usr/bin/env python3
"""
Validate YAML and Markdown files in the NOTF data repository.
"""

import sys
import yaml
import re
from pathlib import Path
from datetime import datetime

def validate_yaml_frontmatter(content):
    """Extract and validate YAML frontmatter from markdown."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return None, "No YAML frontmatter found"
    
    try:
        data = yaml.safe_load(match.group(1))
        return data, None
    except yaml.YAMLError as e:
        return None, f"Invalid YAML: {e}"

def validate_date_format(date_str):
    """Validate date is in YYYY-MM-DD format."""
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def validate_member_file(filepath):
    """Validate a member YAML file."""
    errors = []
    
    try:
        with open(filepath, 'r') as f:
            data = yaml.safe_load(f)
    except Exception as e:
        return [f"Error reading file: {e}"]
    
    # Required fields
    required = ['name', 'type', 'location', 'status', 'joined', 'last_updated']
    for field in required:
        if field not in data or not data[field]:
            errors.append(f"Missing required field: {field}")
    
    # Validate dates
    if 'joined' in data and data['joined']:
        if not validate_date_format(str(data['joined'])):
            errors.append(f"Invalid date format for 'joined': {data['joined']}")
    
    if 'last_updated' in data and data['last_updated']:
        if not validate_date_format(str(data['last_updated'])):
            errors.append(f"Invalid date format for 'last_updated': {data['last_updated']}")
    
    # Validate type
    valid_types = ['organization', 'CBO', 'expert', 'supporter', 'individual']
    if 'type' in data and data['type'] not in valid_types:
        errors.append(f"Invalid type: {data['type']} (must be one of {valid_types})")
    
    # Validate status
    valid_statuses = ['active', 'inactive', 'pending']
    if 'status' in data and data['status'] not in valid_statuses:
        errors.append(f"Invalid status: {data['status']} (must be one of {valid_statuses})")
    
    return errors

def validate_ask_offer_file(filepath):
    """Validate an ask/offer markdown file."""
    errors = []
    
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except Exception as e:
        return [f"Error reading file: {e}"]
    
    data, error = validate_yaml_frontmatter(content)
    if error:
        return [error]
    
    # Required fields
    required = ['title', 'posted_by', 'posted_date', 'category', 'status', 'tags']
    for field in required:
        if field not in data or not data[field]:
            errors.append(f"Missing required field: {field}")
    
    # Validate date
    if 'posted_date' in data and data['posted_date']:
        if not validate_date_format(str(data['posted_date'])):
            errors.append(f"Invalid date format for 'posted_date': {data['posted_date']}")
    
    # Validate tags is a list
    if 'tags' in data and not isinstance(data['tags'], list):
        errors.append("Field 'tags' must be a list")
    
    return errors

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate_data.py <file_or_directory>")
        sys.exit(1)
    
    path = Path(sys.argv[1])
    
    if not path.exists():
        print(f"Error: {path} does not exist")
        sys.exit(1)
    
    files_to_check = []
    
    if path.is_file():
        files_to_check = [path]
    else:
        # Find all YAML and MD files, excluding templates
        files_to_check = [
            f for f in path.rglob('*') 
            if f.is_file() 
            and (f.suffix in ['.yaml', '.yml', '.md'])
            and '_TEMPLATE' not in f.name
        ]
    
    total_errors = 0
    
    for filepath in files_to_check:
        errors = []
        
        if 'members' in filepath.parts and filepath.suffix in ['.yaml', '.yml']:
            errors = validate_member_file(filepath)
        elif 'asks-offers' in filepath.parts and filepath.suffix == '.md':
            errors = validate_ask_offer_file(filepath)
        
        if errors:
            print(f"\n❌ {filepath.relative_to(path.parent if path.is_file() else path)}")
            for error in errors:
                print(f"   - {error}")
            total_errors += len(errors)
        else:
            print(f"✅ {filepath.relative_to(path.parent if path.is_file() else path)}")
    
    print(f"\n{'='*60}")
    if total_errors == 0:
        print("✅ All files validated successfully!")
        sys.exit(0)
    else:
        print(f"❌ Found {total_errors} error(s)")
        sys.exit(1)

if __name__ == '__main__':
    main()
