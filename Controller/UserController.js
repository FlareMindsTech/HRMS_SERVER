import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../Modules/UserModule.js";
import Role from "../Modules/RoleModules.js";
import Attendance from "../Modules/AttendanceModule.js";

const SALT_ROUNDS = 10;

// ======================================================
// HELPERS
// ======================================================

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return null;
  }

  const R = 6371000;
  const rad = Math.PI / 180;

  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a = Math.min(
    1,
    Math.max(
      0,
      Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * rad) *
          Math.cos(lat2 * rad) *
          Math.sin(dLon / 2) ** 2
    )
  );

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const getTodayString = () => {
  return new Date().toISOString().split("T")[0];
};

// ======================================================
// REGISTER OWNER (Dedicated One-Time Initial Setup Endpoint)
// ======================================================
export const registerOwner = async (req, res) => {
  try {
    // 1. Verify Setup Key Header
    const setupKeyHeader = req.get("X-HRMS-Setup-Key");
    const configuredSetupKey = process.env.HRMS_SETUP_KEY;

    if (!configuredSetupKey || !setupKeyHeader || setupKeyHeader.trim() !== configuredSetupKey.trim()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Invalid or missing X-HRMS-Setup-Key header.",
      });
    }

    // 2. Check if an Owner account already exists in DB
    const existingOwnerRole = await Role.findOne({
      $or: [{ roleCode: "OWNER" }, { priority: 1 }],
    }).lean();

    if (existingOwnerRole) {
      const ownerUserExists = await User.exists({ role: existingOwnerRole._id });
      if (ownerUserExists) {
        return res.status(403).json({
          success: false,
          message: "System Owner account already initialized and exists.",
        });
      }
    }

    // 3. Extract credentials & employee info (strictly ignoring client-supplied role/priority/permissions)
    const { employeeCode, firstName, name, lastName, email, password, mobileNo, dob, gender, marriageStatus } = req.body;

    const fName = firstName || (name ? name.split(" ")[0] : "System");
    const lName = lastName || (name && name.split(" ").length > 1 ? name.split(" ").slice(1).join(" ") : "Owner");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const ownerCode = employeeCode ? employeeCode.trim().toUpperCase() : "OWN001";
    const phone = mobileNo ? mobileNo.trim() : "9999999999";

    // 4. Find or Create the predefined System Owner Role
    let ownerRole = existingOwnerRole ? await Role.findById(existingOwnerRole._id) : null;
    if (!ownerRole) {
      ownerRole = await Role.create({
        roleName: "Owner",
        roleCode: "OWNER",
        priority: 1,
        permissions: ["*"],
        isSystemRole: true,
        isActive: true,
        isBlocked: false,
        isBlock: false,
      });
    }

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Create Owner User
    const ownerUser = await User.create({
      firstName: fName,
      lastName: lName,
      email: normalizedEmail,
      mobileNo: phone,
      password: hashedPassword,
      employeeCode: ownerCode,
      dob: dob ? new Date(dob) : new Date("1990-01-01"),
      gender: gender || "Male",
      marriageStatus: marriageStatus || "Married",
      role: ownerRole._id,
      lifecycleStatus: "ACTIVE",
      isActive: true,
      isBlocked: false,
      wfh: { isApproved: true },
    });

    return res.status(201).json({
      success: true,
      message: "Owner account created successfully",
      data: {
        userId: ownerUser._id,
        employeeCode: ownerUser.employeeCode,
        role: "OWNER",
      },
    });
  } catch (error) {
    console.error("registerOwner Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Owner email, mobile number, or employee code already exists.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to initialize Owner account: " + error.message,
    });
  }
};

// ======================================================
// REGISTER
// ======================================================

