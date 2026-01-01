import nodemailer from 'nodemailer';
import { logger } from './logger';

/**
 * Email Service
 * Handles sending emails using Nodemailer
 */
export class EmailService {
    private static transporter = nodemailer.createTransport({
        host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
        port: parseInt(process.env['SMTP_PORT'] || '587'),
        secure: process.env['SMTP_SECURE'] === 'true', // true for 465, false for other ports
        auth: {
            user: process.env['SMTP_USER'],
            pass: process.env['SMTP_PASS'],
        },
    });

    /**
     * Send a generic email
     */
    static async sendEmail(to: string, subject: string, html: string): Promise<void> {
        try {
            const fromName = process.env['SMTP_FROM_NAME'] || 'NexusHR';
            const fromEmail = process.env['SMTP_FROM_EMAIL'] || 'noreply@nexushr.com';

            const info = await this.transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to,
                subject,
                html,
            });

            logger.info('Email sent successfully', { messageId: info.messageId, to });
        } catch (error) {
            logger.error('Failed to send email', { error, to, subject });
            // In development, don't throw so the flow can continue even if email fails
            if (process.env['NODE_ENV'] === 'production') {
                throw error;
            }
        }
    }

    /**
     * Send OTP for Password Reset / Account Activation
     */
    static async sendOtpEmail(to: string, otp: string, isNewEmployee: boolean): Promise<void> {
        const subject = isNewEmployee
            ? 'Welcome to NexusHR - Activate Your Account'
            : 'NexusHR - Password Reset OTP';

        const title = isNewEmployee
            ? 'Account Activation'
            : 'Password Reset';

        const message = isNewEmployee
            ? 'Welcome to the team! To get started and set up your account, please use the following One-Time Password (OTP):'
            : 'We received a request to reset your password. Use the following One-Time Password (OTP) to proceed:';

        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; margin: 0;">NexusHR</h1>
          <p style="color: #6b7280; font-size: 14px;">Enterprise People Operations</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${title}</h2>
          <p style="color: #4b5563; line-height: 1.5;">${message}</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; font-size: 32px; font-weight: bold; border-radius: 8px; letter-spacing: 4px;">
              ${otp}
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 12px;">This code will expire in 10 minutes.</p>
          </div>
          
          <p style="color: #4b5563; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        
        <div style="text-align: center; color: #9ca3af; font-size: 12px;">
          &copy; ${new Date().getFullYear()} NexusHR Enterprises. All rights reserved.
        </div>
      </div>
    `;

        await this.sendEmail(to, subject, html);
    }
}
