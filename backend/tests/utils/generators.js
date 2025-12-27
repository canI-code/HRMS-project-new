"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidEmailArbitrary = exports.validEmailArbitrary = exports.nonEmptyStringArbitrary = exports.salaryStructureArbitrary = exports.leaveRequestArbitrary = exports.attendanceRecordArbitrary = exports.employeeArbitrary = exports.professionalInfoArbitrary = exports.personalInfoArbitrary = exports.userArbitrary = exports.dateRangeArbitrary = exports.futureDateArbitrary = exports.pastDateArbitrary = exports.statusArbitrary = exports.userRoleArbitrary = exports.passwordArbitrary = exports.phoneArbitrary = exports.emailArbitrary = exports.objectIdArbitrary = void 0;
const fc = __importStar(require("fast-check"));
const mongoose_1 = require("mongoose");
const common_1 = require("@/shared/types/common");
const objectIdArbitrary = () => fc.hexaString({ minLength: 24, maxLength: 24 }).map(hex => new mongoose_1.Types.ObjectId(hex));
exports.objectIdArbitrary = objectIdArbitrary;
const emailArbitrary = () => fc.tuple(fc.stringOf(fc.char().filter(c => /[a-zA-Z0-9]/.test(c)), { minLength: 1, maxLength: 20 }), fc.constantFrom('gmail.com', 'yahoo.com', 'outlook.com', 'company.com')).map(([local, domain]) => `${local}@${domain}`);
exports.emailArbitrary = emailArbitrary;
const phoneArbitrary = () => fc.tuple(fc.constantFrom('+1', '+44', '+91', '+86'), fc.stringOf(fc.char().filter(c => /[0-9]/.test(c)), { minLength: 10, maxLength: 10 })).map(([code, number]) => `${code}${number}`);
exports.phoneArbitrary = phoneArbitrary;
const passwordArbitrary = () => fc.stringOf(fc.char().filter(c => /[a-zA-Z0-9!@#$%^&*]/.test(c)), { minLength: 8, maxLength: 50 });
exports.passwordArbitrary = passwordArbitrary;
const userRoleArbitrary = () => fc.constantFrom(...Object.values(common_1.UserRole));
exports.userRoleArbitrary = userRoleArbitrary;
const statusArbitrary = () => fc.constantFrom(...Object.values(common_1.Status));
exports.statusArbitrary = statusArbitrary;
const pastDateArbitrary = () => fc.date({ max: new Date() });
exports.pastDateArbitrary = pastDateArbitrary;
const futureDateArbitrary = () => fc.date({ min: new Date() });
exports.futureDateArbitrary = futureDateArbitrary;
const dateRangeArbitrary = () => fc.tuple((0, exports.pastDateArbitrary)(), (0, exports.futureDateArbitrary)())
    .filter(([start, end]) => start < end)
    .map(([start, end]) => ({ start, end }));
exports.dateRangeArbitrary = dateRangeArbitrary;
const userArbitrary = () => fc.record({
    _id: (0, exports.objectIdArbitrary)(),
    organizationId: (0, exports.objectIdArbitrary)(),
    email: (0, exports.emailArbitrary)(),
    role: (0, exports.userRoleArbitrary)(),
    isActive: fc.boolean(),
    createdAt: (0, exports.pastDateArbitrary)(),
    updatedAt: (0, exports.pastDateArbitrary)(),
});
exports.userArbitrary = userArbitrary;
const personalInfoArbitrary = () => fc.record({
    firstName: fc.string({ minLength: 1, maxLength: 50 }),
    lastName: fc.string({ minLength: 1, maxLength: 50 }),
    email: (0, exports.emailArbitrary)(),
    phone: (0, exports.phoneArbitrary)(),
    dateOfBirth: (0, exports.pastDateArbitrary)(),
    address: fc.record({
        street: fc.string({ minLength: 1, maxLength: 100 }),
        city: fc.string({ minLength: 1, maxLength: 50 }),
        state: fc.string({ minLength: 1, maxLength: 50 }),
        zipCode: fc.string({ minLength: 5, maxLength: 10 }),
        country: fc.string({ minLength: 1, maxLength: 50 }),
    }),
});
exports.personalInfoArbitrary = personalInfoArbitrary;
const professionalInfoArbitrary = () => fc.record({
    designation: fc.string({ minLength: 1, maxLength: 100 }),
    department: fc.string({ minLength: 1, maxLength: 50 }),
    joiningDate: (0, exports.pastDateArbitrary)(),
    employmentType: fc.constantFrom('full-time', 'part-time', 'contract', 'intern'),
    workLocation: fc.constantFrom('office', 'remote', 'hybrid'),
});
exports.professionalInfoArbitrary = professionalInfoArbitrary;
const employeeArbitrary = () => fc.record({
    _id: (0, exports.objectIdArbitrary)(),
    organizationId: (0, exports.objectIdArbitrary)(),
    employeeId: fc.string({ minLength: 3, maxLength: 20 }),
    userId: (0, exports.objectIdArbitrary)(),
    personalInfo: (0, exports.personalInfoArbitrary)(),
    professionalInfo: (0, exports.professionalInfoArbitrary)(),
    reportingStructure: fc.record({
        managerId: (0, exports.objectIdArbitrary)(),
        secondaryManagerId: fc.option((0, exports.objectIdArbitrary)()),
        hrPartnerId: fc.option((0, exports.objectIdArbitrary)()),
    }),
    status: fc.constantFrom('active', 'inactive', 'terminated'),
    createdAt: (0, exports.pastDateArbitrary)(),
    updatedAt: (0, exports.pastDateArbitrary)(),
});
exports.employeeArbitrary = employeeArbitrary;
const attendanceRecordArbitrary = () => fc.record({
    _id: (0, exports.objectIdArbitrary)(),
    organizationId: (0, exports.objectIdArbitrary)(),
    employeeId: (0, exports.objectIdArbitrary)(),
    date: (0, exports.pastDateArbitrary)(),
    checkIn: (0, exports.pastDateArbitrary)(),
    checkOut: fc.option((0, exports.futureDateArbitrary)()),
    breakDuration: fc.integer({ min: 0, max: 120 }),
    totalHours: fc.float({ min: 0, max: 24, noNaN: true }),
    overtimeHours: fc.float({ min: 0, max: 8, noNaN: true }),
    status: fc.constantFrom('present', 'absent', 'late', 'half-day'),
    createdAt: (0, exports.pastDateArbitrary)(),
    updatedAt: (0, exports.pastDateArbitrary)(),
});
exports.attendanceRecordArbitrary = attendanceRecordArbitrary;
const leaveRequestArbitrary = () => fc.record({
    _id: (0, exports.objectIdArbitrary)(),
    organizationId: (0, exports.objectIdArbitrary)(),
    employeeId: (0, exports.objectIdArbitrary)(),
    leaveTypeId: (0, exports.objectIdArbitrary)(),
    startDate: (0, exports.futureDateArbitrary)(),
    endDate: (0, exports.futureDateArbitrary)(),
    totalDays: fc.integer({ min: 1, max: 30 }),
    reason: fc.string({ minLength: 10, maxLength: 500 }),
    status: fc.constantFrom('pending', 'approved', 'rejected', 'cancelled'),
    createdAt: (0, exports.pastDateArbitrary)(),
    updatedAt: (0, exports.pastDateArbitrary)(),
});
exports.leaveRequestArbitrary = leaveRequestArbitrary;
const salaryStructureArbitrary = () => fc.record({
    _id: (0, exports.objectIdArbitrary)(),
    organizationId: (0, exports.objectIdArbitrary)(),
    employeeId: (0, exports.objectIdArbitrary)(),
    effectiveFrom: (0, exports.pastDateArbitrary)(),
    effectiveTo: fc.option((0, exports.futureDateArbitrary)()),
    basicSalary: fc.float({ min: 1000, max: 100000, noNaN: true }),
    allowances: fc.array(fc.record({
        type: fc.string({ minLength: 1, maxLength: 50 }),
        amount: fc.float({ min: 0, max: 10000, noNaN: true }),
        isPercentage: fc.boolean(),
    }), { maxLength: 10 }),
    deductions: fc.array(fc.record({
        type: fc.string({ minLength: 1, maxLength: 50 }),
        amount: fc.float({ min: 0, max: 5000, noNaN: true }),
        isPercentage: fc.boolean(),
    }), { maxLength: 10 }),
    grossSalary: fc.float({ min: 1000, max: 150000, noNaN: true }),
    createdAt: (0, exports.pastDateArbitrary)(),
    updatedAt: (0, exports.pastDateArbitrary)(),
});
exports.salaryStructureArbitrary = salaryStructureArbitrary;
const nonEmptyStringArbitrary = (maxLength = 100) => fc.string({ minLength: 1, maxLength });
exports.nonEmptyStringArbitrary = nonEmptyStringArbitrary;
const validEmailArbitrary = () => (0, exports.emailArbitrary)();
exports.validEmailArbitrary = validEmailArbitrary;
const invalidEmailArbitrary = () => fc.oneof(fc.string().filter(s => !s.includes('@')), fc.string().filter(s => s.includes('@') && !s.includes('.')), fc.constant(''), fc.constant('@'), fc.constant('test@'), fc.constant('@test.com'));
exports.invalidEmailArbitrary = invalidEmailArbitrary;
//# sourceMappingURL=generators.js.map