export const Register = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      dob,
      gender,
      marriageStatus,
      bloodGroup,
      mobileNo,
      password,
      employeeCode,
      role,
      tlCode,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !dob ||
      !gender ||
      !marriageStatus ||
      !mobileNo ||
      !password ||
      !employeeCode ||
      !role
    ) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedMobile = mobileNo.trim();
    const normalizedEmployeeCode =
      employeeCode.trim().toUpperCase();

    // Check duplicate data
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { mobileNo: normalizedMobile },
        { employeeCode: normalizedEmployeeCode },
      ],
    })
      .select("email mobileNo employeeCode")
      .lean();

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({
          message: "Email already registered",
        });
      }

      if (existingUser.mobileNo === normalizedMobile) {
        return res.status(409).json({
          message: "Mobile number already registered",
        });
      }

      return res.status(409).json({
        message: "Employee code already registered",
      });
    }

    // Find role
    let roleQuery = {};
    if (mongoose.Types.ObjectId.isValid(role)) {
      roleQuery = { _id: role };
    } else {
      roleQuery = { roleName: { $regex: new RegExp(`^${role}$`, "i") } };
    }

    const roleDoc = await Role.findOne(roleQuery)
      .select("_id roleName")
      .lean();

    if (!roleDoc) {
      return res.status(400).json({
        message: "Invalid role specified",
      });
    }

    // Validate TL if supplied
    if (tlCode) {
      if (!mongoose.Types.ObjectId.isValid(tlCode)) {
        return res.status(400).json({
          message: "Invalid Team Lead ID",
        });
      }

      const tl = await User.findOne({
        _id: tlCode,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (!tl) {
        return res.status(400).json({
          message: "Team Lead not found",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(
      password,
      SALT_ROUNDS
    );

    const user = await User.create({
      firstName,
      middleName: middleName || null,
      lastName,
      email: normalizedEmail,
      dob,
      gender,
      marriageStatus,
      bloodGroup: bloodGroup || null,
      mobileNo: normalizedMobile,
      password: hashedPassword,
      employeeCode: normalizedEmployeeCode,
      role: roleDoc._id,
      tlCode: tlCode || null,
    });

    return res.status(201).json({
      message: "Registration successful",
      id: user._id,
      employeeCode: user.employeeCode,
    });
  } catch (error) {
    console.error("Register Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Email, mobile number or employee code already exists",
      });
    }

    return res.status(500).json({
      message: "Registration failed",
    });
  }
};

// ======================================================
// LOGIN
// ======================================================

export const login = async (req, res) => {
  try {
    // ==================================================
    // GET LOGIN DATA
    // ==================================================

    const {
      identifier,
      password,
      latitude,
      longitude,
    } = req.body;

    // ==================================================
    // VALIDATE LOGIN INPUT
    // ==================================================

    if (
      typeof identifier !== "string" ||
      typeof password !== "string" ||
      !identifier.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email/mobile number and password are required",
      });
    }

    const value = identifier.trim();

    // ==================================================
    // FIND USER
    // ==================================================

    const user = await User.findOne({
      $or: [
        {
          email: value.toLowerCase(),
        },
        {
          mobileNo: value,
        },
      ],
    })
      .select(
        "+password " +
          "_id firstName lastName email mobileNo " +
          "employeeCode role tlCode isActive isBlocked wfh"
      )
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ==================================================
    // PASSWORD CHECK
    // ==================================================

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ==================================================
    // USER STATUS
    // ==================================================

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // ==================================================
    // ROLE VALIDATION
    // ==================================================

    if (!user.role) {
      return res.status(403).json({
        success: false,
        message: "No role assigned to this user",
      });
    }

    const userRoleDoc = await Role.findById(user.role)
      .select(
        "_id roleName roleCode priority isActive isBlocked isBlock"
      )
      .lean();

    if (!userRoleDoc) {
      return res.status(403).json({
        success: false,
        message: "User role not found",
      });
    }

    // Support both existing field names while your schema
    // is being standardized.
    const roleBlocked =
      userRoleDoc.isBlocked === true ||
      userRoleDoc.isBlock === true;

    if (roleBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your role has been blocked",
      });
    }

    if (userRoleDoc.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your role is inactive",
      });
    }

    // ==================================================
    // GPS / OFFICE LOCATION
    // ==================================================

    const userLatitude = Number(latitude);
    const userLongitude = Number(longitude);

    const hasValidLocation =
      Number.isFinite(userLatitude) &&
      Number.isFinite(userLongitude) &&
      userLatitude >= -90 &&
      userLatitude <= 90 &&
      userLongitude >= -180 &&
      userLongitude <= 180;

    if (!hasValidLocation) {
      return res.status(400).json({
        success: false,
        message:
          "Valid latitude and longitude are required for login",
      });
    }

    // ==================================================
    // OFFICE CONFIGURATION
    // ==================================================

    const officeLatitude = Number(
      process.env.OFFICE_LATITUDE
    );

    const officeLongitude = Number(
      process.env.OFFICE_LONGITUDE
    );

    const officeRadius = Number(
      process.env.OFFICE_RADIUS_METERS || 200
    );

    if (
      !Number.isFinite(officeLatitude) ||
      !Number.isFinite(officeLongitude) ||
      !Number.isFinite(officeRadius) ||
      officeRadius <= 0
    ) {
      console.error("Invalid office location configuration");

      return res.status(500).json({
        success: false,
        message:
          "Office location is not configured correctly",
      });
    }

    // ==================================================
    // CALCULATE DISTANCE
    // ==================================================

    const distance = getDistanceInMeters(
      userLatitude,
      userLongitude,
      officeLatitude,
      officeLongitude
    );

    if (distance === null) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to calculate distance from office",
      });
    }

    // ==================================================
    // DETERMINE OFFICE / WFH
    // ==================================================

    const isAtOffice = distance <= officeRadius;

    let locationType;

    if (isAtOffice) {
      locationType = "Office";
    } else {
      locationType = "WFH";

      // ==================================================
      // WFH APPROVAL CHECK
      // ==================================================

      if (user.wfh?.isApproved !== true) {
        return res.status(403).json({
          success: false,
          message:
            "You are outside the office location and do not have WFH approval",
          locationType: "WFH",
          distance: Math.round(distance),
          allowedRadius: officeRadius,
        });
      }
    }

    // ==================================================
    // JWT SECRET
    // ==================================================

    const jwtSecret = process.env.JWT;

    if (!jwtSecret) {
      console.error("JWT secret is missing");

      return res.status(500).json({
        success: false,
        message:
          "Authentication service unavailable",
      });
    }

    // ==================================================
    // GENERATE JWT
    // ==================================================

    const token = jwt.sign(
      {
        sub: user._id.toString(),
      },
      jwtSecret,
      {
        expiresIn: "9h",
        issuer: "hrms",
        audience: "hrms-client",
      }
    );

    // ==================================================
    // LAST LOGIN
    // ==================================================

    const now = new Date();
    const dateString = getTodayString();

    const updateData = {
      lastLoginAt: now,
      lastLoginLocation: {
        latitude: userLatitude,
        longitude: userLongitude,
        timestamp: now,
        locationType,
        distanceFromOffice: Math.round(distance),
      },
    };

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: updateData,
      }
    );

    // ==================================================
    // ATTENDANCE
    // ==================================================

    const existingAttendance =
      await Attendance.findOne({
        userId: user._id,
        date: dateString,
      });

    if (!existingAttendance) {
      await Attendance.create({
        userId: user._id,
        date: dateString,
        loginTime: now,
        locationType,
        status: "Present",
      });
    }

    // ==================================================
    // LOGIN SUCCESS
    // ==================================================

    return res
      .status(200)
      .header("hrms-auth-token", token)
      .json({
        success: true,
        message: "Login successful",

        token,

        location: {
          type: locationType,
          distanceFromOffice: Math.round(distance),
          allowedRadius: officeRadius,
        },

        user: {
          id: user._id,
          employeeCode: user.employeeCode,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobileNo: user.mobileNo,
          role: user.role,
          roleCode: userRoleDoc.roleCode,
          roleName: userRoleDoc.roleName,
          priority: userRoleDoc.priority,
          tlCode: user.tlCode,
        },
      });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};
