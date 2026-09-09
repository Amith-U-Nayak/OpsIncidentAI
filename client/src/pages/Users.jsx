import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_COLORS = {
  admin: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  engineer: 'bg-green-500/10 text-green-400 border-green-500/20',
  viewer: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const Users = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Defense in depth: if somehow a non-admin gets here, kick them out
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/auth/users');
        setUsersList(data.data);
      } catch (err) {
        setError('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user, navigate]);

  if (loading) return <div className="text-zinc-400 animate-pulse text-center mt-20 text-lg">Loading Directory...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Directory</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage and view all registered users across organizations.</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md">{error}</div>}

      <div className="bg-zinc-950 rounded-md border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 border-b border-zinc-800 text-zinc-400 text-sm">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Organization</th>
                <th className="p-4 font-medium">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-zinc-500">No users found.</td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-zinc-900/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.name}</p>
                          <p className="text-zinc-500 text-xs">@{u.username || 'user'} • {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border capitalize ${ROLE_COLORS[u.role] || ROLE_COLORS.viewer}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-300 text-sm">
                      {u.organization || <span className="text-zinc-600 italic">Solo (None)</span>}
                    </td>
                    <td className="p-4 text-zinc-400 text-sm">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
