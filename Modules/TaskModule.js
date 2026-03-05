import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        taskName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Medium",
        },
        status: {
            type: String,
            enum: ["To Do", "In Progress", "Testing", "Completed"],
            default: "To Do",
        },
        dueDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Performance Index Strategy
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ projectId: 1, dueDate: 1 });

const Task = mongoose.model("Task", taskSchema);
export default Task;
