import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

// Create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI;

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Load OBJ model
const objLoader = new OBJLoader();
let currentModel = null;
let selectedObject = null; // The object currently selected
const hiddenObjects = new Set(); // Store hidden objects for toggling visibility

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Function to load a 3D model from an OBJ file
function loadModel(objUrl = null) {
    if (currentModel) scene.remove(currentModel);

    if (objUrl) {
        objLoader.load(objUrl, (object) => {
            currentModel = object;
            
            // Add model to the scene
            scene.add(currentModel);
            
            // Adjust camera and model positioning
            fitCameraToObject(currentModel);
            
            // Reset controls
            controls.target.set(0, 0, 0);
            controls.update();
        });
    }
}

// Function to handle mouse click events
function onMouseClick(event) {
    // Convert mouse position to normalized device coordinates [-1, 1]
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast a ray from the camera
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with the model
    const intersects = raycaster.intersectObject(currentModel, true);

    if (intersects.length > 0) {
        selectedObject = intersects[0].object; // Select the clicked object
        
        // Update button text based on object visibility
        if (hiddenObjects.has(selectedObject)) {
            document.getElementById("toggleLayer").textContent = "Unhide Selected";
        } else {
            document.getElementById("toggleLayer").textContent = "Hide Selected";
        }
    }
}

// Adjust camera to fit the entire model
function fitCameraToObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Move object to center (0,0,0)
    object.position.sub(center);

    // Calculate suitable camera distance
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    // Compute optimal camera distance
    let cameraZ = (maxDim / 2) / Math.tan(fov / 2);

    // Ensure the whole object is visible
    const minZ = box.min.z;
    const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;

    // Position the camera
    camera.position.set(0, 0, cameraZ * 1.5);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Update camera settings
    camera.near = cameraZ / 100;
    camera.far = cameraZ * 100;
    camera.updateProjectionMatrix();
}

// Toggle object visibility
function toggleObjectVisibility() {
    if (selectedObject) {
        if (hiddenObjects.has(selectedObject)) {
            // Unhide object
            selectedObject.visible = true;
            hiddenObjects.delete(selectedObject);
            document.getElementById("toggleLayer").textContent = "Hide Selected";
        } else {
            // Hide object
            selectedObject.visible = false;
            hiddenObjects.add(selectedObject);
            document.getElementById("toggleLayer").textContent = "Unhide Selected";
        }
    }
}

// Load default model (replace with your file if necessary)
loadModel(`/Sample_Model.obj`);

// Reset camera button event
document.getElementById("resetCamera").addEventListener("click", () => {
    fitCameraToObject(currentModel);
    controls.target.set(0, 0, 0);
    controls.update();
});

// Zoom in/out button events
document.getElementById("zoomIn").addEventListener("click", () => {
    camera.position.multiplyScalar(0.9); // Reduce distance by 10%
    controls.update();
});
document.getElementById("zoomOut").addEventListener("click", () => {
    camera.position.multiplyScalar(1.1); // Increase distance by 10%
    controls.update();
});

// Listen for mouse clicks
window.addEventListener("click", onMouseClick);

// Handle "Hide Layer" button click
document.getElementById("toggleLayer").addEventListener("click", () => {
    toggleObjectVisibility();
});

// Load model button event
document.getElementById("loadModel").addEventListener("click", () => {
    document.getElementById("fileInput").click(); 
});
// Load model from file input
document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    loadModel(url);
});

// unhide all button event
document.getElementById("unhideAll").addEventListener("click", () => {
    scene.traverse((child) => {
        if (child.visible === false) {
            child.visible = true; // Unhide object
        }
    });
});



// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
