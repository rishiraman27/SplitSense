import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import { useAuthStore } from '../store/useAuthStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { Receipt, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'; // Beautiful modern icons



// Helper 1: Generate initials from a full name
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

// Helper 2: Assign a consistent, beautiful color based on the user's name!
const getAvatarColor = (name) => {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function ExpenseFeed({ refreshTrigger }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { symbol } = useCurrencyStore();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await API.get('/expenses');
        setExpenses(response.data);
      } catch (error) {
        console.error('Failed to fetch expenses', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="mt-8 flex h-40 items-center justify-center rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      
      {/* Feed Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-5">
        <Clock size={20} className="text-gray-400" />
        <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
      </div>

      {expenses.length === 0 ? (
        /* Modern Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 rounded-full bg-gray-50 p-4 text-gray-400">
            <Receipt size={32} />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No expenses yet</h3>
          <p className="mt-1 text-sm text-gray-500">When you add expenses or settle up, they'll show up here.</p>
        </div>
      ) : (
        /* The Feed */
        <ul className="divide-y divide-gray-100">
          {expenses.map((expense) => {
            const payerId = expense.paidBy?._id || expense.paidBy;
            const iPaid = payerId === user?._id;
            const payerName = expense.paidBy?.name || 'Unknown User';
            const totalAmount = expense.totalAmount || 0;
            
            // Smarter Math: Calculate exactly how much money changed hands for YOU
            let actualSplitAmount = 0;
            if (iPaid) {
               // If I paid, count up everything everyone ELSE owes me for this bill
               actualSplitAmount = expense.splits.reduce((acc, split) => {
                  const splitUserId = split.user?._id || split.user;
                  return splitUserId !== user?._id ? acc + split.amountOwed : acc;
               }, 0);
            } else {
               // If they paid, find my specific slice of the pie
               const mySplit = expense.splits.find(s => (s.user?._id || s.user) === user?._id);
               actualSplitAmount = mySplit ? mySplit.amountOwed : 0;
            }

            // Beautiful Date Formatting
            const date = new Date(expense.createdAt);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const day = date.getDate();

            return (
              <li key={expense._id} className="group flex items-center justify-between p-6 transition-colors hover:bg-gray-50/50">
                <div className="flex items-center gap-4">
                  
                  {/* Clean Calendar Column */}
                  <div className="flex w-10 flex-col items-center justify-center text-xs">
                    <span className="font-bold uppercase tracking-wider text-gray-400">{month}</span>
                    <span className="text-xl font-bold text-gray-700">{day}</span>
                  </div>
                  
                  {/* Colorful Avatar */}
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-inner ${getAvatarColor(payerName)}`}>
                    {getInitials(payerName)}
                  </div>

                  {/* Transaction Details */}
                  <div>
                    <p className="font-semibold text-gray-900">{expense.description || 'Payment'}</p>
                    <p className="text-sm text-gray-500">
                      {iPaid ? 'You' : payerName} paid <span className="font-medium text-gray-700">{symbol}{totalAmount.toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                {/* Right Side: Impact on Your Balance */}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500">{iPaid ? 'You lent' : 'You borrowed'}</p>
                  <div className={`flex items-center justify-end gap-1 font-bold ${iPaid ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {iPaid ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    {symbol}{actualSplitAmount.toFixed(2)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}