export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  created_by: string;
  assigned_to?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  creator?: UserProfile;
  assignee?: UserProfile;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  actor_id: string;
  action_type: 'created' | 'status_changed' | 'reassigned' | 'updated';
  details: Record<string, any>;
  created_at: string;
  actor?: UserProfile;
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  completed: number;
  assigned_to_me: number;
  created_by_me: number;
}

export interface TaskFiltersState {
  status: string;
  priority: string;
  assigned_to: string;
  search: string;
}
