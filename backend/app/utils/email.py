import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()


SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)


def send_password_reset_email(
    recipient_email: str,
    reset_token: str
):
    reset_link = (
        f"{FRONTEND_URL}/reset-password?token={reset_token}"
    )

    message = EmailMessage()

    message["Subject"] = "Trishul CRM - Reset Your Password"
    message["From"] = SMTP_EMAIL
    message["To"] = recipient_email

    # Plain-text fallback
    message.set_content(
        f"""
Hello,

We received a request to reset your Trishul CRM password.

Click the link below to create a new password:

{reset_link}

If you did not request a password reset, you can safely ignore this email.

Regards,
Trishul CRM
"""
    )

    # HTML email
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Your Password - Trishul CRM</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f4f7fb;
    font-family: Arial, Helvetica, sans-serif;
">

    <div style="
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
    ">

        <!-- Header -->
        <div style="
            background: #0b1324;
            padding: 25px;
            text-align: center;
        ">

            <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 24px;
                letter-spacing: 2px;
            ">
                TRISHUL CRM
            </h1>

            <p style="
                margin: 8px 0 0;
                color: #94a3b8;
                font-size: 13px;
            ">
                Enterprise Cloud Portal
            </p>

        </div>

        <!-- Content -->
        <div style="
            padding: 35px;
            color: #1e293b;
        ">

            <h2 style="
                margin-top: 0;
                font-size: 22px;
            ">
                Reset Your Password
            </h2>

            <p style="
                font-size: 15px;
                line-height: 1.6;
                color: #475569;
            ">
                Hello,
            </p>

            <p style="
                font-size: 15px;
                line-height: 1.6;
                color: #475569;
            ">
                We received a request to reset your
                Trishul CRM password.
            </p>

            <p style="
                font-size: 15px;
                line-height: 1.6;
                color: #475569;
            ">
                Click the button below to create a new password:
            </p>

            <!-- Button -->
            <div style="
                text-align: center;
                margin: 30px 0;
            ">

                <a href="{reset_link}"
                   style="
                       display: inline-block;
                       background-color: #2563eb;
                       color: #ffffff;
                       text-decoration: none;
                       padding: 13px 28px;
                       border-radius: 7px;
                       font-size: 15px;
                       font-weight: bold;
                   ">
                    Reset Password
                </a>

            </div>

            <p style="
                font-size: 13px;
                line-height: 1.6;
                color: #64748b;
            ">
                This password reset link is intended only for your
                Trishul CRM account.
            </p>

            <p style="
                font-size: 13px;
                line-height: 1.6;
                color: #64748b;
            ">
                If you did not request a password reset, you can
                safely ignore this email.
            </p>

        </div>

        <!-- Footer -->
        <div style="
            background: #f8fafc;
            padding: 18px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        ">

            <p style="
                margin: 0;
                color: #94a3b8;
                font-size: 12px;
            ">
                © 2026 Trishul CRM
            </p>

        </div>

    </div>

</body>
</html>
"""

    message.add_alternative(
        html_content,
        subtype="html"
    )

    # Send email
    with smtplib.SMTP("smtp.gmail.com", 587) as server:

        server.starttls()

        server.login(
            SMTP_EMAIL,
            SMTP_PASSWORD
        )

        server.send_message(message)