// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');
require('three/examples/js/math/ConvexHull');
require('three/examples/js/geometries/ConvexGeometry');

const glslify = require('glslify');
const canvasSketch = require('canvas-sketch');
const convexHull = require('convex-hull');
const { linspace } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const risoColors = require('riso-colors').map(c => c.hex);
const paperColors = require('paper-colors').map(c => c.hex);
const unindex = require('unindex-mesh');

const settings = {
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
  renderer.setClearColor(Random.pick(paperColors), 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Get N random points in a sphere
  let points = linspace(15).map(() => {
    const point = Random.insideSphere(1);
    return new THREE.Vector3().fromArray(point);
  });

  const geometry = new THREE.ConvexBufferGeometry(points);
  geometry.center();

  const colors = [];
  const vertexCount = geometry.getAttribute('position').count;
  for (let i = 0; i < vertexCount; i++) {
    const color = new THREE.Color(Random.pick(risoColors));
    for (let t = 0; t < 3; t++) {
      colors.push(color.r, color.g, color.b);
    }
  }

  const color = new THREE.BufferAttribute(new Float32Array(colors), 3);
  geometry.addAttribute('color', color);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    side: THREE.DoubleSide,
    vertexShader: glslify(`
      attribute vec3 color;
      uniform float time;
      varying vec3 vColor;
      varying vec2 vUv;
      void main () {
        vec3 transformed = position.xyz;
        vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `),
    fragmentShader: `
      varying vec3 vColor;
      void main () {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

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
    render ({ time }) {
      mesh.material.uniforms.time.value = time;
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