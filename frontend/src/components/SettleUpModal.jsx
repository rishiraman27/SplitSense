import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import API from '../api/axiosConfig';
import { X, CheckCircle2, DollarSign, User } from 'lucide-react';
import { useCurrencyStore } from '../store/useCurrencyStore';



export default function SettleUpModal({ isOpen, onClose, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { symbol } = useCurrencyStore();

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const response = await API.get('/users/friends');
          setUsers(response.data);
        } catch (error) {
          console.error('Failed to fetch users', error);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await API.post('/expenses', {
        description: 'Payment',
        category: 'Others',
        totalAmount: parseFloat(data.amount),
        splits: [
          {
            user: data.receiverId, 
            amountOwed: parseFloat(data.amount), 
          },
        ],
      });

      reset(); 
      onSuccess(); 
      onClose(); 
    } catch (error) {
      console.error('Failed to settle up', error);
      alert(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={24} className="text-teal-500" />
            <h2 className="text-xl font-bold text-gray-800">Settle up</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <User size={14} className="text-teal-500"/> Who are you paying?
              </label>
              <select
                {...register('receiverId', { required: true })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
              >
                <option value="">Select a friend...</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <span className="text-teal-500 text-base">{symbol}</span> Amount Paid
              </label>
              <input
                type="number"
                step="0.01"
                placeholder={`${symbol} 0.00`}
                {...register('amount', { required: true, min: 0.01 })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-3xl font-bold text-gray-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
              />
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-linear-to-r from-teal-500 to-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-500/30 transition-all hover:shadow-lg hover:shadow-teal-500/40 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}