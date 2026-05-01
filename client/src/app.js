import { initViewer } from './cesium/viewer.js';
import { createTrajectoryEntity } from './cesium/entity.js';
import { simulateTrajectory } from './services/api.js';

let viewer;

async function runSimulation() {
  const startLat = parseFloat(document.getElementById('startLat').value);
  const startLon = parseFloat(document.getElementById('startLon').value);
  const targetLat = parseFloat(document.getElementById('targetLat').value);
  const targetLon = parseFloat(document.getElementById('targetLon').value);

  if (isNaN(startLat) || isNaN(startLon) || isNaN(targetLat) || isNaN(targetLon)) {
    alert("Please enter valid coordinates");
    return;
  }

  const start = { lat: startLat, lon: startLon };
  const target = { lat: targetLat, lon: targetLon };

  try {
    const trajectoryData = await simulateTrajectory(start, target);
    
    // Clear previous entities
    viewer.entities.removeAll();

    // Set clock
    const startTimeStr = Cesium.JulianDate.toIso8601(Cesium.JulianDate.now());
    const { entity, startTime } = createTrajectoryEntity(viewer, trajectoryData.samples, startTimeStr);

    const stopTime = Cesium.JulianDate.addSeconds(startTime, trajectoryData.totalTime, new Cesium.JulianDate());

    viewer.clock.startTime = startTime.clone();
    viewer.clock.stopTime = stopTime.clone();
    viewer.clock.currentTime = startTime.clone();
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 10;

    viewer.trackedEntity = entity;
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

function init() {
  viewer = initViewer('cesiumContainer');
  
  document.getElementById('simulateBtn').addEventListener('click', runSimulation);
}

// Wait for Cesium to load, since we are loading it via script tag
window.onload = init;
