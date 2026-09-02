import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const TABS = ['Overview', 'Logs & Errors', 'Root Cause', 'Runbook Solution', 'Post-Mortem'];

const IncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [postMortem, setPostMortem] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // For the Resolve button
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, pmRes] = await Promise.all([
          api.get(`/incidents/${id}`),
          api.get(`/incidents/${id}/postmortem`).catch(() => ({ data: { data: null } })) 
        ]);
        
        setIncident(incRes.data.data);
        if (pmRes.data.data) {
          setPostMortem(pmRes.data.data);
        }
      } catch (err) {
        setError('Failed to load incident details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleResolve = async () => {
    setUpdating(true);
    try {
      await api.patch(`/incidents/${id}/status`, { status: 'Resolved' });
      setIncident({ ...incident, status: 'Resolved' });
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-indigo-400 animate-pulse text-center mt-20">Loading Incident Data...</div>;
  }

  if (error || !incident) {
    return <div className="text-red-400 text-center mt-20">{error || 'Incident not found'}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{incident.title}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold border border-slate-600 bg-slate-800 text-slate-300">
              {incident.status}
            </span>
          </div>
          <p className="text-slate-400">Reported on {new Date(incident.createdAt).toLocaleString()}</p>
        </div>
        
        <div className="flex gap-3">
          {incident.status !== 'Resolved' && incident.status !== 'Closed' && (
            <button 
              onClick={handleResolve}
              disabled={updating}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {updating ? 'Resolving...' : '✓ Mark Resolved'}
            </button>
          )}
          <button 
            onClick={() => navigate('/incidents')}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>

      {/* Tabs - HCI Principle: Chunking */}
      <div className="flex border-b border-slate-700 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 min-h-[400px]">
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-slate-400 text-sm font-medium mb-2">Description</h3>
              <p className="text-white bg-slate-900 p-4 rounded-lg whitespace-pre-wrap">
                {incident.description}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-4 rounded-lg">
                <p className="text-slate-500 text-xs uppercase font-bold">Severity</p>
                <p className="text-white font-medium mt-1">{incident.severity}</p>
              </div>
              <div className="bg-slate-900 p-4 rounded-lg">
                <p className="text-slate-500 text-xs uppercase font-bold">Status</p>
                <p className="text-white font-medium mt-1">{incident.status}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Logs & Errors' && (
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-2">Attached Log Files</h3>
            {incident.logs && incident.logs.length > 0 ? (
              <ul className="space-y-2">
                {incident.logs.map((log, i) => (
                  <li key={i}>
                    <a href={log} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-2 bg-slate-900 p-3 rounded-lg">
                      📄 View Log File {i + 1} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">No logs attached to this incident.</p>
            )}
          </div>
        )}

        {activeTab === 'Root Cause' && (
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-2">AI Generated Root Cause</h3>
            {incident.aiRootCause ? (
              <div className="bg-slate-900 p-6 rounded-lg border-l-4 border-indigo-500">
                <p className="text-white leading-relaxed">{incident.aiRootCause}</p>
              </div>
            ) : (
              <p className="text-slate-500 italic">AI has not analyzed this incident yet.</p>
            )}
          </div>
        )}

        {activeTab === 'Runbook Solution' && (
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-2">Suggested Resolution</h3>
            {postMortem ? (
              <div className="bg-slate-900 p-6 rounded-lg text-white whitespace-pre-wrap">
                {postMortem.resolution}
              </div>
            ) : (
              <p className="text-slate-500 italic">No runbook solution available.</p>
            )}
          </div>
        )}

        {activeTab === 'Post-Mortem' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-zinc-400 text-sm font-medium">Final Post-Mortem Report</h3>
              {postMortem && (
                <span className="text-xs font-semibold text-zinc-300 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-md">
                  Source: {postMortem.generatedBy || 'AI'}
                </span>
              )}
            </div>
            
            {postMortem ? (
              <div className="bg-black p-6 rounded-md space-y-6 border border-zinc-800">
                <div>
                  <h4 className="text-indigo-400 font-bold mb-2">Executive Summary</h4>
                  <p className="text-white leading-relaxed">{postMortem.summary}</p>
                </div>
                <div>
                  <h4 className="text-indigo-400 font-bold mb-2">Root Cause Analysis</h4>
                  <p className="text-white leading-relaxed">{postMortem.rootCause}</p>
                </div>
                <div>
                  <h4 className="text-indigo-400 font-bold mb-2">Action Items (Preventative)</h4>
                  <ul className="list-disc list-inside text-white space-y-1">
                    {postMortem.actionItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">No post-mortem report available yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentDetail;
