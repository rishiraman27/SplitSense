import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axiosConfig';
import { useAuthStore } from '../store/useAuthStore';
import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';
import ExpenseFeed from '../components/ExpenseFeed';
import ExpenseChart from '../components/ExpenseChart';
import AIInsightsWidget from '../components/AIInsightsWidget';
import { useCurrencyStore } from '../store/useCurrencyStore';

// NEW: Importing beautiful modern icons!
import { LogOut, Users, UserPlus, PlusCircle, CheckCircle2, Wallet, TrendingUp, TrendingDown, Settings, CreditCard, IndianRupee, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { user, setLogout } = useAuthStore();
  const { symbol, currency, toggleCurrency } = useCurrencyStore();
  const navigate = useNavigate();
  
  const [balances, setBalances] = useState({ totalOwedToMe: 0, totalIOwe: 0, netBalance: 0, totalPersonalSpending: 0 });
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false); 
  
  const fetchBalances = async () => {
    try {
      const response = await API.get('/expenses/balances');
      setBalances(response.data);
    } catch (error) {
      console.error("Failed to fetch balances", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBalances();
  }, [user, navigate]);

  const handleLogout = () => {
    setLogout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans">
      <div className="mx-auto max-w-5xl">
        
        {/* Modern Header Section */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Welcome back, <span className="bg-linear-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">Here is your financial overview.</p>
          </div>
          
          <div className="flex gap-3">
            <Link to="/groups" className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:bg-gray-50">
              <Users size={18} className="text-indigo-500" /> Groups
            </Link>
            <Link to="/friends" className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:bg-gray-50">
              <UserPlus size={18} className="text-blue-500" /> Friends
            </Link>
            <Link to="/account" className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:bg-gray-50">
              <Settings size={18} className="text-gray-500" /> Account
            </Link>
            <button 
              onClick={toggleCurrency} 
              title={`Switch to ${currency === 'USD' ? 'INR' : 'USD'}`}
              className="flex items-center justify-center rounded-full bg-white p-2.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:bg-gray-50 dark:border dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:ring-0 dark:backdrop-blur-md dark:hover:bg-white/10 dark:hover:text-white"
            >
              {currency === 'USD' ? <DollarSign size={18} /> : <IndianRupee size={18} />}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800">
              <LogOut size={18} /> Exit
            </button>
          </div>
        </div>

        {/* Financial Summary Grid (Modern Cards) */}
        <div className="mb-10 grid gap-6 md:grid-cols-3">
          
          {/* Net Balance Card */}
          <div className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-gray-500">Total Balance</p>
              <div className="rounded-full bg-gray-100 p-2 text-gray-600 group-hover:bg-gray-200 transition-colors">
                <Wallet size={20} />
              </div>
            </div>
            <p className={`text-4xl font-extrabold tracking-tight ${balances.netBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {symbol}{Math.abs(balances.netBalance).toFixed(2)} 
            </p>
            <p className="mt-1 text-sm font-medium text-gray-400">
              {balances.netBalance < 0 ? 'You are in the red' : 'You are in the green'}
            </p>
          </div>

          {/* What You Owe Card */}
          <div className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-gray-500">You Owe</p>
              <div className="rounded-full bg-red-50 p-2 text-red-500 group-hover:bg-red-100 transition-colors">
                <TrendingDown size={20} />
              </div>
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-red-500">
              {symbol}{balances.totalIOwe.toFixed(2)}
            </p>
          </div>

          {/* What is Owed To You Card */}
          <div className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-gray-500">You Are Owed</p>
              <div className="rounded-full bg-emerald-50 p-2 text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                <TrendingUp size={20} />
              </div>
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-emerald-500">
              {symbol}{balances.totalOwedToMe.toFixed(2)}
            </p>
          </div>
          <div className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-gray-500">Personal Spends</p>
              <div className="rounded-full bg-indigo-50 p-2 text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                <CreditCard size={20} />
              </div>
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-indigo-500">
              {symbol}{(balances.totalPersonalSpending || 0).toFixed(2)}
            </p>
          </div>

        </div>

        {/* Primary Action Buttons */}
        <div className="mb-10 flex flex-wrap gap-4">
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/40"
          >
            <PlusCircle size={22} /> Add an expense
          </button>

          
          <button 
            onClick={() => setIsSettleModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-gray-800 shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:-translate-y-1 hover:bg-gray-50 hover:shadow-md"
          >
            <CheckCircle2 size={22} className="text-teal-500" /> Settle up
          </button>
        </div>
        <AIInsightsWidget refreshTrigger={balances} />

        {/* Analytics & Feed */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ExpenseChart refreshTrigger={balances} /> 
          </div>
          <div className="lg:col-span-2">
            <ExpenseFeed refreshTrigger={balances} /> 
          </div>
        </div>

      </div>

      <AddExpenseModal 
          isOpen={isExpenseModalOpen} 
          onClose={() => setIsExpenseModalOpen(false)} 
          onSuccess={fetchBalances} 
      />
      <SettleUpModal 
          isOpen={isSettleModalOpen} 
          onClose={() => setIsSettleModalOpen(false)} 
          onSuccess={fetchBalances} 
      />
    </div>
  );
}