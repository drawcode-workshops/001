// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const risoColors = require('riso-colors').map(c => c.hex);
const paperColors = require('paper-colors').map(c => c.hex);
const anime = require('animejs');
const createInputEvents = require('simple-input-events');

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
  let background = Random.pick(paperColors);
  renderer.setClearColor(background, 1);

  // Setup a camera
  const camera = new THREE.OrthographicCamera();

  // Setup your scene
  const scene = new THREE.Scene();

  // Create a new box
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);

  // A function to create a new shader material with
  // a random color & gradient
  const createMaterial = () => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        power: { value: Random.range(1, 10) },
        color: { value: new THREE.Color(Random.pick(risoColors)) },
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
        uniform float time;

        void main () {
          float d = pow(vUv.y, power * vUv.y);
          vec3 outColor = mix(background, color , d);
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

  // Animates a mesh by setting its Y scale to very small
  // then animating it to an ideal size, and then back to small
  const animate = async (mesh) => {
    const targetScale = mesh.scale.y;

    // Set initial size
    // Need to use non-zero to avoid ThreeJS console warnings
    const minScale = 0.0001;
    mesh.scale.y = minScale;

    // animate to an initial value
    await anime({
      targets: mesh.scale,
      y: targetScale,
      duration: 1000,
      easing: 'easeOutExpo'
    }).finished;

    // animate back to almost zero
    await anime({
      targets: mesh.scale,
      y: minScale,
      duration: 1000,
      easing: 'easeInExpo'
    }).finished;

    // IMPORTANT! We need to remove the mesh
    // from the scene otherwise the app will eventually
    // start to slow down and run out of memory
    scene.remove(mesh);
  };

  // Create a random mesh at the given position
  const createMesh = (position) => {
    const mesh = new THREE.Mesh(geometry, createMaterial(1000));

    // copy the position
    mesh.position.copy(position);

    // scale it randomly
    mesh.scale.set(
      Math.abs(Random.gaussian() * Random.gaussian()),
      Math.abs(Random.gaussian() * Random.gaussian()),
      Math.abs(Random.gaussian() * Random.gaussian())
    );

    scene.add(mesh);
    return mesh;
  };

  const raycaster = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Listen for pointer events on the body
  // We can use simple-input-events for mobile + desktop
  const input = createInputEvents({
    target: props.canvas,
    preventDefault: true
  }).on('move', ({ position }) => {
    const mouse = new THREE.Vector2(
      position[0] / props.styleWidth * 2 - 1,
      -position[1] / props.styleHeight * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(ground, target);
    if (hit) {
      // If we hit the ground, create a new mesh
      const mesh = createMesh(target);
      animate(mesh);
    }
  });

  // Randomize colors on click
  window.addEventListener('click', ev => {
    // Get a new background color
    background = Random.pick(paperColors);
    renderer.setClearColor(background, 1);

    // update all meshes with materials
    scene.traverse(child => {
      if (child.material) {
        child.material = createMaterial();
      }
    });
  });

  context.canvas.style.cursor = 'pointer';

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
      input.disable();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);