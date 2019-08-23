#### <sup>:closed_book: [draw_code.001](../README.md) → Snippets</sup>

---

# Snippets

Here you will find some 'recipes' and patterns that we'll be using during the workshop.

## Isometric ThreeJS Camera

In your setup, replace the perspective camera with:

```js
const camera = new THREE.OrthographicCamera();
```

In the `resize` function, replace the perspective camera configuration with:

```js
const aspect = viewportWidth / viewportHeight;

// Ortho zoom
const zoom = 1.0;

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
```

## 3D Coordinate System

Here's a small reference you can use to remember XYZ axes in ThreeJS.

<img src="./images/xyz-1.png" width="33%" /> <img src="./images/xyz-2.png" width="33%" />

## Raycast Mouse With Infinite Ground

```js
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
    console.log('Hit ground at', target);
  }
});
```

## Noise from 2D Coordinates

If you have 2D coordinates between `N0..N1`, you can get back a *simplex noise* signal from those coordinates that smoothly varies between `-1...1`.

```js
const Random = require('canvas-sketch-util/random');

const frequency = 1;
const amplitude = 1;

const n = amplitude * Random.noise2D(x * frequency, y * frequency);
```

The `frequency` changes how chaotic the noise signal will be, and the `amplitude` can be used to scale the value to something smaller or larger than `-1..1` range.

> *Tip:* It's a good idea to pass normalized values in the range `-1..1` into your noise functions.

## `0..1` to `-1...1`

If *t* is between 0 and 1 (inclusive) and you want to map it to -1 to 1 (inclusive), you can use this:

```js
const n = t * 2 - 1;
```

## `-1..1` to `0...1`

If *t* is between -1 and 1 (inclusive) and you want to map it to 0 to 1 (inclusive), you can use this:

```js
const n = t * 0.5 + 0.5;
```

## Looping Motion in `-1..1` Range

To create a looping motion from `-1..1` you can use `Math.sin()`, like so:

```js
const motionSpeed = 0.5;
const v = Math.sin(time * motionSpeed);
```

You can map this value into `0..1` space and/or interpolate it to another range.

## Ping-Pong Motion in `0..1` Range

When you have a defined sketch `{ duration }` and you are using the `{ playhead }` prop, you can use `Math.sin()` to get a ping-pong motion from `0..1` which slowly varies from 0, to 1, and then back to zero.

```js
const v = Math.sin(playhead * Math.PI);
```

You can invert this with `1.0 - v` if you need it to vary from 1, to 0, and then back to 1.

## Orient Mesh from Point A to B

Let's say you have a mesh that you'd like to orient so that it faces the same direction as a unit vector, AKA a *normal*. You can do the following:

```js
const quaternionFromNormal = require('three-quaternion-from-normal');

// Say we want mesh to point from A to B point
const A = new THREE.Vector3(1, 0, 0);
const B = new THREE.Vector3(2, 5, -1);

// Get normal A->B
const normal = B.clone().sub(A).normalize();

// Get orientation
const quaternion = quaternionFromNormal(normal);

// Apply orientation to mesh
mesh.quaternion.copy(quaternion);
```

This uses the [three-quaternion-from-normal](https://www.npmjs.com/package/three-quaternion-from-normal) module.

## 

#### <sup>[← Back to Documentation](../README.md)