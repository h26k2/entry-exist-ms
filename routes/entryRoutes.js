const express = require("express");
const authController = require("../controllers/authController");
const entryController = require("../controllers/entryController");

const router = express.Router();

// Entry management dashboard
router.get(
  "/dashboard/entry",
  authController.requireLogin,
  entryController.renderEntryPage
);

router.post(
  "/api/generate-card",
  authController.requireLogin,
  entryController.generateCard
);

// Person search for entry/exit
router.post(
  "/api/search-person",
  authController.requireLogin,
  entryController.searchPerson
);
router.post(
  "/api/search-person-inside",
  authController.requireLogin,
  entryController.searchPersonInside
);

// Person registration (from entry context)
router.post(
  "/api/register-person",
  authController.requireLogin,
  entryController.registerPerson
);

// Entry/exit processing
router.post(
  "/api/process-entry",
  authController.requireLogin,
  entryController.processEntry
);
router.post(
  "/api/process-exit",
  authController.requireLogin,
  entryController.processExit
);

// Fee deposits

// Current occupancy API for header

// Fee deposits
router.post(
  "/api/add-fee-deposit",
  authController.requireLogin,
  entryController.addFeeDeposit
);
router.get(
  "/api/person-deposits/:person_id",
  authController.requireLogin,
  entryController.getPersonDeposits
);

module.exports = router;
