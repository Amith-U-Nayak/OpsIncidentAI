import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import AgentStepper from '../components/AgentStepper';

const NewIncident = () => {
  const [form, setForm] = useState({ title: '', description: '', severity: 'Medium' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Real-time AI pipeline state
  const [incidentId, setIncidentId] = useState(null);
  const [agentEvents, setAgentEvents] = useState([]);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  
  const navigate = useNavigate();
  const socket = useSocket();

  // HCI Principle: Visibility of System Status.
  // Listen for real-time Socket.IO events from the backend AI agents
  useEffect(() => {
    if (!socket || !incidentId) return;

    const handleAgentUpdate = (data) => {
      // ONLY process events for this specific incident
      if (data.incidentId !== incidentId) return;

      // Add new event to the list
      setAgentEvents((prev) => [...prev, data]);
      
      // If the last agent (PostMortem) is done, pipeline is finished
      if (data.agent === 'postMortemGenerator' && data.status === 'done') {
        setPipelineComplete(true);
      }
    };

    // Listen to the generic 'agent_update' event from the server
    socket.on('agent_update', handleAgentUpdate);

    return () => {
      socket.off('agent_update', handleAgentUpdate);
    };
  }, [socket, incidentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. We must use FormData because we are sending a File + Text
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('severity', form.severity);
      if (file) formData.append('logs', file);

      // 2. Create the incident
      const createRes = await api.post('/incidents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newIncidentId = createRes.data.data._id;
      setIncidentId(newIncidentId); // This triggers the socket listener above!

      // 3. Kick off the AI Pipeline asynchronously
      // We do NOT await this because we want to watch it run live in the UI
      api.post(`/incidents/${newIncidentId}/analyse`).catch(err => {
        console.error("Pipeline error:", err);
        setError("AI Pipeline failed to run.");
      });

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create incident');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Report New Incident</h1>
        <p className="text-slate-400 text-sm">Upload logs and let AI analyze the root cause</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* If incidentId exists, the form was submitted. Show the live AI stepper instead. */}
      {incidentId ? (
        <div className="space-y-6 fade-in">
          <AgentStepper events={agentEvents} />
          
          {pipelineComplete && (
            <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-green-400 font-bold text-lg">Analysis Complete!</h3>
                <p className="text-green-500/80 text-sm mt-1">The AI has generated a post-mortem and runbook solution.</p>
              </div>
              <button
                onClick={() => navigate(`/incidents/${incidentId}`)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                View Full Report →
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-8 border border-slate-700 space-y-6">
          <div>
            <label className="text-slate-400 text-sm mb-1 block font-medium">Incident Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
              placeholder="e.g., Database Connection Timeout in Production"
            />
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block font-medium">Description</label>
            <textarea
              required
              rows="4"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
              placeholder="Describe what happened, when it started, and user impact..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-slate-400 text-sm mb-1 block font-medium">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-1 block font-medium">Attach Log File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full bg-slate-900 border border-slate-600 text-slate-400 rounded-lg px-4 py-2.5 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/incidents')}
              className="px-6 py-3 text-slate-400 hover:text-white font-medium mr-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-lg">⏳</span> Uploading...
                </>
              ) : (
                <>
                  🚀 Submit & Run AI
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewIncident;
