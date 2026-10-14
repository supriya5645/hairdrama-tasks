-- ============================================================================
-- Migration: 002_create_tasks.sql
-- Description: Creates the public.tasks table with priority, status,
-- assignees, due dates, timestamps, and indexes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Authenticated users can read tasks they created or were assigned to, or view team tasks
CREATE POLICY "Allow authenticated users to read tasks"
    ON public.tasks
    FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can insert tasks
CREATE POLICY "Allow authenticated users to insert tasks"
    ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Users can update tasks they created or were assigned to
CREATE POLICY "Allow creators and assignees to update tasks"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() = assigned_to)
    WITH CHECK (auth.uid() = created_by OR auth.uid() = assigned_to);

-- Users can delete tasks they created
CREATE POLICY "Allow creators to delete tasks"
    ON public.tasks
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Service role full access
CREATE POLICY "Allow service role full access to tasks"
    ON public.tasks
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Auto-update updated_at and completed_at trigger
CREATE OR REPLACE FUNCTION public.handle_task_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = timezone('utc'::text, now());
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_update ON public.tasks;
CREATE TRIGGER on_task_update
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_task_update();
