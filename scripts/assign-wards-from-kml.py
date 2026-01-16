#!/usr/bin/env python3
"""
Assign ward names to communities/providers using point-in-polygon matching.
Reads KML ward boundaries and updates the database with ward information.
"""

import json
import xml.etree.ElementTree as ET
from shapely.geometry import Point, Polygon
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# KML file path
KML_FILE = '../supporting documents/gba-369-wards-december-2025.kml'
NEIGHBORHOODS_JSON = '../website/public/assets/geodata/bangalore-neighborhoods.json'

def load_ward_polygons():
    """Load ward boundaries from KML file."""
    tree = ET.parse(KML_FILE)
    root = tree.getroot()
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}

    wards = []

    for placemark in root.findall('.//kml:Placemark', ns):
        # Get ward name
        ward_name = None
        for data in placemark.findall('.//kml:SimpleData[@name="ward_name"]', ns):
            ward_name = data.text
            break

        if not ward_name:
            continue

        # Get polygon coordinates
        coords_elem = placemark.find('.//kml:coordinates', ns)
        if coords_elem is None or not coords_elem.text:
            continue

        # Parse coordinates
        coords_text = coords_elem.text.strip()
        points = []
        for coord in coords_text.split():
            parts = coord.split(',')
            if len(parts) >= 2:
                lon, lat = float(parts[0]), float(parts[1])
                points.append((lon, lat))

        if len(points) >= 3:
            polygon = Polygon(points)
            wards.append({
                'name': ward_name,
                'polygon': polygon
            })

    print(f"Loaded {len(wards)} ward polygons from KML")
    return wards

def load_neighborhood_coordinates():
    """Load neighborhood coordinates from JSON."""
    with open(NEIGHBORHOODS_JSON, 'r') as f:
        data = json.load(f)

    neighborhoods = {}
    for name, coords in data.items():
        neighborhoods[name] = {
            'lat': coords['lat'],
            'lng': coords['lng']
        }

    print(f"Loaded {len(neighborhoods)} neighborhood coordinates")
    return neighborhoods

def find_ward_by_name(neighborhood_name, wards):
    """Find ward by fuzzy name matching."""
    if not neighborhood_name:
        return None

    # Normalize the neighborhood name
    normalized = neighborhood_name.lower().strip()

    # Try exact match first
    for ward in wards:
        if ward['name'].lower() == normalized:
            return ward['name']

    # Try partial match (ward name contains neighborhood or vice versa)
    for ward in wards:
        ward_lower = ward['name'].lower()
        if normalized in ward_lower or ward_lower in normalized:
            return ward['name']

    return None

def find_ward_for_point(lat, lng, wards):
    """Find which ward contains the given point."""
    if not lat or not lng:
        return None

    point = Point(lng, lat)  # Note: Shapely uses (x, y) = (lon, lat)

    for ward in wards:
        try:
            if ward['polygon'].contains(point):
                return ward['name']
        except:
            continue

    return None

def update_database():
    """Update database with ward and coordinate information."""
    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Load ward polygons
    wards = load_ward_polygons()

    # Load neighborhood coordinates
    neighborhoods = load_neighborhood_coordinates()

    # Get all records from database
    response = supabase.table('file_metadata').select('*').execute()
    records = response.data

    print(f"\nProcessing {len(records)} records...")

    updated_count = 0
    matched_count = 0

    for record in records:
        updates = {}

        # Extract neighborhood from metadata
        neighborhood_name = None
        if record['file_type'] == 'community':
            neighborhood_name = record.get('metadata', {}).get('neighborhood')
        elif record['file_type'] == 'solution-provider':
            neighborhoods_list = record.get('metadata', {}).get('neighborhoods', [])
            if neighborhoods_list and len(neighborhoods_list) > 0:
                neighborhood_name = neighborhoods_list[0]

        # Try to find coordinates for this neighborhood
        lat, lng = None, None
        if neighborhood_name and neighborhood_name in neighborhoods:
            coords = neighborhoods[neighborhood_name]
            lat = coords['lat']
            lng = coords['lng']
            updates['latitude'] = lat
            updates['longitude'] = lng
            updates['neighborhood'] = neighborhood_name

        # Try to find ward by name first
        ward_name = None
        if neighborhood_name:
            ward_name = find_ward_by_name(neighborhood_name, wards)

        # If no name match and we have coordinates, try point-in-polygon
        if not ward_name and lat and lng:
            ward_name = find_ward_for_point(lat, lng, wards)

        # Update ward if found
        if ward_name:
            updates['ward'] = ward_name
            matched_count += 1

        # Update the record if we have any updates
        if updates:
            supabase.table('file_metadata').update(updates).eq('id', record['id']).execute()
            updated_count += 1

            if matched_count % 10 == 0:
                print(f"  Processed {matched_count} records with ward matches...")

    print(f"\nCompleted!")
    print(f"  Updated {updated_count} records")
    print(f"  Matched {matched_count} records to wards")

if __name__ == '__main__':
    try:
        update_database()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
