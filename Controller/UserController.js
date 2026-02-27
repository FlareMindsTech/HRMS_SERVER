// import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../Modules/UserModule.js';
import axios from 'axios';
// import { checkAccessCreate, checkAccessDelete, checkAccessGet, checkAccessUpdate } from "../config/checkAccess.js";


const saltRounds = 10;
// dotenv.config();

import Role from '../Modules/RoleModules.js';

export const Register = async (req, res) => {
    console.log(req.body);
    let email = req.body.email
    let roleName = req.body.role;
    // let menu = req.body.menuId
    // let obj =await checkAccessCreate(req.user, menu)
    // if (obj.access == false && obj.message !== null) return res.status(obj.status).json({ message: obj.message});
    
    let exUser = await User.findOne({ email: email })
    if (exUser) {
        return res.status(400).json({ message: "email already register" })
    }
    
    let roleDoc = await Role.findOne({ roleName: roleName });
    if (!roleDoc) {
        return res.status(400).json({ message: "Invalid role specified" });
    }

    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
        let register = new User({
            email: req.body.email,
            password: hash,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            dob: req.body.dob,
            gender: req.body.gender,
            bloodGroup: req.body.bloodGroup,
            marriageStatus: req.body.marriageStatus,
            mobileNo: req.body.mobileNo,
            role: roleDoc._id,
        })
        try {
            let user=await register.save()
            res.status(201).json({ message: "Register success" ,id:user._id})
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    })
}


export const ownerReg = async (req, res) => {
    let email = req.body.email
    let exUser = await User.findOne({ email: email })
    if (exUser) {
        return res.json({ message: "email exists please login" })
    }
    else {
        bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
            let register = new User({
                email: req.body.email,
                password: hash,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                dob: req.body.dob,
                gender: req.body.gender,
                bloodGroup: req.body.bloodGroup,
                marriageStatus: req.body.marriageStatus,
                mobileNo: req.body.mobileNo,
                isOwner: true
            })
            try {
                await register.save()
                res.status(201).json({ message: "Owner Register success" })
            } catch (error) {
                res.status(400).json({ message: error.message });
            }
        })
    }
}

export const employeeInternReg = async (req, res) => {
    let email = req.body.email
    let tlId = req.body.tlId;
    let employeeId = req.body.employeeId;
    let roleName = req.body.role;

    // both need a role
    let roleDoc = await Role.findOne({ roleName: roleName });
    if (!roleDoc) {
        return res.status(400).json({ message: "Invalid role specified" });
    }

    // role-specific validation
    if (roleDoc.roleName.toLowerCase() === "employee" && !tlId) {
        return res.status(400).json({ message: "tlId is required for Employee registration" })
    }
    if (roleDoc.roleName.toLowerCase() === "intern" && !employeeId) {
        return res.status(400).json({ message: "employeeId is required for Intern registration to map to an employee" })
    }

    let exUser = await User.findOne({ email: email })
    if (exUser) {
        return res.status(400).json({ message: "email already register" })
    }
    
    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
        let register = new User({
            email: req.body.email,
            password: hash,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            dob: req.body.dob,
            gender: req.body.gender,
            bloodGroup: req.body.bloodGroup,
            marriageStatus: req.body.marriageStatus,
            mobileNo: req.body.mobileNo,
            role: roleDoc._id,
            tlId: tlId || undefined,
            employeeId: employeeId || undefined
        })
        try {
            let user=await register.save()
            // Dynamic Success Message
            res.status(201).json({ message: `${roleDoc.roleName} Register success` ,id:user._id})
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    })
}

export const managementReg = async (req, res) => {
    let email = req.body.email
    let isOwner = req.body.isOwner || false
    let roleName = req.body.role;

    let exUser = await User.findOne({ email: email })
    if (exUser) {
        return res.status(400).json({ message: "email already register" })
    }
    
    let roleDoc = await Role.findOne({ roleName: roleName });
    if (!roleDoc) {
        return res.status(400).json({ message: "Invalid role specified" });
    }

    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
        let register = new User({
            email: req.body.email,
            password: hash,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            dob: req.body.dob,
            gender: req.body.gender,
            bloodGroup: req.body.bloodGroup,
            marriageStatus: req.body.marriageStatus,
            mobileNo: req.body.mobileNo,
            role: roleDoc._id, 
            isOwner: isOwner 
        })
        try {
            let user=await register.save()
            // Dynamic Success Message
            res.status(201).json({ message: `${roleDoc.roleName} Registration success` ,id:user._id})
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    })
}



