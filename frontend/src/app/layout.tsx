import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hairdrama Tasks - Collaborative Task Management",
  description: "Enterprise task management app with Google OAuth, Supabase DB, Flask backend, and Gmail notification integration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
