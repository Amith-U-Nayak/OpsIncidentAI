import { Link } from 'react-router-dom';

const Guide = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">How to Use OpsIncidentAI</h1>
        <p className="text-zinc-400 mt-2 text-lg">
          Welcome to the AI-powered incident management platform. Follow this guide to see the LangGraph AI pipeline in action.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Step 1 */}
        <div className="bg-black border border-zinc-800 rounded-md p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold">1</div>
            <h2 className="text-xl font-semibold text-white">Create a Test Incident</h2>
          </div>
          <p className="text-zinc-400 mb-4 ml-12">
            Navigate to the <Link to="/incidents/new" className="text-white underline hover:text-zinc-300">New Incident</Link> page. This simulates a real production outage. You can use the sample data below to see how the AI handles a database connection failure.
          </p>
          <div className="ml-12 bg-zinc-950 border border-zinc-800 rounded-md p-4 space-y-3">
            <div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold block mb-1">Sample Title</span>
              <code className="text-zinc-200">Database Connection Timeout in Production</code>
            </div>
            <div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold block mb-1">Sample Description</span>
              <code className="text-zinc-200">The main user-service API is failing to connect to the MongoDB replica set, causing a cascade of 500 errors during user checkout.</code>
            </div>
            <div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold block mb-1">Sample Error Log (Save to a .txt file and upload)</span>
              <pre className="text-zinc-300 text-sm overflow-x-auto p-2 bg-black border border-zinc-800 rounded mt-1">
{`2026-09-02T10:15:32Z ERROR [UserService] MongoTimeoutError: Server selection timed out after 30000 ms
2026-09-02T10:15:32Z WARN  [CheckoutAPI] Failing healthcheck, database unreachable
2026-09-02T10:15:35Z FATAL [API_GATEWAY] 503 Service Unavailable - upstream connect error`}
              </pre>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-black border border-zinc-800 rounded-md p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold">2</div>
            <h2 className="text-xl font-semibold text-white">Watch the AI Assembly Line</h2>
          </div>
          <p className="text-zinc-400 ml-12">
            Once you submit the incident, our 4-stage LangGraph AI pipeline takes over automatically:
          </p>
          <ul className="ml-12 mt-4 space-y-3 text-zinc-300 list-disc list-inside">
            <li><strong className="text-white">Agent 1 (Log Analyzer):</strong> Extracts the core error strings from your uploaded files.</li>
            <li><strong className="text-white">Agent 2 (Root Cause Expert):</strong> Determines exactly why the system failed.</li>
            <li><strong className="text-white">Agent 3 (Runbook Matcher):</strong> Searches historical vectors and the web for mitigation steps.</li>
            <li><strong className="text-white">Agent 4 (Post-Mortem Generator):</strong> Drafts a professional executive summary.</li>
          </ul>
        </div>

        {/* Step 3 */}
        <div className="bg-black border border-zinc-800 rounded-md p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold">3</div>
            <h2 className="text-xl font-semibold text-white">Review the Post-Mortem</h2>
          </div>
          <p className="text-zinc-400 ml-12">
            After the AI finishes, click on the Incident in your Dashboard. Navigate to the <strong>Post-Mortem</strong> tab to read the AI-generated resolution, and see whether it sourced the fix from historical runbooks or live web knowledge.
          </p>
        </div>
        {/* Step 4: Multi-Tenant Architecture */}
        <div className="bg-black border border-zinc-800 rounded-md p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold">4</div>
            <h2 className="text-xl font-semibold text-white">Test the Multi-Tenant RBAC</h2>
          </div>
          <p className="text-zinc-400 mb-4 ml-12">
            This platform acts as a multi-tenant SaaS (like Slack or Datadog). Your data visibility changes based on your Role and Organization.
          </p>
          <ul className="list-disc list-inside text-zinc-400 ml-12 space-y-2 mb-4">
            <li><strong className="text-zinc-200">Admin:</strong> Full access. Can see the massive "Fintech Cost Impact" dashboard widget, delete incidents, and search the global incident database.</li>
            <li><strong className="text-zinc-200">Engineer:</strong> Can create and resolve incidents. If an Engineer belongs to "Company X", they share a dashboard with everyone in Company X.</li>
            <li><strong className="text-zinc-200">Viewer (Stakeholder):</strong> Read-only access. The system hides creation/resolution buttons. They can only view data for their specific Organization.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Guide;
