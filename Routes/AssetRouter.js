import express from "express";
import {
  createAsset,
  assignAsset,
  returnAsset,
  getAssets,
} from "../Controller/AssetController.js";
import { Authendication } from "../Middleware/Auth.js";

const router = express.Router();

router.use(Authendication);

router.post("/create", createAsset);
router.post("/assign", assignAsset);
router.put("/:assetId/return", returnAsset);
router.get("/all", getAssets);

export default router;
