import express from "express";
import {
  createItem,
  getItems,
  deleteItem,
  getItem,
  updateItem,
  updateItemImage
} from "../controllers/item.controller.mjs";
import auth from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.post("/add",  createItem);
router.get("/all",  getItems);
router.get("/:id/show",  getItem);
router.delete("/:id/delete",  deleteItem);
router.put("/:id/update",  updateItem);
router.patch("/:id/update-image",  updateItemImage);

export default router;
