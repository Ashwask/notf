-- ===========================================
-- NOTF Supabase Infrastructure Setup
-- ===========================================
-- This script creates the database structure for managing
-- communities and solution providers with auto-deployment

-- 1. Create tables for file metadata
-- ===========================================

CREATE TABLE IF NOT EXISTS public.file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path TEXT NOT NULL UNIQUE, -- e.g., "solution-providers/atree.yaml"
    file_type TEXT NOT NULL CHECK (file_type IN ('community', 'solution-provider')),
    slug TEXT NOT NULL, -- e.g., "atree"
    city TEXT, -- e.g., "bengaluru" (for communities)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb -- Store parsed YAML data here
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_file_metadata_type ON public.file_metadata(file_type);
CREATE INDEX IF NOT EXISTS idx_file_metadata_status ON public.file_metadata(status);
CREATE INDEX IF NOT EXISTS idx_file_metadata_city ON public.file_metadata(city);
CREATE INDEX IF NOT EXISTS idx_file_metadata_slug ON public.file_metadata(slug);

-- 2. Create deployment log table
-- ===========================================

CREATE TABLE IF NOT EXISTS public.deployment_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type TEXT NOT NULL, -- 'create', 'update', 'delete'
    file_path TEXT NOT NULL,
    deployment_status TEXT DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'triggered', 'success', 'failed')),
    vercel_deployment_id TEXT,
    vercel_deployment_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_deployment_log_status ON public.deployment_log(deployment_status);
CREATE INDEX IF NOT EXISTS idx_deployment_log_created ON public.deployment_log(created_at DESC);

-- 3. Create function to update updated_at timestamp
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_updated_at ON public.file_metadata;
CREATE TRIGGER trigger_update_updated_at
    BEFORE UPDATE ON public.file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 4. Create function to trigger deployment
-- ===========================================

CREATE OR REPLACE FUNCTION trigger_deployment()
RETURNS TRIGGER AS $$
DECLARE
    trigger_type_val TEXT;
BEGIN
    -- Determine trigger type
    IF TG_OP = 'INSERT' THEN
        trigger_type_val := 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        trigger_type_val := 'update';
    ELSIF TG_OP = 'DELETE' THEN
        trigger_type_val := 'delete';
    END IF;

    -- Log the deployment trigger
    INSERT INTO public.deployment_log (
        trigger_type,
        file_path,
        deployment_status
    ) VALUES (
        trigger_type_val,
        COALESCE(NEW.file_path, OLD.file_path),
        'pending'
    );

    -- Notify the Edge Function (via pg_notify or http request)
    PERFORM pg_notify(
        'file_changed',
        json_build_object(
            'operation', trigger_type_val,
            'file_path', COALESCE(NEW.file_path, OLD.file_path),
            'file_type', COALESCE(NEW.file_type, OLD.file_type)
        )::text
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for file changes
DROP TRIGGER IF EXISTS trigger_deployment_on_insert ON public.file_metadata;
CREATE TRIGGER trigger_deployment_on_insert
    AFTER INSERT ON public.file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION trigger_deployment();

DROP TRIGGER IF EXISTS trigger_deployment_on_update ON public.file_metadata;
CREATE TRIGGER trigger_deployment_on_update
    AFTER UPDATE ON public.file_metadata
    FOR EACH ROW
    WHEN (OLD.metadata IS DISTINCT FROM NEW.metadata)
    EXECUTE FUNCTION trigger_deployment();

DROP TRIGGER IF EXISTS trigger_deployment_on_delete ON public.file_metadata;
CREATE TRIGGER trigger_deployment_on_delete
    AFTER DELETE ON public.file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION trigger_deployment();

-- 5. Enable Row Level Security (RLS)
-- ===========================================

ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_log ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active files
CREATE POLICY "Public read access to active files"
    ON public.file_metadata
    FOR SELECT
    USING (status = 'active');

-- Allow authenticated users to read all files
CREATE POLICY "Authenticated users read all files"
    ON public.file_metadata
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to create/update/delete files
CREATE POLICY "Authenticated users can manage files"
    ON public.file_metadata
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow public read access to deployment logs
CREATE POLICY "Public read deployment logs"
    ON public.deployment_log
    FOR SELECT
    USING (true);

-- Allow authenticated users full access to deployment logs
CREATE POLICY "Authenticated users manage deployment logs"
    ON public.deployment_log
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Create helper functions
-- ===========================================

-- Function to get all active solution providers
CREATE OR REPLACE FUNCTION get_active_solution_providers()
RETURNS TABLE (
    slug TEXT,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fm.slug,
        fm.metadata,
        fm.updated_at
    FROM public.file_metadata fm
    WHERE fm.file_type = 'solution-provider'
    AND fm.status = 'active'
    ORDER BY fm.metadata->>'name';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all active communities by city
CREATE OR REPLACE FUNCTION get_active_communities(city_filter TEXT DEFAULT NULL)
RETURNS TABLE (
    slug TEXT,
    city TEXT,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fm.slug,
        fm.city,
        fm.metadata,
        fm.updated_at
    FROM public.file_metadata fm
    WHERE fm.file_type = 'community'
    AND fm.status = 'active'
    AND (city_filter IS NULL OR fm.city = city_filter)
    ORDER BY fm.city, fm.metadata->>'name';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant necessary permissions
-- ===========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.file_metadata TO anon;
GRANT ALL ON public.file_metadata TO authenticated;
GRANT SELECT ON public.deployment_log TO anon;
GRANT ALL ON public.deployment_log TO authenticated;

-- Allow execution of helper functions
GRANT EXECUTE ON FUNCTION get_active_solution_providers() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_active_communities(TEXT) TO anon, authenticated;

-- ===========================================
-- Setup Complete!
-- ===========================================

-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Upload YAML/MD files to Storage
-- 3. Populate file_metadata table
-- 4. Create Edge Function for Vercel webhook
-- 5. Update website to fetch from Supabase
