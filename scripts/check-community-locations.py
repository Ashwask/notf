#!/usr/bin/env python3
"""
Check current geocoding status of communities.
"""

import os
import sys
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://abblyaukkoxmgzwretvm.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_SERVICE_KEY:
    print("❌ Error: SUPABASE_SERVICE_KEY environment variable not set")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def main():
    print("📍 Community Location Status Check")
    print("=" * 80)

    # Fetch all communities
    try:
        response = supabase.table('file_metadata').select('*').eq('file_type', 'community').execute()
        communities = response.data
        print(f"\n✅ Found {len(communities)} communities\n")
    except Exception as e:
        print(f"❌ Error fetching communities: {e}")
        sys.exit(1)

    # Categorize communities
    with_coords = []
    without_coords = []
    with_neighborhood = []
    without_neighborhood = []

    for comm in communities:
        name = comm.get('metadata', {}).get('name', comm.get('slug', 'Unknown'))
        neighborhood = comm.get('neighborhood') or comm.get('metadata', {}).get('neighborhood', '')
        city = comm.get('city') or comm.get('metadata', {}).get('city', '')
        lat = comm.get('latitude')
        lon = comm.get('longitude')

        if lat and lon:
            with_coords.append((name, neighborhood, city, lat, lon))
        else:
            without_coords.append((name, neighborhood, city))

        if neighborhood:
            with_neighborhood.append((name, neighborhood, city))
        else:
            without_neighborhood.append((name, city))

    # Print summary
    print("📊 SUMMARY")
    print("-" * 80)
    print(f"Communities with coordinates: {len(with_coords)}")
    print(f"Communities without coordinates: {len(without_coords)}")
    print(f"Communities with neighborhood: {len(with_neighborhood)}")
    print(f"Communities without neighborhood: {len(without_neighborhood)}")
    print()

    # Show communities that need geocoding
    if without_coords:
        print("❌ Communities WITHOUT coordinates:")
        print("-" * 80)
        for name, neighborhood, city in without_coords:
            print(f"  • {name}")
            print(f"    Neighborhood: {neighborhood or 'NOT SET'}")
            print(f"    City: {city or 'NOT SET'}")
            print()

    # Show communities with coordinates
    if with_coords:
        print("\n✅ Communities WITH coordinates:")
        print("-" * 80)
        for name, neighborhood, city, lat, lon in with_coords[:10]:  # Show first 10
            print(f"  • {name}")
            print(f"    Location: {neighborhood}, {city}")
            print(f"    Coords: ({lat}, {lon})")
            print()
        if len(with_coords) > 10:
            print(f"  ... and {len(with_coords) - 10} more")

    # Communities without neighborhood
    if without_neighborhood:
        print(f"\n⚠️  {len(without_neighborhood)} communities without neighborhood (will use city center):")
        print("-" * 80)
        for name, city in without_neighborhood:
            print(f"  • {name} ({city})")

if __name__ == '__main__':
    main()
