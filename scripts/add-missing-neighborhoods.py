#!/usr/bin/env python3
"""
Add missing neighborhoods to communities based on their names.
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

# Mapping of slug to neighborhood (inferred from organization names)
NEIGHBORHOOD_MAPPING = {
    'banashankari-environmental-forum': 'Banashankari',
    'bellandur-forum': 'Bellandur',
    'brookefield-layout-residents': 'Brookefield',
    'btm-layout-welfare-association': 'BTM Layout',
    'citizens-for-sankey': 'Sankey',
    'electronic-city-green-guardians': 'Electronic City',
    'gavipuram-extension-welfare': 'Gavipuram Extension',
    'hebbal-lake-forum': 'Hebbal',
    'hsr-layout-rwa': 'HSR Layout',
    'indiranagar-awakened-citizens': 'Indiranagar',
    'jayanagar-neighbourhood-group': 'Jayanagar',
    'kengeri-environmental-collective': 'Kengeri',
    'koramangala-residents-welfare': 'Koramangala',
    'lets-be-the-change-lbtc': 'Bangalore',  # Not clear from name, using city
    'mahadevapura-citizens-alliance': 'Mahadevapura',
    'malleswaram-swabhimana-initiative': 'Malleshwaram',
    'peenya-industrial-environment-group': 'Peenya',
    'rajajinagar-eco-warriors': 'Rajajinagar',
    'rt-cwa-richmond-town-association': 'Richmond Town',
    'vijayanagar-green-forum': 'Vijayanagar',
    'sarjapur-road-citizens-forum': 'Sarjapur Road',
    'shivajinagar-community-network': 'Shivajinagar',
    'united-rwa-of-konena-agrahara-urok': 'Konena Agrahara',
    'whitefield-rising': 'Whitefield',
    'yelahanka-green-brigade': 'Yelahanka',
}

def main():
    print("🏘️  Adding Missing Neighborhoods")
    print("=" * 60)

    updated = 0
    failed = 0

    for slug, neighborhood in NEIGHBORHOOD_MAPPING.items():
        try:
            # Update the database
            response = supabase.table('file_metadata').update({
                'neighborhood': neighborhood
            }).eq('slug', slug).execute()

            if response.data:
                print(f"✅ {slug} → {neighborhood}")
                updated += 1
            else:
                print(f"⚠️  {slug} not found in database")
                failed += 1

        except Exception as e:
            print(f"❌ Error updating {slug}: {e}")
            failed += 1

    print("\n" + "=" * 60)
    print(f"📊 SUMMARY")
    print("=" * 60)
    print(f"✅ Updated: {updated}")
    print(f"❌ Failed: {failed}")
    print("=" * 60)

if __name__ == '__main__':
    main()
