
import { Router } from "express";
import {
  getHunts,
  createHunt,
  updateHunt,
  addEncounters,
  deleteHunt,
  completeHunt,
} from "../controllers/hunt.controller.js";

import {
  getHuntPhases,
  createHuntPhase,
} from "../controllers/huntPhase.controller.js";

const router = Router();

router.get("/", getHunts);
router.post("/", createHunt);
router.patch("/:id", updateHunt);
router.post("/:id/encounters", addEncounters);
router.post("/:id/complete", completeHunt);
router.delete("/:id", deleteHunt);
router.get("/:id/phases", getHuntPhases);
router.post("/:id/phases", createHuntPhase);

export default router;
