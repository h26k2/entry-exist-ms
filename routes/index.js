/**
 * Route Index File
 *
   app.use("/", adminRoutes);
  app.use("/", deviceRoutes);
  // Register user category routes
  app.use("/user-category", require("./userCategoryRoutes"));
  app.use("/api/user-categories", userCategoryRoutes);is file provides a central location to manage all route imports
 * and can be used for route documentation or middleware application.
 */

// Import all route modules
const authRoutes = require("./authRoutes");
const entryRoutes = require("./entryRoutes");
const peopleRoutes = require("./peopleRoutes");
const facilityRoutes = require("./facilityRoutes");
const reportRoutes = require("./reportRoutes");
const adminRoutes = require("./adminRoutes");
const userCategoryRoutes = require("./userCategoryRoutes");
const deviceRoutes = require("./deviceRoutes");
const userRoutes = require("./userRoutes");

/**
 * Initialize all routes with the Express app
 * @param {Express} app - Express application instance
 */
function initializeRoutes(app) {
  // Core authentication routes
  app.use("/", authRoutes);

  // Feature-specific routes
  app.use("/", entryRoutes);
  app.use("/", peopleRoutes);
  app.use("/", facilityRoutes);
  app.use("/", reportRoutes);
  app.use("/", adminRoutes);
  app.use("/", deviceRoutes);
  app.use("/", userRoutes);
  // Register user category routes
  app.use("/user-category", require("./userCategoryRoutes"));
  app.use("/api/user-categories", userCategoryRoutes);
}

/**
 * Route structure documentation
 */
const routeStructure = {
  authRoutes: {
    description: "Authentication and core dashboard routes",
    endpoints: ["/", "/login", "/logout", "/dashboard"],
  },
  entryRoutes: {
    description: "Entry/exit management and card generation",
    endpoints: [
      "/dashboard/entry",
      "/api/process-entry",
      "/api/process-exit",
      "/api/generate-card",
    ],
  },
  peopleRoutes: {
    description: "People management and categories",
    endpoints: [
      "/dashboard/people",
      "/api/people/*",
      "/api/add-person",
      "/api/categories",
    ],
  },
  facilityRoutes: {
    description: "Facility management (admin only)",
    endpoints: ["/dashboard/facilities", "/api/facility-*"],
  },
  reportRoutes: {
    description: "Reports and analytics",
    endpoints: ["/dashboard/reports", "/api/*-report", "/api/export-data"],
  },
  adminRoutes: {
    description: "Admin-specific routes (operators, cache)",
    endpoints: ["/dashboard/operator", "/admin/cache/*"],
  },

  userCategoryRoutes: {
    description: "User category management",
    endpoints: ["/user-category", "/api/user-categories"],
  },
  userRoutes: {
    description: "ZKBioTime user management",
    endpoints: ["/dashboard/users", "/api/users", "/api/add-user"],
  },
  deviceRoutes: {
    description: "Device management and monitoring",
    endpoints: ["/dashboard/devices"],
  },
};

module.exports = {
  initializeRoutes,
  routeStructure,
  // Individual route exports for direct access
  authRoutes,
  entryRoutes,
  peopleRoutes,
  facilityRoutes,
  reportRoutes,
  adminRoutes,
  userCategoryRoutes,
  userRoutes,
  deviceRoutes,
};
