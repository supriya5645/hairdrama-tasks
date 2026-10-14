"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Task,
  UserProfile,
  TaskStats,
  TaskFiltersState,
  TaskStatus,
  TaskPriority,
} from "@/types";
import {
  syncUserWithBackend,
  fetchTasks,
  fetchUsers,
  fetchStats,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { StatsOverview } from "@/components/StatsOverview";
import { TaskFilters } from "@/components/TaskFilters";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TaskList } from "@/components/TaskList";
import { TaskModal } from "@/components/TaskModal";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  // Auth & User State
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    todo: 0,
    in_progress: 0,
    completed: 0,
    assigned_to_me: 0,
    created_by_me: 0,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View & Filter State
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filters, setFilters] = useState<TaskFiltersState>({
    status: "all",
    priority: "all",
    assigned_to: "all",
    search: "",
  });

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<TaskStatus>("todo");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Session initialization
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          router.replace("/login");
          return;
        }

        if (mounted) {
          setSession(currentSession);
          // Sync user with backend public.profiles
          try {
            const profile = await syncUserWithBackend(currentSession.access_token);
            setCurrentUser(profile);
          } catch (syncErr) {
            console.warn("Backend sync notice (backend may be starting or offline):", syncErr);
            // Fallback user profile from session
            setCurrentUser({
              id: currentSession.user.id,
              email: currentSession.user.email || "",
              full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split("@")[0],
              avatar_url: currentSession.user.user_metadata?.avatar_url || "",
            });
          }
          setAuthLoading(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.replace("/login");
      }
    }

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) {
        router.replace("/login");
      } else {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // 2. Data fetching
  const loadWorkspaceData = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      setLoadingData(true);
      const token = session.access_token;
      const [fetchedTasks, fetchedUsers, fetchedStats] = await Promise.all([
        fetchTasks(token, filters),
        fetchUsers(token),
        fetchStats(token),
      ]);
      setTasks(fetchedTasks);
      setUsers(fetchedUsers);
      setStats(fetchedStats);
    } catch (err: any) {
      console.error("Error loading workspace data:", err);
    } finally {
      setLoadingData(false);
    }
  }, [session, filters]);

  useEffect(() => {
    if (session?.access_token) {
      loadWorkspaceData();
    }
  }, [session, loadWorkspaceData]);

  // 3. Handlers
  const handleOpenCreateModal = (status: TaskStatus = "todo") => {
    setEditingTask(null);
    setDefaultStatusForNew(status);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: {
    id?: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string | null;
    assigned_to?: string | null;
  }) => {
    if (!session?.access_token) return;
    const token = session.access_token;

    if (taskData.id) {
      // Update
      await updateTask(token, taskData.id, taskData);
      showToast("Task updated successfully.");
    } else {
      // Create (triggers Gmail notification)
      await createTask(token, taskData);
      showToast("Task created and notification dispatched via Gmail!");
    }
    loadWorkspaceData();
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!session?.access_token) return;
    const token = session.access_token;

    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(token, taskId, { status: newStatus });
      if (newStatus === "completed") {
        showToast("Task marked completed! Completion email sent via Gmail.");
      }
      loadWorkspaceData();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      loadWorkspaceData(); // Rollback
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    if (!session?.access_token) return;

    try {
      await deleteTask(session.access_token, taskId);
      showToast("Task deleted successfully.");
      loadWorkspaceData();
    } catch (err: any) {
      alert(err.message || "Could not delete task.");
    }
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold tracking-wide">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        onOpenCreateModal={() => handleOpenCreateModal("todo")}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* KPI Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Task Filters & View Toggle */}
        <TaskFilters
          filters={filters}
          onFilterChange={setFilters}
          users={users}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Loading Indicator or Views */}
        {loadingData ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Fetching workspace tasks...</span>
          </div>
        ) : viewMode === "kanban" ? (
          <KanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
            onEditTask={handleOpenEditModal}
            onDeleteTask={handleDeleteTask}
            onOpenCreateModal={handleOpenCreateModal}
          />
        ) : (
          <TaskList
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
            onEditTask={handleOpenEditModal}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </main>

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTask}
        initialTask={editingTask}
        defaultStatus={defaultStatusForNew}
        users={users}
        currentUserId={currentUser?.id}
      />

      {/* Task Detail & Audit Trail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        token={session?.access_token || null}
        onClose={() => setSelectedTaskId(null)}
        onEdit={(task) => {
          setSelectedTaskId(null);
          handleOpenEditModal(task);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
