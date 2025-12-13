import Role from "../Modules/RoleModules.js";

export const createRole = async (req, res) => {
    try {
        const { roleName } = req.body;

        if (!roleName) {
            return res.status(400).json({
                success: false,
                message: "roleName is required"
            });
        }

        const exists = await Role.findOne({ roleName });

        if (exists) {
            return res.status(400).json({
                success: false,
                message: "roleName already exists"
            });
        }

        const newRole = new Role({ roleName });

        await newRole.save();

        return res.status(201).json({
            success: true,
            message: "Role created successfully",
            data: newRole
        });

    } catch (error) {
        return res.status(500).json({
            success: false, 
            message: error.message
        });
    }
};

export const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find();

        return res.status(200).json({
            success: true,
            message: "All roles fetched successfully",
            data: roles
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await Role.findById(id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Role fetched successfully",
            data: role
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleName, isActive, isBlock } = req.body;

        const role = await Role.findById(id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }

        // Duplicate name check
        if (roleName) {
            const exists = await Role.findOne({ roleName });
            if (exists && exists._id.toString() !== id) {
                return res.status(400).json({
                    success: false,
                    message: "roleName already exists"
                });
            }

            role.roleName = roleName;
        }

        if (isActive !== undefined) role.isActive = isActive;
        if (isBlock !== undefined) role.isBlock = isBlock;

        await role.save();

        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: role
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await Role.findByIdAndDelete(id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Role deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
