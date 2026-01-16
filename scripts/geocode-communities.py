#!/usr/bin/env python3
"""
Geocode community organizations using their neighborhood and city information.
Uses OpenStreetMap Nominatim API (free, no API key required).
"""

import os
import sys
import time
import json
from supabase import create_client, Client
from urllib.parse import quote
try:
    import requests
    USE_REQUESTS = True
except ImportError:
    import urllib.request
    from urllib.error import HTTPError, URLError
    USE_REQUESTS = False
    print("⚠️  'requests' library not found. Using urllib (may have SSL issues).")
    print("   Install requests for better compatibility: pip install requests")

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://fbkrpexitodusqjvlnpy.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_SERVICE_KEY:
    print("❌ Error: SUPABASE_SERVICE_KEY environment variable not set")
    print("Please set it using:")
    print('export SUPABASE_SERVICE_KEY="your-service-role-key"')
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def geocode_location(name, neighborhood, city, state='Karnataka', country='India'):
    """
    Geocode a location using OpenStreetMap Nominatim API.

    Args:
        name: Community name
        neighborhood: Neighborhood/area name
        city: City name
        state: State name
        country: Country name

    Returns:
        tuple: (latitude, longitude) or (None, None) if geocoding fails
    """
    # Build search query with different fallback strategies
    search_queries = []

    # Strategy 1: Neighborhood + City + State + Country (most specific)
    if neighborhood:
        search_queries.append(f"{neighborhood}, {city}, {state}, {country}")

    # Strategy 2: Name + City (if name contains area info)
    if name and neighborhood:
        search_queries.append(f"{name}, {city}, {state}, {country}")

    # Strategy 3: Just Neighborhood + City
    if neighborhood:
        search_queries.append(f"{neighborhood}, {city}, {country}")

    # Strategy 4: City only (least specific - fallback)
    search_queries.append(f"{city}, {state}, {country}")

    for query in search_queries:
        try:
            # URL encode the query
            encoded_query = quote(query)

            # Nominatim API endpoint
            url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=1"

            # Set user agent (required by Nominatim)
            headers = {
                'User-Agent': 'NOTF-Community-Geocoder/1.0 (Neighbourhood of the Future project)'
            }

            # Use requests library if available (better SSL handling)
            if USE_REQUESTS:
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                data = response.json()
            else:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as response:
                    data = json.loads(response.read().decode())

            if data and len(data) > 0:
                result = data[0]
                lat = float(result['lat'])
                lon = float(result['lon'])
                print(f"  ✅ Found: {query} → ({lat}, {lon})")
                return lat, lon
            else:
                print(f"  ⚠️  No results for: {query}")

        except Exception as e:
            error_msg = str(e)

            # Handle rate limiting
            if '429' in error_msg or 'Too Many Requests' in error_msg:
                print(f"  ⚠️  Rate limited, waiting 2 seconds...")
                time.sleep(2)
            # Handle SSL errors
            elif 'SSL' in error_msg or 'CERTIFICATE' in error_msg:
                print(f"  ❌ SSL Error - install requests library: pip install requests")
                print(f"     Or run: /Applications/Python\\ 3.*/Install\\ Certificates.command")
                return None, None
            else:
                print(f"  ❌ Error for {query}: {error_msg}")

        # Wait between attempts to respect rate limits
        time.sleep(1)

    print(f"  ❌ Could not geocode location")
    return None, None

def update_community_coordinates(community_id, latitude, longitude):
    """Update community coordinates in Supabase."""
    try:
        response = supabase.table('file_metadata').update({
            'latitude': latitude,
            'longitude': longitude
        }).eq('id', community_id).execute()

        return True
    except Exception as e:
        print(f"  ❌ Error updating database: {e}")
        return False

def main():
    print("🌍 Community Geocoding Script")
    print("=" * 60)

    # Fetch all communities
    print("\n📥 Fetching communities from database...")
    try:
        response = supabase.table('file_metadata').select('*').eq('file_type', 'community').execute()
        communities = response.data
        print(f"✅ Found {len(communities)} communities")
    except Exception as e:
        print(f"❌ Error fetching communities: {e}")
        sys.exit(1)

    # Statistics
    total = len(communities)
    geocoded = 0
    already_geocoded = 0
    failed = 0
    updated = 0

    print(f"\n🚀 Starting geocoding process...")
    print("=" * 60)

    for i, community in enumerate(communities, 1):
        name = community.get('metadata', {}).get('name', community.get('slug', 'Unknown'))
        neighborhood = community.get('neighborhood') or community.get('metadata', {}).get('neighborhood', '')
        city = community.get('city') or community.get('metadata', {}).get('city', 'Bengaluru')
        state = community.get('metadata', {}).get('state', 'Karnataka')
        current_lat = community.get('latitude')
        current_lon = community.get('longitude')

        print(f"\n[{i}/{total}] {name}")
        print(f"  📍 Neighborhood: {neighborhood or 'Not specified'}")
        print(f"  🏙️  City: {city}")

        # Skip if no neighborhood specified
        if not neighborhood:
            print(f"  ⚠️  Skipping - no neighborhood specified")
            failed += 1
            continue

        # Check if already has coordinates
        if current_lat and current_lon:
            print(f"  ℹ️  Current: ({current_lat}, {current_lon})")

            # Ask user if they want to re-geocode
            # For now, let's re-geocode everything to fix wrong locations
            print(f"  🔄 Re-geocoding to verify location...")

        # Geocode the location
        lat, lon = geocode_location(name, neighborhood, city, state)

        if lat and lon:
            # Update database
            if update_community_coordinates(community['id'], lat, lon):
                geocoded += 1
                updated += 1
                print(f"  💾 Updated database with new coordinates")
            else:
                failed += 1
        else:
            failed += 1

        # Rate limiting: wait 1 second between requests
        if i < total:
            time.sleep(1)

    # Summary
    print("\n" + "=" * 60)
    print("📊 GEOCODING SUMMARY")
    print("=" * 60)
    print(f"Total communities: {total}")
    print(f"✅ Successfully geocoded: {geocoded}")
    print(f"💾 Database updated: {updated}")
    print(f"❌ Failed to geocode: {failed}")
    print("=" * 60)

    if failed > 0:
        print("\n⚠️  Some communities could not be geocoded.")
        print("Please check if they have valid neighborhood/city information.")

if __name__ == '__main__':
    main()
