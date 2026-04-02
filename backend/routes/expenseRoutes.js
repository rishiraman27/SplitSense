const express = require('express');
const router = express.Router();

const { 
  addExpense, 
  getExpenses,
  getUserExpenses, 
  getBalances, 
  settleUp,
  parseExpenseWithAI,
  getAIInsights
} = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');

// Notice how we put "protect" in the middle. 
// It runs first, and if it passes, it moves to addExpense/getUserExpenses.
router.route('/').post(protect, addExpense).get(protect, getUserExpenses);
// New Analytics & Settlement Routes
router.route('/balances').get(protect, getBalances);
router.route('/settle').post(protect, settleUp);
router.get('/', protect, getExpenses);
router.post('/parse', protect, parseExpenseWithAI);
router.get('/insights', protect, getAIInsights);

module.exports = router;