import mongoose from 'mongoose';

const toTitleCase = (str) => {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const experienceSchema = new mongoose.Schema({
    userId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    companyName:{
        type: String,
        required: true,
        set: toTitleCase
    },
    designation:{
        type: String,
        required: true,
        set: toTitleCase
    },
    description: {
        type: String,
        required: true
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