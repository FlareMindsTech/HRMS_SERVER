import Attendance from '../Modules/AttendanceModule.js';

// Helper to calculate total working minutes
const calculateMinutes = (loginTime, logoutTime) => {
    if (!loginTime || !logoutTime) return 0;
    const diffMs = new Date(logoutTime) - new Date(loginTime);
    return Math.floor(diffMs / (1000 * 60));
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
