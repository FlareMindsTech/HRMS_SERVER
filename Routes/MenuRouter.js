import express from 'express';
import { createMenu, getAllMenu, getMenuId, updateMenu, deleteMenu } from '../Controller/MenuController.js';
import { Authentication } from '../Middleware/Auth.js';

const router = express.Router();

router.post("/create-menu", Authentication, createMenu);
router.get("/getAll-menu", Authentication, getAllMenu);
router.get("/getById-menu/:id", Authentication, getMenuId);
router.put("/update-menu/:id", Authentication, updateMenu);
router.put("/update-menu", Authentication, updateMenu);
router.delete("/delete-menu/:id", Authentication, deleteMenu);

export default router;