// ======================================================
// LOGOUT
// ======================================================

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const dateString = getTodayString();

    const attendance = await Attendance.findOne({
      userId,
      date: dateString,
    });

    if (!attendance) {
      return res.status(404).json({
        message: "Today's attendance not found",
      });
    }

    if (attendance.logoutTime) {
      return res.status(400).json({
        message: "Already logged out",
      });
    }

    const loginTime = new Date(attendance.loginTime);

    const totalMinutes = Math.floor(
      (now - loginTime) / 60000
    );

    let status = "Absent";

    if (totalMinutes >= 510) {
      status = "Present";
    } else if (totalMinutes >= 240) {
      status = "Half Day";
    }

    await Attendance.updateOne(
      { _id: attendance._id },
      {
        $set: {
          logoutTime: now,
          totalWorkingMinutes: totalMinutes,
          totalHours: Number(
            (totalMinutes / 60).toFixed(2)
          ),
          status,
        },
      }
    );

    return res.status(200).json({
      message: "Logout successful",
      totalWorkingMinutes: totalMinutes,
      totalHours: Number(
        (totalMinutes / 60).toFixed(2)
      ),
      status,
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      message: "Logout failed",
    });
  }
};

// ======================================================
// PROFILE
// ======================================================

export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select(
        "firstName middleName lastName email dob gender " +
          "marriageStatus bloodGroup mobileNo employeeCode " +
          "role tlCode isActive isBlocked wfh " +
          "lastLoginAt lastLoginLocation"
      )
      .populate({
        path: "role",
        select: "roleName",
      })
      .populate({
        path: "tlCode",
        select:
          "firstName middleName lastName employeeCode",
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      data: user,
    });
  } catch (error) {
    console.error("Profile Error:", error);

    return res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

// ======================================================
// GET ALL USERS
// ======================================================

export const getAllUser = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const filter = {};

    if (search?.trim()) {
      const searchValue = search.trim();

      filter.$or = [
        {
          firstName: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          lastName: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          email: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          employeeCode: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ];
    }

    if (role) {
      const roleDoc = await Role.findOne({
        roleName: role,
      })
        .select("_id")
        .lean();

      if (!roleDoc) {
        return res.status(200).json({
          data: [],
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total: 0,
            pages: 0,
          },
        });
      }

      filter.role = roleDoc._id;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          "firstName middleName lastName email mobileNo " +
            "employeeCode role tlCode isActive isBlocked wfh"
        )
        .populate({
          path: "role",
          select: "roleName",
        })
        .populate({
          path: "tlCode",
          select:
            "firstName middleName lastName employeeCode",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: users,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get Users Error:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

// ======================================================
// GET USER BY ID
// ======================================================

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id)
      .select(
        "firstName middleName lastName email dob gender " +
          "marriageStatus bloodGroup mobileNo employeeCode " +
          "role tlCode isActive isBlocked wfh " +
          "lastLoginAt lastLoginLocation"
      )
      .populate({
        path: "role",
        select: "roleName",
      })
      .populate({
        path: "tlCode",
        select:
          "firstName middleName lastName employeeCode",
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      data: user,
    });
  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};

// ======================================================
// UPDATE USER
// ======================================================

export const updateUser = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const allowedFields = [
      "firstName",
      "middleName",
      "lastName",
      "email",
      "dob",
      "gender",
      "marriageStatus",
      "bloodGroup",
      "mobileNo",
      "employeeCode",
      "tlCode",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.email) {
      updates.email = updates.email
        .toLowerCase()
        .trim();
    }

    if (updates.mobileNo) {
      updates.mobileNo = updates.mobileNo.trim();
    }

    if (updates.employeeCode) {
      updates.employeeCode = updates.employeeCode
        .trim()
        .toUpperCase();
    }

    if (updates.middleName === "") {
      updates.middleName = null;
    }

    if (updates.tlCode) {
      if (
        !mongoose.Types.ObjectId.isValid(updates.tlCode)
      ) {
        return res.status(400).json({
          message: "Invalid Team Lead ID",
        });
      }

      if (updates.tlCode.toString() === id.toString()) {
        return res.status(400).json({
          message: "User cannot be their own Team Lead",
        });
      }
    }

    const updatedUser =
      await User.findByIdAndUpdate(
        id,
        { $set: updates },
        {
          new: true,
          runValidators: true,
        }
      )
        .select(
          "firstName middleName lastName email dob gender " +
            "marriageStatus bloodGroup mobileNo employeeCode " +
            "role tlCode isActive isBlocked wfh"
        )
        .lean();

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Email, mobile number or employee code already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to update user",
    });
  }
};

// ======================================================
// UPDATE ROLE
// ======================================================

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (!role) {
      return res.status(400).json({
        message: "Role is required",
      });
    }

    const roleDoc = await Role.findOne({
      roleName: role,
    })
      .select("_id roleName")
      .lean();

    if (!roleDoc) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          role: roleDoc._id,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("employeeCode role")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Role updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update Role Error:", error);

    return res.status(500).json({
      message: "Failed to update role",
    });
  }
};

// ======================================================
// DELETE USER
// ======================================================

export const deleteUser = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findByIdAndDelete(id)
      .select("_id employeeCode")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);

    return res.status(500).json({
      message: "Failed to delete user",
    });
  }
};