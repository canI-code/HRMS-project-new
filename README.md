# Enterprise HRMS

A comprehensive Human Resource Management System designed for mid-to-large organizations (500-10,000+ employees). Built with the MERN stack, prioritizing scalability, security, and maintainability.

## Features

- **Employee Lifecycle Management**: Complete onboarding through exit processes
- **Attendance Tracking**: Time tracking, shift management, policy enforcement
- **Leave Management**: Request workflows, balance calculations, approvals
- **Payroll Processing**: Salary calculations, payslip generation, compliance
- **Performance Management**: Goal setting, reviews, feedback cycles
- **Document Management**: Secure storage, version control, access controls
- **Multi-tenant SaaS**: Organization-level data isolation
- **Enterprise Security**: RBAC, audit trails, encryption

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens, MFA support
- **Testing**: Jest, fast-check (Property-Based Testing)
- **Code Quality**: ESLint, Prettier
- **Caching**: Redis
- **Background Jobs**: Bull Queue
- **Logging**: Winston

## Project Structure

```
src/
├── config/           # Environment and database configuration
├── domains/          # Domain-driven design structure
│   ├── auth/         # Authentication & authorization
│   ├── employees/    # Employee management
│   ├── attendance/   # Time tracking
│   ├── leave/        # Leave management
│   ├── payroll/      # Payroll processing
│   ├── performance/  # Performance management
│   ├── documents/    # Document management
│   └── notifications/# Notification system
├── shared/           # Shared utilities and types
│   ├── middleware/   # Express middleware
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
└── server.ts         # Application entry point

tests/
├── fixtures/         # Test data fixtures
├── property/         # Property-based tests
└── utils/            # Test utilities and generators
```

## Getting Started

### Prerequisites

- Node.js (>= 18.0.0)
- MongoDB (>= 4.4)
- Redis (>= 6.0)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd enterprise-hrms
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB and Redis services

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

### Testing

The project uses a dual testing approach:

- **Unit Tests**: Specific examples and edge cases
- **Property-Based Tests**: Universal properties using fast-check

Property-based tests are configured to run 100 iterations minimum and are tagged with the format:
```
Feature: enterprise-hrms, Property {number}: {property_text}
```

### Environment Variables

Key environment variables (see `.env.example` for complete list):

- `NODE_ENV`: Environment (development/production/test)
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `REDIS_URL`: Redis connection URL

## Architecture

The application follows Domain-Driven Design principles with:

- **Bounded Contexts**: Clear domain separation
- **CQRS Pattern**: Command/Query separation where appropriate
- **Event-Driven Architecture**: Domain events for cross-domain communication
- **Layered Architecture**: Controller → Service → Repository pattern

## Security

- JWT-based authentication with refresh token rotation
- Role-Based Access Control (RBAC)
- Multi-Factor Authentication (MFA) support
- Data encryption at rest and in transit
- Comprehensive audit logging
- Rate limiting and security headers

## API Documentation

API documentation will be available at `/api/docs` when the server is running (Swagger/OpenAPI).

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new functionality
3. Ensure all tests pass before submitting
4. Update documentation as needed

## License

MIT License - see LICENSE file for details