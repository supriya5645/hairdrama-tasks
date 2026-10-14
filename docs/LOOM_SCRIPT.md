# Loom Video Walkthrough Script & Presentation Guide

This guide provides a structured script for your **Loom Video Recording** (approx. 5 to 7 minutes). Follow these sections to explain your code, architectural decisions, and features in detail to ensure you pass technical screening.

---

## Preparation Checklist
1. **Screen Setup:**
   - Left side: Browser with the running web application (`http://localhost:3000` or deployed Vercel URL).
   - Right side: VS Code / IDE showing the project directory (`backend/`, `frontend/`, `migrations/`).
2. **Camera & Audio:** Ensure clear audio and your webcam feed is enabled in Loom.
3. **Tabs to Have Open:**
   - The Task Management Web App (logged in with Google).
   - The Supabase Dashboard (showing `profiles`, `tasks`, and `task_activities` tables).
   - A Gmail tab (showing the received "New Task Assigned" and "Task Completed" notification emails).

---

## Video Timeline & Script

### Part 1: Introduction & High-Level Architecture (0:00 - 1:00)
- **What to say:**
  > "Hi team at Hairdrama Tech, my name is [Your Name]. Today I am demonstrating the Collaborative Task Management application I built for the internship assignment.
  > 
  > The tech stack consists of:
  > - **Frontend:** Next.js 14 with TypeScript, Tailwind CSS, and Lucide icons.
  > - **Backend:** A RESTful Flask API in Python 3.11 with JWT-based authentication.
  > - **Database:** Supabase PostgreSQL with automated triggers, foreign keys, and Row Level Security (RLS).
  > - **Authentication:** Google OAuth 2.0 via Supabase Auth.
  > - **Email Integration:** Direct Gmail SMTP integration over TLS for instantaneous notifications when tasks are created or completed.
  > 
  > Let's start with a quick live demonstration of the key features, and then I'll walk you through the codebase line by line."

---

### Part 2: Live Feature Walkthrough (1:00 - 2:30)
1. **Google OAuth Sign-In:**
   - Show the login screen.
   - Click "Continue with Google OAuth".
   - Show how it redirects back to the dashboard, preserving the user's name, email, and Google avatar.
2. **Dashboard Overview:**
   - Highlight the KPI cards at the top (Total Tasks, In Progress, Completed, Assigned to Me).
   - Show the view toggle: **Kanban Board** vs. **Table List view**.
3. **Creating a Task & Assigning to Another User:**
   - Click "Create Task".
   - Enter a title, description, priority (Urgent / High / Medium / Low), and due date.
   - Open the **Assignee** dropdown: explain that this is dynamically populated from the `public.profiles` table (other registered users who logged in with Gmail).
   - Click "Create Task".
4. **Demonstrating Gmail Notification:**
   - Switch to your Gmail tab and refresh.
   - Show the notification email received with formatted HTML, task details, priority badge, and CTA button.
5. **Updating Status & Completion Notification:**
   - On the Kanban board or list view, change the task's status to **Completed**.
   - Show the completion notification email received in Gmail.
6. **Business Features (Extra Points):**
   - Click the "View Details" (eye icon) on the task to open the **Audit Trail Modal**.
   - Show the chronological history of events (`task_activities`): who created it, status changes, and timestamps.
   - Demonstrate the real-time search bar and priority/assignee filters.

---

### Part 3: Codebase Walkthrough (2:30 - 5:30)

#### A. Database & Migrations (`/migrations`)
- **Show `migrations/001_create_profiles.sql`:**
  - Explain the `public.profiles` table and how the `on_auth_user_created` trigger automatically mirrors users from Supabase's `auth.users` on sign-in.
- **Show `migrations/002_create_tasks.sql`:**
  - Explain foreign keys (`created_by`, `assigned_to` referencing `profiles(id)`), the status and priority check constraints, and the `on_task_update` trigger that automatically sets `completed_at` and `updated_at`.
- **Show `migrations/003_create_task_activities.sql`:**
  - Explain the audit logging table for tracking state transitions.

#### B. Flask Backend (`/backend`)
- **Show `backend/app.py`:**
  - Explain the application factory pattern `create_app()`, CORS configuration, and blueprint registration (`auth`, `tasks`, `users`, `stats`, `health`).
- **Show `backend/utils/auth_middleware.py`:**
  - Explain the `@require_auth` decorator: it extracts the Bearer token from the `Authorization` header and validates it via `supabase.auth.get_user(token)`, populating `flask.g.current_user`.
- **Show `backend/services/email_service.py`:**
  - Explain how `EmailService` connects to `smtp.gmail.com:587` with TLS.
  - **Crucial point:** Explain that email delivery is executed inside a background daemon thread (`threading.Thread`) so that the HTTP API response remains sub-100ms and is never blocked by SMTP handshake latency.
- **Show `backend/routes/task_routes.py`:**
  - Walk through `POST /api/tasks` (creates task, logs activity, queues email).
  - Walk through `PATCH /api/tasks/<id>` (detects status transition to `'completed'`, updates `completed_at`, and dispatches completion email).

#### C. Next.js Frontend (`/frontend`)
- **Show `frontend/src/app/auth/callback/route.ts`:**
  - Explain the server route handler that exchanges the Google OAuth authorization code for a Supabase session using `@supabase/ssr`.
- **Show `frontend/src/lib/api.ts`:**
  - Explain how API calls automatically attach `Authorization: Bearer ${token}`.
- **Show `frontend/src/components/KanbanBoard.tsx` and `TaskCard.tsx`:**
  - Explain the component modularity, TypeScript interfaces, and optimistic UI updates for quick status toggling.

---

### Part 4: Conclusion & Wrap-Up (5:30 - 6:00)
- **What to say:**
  > "To summarize, all requirements of the assignment have been met in full:
  > 1. Google OAuth 2.0 authentication.
  > 2. Task creation and peer assignment.
  > 3. Dual Gmail notifications for creation and completion.
  > 4. Supabase PostgreSQL database with migrations and triggers.
  > 5. Production deployment with clean architecture and comprehensive documentation.
  > 
  > Thank you for reviewing my submission, and I look forward to discussing the technical details in the interview rounds!"
