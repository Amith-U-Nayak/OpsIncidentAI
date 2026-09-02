import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Register = () => {
  // Added 'organization' to initial state
  const [form, setForm] = useState({ name: '', email: '', password: '', organization: '', role: 'engineer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">⚡ OpsIncidentAI</h1>
          <p className="text-zinc-400 mt-2">AI-Powered Incident Management</p>
        </div>

        <div className="bg-zinc-950 rounded-2xl p-8 border border-zinc-800">
          <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-black border border-zinc-800 text-white rounded-md px-4 py-3 focus:outline-none focus:border-white"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-black border border-zinc-800 text-white rounded-md px-4 py-3 focus:outline-none focus:border-white"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-black border border-zinc-800 text-white rounded-md px-4 py-3 focus:outline-none focus:border-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-slate-200"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Organization (Optional)</label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                className="w-full bg-black border border-zinc-800 text-white rounded-md px-4 py-3 focus:outline-none focus:border-white"
                placeholder="Add Organization or leave blank for personal use"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-black border border-zinc-800 text-white rounded-md px-4 py-3 focus:outline-none focus:border-white"
              >
                <option value="engineer">Engineer</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 text-white font-medium py-3 rounded-md transition-colors"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-zinc-400 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-zinc-300 hover:text-indigo-300">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
