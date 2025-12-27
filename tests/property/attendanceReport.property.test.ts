import fc from 'fast-check';
import { AttendanceModel } from '../../src/domains/attendance/models/Attendance';
import { attendanceService } from '../../src/domains/attendance/services/AttendanceService';
import { Types } from 'mongoose';

jest.mock('@/domains/attendance/models/Attendance');

describe('Monthly Attendance Report Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Property 13: Monthly report completeness and accuracy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 30 }), // days in month
        fc.array(
          fc.record({
            status: fc.constantFrom(
              'present',
              'absent',
              'late',
              'half-day',
              'on-leave'
            ),
            workingMinutes: fc.integer({ min: 0, max: 600 }),
            overtimeMinutes: fc.integer({ min: 0, max: 120 }),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        async (totalDays, attendanceData) => {
          const orgId = new Types.ObjectId().toString();
          const empId = new Types.ObjectId().toString();

          // Create mock records
          const mockRecords = attendanceData.slice(0, totalDays).map((data, i) => ({
            _id: new Types.ObjectId(),
            employeeId: new Types.ObjectId(empId),
            organizationId: new Types.ObjectId(orgId),
            date: new Date(2024, 5, i + 1),
            status: data.status,
            workingMinutes: data.workingMinutes,
            overtimeMinutes: data.overtimeMinutes,
          }));

          (AttendanceModel.find as jest.Mock).mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockRecords),
          });

          const result = await attendanceService.getMonthlyAttendance(
            empId,
            orgId,
            2024,
            6
          );

          // Verify completeness
          expect(result.records).toHaveLength(mockRecords.length);
          expect(result.summary.totalDays).toBe(mockRecords.length);

          // Verify summary calculations
          const expectedPresent = mockRecords.filter(
            (r) => r.status === 'present'
          ).length;
          const expectedAbsent = mockRecords.filter(
            (r) => r.status === 'absent'
          ).length;
          const expectedLate = mockRecords.filter(
            (r) => r.status === 'late'
          ).length;
          const expectedHalfDay = mockRecords.filter(
            (r) => r.status === 'half-day'
          ).length;

          expect(result.summary.presentDays).toBe(expectedPresent);
          expect(result.summary.absentDays).toBe(expectedAbsent);
          expect(result.summary.lateDays).toBe(expectedLate);
          expect(result.summary.halfDays).toBe(expectedHalfDay);

          // Verify working minutes sum
          const expectedWorkingMinutes = mockRecords.reduce(
            (sum, r) => sum + (r.workingMinutes || 0),
            0
          );
          expect(result.summary.totalWorkingMinutes).toBe(
            expectedWorkingMinutes
          );

          // Verify overtime minutes sum
          const expectedOvertimeMinutes = mockRecords.reduce(
            (sum, r) => sum + (r.overtimeMinutes || 0),
            0
          );
          expect(result.summary.totalOvertimeMinutes).toBe(
            expectedOvertimeMinutes
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});
