import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/RGBELoader.js';
import { DecalGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/geometries/DecalGeometry.js';
// import { ProgressiveShadows } from './ProgressiveShadows.js';
// import { guiProgressiveShadows } from './GuiProgressiveShadows.js';
import { TransformControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/TransformControls.js'
import { ProgressiveLightMap } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/misc/ProgressiveLightMap.js';
import { GUI } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

// State data
const state = {
    intro: true,
    colors: ['#ccc', '#EFBD4E', '#80C670', '#726DE8', '#EF674E', '#353934'],
    decals: ['react', 'three2', 'pmndrs'],
    color: '#EFBD4E',
    decal: ''
};

// Track target camera position for smooth damping
let decalMesh, targetCameraPosition = new THREE.Vector3(0.05, 0.1, 2);

// $('#introSection').hide();
// $('#customizerSection').show();
// state.intro = false;
// targetCameraPosition.set(1, -0.15, 2);

const buttonsData = {
    goBackButton: {
        id: 'goBackButton',
        content: 'GO BACK ⬅️'
    },
    buyButton: {
        id: 'buyButton',
        content: 'Buy Now 🛒'
    }
}

$(document).ready(function () {
    state.colors.forEach((color, index) => {
        $('#colorOptions').append(`<div class='color-circle hover:scale-110 transition-all duration-300 z-10 w-7 h-7 border-2 border-white rounded-full' style="background-color:${color}";></div>`)
    })

    Object.values(buttonsData).forEach((button, index) => {
        $('.action-buttons').append(
            `<button id=${button.id} class="group hover:scale-110 transition-all duration-300 relative border border-black rounded-sm px-8 py-3 text-white font-semibold shadow">
                <span class="group-hover:w-full w-0 h-full bg-black transition-all duration-300 absolute top-0 right-0 group-hover:right-unset group-hover:left-0"></span>
                <span class="text-base group-hover:text-white z-10 relative">${button.content}</span>
            </button>`
        )
    })

    $('#introSection').append(
        `<button id="customizeButton" class="group hover:scale-110 transition-all duration-300 relative border border-black rounded-sm px-8 py-3 text-white font-semibold shadow">
            <span class="group-hover:w-full w-0 h-full bg-black transition-all duration-300 absolute top-0 right-0 group-hover:right-unset group-hover:left-0"></span>
            <span class="text-base group-hover:text-white z-10 relative">CUSTOMIZE IT</span>
        </button>`
    )
    // Customize button event
    $('#customizeButton').on('click', function () {
        $('#introSection').hide();
        $('#customizerSection').show();
        state.intro = false;
        targetCameraPosition.set(1, 0, 1.9);
    });

    // Go back button event
    $('#goBackButton').on('click', function () {
        $('#customizerSection').hide();
        $('#introSection').show();
        state.intro = true;
        targetCameraPosition.set(0.05, 0.1, 2);
    });

    // Color selection
    $('.color-circle').each((index, element) => {
        $(element).on('click', function () {
            state.color = state.colors[index];
        });
    });

    // Decal selection
    $('.decal-icon').each((index, element) => {
        $(element).on('click', function () {
            if(decalMesh){
                scene.remove(decalMesh);
            }
            state.decal = state.decals[index];
            const position = new THREE.Vector3(1, 0.2, 0);
            const orientation = new THREE.Euler(0, 0, 0);
            const size = new THREE.Vector3(0.25, 0.25, 1);

            // Apply decal with the given parameters
            applyDecal(position, orientation, size);
        });
    });

    // Download button to save canvas as image
    $('#buyButton').on('click', function (e) {
        var options = {
            "key": "rzp_test_Vm9YaqVNj28c7j", // Replace with your Razorpay key ID
            "amount": "50000",    // Amount in paise (50000 = INR 500.00)
            "currency": "INR",
            "name": "Your Company Name",
            "description": "Test Transaction",
            "handler": function (response){
                alert(response.razorpay_payment_id); // Payment ID on success
                // Redirect to another page or submit response to a PHP file
            }
        };
        var rzp1 = new Razorpay(options);
        rzp1.open();
        e.preventDefault();
    //     const link = document.createElement('a');
    //     link.href = renderer.domElement.toDataURL('image/png');
    //     link.download = 'customized_shirt.png';
    //     link.click();
    });
});

// Three.js scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0.05, 0.1, 2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight - 2);
document.body.appendChild(renderer.domElement);

// Load environment texture
new RGBELoader().load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
});

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5 * Math.PI);
scene.add(ambientLight);

