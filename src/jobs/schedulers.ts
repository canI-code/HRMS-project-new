import { payrollQueue, defaultJobOptions, PayrollRunJobData, notificationQueue, NotificationJobData } from '@/jobs/queues';

// Helper to schedule a repeatable monthly payroll run (1st of month at 01:00)
export const scheduleMonthlyPayrollRun = (data: Omit<PayrollRunJobData, 'periodStart' | 'periodEnd'>): void => {
  // The concrete periods should be provided by an external orchestrator; here we use placeholders
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  void payrollQueue.add(
    'start-run',
    {
      ...data,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    },
    {
      ...defaultJobOptions,
      repeat: { cron: '0 1 1 * *' },
    }
  );
};

// Helper to schedule daily deadline reminders at 08:00
export const scheduleDailyDeadlineReminder = (data: NotificationJobData): void => {
  void notificationQueue.add(
    'send-notification',
    data,
    {
      ...defaultJobOptions,
      repeat: { cron: '0 8 * * *' },
    }
  );
};