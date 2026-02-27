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

        // Accurate month range logic
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        // Last day of the month
        const lastDay = new Date(year, parseInt(month), 0).getDate();
        const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

        const attendance = await Attendance.find({
            userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        res.status(200).json({ data: attendance });
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
