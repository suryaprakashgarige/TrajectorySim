const g = 9.81;
const MAX_ALTITUDE = 150000; // meters

function computeTotalTime(distance, velocity) {
  return distance / velocity;
}

function altitudeProfile(t, totalTime) {
  const f = t / totalTime;
  const h = 4 * MAX_ALTITUDE * f * (1 - f);
  return Math.max(0, h);
}

function velocityProfile(t, totalTime, v) {
  if (t < 0.2 * totalTime) return v * (t / (0.2 * totalTime));
  if (t < 0.8 * totalTime) return v;
  return v * (1 - (t - 0.8 * totalTime) / (0.2 * totalTime));
}

module.exports = {
  computeTotalTime,
  altitudeProfile,
  velocityProfile
};
