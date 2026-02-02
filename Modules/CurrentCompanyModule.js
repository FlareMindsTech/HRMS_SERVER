import mongoose from 'mongoose';

const toTitleCase = (str) => {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const currentCompanySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    department: {
        type: String,
        required: true,
        set: toTitleCase
    },
    designation: {
        type: String,
        required: true,
        set: toTitleCase
    },
    role: {
        type: String,
        required: true,
        set: toTitleCase
    },
    salary: {
        type: String,
        required: true
    },
    joiningDate: {
        type: String,
        required: true
    },
    reportedTo: {
        type: String,
        required: true,
        set: toTitleCase
    },
    isFresher: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const CurrentCompany = mongoose.model('CurrentCompany', currentCompanySchema);
export default CurrentCompany;
