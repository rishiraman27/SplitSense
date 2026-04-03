import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import API from '../api/axiosConfig';
import { useAuthStore } from '../store/useAuthStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { X, User, Users, Receipt, Tag, DollarSign, Sparkles, Loader2, UserMinus } from 'lucide-react';

export default function AddExpenseModal({ isOpen, onClose, onSuccess }) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { category: 'Others' }
  });
  
  const { user } = useAuthStore();
  const { symbol } = useCurrencyStore();
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  // NEW: Added 'personal' as the default split type for faster tracking
  const [splitType, setSplitType] = useState('personal'); 

  const [aiText, setAiText] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);

  const totalAmount = watch('amount') || 0;
  const categories = ['Food & Drink', 'Travel', 'Utilities', 'Entertainment', 'Shopping', 'Others'];

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [friendsRes, groupsRes] = await Promise.all([
            API.get('/users/friends'),
            API.get('/groups')
          ]);
          setFriends(friendsRes.data);
          setGroups(groupsRes.data);
        } catch (error) {
          console.error('Failed to fetch data for modal', error);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleAIParsing = async () => {
    if (!aiText.trim()) return;
    
    setIsAiParsing(true);
    try {
      const response = await API.post('/expenses/parse', { text: aiText });
      const data = response.data;

      setValue('description', data.description);
      setValue('amount', data.totalAmount);
      setValue('category', data.category);

      // Smart AI Tab Selection
      if (!data.splits || data.splits.length === 0) {
        setSplitType('personal');
      } else if (data.splits.length > 0) {
        setSplitType('friend');
        const friendSplit = data.splits.find(s => s.userId !== user._id) || data.splits[0];
        if (friendSplit) {
          setValue('splitWith', friendSplit.userId);
          setValue('amountOwed', friendSplit.amountOwed);
        }
      }

      setAiText(''); 
    } catch (error) {
      console.error('AI Parsing failed', error);
      alert('AI couldn\'t understand that. Please fill it out manually!');
    } finally {
      setIsAiParsing(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let payload = {
        description: data.description,
        totalAmount: parseFloat(data.amount),
        category: data.category,
      };

      // NEW: Logic to handle personal expenses (empty splits)
      if (splitType === 'personal') {
        payload.groupId = null;
        payload.splits = []; 
      } else if (splitType === 'friend') {
        payload.groupId = null;
        payload.splits = [{ user: data.splitWith, amountOwed: parseFloat(data.amountOwed) }];
      } else {
        const selectedGroup = groups.find(g => g._id === data.groupId);
        if (!selectedGroup) throw new Error("Please select a valid group");
        const equalShare = parseFloat((data.amount / selectedGroup.members.length).toFixed(2));
        payload.groupId = selectedGroup._id;
        payload.splits = selectedGroup.members.map(member => ({
          user: member._id, amountOwed: equalShare
        }));
      }

      await API.post('/expenses', payload);
      reset(); 
      setSplitType('personal'); 
      onSuccess(); 
      onClose(); 
    } catch (error) {
      console.error('Failed to add expense', error);
      alert(error.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-200 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-5">
          <h2 className="text-xl font-bold text-gray-800">Add an expense</h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          
          <div className="mb-6 rounded-2xl bg-linear-to-br from-indigo-50 to-purple-50 p-4 ring-1 ring-indigo-100">
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-900">
              <Sparkles size={16} className="text-indigo-500" /> Magic AI Entry
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`e.g., "I spent ${symbol}45 on pizza with John"`}
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIParsing()}
                className="w-full rounded-xl border-0 bg-white p-3 text-sm shadow-sm ring-1 ring-inset ring-indigo-100 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAIParsing}
                disabled={isAiParsing || !aiText.trim()}
                className="flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {isAiParsing ? <Loader2 size={18} className="animate-spin" /> : 'Auto-Fill'}
              </button>
            </div>
          </div>

          <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-gray-100 after:h-px after:flex-1 after:bg-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">OR ENTER MANUALLY</span>
          </div>

          {/* NEW: Three-way Custom Tabs */}
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setSplitType('personal')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${splitType === 'personal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <UserMinus size={16} /> Just Me
            </button>
            <button
              type="button"
              onClick={() => setSplitType('friend')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${splitType === 'friend' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User size={16} /> Friend
            </button>
            <button
              type="button"
              onClick={() => setSplitType('group')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${splitType === 'group' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Users size={16} /> Group
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Receipt size={14} className="text-emerald-500"/> Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dinner"
                  {...register('description', { required: true })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Tag size={14} className="text-emerald-500"/> Category
                </label>
                <select
                  {...register('category', { required: true })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                >
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className={`grid ${splitType === 'friend' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <DollarSign size={14} className="text-emerald-500"/> Total Bill
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount', { required: true, min: 0.01 })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              
              {splitType === 'friend' && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <User size={14} className="text-emerald-500"/> Friend Owes
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amountOwed', { 
                      required: splitType === 'friend', 
                      min: 0.01,
                      max: parseFloat(totalAmount) || 99999 
                    })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              )}
            </div>

            {splitType === 'friend' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Who owes you?</label>
                <select
                  {...register('splitWith', { required: splitType === 'friend' })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="">Select a friend...</option>
                  {friends.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            )}
            
            {splitType === 'group' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Which group?</label>
                <select
                  {...register('groupId', { required: splitType === 'group' })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="">Select a group...</option>
                  {groups.map((g) => <option key={g._id} value={g._id}>{g.name} ({g.members.length} members)</option>)}
                </select>
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/40 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}