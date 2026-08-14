import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
    {
        // ==========================================
        // ROLE NAME
        // ==========================================

        roleName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 50,
            match: [
                /^[A-Za-z ]+$/,
                "Role name must contain only alphabets and spaces",
            ],
        },

        // ==========================================
        // ROLE CODE
        // ==========================================

        roleCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        // ==========================================
        // ROLE PRIORITY
        // 1 = Highest (Owner)
        // 2 = System Admin
        // 3+ = Custom Roles
        // ==========================================

        priority: {
            type: Number,
            required: true,
            unique: true,
            min: [1, "Priority must be a positive integer"],
            validate: {
                validator: Number.isInteger,
                message: "Priority must be an integer",
            },
        },

        // ==========================================
        // STATUS
        // ==========================================

        isActive: {
            type: Boolean,
            default: true,
        },

        isBlock: {
            type: Boolean,
            default: false,
        },

        isBlocked: {
            type: Boolean,
            default: false,
        },

        isSystemRole: {
            type: Boolean,
            default: false,
        },

        // ==========================================
        // RBAC PERMISSIONS
        // Example: ['employee:read', 'resignation:approve']
        // ==========================================
        permissions: [{
            type: String,
            trim: true,
        }],
    },
    {
        timestamps: true,
    }
);

// ==========================================
// NORMALIZE ROLE NAME
// ==========================================

roleSchema.pre("save", function (next) {
    if (this.roleName) {
        this.roleName = this.roleName
            .trim()
            .replace(/\s+/g, " ")
            .split(" ")
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1).toLowerCase()
            )
            .join(" ");
    }

    next();
});

// ==========================================
// GENERATE ROLE CODE
// ==========================================

roleSchema.pre("validate", function (next) {
    if (!this.roleCode && this.roleName) {
        this.roleCode = this.roleName
            .trim()
            .replace(/\s+/g, "_")
            .toUpperCase();
    }

    next();
});

const Role = mongoose.model("Role", roleSchema);

export default Role;