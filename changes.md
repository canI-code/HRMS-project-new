## Login page:
[ ] make forgot password functional.
[ ] allow new employee to reset its password on first login (backend support needed).

##Main-page after login:
[ ] show a loading spinner while fetching user data.
[ ] handle session expiration gracefully (redirect to login with message).
[ ] implement role-based navigation (different menu items for different roles).
[x] bell icon for notifications in the header to be made functional.
[x] Search bar in the header to be removed.

## Dashboard:
[ ] show key metrics (attendance, leaves, payroll summary) in cards.
[ ] add charts for visual representation of data.
[ ] Dashboard changes as per user role (Admin/Manager/Employee).

## Employees Module:
[ ] duirng search it should show content that contains the search item not just start with it.
[ ] remove export button.
[ ] auto assign employee code when addign new employee, but show the eployee code field but disabled.
[ ] employee code format should be: EMP-YYMMXXXX (e.g., EMP-2406001 for first employee joined in June 2024).
[ ] add minimum age validation (18 years) while adding new employee.
[ ] add maximum age validation (65 years) while adding new employee.
[ ] take zip code and auto fill city and state fields.
[ ] for phone number field add country code selector.
[ ] for fields like department and designation and locations, use dropdowns instead of free text.
[ ] only admins and super admins will have power to add/delete departments and designations and locations.
[ ] in hierarchy visualization, show designation along with employee name.
[ ] in employee detail page, show date of joining and employee code prominently.
[ ] in employee detail page, add a section for emergency contact details.
[ ] in employee detail page, add a section for bank details.
[ ] in employee detail page, add a section for documents uploaded by employee.
[ ] in edit employee form, allow updating bank details.
[ ] in edit employee form, allow uploading documents.
[ ] onboarding workflow UI to be enhanced with progress indicator.
[ ] add filters in employee list view for department and designation.
[ ] when the employee name is displayed it's middel name is not visible, show full name.

## Attendance Module:
[ ] show total working hours for the day after check-out.
[ ] add a summary section showing total days present, absent, and leaves taken in the month.
[ ] implement notifications for late check-ins.
[ ] add option to edit check-in/check-out times (with audit log).
[ ] in attendance policy settings, allow configuring grace period for late check-ins.

## Leave Module:
[ ] in leave request form, show remaining leave balance.
[ ] implement notifications for leave approvals/rejections.
[ ] in leave calendar view, add filters for leave type and employee.
[ ] in calender view add more details lke employee anme and id and reason for leave on hover and on clicking a date.
[ ] in leave policy configuration, allow setting maximum consecutive leave days.
[ ] use proper color codes for different leave statuses (approved, pending, rejected).
[ ] in team leaves view, allow managers to see leave balances of their team members.
[ ] LEAVE POLICY NOT GETTING UPDATED WHEN EDITED, FIX IT.

## Payroll Module:
[ ] imporve the Ui of all sections.

## Performace Module:
[ ] goal tracking component to be made functional.
[ ] implement performance review workflow.
[ ] add feedback component for peer reviews.
[ ] performance dashboard to show key metrics and progress.

## documents Module:
[ ] implement document upload functionality.
[ ] add version control for documents.
[ ] implement access control based on user roles.
[ ] add search functionality in document browser.

## Notifications:
[ ] implement real-time notifications using WebSockets.
[ ] allow users to customize notification preferences.
[ ] add email notification templates for different events.

## Admin Settings:
[ ] implement organization settings page.
[ ] add role management UI with create/edit roles functionality.
[ ] implement audit log viewer with filters.
[ ] in users tab, allow super admin to search users by name, email, and role.

#profile settings page:
[ ] allow users to update their personal information.
[ ] add option to upload profile picture.
[ ] show user's full details when clicking on profile name.

##general:
[ ] ensure mobile responsiveness across all pages.
[ ] implement consistent theming and styling.
[ ] add loading indicators for all data-fetching operations.
[ ] improve error handling and display user-friendly messages.
[ ] conduct thorough testing for all modules to ensure functionality and fix bugs.
