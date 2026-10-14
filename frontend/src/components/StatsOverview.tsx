"use client";

import React from "react";
import { TaskStats } from "@/types";
import { CheckCircle2, Clock, ListTodo, UserCheck } from "lucide-react";

interface StatsOverviewProps {
  stats: TaskStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const cards = [
    {
      title: "Total Tasks",
      value: stats.total,
      subtext: "Workspace total",
      icon: ListTodo,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      title: "In Progress",
      value: stats.in_progress,
      subtext: "Active workload",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      title: "Completed",
      value: stats.completed,
      subtext: `${completionRate}% completion rate`,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      title: "Assigned To Me",
      value: stats.assigned_to_me,
      subtext: "Your responsibilities",
      icon: UserCheck,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl bg-white border ${card.border} shadow-xs hover:shadow-sm transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {card.value}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
