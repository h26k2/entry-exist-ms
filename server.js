const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'entry-exit-secret',
  resave: false,
  saveUninitialized: false
}));

// DB
require('./config/db');


// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);


app.listen(PORT, () => {
  console.log(`==> Server running on port ${PORT} <==`);
});

