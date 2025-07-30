const express = require("express");
const router = express.Router();
const cardController = require("../controllers/cardController");
const {
  requireLogin,
  requireApiAuth,
} = require("../controllers/authController");

// Page routes
router.get("/", requireLogin, cardController.renderCardManagementPage);

// API routes
router.get("/api/cards", requireApiAuth, cardController.getAllCards);
router.get("/api/cards/stats", requireApiAuth, cardController.getCardStats);
router.get("/api/cards/:id", requireApiAuth, cardController.getCardDetails);
router.put("/api/cards/:id", requireApiAuth, cardController.updateCardStatus);
router.delete("/api/cards/:id", requireApiAuth, cardController.deleteCard);
router.post("/api/cards", requireApiAuth, cardController.createCard);
router.post(
  "/api/cards/regenerate/:id",
  requireApiAuth,
  cardController.regenerateQRCode
);

// QR Code scanning endpoint
router.post("/api/scan-qr", requireApiAuth, cardController.scanQRCode);

module.exports = router;