import Attendance from '../Modules/AttendanceModule.js';

// haversine formula to calculate distance in meters
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    if(!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3; // Earth radius in meters
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Function to reverse geocode lat/lng to an address
async function getAddressFromCoordinates(lat, lon) {
    if (!lat || !lon) return "";
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            {
                headers: {
                    'User-Agent': 'HRMS_SERVER_App/1.0 (contact@flareminds.com)'
                }
            }
        );
        return response.data.display_name || "";
    } catch (error) {
        console.error("Geocoding error:", error);
        return "";
    }
}

export const login = async (req, res) => {
    let email = req.body.email
    let foundUser = await User.findOne({ email: email })
    
    if (foundUser) {
        bcrypt.compare(req.body.password, foundUser.password, async (err, result) => {
            if (result) {
                const now = new Date();
                let locationType = "WFH"; // Default
                
                // Attendance geo-fencing check
                if (req.body.latitude && req.body.longitude) {
                    const officeLat = process.env.OFFICE_LATITUDE || 11.023986; // Fallback for testing
                    const officeLon = process.env.OFFICE_LONGITUDE || 77.122534;
                    const officeRadius = process.env.OFFICE_RADIUS_METERS || 200;
                    
                    const distance = getDistanceInMeters(req.body.latitude, req.body.longitude, officeLat, officeLon);
                    
                    if (distance !== null && distance <= officeRadius) {
                        locationType = "Office";
                    }
                }
                
                // Block if trying to WFH without approval
                if (locationType === "WFH" && foundUser.isWfhApproved !== true) {
                    return res.status(403).json({ message: "Login restricted: You must be at the office or have WFH management approval." });
                }

                // Update live location
                let finalAddress = req.body.address || "";
                
                if (req.body.latitude && req.body.longitude && !finalAddress) {
                    finalAddress = await getAddressFromCoordinates(req.body.latitude, req.body.longitude);
                }

                if (req.body.latitude && req.body.longitude) {
                    foundUser.lastLoginLocation = {
                        latitude: req.body.latitude,
                        longitude: req.body.longitude,
                        address: finalAddress,
                        timestamp: now
                    };
                    await foundUser.save();
                }

                // time check for late (Shift: 9:00 AM to 6:00 PM)
                // assuming timezone matches server
                const hours = now.getHours();
                const minutes = now.getMinutes();
                
                // if they log in at 9:01 AM or later, it is considered Late (Half Day)
                const isLate = (hours > 9) || (hours === 9 && minutes > 0);
                
                const attendanceStatus = isLate ? "Half Day" : "Pending Full Day";

                // Create Attendance Record
                const dateString = now.toISOString().split('T')[0];
                let todayAttendance = await Attendance.findOne({ userId: foundUser._id, date: dateString });
                
                if (!todayAttendance) {
                    todayAttendance = new Attendance({
                        userId: foundUser._id,
                        date: dateString,
                        loginTime: now,
                        locationType: locationType,
                        status: attendanceStatus
                    });
                    await todayAttendance.save();
                }

                // 9 Hour token expiry (9 AM to 6 PM) with a fallback secret if .env is missing
                const token = jwt.sign(
                    { id: foundUser?._id, attendanceId: todayAttendance._id }, 
                    process.env.JWT || "fallback_hrms_secret_key", 
                    { expiresIn: '9h' }
                )
                
                // construct the response
                let responsePayload = {
                    message: "login successfully",
                    token: token,
                    attendanceStatus: todayAttendance.status,
                    locationType: locationType
                };

                // add location data to response if it exists
                if (foundUser.lastLoginLocation && foundUser.lastLoginLocation.latitude) {
                    responsePayload.location = {
                        latitude: foundUser.lastLoginLocation.latitude,
                        longitude: foundUser.lastLoginLocation.longitude,
                        address: foundUser.lastLoginLocation.address || ""
                    };
                }

                res.header("hrms-auth-token", token).json(responsePayload)
            } else {
                res.status(400).json({ message: "please enter correct password" })
            }
        })
    }else{
        res.status(404).json({ message: "user not found" })
    }
}

