import { NotificationTemplateModel, NotificationChannel } from '../models/Notification';
import { logger } from '@/shared/utils/logger';

/**
 * Default notification templates that should exist for every organization.
 * These are seeded when an organization is created or on application startup.
 */
const DEFAULT_TEMPLATES = [
    // Leave Management
    {
        name: 'LEAVE_REQUESTED',
        channel: NotificationChannel.IN_APP,
        category: 'leave',
        subject: 'New Leave Request',
        body: 'Employee {{employeeName}} has requested {{type}} leave for {{days}} day(s) from {{startDate}} to {{endDate}}.',
        placeholders: ['employeeName', 'type', 'days', 'startDate', 'endDate'],
        active: true,
    },
    {
        name: 'LEAVE_APPROVED',
        channel: NotificationChannel.IN_APP,
        category: 'leave',
        subject: 'Leave Request Approved',
        body: 'Your {{type}} leave request from {{startDate}} to {{endDate}} has been approved. Comments: {{approverComments}}',
        placeholders: ['type', 'startDate', 'endDate', 'approverComments'],
        active: true,
    },
    {
        name: 'LEAVE_REJECTED',
        channel: NotificationChannel.IN_APP,
        category: 'leave',
        subject: 'Leave Request Rejected',
        body: 'Your {{type}} leave request from {{startDate}} to {{endDate}} has been rejected. Reason: {{reason}}',
        placeholders: ['type', 'startDate', 'endDate', 'reason'],
        active: true,
    },

    // Attendance
    {
        name: 'LATE_CHECKIN',
        channel: NotificationChannel.IN_APP,
        category: 'attendance',
        subject: 'Late Check-In Alert',
        body: 'You checked in at {{checkInTime}}, which is {{minutesLate}} minutes late.',
        placeholders: ['checkInTime', 'minutesLate'],
        active: true,
    },

    // Payroll
    {
        name: 'PAYSLIP_GENERATED',
        channel: NotificationChannel.IN_APP,
        category: 'payroll',
        subject: 'Payslip Available',
        body: 'Your payslip for {{month}} {{year}} is now available. Net Pay: ₹{{netPay}}',
        placeholders: ['month', 'year', 'netPay'],
        active: true,
    },
    {
        name: 'SALARY_CREDITED',
        channel: NotificationChannel.IN_APP,
        category: 'payroll',
        subject: 'Salary Credited',
        body: 'Your salary of ₹{{amount}} for {{month}} {{year}} has been credited to your account.',
        placeholders: ['amount', 'month', 'year'],
        active: true,
    },

    // General
    {
        name: 'WELCOME_NEW_EMPLOYEE',
        channel: NotificationChannel.IN_APP,
        category: 'onboarding',
        subject: 'Welcome to the Team!',
        body: 'Welcome {{employeeName}}! Your employee code is {{employeeCode}}. Please complete your onboarding tasks.',
        placeholders: ['employeeName', 'employeeCode'],
        active: true,
    },
    {
        name: 'PASSWORD_RESET',
        channel: NotificationChannel.IN_APP,
        category: 'security',
        subject: 'Password Reset Request',
        body: 'A password reset was requested for your account. If this was not you, please contact support immediately.',
        placeholders: [],
        active: true,
    },
];

/**
 * Seeds default notification templates for the given organization.
 * Uses upsert to avoid duplicates.
 */
export async function seedNotificationTemplates(organizationId: string): Promise<void> {
    logger.info(`Seeding notification templates for organization: ${organizationId}`);

    for (const template of DEFAULT_TEMPLATES) {
        try {
            await NotificationTemplateModel.findOneAndUpdate(
                { organizationId, name: template.name },
                {
                    $setOnInsert: {
                        ...template,
                        organizationId,
                    },
                },
                { upsert: true, new: true }
            );
            logger.debug(`Ensured template exists: ${template.name}`);
        } catch (error) {
            logger.error(`Failed to seed template ${template.name}:`, error);
        }
    }

    logger.info(`Notification template seeding complete for organization: ${organizationId}`);
}

/**
 * Removes deprecated notification templates.
 * Useful for cleanup after features are disabled.
 */
export async function removeDeprecatedTemplates(organizationId: string): Promise<void> {
    const deprecatedTemplateNames = [
        'PERFORMANCE_REVIEW_DUE',
        'GOAL_DEADLINE_REMINDER',
    ];

    logger.info(`Removing deprecated templates for organization: ${organizationId}`);

    for (const templateName of deprecatedTemplateNames) {
        try {
            await NotificationTemplateModel.deleteOne({
                organizationId,
                name: templateName,
            });
            logger.debug(`Removed deprecated template: ${templateName}`);
        } catch (error) {
            logger.error(`Failed to remove template ${templateName}:`, error);
        }
    }

    logger.info(`Deprecated template removal complete for organization: ${organizationId}`);
}

/**
 * Removes deprecated templates for ALL organizations in the database.
 */
export async function removeDeprecatedTemplatesAllOrganizations(): Promise<void> {
    const { Organization } = await import('@/domains/auth/models/Organization');

    const organizations = await Organization.find({ isDeleted: { $ne: true } });

    logger.info(`Removing deprecated templates for ${organizations.length} organization(s)...`);

    for (const org of organizations) {
        await removeDeprecatedTemplates(org._id.toString());
    }

    logger.info('Deprecated template removal complete for all organizations.');
}

/**
 * Seeds templates for ALL organizations in the database.
 * Useful for running on application startup.
 */
export async function seedAllOrganizationTemplates(): Promise<void> {
    const { Organization } = await import('@/domains/auth/models/Organization');

    const organizations = await Organization.find({ isDeleted: { $ne: true } });

    logger.info(`Seeding templates for ${organizations.length} organization(s)...`);

    for (const org of organizations) {
        await seedNotificationTemplates(org._id.toString());
    }

    logger.info('All organization template seeding complete.');
}
