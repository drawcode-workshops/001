// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');
const risoColors = require('riso-colors');
const paperColors = require('paper-colors');
const Random = require('canvas-sketch-util/random');
const createTubeWireframe = require('three-tube-wireframe');
const glslify = require('glslify');

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
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
  const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  const color = Random.pick(risoColors).hex;

  // const geometry = new THREE.SphereGeometry(1, 16, 8);
  const geometry = new THREE.PlaneGeometry(4, 4, 15, 15);
  const wireGeometry = createTubeWireframe(geometry, {
    thickness: 0.01,
    buffer: true,
    mode: 'quad',
    radiusSegments: 3,
    lengthSegments: 3,
  });
  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      time: { value: 0 },
      opacity: { value: 1 }
    },
    transparent: true,
    vertexShader: glslify(`
      #pragma glslify: noise = require('glsl-noise/simplex/4d');
      attribute vec3 basePosition;
      uniform float time;
      void main () {
        vec3 transformed = position.xyz;

        float n = noise(vec4(basePosition.xyz * 0.5, time * 0.5));
        transformed.z += n;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `),
    fragmentShader: glslify(`
      uniform vec3 color;
      uniform float opacity;
      void main () {
        gl_FragColor = vec4(color, opacity);
      }
    `)
  });
  const mesh = new THREE.Mesh(wireGeometry, material);
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
      material.uniforms.time.value = time;
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
