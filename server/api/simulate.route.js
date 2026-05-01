const express = require('express');
const { generateTrajectory } = require('../core/trajectory');

const router = express.Router();

router.post('/simulate', (req, res) => {
  try {
    const { start, target } = req.body;
    
    if (!start || !target || start.lat == null || start.lon == null || target.lat == null || target.lon == null) {
      return res.status(400).json({ error: "Invalid start or target parameters" });
    }

    const config = {
      velocity: 2000 // hardcoded as per spec
    };

    const trajectory = generateTrajectory(start, target, config);
    res.json(trajectory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
