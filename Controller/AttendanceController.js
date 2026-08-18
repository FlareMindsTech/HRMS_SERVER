import Attendance from '../Modules/AttendanceModule.js';
import User from '../Modules/UserModule.js';

// Helper to calculate total working minutes
const calculateMinutes = (loginTime, logoutTime) => {
    if (!loginTime || !logoutTime) return 0;
    const diffMs = new Date(logoutTime) - new Date(loginTime);
    return Math.floor(diffMs / (1000 * 60));
};

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    if (
        !Number.isFinite(lat1) ||
        !Number.isFinite(lon1) ||
        !Number.isFinite(lat2) ||
        !Number.isFinite(lon2)
    ) {
        return null;
    }

    const R = 6371000;
    const rad = Math.PI / 180;

    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;

    const a = Math.min(
        1,
        Math.max(
            0,
            Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * rad) *
                    Math.cos(lat2 * rad) *
                    Math.sin(dLon / 2) ** 2
        )
    );

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
};

// ======================================================
// PUNCH IN
// ======================================================
export const punchIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const dateString = getTodayString();

        // 1. Check if user already punched in today
        const existingAttendance = await Attendance.findOne({
            userId,
            date: dateString,
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: "You have already punched in for today",
                data: existingAttendance,
            });
        }

        // 2. Fetch User to verify account and WFH permission
        const user = await User.findById(userId).select("wfh isActive isBlocked").lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isBlocked || !user.isActive) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive or blocked",
            });
        }

        // 3. Location / Geofencing / WFH Validation
        const { latitude, longitude } = req.body;
        const userLatitude = Number(latitude);
        const userLongitude = Number(longitude);

        const hasValidLocation =
            Number.isFinite(userLatitude) &&
            Number.isFinite(userLongitude) &&
            userLatitude >= -90 &&
            userLatitude <= 90 &&
            userLongitude >= -180 &&
            userLongitude <= 180;

        if (!hasValidLocation) {
            return res.status(400).json({
                success: false,
                message: "Valid latitude and longitude are required for punch in",
            });
        }

        const officeLatitude = Number(process.env.OFFICE_LATITUDE);
        const officeLongitude = Number(process.env.OFFICE_LONGITUDE);
        const officeRadius = Number(process.env.OFFICE_RADIUS_METERS || 200);

        if (
            !Number.isFinite(officeLatitude) ||
            !Number.isFinite(officeLongitude) ||
            !Number.isFinite(officeRadius) ||
            officeRadius <= 0
        ) {
            console.error("Invalid office location configuration");
            return res.status(500).json({
                success: false,
                message: "Office location is not configured correctly",
            });
        }

        const distance = getDistanceInMeters(
            userLatitude,
            userLongitude,
            officeLatitude,
            officeLongitude
        );

        if (distance === null) {
            return res.status(400).json({
                success: false,
                message: "Unable to calculate distance from office",
            });
        }

        const isAtOffice = distance <= officeRadius;
        let locationType;

        if (isAtOffice) {
            locationType = "Office";
        } else {
            locationType = "WFH";
            if (user.wfh?.isApproved !== true) {
                return res.status(403).json({
                    success: false,
                    message: "You are outside the office location and do not have WFH approval",
                    locationType: "WFH",
                    distance: Math.round(distance),
                    allowedRadius: officeRadius,
                });
            }
        }

        // 4. Create today's attendance record
        const attendance = await Attendance.create({
            userId,
            date: dateString,
            loginTime: now,
            logoutTime: null,
            totalWorkingMinutes: 0,
            totalHours: 0,
            locationType,
            status: "Present",
            isLate: false,
        });

        return res.status(201).json({
            success: true,
            message: "Punched in successfully",
            data: attendance,
            location: {
                type: locationType,
                distanceFromOffice: Math.round(distance),
                allowedRadius: officeRadius,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You have already punched in for today",
            });
        }
        console.error("Punch In Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to punch in",
        });
    }
};

// ======================================================
// PUNCH OUT
// ======================================================
export const punchOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const dateString = getTodayString();

        // 1. Find today's attendance record
        const attendance = await Attendance.findOne({
            userId,
            date: dateString,
        });

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: "No punch in record found for today. You must punch in first.",
            });
        }

        // 2. Prevent duplicate punch out
        if (attendance.logoutTime) {
            return res.status(400).json({
                success: false,
                message: "Already punched out for today",
                data: attendance,
            });
        }

        // 3. Calculate total working minutes & status using locked policy
        const totalMinutes = calculateMinutes(attendance.loginTime, now);
        const totalHours = parseFloat((totalMinutes / 60).toFixed(2));

        let status = "Absent";
        if (totalMinutes >= 510) {
            status = "Present";
        } else if (totalMinutes >= 240) {
            status = "Half Day";
        } else {
            status = "Absent";
        }

        attendance.logoutTime = now;
        attendance.totalWorkingMinutes = totalMinutes;
        attendance.totalHours = totalHours;
        attendance.status = status;

        await attendance.save();

        return res.status(200).json({
            success: true,
            message: "Punched out successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Punch Out Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to punch out",
        });
    }
};

