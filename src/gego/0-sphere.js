// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');

const settings = {
  dimensions: [ 1024, 1024 ],
  // Set a total duration of the loop
  duration: 5,
  // Make the loop animated
  animate: true,
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
  renderer.setClearColor('hsl(0, 0%, 95%)', 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
  camera.position.set(1, 1, -3);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Choose a geometry type
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  // const geometry = new THREE.PlaneGeometry(2, 2, 8, 8);
  // const geometry = new THREE.SphereGeometry(1, 16, 8);

  const material = new THREE.MeshBasicMaterial({
    color: 'black',
    wireframe: true
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const joinGeometry = new THREE.TorusGeometry(1.5, 0.25, 8, 8);

  const joins = geometry.vertices.map(position => {
    const joinMaterial = new THREE.MeshBasicMaterial({
      color: 'black'
    });

    const join = new THREE.Mesh(joinGeometry, joinMaterial);
    join.position.copy(position);
    join.scale.setScalar(0.025);
    join.lookAt(new THREE.Vector3());
    scene.add(join);
    return join;
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
      scene.rotation.y = playhead * Math.PI * 1;
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload () {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
