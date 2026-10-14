# System Architecture & Technical Specifications

This document outlines the architecture, data flow, security model, and component interactions of the **Hairdrama Collaborative Task Management System**.

---

## 1. High-Level Architecture Overview

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Next.js 14 + TypeScript)"]
        UI["React Server & Client Components (Tailwind CSS)"]
        SupaAuth["Supabase Auth Client (OAuth 2.0 PKCE)"]
        ApiClient["REST API Client (Bearer Token Auth)"]
    end

    subgraph AuthProvider["Identity Provider"]
        GoogleOAuth["Google Cloud OAuth 2.0 (Gmail / Accounts)"]
    end

    subgraph Backend["Backend API (Flask Python 3.11)"]
        FlaskRouter["Flask Blueprints / Router"]
        AuthMiddleware["JWT Verification Middleware (Bearer Auth)"]
        TaskService["Supabase DB Service (PostgREST)"]
        EmailService["Gmail SMTP Email Worker (Threaded Asynchronous)"]
    end

    subgraph Database["Database & Storage (Supabase PostgreSQL)"]
        AuthUsers["auth.users (Managed Auth)"]
        PublicProfiles["public.profiles (Team Members)"]
        PublicTasks["public.tasks (Tasks & Metadata)"]
        PublicActivities["public.task_activities (Audit Logs)"]
        PostgresTriggers["PostgreSQL Triggers & RLS Policies"]
    end

    subgraph EmailProvider["Email Delivery"]
        GmailSMTP["Gmail SMTP Server (smtp.gmail.com:587 TLS)"]
    end

    %% Interactions
    UI --> SupaAuth
    SupaAuth <--> GoogleOAuth
    SupaAuth --> AuthUsers
    AuthUsers -->|Trigger: on_auth_user_created| PublicProfiles

    UI --> ApiClient
    ApiClient -->|HTTP Requests + Bearer JWT| AuthMiddleware
    AuthMiddleware --> FlaskRouter
    FlaskRouter --> TaskService
    TaskService <--> Database
    FlaskRouter --> EmailService
    EmailService -->|Background TLS Worker| GmailSMTP
```

---

## 2. Authentication & Authorization Flow (Google OAuth 2.0)

1. **User Sign-In:** The user visits `/login` and clicks **Continue with Google OAuth**.
2. **Supabase Auth Request:** Next.js invokes `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`.
3. **Google Consent Screen:** User approves permissions in their Google account.
4. **Code Exchange:** Google redirects back to `/auth/callback?code=...`. The Next.js Route Handler exchanges the authorization code for a session (access token and refresh token) using Supabase SSR cookies.
5. **Database Trigger:** A PostgreSQL trigger (`on_auth_user_created`) automatically extracts user metadata (`full_name`, `avatar_url`, `email`) and upserts a record in `public.profiles`.
6. **Backend Verification:** When making requests to the Flask API, the frontend includes `Authorization: Bearer <access_token>`.
7. **Auth Middleware:** Flask's `@require_auth` decorator validates the token against Supabase Auth (`supabase.auth.get_user(token)`), populating `flask.g.current_user`.

---

## 3. Asynchronous Gmail Notification System

Email delivery should never block user interaction or API response times.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Client)
    participant Flask as Flask API Server
    participant DB as Supabase PostgreSQL
    participant Worker as Background Daemon Thread
    participant Gmail as Gmail SMTP (Port 587)
    actor Assignee as Assignee / Creator

    User->>Flask: POST /api/tasks (Title, Priority, Assignee)
    Flask->>DB: INSERT INTO public.tasks
    DB-->>Flask: Created Task Record
    Flask->>DB: INSERT INTO public.task_activities (Action: 'created')
    Flask->>Worker: Spawn Async Thread (send_task_created_notification)
    Flask-->>User: 201 Created (Instant Response < 80ms)
    Note over Worker,Gmail: Background Execution (Non-blocking)
    Worker->>Gmail: Connect via smtplib.SMTP (TLS handshake)
    Worker->>Gmail: Authenticate with App Password
    Worker->>Gmail: Send Multipart MIME (HTML + Plaintext)
    Gmail-->>Assignee: Delivered to Inbox
```

---

## 4. Database Schema & Relational Integrity

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    PROFILES ||--o{ TASKS : "creates"
    PROFILES ||--o{ TASKS : "assigned to"
    PROFILES ||--o{ TASK_ACTIVITIES : "acts as actor"
    TASKS ||--o{ TASK_ACTIVITIES : "has audit history"

    PROFILES {
        uuid id PK
        text email UK
        text full_name
        text avatar_url
        timestamptz created_at
        timestamptz updated_at
    }

    TASKS {
        uuid id PK
        varchar title
        text description
        varchar status
        varchar priority
        timestamptz due_date
        uuid created_by FK
        uuid assigned_to FK
        timestamptz completed_at
        timestamptz created_at
        timestamptz updated_at
    }

    TASK_ACTIVITIES {
        uuid id PK
        uuid task_id FK
        uuid actor_id FK
        varchar action_type
        jsonb details
        timestamptz created_at
    }
```

---

## 5. Security & Row-Level Security (RLS)

- **PostgreSQL RLS:** All tables have Row-Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- **Profiles Policy:** All authenticated users can read profiles to populate assignment dropdowns; users can update only their own profile.
- **Tasks Policy:** Authenticated users can view team tasks, create tasks assigned to themselves or peers, update tasks where they are creator/assignee, and delete tasks they created.
- **Environment Isolation:** Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_APP_PASSWORD`) remain exclusively on the server and are never exposed to client-side bundles.
