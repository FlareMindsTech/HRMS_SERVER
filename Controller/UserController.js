// import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../Modules/UserModule.js';
// import { checkAccessCreate, checkAccessDelete, checkAccessGet, checkAccessUpdate } from "../config/checkAccess.js";


const saltRounds = 10;
// dotenv.config();

export const Register = async (req, res) => {
    console.log(req.body);
    let email = req.body.email
    // let menu = req.body.menuId
    // let obj =await checkAccessCreate(req.user, menu)
    // if (obj.access == false && obj.message !== null) return res.status(obj.status).json({ message: obj.message});
    let exUser = await User.findOne({ email: email })
    if (exUser) {
        return res.status(400).json({ message: "email already register" })
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
                role: req.body.role,
            })
            try {
                let user=await register.save()
                res.status(201).json({ message: "Register success" ,id:user._id})
            } catch (error) {
                res.status(400).json({ message: error.message });
            }
        })
    }
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

export const login = async (req, res) => {
    let email = req.body.email
    let foundUser = await User.findOne({ email: email })
    if (foundUser) {
        bcrypt.compare(req.body.password, foundUser.password, (err, result) => {
            if (result) {
                const token = jwt.sign({ id: foundUser?._id }, process.env.JWT)
                res.header("hrms-auth-token", token).json({ message: "login successfully", token: token })
            } else {
                res.status(400).json({ message: "please enter correct password" })
            }
        })
    }else{
        res.status(404).json({ message: "user not found" })
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
        const getUser = await User.find().select("-password")
        res.status(200).json({ data: getUser })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
export const getNoOwner = async (req, res) => {
    try {
        let data=[]
        const getUser = await User.find().select("-password")
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
        const getUser = await User.findById({ _id: req.params.id }).select("-password")
        res.status(200).json({ data: getUser })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
        
    }

