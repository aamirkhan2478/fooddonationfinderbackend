import express from "express";
import {
  createItem,
  getItems,
  deleteItem,
  getItem,
  updateItem,
} from "../controllers/item.controller.mjs";
import auth from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.post("/add", auth, createItem);
router.get("/all", auth, getItems);
router.get("/:id/show", auth, getItem);
router.delete("/:id/delete", auth, deleteItem);
router.put("/:id/update", auth, updateItem);

export default router;
