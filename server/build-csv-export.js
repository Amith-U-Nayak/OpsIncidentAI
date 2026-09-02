const fs = require('fs');

let ctrl = fs.readFileSync('src/controllers/analytics.controller.js', 'utf8');
const exportFunc = `
const { Parser } = require('json2csv');

exports.exportCsv = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'admin') {
      const type = req.query.type;
      if (type === 'orgs') filter = { organization: { $ne: null } };
      else if (type === 'solo') filter = { organization: null };
    } else if (req.user.role === 'viewer' || (req.user.role === 'engineer' && req.user.organization)) {
      filter = { organization: req.user.organization };
    } else if (req.user.role === 'engineer') {
      filter = { createdBy: req.user.id };
    }

    const incidents = await require('../models/Incident.model').find(filter)
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });

    const transformedData = incidents.map(inc => {
      let downtime = 'Ongoing';
      let cost = 'Pending';
      if (inc.status === 'Resolved' && inc.updatedAt && inc.createdAt) {
        const mins = Math.round((new Date(inc.updatedAt) - new Date(inc.createdAt)) / 60000);
        downtime = mins;
        cost = '$' + (mins * 1500).toLocaleString();
      }
      return {
        'Incident ID': inc._id.toString(),
        'Title': inc.title,
        'Organization': inc.organization || 'Solo',
        'Severity': inc.severity,
        'Status': inc.status,
        'Engineer': inc.createdBy?.name || 'Unknown',
        'Created At': new Date(inc.createdAt).toLocaleString(),
        'Resolved At': inc.status === 'Resolved' ? new Date(inc.updatedAt).toLocaleString() : 'N/A',
        'Downtime (Minutes)': downtime,
        'Financial Impact': cost
      };
    });

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(transformedData.length > 0 ? transformedData : {});

    res.header('Content-Type', 'text/csv');
    res.attachment('opsincident_report.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
`;
ctrl = ctrl + '\n' + exportFunc;
fs.writeFileSync('src/controllers/analytics.controller.js', ctrl);

let routes = fs.readFileSync('src/routes/analytics.routes.js', 'utf8');
routes = routes.replace('getStatusBreakdown,', 'getStatusBreakdown,\n  exportCsv,');
routes = routes.replace('module.exports = router;', "router.get('/export', exportCsv);\n\nmodule.exports = router;");
fs.writeFileSync('src/routes/analytics.routes.js', routes);
