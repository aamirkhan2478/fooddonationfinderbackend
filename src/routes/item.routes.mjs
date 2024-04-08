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
router.get("/show/:id", auth, getItem);
router.delete("/delete/:id", auth, deleteItem);
router.put("/update/:id", auth, updateItem);