-- ===========================================
-- Remove Duplicate Columns from file_metadata
-- ===========================================
-- Removes columns that duplicate data already in metadata JSONB
-- and are never actually queried in the application.
--
-- SAFE TO RUN: Data is preserved in metadata JSONB
-- ===========================================

-- Drop unnecessary indexed columns
ALTER TABLE public.file_metadata
DROP COLUMN IF EXISTS neighborhood CASCADE,
DROP COLUMN IF EXISTS ward CASCADE;

-- Drop their indexes (if they still exist)
DROP INDEX IF EXISTS idx_file_metadata_neighborhood;
DROP INDEX IF EXISTS idx_file_metadata_ward;

-- ===========================================
-- Summary of Remaining Columns
-- ===========================================
-- SYSTEM: id, file_path, file_type, slug, created_at, updated_at, created_by, updated_by, version
-- INDEXED FOR QUERIES: status, city, latitude, longitude
-- FULL DATA: metadata (JSONB containing all frontmatter)
--
-- Removed (not queried, already in metadata):
-- - neighborhood (was in metadata->>'neighborhood')
-- - ward (was in metadata->>'ward')
-- ===========================================

-- Verify the change
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'file_metadata'
ORDER BY ordinal_position;
