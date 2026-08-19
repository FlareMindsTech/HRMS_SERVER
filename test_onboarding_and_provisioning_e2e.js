import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './Modules/UserModule.js';
import Role from './Modules/RoleModules.js';
import Menu from './Modules/MenuModule.js';
import RoleMenu from './Modules/RoleMenuModule.js';
import RolePermission from './Modules/RolePermissionModule.js';
import Permission from './Modules/PermissionModule.js';
import { seedRBACFoundation } from './Services/PermissionSeedService.js';

dotenv.config();

const BASE_URL = 'http://localhost:7800/api';
const JWT_SECRET = process.env.JWT;

function generateTestToken(userId) {
  return jwt.sign({ sub: userId.toString() }, JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'hrms',
    audience: 'hrms-client',
  });
}

async function runOnboardingAndProvisioningSuite() {
  console.log("==================================================================");
  console.log("TEST SUITE: RBAC AUTHORITY & PROTECTED HR SYSTEM ROLE");
  console.log("==================================================================");

  await mongoose.connect(process.env.MONGO_URI);

  const results = [];
  const test = (name, passed, details = "") => {
    results.push({ name, passed, details });
    console.log(`${passed ? "✅ PASS" : "❌ FAIL"}: ${name} ${details ? `(${details})` : ""}`);
  };

  const hashedPassword = await bcrypt.hash("Password@123", 10);

  // 0. Run Idempotent RBAC Foundation Seed & Migration
  console.log("\n--- RUNNING RBAC FOUNDATION SEED & MIGRATION ---");
  await seedRBACFoundation();

  // 1. Roles Lookup & Verification
  const ownerRole = await Role.findOne({ priority: 1, roleCode: "OWNER" });
  const adminRole = await Role.findOne({ priority: 2, roleCode: "ADMIN" });
  const employeeRole = await Role.findOne({ roleCode: "EMPLOYEE" });
  let hrRole = await Role.findOne({ roleCode: "HR" });

  // 2. Users Setup
  // Owner User
  let ownerUser = await User.findOne({ email: "owner@hrms.com" });
  if (!ownerUser) {
    ownerUser = await User.create({
      firstName: "System",
      lastName: "Owner",
      email: "owner@hrms.com",
      password: hashedPassword,
      role: ownerRole._id,
      employeeCode: "OWN001",
      mobileNo: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      gender: "Male",
      dob: "1985-01-01",
      marriageStatus: "Married",
      hasLoginAccess: true,
      isActive: true,
    });
  } else {
    ownerUser.role = ownerRole._id;
    ownerUser.isActive = true;
    ownerUser.isBlocked = false;
    await ownerUser.save();
  }

  // Admin User
  let adminUser = await User.findOne({ email: "e2e_admin@flareminds.com" });
  if (!adminUser) {
    adminUser = await User.create({
      firstName: "E2E",
      lastName: "Admin",
      email: "e2e_admin@flareminds.com",
      password: hashedPassword,
      role: adminRole._id,
      employeeCode: "ADM001",
      mobileNo: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      gender: "Male",
      dob: "1988-02-02",
      marriageStatus: "Married",
      hasLoginAccess: true,
      isActive: true,
    });
  } else {
    adminUser.role = adminRole._id;
    adminUser.isActive = true;
    adminUser.isBlocked = false;
    await adminUser.save();
  }

  // Second Admin User (for testing Admin vs Admin modifications)
  let secondAdminUser = await User.findOne({ email: "e2e_admin2@flareminds.com" });
  if (!secondAdminUser) {
    secondAdminUser = await User.create({
      firstName: "Second",
      lastName: "Admin",
      email: "e2e_admin2@flareminds.com",
      password: hashedPassword,
      role: adminRole._id,
      employeeCode: "ADM002",
      mobileNo: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      gender: "Male",
      dob: "1989-05-05",
      marriageStatus: "Married",
      hasLoginAccess: true,
      isActive: true,
    });
  } else {
    secondAdminUser.role = adminRole._id;
    secondAdminUser.isActive = true;
    secondAdminUser.isBlocked = false;
    await secondAdminUser.save();
  }

  // HR User
  let hrUser = await User.findOne({ email: "e2e_hr@flareminds.com" });
  if (!hrUser) {
    hrUser = await User.create({
      firstName: "E2E",
      lastName: "HR",
      email: "e2e_hr@flareminds.com",
      password: hashedPassword,
      role: hrRole._id,
      employeeCode: "HR001",
      mobileNo: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      gender: "Female",
      dob: "1992-03-03",
      marriageStatus: "Unmarried",
      hasLoginAccess: true,
      isActive: true,
    });
  } else {
    hrUser.role = hrRole._id;
    hrUser.isActive = true;
    hrUser.isBlocked = false;
    await hrUser.save();
  }

  // Second HR User (for testing HR vs HR modifications)
  let secondHrUser = await User.findOne({ email: "e2e_hr2@flareminds.com" });
  if (!secondHrUser) {
    secondHrUser = await User.create({
      firstName: "Second",
      lastName: "HR",
      email: "e2e_hr2@flareminds.com",
      password: hashedPassword,
      role: hrRole._id,
      employeeCode: "HR002",
      mobileNo: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      gender: "Female",
      dob: "1993-07-07",
      marriageStatus: "Unmarried",
      hasLoginAccess: true,
      isActive: true,
    });
  } else {
    secondHrUser.role = hrRole._id;
    secondHrUser.isActive = true;
    secondHrUser.isBlocked = false;
    await secondHrUser.save();
  }

  // Unprovisioned Onboarded Employee
  let candidateEmp = await User.findOne({ email: "e2e_candidate@flareminds.com" });
  if (!candidateEmp) {
    candidateEmp = await User.create({
      firstName: "Arun",
      lastName: "Kumar",
      email: "e2e_candidate@flareminds.com",
      password: hashedPassword,
      role: employeeRole._id,
      employeeCode: "EMP-CAND-01",
      mobileNo: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      gender: "Male",
      dob: "1996-04-04",
      marriageStatus: "Unmarried",
      hasLoginAccess: false, // NOT PROVISIONED YET
      lifecycleStatus: "ONBOARDING",
      isActive: true,
    });
  } else {
    candidateEmp.role = employeeRole._id;
    candidateEmp.password = hashedPassword;
    candidateEmp.hasLoginAccess = false;
    candidateEmp.isActive = true;
    candidateEmp.isBlocked = false;
    await candidateEmp.save();
  }

  const ownerToken = generateTestToken(ownerUser._id);
  const adminToken = generateTestToken(adminUser._id);
  const hrToken = generateTestToken(hrUser._id);

  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 0: PROTECTED STANDARD HR ROLE DEFINITION & MIGRATION
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 0: PROTECTED HR SYSTEM ROLE INTEGRITY ---");
  test("HR role exists in database", !!hrRole);
  test("HR roleCode is 'HR'", hrRole?.roleCode === "HR");
  test("HR roleName is 'HR'", hrRole?.roleName === "HR");
  test("HR isSystemRole is true (protected core system role)", hrRole?.isSystemRole === true);
  test("HR priority is 3", hrRole?.priority === 3);

  const hrCount = await Role.countDocuments({ roleCode: "HR" });
  test("Exactly one active HR role exists in database", hrCount === 1, `Count: ${hrCount}`);

  const requiredHrPerms = [
    "user.read",
    "user.read_own",
    "user.provision_account",
    "user.manage_status",
    "onboarding.read",
    "onboarding.create",
    "onboarding.update",
    "onboarding.complete",
    "attendance.read.all",
    "attendance.read.own",
  ];

  // Check RolePermission junction documents (Single Source of Truth)
  const hrRolePerms = await RolePermission.find({ roleId: hrRole._id }).populate("permissionId");
  const hrRolePermCodes = hrRolePerms.map((rp) => rp.permissionId?.permissionCode).filter(Boolean);
  const hrHasAllPerms = requiredHrPerms.every((p) => hrRolePermCodes.includes(p));
  test("HR has all required standard permissions in RolePermission", hrHasAllPerms);

  test("HR does NOT have user.manage_roles", !hrRolePermCodes.includes("user.manage_roles"));
  test("HR does NOT have wildcard '*'", !hrRolePermCodes.includes("*"));

  // Check RoleMenu junction documents
  const hrRoleMenus = await RoleMenu.find({ roleId: hrRole._id }).populate("menuId");
  const hrRoleMenuCodes = hrRoleMenus.map((rm) => rm.menuId?.menuCode).filter(Boolean);
  test(
    "HR has required RoleMenu junction mappings (DASHBOARD, ATTENDANCE, USER_MANAGEMENT)",
    hrRoleMenuCodes.includes("DASHBOARD") &&
      hrRoleMenuCodes.includes("ATTENDANCE") &&
      hrRoleMenuCodes.includes("USER_MANAGEMENT")
  );

  test("Existing HR user remains linked to migrated HR role", hrUser.role.toString() === hrRole._id.toString());

  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 1: UNPROVISIONED EMPLOYEE LOGIN BLOCK
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 1: UNPROVISIONED LOGIN BLOCK ---");
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      identifier: "e2e_candidate@flareminds.com",
      password: "Password@123",
    });
    test("Unprovisioned employee login is blocked", false, "Logged in unexpectedly");
  } catch (err) {
    test(
      "Unprovisioned employee login is blocked (403)",
      err.response?.status === 403,
      err.response?.data?.message
    );
  }

  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 2: ROLE SELECTION RESTRICTIONS (GET /role/assignable-roles)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 2: ASSIGNABLE ROLES RESTRICTION ---");
  try {
    const hrAssignable = await axios.get(`${BASE_URL}/role/assignable-roles`, {
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    const roleCodes = hrAssignable.data.data.map((r) => r.roleCode);
    const hrSafe = !roleCodes.includes("OWNER") && !roleCodes.includes("ADMIN") && !roleCodes.includes("HR");
    test(
      "HR assignable roles strictly excludes Owner, Admin, and HR",
      hrSafe,
      `Roles: ${roleCodes.join(", ")}`
    );
  } catch (err) {
    test("HR assignable roles query", false, err.response?.data?.message || err.message);
  }

  try {
    const adminAssignable = await axios.get(`${BASE_URL}/role/assignable-roles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminRoleCodes = adminAssignable.data.data.map((r) => r.roleCode);
    const adminSafe = !adminRoleCodes.includes("OWNER") && !adminRoleCodes.includes("ADMIN") && adminRoleCodes.includes("HR");
    test(
      "Admin assignable roles excludes Owner and Admin, but includes HR",
      adminSafe,
      `Roles: ${adminRoleCodes.join(", ")}`
    );
  } catch (err) {
    test("Admin assignable roles query", false, err.response?.data?.message || err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 3: HR PROVISIONING & SECURITY BOUNDARIES
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 3: HR PROVISIONING & SECURITY BOUNDARIES ---");
  // 3.1 HR attempts to assign Admin role (MUST FAIL 403)
  try {
    await axios.post(
      `${BASE_URL}/user/provision-account`,
      {
        employeeId: candidateEmp._id,
        roleId: adminRole._id,
        password: "TempPassword@123",
      },
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    test("HR assigning Admin role is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("HR assigning Admin role is blocked (403)", err.response?.status === 403);
  }

  // 3.2 HR attempts to assign Owner role (MUST FAIL 403)
  try {
    await axios.post(
      `${BASE_URL}/user/provision-account`,
      {
        employeeId: candidateEmp._id,
        roleId: ownerRole._id,
        password: "TempPassword@123",
      },
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    test("HR assigning Owner role is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("HR assigning Owner role is blocked (403)", err.response?.status === 403);
  }

  // 3.3 HR attempts to assign HR role (MUST FAIL 403)
  try {
    await axios.post(
      `${BASE_URL}/user/provision-account`,
      {
        employeeId: candidateEmp._id,
        roleId: hrRole._id,
        password: "TempPassword@123",
      },
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    test("HR assigning HR role is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("HR assigning HR role is blocked (403)", err.response?.status === 403);
  }

  // 3.4 HR attempts to reassign role via /v2/updateRole (MUST FAIL 403 - missing user.manage_roles)
  try {
    await axios.put(
      `${BASE_URL}/user/v2/updateRole/${candidateEmp._id}`,
      { role: employeeRole._id },
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    test("HR managing roles via /updateRole is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("HR managing roles via /updateRole is blocked (403)", err.response?.status === 403);
  }

  // 3.5 HR attempts to create custom role via /custom-role (MUST FAIL 403 - isAdmin required)
  try {
    await axios.post(
      `${BASE_URL}/role/custom-role`,
      {
        roleName: "HR Escalation Attempt",
        priority: 3,
        permissionCodes: ["user.read"],
      },
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    test("HR creating custom role is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("HR creating custom role is blocked (403)", err.response?.status === 403);
  }

  // 3.6 HR attempts to modify Owner account (MUST FAIL 403)
  try {
    await axios.put(
      `${BASE_URL}/user/account-status/${ownerUser._id}`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    test("HR modifying Owner account is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("HR modifying Owner account is blocked (403)", err.response?.status === 403);
  }

  // 3.7 HR attempts to modify Admin account (MUST FAIL 403)
  try {
    await axios.put(
      `${BASE_URL}/user/account-status/${adminUser._id}`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    test("HR modifying Admin account is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("HR modifying Admin account is blocked (403)", err.response?.status === 403);
  }

  // 3.8 HR attempts to modify another HR account (MUST FAIL 403)
  try {
    await axios.put(
      `${BASE_URL}/user/account-status/${secondHrUser._id}`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    test("HR modifying another HR account is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("HR modifying another HR account is blocked (403)", err.response?.status === 403);
  }

  // 3.9 HR provisions employee account with Employee role (MUST SUCCEED 201)
  try {
    const provRes = await axios.post(
      `${BASE_URL}/user/provision-account`,
      {
        employeeId: candidateEmp._id,
        roleId: employeeRole._id,
        password: "MySecurePassword@123",
        isActive: true,
      },
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    test("HR provisions Employee account with Employee role (201)", provRes.status === 201);
  } catch (err) {
    test("HR provisions Employee account", false, err.response?.data?.message || err.message);
  }

  // 3.10 Duplicate Provisioning Prevention (MUST FAIL 400)
  try {
    await axios.post(
      `${BASE_URL}/user/provision-account`,
      {
        employeeId: candidateEmp._id,
        roleId: employeeRole._id,
        password: "AnotherPassword@123",
      },
      { headers: { Authorization: `Bearer ${hrToken}` } }
    );
    test("Duplicate account provisioning is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test(
      "Duplicate account provisioning is blocked (400)",
      err.response?.status === 400,
      err.response?.data?.message
    );
  }

  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 4: PROVISIONED EMPLOYEE LOGIN & ACCESS VERIFICATION
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 4: PROVISIONED EMPLOYEE LOGIN & ISOLATION ---");
  let newEmpToken = null;
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: "e2e_candidate@flareminds.com",
      password: "MySecurePassword@123",
    });
    newEmpToken = loginRes.data.token;
    test("Newly provisioned employee logs in successfully (200)", loginRes.status === 200);
  } catch (err) {
    test("Newly provisioned employee login", false, err.response?.data?.message || err.message);
  }

  if (newEmpToken) {
    try {
      const meRes = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${newEmpToken}` },
      });
      const { user, menus, permissions } = meRes.data.data;
      test(
        "Provisioned employee access context reflects Employee role",
        user.roleCode === "EMPLOYEE" &&
          menus.includes("ATTENDANCE") &&
          permissions.includes("attendance.punch_in") &&
          !permissions.includes("*")
      );
    } catch (err) {
      test("Provisioned employee access context", false, err.response?.data?.message || err.message);
    }

    // Employee cannot provision accounts (403)
    try {
      await axios.post(
        `${BASE_URL}/user/provision-account`,
        { employeeId: candidateEmp._id, roleId: employeeRole._id },
        { headers: { Authorization: `Bearer ${newEmpToken}` } }
      );
      test("Employee provisioning accounts is blocked", false, "Allowed unexpectedly");
    } catch (err) {
      test("Employee provisioning accounts is blocked (403)", err.response?.status === 403);
    }

    // Employee cannot manage roles (403)
    try {
      await axios.put(
        `${BASE_URL}/user/v2/updateRole/${candidateEmp._id}`,
        { role: employeeRole._id },
        { headers: { Authorization: `Bearer ${newEmpToken}` } }
      );
      test("Employee managing roles is blocked", false, "Allowed unexpectedly");
    } catch (err) {
      test("Employee managing roles is blocked (403)", err.response?.status === 403);
    }

    // Employee cannot create roles (403)
    try {
      await axios.post(
        `${BASE_URL}/role/custom-role`,
        { roleName: "Employee Escalation", priority: 3 },
        { headers: { Authorization: `Bearer ${newEmpToken}` } }
      );
      test("Employee creating roles is blocked", false, "Allowed unexpectedly");
    } catch (err) {
      test("Employee creating roles is blocked (403)", err.response?.status === 403);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 5: ADMIN AUTHORITY & SECURITY BOUNDARIES
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 5: ADMIN AUTHORITY & SECURITY BOUNDARIES ---");
  // 5.1 Admin attempts to assign Admin role (MUST FAIL 403)
  try {
    await axios.put(
      `${BASE_URL}/user/v2/updateRole/${candidateEmp._id}`,
      { role: adminRole._id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin assigning Admin role is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("Admin assigning Admin role is blocked (403)", err.response?.status === 403);
  }

  // 5.2 Admin attempts to assign Owner role (MUST FAIL 403)
  try {
    await axios.put(
      `${BASE_URL}/user/v2/updateRole/${candidateEmp._id}`,
      { role: ownerRole._id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin elevating user to Owner role is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("Admin elevating user to Owner role is blocked (403)", err.response?.status === 403);
  }

  // 5.3 Admin modifies Owner account (MUST FAIL 403)
  try {
    await axios.put(
      `${BASE_URL}/user/account-status/${ownerUser._id}`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin modifying Owner account is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("Admin modifying Owner account is blocked (403)", err.response?.status === 403);
  }

  // 5.4 Admin modifies another Admin account (MUST FAIL 403)
  try {
    await axios.put(
      `${BASE_URL}/user/account-status/${secondAdminUser._id}`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin modifying another Admin account is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("Admin modifying another Admin account is blocked (403)", err.response?.status === 403);
  }

  // 5.5 Admin creates custom operational role (MUST SUCCEED 201)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  let customRoleId = null;
  try {
    const customRoleRes = await axios.post(
      `${BASE_URL}/role/custom-role`,
      {
        roleName: `QA Lead Standard ${randomSuffix}`,
        description: "Quality assurance lead role",
        priority: 4,
        permissionCodes: ["project.read", "attendance.read.own"],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    customRoleId = customRoleRes.data.data._id;
    test("Admin creates custom operational role (201)", customRoleRes.status === 201);
  } catch (err) {
    test("Admin creates custom operational role", false, err.response?.data?.message || err.message);
  }

  // 5.6 Admin attempts to create custom role with priority 1 (MUST FAIL 403)
  try {
    await axios.post(
      `${BASE_URL}/role/custom-role`,
      {
        roleName: `Escalation Priority 1 ${randomSuffix}`,
        priority: 1,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin creating role with Priority 1 is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("Admin creating role with Priority 1 is blocked (403)", err.response?.status === 403);
  }

  // 5.7 Admin attempts to create custom role with priority 2 (MUST FAIL 403)
  try {
    await axios.post(
      `${BASE_URL}/role/custom-role`,
      {
        roleName: `Escalation Priority 2 ${randomSuffix}`,
        priority: 2,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin creating role with Priority 2 is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("Admin creating role with Priority 2 is blocked (403)", err.response?.status === 403);
  }

  // 5.8 Admin attempts to create custom role with wildcard '*' (MUST FAIL 403)
  try {
    await axios.post(
      `${BASE_URL}/role/custom-role`,
      {
        roleName: `Escalation Wildcard ${randomSuffix}`,
        priority: 3,
        permissionCodes: ["*"],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin creating role with Wildcard '*' is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("Admin creating role with Wildcard '*' is blocked (403)", err.response?.status === 403);
  }

  // 5.9 Admin attempts to create custom role with reserved roleCode 'HR' (MUST FAIL 403/409)
  try {
    await axios.post(
      `${BASE_URL}/role/custom-role`,
      {
        roleName: "HR",
        priority: 3,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin creating role with reserved roleCode 'HR' is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test(
      "Admin creating role with reserved roleCode 'HR' is blocked (403/409)",
      err.response?.status === 403 || err.response?.status === 409
    );
  }

  // 5.10 Admin attempts to create custom role with reserved roleCode 'EMPLOYEE' (MUST FAIL 403/409)
  try {
    await axios.post(
      `${BASE_URL}/role/custom-role`,
      {
        roleName: "Employee",
        priority: 3,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin creating role with reserved roleCode 'EMPLOYEE' is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test(
      "Admin creating role with reserved roleCode 'EMPLOYEE' is blocked (403/409)",
      err.response?.status === 403 || err.response?.status === 409
    );
  }

  // 5.11 Admin attempts to modify HR system role (MUST FAIL 403)
  try {
    await axios.put(
      `${BASE_URL}/role/custom-role/${hrRole._id}`,
      { roleName: "Hacked HR", priority: 4 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin modifying HR system role is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("Admin modifying HR system role is blocked (403)", err.response?.status === 403);
  }

  // 5.12 Admin attempts to delete HR system role (MUST FAIL 403)
  try {
    await axios.delete(
      `${BASE_URL}/role/${hrRole._id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin deleting HR system role is blocked", false, "Allowed unexpectedly");
  } catch (err) {
    test("Admin deleting HR system role is blocked (403)", err.response?.status === 403);
  }

  // 5.13 Admin assigns HR role to candidate employee (MUST SUCCEED 200)
  try {
    const adminAssignHrRes = await axios.put(
      `${BASE_URL}/user/v2/updateRole/${candidateEmp._id}`,
      { role: hrRole._id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    test("Admin assigns HR role to user (200)", adminAssignHrRes.status === 200);
  } catch (err) {
    test("Admin assigns HR role to user", false, err.response?.data?.message || err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 6: OWNER FULL SYSTEM AUTHORITY
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 6: OWNER FULL SYSTEM AUTHORITY ---");
  // 6.1 Owner assigns Admin role to user (MUST SUCCEED 200)
  try {
    const ownerAssignAdminRes = await axios.put(
      `${BASE_URL}/user/v2/updateRole/${candidateEmp._id}`,
      { role: adminRole._id },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    test("Owner assigns Admin role to user (200)", ownerAssignAdminRes.status === 200);
  } catch (err) {
    test("Owner assigns Admin role", false, err.response?.data?.message || err.message);
  }

  // 6.2 Owner modifies Admin account (MUST SUCCEED 200)
  try {
    const ownerModAdminRes = await axios.put(
      `${BASE_URL}/user/account-status/${adminUser._id}`,
      { isActive: true, isBlocked: false },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    test("Owner modifies Admin account status (200)", ownerModAdminRes.status === 200);
  } catch (err) {
    test("Owner modifies Admin account status", false, err.response?.data?.message || err.message);
  }

  // 6.3 Owner creates system role / high priority role (MUST SUCCEED 201)
  try {
    const ownerRoleRes = await axios.post(
      `${BASE_URL}/role/custom-role`,
      {
        roleName: `System Executive ${randomSuffix}`,
        priority: 2,
        isSystemRole: true,
        permissionCodes: ["user.read", "project.read"],
      },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    test("Owner creates high-priority system role (201)", ownerRoleRes.status === 201);
  } catch (err) {
    test("Owner creates system role", false, err.response?.data?.message || err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST GROUP 7: REGRESSION TESTS (ATTENDANCE & MENUS)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 7: REGRESSION VERIFICATION ---");
  try {
    const ownerMe = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    test(
      "Owner retains all system menus and full permissions",
      ownerMe.data.data.permissions.length >= 30 && ownerMe.data.data.menus.length >= 9
    );
  } catch (err) {
    test("Owner regression test", false, err.response?.data?.message || err.message);
  }

  // Cleanup created test custom role if created
  if (customRoleId) {
    await Role.deleteOne({ _id: customRoleId }).catch(() => {});
    await RoleMenu.deleteMany({ roleId: customRoleId }).catch(() => {});
    await RolePermission.deleteMany({ roleId: customRoleId }).catch(() => {});
  }

  await mongoose.disconnect();

  console.log("\n==================================================================");
  console.log(`TEST SUITE COMPLETED: ${results.filter((r) => r.passed).length} / ${results.length} PASSED`);
  console.log("==================================================================");

  if (results.some((r) => !r.passed)) {
    process.exit(1);
  }
}

runOnboardingAndProvisioningSuite().catch((e) => {
  console.error("Fatal Test Suite Error:", e);
  process.exit(1);
});
