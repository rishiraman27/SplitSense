const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Please add a description (e.g., Dinner at Italian Place)'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Please add the total amount'],
    },
    category: {
      type: String,
      enum: ['Food & Drink', 'Travel', 'Utilities', 'Entertainment', 'Shopping', 'Others'],
      default: 'Others', // Fallback if they forget to select one
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Links to the User model
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null, // If null, it's a direct friend-to-friend expense
    },
    splits: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'User',
        },
        amountOwed: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Expense', expenseSchema);