// ======================================================
// GET TODAY'S ATTENDANCE STATUS
// ======================================================
export const getTodayAttendance = async (req, res) => {
    try {
        const userId = req.user.id;
        const dateString = getTodayString();

        const attendance = await Attendance.findOne({
            userId,
            date: dateString,
        });

        return res.status(200).json({
            success: true,
            data: attendance || null,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// HR/Admin manual attendance correction (Correction only, not creation)
export const updateAttendanceCorrection = async (req, res) => {
    try {
        const { id } = req.params;
        const { loginTime, logoutTime, status, locationType, isLate } = req.body;

        const attendance = await Attendance.findById(id);
        if (!attendance) return res.status(404).json({ message: "Attendance record not found" });

        if (loginTime) attendance.loginTime = loginTime;
        if (logoutTime) {
            attendance.logoutTime = logoutTime;
            const totalMinutes = calculateMinutes(attendance.loginTime, logoutTime);
            attendance.totalWorkingMinutes = totalMinutes;
            attendance.totalHours = parseFloat((totalMinutes / 60).toFixed(2));

            // Auto-calculate status based on company policy if not manually provided
            if (!status) {
                if (totalMinutes >= 510) { // 8.5 hours = 510 minutes
                    attendance.status = 'Present';
                } else if (totalMinutes >= 240) { // 4 hours = 240 minutes
                    attendance.status = 'Half Day';
                } else {
                    attendance.status = 'Absent';
                }
            }
        }

        if (status) attendance.status = status;
        if (locationType) attendance.locationType = locationType;
        if (isLate !== undefined) attendance.isLate = isLate;

        await attendance.save();
        res.status(200).json({ message: "Attendance corrected successfully", data: attendance });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAttendanceByUser = async (req, res) => {
    try {
        const attendance = await Attendance.find({ userId: req.params.userId }).sort({ date: -1 });
        res.status(200).json({ data: attendance });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAttendanceByMonth = async (req, res) => {
    try {
        const { userId, month, year } = req.params;
        const normalizedMonth = month.padStart(2, '0');

        // Accurate month range logic
        const startDateString = `${year}-${normalizedMonth}-01`;
        const lastDay = new Date(year, parseInt(month), 0).getDate();
        const endDateString = `${year}-${normalizedMonth}-${lastDay.toString().padStart(2, '0')}`;

        const startMonthDate = new Date(`${year}-${normalizedMonth}-01T00:00:00Z`);
        const endMonthDate = new Date(year, parseInt(month), 0, 23, 59, 59, 999);

        // 1. Fetch Attendance Records
        const attendance = await Attendance.find({
            userId,
            date: { $gte: startDateString, $lte: endDateString }
        }).sort({ date: 1 });

        // 2. Fetch Approved Leaves for the user that overlap with this month
        const Leave = (await import('../Modules/LeaveModule.js')).default;
        const leaves = await Leave.find({
            employeeId: userId,
            status: "Approved",
            $or: [
                { startDate: { $lte: endMonthDate }, endDate: { $gte: startMonthDate } }
            ]
        });

        // 3. Construct a unified list for EVERY day of the month
        const attendanceMap = {};
        attendance.forEach(a => {
            attendanceMap[a.date] = a.toObject();
        });

        leaves.forEach(leave => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (d.getUTCFullYear() === parseInt(year) && (d.getUTCMonth() + 1) === parseInt(month)) {
                    const dateStr = d.toISOString().split('T')[0];
                    if (!attendanceMap[dateStr]) {
                        attendanceMap[dateStr] = {
                            userId,
                            date: dateStr,
                            status: "Leave",
                            leaveType: leave.leaveType,
                            isLeave: true
                        };
                    }
                }
            }
        });

        // 4. Fill in gaps for Every Day of the month
        const finalResult = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= lastDay; day++) {
            const dateStr = `${year}-${normalizedMonth}-${day.toString().padStart(2, '0')}`;
            // Use T00:00:00Z to avoid timezone shifts during getUTCDay
            const currentLoopDate = new Date(`${dateStr}T00:00:00Z`);

            if (attendanceMap[dateStr]) {
                finalResult.push(attendanceMap[dateStr]);
            } else {
                const dayOfWeek = currentLoopDate.getUTCDay(); // 0=Sun, 6=Sat
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

                let status = "Absent";
                if (isWeekend) {
                    status = "Weekend";
                } else if (currentLoopDate > today) {
                    status = "Future";
                }

                finalResult.push({
                    userId,
                    date: dateStr,
                    status: status,
                    isGenerated: true
                });
            }
        }

        res.status(200).json({ data: finalResult });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAllAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find().populate('userId', 'firstName lastName email').sort({ date: -1 });
        res.status(200).json({ data: attendance });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await Attendance.findByIdAndDelete(id);
        if (!attendance) return res.status(404).json({ message: "Attendance record not found" });
        res.status(200).json({ message: "Attendance deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
