// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const risoColors = require('riso-colors').map(c => c.hex);
const paperColors = require('paper-colors').map(c => c.hex);
const anime = require('animejs');

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

  // Create a new random material
  const createMaterial = () => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        power: { value: Random.range(1, 10) },
        color: { value: new THREE.Color(Random.pick(risoColors)) },
        background: { value: new THREE.Color(background) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main () {
          vec3 transformed = position.xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
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

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);

  const animate = async (mesh) => {
    const targetScale = mesh.scale.y;
    const minScale = 0.0001;
    mesh.scale.y = minScale;

    await anime({
      targets: mesh.scale,
      y: targetScale,
      duration: 1000,
      easing: 'easeOutExpo'
    }).finished;

    await anime({
      targets: mesh.scale,
      y: 0.0001,
      duration: 1000,
      easing: 'easeInExpo'
    }).finished;

    scene.remove(mesh);
  };

  const createMesh = (position) => {
    const mesh = new THREE.Mesh(geometry, createMaterial(1000));

    mesh.position.set(position.x, 0, position.z);
    mesh.scale.set(
      Random.gaussian() * Random.gaussian(),
      Math.abs(Random.gaussian() * Random.gaussian()),
      Random.gaussian() * Random.gaussian()
    );

    scene.add(mesh);
    animate(mesh);
    return mesh;
  };

  const raycaster = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Create meshes on movement
  window.addEventListener('mousemove', ev => {
    const mouse = new THREE.Vector2(
      ev.clientX / window.innerWidth * 2 - 1,
      -ev.clientY / window.innerHeight * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(ground, target);
    if (hit) {
      // If we hit the ground, create a new mesh
      createMesh(target);
    }
  });

  // Randomize colors
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
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);