import express from "express";
import {
  createAddress,
  getAddressByUser,
  updateAddress,
  deleteAddress
} from "../Controller/AddressController.js";

import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/create", createAddress);
router.get("/get",getAddressByUser);
router.put("/update/:id",updateAddress);
router.delete("/delete/:id",deleteAddress);

export default router;
