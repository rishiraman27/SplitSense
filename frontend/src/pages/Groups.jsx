import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axiosConfig';
import { useAuthStore } from '../store/useAuthStore';

export default function Groups() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      // Fetch both groups and friends at the same time
      const [groupsRes, friendsRes] = await Promise.all([
        API.get('/groups'),
        API.get('/users/friends')
      ]);
      setGroups(groupsRes.data);
      setFriends(friendsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  // Handle checking/unchecking friends for the new group
  const handleCheckboxChange = (friendId) => {
    setSelectedFriends((prev) => 
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId) // Remove if already checked
        : [...prev, friendId] // Add if not checked
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (selectedFriends.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one friend.' });
      return;
    }

    try {
      await API.post('/groups', {
        name: groupName,
        members: selectedFriends, // Send the array of checked friend IDs
      });
      
      setMessage({ type: 'success', text: 'Group created successfully!' });
      setGroupName('');
      setSelectedFriends([]);
      fetchData(); // Refresh the list
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create group' });
    }
  };

  if (loading) return <div className="mt-10 text-center text-gray-500">Loading groups...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <Link to="/dashboard" className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">
            Back to Dashboard
          </Link>
        </div>

        {/* Create Group Form */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">Create a new group</h2>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Group Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Goa Trip, Apartment 4B"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Select Members</label>
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500">You need to add friends first before creating a group.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto rounded border border-gray-200 p-3">
                  {friends.map((friend) => (
                    <label key={friend._id} className="mb-2 flex items-center gap-3 last:mb-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend._id)}
                        onChange={() => handleCheckboxChange(friend._id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-800">{friend.name} <span className="text-sm text-gray-500">({friend.email})</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="w-full rounded bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600">
              Create Group
            </button>
          </form>
          
          {message.text && (
            <p className={`mt-3 text-center text-sm font-medium ${message.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
              {message.text}
            </p>
          )}
        </div>

        {/* Groups List */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-800">Your Groups</h2>
          </div>
          
          {groups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">You aren't in any groups yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {groups.map((group) => (
                <li key={group._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div>
                    <p className="font-bold text-indigo-600">{group.name}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Members: {group.members.map(m => m.name).join(', ')}
                    </p>
                  </div>
                  
                  <Link 
                    to={`/groups/${group._id}`}
                    className="rounded bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
                  >
                    View Settlement
                  </Link>
                </li>
                
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}