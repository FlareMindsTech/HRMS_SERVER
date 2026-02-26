import Leave from "../Modules/LeaveModule.js";

export const applyLeave = async (req, res) => {
    try {
        const {
            leaveType,
            startDate,
            endDate,
            totalDays,
            isHalfDay,
            title,
            reason
        } = req.body;

        const employeeId = req.body.employeeId || req.user.id;

        if (!employeeId || !leaveType || !startDate || !endDate || !totalDays || !reason) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return res.status(400).json({ message: "Start date cannot be after end date" });
        }

        const overlappingLeave = await Leave.findOne({
            employeeId,
            status: { $in: ["Pending", "Approved"] },
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });

        if (overlappingLeave) {
            return res.status(400).json({
                message: "You have already applied for or have an approved leave during this period."
            });
        }

        const leave = await Leave.create({
            employeeId,
            leaveType,
            startDate: start,
            endDate: end,
            totalDays,
            isHalfDay,
            title,
            reason
        });

        res.status(201).json({
            message: "Leave applied successfully",
            data: leave
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const updateLeaveStatus = async (req, res) => {
    try {
        const { status, approvedBy, currentBalance } = req.body;

        if (!["Approved", "Rejected", "Cancelled"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: "Leave not found" });
        }

        if (status === "Approved") {
            if (currentBalance === undefined) {
                return res.status(400).json({ message: "Current balance is required to approve leave" });
            }
            leave.balanceBefore = currentBalance;
            leave.balanceAfter = currentBalance - leave.totalDays;
            leave.approvedAt = new Date();
        }

        leave.status = status;
        leave.approvedBy = approvedBy;

        await leave.save();

        res.status(200).json({
            message: `Leave ${status.toLowerCase()} successfully`,
            data: leave
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getLeavesByEmployee = async (req, res) => {
    try {
        const leaves = await Leave.find({ employeeId: req.params.employeeId })
            .sort({ createdAt: -1 });

        res.status(200).json({ data: leaves });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate("employeeId", "firstName lastName email")
            .populate("approvedBy", "firstName lastName")
            .sort({ createdAt: -1 });

        res.status(200).json({ data: leaves });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getLeaveById = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id)
            .populate("employeeId", "firstName lastName email")
            .populate("approvedBy", "firstName lastName");

        if (!leave) return res.status(404).json({ message: "Leave application not found" });

        res.status(200).json({ data: leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const cancelLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: "Leave not found" });

        if (leave.status !== "Pending") {
            return res.status(400).json({ message: "Only pending leaves can be cancelled" });
        }

        leave.status = "Cancelled";
        await leave.save();
        res.status(200).json({ message: "Leave cancelled successfully", data: leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const deleteLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: "Leave not found" });
        }

        if (leave.status !== "Pending") {
            return res.status(400).json({ message: "Only pending leave can be deleted" });
        }

        await leave.deleteOne();

        res.status(200).json({ message: "Leave deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
