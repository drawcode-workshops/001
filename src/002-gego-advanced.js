// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');
const risoColors = require('riso-colors');
const paperColors = require('paper-colors');
const Random = require('canvas-sketch-util/random');
const createTubeWireframe = require('three-tube-wireframe');

const settings = {
  dimensions: [ 1024, 1024 ],
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

  // WebGL background color
  renderer.setClearColor(Random.pick(paperColors).hex, 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(2, 2, -2);
  camera.lookAt(new THREE.Vector3());

  // Setup your scene
  const scene = new THREE.Scene();

  const color = Random.pick(risoColors).hex;

  // Choose a geometry type
  const geometry = new THREE.PlaneGeometry(2, 2, 15, 15);
  // const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 4, 8);

  geometry.vertices.forEach(vertex => {
    const f = 0.75;
    const amp = 0.5;

    // One option is just to push out along Z axis using 2D noise
    // const n = Random.noise2D(vertex.x * f, vertex.y * f);
    // vertex.z += n * amp;

    // Another option is to rotate by 3D noise
    const n = Random.noise3D(vertex.x * f, vertex.y * f, vertex.z * f);
    vertex.applyEuler(new THREE.Euler(0, n * amp * Math.PI / 2, 0));
  });

  // Make ThreeJS update its vertex normals
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color
  });

  const wireGeometry = createTubeWireframe(geometry, {
    thickness: 0.0045,
    radiusSegments: 4,
    filter: () => Random.gaussian() > -0.5,
    mode: 'quad'
  });
  const mesh = new THREE.Mesh(wireGeometry, material);
  scene.add(mesh);

  const joinGeometry = new THREE.TorusGeometry(0.75, 0.2, 8, 4);

  geometry.vertices.forEach(position => {
    const joinMaterial = new THREE.MeshBasicMaterial({
      color
    });

    const join = new THREE.Mesh(joinGeometry, joinMaterial);
    join.position.copy(position);
    join.scale.setScalar(0.025);

    // it looks interesting to have random orientations for each
    join.quaternion.fromArray(Random.quaternion());

    scene.add(join);
  });

  // draw each frame
  return {
    // Handle resize events here
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render ({ playhead }) {
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload () {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
