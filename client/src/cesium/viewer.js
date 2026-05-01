export function initViewer(containerId) {
  const viewer = new Cesium.Viewer(containerId, {
    shouldAnimate: true,
    terrainProvider: Cesium.createWorldTerrain(),
    baseLayerPicker: false,
    sceneModePicker: false,
    animation: true,
    timeline: true
  });
  
  // Enable depth testing so the trajectory goes behind the globe when necessary
  viewer.scene.globe.depthTestAgainstTerrain = true;
  
  return viewer;
}
