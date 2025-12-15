import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
    userId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    companyName:{
        type: String,
        required: true
    },
    designation:{
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    salary: {
        type: String,
        default: "0"
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: false
    },
    isCurrentJob: {
        type: Boolean,
        default: false
    },
    experience: {
        type: String,
        required: true
    }
},{
    timestamps: true
})

const Experience = mongoose.model('Experience', experienceSchema);
export default Experience;