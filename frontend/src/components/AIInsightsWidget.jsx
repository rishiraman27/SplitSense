import { useState } from 'react';
import API from '../api/axiosConfig';
import { Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';

export default function AIInsightsWidget({ refreshTrigger }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await API.get('/expenses/insights');
      setInsight(response.data.insight);
    } catch (error) {
      console.error('Failed to fetch AI insights', error);
      setInsight("Our AI is taking a quick nap. Please try again later!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 overflow-hidden rounded-3xl bg-linear-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-lg">
      <div className="relative p-6 sm:p-8">
        
        {/* Decorative background shapes */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500 opacity-10 blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 text-indigo-200">
              <BrainCircuit size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">AI Financial Advisor</span>
            </div>
            
            {insight ? (
              <p className="text-lg font-medium leading-relaxed text-indigo-50">
                "{insight}"
              </p>
            ) : (
              <p className="text-lg font-medium text-indigo-200/60">
                Tap the button to let AI analyze your spending habits and generate personalized advice.
              </p>
            )}
          </div>

          <button 
            onClick={fetchInsights}
            disabled={loading}
            className="group flex shrink-0 items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw size={20} className="animate-spin text-indigo-300" />
            ) : (
              <Sparkles size={20} className="text-indigo-300 group-hover:text-white transition-colors" />
            )}
            {loading ? 'Analyzing Data...' : 'Generate Insight'}
          </button>

        </div>
      </div>
    </div>
  );
}