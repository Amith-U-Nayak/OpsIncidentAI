import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const SEVERITY_COLORS = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const STATUS_COLORS = {
  Open: 'bg-zinc-900 text-slate-300',
  Investigating: 'bg-indigo-500/10 text-zinc-300 border-white/20',
  Resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
  Closed: 'bg-zinc-950 text-zinc-500',
};

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const { data } = await api.get('/incidents');
        setIncidents(data.data);
      } catch (err) {
        setError('Failed to load incidents.');
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-300 animate-pulse text-lg">Loading Incidents...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidents</h1>
          <p className="text-zinc-400 text-sm">Manage and track system issues</p>
        </div>
        <Link 
          to="/incidents/new" 
          className="bg-white text-black hover:bg-zinc-200 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          ➕ New Incident
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* HCI Principle: Data Tables should be easy to scan. Use badges and zebra striping or hover states. */}
      <div className="bg-zinc-950 rounded-md border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 border-b border-zinc-800 text-zinc-400 text-sm">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Severity</th>
                <th className="p-4 font-medium">Created At</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-500">
                    No incidents found. You're all clear! 🎉
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr 
                    key={incident._id} 
                    className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/incidents/${incident._id}`)}
                  >
                    <td className="p-4 text-white font-medium">
                      {incident.title}
                      {/* Truncate long descriptions to prevent UI breaking */}
                      <p className="text-zinc-400 text-xs mt-1 truncate max-w-md font-normal">
                        {incident.description}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[incident.status]}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${SEVERITY_COLORS[incident.severity]}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 text-sm">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-zinc-300 group-hover:text-indigo-300 font-medium text-sm transition-colors">
                        View Details →
                      </span>
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

export default Incidents;
