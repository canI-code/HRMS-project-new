import fc from 'fast-check';
import { AttendanceModel } from '../../src/domains/attendance/models/Attendance';
import { AttendancePolicyModel } from '../../src/domains/attendance/models/AttendancePolicy';
import { attendanceService } from '../../src/domains/attendance/services/AttendanceService';
import { Types } from 'mongoose';
import { auditLogStore } from '../../src/shared/middleware/auditLogger';

jest.mock('@/domains/attendance/models/Attendance');
jest.mock('@/domains/attendance/models/AttendancePolicy');

describe('Attendance Calculation Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auditLogStore.clear();
  });

  test('Property 11: working minutes calculated correctly from check-in/check-out', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        fc.integer({ min: 0, max: 600 }), // minutes after check-in
        fc.integer({ min: 0, max: 60 }), // break minutes
        async (checkInTime, additionalMinutes, breakMinutes) => {
          const checkOutTime = new Date(
            checkInTime.getTime() + additionalMinutes * 60 * 1000
          );

          const orgId = new Types.ObjectId().toString();
          const empId = new Types.ObjectId().toString();
          const recordId = new Types.ObjectId();
          const userId = new Types.ObjectId().toString();

          const mockRecord = {
            _id: recordId,
            employeeId: new Types.ObjectId(empId),
            organizationId: new Types.ObjectId(orgId),
            date: new Date(checkInTime),
            checkIn: checkInTime,
            checkOut: undefined,
            status: 'present',
            breakMinutes: 0,
            workingMinutes: undefined,
            save: jest.fn().mockResolvedValue(true),
          };

          (AttendanceModel.findOne as jest.Mock).mockResolvedValueOnce(
            mockRecord
          );
          (AttendancePolicyModel.findOne as jest.Mock).mockResolvedValue(null);

          await attendanceService.checkOut(
            empId,
            orgId,
            checkOutTime,
            userId,
            'test-request',
            breakMinutes
          );

          expect(mockRecord.save).toHaveBeenCalled();
          
          // Verify working minutes calculation
          const expectedWorkingMinutes = Math.max(
            0,
            additionalMinutes - breakMinutes
          );
          expect(mockRecord.workingMinutes).toBe(expectedWorkingMinutes);
          expect(mockRecord.breakMinutes).toBe(breakMinutes);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 12: Policy application for late arrival and overtime', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 480, max: 600 }), // working minutes (8-10 hours)
        fc.integer({ min: 0, max: 120 }), // overtime threshold
        async (workingMinutes, overtimeThreshold) => {
          const orgId = new Types.ObjectId().toString();
          const empId = new Types.ObjectId().toString();
          const userId = new Types.ObjectId().toString();

          const checkIn = new Date('2024-06-15T09:00:00');
          const checkOut = new Date(
            checkIn.getTime() + workingMinutes * 60 * 1000
          );

          const policy = {
            organizationId: new Types.ObjectId(orgId),
            standardWorkingMinutes: 480,
            halfDayThresholdMinutes: 240,
            lateArrivalGraceMinutes: 15,
            lateArrivalThresholdMinutes: 30,
            overtimeStartsAfterMinutes: 480 + overtimeThreshold,
            isActive: true,
          };

          const recordId = new Types.ObjectId();
          const mockRecord = {
            _id: recordId,
            employeeId: new Types.ObjectId(empId),
            organizationId: new Types.ObjectId(orgId),
            date: new Date('2024-06-15'),
            checkIn,
            checkOut: undefined,
            status: 'present',
            breakMinutes: 0,
            workingMinutes: undefined,
            overtimeMinutes: 0,
            save: jest.fn().mockResolvedValue(true),
          };

          (AttendanceModel.findOne as jest.Mock).mockResolvedValue(mockRecord);
          (AttendancePolicyModel.findOne as jest.Mock).mockResolvedValue(
            policy
          );

          await attendanceService.checkOut(
            empId,
            orgId,
            checkOut,
            userId,
            'test-request',
            0
          );

          expect(mockRecord.save).toHaveBeenCalled();
          expect(mockRecord.workingMinutes).toBe(workingMinutes);

          // Verify overtime calculation based on policy
          if (workingMinutes > policy.overtimeStartsAfterMinutes) {
            const expectedOvertime =
              workingMinutes - policy.overtimeStartsAfterMinutes;
            expect(mockRecord.overtimeMinutes).toBe(expectedOvertime);
          } else {
            expect(mockRecord.overtimeMinutes).toBe(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
