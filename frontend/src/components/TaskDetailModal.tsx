"use client";

import React, { useState, useEffect } from "react";
import { Task, TaskActivity, TaskStatus } from "@/types";
import { fetchTaskDetails } from "@/lib/api";
import { X, Calendar, User, Clock, CheckCircle2, History, AlertCircle, Edit3 } from "lucide-react";

interface TaskDetailModalProps {
  taskId: string | null;
  token: string | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  token,
  onClose,
  onEdit,
  onStatusChange,
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskId && token) {
      setLoading(true);
      fetchTaskDetails(token, taskId)
        .then((data) => {
          setTask(data.task);
          setActivities(data.activities);
        })
        .catch((err) => {
          console.error("Error loading task details:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [taskId, token]);

  if (!taskId) return null;

  const priorityStyles: Record<string, { bg: string }> = {
    urgent: { bg: "bg-red-50 text-red-700 border-red-200" },
    high: { bg: "bg-amber-50 text-amber-700 border-amber-200" },
    medium: { bg: "bg-blue-50 text-blue-700 border-blue-200" },
    low: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Task Details
            </span>
          </div>
          <div className="flex items-center gap-2">
            {task && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading task details...
          </div>
        ) : !task ? (
          <div className="py-16 text-center text-red-500 text-sm">
            Could not load task details.
          </div>
        ) : (
          <div className="mt-4 space-y-6 overflow-y-auto pr-1">
            {/* Badges & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    (priorityStyles[task.priority] || priorityStyles.medium).bg
                  }`}
                >
                  {task.priority} Priority
                </span>

                <span className="text-xs font-medium text-slate-500">
                  Status:
                </span>
                <select
                  value={task.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as TaskStatus;
                    onStatusChange(task.id, newStatus);
                    setTask({ ...task, status: newStatus });
                  }}
                  className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {task.title}
              </h2>
              {task.description ? (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-400 italic">
                  No description provided.
                </p>
              )}
            </div>

            {/* People & Timeline Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Assigned To:</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {task.assignee?.full_name || task.assignee?.email || "Unassigned"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Created By:</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {task.creator?.full_name || task.creator?.email || "Team member"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Due Date:</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "None"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Created On:</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {new Date(task.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Audit Trail / Activity History */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Activity History &amp; Audit Trail
                </h3>
              </div>

              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                  {activities.map((act) => {
                    const actorName = act.actor?.full_name || act.actor?.email || "System";
                    return (
                      <div key={act.id} className="relative flex items-start gap-3 pl-7">
                        <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                        <div className="text-xs">
                          <p className="text-slate-700 font-medium">
                            <span className="font-semibold text-slate-900">{actorName}</span>{" "}
                            {act.action_type === "created" && "created the task"}
                            {act.action_type === "status_changed" && (
                              <span>
                                changed status to <strong>{act.details?.to}</strong>
                              </span>
                            )}
                            {act.action_type === "reassigned" && "reassigned the task"}
                            {act.action_type === "updated" && "updated task details"}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {new Date(act.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
