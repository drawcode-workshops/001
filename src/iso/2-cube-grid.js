// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const risoColors = require('riso-colors').map(c => c.hex);
const paperColors = require('paper-colors').map(c => c.hex);

const settings = {
  // Make the loop animated
  dimensions: 'letter',
  pixelsPerInch: 300,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  const background = Random.pick(paperColors);

  // WebGL background color
  renderer.setClearColor(background, 1);

  // Setup a camera
  const camera = new THREE.OrthographicCamera();

  // Setup your scene
  const scene = new THREE.Scene();

  const gridSize = 10;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);
  const meshes = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const color = Random.pick(risoColors);
      const material = new THREE.MeshBasicMaterial({
        color
      });
      const top = new THREE.MeshBasicMaterial({
        color: background
      });
      const mesh = new THREE.Mesh(geometry, [
        material,
        material,
        top,
        material,
        material,
        material
      ]);
      scene.add(mesh);

      const mid = gridSize / 2;
      const px = x - mid;
      const py = y - mid;

      mesh.position.set(px, -7, py);
      mesh.scale.set(1, Math.abs(Random.gaussian(1, 5)), 1);
      meshes.push(mesh);
    }
  }

  // draw each frame
  return {
    // Handle resize events here
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      const aspect = viewportWidth / viewportHeight;

      // Ortho zoom
      const zoom = gridSize * 1.25;

      // Bounds
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;

      // Near/Far
      camera.near = -100;
      camera.far = 100;

      // Set position & look at world center
      camera.position.set(zoom, zoom, zoom);
      camera.lookAt(new THREE.Vector3());

      // Update the camera
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render ({ time }) {
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload () {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
