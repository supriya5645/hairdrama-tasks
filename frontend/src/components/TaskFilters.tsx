"use client";

import React from "react";
import { TaskFiltersState, UserProfile } from "@/types";
import { Search, Filter, LayoutGrid, List, X } from "lucide-react";

interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFilterChange: (filters: TaskFiltersState) => void;
  users: UserProfile[];
  viewMode: "kanban" | "list";
  onViewModeChange: (mode: "kanban" | "list") => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFilterChange,
  users,
  viewMode,
  onViewModeChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, priority: e.target.value });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, assigned_to: e.target.value });
  };

  const clearFilters = () => {
    onFilterChange({
      status: "all",
      priority: "all",
      assigned_to: "all",
      search: "",
    });
  };

  const isFiltered =
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.assigned_to !== "all" ||
    filters.search !== "";

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6 space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between gap-4">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search tasks by title..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange({ ...filters, search: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status */}
        <select
          value={filters.status}
          onChange={handleStatusChange}
          className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Priority */}
        <select
          value={filters.priority}
          onChange={handlePriorityChange}
          className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Assignee */}
        <select
          value={filters.assigned_to}
          onChange={handleAssigneeChange}
          className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer max-w-[150px] truncate"
        >
          <option value="all">All Assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || u.email}
            </option>
          ))}
        </select>

        {/* Clear Filter Button */}
        {isFiltered && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ml-auto lg:ml-2">
          <button
            onClick={() => onViewModeChange("kanban")}
            title="Kanban Board View"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "kanban"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            title="Table List View"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
