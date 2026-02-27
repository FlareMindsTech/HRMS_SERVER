import express from 'express';
import {
    getAllAttendance,
    getAttendanceByUser,
    getAttendanceByMonth,
    updateAttendanceCorrection,
    deleteAttendance
} from '../Controller/AttendanceController.js';

const router = express.Router();

// No manual creation - Attendance must come from Login/Logout
router.get('/all', getAllAttendance);
router.get('/user/:userId', getAttendanceByUser);
router.get('/user/:userId/:month/:year', getAttendanceByMonth);
router.put('/correction/:id', updateAttendanceCorrection);
router.delete('/delete/:id', deleteAttendance);

export default router;