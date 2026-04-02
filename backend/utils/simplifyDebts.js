// backend/utils/simplifyDebts.js

function simplifyDebts(balances) {
  // `balances` will look like this: { "userA_id": 50, "userB_id": -20, "userC_id": -30 }
  let debtors = [];
  let creditors = [];

  // 1. Separate people into Debtors (negative balance) and Creditors (positive balance)
  for (const [user, amount] of Object.entries(balances)) {
    if (amount < -0.01) debtors.push({ user, amount: amount });
    else if (amount > 0.01) creditors.push({ user, amount: amount });
  }

  // 2. Sort them so we can match the biggest debts with the biggest credits first
  debtors.sort((a, b) => a.amount - b.amount); // Most negative first
  creditors.sort((a, b) => b.amount - a.amount); // Most positive first

  let transactions = [];
  let i = 0; // Debtors pointer
  let j = 0; // Creditors pointer

  // 3. The Greedy Loop: Settle debts until someone runs out
  while (i < debtors.length && j < creditors.length) {
    let debtor = debtors[i];
    let creditor = creditors[j];

    // Find the maximum amount we can settle right now
    let amountToSettle = Math.min(Math.abs(debtor.amount), creditor.amount);

    // Record the transaction
    transactions.push({
      from: debtor.user,
      to: creditor.user,
      amount: parseFloat(amountToSettle.toFixed(2))
    });

    // Adjust their remaining balances
    debtor.amount += amountToSettle;
    creditor.amount -= amountToSettle;

    // If their balance hits zero, move the pointer to the next person
    if (Math.abs(debtor.amount) < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  // Return the optimal, simplified list of payments!
  return transactions;
}

module.exports = simplifyDebts;