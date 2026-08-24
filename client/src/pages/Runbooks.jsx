import { useState, useEffect } from 'react';
import api from '../api/axios';

const Runbooks = () => {
  const [runbooks, setRunbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({ title: '', tags: '' });
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchRunbooks();
  }, []);

  const fetchRunbooks = async () => {
    try {
      const { data } = await api.get('/runbooks');
      setRunbooks(data.data);
    } catch (err) {
      setError('Failed to load runbooks.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    try {
      // Tags come in as a comma separated string, split them into an array
      const tagsArray = form.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      await api.post('/runbooks', {
        title: form.title,
        content: content,
        tags: tagsArray
      });

      // Reset form and refresh list
      setForm({ title: '', tags: '' });
      setContent('');
      fetchRunbooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload runbook');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this runbook?")) return;
    try {
      await api.delete(`/runbooks/${id}`);
      setRunbooks(runbooks.filter(r => r._id !== id));
    } catch (err) {
      alert("Failed to delete runbook");
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Upload Form */}
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-slate-400 text-sm">Upload runbooks to train the AI</p>
        </div>

        <form onSubmit={handleUpload} className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
          <h2 className="text-white font-medium mb-4">Add New Runbook</h2>
          
          {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded">{error}</div>}

          <div>
            <label className="text-slate-400 text-sm mb-1 block">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="e.g., Fix Node.js OOM Crash"
            />
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block">Content / Steps</label>
            <textarea
              required
              rows="6"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="1. SSH into server...&#10;2. Restart PM2...&#10;3. Check logs..."
            />
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block">Tags (comma separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="nodejs, memory, crash"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors text-sm"
          >
            {uploading ? 'Embedding and Saving...' : 'Upload & Train AI'}
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: Runbooks List */}
      <div className="lg:col-span-2">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 min-h-full">
          <h2 className="text-white font-medium mb-6">Active Runbooks ({runbooks.length})</h2>
          
          {loading ? (
            <div className="text-indigo-400 animate-pulse text-sm">Loading database...</div>
          ) : runbooks.length === 0 ? (
            <div className="text-slate-500 text-center py-12">
              No runbooks found. Add one to power up the AI's Tier 1 matching.
            </div>
          ) : (
            <div className="space-y-4">
              {runbooks.map((runbook) => (
                <div key={runbook._id} className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-indigo-400 font-medium">{runbook.title}</h3>
                    <button 
                      onClick={() => handleDelete(runbook._id)}
                      className="text-slate-500 hover:text-red-400 text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-slate-300 text-sm mb-3 line-clamp-2">{runbook.content}</p>
                  <div className="flex gap-2">
                    {runbook.tags.map(tag => (
                      <span key={tag} className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs border border-slate-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Runbooks;
