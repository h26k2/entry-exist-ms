const express = require('express');
const dotenv = require('dotenv');
//const visitorRoutes = require('./routes/visitorRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
require('./config/db');


// Routes
//app.use('/api/visitors', visitorRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Entry Exit Management System API'); 
});

app.listen(PORT, () => {
  console.log(`==> Server running on port ${PORT} <==`);
});

