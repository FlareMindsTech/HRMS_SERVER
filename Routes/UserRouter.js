import express from "express";
import { deleteUser, getAllUser, getNoOwner, getUserById, login, ownerReg, profile, Register, updateUser } from "../Controller/UserController.js";
import { Authendication } from "../Middleware/Auth.js";
const router = express.Router();

router.post("/login",login)
router.get("/profile",Authendication,profile)
router.post("/v1/ownerReg",ownerReg)
// router.delete("/v2/currentCompany",currentCompany)

router.post("/v2/reg",  Register)
router.put("/v2/update",  updateUser)
router.delete("/v2/deleteUser",  deleteUser)
router.get("/get",  getAllUser)
router.get("/noOwner",  getNoOwner)
router.get("/v2/getbyid/:id", getUserById)




export default router   