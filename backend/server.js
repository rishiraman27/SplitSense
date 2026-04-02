const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

// Connect to the database
connectDB();

const app = express();

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 

// >>> ADD THIS LINE TO CONNECT YOUR ROUTES <<<
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Splitwise Clone API is running smoothly!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});