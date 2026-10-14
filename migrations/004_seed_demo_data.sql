-- ============================================================================
-- Migration: 004_seed_demo_data.sql
-- Description: Helper queries and functions to inspect profiles and tasks
-- ============================================================================

-- Function to safely fetch user profile stats
CREATE OR REPLACE FUNCTION public.get_task_metrics(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_tasks', COUNT(*),
        'todo_count', COUNT(*) FILTER (WHERE status = 'todo'),
        'in_progress_count', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'completed_count', COUNT(*) FILTER (WHERE status = 'completed'),
        'assigned_to_me', COUNT(*) FILTER (WHERE assigned_to = user_id_param),
        'created_by_me', COUNT(*) FILTER (WHERE created_by = user_id_param),
        'overdue_count', COUNT(*) FILTER (WHERE due_date < timezone('utc'::text, now()) AND status != 'completed')
    )
    INTO result
    FROM public.tasks;

    RETURN result;
END;
$$;
