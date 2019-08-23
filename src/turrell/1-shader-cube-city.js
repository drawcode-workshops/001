// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const risoColors = require('riso-colors').map(c => c.hex);
const paperColors = require('paper-colors').map(c => c.hex);

const settings = {
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  dimensions: [ 2048, 2048 ],
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = (props) => {
  const { context } = props;
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // WebGL background color
  const background = Random.pick(paperColors);

  renderer.setClearColor(background, 1);

  // Setup a camera
  const camera = new THREE.OrthographicCamera();

  // Setup your scene
  const scene = new THREE.Scene();

  // Create a new box
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);

  // Choose a random color for all cubes
  const color = Random.pick(risoColors);

  // A function to create a new shader material with
  // a random color & gradient
  const createMaterial = () => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        power: { value: Random.range(1, 20) },
        color: { value: new THREE.Color(color) },
        background: { value: new THREE.Color(background) }
      },
      // Pass coordinate down to fragment shader
      vertexShader: `
        varying vec2 vUv;
        void main () {
          vec3 transformed = position.xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      // Receive coordinate and create a gradient
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 color;
        uniform vec3 background;
        uniform float power;

        void main () {
          float d = pow(vUv.y, power * vUv.y);
          vec3 outColor = mix(background, color, d);
          gl_FragColor = vec4(outColor, 1.0);
        }
      `
    });

    // Use a mutli-face material for the 6 sided cube
    // Top and bottom sides will draw the background color
    const emptyMaterial = new THREE.MeshBasicMaterial({
      color: background
    });

    return [
      material,
      material,
      emptyMaterial,
      emptyMaterial,
      material,
      material
    ];
  };

  // Create a random mesh at the given position
  const createMesh = (position) => {
    const mesh = new THREE.Mesh(geometry, createMaterial());

    // copy the position
    mesh.position.copy(position);

    // scale it randomly
    mesh.scale.set(
      Math.abs(Random.gaussian() * Random.gaussian()),
      Math.abs(Random.gaussian() * Random.gaussian()),
      Math.abs(Random.gaussian() * Random.gaussian())
    );

    // Center things a little bit better
    mesh.position.y += -1;

    scene.add(mesh);
    return mesh;
  };

  for (let i = 0; i < 100; i++) {
    const position = new THREE.Vector3(
      Random.gaussian() * Random.gaussian(),
      0,
      Random.gaussian() * Random.gaussian()
    );
    createMesh(position);
  }

  // draw each frame
  return {
    // Handle resize events here
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);

      const aspect = viewportWidth / viewportHeight;

      // Ortho zoom
      const zoom = 4;

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