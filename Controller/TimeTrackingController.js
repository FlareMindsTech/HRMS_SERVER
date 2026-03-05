import TimeTracking from "../Modules/TimeTrackingModule.js";
import Task from "../Modules/TaskModule.js";

export const addTimeTracking = async (req, res) => {
    try {
        const { taskId, date, startTime, endTime, description } = req.body;
        const userId = req.user.id;

        let durationMinutes = 0;
        if (startTime && endTime) {
            const start = new Date(`1970-01-01T${startTime}:00`);
            const end = new Date(`1970-01-01T${endTime}:00`);
            durationMinutes = Math.round((end - start) / 60000);
            if (durationMinutes < 0) durationMinutes += 24 * 60; 
        }

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        const newTimeRecord = new TimeTracking({
            taskId,
            userId,
            date,
            startTime,
            endTime,
            durationMinutes,
            description,
        });

        await newTimeRecord.save();

        return res.status(201).json({
            success: true,
            message: "Time track saved successfully",
            data: newTimeRecord,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getTimeTracksByTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const tracks = await TimeTracking.find({ taskId }).populate("userId", "firstName lastName");

        return res.status(200).json({ success: true, data: tracks });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
