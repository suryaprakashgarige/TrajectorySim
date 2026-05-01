import { initViewer } from './cesium/viewer.js';
import { createTrajectoryEntity } from './cesium/entity.js';
import { simulateTrajectory } from './services/api.js';

let viewer;
let startPoint = null;
let targetPoint = null;
let handler = null;
let preRenderListener = null;

function addMarker(lat, lon, color) {
    viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
        point: {
            pixelSize: 10,
            color: color
        }
    });
}

function setupInteraction() {
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((click) => {
        let cartesian = viewer.scene.pickPosition(click.position);
        if (!cartesian) {
            const ray = viewer.camera.getPickRay(click.position);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
        if (!cartesian) return;

        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);

        if (!startPoint) {
            startPoint = { lat, lon };
            addMarker(lat, lon, Cesium.Color.GREEN);
            document.getElementById('start-status').textContent = `1. Start: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        } else if (!targetPoint) {
            targetPoint = { lat, lon };
            addMarker(lat, lon, Cesium.Color.RED);
            document.getElementById('target-status').textContent = `2. Target: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function resetScene() {
    viewer.entities.removeAll();
    startPoint = null;
    targetPoint = null;
    document.getElementById('start-status').textContent = `1. Click on globe for Start (Green)`;
    document.getElementById('target-status').textContent = `2. Click on globe for Target (Red)`;
    viewer.trackedEntity = undefined;
    document.getElementById('hud-panel').style.display = 'none';
    if (preRenderListener) {
        viewer.scene.preRender.removeEventListener(preRenderListener);
        preRenderListener = null;
    }
}

async function runSimulation() {
  if (!startPoint || !targetPoint) {
    alert("Select start and target");
    return;
  }

  try {
    const trajectoryData = await simulateTrajectory(startPoint, targetPoint);
    
    viewer.entities.removeAll();
    addMarker(startPoint.lat, startPoint.lon, Cesium.Color.GREEN);
    addMarker(targetPoint.lat, targetPoint.lon, Cesium.Color.RED);

    const startTimeStr = Cesium.JulianDate.toIso8601(Cesium.JulianDate.now());
    const { entity, startTime } = createTrajectoryEntity(viewer, trajectoryData.samples, startTimeStr);

    const stopTime = Cesium.JulianDate.addSeconds(startTime, trajectoryData.totalTime, new Cesium.JulianDate());

    viewer.clock.startTime = startTime.clone();
    viewer.clock.stopTime = stopTime.clone();
    viewer.clock.currentTime = startTime.clone();
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 10;

    viewer.trackedEntity = entity;
    document.getElementById('hud-panel').style.display = 'block';

    const targetCartesian = Cesium.Cartesian3.fromDegrees(targetPoint.lon, targetPoint.lat, 0);
    let lastTime = viewer.clock.currentTime;
    let lastPosition = null;

    if (preRenderListener) {
        viewer.scene.preRender.removeEventListener(preRenderListener);
    }

    preRenderListener = function() {
        if (!viewer.trackedEntity) return;

        const currentTime = viewer.clock.currentTime;
        const position = viewer.trackedEntity.position.getValue(currentTime);

        if (!position) return;

        const cartographic = Cesium.Cartographic.fromCartesian(position);
        const altitudeKm = (cartographic.height / 1000).toFixed(2);
        
        const distanceMeters = Cesium.Cartesian3.distance(position, targetCartesian);
        const distanceKm = (distanceMeters / 1000).toFixed(2);

        let speedMach = "0.00";
        if (lastPosition) {
            const timeDiff = Cesium.JulianDate.secondsDifference(currentTime, lastTime);
            if (timeDiff > 0) {
                const distDiff = Cesium.Cartesian3.distance(position, lastPosition);
                const speedMps = distDiff / timeDiff;
                speedMach = (speedMps / 343).toFixed(2); // 1 Mach = 343m/s
            }
        }

        const flightTime = Cesium.JulianDate.secondsDifference(currentTime, startTime).toFixed(1);

        document.getElementById('hud-alt').textContent = altitudeKm + " km";
        document.getElementById('hud-dist').textContent = distanceKm + " km";
        if (speedMach !== "0.00") document.getElementById('hud-speed').textContent = speedMach + " Mach";
        document.getElementById('hud-time').textContent = Math.max(0, flightTime) + " s";

        lastPosition = position;
        lastTime = currentTime.clone();
    };
    
    viewer.scene.preRender.addEventListener(preRenderListener);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

function init() {
  viewer = initViewer('cesiumContainer');
  setupInteraction();
  
  document.getElementById('simulateBtn').addEventListener('click', runSimulation);
  document.getElementById('resetBtn').addEventListener('click', resetScene);
}

window.onload = init;
