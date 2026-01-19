# Excel Bulk Update System - User Guide

## Overview

The Excel Bulk Update System allows administrators to export, edit, and import large numbers of communities and solution providers efficiently using Microsoft Excel or Google Sheets.

---

## Features

✅ **Export to Excel (.xlsx)**
- Export **filtered** or **all** communities and solution providers
- Respects status filters (active/pending/archived)
- Respects search filters (fuzzy search with Fuse.js)
- Smart dialog: Only prompts when filters are active
- Includes reference data sheet with valid values
- Auto-sized columns with formatted headers
- Read-only columns highlighted in gray

✅ **Edit in Excel**
- Use familiar Excel interface
- Semicolon-separated arrays (e.g., "Water;Waste;Energy")
- Nested objects flattened to columns
- Edit multiple records simultaneously

✅ **Import with Validation**
- Validates all data before importing
- Shows preview with valid/invalid row counts
- Displays detailed error list
- Import only valid rows or fix errors first

✅ **Progress Tracking**
- Real-time progress bar during import
- Batch updates via Edge Functions
- Error log download for failed rows

---

## How to Use

### Step 1: Export Data

1. Navigate to **Admin > Communities** or **Admin > Solution Providers**
2. **(Optional)** Apply filters:
   - Click status filter chips: **Active**, **Pending**, or **All**
   - Use the search box to filter by name, city, neighborhood, etc.
3. Click the **green Excel icon** (Export to Excel)
4. **Choose export scope:**
   - If filters are active, you'll see a confirmation dialog:
     - Click **OK** to export only filtered/visible records
     - Click **Cancel** to export all records (ignore filters)
   - If no filters are active, all records are exported automatically
5. Wait for the file to download: `NOTF_Data_Export_YYYY-MM-DD.xlsx`

**What gets exported:**
- **Sheet 1: Communities** - Community records (filtered or all)
- **Sheet 2: Solution Providers** - Provider records (filtered or all)
- **Sheet 3: Reference Data** - Valid statuses, themes, focus areas, wards

**Export Examples:**
- **Export only active communities:** Click "Active" chip → Export → Choose "Filtered"
- **Export only pending providers:** Click "Pending" chip → Export → Choose "Filtered"
- **Export search results:** Search "Bengaluru" → Export → Choose "Filtered"
- **Export everything:** Leave "All" selected → Export (no dialog, exports all)

### Step 2: Edit in Excel

1. Open the downloaded `.xlsx` file in Excel or Google Sheets
2. **DO NOT edit these columns** (highlighted in gray):
   - `ID/Slug` (read-only identifier)
   - `File Path` (storage location)
3. Edit any other columns as needed

**Important conventions:**
- **Arrays**: Use semicolons to separate values
  - Example: `Water;Waste;Energy`
  - Example: `Indiranagar;Koramangala;HSR Layout`
