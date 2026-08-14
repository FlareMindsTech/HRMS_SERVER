import express from 'express';
import {
  getAllAttendance,
  getAttendanceByUser,
  getAttendanceByMonth,
  updateAttendanceCorrection,
  deleteAttendance
} from '../Controller/AttendanceController.js';
import { Authentication, checkMenuAccess } from '../Middleware/Auth.js';

const router = express.Router();

router.use(Authentication);

// User attendance queries
router.get('/user/:userId', getAttendanceByUser);
router.get('/user/:userId/:month/:year', getAttendanceByMonth);

// Admin attendance management (Requires ATTENDANCE menu permission mapping)
router.get('/all', checkMenuAccess("ATTENDANCE"), getAllAttendance);
router.put('/correction/:id', checkMenuAccess("ATTENDANCE"), updateAttendanceCorrection);
router.delete('/delete/:id', checkMenuAccess("ATTENDANCE"), deleteAttendance);

export default router;