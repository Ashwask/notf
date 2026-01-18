#!/usr/bin/env node
/**
 * Convert KML ward boundaries to GeoJSON for all 12 cities
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');
const toGeoJSON = require('@mapbox/togeojson');

const SUPPORTING_DOCS = '/Users/sathya/Documents/GitHub/notf/supporting documents';
const OUTPUT_DIR = '/Users/sathya/Documents/GitHub/notf/website/public/assets/data/boundaries';

// City mapping: directory name -> standard name
const CITIES = {
    'ahmedabad': { name: 'Ahmedabad', file: 'ahmedabad-wards.kml' },
    'bengaluru': { name: 'Bengaluru', file: 'gba-369-wards-december-2025.kml' },
    'bhubaneshwar': { name: 'Bhubaneswar', file: 'bhubaneshwar-wards.kml' },
    'chennai': { name: 'Chennai', file: 'chennai-wards.kml' },
    'gurugram': { name: 'Gurugram', file: 'gurugram-wards.kml' },
    'hyderabad': { name: 'Hyderabad', file: 'hyderabad-wards.kml' },
    'jaipur': { name: 'Jaipur', file: 'jaipur-wards.kml' },
    'kolkata': { name: 'Kolkata', file: 'kolkata-wards.kml' },
    'mumbai': { name: 'Mumbai', file: 'mumbai-wards.kml' },
    'pune': { name: 'Pune', file: 'pune-wards.kml' },
    'thane': { name: 'Thane', file: 'thane-wards.kml' },
    'vishakapatnam': { name: 'Visakhapatnam', file: 'vizag-wards.kml' }
};

console.log('🗺️  KML to GeoJSON Converter for NOTF Cities\n');
console.log('================================================\n');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}\n`);
}

let successCount = 0;
let errorCount = 0;
const errors = [];

// Convert each city's KML file
Object.entries(CITIES).forEach(([dirName, cityInfo]) => {
    const kmlPath = path.join(SUPPORTING_DOCS, dirName, cityInfo.file);
    const outputFileName = `${cityInfo.name.toLowerCase()}-wards.geojson`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    console.log(`📍 ${cityInfo.name}...`);

    try {
        // Check if KML file exists
        if (!fs.existsSync(kmlPath)) {
            throw new Error(`KML file not found: ${kmlPath}`);
        }

        // Read KML file
        const kmlData = fs.readFileSync(kmlPath, 'utf8');

        // Parse KML to DOM
        const dom = new DOMParser().parseFromString(kmlData, 'text/xml');

        // Convert to GeoJSON
        const geoJSON = toGeoJSON.kml(dom);

        // Add metadata
        geoJSON.metadata = {
            city: cityInfo.name,
            source: cityInfo.file,
            convertedAt: new Date().toISOString(),
            featureCount: geoJSON.features.length
        };

        // Write GeoJSON file
        fs.writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2));

        console.log(`   ✅ Converted: ${geoJSON.features.length} features`);
        console.log(`   📁 Output: ${outputFileName}\n`);

        successCount++;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        errors.push({ city: cityInfo.name, error: error.message });
        errorCount++;
    }
});

console.log('================================================\n');
console.log('📊 Conversion Summary:\n');
console.log(`   ✅ Successful: ${successCount}/${Object.keys(CITIES).length}`);
console.log(`   ❌ Failed: ${errorCount}/${Object.keys(CITIES).length}\n`);

if (errors.length > 0) {
    console.log('❌ Errors:\n');
    errors.forEach(({ city, error }) => {
        console.log(`   ${city}: ${error}`);
    });
    console.log('');
}

if (successCount === Object.keys(CITIES).length) {
    console.log('🎉 All cities converted successfully!\n');

    // Create index file
    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    const index = {
        cities: Object.entries(CITIES).map(([dirName, cityInfo]) => ({
            name: cityInfo.name,
            code: cityInfo.name.toLowerCase(),
            file: `${cityInfo.name.toLowerCase()}-wards.geojson`,
            hasBoundaries: true
        })),
        metadata: {
            generatedAt: new Date().toISOString(),
            totalCities: Object.keys(CITIES).length,
            format: 'GeoJSON',
            projection: 'WGS84 (EPSG:4326)'
        }
    };

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`✅ Created index file: index.json\n`);
} else {
    console.log('⚠️  Some conversions failed. Please check errors above.\n');
    process.exit(1);
}
