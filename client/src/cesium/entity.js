export function createTrajectoryEntity(viewer, samples, startTimeStr) {
  const position = new Cesium.SampledPositionProperty();
  const startTime = Cesium.JulianDate.fromIso8601(startTimeStr);

  samples.forEach(sample => {
    const time = Cesium.JulianDate.addSeconds(startTime, sample.time, new Cesium.JulianDate());
    const cartesian = Cesium.Cartesian3.fromDegrees(sample.lon, sample.lat, sample.alt);
    position.addSample(time, cartesian);
  });

  const entity = viewer.entities.add({
    name: 'Trajectory',
    position: position,
    orientation: new Cesium.VelocityOrientationProperty(position),
    path: {
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.3,
        taperPower: 0.5,
        color: Cesium.Color.CYAN
      }),
      width: 6,
      leadTime: 0,
      trailTime: 10000 // Keep trail visible
    },
    model: {
      uri: "./assets/Cesium_Air.glb",
      minimumPixelSize: 64
    }
  });

  return { entity, startTime };
}
