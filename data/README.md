# Neighbourhoods of the Future (NOTF) - Network Data

This repository contains all the data for the NOTF network, including:
- Member profiles (organizations and individuals)
- Community profiles
- Asks and offers
- Resources (playbooks, toolkits, case studies)
- Events
- Network documentation

## Repository Structure

```
.
├── communities/          # Community profiles by city
├── members/             # Member profiles
│   ├── organizations/   # Organizations and CBOs
│   └── individuals/     # Individual members
├── asks-offers/         # Current asks and offers
│   ├── asks/           # What members need
│   └── offers/         # What members can provide
├── resources/          # Shared resources
│   ├── playbooks/      # How-to guides
│   ├── toolkits/       # Tools and templates
│   └── case-studies/   # Success stories
├── events/             # Network events
│   ├── past/          # Completed events
│   └── upcoming/      # Scheduled events
└── docs/              # Network documentation
```

## How to Contribute

1. **Adding a New Member:**
   - Copy the appropriate template from `members/organizations/_TEMPLATE.yaml` or `members/individuals/_TEMPLATE.yaml`
   - Rename to a meaningful slug (e.g., `center-for-civic-participation.yaml`)
   - Fill in all fields
   - Submit a pull request or email to nudge-unit@notf.in

2. **Posting an Ask or Offer:**
   - Copy template from `asks-offers/asks/_TEMPLATE.md` or `asks-offers/offers/_TEMPLATE.md`
   - Name the file descriptively (e.g., `2025-01-solar-rooftop-funding.md`)
   - Fill in details
   - Submit for review

3. **Adding a Resource:**
   - Copy template from `resources/_TEMPLATE.md`
   - Include the actual resource file or link
   - Document how to use it
   - Submit with appropriate licensing

## Data Format Guidelines

- **Dates:** Always use YYYY-MM-DD format
- **References:** When referencing other files, use relative paths (e.g., `organizations/c4c`)
- **Tags:** Use lowercase, hyphenated tags (e.g., `waste-management`, `solar-energy`)
- **Status:** Keep status fields updated as things progress

## Automation

This repository includes scripts for:
- Matching asks with offers
- Generating weekly reports
- Validating data format
- Creating member digests

See `scripts/` directory for details.

## Questions?

Contact the Nudge Unit: nudge-unit@notf.in
