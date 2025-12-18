import express from 'express';
import { createMenu,getAllMenu,getMenuId,updateMenu,deleteMenu } from '../Controller/MenuController.js';

const router = express.Router();

router.post("/create-menu", createMenu);
router.get("/getAll-menu", getAllMenu);
router.get("/getById-menu/:id", getMenuId);
router.put("/update-menu", updateMenu);
router.delete("/delete-menu/:id", deleteMenu);

export default router;