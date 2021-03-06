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
  const colors = Random.shuffle(risoColors);
  let colorIndex = 0;

  renderer.setClearColor(background, 1);

  // Setup a camera
  const camera = new THREE.OrthographicCamera();

  // Setup your scene
  const scene = new THREE.Scene();

  // Create a new box
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  // Remove two of the triangles from the geometry (the top faces)
  geometry.faces.splice(4, 2);

  // A function to create a new shader material with
  // a random color & gradient
  const createMaterial = () => {
    const color = colors[colorIndex++ % colors.length];

    const material = new THREE.ShaderMaterial({
      // Make sure inner side is visible as well
      side: THREE.DoubleSide,
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
    return material;
  };

  // When true, the outermost cube will be the background color
  const masking = false;

  // Draw N meshes
  const maxMeshes = 20;
  for (let i = 0; i < maxMeshes; i++) {
    const material = createMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    // Value that goes from ~0...1
    let v = (i + 1) / maxMeshes;
    // Use pow() to make it exponential, not just linear
    v = Math.pow(v, 5);
    // scale each mesh
    mesh.scale.setScalar(v);
    scene.add(mesh);
    if (masking) {
      mesh.position.y -= 0.5;
      if (i === maxMeshes - 1) {
        mesh.material.uniforms.color.value.set(background);
      }
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
      const zoom = 1;

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