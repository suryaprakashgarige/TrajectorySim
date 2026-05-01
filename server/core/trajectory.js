const geo = require('./geo');
const kinematics = require('./kinematics');

function generateTrajectory(start, target, config) {
  const { velocity } = config;
  const distance = geo.haversineDistance(start.lat, start.lon, target.lat, target.lon);
  
  if (distance === 0) {
    throw new Error("Distance must be greater than 0");
  }

  const bearing = geo.initialBearing(start.lat, start.lon, target.lat, target.lon);
  const totalTime = kinematics.computeTotalTime(distance, velocity);

  if (totalTime < 1) {
    throw new Error("Total time is too short (< 1s)");
  }

  const samples = [];

  for (let t = 0; t <= totalTime; t += 1) {
    const f = t / totalTime;
    const d = f * distance;
    const pos = geo.destinationPoint(start.lat, start.lon, bearing, d);
    let alt = kinematics.altitudeProfile(t, totalTime);
    
    // Clamp altitude >= 0
    if (alt < 0) alt = 0;

    samples.push({
      time: t,
      lat: pos.lat,
      lon: pos.lon,
      alt: alt
    });
  }

  // Ensure target point is included as the last sample if it doesn't align perfectly with integer time
  const finalTime = Math.ceil(totalTime);
  if (samples.length === 0 || samples[samples.length - 1].time !== finalTime) {
    samples.push({
      time: finalTime,
      lat: target.lat,
      lon: target.lon,
      alt: 0
    });
  }

  return {
    totalTime,
    totalDistance: distance,
    samples
  };
}

module.exports = {
  generateTrajectory
};
