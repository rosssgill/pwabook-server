import express, { application } from "express";
import { createSubscription } from "../controllers/pushMessage.js";

const router = express.Router();

router.post("/subscribe", createSubscription); // http://localhost:5000/push/subscribe

export default router;
