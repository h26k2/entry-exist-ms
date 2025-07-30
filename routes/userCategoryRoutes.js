const express = require("express");
const router = express.Router();
const userCategoryController = require("../controllers/userCategoryController");
const userCategoryApiController = require("../controllers/userCategoryApiController");

// API routes
router.get("/api/user-categories", userCategoryApiController.getAll);
router.post("/api/user-categories", userCategoryApiController.create);
router.put("/api/user-categories/:id", userCategoryApiController.update);
router.delete("/api/user-categories/:id", userCategoryApiController.delete);

router.get("/", userCategoryController.getAllCategories);
router.post("/", userCategoryController.addCategory);
router.put("/:id", userCategoryController.updateCategory);
router.delete("/:id", userCategoryController.deleteCategory);

module.exports = router;
