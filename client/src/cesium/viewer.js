export function initViewer(containerId) {
  const viewer = new Cesium.Viewer(containerId, {
    shouldAnimate: true,
    baseLayerPicker: false,
    sceneModePicker: false,
    animation: true,
    timeline: true,
    baseLayer: new Cesium.ImageryLayer(new Cesium.UrlTemplateImageryProvider({
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      credit: "Map data © OpenStreetMap contributors"
    }))
  });
  
  // Enable depth testing so the trajectory goes behind the globe when necessary
  viewer.scene.globe.depthTestAgainstTerrain = true;
  
  return viewer;
}
