const express = require("express");
const authController = require("../controllers/authController");
const peopleController = require("../controllers/peopleController");
const upload = require("../config/multer");

const router = express.Router();

// People management dashboard
router.get(
  "/dashboard/people",
  authController.requireLogin,
  peopleController.renderPeoplePage
);

// People statistics and data
router.get(
  "/api/people/stats",
  authController.requireLogin,
  peopleController.getPeopleStats
);
router.get(
  "/api/people",
  authController.requireLogin,
  peopleController.getAllPeople
);

// People search
router.get(
  "/api/people/search",
  authController.requireLogin,
  peopleController.searchPeopleQuick
);
router.post(
  "/api/search-people-advanced",
  authController.requireLogin,
  peopleController.searchPeople
);

// Person CRUD operations
router.post(
  "/api/add-person",
  authController.requireLogin,
  peopleController.addPerson
);
router.post(
  "/api/update-person/:id",
  authController.requireLogin,
  peopleController.updatePerson
);
router.delete(
  "/api/delete-person/:id",
  authController.requireLogin,
  peopleController.deletePerson
);
router.get(
  "/api/person-details/:id",
  authController.requireLogin,
  peopleController.getPersonDetails
);

// Family members
router.post(
  "/api/add-family-member",
  authController.requireLogin,
  peopleController.addFamilyMember
);

// People by category
router.get(
  "/api/people-by-category/:category_id",
  authController.requireLogin,
  peopleController.getPeopleByCategory
);

// Bulk operations
router.post(
  "/api/bulk-import-people",
  authController.requireLogin,
  upload.single("csvFile"),
  peopleController.bulkImportPeople
);

// Categories API
router.get(
  "/api/categories",
  authController.requireApiAuth,
  async (req, res) => {
    try {
      const DatabaseHelper = require("../config/dbHelper");
      const categories = await DatabaseHelper.query(
        "SELECT * FROM categories ORDER BY name"
      );
      res.json({ success: true, categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res
        .status(500)
        .json({ success: false, message: "Error fetching categories" });
    }
  }
);

module.exports = router;