// Load the 3D model
let shirt;
const loader = new GLTFLoader();
loader.load('/shirt_baked_collapsed.glb', (gltf) => {
    shirt = gltf.scene;
    shirt.traverse(function (node) {
        if (node.isMesh) {
            node.castShadow = true; //default is false
            node.receiveShadow = false; //default
            node.material.color.set(state.color);
        }

    });
    shirt.scale.set(2, 2, 2)
    shirt.position.set(1, 0.2, 0);
    scene.add(shirt);
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

//Create a SpotLight and turn on shadows for the light
const light = new THREE.SpotLight( 0xffffff );
light.position.set(1.5, 0.2, 1);
light.penumbra = 1;
light.angle = 2;
light.castShadow = true; // default false
scene.add( light );

//Set up shadow properties for the light
light.shadow.mapSize.width = 2048; // default
light.shadow.mapSize.height = 2048; // default
light.shadow.camera.near = 0.25; // default
light.shadow.camera.far = 500; // default
light.shadow.focus = 1; // default

//Create a plane that receives shadows (but does not cast them)
const planeGeometry = new THREE.PlaneGeometry( 20, 20, 32, 32 );
const planeMaterial = new THREE.MeshStandardMaterial( { color: state.color, opacity: 0.25, transparent: true, roughness: 0.8, metalness: 0 } )
const plane = new THREE.Mesh( planeGeometry, planeMaterial );
plane.receiveShadow = true;
plane.name = 'Plane';
scene.add( plane );

// Main shadow-catching plane
const shadowPlaneMaterial = new THREE.ShadowMaterial({
    opacity: 0.3 // Adjust this for shadow visibility without solid background
});
const shadowPlane = new THREE.Mesh(planeGeometry, shadowPlaneMaterial);
shadowPlane.receiveShadow = true;
shadowPlane.name = 'Shadow Plane';
// shadowPlane.rotation.x = -Math.PI / 2;
// shadowPlane.position.y = -0.01; // Slightly below the main plane
scene.add(shadowPlane);

// Create a helper for the shadow camera (optional)
// const helper = new THREE.CameraHelper( light.shadow.camera );
// scene.add( helper );

// Function to damp color transition
function dampColor(currentColor, targetColor, dampingFactor, delta) {
    currentColor.r += (targetColor.r - currentColor.r) * dampingFactor * delta;
    currentColor.g += (targetColor.g - currentColor.g) * dampingFactor * delta;
    currentColor.b += (targetColor.b - currentColor.b) * dampingFactor * delta;
}

function dampPosition(currentPosition, targetPosition, dampingFactor, delta) {
    currentPosition.x += (targetPosition.x - currentPosition.x) * dampingFactor * delta;
    currentPosition.y += (targetPosition.y - currentPosition.y) * dampingFactor * delta;
    currentPosition.z += (targetPosition.z - currentPosition.z) * dampingFactor * delta;
}

const dampingFactor = 0.25; // Adjust for smoother or faster transition

// Helper function to create a visible indicator for decal position
// function createDecalHelper(position, size) {
//     const geometry = new THREE.SphereGeometry(size.x / 2, 16, 16); // Size based on decal size
//     const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
//     const helper = new THREE.Mesh(geometry, material);
//     helper.position.copy(position);
//     scene.add(helper);

//     // Optionally, remove the helper after some time
//     setTimeout(() => {
//         scene.remove(helper);
//     }, 500); // Removes the helper after 2 seconds
// }

// Function to apply decal
function applyDecal(position, orientation, size) {
    if (!shirt) return;

    // console.log(shirt.children[0]);

    // Show the helper at the position where the decal will be applied
    // createDecalHelper(position, size);

    // Assuming `shirt` is the mesh you want to apply the decal on
    const decalGeometry = new DecalGeometry(shirt.children[0], position, orientation, size);

    // Material for the decal (texture and transparency)
    // const decalTexture = new THREE.TextureLoader().load('pmndrs.png');
    const decalTexture = new THREE.TextureLoader().load(`${state.decal}.png`);
    const decalMaterial = new THREE.MeshBasicMaterial({
        map: decalTexture,
        transparent: true,
        depthTest: true,
        depthWrite: false,          // Prevents decal from being occluded by model itself
        polygonOffset: true,        // Avoid z-fighting with the surface
        polygonOffsetFactor: -4
    });

    decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
    decalMesh.name = 'Decal Mesh';
    scene.add(decalMesh);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    // Calculate the frame time delta (typically based on a timestamp or frame rate)
    const delta = 0.1; // Example delta; this would be dynamically calculated in a real setup

    // Smooth camera movement to target position
    dampPosition(camera.position, targetCameraPosition, dampingFactor, delta);

    // Damping color transition
    if (scene) {
        scene.traverse((node) => {
            // console.log(node.name);
            if (node.isMesh && (node.name == 'Plane' || node.name == 'T_Shirt_male')) {
                // Damping color transition for the shirt material
                dampColor(
                    node.material.color, // Current color
                    new THREE.Color(state.color), // Target color from state
                    dampingFactor, // Damping factor
                    delta // Delta time
                );
            }
        });
    }

    $('.action-buttons button').each((index, button) => {
        $(button).css('background-color', state.color);
    });

    $('#customizeButton').css('background-color', state.color);

    renderer.render(scene, camera);
}

animate();