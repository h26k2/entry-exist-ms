const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const { getAuthToken } = require('./utils/zkbiotime');
dotenv.config();

app = express();
const PORT = process.env.PORT || 3000;

// Initialize ZKBioTime Authentication
async function initializeZKBioTime() {
  try {
    const token = await getAuthToken();
    console.log('Successfully authenticated with ZKBioTime server');
  } catch (error) {
    console.error('Failed to authenticate with ZKBioTime server:', error.message);
  }
}

// Create session store for MySQL
let sessionStore;
try {
  const mysql = require("mysql2/promise");
  const sessionStoreOptions = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "entry_exit_db",
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 24 * 60 * 60 * 1000, // 24 hours
    createDatabaseTable: true,
    schema: {
      tableName: "user_sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data",
      },
    },
  };
  sessionStore = new MySQLStore(sessionStoreOptions);
} catch (error) {
  process.exit(1);
}

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// IP tracking middleware
app.use((req, res, next) => {
  req.clientIP =
    req.ip ||
    req.connection.remoteAddress ||
    req.headers["x-forwarded-for"] ||
    "unknown";
  next();
});

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "entry-exit-secret-key-change-in-production",
    name: "entry.sid", // Custom session name
    resave: false,
    saveUninitialized: false,
    store: sessionStore, // MySQL session store
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict", // CSRF protection
    },
    rolling: true, // Reset expiration on each request
  })
);

// DB
require("./config/db");

// Initialize all routes
const { initializeRoutes } = require("./routes");
initializeRoutes(app);

// Start server and initialize ZKBioTime
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await initializeZKBioTime();
});
