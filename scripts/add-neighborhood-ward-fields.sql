-- Add neighborhood and ward fields to file_metadata table

ALTER TABLE public.file_metadata
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS ward TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_file_metadata_neighborhood ON public.file_metadata(neighborhood);
CREATE INDEX IF NOT EXISTS idx_file_metadata_ward ON public.file_metadata(ward);

-- Add comments to document the columns
COMMENT ON COLUMN public.file_metadata.neighborhood IS 'Neighborhood/area name within the city';
COMMENT ON COLUMN public.file_metadata.ward IS 'Administrative ward name (auto-populated from KML boundaries)';
COMMENT ON COLUMN public.file_metadata.latitude IS 'Latitude coordinate for precise mapping';
COMMENT ON COLUMN public.file_metadata.longitude IS 'Longitude coordinate for precise mapping';

-- Update existing records to extract neighborhood from metadata
UPDATE public.file_metadata
SET neighborhood = metadata->>'neighborhood'
WHERE file_type = 'community'
AND metadata->>'neighborhood' IS NOT NULL
AND neighborhood IS NULL;

-- Update city extraction to be more robust
UPDATE public.file_metadata
SET city = COALESCE(
    metadata->>'city',
    CASE
        WHEN metadata->>'location' IS NOT NULL
        THEN split_part(metadata->>'location', ',', 1)
        ELSE NULL
    END
)
WHERE city IS NULL;
