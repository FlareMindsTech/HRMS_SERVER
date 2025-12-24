import mongoose from "mongoose";

const familySchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    relationship: {
        type: String,
        required: true
    },
    occupation: {
        type: String,
        required: true
    },
    dob: {
        type: String,
        required: true
    },
    adhaarNO: {
        type: Number, 
        required: true
    },
    emergencyContact: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

const Family = mongoose.model('Family', familySchema);
export default Family;
