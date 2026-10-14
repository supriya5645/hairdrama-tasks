"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, signInWithGoogle } from "@/lib/supabaseClient";
import { CheckCircle2, ShieldCheck, Mail, Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/");
      }
    });
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMsg(err.message || "Failed to initiate Google OAuth. Please check configuration.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/30 mb-4 ring-1 ring-white/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Hairdrama <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Tasks</span>
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Intelligent Task Management &amp; Team Collaboration Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-semibold text-white">Welcome back</h2>
            <p className="text-xs text-slate-300">
              Sign in with your Google / Gmail account to access your workspace and assigned tasks.
            </p>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-center">
              {errorMsg}
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-slate-800 font-semibold text-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{loading ? "Redirecting to Google..." : "Continue with Google OAuth"}</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Features checkmarks */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Google OAuth 2.0 Single Sign-On</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>Automated Gmail notifications for task creation &amp; completion</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>Supabase PostgreSQL DB &amp; Row Level Security</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-slate-400">
          Built for Hairdrama Tech Assessment &bull; Next.js 14 &bull; Flask &bull; Supabase
        </p>
      </div>
    </div>
  );
}
