const fs = require('fs');
let file = fs.readFileSync('PROJECT_CONTEXT.md', 'utf8');

const additions = `
Q11 🧠 How did you handle User Authentication and Security?
-> Answer: "I implemented a highly secure Role-Based Access Control (RBAC) system using JWTs and Express middleware. I completely locked down the registration API so attackers cannot escalate their privileges via Postman (e.g. Mass Assignment vulnerability). In the frontend, I used contextual UI rendering so 'Viewers' (like Stakeholders) cannot even see the buttons to edit or resolve incidents, while 'Admins' have exclusive access to a Team Directory and Delete capabilities."

Q12 🧠 Explain your Multi-Tenant SaaS Architecture.
-> Answer: "I designed the system to support multiple companies (organizations) sharing the same infrastructure, similar to Datadog or Slack. I modified the database schemas to tag every incident with an Organization ID. The backend controllers dynamically scope MongoDB queries based on the user's JWT payload. If a Viewer from 'VIT' logs in, the API intercepts the request and injects \`{ organization: 'VIT' }\` into the MongoDB aggregation pipeline. This ensures strict data privacy while maintaining a single global codebase."
`;

file += additions;
fs.writeFileSync('PROJECT_CONTEXT.md', file);
