import { Task, UserProfile, TaskStats, TaskFiltersState, TaskActivity } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}

async function request<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

/**
 * Synchronize Google OAuth user with public.profiles on Flask backend
 */
export async function syncUserWithBackend(token: string): Promise<UserProfile> {
  const res = await request<{ profile: UserProfile }>("/api/auth/sync", {
    method: "POST",
  }, token);
  return res.profile;
}

/**
 * Fetch all registered users for assignment dropdown
 */
export async function fetchUsers(token: string): Promise<UserProfile[]> {
  const res = await request<{ users: UserProfile[] }>("/api/users", {
    method: "GET",
  }, token);
  return res.users || [];
}

/**
 * Fetch tasks with optional filters
 */
export async function fetchTasks(token: string, filters?: Partial<TaskFiltersState>): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") params.append("status", filters.status);
  if (filters?.priority && filters.priority !== "all") params.append("priority", filters.priority);
  if (filters?.assigned_to && filters.assigned_to !== "all") params.append("assigned_to", filters.assigned_to);
  if (filters?.search) params.append("search", filters.search);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await request<{ tasks: Task[] }>(`/api/tasks${query}`, {
    method: "GET",
  }, token);
  return res.tasks || [];
}

/**
 * Create a new task and trigger Gmail notification
 */
export async function createTask(
  token: string,
  payload: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    due_date?: string | null;
    assigned_to?: string | null;
  }
): Promise<Task> {
  const res = await request<{ task: Task }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
  return res.task;
}

/**
 * Update task status, priority, assignee, etc.
 */
export async function updateTask(token: string, taskId: string, updates: Partial<Task>): Promise<Task> {
  const res = await request<{ task: Task }>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  }, token);
  return res.task;
}

/**
 * Delete a task
 */
export async function deleteTask(token: string, taskId: string): Promise<void> {
  await request(`/api/tasks/${taskId}`, {
    method: "DELETE",
  }, token);
}

/**
 * Fetch detailed task info including audit activity timeline
 */
export async function fetchTaskDetails(token: string, taskId: string): Promise<{ task: Task; activities: TaskActivity[] }> {
  const res = await request<{ task: Task; activities: TaskActivity[] }>(`/api/tasks/${taskId}`, {
    method: "GET",
  }, token);
  return { task: res.task, activities: res.activities || [] };
}

/**
 * Fetch dashboard analytics metrics
 */
export async function fetchStats(token: string): Promise<TaskStats> {
  const res = await request<{ metrics: TaskStats }>("/api/stats", {
    method: "GET",
  }, token);
  return res.metrics;
}
