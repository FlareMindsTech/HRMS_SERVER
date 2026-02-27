import User from "../Modules/UserModule.js";

export const Authendication = async (req, res, next) => {
    let token = req.header('hrms-auth-token');
    
    // Also check standard Authorization Bearer token header
    const authHeader = req.header('Authorization');
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }

    if (!token) return res.status(403).json({ message: 'forbidden - token is unavailable' });

    try {
        const decoded = jwt.verify(token, process.env.JWT || "fallback_hrms_secret_key");
        req.user = decoded;

        const getOwner = await User.findById(req.user.id).select("isOwner");

        if (getOwner?.isOwner) {
            req.user = { ...req.user, isOwner: true };
            return next();
        }

        const user = await User.findById(req.user.id).populate("role");

        if (!user?.role) {
            return res.status(404).json({ message: "Not mapping any role for this user" });
        }

        req.user = {
            ...req.user,
            roleId: user.role._id,
            roleName: user.role.roleName,
            isOwner: false
        };

        next();

    } catch (err) {
        return res.status(400).json({ message: "invalid token" });
    }
};


export const Autherization = async (req, res, next) => {
    if (req.user.isOwner) return next();

    try {
        const access = await RoleMenu.find({ roleId: req.user.roleId })
            .populate("roleId")
            .populate("menuId");

        req.user = { ...req.user, access };
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
