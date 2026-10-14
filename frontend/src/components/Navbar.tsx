"use client";

import React from "react";
import { UserProfile } from "@/types";
import { signOutUser } from "@/lib/supabaseClient";
import { Sparkles, Plus, LogOut, User as UserIcon } from "lucide-react";

interface NavbarProps {
  user: UserProfile | null;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onOpenCreateModal }) => {
  const handleLogout = async () => {
    try {
      await signOutUser();
      window.location.href = "/login";
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const displayName = user?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Hairdrama <span className="text-indigo-600">Tasks</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                Workspace
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Task</span>
              <span className="sm:hidden">New</span>
            </button>

            {/* User Info & Avatar */}
            {user && (
              <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200">
                <div className="flex items-center gap-2.5">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={displayName}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-semibold text-xs ring-2 ring-indigo-500/20">
                      {initials || <UserIcon className="w-4 h-4" />}
                    </div>
                  )}
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight truncate max-w-[140px]">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
