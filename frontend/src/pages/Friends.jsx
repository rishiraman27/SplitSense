import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axiosConfig';
import { useAuthStore } from '../store/useAuthStore';

export default function Friends() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [friends, setFriends] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchFriends = async () => {
    try {
      const response = await API.get('/users/friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to fetch friends', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchFriends();
  }, [user, navigate]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await API.post('/users/add-friend', { email });
      setMessage({ type: 'success', text: 'Friend added successfully!' });
      setEmail(''); // Clear the input
      fetchFriends(); // Refresh the list automatically
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add friend' 
      });
    }
  };

  if (loading) return <div className="mt-10 text-center text-gray-500">Loading friends...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
          <Link to="/dashboard" className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">
            Back to Dashboard
          </Link>
        </div>

        {/* Add Friend Form */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">Add a new friend</h2>
          <form onSubmit={handleAddFriend} className="flex gap-3">
            <input
              type="email"
              required
              placeholder="Friend's email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded border border-gray-300 p-2 focus:border-emerald-500 focus:outline-none"
            />
            <button type="submit" className="rounded bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-600">
              Add Friend
            </button>
          </form>
          
          {/* Status Messages */}
          {message.text && (
            <p className={`mt-3 text-sm font-medium ${message.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
              {message.text}
            </p>
          )}
        </div>

        {/* Friends List */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-800">Your Network</h2>
          </div>
          
          {friends.length === 0 ? (
            <div className="p-8 text-center text-gray-500">You haven't added any friends yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {friends.map((friend) => (
                <li key={friend._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800">{friend.name}</p>
                    <p className="text-sm text-gray-500">{friend.email}</p>
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