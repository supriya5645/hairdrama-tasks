import os
import smtplib
import threading
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import Config

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def is_configured() -> bool:
        """Returns True if Gmail credentials are present."""
        return bool(Config.GMAIL_USER and Config.GMAIL_APP_PASSWORD)

    @staticmethod
    def _send_smtp_email(to_email: str, subject: str, html_content: str, text_content: str):
        """Internal synchronous helper to send an email via Gmail SMTP with TLS."""
        if not EmailService.is_configured():
            logger.info(f"[EMAIL MOCK] Email to {to_email} skipped - GMAIL_USER/GMAIL_APP_PASSWORD not configured.")
            logger.info(f"[EMAIL MOCK] Subject: {subject}")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{Config.EMAIL_FROM_NAME} <{Config.GMAIL_USER}>"
            msg["To"] = to_email

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(Config.GMAIL_USER, Config.GMAIL_APP_PASSWORD)
                server.sendmail(Config.GMAIL_USER, [to_email], msg.as_string())

            logger.info(f"[EMAIL SUCCESS] Successfully sent email to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"[EMAIL ERROR] Failed to send email to {to_email}: {e}")
            return False

    @classmethod
    def send_async(cls, to_email: str, subject: str, html_content: str, text_content: str):
        """Sends an email in a background daemon thread so it does not block the HTTP request."""
        thread = threading.Thread(
            target=cls._send_smtp_email,
            args=(to_email, subject, html_content, text_content),
            daemon=True
        )
        thread.start()

    @classmethod
    def send_task_created_notification(cls, task: dict, creator: dict, assignee: dict):
        """Sends an email notification when a new task is created."""
        recipient = assignee or creator
        if not recipient or not recipient.get("email"):
            logger.warning("No recipient email found for task created notification.")
            return

        to_email = recipient.get("email")
        assignee_name = recipient.get("full_name") or recipient.get("email")
        creator_name = creator.get("full_name") or creator.get("email") if creator else "A team member"
        
        task_title = task.get("title", "Untitled Task")
        task_desc = task.get("description", "No description provided.")
        priority = (task.get("priority") or "medium").upper()
        due_date = task.get("due_date") or "No due date specified"
        task_url = f"{Config.FRONTEND_URL}"

        subject = f"[Hairdrama Tasks] New Task Assigned: {task_title}"

        # Color based on priority
        priority_colors = {
            "URGENT": "#dc2626",
            "HIGH": "#ea580c",
            "MEDIUM": "#2563eb",
            "LOW": "#16a34a"
        }
        badge_color = priority_colors.get(priority, "#2563eb")

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
            .card {{ background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
            .header {{ background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
            .content {{ padding: 28px; }}
            .badge {{ display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 9999px; color: #ffffff; background-color: {badge_color}; }}
            .task-box {{ background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 4px; }}
            .meta-item {{ margin: 8px 0; font-size: 14px; color: #475569; }}
            .button {{ display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }}
            .footer {{ text-align: center; font-size: 12px; color: #94a3b8; padding: 16px; border-top: 1px solid #e2e8f0; background: #f8fafc; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Hairdrama Task Management</h1>
            </div>
            <div class="content">
              <p>Hello <strong>{assignee_name}</strong>,</p>
              <p>You have been assigned a new task by <strong>{creator_name}</strong>.</p>
              
              <div class="task-box">
                <span class="badge">{priority} PRIORITY</span>
                <h2 style="margin: 12px 0 8px 0; font-size: 18px; color: #0f172a;">{task_title}</h2>
                <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.5;">{task_desc}</p>
              </div>

              <div class="meta-item">📅 <strong>Due Date:</strong> {due_date}</div>
              <div class="meta-item">👤 <strong>Assigned By:</strong> {creator_name}</div>

              <div style="text-align: center; margin-top: 28px;">
                <a href="{task_url}" class="button" target="_blank">Open Task Manager</a>
              </div>
            </div>
            <div class="footer">
              Sent via Hairdrama Tech Task Management System &bull; Powered by Supabase &amp; Flask
            </div>
          </div>
        </body>
        </html>
        """

        text_content = f"""
Hairdrama Tasks - New Task Assigned

Hello {assignee_name},
You have been assigned a new task: "{task_title}" by {creator_name}.

Priority: {priority}
Due Date: {due_date}
Description:
{task_desc}

View your tasks at: {task_url}
        """

        cls.send_async(to_email, subject, html_content, text_content)

    @classmethod
    def send_task_completed_notification(cls, task: dict, completer: dict, creator: dict, assignee: dict):
        """Sends an email notification when a task is marked as completed."""
        # Notify the creator, and also the assignee if different
        recipients = []
        if creator and creator.get("email"):
            recipients.append(creator.get("email"))
        if assignee and assignee.get("email") and assignee.get("email") not in recipients:
            recipients.append(assignee.get("email"))

        if not recipients:
            logger.warning("No recipient emails found for task completed notification.")
            return

        completer_name = completer.get("full_name") or completer.get("email") if completer else "A team member"
        task_title = task.get("title", "Untitled Task")
        task_desc = task.get("description", "No description provided.")
        task_url = f"{Config.FRONTEND_URL}"
        subject = f"[Hairdrama Tasks] Task Completed: {task_title}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
            .card {{ background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
            .header {{ background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
            .content {{ padding: 28px; }}
            .badge-complete {{ display: inline-block; padding: 4px 12px; font-size: 12px; font-weight: 700; border-radius: 9999px; color: #ffffff; background-color: #16a34a; }}
            .task-box {{ background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px; }}
            .button {{ display: inline-block; background-color: #16a34a; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }}
            .footer {{ text-align: center; font-size: 12px; color: #94a3b8; padding: 16px; border-top: 1px solid #e2e8f0; background: #f8fafc; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Task Completed Successfully!</h1>
            </div>
            <div class="content">
              <p>Great news! The following task has been marked as completed by <strong>{completer_name}</strong>.</p>
              
              <div class="task-box">
                <span class="badge-complete">COMPLETED</span>
                <h2 style="margin: 12px 0 8px 0; font-size: 18px; color: #0f172a;">{task_title}</h2>
                <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.5;">{task_desc}</p>
              </div>

              <div style="text-align: center; margin-top: 24px;">
                <a href="{task_url}" class="button" target="_blank">View in Dashboard</a>
              </div>
            </div>
            <div class="footer">
              Sent via Hairdrama Tech Task Management System &bull; Powered by Supabase &amp; Flask
            </div>
          </div>
        </body>
        </html>
        """

        text_content = f"""
Hairdrama Tasks - Task Completed

Great news! The task "{task_title}" has been marked as COMPLETED by {completer_name}.

Description:
{task_desc}

View tasks at: {task_url}
        """

        for email in recipients:
            cls.send_async(email, subject, html_content, text_content)
