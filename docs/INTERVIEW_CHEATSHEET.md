# Technical Interview Cheatsheet: Deep-Dive Q&A

This document prepares you for the **Technical Interview Round** at Hairdrama Tech. Review these core questions and answers so you can explain every design choice with confidence.

---

## 1. Flask & Backend Architecture

### Q1: Why did you structure the Flask app using the Application Factory pattern (`create_app`)?
- **Answer:**
  The Application Factory pattern decouples the app initialization from the global state. It allows:
  1. Creating multiple instances with different configurations (e.g. testing vs development vs production).
  2. Preventing circular import dependencies when registering Blueprints and extensions.
  3. Easy integration with WSGI servers like Gunicorn (`gunicorn "app:create_app()"`).

### Q2: How are routes organized, and what is the role of Blueprints?
- **Answer:**
  Routes are split into modular Blueprints (`auth_bp`, `tasks_bp`, `users_bp`, `stats_bp`, `health_bp`). Each Blueprint encapsulates a specific business domain under an isolated URL prefix (e.g., `/api/tasks`). This makes the codebase maintainable, testable, and scalable.

### Q3: How does your authentication middleware work in Flask?
- **Answer:**
  We implemented a custom `@require_auth` decorator in `utils/auth_middleware.py`:
  1. It reads the `Authorization` header and extracts the Bearer token.
  2. It calls `supabase.auth.get_user(token)` to verify the JWT against Supabase's auth service.
  3. If valid, it binds the authenticated user payload (`id`, `email`, `metadata`) to Flask's request context `flask.g.current_user`.
  4. If invalid or missing, it immediately halts execution and returns a `401 Unauthorized` JSON response.

### Q4: How is Gunicorn configured for production deployment on Render/Railway?
- **Answer:**
  In our `Procfile` and `Dockerfile`, we run Gunicorn:
  ```bash
  gunicorn --bind 0.0.0.0:$PORT --workers 3 --timeout 120 app:app
  ```
  We use the master-worker model (`--workers 3` calculated as `(2 * CPU cores) + 1`) to handle concurrent HTTP requests.

---

## 2. Supabase, PostgreSQL & Migrations

### Q5: How is user data synchronized between Supabase Auth and your `public.profiles` table?
- **Answer:**
  Supabase Auth stores credentials and OAuth identities in an isolated schema `auth.users`. Because client applications cannot (and should not) query `auth.users` directly for security reasons, we established a PostgreSQL trigger function (`public.handle_new_user()` in `001_create_profiles.sql`). Whenever a user registers or logs in via Google OAuth, this trigger automatically copies their `id`, `email`, `full_name`, and `avatar_url` into `public.profiles`.

### Q6: What is Row Level Security (RLS) and how did you configure it?
- **Answer:**
  Row Level Security restricts which rows can be read, inserted, or modified at the database engine level based on PostgreSQL policies.
  - For `public.profiles`: Anyone authenticated can read profiles (necessary for populating the task assignee selector), but users can only update their own row (`auth.uid() = id`).
  - For `public.tasks`: Users can read tasks, insert tasks where `created_by = auth.uid()`, and update tasks where they are the creator or assignee (`auth.uid() = created_by OR auth.uid() = assigned_to`).

### Q7: Why do you have an automated PostgreSQL trigger on task updates?
- **Answer:**
  In `002_create_tasks.sql`, the trigger `handle_task_update` automatically sets `updated_at = now()`. Additionally, when the status changes to `'completed'`, it sets `completed_at = now()`, ensuring relational data integrity without relying on client-side clocks.

---

## 3. Google OAuth 2.0 & Next.js

### Q8: What OAuth flow is used for Google Sign-In?
- **Answer:**
  We use the **OAuth 2.0 Authorization Code flow with PKCE (Proof Key for Code Exchange)** handled by Supabase Auth:
  1. The user clicks "Continue with Google OAuth" on the frontend.
  2. Supabase redirects to Google's consent screen.
  3. Google redirects back to `/auth/callback?code=...` with a temporary authorization code.
  4. The Next.js SSR route handler exchanges the code for a session (access token and refresh token) server-side and stores session tokens in secure HTTP-only cookies via `@supabase/ssr`.

### Q9: Why use Next.js 14 App Router instead of Pages Router?
- **Answer:**
  Next.js 14 App Router provides:
  1. Server Components by default, minimizing JavaScript bundle size sent to the client.
  2. Route Handlers (`app/auth/callback/route.ts`) for clean API logic without legacy `/api` configuration.
  3. Granular streaming and loading states (`loading.tsx`).

---

## 4. Gmail SMTP Integration & Concurrency

### Q10: How does the email notification service work?
- **Answer:**
  We use Python's built-in `smtplib` and `email.mime` modules configured with `smtp.gmail.com` on port `587`.
  - It establishes an encrypted TLS session via `server.starttls()`.
  - It authenticates using the developer's Gmail address and a 16-character **Google App Password**.
  - It constructs a `MIMEMultipart("alternative")` email containing both a rich responsive HTML template and a plain-text fallback.

### Q11: Why is email sending executed in a background daemon thread?
- **Answer:**
  SMTP handshakes over TLS take between 500ms to 2000ms due to network hops. If executed synchronously inside the Flask request handler, the user would experience noticeable latency when clicking "Create Task". By offloading the SMTP transmission to `threading.Thread(daemon=True)`, the Flask API returns a `201 Created` response to the user in less than 50 milliseconds while the email sends reliably in the background.

---

## 5. Extra Features (Business Value)

### Q12: What additional features did you build to add business value?
- **Answer:**
  1. **Audit Trail & Activity Log (`public.task_activities`):** Maintains a verifiable history of all task actions (creation, status changes, reassignments) with actor attribution and timestamps.
  2. **Kanban Board & List View Toggle:** Allows visual workflow management for agile teams.
  3. **Real-time KPI Dashboard:** Computes workspace metrics (Total Tasks, In Progress, Completed, Assigned to Me, and completion rate).
  4. **Multi-criteria Filtering & Search:** Instant search by title with status, priority, and assignee filters.
  5. **Overdue Badge Detection:** Flags tasks whose due dates have passed.
