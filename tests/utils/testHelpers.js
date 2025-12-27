"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectValidationError = exports.delay = exports.createTestEmployee = exports.createTestOrganization = exports.createTestToken = exports.createTestUser = void 0;
const mongoose_1 = require("mongoose");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("@/config/environment");
const common_1 = require("@/shared/types/common");
const createTestUser = (overrides = {}) => {
    return {
        _id: new mongoose_1.Types.ObjectId(),
        email: 'test@example.com',
        role: common_1.UserRole.EMPLOYEE,
        organizationId: new mongoose_1.Types.ObjectId(),
        ...overrides,
    };
};
exports.createTestUser = createTestUser;
const createTestToken = (user) => {
    return jsonwebtoken_1.default.sign({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organizationId.toString(),
    }, environment_1.config.jwtSecret, { expiresIn: environment_1.config.jwtExpiresIn });
};
exports.createTestToken = createTestToken;
const createTestOrganization = () => {
    return {
        _id: new mongoose_1.Types.ObjectId(),
        name: 'Test Organization',
        domain: 'test.com',
        settings: {
            timezone: 'UTC',
            dateFormat: 'YYYY-MM-DD',
            currency: 'USD',
            workingDays: [1, 2, 3, 4, 5],
            workingHours: { start: '09:00', end: '17:00' },
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};
exports.createTestOrganization = createTestOrganization;
const createTestEmployee = (organizationId, overrides = {}) => {
    return {
        _id: new mongoose_1.Types.ObjectId(),
        organizationId,
        employeeId: 'EMP001',
        userId: new mongoose_1.Types.ObjectId(),
        personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@test.com',
            phone: '+1234567890',
            dateOfBirth: new Date('1990-01-01'),
            address: {
                street: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                zipCode: '12345',
                country: 'Test Country',
            },
        },
        professionalInfo: {
            designation: 'Software Engineer',
            department: 'Engineering',
            joiningDate: new Date(),
            employmentType: 'full-time',
            workLocation: 'office',
        },
        reportingStructure: {
            managerId: new mongoose_1.Types.ObjectId(),
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
};
exports.createTestEmployee = createTestEmployee;
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.delay = delay;
const expectValidationError = (error, field) => {
    expect(error).toHaveProperty('name', 'ValidationError');
    if (field) {
        expect(error).toHaveProperty('errors');
        expect(error.errors).toHaveProperty(field);
    }
};
exports.expectValidationError = expectValidationError;
//# sourceMappingURL=testHelpers.js.map