// AgentStepper — Live AI pipeline progress tracker
// Shows which agent is currently running and what's done
// Listens to Socket.IO 'agent_update' events in real-time

const AGENTS = [
  { key: 'logAnalyzer', label: 'Log Analyzer', icon: '🕵️' },
  { key: 'rootCauseAnalyzer', label: 'Root Cause Analyzer', icon: '🔬' },
  { key: 'runbookMatcher', label: 'Runbook Matcher', icon: '📗' },
  { key: 'postMortemGenerator', label: 'Post-Mortem Generator', icon: '📝' },
];

const AgentStepper = ({ events }) => {
  // Build a map of agent → latest status from the events array
  const statusMap = {};
  events.forEach((e) => {
    statusMap[e.agent] = e;
  });

  return (
    <div className="bg-zinc-950 rounded-md p-6 border border-zinc-800">
      <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
        🤖 AI Pipeline Progress
      </h3>

      <div className="space-y-4">
        {AGENTS.map((agent, index) => {
          const event = statusMap[agent.key];
          const status = event?.status || 'pending';

          return (
            <div key={agent.key} className="flex items-start gap-4">
              {/* Step number / status icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2 transition-all ${
                status === 'done'
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : status === 'started'
                  ? 'bg-indigo-500/20 border-white text-zinc-300 animate-pulse'
                  : status === 'error'
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}>
                {status === 'done' ? '✓' : status === 'error' ? '✗' : agent.icon}
              </div>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{agent.label}</span>
                  {status === 'started' && (
                    <span className="text-xs bg-indigo-500/20 text-zinc-300 px-2 py-0.5 rounded-full animate-pulse">
                      Running...
                    </span>
                  )}
                  {status === 'done' && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  )}
                </div>
                {event?.message && (
                  <p className="text-zinc-400 text-xs mt-1">{event.message}</p>
                )}
                {/* Show extra data if available */}
                {status === 'done' && event?.data && Object.keys(event.data).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(event.data).map(([key, val]) => (
                      <span key={key} className="text-xs bg-zinc-900 text-slate-300 px-2 py-1 rounded">
                        {key}: <span className="text-white font-medium">{String(val)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentStepper;
