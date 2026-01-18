# City Boundary Data

This directory contains GeoJSON boundary files for the 11 supported cities (excluding Bengaluru, which uses corporation boundaries).

## Required Files

Convert the KML files from `/supporting documents/` to GeoJSON format:

- `ahmedabad-wards.geojson` ← from `supporting documents/ahmedabad/ahmedabad-wards.kml`
- `bhubaneshwar-wards.geojson` ← from `supporting documents/bhubaneshwar/bhubaneshwar-wards.kml`
- `chennai-wards.geojson` ← from `supporting documents/chennai/chennai-wards.kml`
- `gurugram-wards.geojson` ← from `supporting documents/gurugram/gurugram-wards.kml`
- `hyderabad-wards.geojson` ← from `supporting documents/hyderabad/hyderabad-wards.kml`
- `jaipur-wards.geojson` ← from `supporting documents/jaipur/jaipur-wards.kml`
- `kolkata-wards.geojson` ← from `supporting documents/kolkata/kolkata-wards.kml`
- `mumbai-wards.geojson` ← from `supporting documents/mumbai/mumbai-wards.kml`
- `pune-wards.geojson` ← from `supporting documents/pune/pune-wards.kml`
- `thane-wards.geojson` ← from `supporting documents/thane/thane-wards.kml`
- `vizag-wards.geojson` ← from `supporting documents/vizag/vizag-wards.kml`

## KML to GeoJSON Conversion

### Method 1: Using togeojson (Node.js)

```bash
npm install -g @mapbox/togeojson

# Convert single file
togeojson path/to/file.kml > output.geojson

# Batch convert all cities
for city in ahmedabad bhubaneshwar chennai gurugram hyderabad jaipur kolkata mumbai pune thane vizag; do
  togeojson "../supporting documents/$city/${city}-wards.kml" > "${city}-wards.geojson"
done
```

### Method 2: Using ogr2ogr (GDAL)

```bash
# Install GDAL
brew install gdal  # macOS
# or apt-get install gdal-bin  # Linux

# Convert single file
ogr2ogr -f GeoJSON output.geojson input.kml

# Batch convert
for city in ahmedabad bhubaneshwar chennai gurugram hyderabad jaipur kolkata mumbai pune thane vizag; do
  ogr2ogr -f GeoJSON "${city}-wards.geojson" "../supporting documents/$city/${city}-wards.kml"
done
```

### Method 3: Online Tool

Visit: https://mygeodata.cloud/converter/kml-to-geojson

Upload KML file and download GeoJSON.

## GeoJSON Format

Each file should contain ward boundaries as a FeatureCollection:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "code": "mumbai",
        "id": "uuid-from-database",
        "name": "Mumbai",
        "ward": "Ward 1"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], ...]]
      }
    }
  ]
}
```

## Important Notes

1. **Coordinate Order**: GeoJSON uses `[longitude, latitude]` (opposite of Google Maps)
2. **Merge Wards**: For boundary validation, you can merge all ward polygons into a single city boundary
3. **Properties**: Ensure each feature has `code`, `id`, and `name` properties matching the database
4. **File Size**: Simplify geometry if files are too large (use `mapshaper` or `turf.simplify`)

## Simplifying Large Files

If GeoJSON files are too large:

```bash
npm install -g mapshaper

# Simplify geometry (reduce file size)
mapshaper input.geojson -simplify 10% -o output.geojson
```

## Status

- [ ] ahmedabad-wards.geojson
- [ ] bhubaneshwar-wards.geojson
- [ ] chennai-wards.geojson
- [ ] gurugram-wards.geojson
- [ ] hyderabad-wards.geojson
- [ ] jaipur-wards.geojson
- [ ] kolkata-wards.geojson
- [ ] mumbai-wards.geojson
- [ ] pune-wards.geojson
- [ ] thane-wards.geojson
- [ ] vizag-wards.geojson

## Fallback Mode

Until these files are available, the chatbot will:
1. Skip boundary validation for non-Bengaluru cities
2. Accept user-provided city selection
3. Show warning about boundary data not available

To enable strict validation, convert and place GeoJSON files in this directory.
