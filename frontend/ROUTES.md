# HRMS Frontend Route Map

## Root Routes
- `/` - Home/Dashboard
- `/login` - Login page (auth)
- `/reset-password` - Password reset (auth)

## Main Routes (Protected - requires authentication)
All routes under `/(main)` require authentication and use the AppLayout with Sidebar.

### Dashboard
- `/dashboard` - Main HR Dashboard with KPIs

### Employees
- `/employees` - Employee list with search/filter
- `/employees/new` - Create new employee
- `/employees/[id]` - Employee detail view and edit

### Attendance
- `/attendance` - Attendance home (links to sub-pages)
- `/attendance/check-in` - Daily check-in
- `/attendance/check-out` - Daily check-out
- `/attendance/monthly` - Monthly attendance summary
- `/attendance/policy` - Attendance policy view

### Leave Management
- `/leave` - Leave management home (links to sub-pages)
- `/leave/request` - Request new leave
- `/leave/my-leaves` - View user's leave history
- `/leave/calendar` - Team leave calendar
- `/leave/team` - Team leave management (Manager/HR)
- `/leave/approvals` - Approve/reject leave requests (Manager/HR)

### Payroll
- `/payroll` - Payroll home (links to sub-pages)
- `/payroll/structure` - Manage salary structures (HR Admin)
- `/payroll/assign` - Assign salary to employees (HR Admin)
- `/payroll/run` - Process payroll runs (HR Admin)
- `/payroll/payslips` - View and download payslips (All)
- `/payroll/reports` - Payroll reports and analytics (HR Admin)

### Performance
- `/performance` - Performance management home
- Includes goal tracking, reviews, and feedback (via components)

### Documents
- `/documents` - Document management and upload
- View, categorize, and version documents

### Notifications
- `/notifications` - Notification center

### Admin
- `/admin` - Admin panel (Super Admin/HR Admin only)
- Manage users, roles, and audit logs

## Navigation Access Control

### Super Admin
Access to all routes

### HR Admin
Access to: Employees, Attendance, Leave (approvals), Payroll, Performance, Documents, Notifications, Admin

### Manager
Access to: Dashboard, Attendance, Leave (team view), Performance, Documents, Notifications

### Employee
Access to: Dashboard, Attendance, Leave (own requests), Performance, Documents, Notifications, Payroll (payslips)

## Current Navigation Components

### Sidebar (components/layout/Sidebar.tsx)
Main navigation menu with:
- Dashboard
- Employees
- Attendance
- Leave
- Payroll
- Performance
- Documents
- Notifications
- Admin

### AppShell (components/layout/AppShell.tsx)
Alternative navigation with role-based filtering

### Header (components/layout/Header.tsx)
Search bar and notifications bell in top bar

## Sub-Page Navigation Pattern

Main sections (Employees, Attendance, Leave, Payroll) have a home page that displays cards linking to sub-pages:

Example - Payroll structure:
```
/payroll (home page with cards)
├── → /payroll/structure
├── → /payroll/assign
├── → /payroll/run
├── → /payroll/payslips
└── → /payroll/reports
```

This allows users to navigate from the main section view to specific features.
