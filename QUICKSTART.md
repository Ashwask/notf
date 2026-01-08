# NOTF Quick Start Guide

Your NOTF infrastructure has been set up!

## Directory Structure

```
~/notf/
├── data/                    # Main data repository
│   ├── communities/         # Community profiles
│   ├── members/            # Member profiles
│   ├── asks-offers/        # Asks and offers
│   ├── resources/          # Shared resources
│   ├── events/             # Events
│   └── docs/               # Documentation
├── scripts/                # Automation scripts
└── website/                # Static website (if installed)
```

## Common Tasks

### 1. Add a New Member

```bash
cd ~/notf/data
cp members/organizations/_TEMPLATE.yaml members/organizations/new-org.yaml
# Edit the file with member details
nano members/organizations/new-org.yaml
# Validate
python3 ../scripts/validate_data.py members/organizations/new-org.yaml
# Commit
git add members/organizations/new-org.yaml
git commit -m "Add: New organization"
```

### 2. Post an Ask or Offer

```bash
cd ~/notf/data
cp asks-offers/asks/_TEMPLATE.md asks-offers/asks/2025-01-my-ask.md
# Edit the file
nano asks-offers/asks/2025-01-my-ask.md
# Validate
python3 ../scripts/validate_data.py asks-offers/asks/2025-01-my-ask.md
# Commit
git add asks-offers/asks/2025-01-my-ask.md
git commit -m "Add: New ask for funding"
```

### 3. Find Matches

```bash
cd ~/notf
python3 scripts/match_asks_offers.py
```

This will:
- Analyze all open asks and available offers
- Calculate match scores
- Generate a report: `matches_YYYY-MM-DD.txt`

### 4. Generate Weekly Digest

```bash
cd ~/notf
python3 scripts/weekly_digest.py
```

This will:
- List new members from the past week
- List new asks and offers
- Show activity by city
- Generate a report: `digest_YYYY-MM-DD.txt`

### 5. Validate All Data

```bash
cd ~/notf
python3 scripts/validate_data.py data/
```

### 6. Build Website (if installed)

```bash
cd ~/notf/website
npm start
```

Then visit: http://localhost:8080

To build for production:
```bash
npm run build
```

Output will be in: `website/_site/`

## Automation

### Set Up Weekly Match Checking

Add to crontab (`crontab -e`):

```cron
# Run match script every Monday at 9 AM
0 9 * * 1 cd ~/notf && python3 scripts/match_asks_offers.py | mail -s "NOTF Weekly Matches" nudge-unit@notf.in

# Generate digest every Friday at 5 PM
0 17 * * 5 cd ~/notf && python3 scripts/weekly_digest.py | mail -s "NOTF Weekly Digest" nudge-unit@notf.in
```

## Git Workflow

### Daily Work

```bash
cd ~/notf/data

# Pull latest changes
git pull

# Make your changes...

# Review changes
git status
git diff

# Stage and commit
git add .
git commit -m "Description of changes"

# Push to remote (once set up)
git push
```

### Connect to GitHub/GitLab

```bash
cd ~/notf/data

# Add remote
git remote add origin https://github.com/your-org/notf-network.git

# Push
git push -u origin main
```

## Next Steps

1. **Customize templates** with your specific fields
2. **Add your real data** (communities, members, etc.)
3. **Set up GitHub repository** for collaboration
4. **Configure deployment** (Netlify, Vercel, GitHub Pages)
5. **Set up email notifications** for matches/digests
6. **Customize website** design and content

## Getting Help

- Documentation: `data/docs/`
- Templates: `data/*/_ TEMPLATE.*`
- Scripts help: `python3 scripts/script_name.py --help`

## Contact

Nudge Unit: nudge-unit@notf.in
