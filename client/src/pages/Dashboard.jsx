import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// HCI Principle: Color coding builds a mental model.
// Critical = Red (Danger), High = Orange (Warning), Medium = Yellow, Low = Blue (Info)
const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#3b82f6'
};

const Dashboard = () => {
  const { user } = useAuth();
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

  const formatMTTR = (minutes) => {
    if (!minutes || minutes <= 0) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h < 24) return `${h}h ${m}m`;
    const d = Math.floor(h / 24);
    const remainingH = h % 24;
    return `${d}d ${remainingH}h`;
  };

  // Fintech Calculation: Assume $1,500 lost per minute of downtime
  const calculateCostImpact = () => {
    if (!mttr?.mttrMinutes || !summary?.totalIncidents) return '$0';
    const totalCost = mttr.mttrMinutes * summary.totalIncidents * 1500;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalCost);
  };

  const handleExport = async (type) => {
    try {
      const url = type ? `/analytics/export?type=${type}` : '/analytics/export';
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'opsincident_report.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-zinc-400 animate-pulse text-lg">Loading Analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center mt-20 p-4 bg-zinc-950 border border-red-500/30 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">System Overview</h1>
          <p className="text-zinc-400 text-sm mt-1">Analytics and KPIs</p>
        </div>
        
        <div className="flex gap-3">
          {/* Admin Export Dropdown */}
          {user?.role === 'admin' ? (
            <div className="relative group">
              <button className="bg-zinc-800 text-white hover:bg-zinc-700 px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 border border-zinc-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export CSV ⬇️
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button onClick={() => handleExport('all')} className="w-full text-left block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white">Global Data (All)</button>
                <button onClick={() => handleExport('orgs')} className="w-full text-left block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white">Organizations Only</button>
                <button onClick={() => handleExport('solo')} className="w-full text-left block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white">Solo Engineers Only</button>
              </div>
            </div>
          ) : (
            /* Standard Export Button (Viewers & Engineers) */
            <button 
              onClick={() => handleExport()}
              className="bg-zinc-800 text-white hover:bg-zinc-700 px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 border border-zinc-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export CSV
            </button>
          )}

          {/* Report Incident (Hidden from Viewers) */}
          {user?.role !== 'viewer' && (
            <Link
              to="/incidents/new"
              className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Report Incident
            </Link>
          )}
        </div>
      </div>

      {/* Admin Only: Fintech Cost Impact */}
      {user?.role === 'admin' && (
        <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-red-400 font-semibold mb-1 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Estimated Revenue Impact (30d)
              </h2>
              <p className="text-zinc-400 text-sm">Calculated at $1,500 downtime cost per minute (Fintech Standard)</p>
            </div>
            <p className="text-3xl font-bold text-red-500">{calculateCostImpact()}</p>
          </div>
        </div>
      )}

      {/* KPI Cards - HCI Principle: Chunking & Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950 p-5 rounded-md border border-zinc-800">
          <p className="text-zinc-400 text-sm font-medium">Total Incidents (30d)</p>
          <p className="text-3xl font-bold text-white mt-2">{summary?.totalIncidents}</p>
        </div>
        <div className="bg-zinc-950 p-5 rounded-md border border-zinc-800">
          <p className="text-zinc-400 text-sm font-medium">Open / Investigating</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {summary?.openIncidents} / {summary?.investigatingIncidents}
          </p>
        </div>
        <div className="bg-zinc-950 p-5 rounded-md border border-zinc-800">
          <p className="text-zinc-400 text-sm font-medium">Critical Incidents</p>
          <p className="text-3xl font-bold text-red-500 mt-2">{summary?.criticalIncidents}</p>
        </div>
        <div className="bg-zinc-950 p-5 rounded-md border border-zinc-800">
          <p className="text-zinc-400 text-sm font-medium">Mean Time To Resolve (MTTR)</p>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {formatMTTR(mttr?.mttrMinutes)}
          </p>
          <p className="text-zinc-500 text-xs mt-1">Industry target: &lt; 30m</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Line Chart */}
        <div className="bg-zinc-950 p-5 rounded-md border border-zinc-800 lg:col-span-2 h-96 flex flex-col">
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
        <div className="bg-zinc-950 p-5 rounded-md border border-zinc-800 h-96 flex flex-col">
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
              <p className="text-zinc-500 text-sm">No data available</p>
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
