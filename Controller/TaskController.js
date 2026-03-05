import Task from "../Modules/TaskModule.js";
import Project from "../Modules/ProjectModule.js";
import User from "../Modules/UserModule.js";
import Notification from "../Modules/NotificationModule.js";
import mongoose from "mongoose";

export const createTask = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { projectId, taskName, description, assignedTo, priority, dueDate } = req.body;
        const assignedBy = req.user.id;

        const newTask = new Task({
            projectId,
            taskName,
            description,
            assignedTo,
            assignedBy,
            priority,
            dueDate,
        });

        await newTask.save({ session });

        if (assignedTo) {
            const notification = new Notification({
                userId: assignedTo,
                message: `You have been assigned a new task: ${taskName}`,
                type: 'Task Assignment',
                relatedEntityId: newTask._id
            });
            await notification.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: newTask,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await Task.find({ projectId }).populate("assignedTo", "firstName lastName");

        return res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        const task = await Task.findById(id).populate("projectId");
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        // Secure task update rules:
        // Only Assingee, Owner, Project Manager (of that project), or TL can update the task
        const isAssignee = task.assignedTo && task.assignedTo.toString() === userId;
        const isOwner = req.user.isOwner;

        let isManagerOrTL = false;
        if (task.projectId) {
            const project = await Project.findById(task.projectId._id); // task.projectId is populated, but _id works
            if (project) {
                if (project.projectManager && project.projectManager.toString() === userId) {
                    isManagerOrTL = true;
                }
                if (project.teamLeads && project.teamLeads.some(tl => tl.userId.toString() === userId)) {
                    isManagerOrTL = true;
                }
            }
        }

        if (!isAssignee && !isOwner && !isManagerOrTL) {
            return res.status(403).json({ success: false, message: "Secure Rule Violation: You do not have permission to update this task" });
        }

        task.status = status;
        await task.save();

        return res.status(200).json({ success: true, message: "Task status updated successfully", data: task });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
