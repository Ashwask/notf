# NOTF Submission Processing Guide

This guide explains how to process community and organization submissions.

## Submission Workflow

### 1. Receive Submission

Submissions come via email to `submissions@notf.org` with:
- Subject: "NOTF [Community/Organization] Submission: [Name]"
- Body: Contains YAML formatted data ready to use

### 2. Review Submission

Check the following:
- [ ] Organization/community is legitimate
- [ ] Contact information is valid
- [ ] Description is appropriate and complete
- [ ] Asks and offers are relevant
- [ ] Location information is accurate
- [ ] No duplicate entries exist

### 3. Create File

#### For Communities:

1. Create file: `data/communities/[city]/[neighborhood-slug].md`
2. Use slug format: lowercase, hyphens (e.g., `jp-nagar.md`)
3. Copy YAML from email
4. **Change status**: `status: "pending"` → `status: "approved"`

```markdown
---
name: "JP Nagar"
city: "Bengaluru"
state: "Karnataka"
neighborhood: "JP Nagar"
lead_organization_name: "Women of Wisdom"
contact:
  person: "John Doe"
  email: "john@example.org"
  phone: "9999999999"
status: "approved"  # CHANGE THIS!
submission_date: "2026-01-09T12:00:00Z"
---

## About JP Nagar

[Content from submission]
```

#### For Organizations:

1. Create file: `data/members/organizations/[org-name-slug].yaml`
2. Use slug format: lowercase, hyphens (e.g., `women-of-wisdom.yaml`)
3. Copy YAML from email
4. **Change status**: `status: "pending"` → `status: "approved"`

```yaml
name: "Women of Wisdom"
type: "cbo"
description: "Community organization working on..."
theme: "environment"
location: "JP Nagar, Bengaluru, Karnataka"
neighborhoods:
  - "JP Nagar"
contact:
  person: "Jane Doe"
  email: "jane@example.org"
  phone: "9999999999"
offers:
  - "Community mobilization"
  - "Training workshops"
asks:
  - "Funding for projects"
status: "approved"  # CHANGE THIS!
submission_date: "2026-01-09T12:00:00Z"
joined: "2026-01-09"
```

### 4. Add Geolocation (For Communities on Map)

If it's a new neighborhood, add coordinates to map.njk:

```javascript
const neighborhoodCoords = {
    'neighborhood-slug': [latitude, longitude],
    // Find coordinates using: https://www.latlong.net/
};
```

### 5. Commit and Deploy

```bash
cd ~/Documents/GitHub/notf

# Add the new file
git add data/communities/bengaluru/new-community.md
# OR
git add data/members/organizations/new-org.yaml

# Commit
git commit -m "Approve: [Community/Organization Name]"

# Rebuild and deploy
cd website
npm run build
cd ..
rm -rf docs/*
cp -r website/_site/* docs/

# Push to GitHub
git add docs
git commit -m "Deploy: Add [Community/Organization Name]"
git push
```

### 6. Notify Submitter

Send confirmation email:

```
Subject: ✅ Welcome to NOTF - [Name] Approved

Hi [Contact Person],

Great news! [Community/Organization Name] has been approved and is now live on the NOTF website.

Your listing is available at:
- Directory: https://urbanmorph.github.io/notf/[members or communities]/
- Map: https://urbanmorph.github.io/notf/map/
- Matcher: https://urbanmorph.github.io/notf/matcher/

You can now:
🤝 Connect with other communities and organizations
🎯 Be matched with collaboration opportunities
📍 Be discovered on our interactive map
🔍 Appear in search results

Questions? Reply to this email.

Welcome to the NOTF network!

Best,
NOTF Team
```

## Rejection Process

If a submission needs to be rejected:

1. **Do not create the file**
2. Send polite rejection email:

```
Subject: Re: NOTF [Community/Organization] Submission

Hi [Contact Person],

Thank you for your interest in joining NOTF. 

After review, we're unable to approve [Name] at this time because:
[Reason - be specific and constructive]

Suggestions:
[What they can do to reapply]

Feel free to resubmit once [conditions are met].

Best,
NOTF Team
```

## Common Issues

### Duplicate Submissions
- Check if organization already exists
- If yes, contact submitter to update existing entry

### Missing Information
- Email submitter requesting additional details
- Keep submission pending until complete

### Wrong Location Format
- Standardize to: "Neighborhood, City, State"
- Example: "JP Nagar, Bengaluru, Karnataka"

### Invalid Contact Info
- Verify email and phone are working
- Request correction if needed

## Quick Commands

### List all pending submissions:
```bash
grep -r 'status: "pending"' data/
```

### Count approved organizations:
```bash
grep -c 'status: "approved"' data/members/organizations/*.yaml
```

### Find submission by email:
```bash
grep -r "email@example.org" data/
```

## Status Field Values

- `"pending"` - Awaiting review (not shown on website)
- `"approved"` - Live on website
- `"active"` - Legacy field for communities (equivalent to approved)
- No status field - Treated as approved (backward compatible)

## Testing Locally

Before deploying, test that the new entry appears:

```bash
cd ~/Documents/GitHub/notf/website
npm run build
npm start  # If you have a local server

# Check:
# - Does it appear in Members/Communities page?
# - Does it show in search?
# - Does it appear in matcher?
# - (For communities) Does it show on map?
```

## Automation Ideas

Future improvements:
1. **GitHub Actions** - Auto-create PR from form submission
2. **Approval UI** - Web interface for reviewing submissions
3. **Email Integration** - Auto-respond to submissions
4. **Validation** - Check for duplicates automatically

## Support

Questions about processing submissions?
Contact: [admin email]
