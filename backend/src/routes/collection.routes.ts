import { Router } from "express";
import {
  createOwnedPokemon,
  updateOwnedPokemon,
  deleteOwnedPokemon,
  getCollectionSummary,
} from "../controllers/collection.controller.js";

const router = Router();

router.get("/summary", getCollectionSummary);
router.post("/", createOwnedPokemon);
router.patch("/:id", updateOwnedPokemon);
router.delete("/:id", deleteOwnedPokemon);

export default router;