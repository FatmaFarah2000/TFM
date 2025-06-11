# email_utils_jwt.py
import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv

load_dotenv() 

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_FROM"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER"),
    MAIL_FROM_NAME= os.getenv("MAIL_FROM_NAME", "Tu Aplicación"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def sendPasswordResetEmail(to: str, reset_link: str):
    subject = "Restablece tu contraseña"
    body_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Recuperación de Contraseña</h2>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" target="_blank" style="background-color: #7B68EE; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Restablecer Contraseña
                </a>
            </p>
            <p>Este enlace expirará en 15 minutos.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
            <p style="font-size: 12px; color: #777; margin-top: 30px;">Si tienes problemas con el botón, copia y pega la siguiente URL en tu navegador:</p>
            <p style="font-size: 12px; color: #777; word-break: break-all;">{reset_link}</p>
            <p style="font-size: 12px; color: #777; margin-top: 30px;">Este es un mensaje automático, por favor no respondas a este correo.</p>
        </div>
    """
    
    message = MessageSchema(
        subject=subject,
        recipients=[to],
        body=body_html,
        subtype="html"
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"Email de reseteo enviado a {to}")
    except Exception as e:
        print(f"Error al enviar email de reseteo: {e}")
        raise 

