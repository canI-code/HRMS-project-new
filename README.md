# Enterprise HRMS

A full-stack Human Resource Management System for modern organizations.

## 🏗️ Project Structure

```
own-hrms-project/
│
├── backend/                # Node.js + Express + TypeScript backend
│   ├── src/               # Source code (domains, middleware, utils)
│   ├── tests/             # Jest tests (unit, integration, property-based)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/              # Next.js + React + TypeScript frontend
│   ├── app/               # Next.js App Router
│   ├── public/            # Static assets
│   ├── package.json
│   └── tailwind.config.ts
│
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Redis

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env        # Configure MongoDB & Redis URLs
npm run dev                 # Starts on http://localhost:3000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                 # Starts on http://localhost:3001
```

## ✨ Features

- **Employee Lifecycle**: Onboarding, offboarding, hierarchy management
- **Attendance**: Time tracking, shift management, reports
- **Leave Management**: Request workflows, approvals, balance tracking
- **Payroll**: Salary structures, payroll runs, payslip generation
- **Performance**: Goal setting, reviews, 360° feedback
- **Documents**: Secure storage, versioning, access control
- **Multi-tenant SaaS**: Organization-level isolation
- **Enterprise Security**: RBAC, MFA, audit trails

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Cache/Jobs**: Redis (Bull queues)
- **Auth**: JWT + refresh tokens + MFA
- **Testing**: Jest + fast-check (property-based)
- **API Docs**: Swagger/OpenAPI 3.0

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: React 19
- **State**: React hooks + Context

## 📚 Documentation

- **API Docs**: http://localhost:3000/docs (Swagger UI)
- **Backend Tasks**: `backend/.kiro/specs/enterprise-hrms/tasks.md`
- **API Version**: v1 at `/api/v1/*`

## 🧪 Testing

### Backend (65 tests - all passing ✅)
```bash
cd backend
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage
```

Test categories:
- Unit tests: Domain services & utilities
- Integration tests: API endpoints
- Property-based tests: Business logic invariants

### Frontend
```bash
cd frontend
npm test
```

## 🏛️ Backend Architecture

### Domain-Driven Design
1. **Auth & Identity** - Authentication, authorization, MFA
2. **Employees** - Lifecycle, onboarding, hierarchy
3. **Attendance** - Check-in/out, tracking, reports
4. **Leave** - Requests, approvals, balances
5. **Payroll** - Structures, runs, payslips
6. **Performance** - Goals, reviews, feedback
7. **Documents** - Storage, versioning, access
8. **Notifications** - Templates, delivery, preferences

### Key Patterns
- Multi-tenancy with organization isolation
- RBAC (Role-Based Access Control)
- Immutable audit logging
- Background job processing (Redis queues)
- API versioning with backward compatibility

## 🔐 Security

- JWT authentication with refresh tokens
- Password hashing (bcrypt)
- Multi-factor authentication (TOTP)
- Token blacklisting on logout
- Organization-level data isolation
- Role-based permissions
- Rate limiting
- Input sanitization
- Security headers (Helmet)

## 🚢 Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## 📖 Additional Resources

- [Backend Progress Tracking](backend/.kiro/specs/enterprise-hrms/tasks.md)
- [API Documentation](http://localhost:3000/docs)
- [Swagger Spec](http://localhost:3000/api/v1/docs)

---

**Built with ❤️ using modern web technologies**
