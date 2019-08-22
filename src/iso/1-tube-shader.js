// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const glslify = require('glslify');
const canvasSketch = require('canvas-sketch');
const { linspace } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const risoColors = require('riso-colors').map(c => c.hex);
const paperColors = require('paper-colors').map(c => c.hex);

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
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
  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);

  linspace(40).map(t => {
    const color = Random.pick(risoColors);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        power: { value: Random.range(1, 20) },
        color: { value: new THREE.Color(color) },
        background: { value: new THREE.Color(background) }
      },
      side: THREE.DoubleSide,
      vertexShader: glslify(`
        varying vec2 vUv;
        void main () {
          vec3 transformed = position.xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `),
      fragmentShader: glslify(`
        varying vec2 vUv;
        uniform vec3 color;
        uniform vec3 background;
        uniform float power;

        #pragma glslify: dither = require('glsl-dither/8x8')

        void main () {
          float d = pow(vUv.y, power * vUv.y);
          vec3 outColor = mix(background, color, d);
          gl_FragColor = vec4(outColor, 1.0);
        }
      `)
    });
    const emptyMaterial = new THREE.MeshBasicMaterial({ color: background });
    const mesh = new THREE.Mesh(geometry, [
      material,
      material,
      emptyMaterial,
      emptyMaterial,
      material,
      material
    ]);
    const [ cx, cz ] = Random.insideCircle(1);

    mesh.position.set(cx, 0, cz);

    const scale = Math.abs(Random.gaussian() + Random.gaussian()) * 0.25;
    mesh.scale.x *= scale * Math.abs(Random.gaussian(0, 1));
    mesh.scale.z *= scale * Math.abs(Random.gaussian(0, 1));
    mesh.scale.y *= scale * Math.abs(Random.gaussian(0, 1));
    mesh.position.y += -0.5;
    scene.add(mesh);
  });

  // draw each frame
  return {
    // Handle resize events here
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      
      const aspect = viewportWidth / viewportHeight;

      // Ortho zoom
      const zoom = 2.0;

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