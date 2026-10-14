"use client";

import React from "react";
import { Task, TaskStatus } from "@/types";
import { Calendar, User as UserIcon, Clock, CheckCircle2, MoreVertical, Trash2, Edit3, Eye } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onSelectTask,
  onEditTask,
  onDeleteTask,
}) => {
  const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
    urgent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    high: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    medium: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  };

  const currentPriority = priorityStyles[task.priority] || priorityStyles.medium;

  // Check if overdue
  const isOverdue =
    task.due_date &&
    task.status !== "completed" &&
    new Date(task.due_date).getTime() < Date.now();

  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  const assigneeName = task.assignee?.full_name || task.assignee?.email?.split("@")[0] || "Unassigned";

  return (
    <div className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between">
      <div>
        {/* Top bar: Priority & Actions */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${currentPriority.bg} ${currentPriority.text} ${currentPriority.border}`}
          >
            {task.priority}
          </span>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onSelectTask(task)}
              title="View details & activity history"
              className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEditTask(task)}
              title="Edit task"
              className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteTask(task.id)}
              title="Delete task"
              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelectTask(task)}
          className={`font-semibold text-slate-900 text-sm sm:text-base leading-snug cursor-pointer hover:text-indigo-600 transition-colors mb-1.5 ${
            task.status === "completed" ? "line-through text-slate-500" : ""
          }`}
        >
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
            {task.description}
          </p>
        )}
      </div>

      {/* Card Footer: Assignee, Due Date & Quick Status */}
      <div className="pt-3 border-t border-slate-100 mt-2 space-y-3">
        <div className="flex items-center justify-between text-xs">
          {/* Assignee */}
          <div className="flex items-center gap-2">
            {task.assignee?.avatar_url ? (
              <img
                src={task.assignee.avatar_url}
                alt={assigneeName}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold ring-1 ring-slate-200">
                {assigneeName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-slate-600 font-medium truncate max-w-[100px] text-[11px]">
              {assigneeName}
            </span>
          </div>

          {/* Due date */}
          {formattedDueDate && (
            <div
              className={`flex items-center gap-1 text-[11px] font-medium ${
                isOverdue ? "text-red-600 font-semibold" : "text-slate-500"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDueDate}</span>
            </div>
          )}
        </div>

        {/* Quick status selector */}
        <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 text-xs">
          <span className="text-[11px] font-medium text-slate-500 pl-1">Status:</span>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="text-xs font-semibold py-1 px-2 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
};
