import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    roleName: {
        type: String,
        required: true,
        match: [/^[A-Za-z ]+$/, "roleName must contain only alphabets"]
    },
    roleCode: {
        type: String,
        unique: true 
        
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    isBlock: {
        type: Boolean,
        required: true,
        default: false
    }
}, { timestamps: true });


// Convert only roleName to Title Case
roleSchema.pre("save", function (next) {
    if (this.roleName) {
        this.roleName = this.roleName
            .trim()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    }
    next();
});


// Auto-generate roleCode
roleSchema.pre("save", async function (next) {
    if (!this.roleCode) {

        const prefix = this.roleName.toUpperCase().replace(/\s+/g, "_");

        const count = await this.constructor.countDocuments({
            roleName: this.roleName
        });

        const number = String(count + 1).padStart(4, "0");

        this.roleCode = `${prefix}_${number}`;
    }
    next();
});

const Role = mongoose.model("Role", roleSchema);

export default Role;
