import express from "express";
import { identificationController } from "../controllers/identificationController.js";

const router = express.Router();

router.post("/identify", identificationController);

export default router;