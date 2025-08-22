const bcrypt = require("bcrypt");
const db = require("../config/db");
const DatabaseHelper = require("../config/dbHelper");

// In-memory cache for user data and login attempts
const userCache = new Map();
const loginAttempts = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Cache management functions
function getCachedUser(cnic) {
  const cached = userCache.get(cnic);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.user;
  }
  userCache.delete(cnic);
  return null;
}

function setCachedUser(cnic, user) {
  userCache.set(cnic, {
    user: { ...user, password: undefined }, // Don't cache password
    timestamp: Date.now(),
  });
}

function getLoginAttempts(identifier) {
  const attempts = loginAttempts.get(identifier);
  if (attempts && Date.now() - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(identifier);
    return { count: 0, lockedUntil: null };
  }
  return attempts || { count: 0, lockedUntil: null };
}

function recordLoginAttempt(identifier, success = false) {
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }

  const attempts = getLoginAttempts(identifier);
  const newCount = attempts.count + 1;
  const now = Date.now();

  loginAttempts.set(identifier, {
    count: newCount,
    lastAttempt: now,
    lockedUntil: newCount >= MAX_LOGIN_ATTEMPTS ? now + LOCKOUT_DURATION : null,
  });
}

function isAccountLocked(identifier) {
  const attempts = getLoginAttempts(identifier);
  return attempts.lockedUntil && Date.now() < attempts.lockedUntil;
}

function getRemainingLockoutTime(identifier) {
  const attempts = getLoginAttempts(identifier);
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60); // minutes
  }
  return 0;
}

exports.renderLoginPage = (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  const error = req.query.error || null;
  const message = req.query.message || null;

  res.render("login", {
    error,
    message,
    remainingAttempts: null,
    lockoutTime: null,
  });
};

exports.login = async (req, res) => {
  const { number, password, rememberMe } = req.body;

  const cnic = number.replace(/\D/g, "");
  const clientIP = req.ip || req.connection.remoteAddress;
  const identifier = `${cnic}_${clientIP}`;

  try {
    // Validate CNIC format
    if (cnic.length !== 13) {
      return res.render("login", {
        error: "Please enter a valid 13-digit CNIC number",
        message: null,
        remainingAttempts: null,
        lockoutTime: null,
      });
    }

    // Check if account is locked
    if (isAccountLocked(identifier)) {
      const remainingTime = getRemainingLockoutTime(identifier);
      return res.render("login", {
        error: `Account temporarily locked due to multiple failed attempts. Try again in ${remainingTime} minutes.`,
        message: null,
        remainingAttempts: null,
        lockoutTime: remainingTime,
      });
    }

    // Try to get user from cache first
    let user = getCachedUser(cnic);
    let fullUser = null;

    if (!user) {
      // Not in cache, query database
      const results = await DatabaseHelper.query(
        "SELECT * FROM users WHERE cnic_num = ?",
        [cnic]
      );

      if (results.length === 0) {
        recordLoginAttempt(identifier, false);
        const attempts = getLoginAttempts(identifier);
        const remaining = MAX_LOGIN_ATTEMPTS - attempts.count;

        return res.render("login", {
          error: "User not found",
          message: null,
          remainingAttempts: remaining > 0 ? remaining : null,
          lockoutTime: null,
        });
      }

      fullUser = results[0];
      user = { ...fullUser, password: undefined };
      setCachedUser(cnic, fullUser);
    } else {
      // Get full user data for password verification
      const results = await DatabaseHelper.query(
        "SELECT password FROM users WHERE cnic_num = ?",
        [cnic]
      );
      if (results.length > 0) {
        fullUser = { ...user, password: results[0].password };
      }
    }

    if (!fullUser) {
      recordLoginAttempt(identifier, false);
      return res.render("login", {
        error: "Authentication error",
        message: null,
        remainingAttempts: null,
        lockoutTime: null,
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, fullUser.password);

    if (match) {
      // Successful login
      recordLoginAttempt(identifier, true);

      // Update last login time
      await DatabaseHelper.execute(
        "UPDATE users SET last_login = NOW() WHERE cnic_num = ?",
        [cnic]
      );

      // Create session
      req.session.user = {
        id: fullUser.id,
        cnic_num: fullUser.cnic_num,
        name: fullUser.name,
        role: fullUser.role,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      // Set cookie expiration based on "Remember Me"
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      }

      // Regenerate session ID for security
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
        }

        req.session.user = {
          id: fullUser.id,
          cnic_num: fullUser.cnic_num,
          name: fullUser.name,
          role: fullUser.role,
          loginTime: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        };

        res.redirect("/dashboard");
      });
    } else {
      // Failed login
      recordLoginAttempt(identifier, false);
      const attempts = getLoginAttempts(identifier);
      const remaining = MAX_LOGIN_ATTEMPTS - attempts.count;

      let errorMessage = "Invalid password";
      if (remaining <= 2 && remaining > 0) {
        errorMessage += `. ${remaining} attempt(s) remaining before lockout.`;
      }

      res.render("login", {
        error: errorMessage,
        message: null,
        remainingAttempts: remaining > 0 ? remaining : null,
        lockoutTime: null,
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", {
      error: "An error occurred during login. Please try again.",
      message: null,
      remainingAttempts: null,
      lockoutTime: null,
    });
  }
};

exports.logout = (req, res) => {
  const userId = req.session.user?.id;

  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.redirect("/dashboard");
    }

    res.clearCookie("entry.sid");
    res.redirect("/?message=Successfully logged out");
  });
};

exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/?error=Please log in to access this page");
  }

  // Update last activity
  req.session.user.lastActivity = new Date().toISOString();

  // Check session expiration (optional additional check)
  const loginTime = new Date(req.session.user.loginTime);
  const now = new Date();
  const sessionDuration = now - loginTime;
  const maxSessionDuration = 24 * 60 * 60 * 1000; // 24 hours

  if (sessionDuration > maxSessionDuration) {
    req.session.destroy((err) => {
      res.redirect("/?error=Session expired. Please log in again.");
    });
    return;
  }

  next();
};

// API Authentication middleware - returns JSON instead of redirecting
exports.requireApiAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Update last activity
  req.session.user.lastActivity = new Date().toISOString();

  // Check session expiration (optional additional check)
  const loginTime = new Date(req.session.user.loginTime);
  const now = new Date();
  const sessionDuration = now - loginTime;
  const maxSessionDuration = 24 * 60 * 60 * 1000; // 24 hours

  if (sessionDuration > maxSessionDuration) {
    req.session.destroy((err) => {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    });
    return;
  }

  next();
};

exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/?error=Please log in to access this page");
    }

    const userRole = req.session.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).render("error", {
        user: req.session.user,
        error: "Access denied. Insufficient permissions.",
        title: "Access Denied",
      });
    }

    next();
  };
};

exports.dashboard = (req, res) => {
  const { createAuthenticatedClient } = require('../utils/zkbiotime');
  createAuthenticatedClient()
    .then(async (client) => {
      const response = await client.get('/iclock/api/transactions/?page_size=10');
      const recentActivities = response.data.data || [];
      res.render("dashboard", {
        user: req.session.user,
        activePage: "dashboard",
        title: "Dashboard",
        recentActivities,
      });
    })
    .catch((err) => {
      console.error("[Dashboard] Error:", err);
      res.render("dashboard", {
        user: req.session.user,
        activePage: "dashboard",
        title: "Dashboard",
        recentActivities: [],
        error: "Failed to load recent activities.",
      });
    });
};

exports.allActivities = (req, res) => {
  createAuthenticatedClient()
    .then(async (client) => {
      const response = await client.get('/iclock/api/transactions/?page_size=100');
      const recentActivities = response.data.data || [];
      res.render("all-activities", {
        user: req.session.user,
        activePage: "dashboard",
        recentActivities,
      });
    })
    .catch((err) => {
      console.error("[All Activities] Error:", err);
      res.render("all-activities", {
        user: req.session.user,
        recentActivities: [],
        error: "Failed to load activities.",
      });
    });
};

exports.renderOperatorPage = async (req, res) => {
  try {
    const results = await DatabaseHelper.query(
      "SELECT id, name, cnic_num, role, last_login, created_at FROM users WHERE role = ?",
      ["operator"]
    );

    res.render("operator", {
      user: req.session.user,
      activePage: "operator",
      title: "Operators",
      operators: results,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error(err);
    res.render("operator", {
      user: req.session.user,
      activePage: "operator",
      title: "Operators",
      operators: [],
      error: "Error fetching operators",
      success: null,
    });
  }
};

exports.addOperator = async (req, res) => {
  const { name, cnic, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds

    await DatabaseHelper.execute(
      "INSERT INTO users (name, cnic_num, password, role, created_at) VALUES (?, ?, ?, ?, NOW())",
      [name, cnic, hashedPassword, "operator"]
    );

    res.redirect("/dashboard/operator?success=Operator added successfully");
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      res.redirect("/dashboard/operator?error=CNIC already exists");
    } else {
      res.redirect("/dashboard/operator?error=Error adding operator");
    }
  }
};

exports.updateOperator = async (req, res) => {
  const { id } = req.params;
  const { name, cnic, password } = req.body;

  try {
    let query = "UPDATE users SET name = ?, cnic_num = ?";
    const params = [name, cnic];

    // Only update password if a new one is provided
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 12);
      query += ", password = ?";
      params.push(hashedPassword);
    }

    query += " WHERE id = ?";
    params.push(id);

    await DatabaseHelper.execute(query, params);

    // Clear cache for this user
    userCache.delete(cnic);

    res.redirect("/dashboard/operator?success=Operator updated successfully");
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      res.redirect("/dashboard/operator?error=CNIC already exists");
    } else {
      res.redirect("/dashboard/operator?error=Update failed");
    }
  }
};

exports.deleteOperators = async (req, res) => {
  const { selectedIds } = req.body;

  if (!selectedIds || selectedIds.length === 0) {
    return res.status(400).json({ message: "No users selected" });
  }

  const ids = Array.isArray(selectedIds) ? selectedIds : [selectedIds];

  try {
    // Get CNICs before deletion to clear cache
    const users = await DatabaseHelper.query(
      `SELECT cnic_num FROM users WHERE id IN (${ids
        .map(() => "?")
        .join(",")})`,
      ids
    );

    // Create placeholders for the IN clause
    const placeholders = ids.map(() => "?").join(",");
    await DatabaseHelper.execute(
      `DELETE FROM users WHERE id IN (${placeholders}) AND role = "operator"`,
      ids
    );

    // Clear cache for deleted users
    users.forEach((user) => userCache.delete(user.cnic_num));

    res.json({ success: true, message: "Operators deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete operators" });
  }
};

// Cache management endpoints (admin only)
exports.clearCache = (req, res) => {
  userCache.clear();
  loginAttempts.clear();
  res.json({ success: true, message: "Cache cleared successfully" });
};

exports.getCacheStats = (req, res) => {
  res.json({
    userCacheSize: userCache.size,
    loginAttemptsSize: loginAttempts.size,
    cacheEntries: Array.from(userCache.keys()),
    lockedAccounts: Array.from(loginAttempts.entries())
      .filter(([_, data]) => data.lockedUntil && Date.now() < data.lockedUntil)
      .map(([key, _]) => key),
  });
};
