const fs = require('fs');
let file = fs.readFileSync('src/controllers/analytics.controller.js', 'utf8');

const injectFilter = `
  let filter = {};
  if (req.user.role === 'viewer' || (req.user.role === 'engineer' && req.user.organization)) {
    filter = { organization: req.user.organization };
  } else if (req.user.role === 'engineer') {
    filter = { createdBy: req.user.id };
  }
`;

file = file.replace(/exports\.getSummary = async \(req, res\) => \{/g, `exports.getSummary = async (req, res) => {\n${injectFilter}`);
file = file.replace(/Incident\.countDocuments\(\)/g, 'Incident.countDocuments(filter)');
file = file.replace(/Incident\.countDocuments\(\{/g, 'Incident.countDocuments({ ...filter, ');

file = file.replace(/exports\.getSeverityDistribution = async \(req, res\) => \{/g, `exports.getSeverityDistribution = async (req, res) => {\n${injectFilter}`);
file = file.replace(/\[\s*\{\s*\$group/g, '[\n{ $match: filter },\n{ $group');

file = file.replace(/exports\.getWeeklyTrend = async \(req, res\) => \{/g, `exports.getWeeklyTrend = async (req, res) => {\n${injectFilter}`);
file = file.replace(/\[\s*\{\s*\$match:\s*\{/g, '[\n{ $match: { ...filter, ');

file = file.replace(/exports\.getMTTR = async \(req, res\) => \{/g, `exports.getMTTR = async (req, res) => {\n${injectFilter}`);
file = file.replace(/\[\s*\{\s*\$match:\s*\{\s*status:\s*'Resolved'\s*\}\s*\}/g, "[\n{ $match: { ...filter, status: 'Resolved' } }");

fs.writeFileSync('src/controllers/analytics.controller.js', file);
