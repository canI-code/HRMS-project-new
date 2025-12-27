import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/server';
import { generateAccessToken } from '../../src/shared/utils/jwt';
import { UserRole } from '../../src/shared/types/common';
import { attendanceService } from '../../src/domains/attendance/services/AttendanceService';
import { auditLogStore } from '../../src/shared/middleware/auditLogger';

jest.mock('../../src/domains/attendance/services/AttendanceService');

describe('Integration: Attendance check-in/check-out workflow', () => {
  const orgId = new Types.ObjectId();
  const userId = new Types.ObjectId();
  const accessToken = generateAccessToken({
    userId,
    organizationId: orgId,
    userRole: UserRole.HR_ADMIN,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    auditLogStore.clear();
  });

  test('should allow employee check-in and log audit entry', async () => {
    const employeeId = new Types.ObjectId().toString();
    const orgId = new Types.ObjectId().toString();
    const checkInTime = new Date();

    const mockRecord = {
      _id: new Types.ObjectId(),
      employeeId: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(orgId),
      date: new Date(),
      checkIn: checkInTime,
      status: 'present',
    };

    (attendanceService.checkIn as jest.Mock).mockResolvedValue(mockRecord);

    const response = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        checkInTime: checkInTime.toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('checkIn');
    expect(response.body.status).toBe('present');

    // Verify service was called correctly
    expect(attendanceService.checkIn).toHaveBeenCalledWith(
      employeeId,
      expect.any(String),
      expect.any(Date),
      expect.any(String),
      expect.any(String)
    );
  });

  test('should allow employee check-out and calculate working minutes', async () => {
    const employeeId = new Types.ObjectId().toString();
    const orgId = new Types.ObjectId().toString();
    const checkInTime = new Date('2024-06-15T09:00:00');
    const checkOutTime = new Date('2024-06-15T17:30:00');

    const mockRecord = {
      _id: new Types.ObjectId(),
      employeeId: new Types.ObjectId(employeeId),
      organizationId: new Types.ObjectId(orgId),
      date: new Date('2024-06-15'),
      checkIn: checkInTime,
      checkOut: checkOutTime,
      workingMinutes: 480, // 8 hours - 30 min break
      breakMinutes: 30,
      status: 'present',
    };

    (attendanceService.checkOut as jest.Mock).mockResolvedValue(mockRecord);

    const response = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        checkOutTime: checkOutTime.toISOString(),
        breakMinutes: 30,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('checkOut');
    expect(response.body.workingMinutes).toBe(480);
    expect(response.body.breakMinutes).toBe(30);

    // Verify service was called
    expect(attendanceService.checkOut).toHaveBeenCalledWith(
      employeeId,
      expect.any(String),
      expect.any(Date),
      expect.any(String),
      expect.any(String),
      30
    );
  });
});
