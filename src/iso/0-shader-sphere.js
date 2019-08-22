// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const glslify = require('glslify');
const canvasSketch = require('canvas-sketch');

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
  renderer.setClearColor('pink', 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color('tomato') }
    },
    wireframe: true,
    vertexShader: glslify(`
      #pragma glslify: noise = require('glsl-noise/simplex/4d');
      uniform float time;
      void main () {
        vec3 transformed = position.xyz;
        
        float n = noise(vec4(position.xyz, time)) * 0.5 + 0.5;
        transformed += n * normal;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `),
    fragmentShader: `
      uniform vec3 color;
      void main () {
        gl_FragColor = vec4(color, 1.0);
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
