const fs = require('fs');
let file = fs.readFileSync('PROJECT_CONTEXT.md', 'utf8');

const additions = `
Q13 🧠 How did you handle Data Analytics and Reporting?
-> Answer: "I built an end-to-end ETL (Extract, Transform, Load) pipeline for business stakeholders. Instead of just showing a static dashboard, I created a backend Node.js stream that Extracts live NoSQL data from MongoDB (using Multi-Tenant RBAC scoping), Transforms it on the fly by calculating complex metrics like 'Downtime Minutes' and 'Estimated Financial Impact', and Loads it into a dynamic CSV file format for users to download. I also implemented advanced slicing for Admins, allowing them to download global data, organization-specific data, or solo-engineer data."
`;

if (!file.includes('Q13')) {
  file += additions;
  fs.writeFileSync('PROJECT_CONTEXT.md', file);
}