- **Empty cells**: Will preserve existing values (won't overwrite)
- **Coordinates**: Use decimal format (12.971599, 77.594566)
- **Email**: Must be valid format (john@example.com)
- **Status**: Must be `active`, `pending`, or `archived`

### Step 3: Import Data

1. Save the edited Excel file as `.xlsx`
2. Go back to the admin page
3. Click the **yellow Import icon** (Import from Excel)
4. **Upload the file:**
   - Drag and drop the file into the upload area, OR
   - Click the upload area to browse and select the file

### Step 4: Review Validation

The system will automatically validate all rows and show:

```
┌─────────────────────────────────────┐
│  Valid Rows    Invalid Rows  Errors │
│      45             5          8    │
└─────────────────────────────────────┘
```

**If there are errors:**
- Review the error list (shows first 20 errors)
- Download full error log (Excel file)
- Fix errors in your Excel file
- Re-upload and validate again

**If validation passes:**
- Click **"Import Valid Rows"**
- Watch the progress bar
- Wait for success message

### Step 5: Verify Changes

After import completes:
- The page will automatically reload
- Verify your changes are reflected
- Check the database records
- Verify Storage files updated

---

## Excel Schema Reference

### Communities Sheet (31 columns)

| Column Name | Type | Required | Example |
|-------------|------|----------|---------|
| ID/Slug | Read-only | Yes | cifos |
| File Path | Read-only | Yes | communities/bengaluru/cifos.md |
| Name | String | Yes | Citizens for Sustainability |
| City | String | Yes | Bengaluru |
| Neighborhoods | Semicolon-separated | No | Malleshwaram;HSR Layout;Koramangala |
| Ward | String | No | Ward 98 - Shanthinagar |
| Contact Person | String | No | John Doe |
| Contact Email | Email | No | john@example.com |
| Contact Phone | String | No | +91-9876543210 |
| Website | URL | No | https://example.com |
| Latitude | Float | No | 12.971599 |
| Longitude | Float | No | 77.594566 |
| Address | String | No | 123 Main Street, Bangalore |
| Focus Areas | Semicolon-separated | No | Water;Waste;Energy |
| What They Offer | Semicolon-separated | No | Training;Consulting;Space |
| What They Ask For | Semicolon-separated | No | Funding;Volunteers;Technical Help |
| MLA Name | String | No | N.A. Haris |
| MLA Party | String | No | INC |
| MP Name | String | No | P.C. Mohan |
| MP Party | String | No | BJP |
| Corporator Name | String | No | Jane Smith |
| Corporator Party | String | No | INC |
| Organization Type | String | No | Resident Welfare Association |
| Registration Number | String | No | REG123456 |
| Year Established | Integer | No | 2015 |
| Team Size | Integer | No | 25 |
| Neighborhood Size | String | No | 5000 households |
| Population Served | Integer | No | 20000 |
| Status | Enum | No | active |
| Created At | Date | Read-only | 2024-01-15 |
| Updated At | Date | Read-only | 2024-01-19 |

### Solution Providers Sheet (12 columns)

| Column Name | Type | Required | Example |
|-------------|------|----------|---------|
| ID/Slug | Read-only | Yes | biome |
| File Path | Read-only | Yes | solution-providers/biome.yaml |
| Name | String | Yes | Biome Environmental Solutions |
| Theme/Sector | String | No | Water Management |
| Focus Areas | Semicolon-separated | No | Water;Waste |
| Domains | Semicolon-separated | No | Research;Consulting;Implementation |
| Contact Email | Email | No | contact@biome.org.in |
| Contact Phone | String | No | +91-80-12345678 |
| Website | URL | No | https://biome.org.in |
| Organization Type | String | No | Non-profit |
| City | String | No | Bengaluru |
| Status | Enum | No | active |
| Created At | Date | Read-only | 2024-01-10 |
| Updated At | Date | Read-only | 2024-01-19 |

---

## Validation Rules

### Required Fields

**Communities:**
- File Path
- Name
- City

**Solution Providers:**
- File Path
- Name

### Field Validations

| Field | Validation |
|-------|------------|
| Email | Must match pattern: `name@domain.com` |
| Latitude | Must be between -90 and 90 |
| Longitude | Must be between -180 and 180 |
| Status | Must be: `active`, `pending`, or `archived` |
| Coordinates | Preserved to 6 decimal places |

### Array Fields (semicolon-separated)

- Neighborhoods
- Focus Areas
- What They Offer
- What They Ask For
- Domains

**Format:** `Value1;Value2;Value3`

**Example:** `Water;Waste;Energy;Mobility`

---

## Edge Cases & Special Handling

### 1. Empty Cells
**Behavior:** Preserve existing values (no overwrite)

**Example:**
- Database has: `contact.email = "old@example.com"`
- Excel cell is empty
- After import: `contact.email = "old@example.com"` (unchanged)

### 2. Special Characters in Arrays
**Handling:** Semicolons are reserved as delimiters

**Workaround:** If a value contains a semicolon, it will be split. Avoid semicolons in values.

### 3. Coordinate Precision
**Format:** 6 decimal places (e.g., 12.971599)

**Validation:** Must be valid floats within latitude/longitude ranges

### 4. Nested Objects
**Flattening:**
- `contact.person` → `Contact Person`
- `location.latitude` → `Latitude`
- `elected_representatives.mla.name` → `MLA Name`

**Unflattening:** Automatically reconstructed on import

### 5. File Path Validation
**Check:** File must exist in Supabase Storage

**Note:** Currently skipped during validation for performance (checked during import)

---

## Error Handling

### Common Validation Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| Required field | Field is empty | Fill in the required field |
| Invalid email format | Email doesn't match pattern | Use format: `name@domain.com` |
| Invalid latitude | Value outside -90 to 90 | Use valid coordinates |
| Invalid longitude | Value outside -180 to 180 | Use valid coordinates |
| Invalid status | Not active/pending/archived | Use one of the valid statuses |
| File not found | File path doesn't exist | Use correct file path from export |

### Import Errors

If import fails for some rows:
1. Download the error log (Excel file)
2. Review the errors
3. Fix the issues in your original file
4. Re-upload and import again

**Error Log Format:**
- Row number
- Field name
- Error message
- Invalid value
- Error type (validation or API)

---

## Performance Notes

### Export Performance
- **0-50 records:** Instant
- **50-200 records:** 1-3 seconds
- **200+ records:** 3-10 seconds

### Import Performance
- **Rate:** ~2-3 records per second (due to Edge Function calls)
- **Batch size:** 1 record at a time (sequential)
- **Progress tracking:** Real-time updates

**Recommendation:** For large imports (100+ records), start the import and let it run. Don't close the browser tab until completion.

---

## Troubleshooting

### Export fails
**Symptoms:** No file downloads, error message appears

**Solutions:**
1. Check browser console for errors
2. Verify Supabase connection
3. Check authentication status
4. Try refreshing the page

### Import validation fails
**Symptoms:** All rows show as invalid

**Solutions:**
1. Verify file format is `.xlsx` (not `.xls` or CSV)
2. Check that required columns are present
3. Verify file was exported from this system
4. Check for hidden characters or formatting issues

### Import succeeds but changes not visible
**Symptoms:** Import completes but records unchanged

**Solutions:**
1. Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
2. Check database directly
3. Check Supabase Storage files
4. Verify Edge Functions are working

### SheetJS library not loading
**Symptoms:** "SheetJS library not loaded" error

**Solutions:**
1. Check internet connection
2. Clear browser cache
3. Try a different browser
4. Check if CDN is accessible: https://cdn.sheetjs.com

---

## Technical Architecture

### File Structure

```
/website/public/assets/admin/
├── excel-common.js     # Shared utilities (200 lines)
│   ├── Array conversion (semicolon ↔ array)
│   ├── Validation functions
│   ├── File utilities
│   └── Excel formatting helpers
│
├── excel-export.js     # Export logic (300 lines)
│   ├── Data fetching
│   ├── Flattening (DB → Excel)
│   ├── Sheet generation
│   └── File download
│
└── excel-import.js     # Import logic (500 lines)
    ├── File upload handling
    ├── Excel parsing
    ├── Validation
    ├── Unflattening (Excel → DB)
    ├── Batch updates
    └── Progress tracking
```

### Data Flow

```
EXPORT:
[Database] → Fetch → Flatten → SheetJS → Download .xlsx

IMPORT:
Upload .xlsx → SheetJS → Parse → Validate → Unflatten → Edge Functions → [Database + Storage]
```

### Edge Function Integration

**Endpoint:** `update-file` Edge Function

**Payload:**
```json
{
  "type": "community" | "provider",
  "slug": "community-slug",
  "data": {
    // Unflattened data
  }
}
```

**Behavior:**
1. Updates Storage file (source of truth)
2. Syncs database record (cache/index)
3. Returns success/error

---

## Best Practices

### ✅ Do's

- Export before making bulk changes (backup)
- Edit in Excel with autosave enabled
- Save as `.xlsx` format
- Review validation results before importing
- Download error log if errors occur
- Test with 5-10 records first before bulk import
- Keep a backup of original export

### ❌ Don'ts

- Don't edit `ID/Slug` or `File Path` columns
- Don't use commas for arrays (use semicolons)
- Don't import without validating first
- Don't close browser during import
- Don't modify Excel structure (columns, sheet names)
- Don't mix data from different exports
- Don't skip error review

---

## Support & Feedback

### Reporting Issues

If you encounter issues:
1. Check the browser console for errors (F12)
2. Note the error message
3. Document steps to reproduce
4. Report to: https://github.com/anthropics/claude-code/issues

### Feature Requests

Want new features? Consider:
- Bulk create (not just update)
- CSV export/import option
- Google Sheets direct integration
- Scheduled bulk imports
- Version history tracking

---

## Changelog

### Version 1.1 (2026-01-19)

**New Features:**
- ✨ **Filtered Export**: Export only filtered/searched records
- Status filter support (active/pending/archived)
- Search filter support (fuzzy search)
- Smart confirmation dialog (only shows when filters active)
- Export scope indicator in success message

**Improvements:**
- Updated to use `file_metadata` table for consistency with admin UI
- Better data structure handling for metadata fields

### Version 1.0 (2026-01-19)

**Initial Release:**
- Excel export for communities and solution providers
- Import with validation
- Progress tracking
- Error log download
- Reference data sheet

**Known Limitations:**
- Update only (no creates)
- Stories field excluded from export
- Sequential imports (not parallel)
- No file path existence check during validation

---

## Quick Reference

### Keyboard Shortcuts

None currently - all actions via buttons.

### Button Icons

- 🟢 Green Excel icon = Export
- 🟡 Yellow Import icon = Import
- 🔄 Blue Refresh icon = Reload data

### File Naming

- Export: `NOTF_Data_Export_YYYY-MM-DD.xlsx`
- Error Log: `NOTF_Import_Errors_YYYY-MM-DD.xlsx`

### Status Values

- `active` - Currently operating
- `pending` - Awaiting approval
- `archived` - No longer active

---

**Last Updated:** January 19, 2026
**Version:** 1.0
**Author:** NOTF Development Team
