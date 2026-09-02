import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Admin Search State
  const [searchMode, setSearchMode] = useState('organization'); // 'organization' or 'engineer'
  const [searchQuery, setSearchQuery] = useState('');

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

  // Compute unique organizations for suggestions
  const uniqueOrgs = useMemo(() => {
    if (user?.role !== 'admin') return [];
    const orgs = new Set();
    incidents.forEach(inc => {
      if (inc.organization) orgs.add(inc.organization);
    });
    return Array.from(orgs);
  }, [incidents, user]);

  // Compute filtered incidents
  const filteredIncidents = useMemo(() => {
    if (!searchQuery) return incidents;
    
    return incidents.filter(inc => {
      if (searchMode === 'organization') {
        return inc.organization?.toLowerCase().includes(searchQuery.toLowerCase());
      } else {
        return inc.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      }
    });
  }, [incidents, searchQuery, searchMode]);

  // Group filtered incidents (Only used for Admin)
  const groupedIncidents = useMemo(() => {
    if (user?.role !== 'admin') return { orgs: [], solo: [] };
    
    const orgsMap = {};
    const solo = [];
    
    filteredIncidents.forEach(inc => {
      if (inc.organization) {
        if (!orgsMap[inc.organization]) orgsMap[inc.organization] = [];
        orgsMap[inc.organization].push(inc);
      } else {
        solo.push(inc);
      }
    });
    
    return {
      orgs: Object.entries(orgsMap).map(([name, data]) => ({ name, data })),
      solo
    };
  }, [filteredIncidents, user]);


  const IncidentTable = ({ data, title }) => (
    <div className="mb-8">
      {title && <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>}
      <div className="bg-zinc-950 rounded-md border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 border-b border-zinc-800 text-zinc-400 text-sm">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Severity</th>
                <th className="p-4 font-medium">Created By</th>
                <th className="p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-500">No incidents found.</td>
                </tr>
              ) : (
                data.map((incident) => (
                  <tr 
                    key={incident._id} 
                    className="hover:bg-zinc-900 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/incidents/${incident._id}`)}
                  >
                    <td className="p-4 text-white font-medium">
                      {incident.title}
                      <p className="text-zinc-400 text-xs mt-1 truncate max-w-sm font-normal">
                        {incident.description}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${STATUS_COLORS[incident.status]}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${SEVERITY_COLORS[incident.severity]}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-300 text-sm">
                      {incident.createdBy?.name || 'Unknown'}
                    </td>
                    <td className="p-4 text-zinc-400 text-sm">
                      {new Date(incident.createdAt).toLocaleDateString()}
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

  if (loading) return <div className="text-zinc-400 animate-pulse text-center mt-20 text-lg">Loading Incidents...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidents</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage and track system issues</p>
        </div>
        {user?.role !== 'viewer' && (
          <Link 
            to="/incidents/new" 
            className="bg-white text-black px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Incident
          </Link>
        )}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md">{error}</div>}

      {/* Admin Search Bar */}
      {user?.role === 'admin' && (
        <div className="bg-zinc-950 p-4 rounded-md border border-zinc-800 flex gap-4 items-center">
          <select 
            value={searchMode}
            onChange={(e) => { setSearchMode(e.target.value); setSearchQuery(''); }}
            className="bg-black border border-zinc-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          >
            <option value="organization">Search by Organization</option>
            <option value="engineer">Search by Engineer (Full Name)</option>
          </select>

          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder={searchMode === 'organization' ? "Type organization name..." : "Type engineer full name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              list={searchMode === 'organization' ? "org-suggestions" : ""}
              className="w-full bg-black border border-zinc-700 text-white rounded-md px-4 py-2 text-sm focus:outline-none focus:border-zinc-500"
            />
            {searchMode === 'organization' && (
              <datalist id="org-suggestions">
                {uniqueOrgs.map(org => (
                  <option key={org} value={org} />
                ))}
              </datalist>
            )}
          </div>
        </div>
      )}

      {/* Incident Views */}
      {user?.role === 'admin' ? (
        <div>
          {groupedIncidents.orgs.map(orgGroup => (
            <IncidentTable key={orgGroup.name} title={`Organization: ${orgGroup.name}`} data={orgGroup.data} />
          ))}
          {groupedIncidents.solo.length > 0 && (
            <IncidentTable title="Solo Engineers" data={groupedIncidents.solo} />
          )}
          {groupedIncidents.orgs.length === 0 && groupedIncidents.solo.length === 0 && (
            <div className="text-zinc-500 text-center py-10">No incidents match your search.</div>
          )}
        </div>
      ) : (
        <IncidentTable data={incidents} />
      )}
    </div>
  );
};

export default Incidents;
