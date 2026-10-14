"use client";

import React from "react";
import { Task, TaskStatus } from "@/types";
import { Calendar, User as UserIcon, Eye, Edit3, Trash2, CheckCircle2 } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onStatusChange,
  onSelectTask,
  onEditTask,
  onDeleteTask,
}) => {
  const priorityStyles: Record<string, { bg: string }> = {
    urgent: { bg: "bg-red-50 text-red-700 border-red-200" },
    high: { bg: "bg-amber-50 text-amber-700 border-amber-200" },
    medium: { bg: "bg-blue-50 text-blue-700 border-blue-200" },
    low: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
        <p className="text-slate-500 text-sm">No tasks match your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 sm:px-6">Task</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {tasks.map((task) => {
              const priorityStyle = priorityStyles[task.priority] || priorityStyles.medium;
              const isOverdue =
                task.due_date &&
                task.status !== "completed" &&
                new Date(task.due_date).getTime() < Date.now();
              const assigneeName =
                task.assignee?.full_name || task.assignee?.email?.split("@")[0] || "Unassigned";

              return (
                <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Task Title & Description */}
                  <td className="py-3.5 px-4 sm:px-6 max-w-xs">
                    <div
                      onClick={() => onSelectTask(task)}
                      className="cursor-pointer group"
                    >
                      <p
                        className={`font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors ${
                          task.status === "completed" ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-slate-500 text-xs truncate mt-0.5 max-w-sm">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>

                  {/* Priority Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${priorityStyle.bg}`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
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
                      <span className="text-slate-700 font-medium text-xs truncate max-w-[120px]">
                        {assigneeName}
                      </span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {task.due_date ? (
                      <span
                        className={`text-xs font-medium ${
                          isOverdue ? "text-red-600 font-semibold" : "text-slate-600"
                        }`}
                      >
                        {new Date(task.due_date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">&mdash;</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectTask(task)}
                        title="View details"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditTask(task)}
                        title="Edit task"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete task"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
