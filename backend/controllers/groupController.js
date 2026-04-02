const Group = require('../models/group');
const User = require('../models/User'); // Ensure lowercase if your file is user.js
const Expense = require('../models/Expense'); // <-- ADDED THIS IMPORT
const simplifyDebts = require('../utils/simplifyDebts');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
  const { name, members } = req.body; 

  try {
    let groupMembers = members || [];
    if (!groupMembers.includes(req.user.id)) {
      groupMembers.push(req.user.id);
    }

    const group = await Group.create({
      name,
      members: groupMembers,
      createdBy: req.user.id,
    });

    await User.updateMany(
      { _id: { $in: groupMembers } },
      { $push: { groups: group._id } }
    );

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's groups
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('members', 'name email') 
      .sort({ createdAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Calculate simplified debts for a specific group
// @route   GET /api/groups/:id/settle
// @access  Private
const getGroupSettlement = async (req, res) => {
  try {
    const groupId = req.params.id;

    // FIX: Using groupId and paidBy to match your exact schema!
    const expenses = await Expense.find({ groupId: groupId }).populate('paidBy splits.user', 'name');

    const balances = {}; 

    expenses.forEach(expense => {
      // FIX: Using paidBy instead of creator
      const payerId = expense.paidBy._id.toString();

      if (!balances[payerId]) balances[payerId] = 0;
      balances[payerId] += expense.totalAmount;

      expense.splits.forEach(split => {
        const splitUserId = split.user._id ? split.user._id.toString() : split.user.toString();
        
        if (!balances[splitUserId]) balances[splitUserId] = 0;
        balances[splitUserId] -= split.amountOwed;
      });
    });

    const optimizedTransactions = simplifyDebts(balances);

    const finalInstructions = await Promise.all(optimizedTransactions.map(async (transaction) => {
      const fromUser = await User.findById(transaction.from).select('name');
      const toUser = await User.findById(transaction.to).select('name');
      return {
        from: fromUser.name,
        to: toUser.name,
        amount: transaction.amount
      };
    }));

    res.status(200).json(finalInstructions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupSettlement
};