export const logout = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];

        let todayAttendance = await Attendance.findOne({ userId: userId, date: dateString });
        
        if (todayAttendance && !todayAttendance.logoutTime) {
            todayAttendance.logoutTime = now;
            
            // Calculate total hours
            const diffMs = now - new Date(todayAttendance.loginTime);
            const diffHrs = diffMs / (1000 * 60 * 60);
            todayAttendance.totalHours = parseFloat(diffHrs.toFixed(2));
            
            // update status to Full Day if 8+ hours
            if (todayAttendance.status === 'Pending Full Day' && diffHrs >= 8) {
                todayAttendance.status = 'Full Day';
            }
            
            await todayAttendance.save();
        }

        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update the User
export const updateUser = async (req, res) => {
    try {
        // let menu = req.body.menuId
        // let obj =await checkAccessUpdate(req.user, menu)
        // if (obj.access == false && obj.message !== null) return res.status(obj.status).json({ message: obj.message});
        const user = await User.findByIdAndUpdate(req.body.id, { $set: req.body }, { new: true })
        res.status(200).json({ meesage: "Updated successfully" })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
export const upRoleUser = async (req, res) => {
    try {
        // let menu = req.body.menuId
        // let obj =await checkAccessUpdate(req.user, menu)
        // if (obj.access == false && obj.message !== null) return res.status(obj.status).json({ message: obj.message});
        const user = await User.findByIdAndUpdate(req.params.id, { $set: {role:req.body.role}}, { new: true })
        res.status(200).json({ meesage: "Updated successfully" })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const deleteUser = async (req, res) => {
    let email = req.body.email
    // let menu = req.body.menuId
    // let obj =await checkAccessDelete(req.user, menu)
    // if (obj.access == false && obj.message !== null) return res.status(obj.status).json({ message: obj.message});
    try {
        const user = await User.findOneAndRemove({ email: email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: "User deleted success" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const profile = async (req, res) => {
    try {
        const view = await User.findById({ _id: req.user.id }).select("-password")
        res.status(200).json({ data: view })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

}

export const getAllUser = async (req, res) => {
    try {
        const users = await User.find().populate("role").select("-password").lean();
        
        const mappedUsers = [];
        const tlIndexMap = new Map();
        const employeeIndexMap = new Map();

        // Pass 1: Add TLs and non-employees/non-interns to map
        // Also initialize `employees` and `interns` arrays
        users.forEach(user => {
            user.employees = []; 
            user.interns = [];
            
            if (!user.tlId && !user.employeeId) {
                mappedUsers.push(user);
                tlIndexMap.set(user._id.toString(), user);
            }
            // If they are an employee, we will need to map interns to them
            if (user.tlId) {
                employeeIndexMap.set(user._id.toString(), user);
            }
        });

        // Pass 2: MAP Interns into their Employee's array
        users.forEach(user => {
            if (user.employeeId) {
                const employee = employeeIndexMap.get(user.employeeId.toString());
                if (employee) {
                    employee.interns.push(user);
                } else {
                    // Fallback if Employee ID exists but Employee wasn't found
                    mappedUsers.push(user); 
                }
            }
        });

        // Pass 3: MAP Employees into their TL's array
        users.forEach(user => {
            if (user.tlId) {
                const tl = tlIndexMap.get(user.tlId.toString());
                if (tl) {
                    tl.employees.push(user);
                } else {
                    // Fallback if TL ID exists but TL wasn't found
                    mappedUsers.push(user); 
                }
            }
        });

        // Helper function to recursively remove empty arrays
        const cleanEmptyArrays = (userObj) => {
            if (userObj.employees && userObj.employees.length === 0) {
                delete userObj.employees;
            } else if (userObj.employees) {
                userObj.employees.forEach(cleanEmptyArrays);
            }

            if (userObj.interns && userObj.interns.length === 0) {
                delete userObj.interns;
            } else if (userObj.interns) {
                userObj.interns.forEach(cleanEmptyArrays);
            }
        };

        // Pass 4: Clean up empty arrays
        mappedUsers.forEach(cleanEmptyArrays);

        res.status(200).json({ data: mappedUsers })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const getNoOwner = async (req, res) => {
    try {
        let data=[]
        const getUser = await User.find().populate("role").populate("tlId", "-password").select("-password")
        getUser.map((item)=>{
            if(item.isOwner == true){
                getUser.splice(0,1)
            }
        })
        data.push(getUser)
        res.status(200).json({ data: data })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const getUserById = async (req, res) => {
    try {
        const getUser = await User.findById({ _id: req.params.id }).populate("role").populate("tlId", "-password").select("-password")
        res.status(200).json({ data: getUser })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
        
    }

