#!/usr/bin/env python3
"""
Test geocoding for sample Bangalore neighborhoods.
Doesn't require Supabase - just tests the Nominatim API.
"""

import json
import time
import urllib.request
from urllib.parse import quote

def geocode_location(neighborhood, city, state='Karnataka', country='India'):
    """Test geocoding a location."""
    query = f"{neighborhood}, {city}, {state}, {country}"
    encoded_query = quote(query)

    url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=1"

    headers = {
        'User-Agent': 'NOTF-Community-Geocoder/1.0'
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())

        if data and len(data) > 0:
            result = data[0]
            lat = float(result['lat'])
            lon = float(result['lon'])
            return lat, lon, result.get('display_name', '')
        else:
            return None, None, None

    except Exception as e:
        return None, None, str(e)

def main():
    print("🧪 Testing Geocoding API")
    print("=" * 80)
    print()

    # Sample Bangalore neighborhoods to test
    test_locations = [
        "Malleshwaram",
        "HSR Layout",
        "Indiranagar",
        "Koramangala",
        "Whitefield",
        "JP Nagar",
        "Jayanagar",
        "BTM Layout",
        "Electronic City",
        "Yelahanka"
    ]

    print(f"Testing {len(test_locations)} sample Bangalore neighborhoods...\n")

    success_count = 0
    for i, neighborhood in enumerate(test_locations, 1):
        print(f"[{i}/{len(test_locations)}] {neighborhood}")

        lat, lon, display_name = geocode_location(neighborhood, "Bengaluru")

        if lat and lon:
            print(f"  ✅ Success")
            print(f"  📍 Coordinates: ({lat}, {lon})")
            print(f"  📌 Full name: {display_name[:80]}...")
            success_count += 1
        else:
            print(f"  ❌ Failed: {display_name}")

        print()

        # Rate limiting - wait 1 second between requests
        if i < len(test_locations):
            time.sleep(1.1)

    print("=" * 80)
    print(f"✅ Successfully geocoded: {success_count}/{len(test_locations)}")
    print("=" * 80)

    if success_count == len(test_locations):
        print("\n✨ All tests passed! Geocoding API is working correctly.")
        print("\nYou can now run: python3 scripts/geocode-communities.py")
    else:
        print("\n⚠️  Some tests failed. Check your internet connection.")

if __name__ == '__main__':
    main()
