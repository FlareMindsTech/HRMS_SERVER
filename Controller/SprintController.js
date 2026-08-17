import Sprint from "../Modules/SprintModule.js";
import Project from "../Modules/ProjectModule.js";

export const createSprint = async (req, res) => {
    try {
        const { projectId, sprintName, startDate, endDate, status } = req.body;

        // Sprint validation: check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        // Sprint validation: ensure startDate is before endDate
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ success: false, message: "Start date must be before end date" });
        }

        // Sprint validation: Check overlap
        const overlappingSprint = await Sprint.findOne({
            projectId,
            $or: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
            ]
        });

        if (overlappingSprint) {
            return res.status(400).json({ success: false, message: "Sprint dates overlap with an existing sprint in this project" });
        }

        const newSprint = new Sprint({
            projectId,
            sprintName,
            startDate,
            endDate,
            status: status || "Planned",
        });

        await newSprint.save();

        return res.status(201).json({ success: true, message: "Sprint created successfully", data: newSprint });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getProjectSprints = async (req, res) => {
    try {
        const { projectId } = req.params;
        const sprints = await Sprint.find({ projectId }).sort({ startDate: 1 });
        return res.status(200).json({ success: true, data: sprints });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getSprintById = async (req, res) => {
    try {
        const { id } = req.params;
        const sprint = await Sprint.findById(id).populate("projectId", "projectName");

        if (!sprint) return res.status(404).json({ success: false, message: "Sprint not found" });

        return res.status(200).json({ success: true, data: sprint });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSprint = async (req, res) => {
    try {
        const { id } = req.params;
        const { sprintName, startDate, endDate, status } = req.body;

        const sprint = await Sprint.findById(id);
        if (!sprint) return res.status(404).json({ success: false, message: "Sprint not found" });

        const newStartDate = startDate !== undefined ? startDate : sprint.startDate;
        const newEndDate = endDate !== undefined ? endDate : sprint.endDate;

        // Sprint validation: ensure startDate is before endDate
        if (new Date(newStartDate) >= new Date(newEndDate)) {
            return res.status(400).json({ success: false, message: "Start date must be before end date" });
        }

        // Sprint validation: Check overlap (excluding this sprint itself)
        const overlappingSprint = await Sprint.findOne({
            _id: { $ne: id },
            projectId: sprint.projectId,
            $or: [
                { startDate: { $lte: newEndDate }, endDate: { $gte: newStartDate } }
            ]
        });

        if (overlappingSprint) {
            return res.status(400).json({ success: false, message: "Sprint dates overlap with an existing sprint in this project" });
        }

        if (sprintName !== undefined) sprint.sprintName = sprintName;
        if (startDate !== undefined) sprint.startDate = startDate;
        if (endDate !== undefined) sprint.endDate = endDate;
        if (status !== undefined) sprint.status = status;

        await sprint.save();

        return res.status(200).json({
            success: true,
            message: "Sprint updated successfully",
            data: sprint,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSprint = async (req, res) => {
    try {
        const { id } = req.params;

        const sprint = await Sprint.findById(id);
        if (!sprint) return res.status(404).json({ success: false, message: "Sprint not found" });

        await Sprint.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: "Sprint deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};