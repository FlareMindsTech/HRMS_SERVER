import jwt from "jsonwebtoken";
import User from "../Modules/UserModule.js";
import Menu from "../Modules/MenuModule.js";
import RoleMenu from "../Modules/RoleMenuModule.js";

/**
 * Authentication Middleware
 * Validates JWT, verifies user and role status, and attaches authorization context to req.user.
 */
export const Authendication = async (req, res, next) => {
  try {
    // 1. Read Bearer token
    const authHeader = req.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    // 2. JWT Secret check
    const jwtSecret = process.env.JWT;
    if (!jwtSecret) {
      console.error("JWT secret is not configured in environment");
      return res.status(500).json({
        success: false,
        message: "Authentication service unavailable",
      });
    }

    // 3. Verify JWT signature, issuer, and audience
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: "hrms",
      audience: "hrms-client",
    });

    if (!decoded.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token: missing subject",
      });
    }

    // 4. Fetch User and populate Role (including permissions and priority)
    const user = await User.findById(decoded.sub)
      .select("_id employeeCode role isActive isBlocked")
      .populate({
        path: "role",
        select: "_id roleName roleCode priority permissions isActive isBlock isBlocked",
      })
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    // 5. User Account Status checks
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by administrator",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is currently inactive",
      });
    }

    // 6. Role Status checks
    if (!user.role) {
      return res.status(403).json({
        success: false,
        message: "No active role assigned to this user",
      });
    }

    const isRoleBlocked = user.role.isBlock || user.role.isBlocked || false;
    if (isRoleBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your assigned role has been blocked",
      });
    }

    if (!user.role.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your assigned role is currently inactive",
      });
    }

    // 7. Store complete Authorization Context in req.user
    req.user = {
      id: user._id,
      employeeCode: user.employeeCode,
      roleId: user.role._id,
      roleName: user.role.roleName,
      roleCode: user.role.roleCode,
      priority: user.role.priority,
      permissions: user.role.permissions || [],
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token signature",
      });
    }

    console.error("Authentication Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication processing failed",
    });
  }
};

// Export alias to ensure full compatibility with existing code references
export const Authentication = Authendication;

/**
 * RBAC Permission Authorization Middleware
 * Verifies if req.user has the required permission or wildcard '*' without database query.
 */
export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication context required",
      });
    }

    const permissions = req.user.permissions || [];

    // Allow if Owner (priority 1), or has wildcard '*', or has exact permission
    if (
      req.user.priority === 1 ||
      permissions.includes("*") ||
      permissions.includes(requiredPermission)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Requires permission: '${requiredPermission}'`,
    });
  };
};

/**
 * Admin Authority Authorization Middleware (Priority <= 2: Owner or Admin)
 */
export const isAdmin = (req, res, next) => {
  const userPriority = req.user?.priority;
  if (userPriority === undefined || userPriority === null || userPriority > 2) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only Admin-level authority (priority <= 2) can perform this action.",
    });
  }
  next();
};

/**
 * Dynamic Menu Access Authorization Middleware (RoleMenu concept)
 */
export const checkMenuAccess = (requiredMenuCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roleId) {
        return res.status(401).json({
          success: false,
          message: "Authentication context required",
        });
      }

      // Priority 1 or Wildcard permission grants UI menu access
      if (req.user.priority === 1 || req.user.permissions?.includes("*")) {
        return next();
      }

      const menu = await Menu.findOne({
        menuCode: requiredMenuCode,
        isActive: true,
      }).select("_id");

      if (!menu) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Menu '${requiredMenuCode}' is not configured or inactive.`,
        });
      }

      const hasAccess = await RoleMenu.exists({
        roleId: req.user.roleId,
        menuId: menu._id,
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Your role does not have UI access to menu '${requiredMenuCode}'.`,
        });
      }

      next();
    } catch (error) {
      console.error("Menu Access Authorization Error:", error);
      return res.status(500).json({
        success: false,
        message: "Menu access authorization check failed",
      });
    }
  };
};

/**
 * Approval Authority Middleware
 * Evaluates whether logged-in user has sufficient authority priority to approve a request.
 */
export const checkApprovalAuthority = ({ minimumPriority = 4, allowSelfApproval = false } = {}) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication context required",
      });
    }

    const approverPriority = req.user.priority;
    const targetRequesterId = req.body?.requesterId || req.body?.employeeId;

    // Self-approval check
    if (!allowSelfApproval && targetRequesterId && targetRequesterId.toString() === req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Self-approval is disabled for this workflow step.",
      });
    }

    // Lower priority number = higher authority level
    if (approverPriority > minimumPriority) {
      return res.status(403).json({
        success: false,
        message: `Insufficient approval authority. Required priority level <= ${minimumPriority}, your priority is ${approverPriority}.`,
      });
    }

    next();
  };
};