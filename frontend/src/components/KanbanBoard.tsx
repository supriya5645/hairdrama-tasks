"use client";

import React from "react";
import { Task, TaskStatus } from "@/types";
import { TaskCard } from "./TaskCard";
import { ListTodo, Clock, CheckCircle2, Plus } from "lucide-react";

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenCreateModal: (defaultStatus?: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onStatusChange,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onOpenCreateModal,
}) => {
  const columns: {
    id: TaskStatus;
    title: string;
    icon: React.ElementType;
    color: string;
    badgeBg: string;
    badgeText: string;
  }[] = [
    {
      id: "todo",
      title: "To Do",
      icon: ListTodo,
      color: "border-t-indigo-500",
      badgeBg: "bg-indigo-100",
      badgeText: "text-indigo-800",
    },
    {
      id: "in_progress",
      title: "In Progress",
      icon: Clock,
      color: "border-t-amber-500",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-800",
    },
    {
      id: "completed",
      title: "Completed",
      icon: CheckCircle2,
      color: "border-t-emerald-500",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className={`bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col min-h-[500px] border-t-4 ${col.color}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-sm text-slate-800">{col.title}</h3>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText}`}
                >
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onOpenCreateModal(col.id)}
                title={`Add task to ${col.title}`}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards Column */}
            <div className="space-y-4 flex-1">
              {colTasks.length === 0 ? (
                <div className="h-40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xs text-slate-400 font-medium">No tasks here</p>
                  <button
                    onClick={() => onOpenCreateModal(col.id)}
                    className="mt-2 text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    + Add a task
                  </button>
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onSelectTask={onSelectTask}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
