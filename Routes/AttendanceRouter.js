import express from 'express';
import {
  punchIn,
  punchOut,
  getTodayAttendance,
  getAllAttendance,
  getAttendanceByUser,
  getAttendanceByMonth,
  updateAttendanceCorrection,
  deleteAttendance,
} from '../Controller/AttendanceController.js';
import {
  Authentication,
  requirePermission,
  requireOwnershipOrPermission,
} from '../Middleware/Auth.js';

const router = express.Router();

router.use(Authentication);

// ── Employee Attendance Punch Actions ──
router.post('/punch-in', requirePermission('attendance.punch_in'), punchIn);
router.post('/punch-out', requirePermission('attendance.punch_out'), punchOut);
router.get('/today', requirePermission('attendance.read.own'), getTodayAttendance);

// ── User Attendance Queries (Protected against IDOR) ──
router.get(
  '/user/:userId',
  requireOwnershipOrPermission('userId', 'attendance.read.own', 'attendance.read.all'),
  getAttendanceByUser
);
router.get(
  '/user/:userId/:month/:year',
  requireOwnershipOrPermission('userId', 'attendance.read.own', 'attendance.read.all'),
  getAttendanceByMonth
);

// ── Admin Attendance Management ──
router.get('/all', requirePermission('attendance.read.all'), getAllAttendance);
router.put('/correction/:id', requirePermission('attendance.correct'), updateAttendanceCorrection);
router.delete('/delete/:id', requirePermission('attendance.delete'), deleteAttendance);

export default router;