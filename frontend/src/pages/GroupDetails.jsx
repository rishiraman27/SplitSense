import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axiosConfig';

export default function GroupDetails() {
  const { id } = useParams(); // Grabs the group ID from the URL
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        // This hits your powerful new algorithm!
        const response = await API.get(`/groups/${id}/settle`);
        setSettlements(response.data);
      } catch (err) {
        setError('Failed to calculate settlements.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettlements();
  }, [id]);

  if (loading) return <div className="mt-10 text-center text-gray-500">Calculating optimal payments...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Group Settlement</h1>
          <Link to="/groups" className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">
            Back to Groups
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* The Magic Algorithm Results */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-emerald-50 px-6 py-4">
            <h2 className="text-lg font-bold text-emerald-800">How to Settle Up</h2>
            <p className="text-sm text-emerald-600">Our algorithm calculated the minimum number of payments to get everyone to $0.</p>
          </div>
          
          {settlements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="font-medium text-gray-800">Everyone is settled up!</p>
              <p className="text-sm">No one owes anything in this group right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {settlements.map((transaction, index) => (
                <li key={index} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-500">{transaction.from}</span>
                    <span className="text-gray-400">owes</span>
                    <span className="font-bold text-emerald-500">{transaction.to}</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    ${transaction.amount.toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}