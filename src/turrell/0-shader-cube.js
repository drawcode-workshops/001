// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const risoColors = require('riso-colors').map(c => c.hex);
const paperColors = require('paper-colors').map(c => c.hex);

const settings = {
  // Make the loop animated
  animate: true,
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
  const colors = [ 'white', 'black' ];// Random.shuffle(risoColors);
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

  const maxMeshes = 50;
  for (let i = 0; i < maxMeshes; i++) {
    const material = createMaterial();//Array.from(new Array(6)).map(() => createMaterial());
    const mesh = new THREE.Mesh(geometry, material);
    let v = (i + 1) / maxMeshes;
    v = Math.pow(v, 15);
    mesh.scale.setScalar(v);
    mesh.position.y = -v + 1;
    scene.add(mesh);
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