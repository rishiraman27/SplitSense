const Expense = require('../models/Expense');
const { extractExpenseData, generateFinancialInsights } = require('../utils/aiService');
const User = require('../models/User');

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private
// @desc    Create a new expense
const addExpense = async (req, res) => {
  try {
    // FIX: Added 'category' to the destructuring right here! 👇
    const { description, totalAmount, groupId, splits, category } = req.body;

    const expense = await Expense.create({
      description,
      totalAmount,
      category: category || 'Others', 
      paidBy: req.user.id, 
      groupId: groupId || null, 
      splits: splits
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error("🔥 DATABASE ERROR: ", error); 
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's expenses
// @route   GET /api/expenses
// @access  Private
const getUserExpenses = async (req, res) => {
  try {
    // Find expenses where the user either paid OR is listed in the splits
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user.id },
        { 'splits.user': req.user.id }
      ]
    }).populate('paidBy', 'name email') // This replaces the ID with actual user details
      .populate('splits.user', 'name email');

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get user balances (Total Owed, Total Owes, Personal)
// @route   GET /api/expenses/balances
// @access  Private
const getBalances = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const expenses = await Expense.find({
      $or: [{ paidBy: userId }, { 'splits.user': userId }]
    });

    const friendBalances = {}; 
    let totalPersonalSpending = 0; // NEW: Track personal spending

    expenses.forEach(expense => {
      const payerId = expense.paidBy.toString();
      const iPaid = payerId === userId;

      // NEW LOGIC: Is this a personal expense?
      if (iPaid && (!expense.splits || expense.splits.length === 0)) {
        totalPersonalSpending += expense.totalAmount;
        return; // Skip the rest of the loop for this expense
      }

      if (iPaid) {
        expense.splits.forEach(split => {
          const splitUserId = split.user.toString();
          if (splitUserId !== userId) {
            if (!friendBalances[splitUserId]) friendBalances[splitUserId] = 0;
            friendBalances[splitUserId] += split.amountOwed; 
          }
        });
      } else {
        const mySplit = expense.splits.find(s => s.user.toString() === userId);
        if (mySplit) {
          if (!friendBalances[payerId]) friendBalances[payerId] = 0;
          friendBalances[payerId] -= mySplit.amountOwed; 
        }
      }
    });

    let totalOwedToMe = 0;
    let totalIOwe = 0;

    Object.values(friendBalances).forEach(netAmount => {
      if (netAmount > 0.01) {
        totalOwedToMe += netAmount;
      } else if (netAmount < -0.01) {
        totalIOwe += Math.abs(netAmount);
      }
    });

    res.status(200).json({
      totalOwedToMe,
      totalIOwe,
      netBalance: totalOwedToMe - totalIOwe,
      totalPersonalSpending // <-- Sending it to the frontend!
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Settle up a debt (Pay someone back)
// @route   POST /api/expenses/settle
// @access  Private
const settleUp = async (req, res) => {
  try {
    const { receiverId, amount } = req.body;

    if (!receiverId || !amount) {
      return res.status(400).json({ message: 'Please provide receiverId and amount' });
    }

    // Create a specific transaction that acts as a payment
    const settlement = await Expense.create({
      description: 'Payment / Settle Up',
      totalAmount: amount,
      paidBy: req.user.id, // You are paying the money
      splits: [
        { 
          user: receiverId, // They "owe" you this payment, canceling out your previous debt to them
          amountOwed: amount 
        }
      ],
    });

    res.status(201).json(settlement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get all expenses involving the user
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user.id }, // <-- UPGRADED to paidBy
        { 'splits.user': req.user.id }
      ]
    })
    .populate('paidBy', 'name') // <-- UPGRADED to paidBy
    .populate('splits.user', 'name')
    .sort({ createdAt: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Parse natural language into an expense object using AI
// @route   POST /api/expenses/parse
// @access  Private
const parseExpenseWithAI = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Please provide expense text' });
    }

    // Fetch the user's friends so the AI has context
    const user = await User.findById(req.user.id).populate('friends', 'name _id');
    
    // Send the text and the friends list to Gemini
    const parsedData = await extractExpenseData(text, user.friends);

    // Send the perfectly formatted JSON back to the frontend to preview
    res.status(200).json(parsedData);
  } catch (error) {
    console.error("🔥 AI PARSING ERROR: ", error);
    res.status(500).json({ message: 'Failed to parse expense with AI. Please try manually.' });
  }
};
// @desc    Generate AI financial insights
// @route   GET /api/expenses/insights
// @access  Private
const getAIInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch all expenses involving the user
    const expenses = await Expense.find({
      $or: [{ paidBy: userId }, { 'splits.user': userId }]
    });

    if (expenses.length === 0) {
      return res.status(200).json({ insight: "You haven't added any expenses yet. Start tracking to get AI insights!" });
    }

    // Calculate how much the user *actually* spent out of pocket per category
    const categoryTotals = {};

    expenses.forEach(exp => {
      let myShare = 0;
      const payerId = exp.paidBy.toString();

      if (payerId === userId) {
        // I paid the bill. My share is the Total minus what everyone else owes me.
        let othersOwe = exp.splits
          .filter(s => s.user.toString() !== userId)
          .reduce((acc, s) => acc + s.amountOwed, 0);
        myShare = exp.totalAmount - othersOwe;
      } else {
        // Someone else paid. My share is just what I owe them in the splits.
        let mySplit = exp.splits.find(s => s.user.toString() === userId);
        if (mySplit) myShare = mySplit.amountOwed;
      }

      if (myShare > 0) {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + myShare;
      }
    });

    // Ask Gemini for advice!
    const insightText = await generateFinancialInsights(categoryTotals);

    res.status(200).json({ insight: insightText });
  } catch (error) {
    console.error("🔥 AI INSIGHTS ERROR: ", error);
    res.status(500).json({ message: 'Failed to generate insights.' });
  }
};



module.exports = {
  addExpense,
  parseExpenseWithAI,
  getExpenses,
  getUserExpenses,
  getBalances,
  settleUp,
  getAIInsights

};
  