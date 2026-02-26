import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, 
        required: true
    },
    loginTime: {
        type: Date,
        required: true
    },
    logoutTime: {
        type: Date
    },
    locationType: {
        type: String,
        enum: ['Office', 'WFH'],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending Full Day', 'Half Day', 'Full Day', 'Leave'],
        default: 'Pending Full Day'
    },
    totalHours: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
