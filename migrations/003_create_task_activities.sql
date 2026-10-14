-- ============================================================================
-- Migration: 003_create_task_activities.sql
-- Description: Creates task_activities table to maintain an audit trail
-- of changes (created, status updated, assigned, commented).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'reassigned', 'updated'
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for querying activities by task
CREATE INDEX IF NOT EXISTS idx_task_activities_task_id ON public.task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_created_at ON public.task_activities(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read task activities"
    ON public.task_activities
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert task activities"
    ON public.task_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Allow service role full access to task activities"
    ON public.task_activities
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
