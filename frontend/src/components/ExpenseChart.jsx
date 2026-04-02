import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import API from '../api/axiosConfig';
import { useAuthStore } from '../store/useAuthStore';

// Beautiful colors for our chart categories
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export default function ExpenseChart({ refreshTrigger }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        const response = await API.get('/expenses');
        const expenses = response.data;

        // Create a bucket to tally up our categories
        const categoryTotals = {
          'Food & Drink': 0,
          'Travel': 0,
          'Utilities': 0,
          'Entertainment': 0,
          'Shopping': 0,
          'Others': 0
        };

        // Calculate "My Share" of every expense
        expenses.forEach(expense => {
          let myCost = 0;
          const iPaid = expense.paidBy._id === user._id;

          if (iPaid) {
            // If I paid, my cost is the total bill MINUS what everyone else owes me
            let othersOweMe = 0;
            expense.splits.forEach(split => {
              if (split.user._id !== user._id) {
                othersOweMe += split.amountOwed;
              }
            });
            myCost = expense.totalAmount - othersOweMe;
          } else {
            // If someone else paid, my cost is just exactly what I owe them in the splits
            const mySplit = expense.splits.find(s => s.user._id === user._id);
            if (mySplit) myCost = mySplit.amountOwed;
          }

          // Add my cost to the correct category bucket
          const category = expense.category || 'Others';
          if (categoryTotals[category] !== undefined) {
            categoryTotals[category] += myCost;
          }
        });

        // Convert our bucket object into the exact array format Recharts requires
        const formattedData = Object.keys(categoryTotals)
          .filter(key => categoryTotals[key] > 0) // Only keep categories with actual spending
          .map(key => ({
            name: key,
            value: parseFloat(categoryTotals[key].toFixed(2))
          }));

        setChartData(formattedData);
      } catch (error) {
        console.error('Failed to fetch data for chart', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, [refreshTrigger, user._id]);

  if (loading) return <div className="mt-8 text-center text-gray-500">Loading analytics...</div>;

  if (chartData.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">No spending data yet</h3>
        <p className="mt-1 text-sm text-gray-500">Add some categorized expenses to see your chart!</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-800">Your Spending Breakdown</h2>
      
      {/* Recharts needs a specific height to render properly */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" // Center X
              cy="50%" // Center Y
              innerRadius={70} // Makes it a "Donut" chart
              outerRadius={90}
              paddingAngle={5} // Little gaps between slices
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${value}`} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}