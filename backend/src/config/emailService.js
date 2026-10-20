const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        const host = process.env.SMTP_HOST || 'smtp.office365.com';
        const port = parseInt(process.env.SMTP_PORT || '465', 10);
        const user = process.env.SMTP_USER || '';
        const pass = process.env.SMTP_PASS || '';

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: user && pass ? { user, pass } : undefined,
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });

        this.fromEmail = process.env.SMTP_FROM || user || 'noreply@coordinatesbd.com';
    }

    async sendOtpEmail(toEmail, otpCode, displayName = 'User') {
        const subject = 'Your Email Verification Code - BDCF';
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                    .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
                    .content { padding: 32px; color: #334155; }
                    .content h2 { color: #0f172a; font-size: 20px; margin-top: 0; }
                    .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 6px; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; margin: 24px 0; }
                    .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>BDCF Verification</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${displayName},</h2>
                        <p>Thank you for registering with BDCF! To complete your registration and verify your email address, please use the One-Time Password (OTP) below:</p>
                        <div class="otp-box">${otpCode}</div>
                        <p>This verification code will expire in <strong>10 minutes</strong>.</p>
                        <p>If you did not request this verification, please ignore this email.</p>
                        <p>Best regards,<br><strong>BDCF Team</strong></p>
                    </div>
                    <div class="footer">
                        &copy; ${new Date().getFullYear()} BDCF (Coordinates BD). All rights reserved.
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            if (!this.transporter.options.auth) {
                console.log(`\n========================================`);
                console.log(`[DEV EMAIL SIMULATION] To: ${toEmail}`);
                console.log(`Subject: ${subject}`);
                console.log(`OTP Code: ${otpCode}`);
                console.log(`========================================\n`);
                return { success: true, simulated: true };
            }

            const info = await this.transporter.sendMail({
                from: `"BDCF Security" <${this.fromEmail}>`,
                to: toEmail,
                subject,
                html: htmlContent
            });

            console.log('OTP Email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send OTP email via SMTP:', error);
            console.log(`\n========================================`);
            console.log(`[FALLBACK OTP CODE] To: ${toEmail} | OTP: ${otpCode}`);
            console.log(`========================================\n`);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
}

module.exports = new EmailService();
