const Incident = require('../models/Incident.model');
const PostMortem = require('../models/PostMortem.model');

// ==========================================
// ANALYTICS CONTROLLER
// ==========================================
// These are MongoDB AGGREGATION queries.
//
// Analogy: Regular queries are like asking "show me all incidents".
// Aggregation is like asking "GROUP all incidents by severity and COUNT each group"
// — like an Excel pivot table, but written in code.
//
// MongoDB aggregation uses a "pipeline" — a series of stages that
// transform the data step by step. Each stage takes input from the previous one.
// Common stages: $match (filter), $group (group+count), $sort, $project (reshape)
// ==========================================


// ==========================================
// 1. SUMMARY — KPI Cards
// Returns: totalIncidents, openCount, criticalCount, resolvedCount, investigatingCount
// ==========================================
exports.getSummary = async (req, res) => {

  let filter = {};
  if (req.user.role === 'viewer' || (req.user.role === 'engineer' && req.user.organization)) {
    filter = { organization: req.user.organization };
  } else if (req.user.role === 'engineer') {
    filter = { createdBy: req.user.id };
  }

  try {
    // Run 4 count queries in PARALLEL using Promise.all
    // Analogy: Instead of asking 4 questions one by one (slow),
    // ask all 4 at the same time and wait for all answers (fast)
    const [total, open, critical, resolved, investigating] = await Promise.all([
      Incident.countDocuments(filter),
      Incident.countDocuments({ ...filter,  status: 'Open' }),
      Incident.countDocuments({ ...filter,  severity: 'Critical' }),
      Incident.countDocuments({ ...filter,  status: 'Resolved' }),
      Incident.countDocuments({ ...filter,  status: 'Investigating' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalIncidents: total,
        openIncidents: open,
        criticalIncidents: critical,
        resolvedIncidents: resolved,
        investigatingIncidents: investigating,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// ==========================================
// 2. SEVERITY DISTRIBUTION — Pie / Donut Chart
// Returns: [{ severity: 'Critical', count: 5 }, { severity: 'High', count: 3 }, ...]
// ==========================================
exports.getSeverityDistribution = async (req, res) => {

  let filter = {};
  if (req.user.role === 'viewer' || (req.user.role === 'engineer' && req.user.organization)) {
    filter = { organization: req.user.organization };
  } else if (req.user.role === 'engineer') {
    filter = { createdBy: req.user.id };
  }

  try {
    // $group: GROUP all incidents by the 'severity' field
    // $sum: 1 means "count 1 for each incident in this group"
    // Result: [{ _id: 'Critical', count: 5 }, { _id: 'High', count: 3 }]
    const distribution = await Incident.aggregate([
{ $match: filter },
{ $group: {
          _id: '$severity',  // Group by the severity field
          count: { $sum: 1 } // Count incidents in each group
        }
      },
      {
        // Reshape the output: rename _id to severity, keep count
        $project: {
          _id: 0,
          severity: '$_id',
          count: 1
        }
      },
      {
        // Sort by count descending (highest first)
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// ==========================================
// 3. WEEKLY INCIDENT TREND — Line / Bar Chart
// Returns incidents grouped by week for the last 8 weeks
// ==========================================
exports.getWeeklyTrend = async (req, res) => {

  let filter = {};
  if (req.user.role === 'viewer' || (req.user.role === 'engineer' && req.user.organization)) {
    filter = { organization: req.user.organization };
  } else if (req.user.role === 'engineer') {
    filter = { createdBy: req.user.id };
  }

  try {
    // Calculate the date 8 weeks ago from now
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56); // 8 × 7 = 56 days

    const trend = await Incident.aggregate([
      {
        // STAGE 1: Filter — only look at incidents from the last 8 weeks
        $match: {
          createdAt: { $gte: eightWeeksAgo }
        }
      },
      {
        // STAGE 2: Group by year + week number
        // $isoWeek gives the ISO week number (1-53)
        // $isoWeekYear gives the year (to handle year boundaries correctly)
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' }
          },
          count: { $sum: 1 },
          // Also capture the first date of each week for display
          weekStart: { $min: '$createdAt' }
        }
      },
      {
        // STAGE 3: Sort by year then week (chronological order)
        $sort: { '_id.year': 1, '_id.week': 1 }
      },
      {
        // STAGE 4: Reshape for the frontend chart
        $project: {
          _id: 0,
          week: '$_id.week',
          year: '$_id.year',
          weekStart: 1,
          count: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// ==========================================
// 4. MTTR — Mean Time To Resolve
// MTTR = average time from incident CREATION to RESOLUTION
//
// Analogy: If 3 incidents took 30min, 60min, and 90min to fix,
// MTTR = (30 + 60 + 90) / 3 = 60 minutes.
//
// This is the #1 SRE metric that every engineering team tracks.
// Lower MTTR = your team is faster at fixing problems.
// ==========================================
exports.getMTTR = async (req, res) => {

  let filter = {};
  if (req.user.role === 'viewer' || (req.user.role === 'engineer' && req.user.organization)) {
    filter = { organization: req.user.organization };
  } else if (req.user.role === 'engineer') {
    filter = { createdBy: req.user.id };
  }

  try {
    const result = await Incident.aggregate([
      {
        // Only count incidents that are actually resolved
        $match: { status: 'Resolved' }
      },
      {
        // Calculate resolution time for each incident
        // $subtract between two dates gives the difference in MILLISECONDS
        $project: {
          resolutionTimeMs: {
            $subtract: ['$updatedAt', '$createdAt']
          }
        }
      },
      {
        // Average all the resolution times
        $group: {
          _id: null, // null means "group everything together" (no sub-grouping)
          avgResolutionTimeMs: { $avg: '$resolutionTimeMs' },
          minResolutionTimeMs: { $min: '$resolutionTimeMs' },
          maxResolutionTimeMs: { $max: '$resolutionTimeMs' },
          totalResolved: { $sum: 1 }
        }
      }
    ]);

    // If no resolved incidents yet, return zeros
    if (result.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          mttrMinutes: 0,
          mttrHours: 0,
          minResolutionMinutes: 0,
          maxResolutionMinutes: 0,
          totalResolved: 0,
          message: 'No resolved incidents yet'
        }
      });
    }

    const { avgResolutionTimeMs, minResolutionTimeMs, maxResolutionTimeMs, totalResolved } = result[0];

    // Convert milliseconds → minutes and hours for readability
    const toMinutes = (ms) => Math.round(ms / 1000 / 60);
    const toHours = (ms) => (ms / 1000 / 60 / 60).toFixed(2);

    res.status(200).json({
      success: true,
      data: {
        mttrMinutes: toMinutes(avgResolutionTimeMs),
        mttrHours: parseFloat(toHours(avgResolutionTimeMs)),
        minResolutionMinutes: toMinutes(minResolutionTimeMs),
        maxResolutionMinutes: toMinutes(maxResolutionTimeMs),
        totalResolved,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// ==========================================
// 5. STATUS BREAKDOWN
// Returns count of incidents per status (Open, Investigating, Resolved, Closed)
// Used for a secondary chart or summary table
// ==========================================
exports.getStatusBreakdown = async (req, res) => {
  try {
    const breakdown = await Incident.aggregate([
{ $match: filter },
{ $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({ success: true, data: breakdown });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


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
