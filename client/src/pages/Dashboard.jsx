import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';

// HCI Principle: Color coding builds a mental model.
// Critical = Red (Danger), High = Orange (Warning), Medium = Yellow, Low = Blue (Info)
const SEVERITY_COLORS = {
  Critical: '#ef4444', 
  High: '#f97316',     
  Medium: '#eab308',   
  Low: '#3b82f6'       
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [severityData, setSeverityData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [mttr, setMttr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // HCI Principle: Feedback. Show loading state while fetching.
    const fetchAnalytics = async () => {
      try {
        // Fetch all dashboard data concurrently
        const [summaryRes, severityRes, weeklyRes, mttrRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/severity'),
          api.get('/analytics/weekly'),
          api.get('/analytics/mttr')
        ]);

        setSummary(summaryRes.data.data);
        setSeverityData(severityRes.data.data);
        setWeeklyData(weeklyRes.data.data);
        setMttr(mttrRes.data.data);
      } catch (err) {
        // HCI Principle: Error Recovery. Tell the user what went wrong.
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-indigo-400 animate-pulse text-lg">Loading Analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">System Overview</h1>
          <p className="text-slate-400 text-sm">Real-time incident analytics</p>
        </div>
        {/* HCI Principle: Primary Action is distinct and easily accessible */}
        <Link 
          to="/incidents/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <span>➕</span> Report Incident
        </Link>
      </div>

      {/* HCI Principle: Glanceability. Top KPI cards chunk the most vital info. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm font-medium">Total Incidents</p>
          <p className="text-3xl font-bold text-white mt-2">{summary?.totalIncidents}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm font-medium">Open / Investigating</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {summary?.openIncidents} / {summary?.investigatingIncidents}
          </p>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm font-medium">Critical Incidents</p>
          <p className="text-3xl font-bold text-red-500 mt-2">{summary?.criticalIncidents}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm font-medium">Mean Time To Resolve (MTTR)</p>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {mttr?.mttrMinutes > 0 ? `${mttr.mttrMinutes}m` : 'N/A'}
          </p>
          <p className="text-slate-500 text-xs mt-1">Industry target: &lt; 30m</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Line Chart */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 lg:col-span-2 h-96 flex flex-col">
          <h2 className="text-white font-semibold mb-4">Incident Volume (Last 8 Weeks)</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="week" 
                  stroke="#94a3b8" 
                  tickFormatter={(val) => `W${val}`} 
                  tick={{ fontSize: 12 }} 
                />
                <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#818cf8' }}
                  labelFormatter={(val) => `Week ${val}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#818cf8" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#818cf8', strokeWidth: 2, stroke: '#1e293b' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Pie Chart */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 h-96 flex flex-col">
          <h2 className="text-white font-semibold mb-4">Incidents by Severity</h2>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="severity"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm">No data available</p>
            )}
          </div>
          {/* Custom Legend */}
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {severityData.map((entry) => (
              <div key={entry.severity} className="flex items-center gap-1.5 text-xs text-slate-300">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[entry.severity] }}></div>
                {entry.severity} ({entry.count})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
