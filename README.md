# NOTF - Neighbourhoods of the Future

Live site: https://urbanmorph.github.io/notf/

## Structure

- `docs/` - GitHub Pages website (built from website/)
- `data/` - Network data (members, communities, asks/offers)
- `scripts/` - Automation scripts
- `website/` - Website source files

## Local Development

```bash
# Install dependencies
cd website
npm install

# Run development server
npm start

# Build for production
npm run build

# Copy to docs for GitHub Pages
cp -r _site/* ../docs/
```

## Data Management

```bash
# Add new member
cp data/members/organizations/_TEMPLATE.yaml data/members/organizations/new-org.yaml

# Validate data
python3 scripts/validate_data.py data/

# Find matches
python3 scripts/match_asks_offers.py

# Generate weekly digest
python3 scripts/weekly_digest.py
```

## GitHub Pages Setup

1. Go to repository Settings > Pages
2. Set Source to "Deploy from a branch"
3. Select branch: `main` and folder: `/docs`
4. Save

## Contact

Nudge Unit: nudge-unit@notf.in
