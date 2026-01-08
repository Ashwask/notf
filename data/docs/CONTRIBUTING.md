# Contributing to NOTF Network Data

Thank you for contributing to the NOTF network!

## Getting Started

1. **Fork the Repository** (if using GitHub)
2. **Clone Your Fork:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/notf-network.git
   cd notf-network
   ```
3. **Create a Branch:**
   ```bash
   git checkout -b add-new-member
   ```

## Making Changes

### Adding Your Organization

1. Copy the template:
   ```bash
   cp members/organizations/_TEMPLATE.yaml members/organizations/your-org.yaml
   ```

2. Edit the file with your information:
   ```yaml
   name: "Your Organization Name"
   type: "organization"
   location: "Bengaluru"
   # ... fill in all fields
   ```

3. Validate your YAML:
   ```bash
   python3 scripts/validate_data.py members/organizations/your-org.yaml
   ```

### Posting an Ask or Offer

1. Copy the template:
   ```bash
   cp asks-offers/asks/_TEMPLATE.md asks-offers/asks/2025-01-my-ask.md
   ```

2. Fill in the frontmatter and description

3. Validate:
   ```bash
   python3 scripts/validate_data.py asks-offers/asks/2025-01-my-ask.md
   ```

## Submitting Changes

1. **Commit Your Changes:**
   ```bash
   git add .
   git commit -m "Add: My Organization profile"
   ```

2. **Push to Your Fork:**
   ```bash
   git push origin add-new-member
   ```

3. **Create a Pull Request** or email the changes to nudge-unit@notf.in

## Questions?

- Email: nudge-unit@notf.in
- Monthly calls: See events/upcoming/ for schedule
