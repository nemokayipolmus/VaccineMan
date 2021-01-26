// SETUP STATS WINDOW
//////////////////////////////////
var stats = new Stats();
stats.setMode( 0 ); // 0: fps, 1: ms, 2: mb

// align top-left
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';

document.body.appendChild( stats.domElement );

//////////////////////////////////

const vid2 = document.getElementById("mainSound");

var x_axis = new THREE.Vector3( 1, 0, 0 );
var y_axis = new THREE.Vector3( 0, 1, 0 );
var z_axis = new THREE.Vector3( 0, 0, 1 );

// SETUP RENDERER & SCENE
//////////////////////////////////
var canvas = document.getElementById('canvas');
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xFFFFFF); // white background colour
canvas.appendChild(renderer.domElement);
var clock = new THREE.Clock(true);

// SETUP CAMERA
//////////////////////////////////
var camera = new THREE.PerspectiveCamera(30,1,0.1,8000); // view angle, aspect ratio, near, far
camera.position.set(0,20,0);
camera.lookAt(scene.position);

// Add a crosshair to the camera
var material = new THREE.LineBasicMaterial({ color: 0xAAFFAA });

// crosshair size
var x = 0.005, y = 0.005;
var geometry = new THREE.Geometry();

// crosshair
geometry.vertices.push(new THREE.Vector3(0, y, 0));
geometry.vertices.push(new THREE.Vector3(0, -y, 0));
geometry.vertices.push(new THREE.Vector3(0, 0, 0));
geometry.vertices.push(new THREE.Vector3(x, 0, 0));    
geometry.vertices.push(new THREE.Vector3(-x, 0, 0));

var crosshair = new THREE.Line( geometry, material );

var circleGeometry = new THREE.CircleGeometry( x, 32 );
var crosshair_circle = new THREE.Line( circleGeometry, material );
crosshair_circle.position.z = -0.5;

// place it in the center
var crosshairPercentX = 50;
var crosshairPercentY = 50;
var crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
var crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;

crosshair.position.x = crosshairPositionX * camera.aspect;
crosshair.position.y = crosshairPositionY;
crosshair.position.z = -0.3;

camera.add( crosshair );
camera.add( crosshair_circle );
scene.add(camera);


// Make Virus
//////////////////////////////////
var worldWidth = 1500;
var worldDepth = 1500;
edges = worldWidth - worldWidth/2

var particleCount = 1500
pMaterial = new THREE.PointCloudMaterial({
  color: 0xFFFFFF,
  size: 10,
  map: THREE.ImageUtils.loadTexture(
     "./textures/virus.png"
   ),
   transparent: true
});
particles = new THREE.Geometry();

for (var i = 0; i < particleCount; i++) {
    var pX = Math.random()*edges*2 - edges,
    pY = Math.random()*500 - 250,
    pZ = Math.random()*edges*2 - edges,
    particle = new THREE.Vector3(pX, pY, pZ);
    particle.velocity = {};
    particle.velocity.y = 0;
    particles.vertices.push(particle);
}

function makeItVirus(){
  var pCount = particleCount;
  while (pCount--) {
    var particle = particles.vertices[pCount];
    if (particle.y < 10) { // floor height
      particle.y = 200;
      particle.velocity.y = 0;
    }
    particle.velocity.y -= Math.random()*0.01;
    particle.y += particle.velocity.y;
  }

  particles.verticesNeedUpdate = true;
};

var particleSystem = new THREE.PointCloud(particles, pMaterial);
scene.add(particleSystem);


// Health Packs

var pickable = new THREE.Object3D();
scene.add(pickable)

// Define the shape
var x = 0, y = 0;
var heartShape = new THREE.Shape(); 
heartShape.moveTo( x + 25, y + 25 );
heartShape.bezierCurveTo( x + 25, y + 25, x + 20, y, x, y );
heartShape.bezierCurveTo( x - 30, y, x - 30, y + 35,x - 30,y + 35 );
heartShape.bezierCurveTo( x - 30, y + 55, x - 10, y + 77, x + 25, y + 95 );
heartShape.bezierCurveTo( x + 60, y + 77, x + 80, y + 55, x + 80, y + 35 );
heartShape.bezierCurveTo( x + 80, y + 35, x + 80, y, x + 50, y );
heartShape.bezierCurveTo( x + 35, y, x + 25, y + 25, x + 25, y + 25 );

// Add to scene and pickable
var extrudeSettings = { amount: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
var heartGeometry = new THREE.ExtrudeGeometry( heartShape, extrudeSettings );
var sphere = new THREE.SphereGeometry( 2, 16, 8 );


hearts = []
var max_health = 2;
for (var h = 0; h < max_health; h++){
  var heartMesh = new THREE.Mesh( heartGeometry, new THREE.MeshPhongMaterial( { color: 0xff0040 } ) );
  heartMesh.position.set( 0,0,0 );
  heartMesh.rotation.set( Math.PI/16,0,Math.PI);
  heartMesh.scale.set( 0.2,0.2,0.2 );
  hearts.push(heartMesh)
}

function makeHealthPack(x,z){
  pickable.add( hearts[pickable.children.length] );
  hearts[pickable.children.length-1].position.set( x,35,z );
}

// SETUP POINTERLOCK CONTROLS

var raycaster;
var controlsEnabled;
var objects = [];
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var defaultSpeed = 700.0;
var fasterSpeed = 2000.0;
var playerMovementSpeed = defaultSpeed; 
var player_health = 100;
var player_score = 0;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
controls = new THREE.PointerLockControls( camera );
scene.add( controls.getObject() );


var instructions = document.getElementById( 'instructions' );
var winner = document.getElementById( 'winner' );
var loser = document.getElementById( 'loser' );

if ( havePointerLock ) {

  var element = document.body;
  var pointerlockchange = function ( event ) {
    if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

      controlsEnabled = true;
      controls.enabled = true;

      blocker.style.display = 'none';
      winner.style.display = 'none';
      loser.style.display = 'none';

    } else {

      controls.enabled = false;

      blocker.style.display = '-webkit-box';
      blocker.style.display = '-moz-box';
      blocker.style.display = 'box';

      instructions.style.display = '';
    }

  };

  var pointerlockerror = function ( event ) {

    instructions.style.display = '';

  };

  // Hook pointer lock state change events
  document.addEventListener( 'pointerlockchange', pointerlockchange, false );
  document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
  document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

  document.addEventListener( 'pointerlockerror', pointerlockerror, false );
  document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
  document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

  instructions.addEventListener( 'click', function ( event ) {

    instructions.style.display = 'none';

    // Ask the browser to lock the pointer
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

    if ( /Firefox/i.test( navigator.userAgent ) ) {

      var fullscreenchange = function ( event ) {

        if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

          document.removeEventListener( 'fullscreenchange', fullscreenchange );
          document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

          element.requestPointerLock();
        }

      };

      document.addEventListener( 'fullscreenchange', fullscreenchange, false );
      document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

      element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

      element.requestFullscreen();

    } else {

      element.requestPointerLock();

    }

  }, false );

} 
else {
  instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

var onKeyDown = function ( event ) {

  switch ( event.keyCode ) {

    case 16: // Shift key
      playerMovementSpeed = fasterSpeed;
      break;

    case 38: // up
    case 87: // w
      moveForward = true;
      break;

    case 37: // left
    case 65: // a
      moveLeft = true; break;

    case 40: // down
    case 83: // s
      moveBackward = true;
      break;

    case 39: // right
    case 68: // d
      moveRight = true;
      break;

    case 32: // space
      if ( canJump === true ) velocity.y += 350;
      canJump = false;
      break;

  }

};

var onKeyUp = function ( event ) {

  switch( event.keyCode ) {

    case 16: // Shift key
      playerMovementSpeed = defaultSpeed;
      break;

    case 38: // up
    case 87: // w
      moveForward = false;
      break;

    case 37: // left
    case 65: // a
      moveLeft = false;
      break;

    case 40: // down
    case 83: // s
      moveBackward = false;
      break;

    case 39: // right
    case 68: // d
      moveRight = false;
      break;

  }

};

document.addEventListener( 'keydown', onKeyDown, false );
document.addEventListener( 'keyup', onKeyUp, false );
document.addEventListener( 'mousedown', onDocumentMouseDown, false );
var mouse = new THREE.Vector2();
mouse.x = 0;
mouse.y = 0;
var shootingRaycaster = new THREE.Raycaster();


// Scene lighting
// Ambient, directional, point

var light = new THREE.AmbientLight( 0x101010 );
scene.add( light );

dirLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
dirLight.color.setHSL( 0.1, 1, 0.95 );
dirLight.position.set( -1, 3, 5 );
dirLight.position.multiplyScalar( 50 );
scene.add( dirLight );

var cam_light = new THREE.PointLight( 0xeeeeee, 1.2, 250 );
cam_light.position.set( 0, 5, 2 );
camera.add(cam_light)

// Generate the lamp posts for lighting
var post_height = 120
var geometry = new THREE.CylinderGeometry( 2.5, 2.5, post_height, 32 );
var lampGeometry = new THREE.SphereGeometry( 6, 20, 20, 0, Math.PI*2);  
var teleporters = []
var tele_index = 0

function makeLampPost(x,z){
  var material = new THREE.MeshPhongMaterial( {color: 0x808B96} );
  var lampmaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
  lampmaterial.emissive = new THREE.Color().setRGB(255,255,255)
  lampmaterial.emissiveIntensity = 10
  var lamp_support = new THREE.Mesh( geometry, material );
  lamp_support.position.x = x;
  lamp_support.position.z = z;
  lamp_support.position.y = 10;
  lamp_support.castShadow = true;
  scene.add( lamp_support );
  
  var lamp_bulb = new THREE.Mesh( lampGeometry, lampmaterial );
  lamp_bulb.position.set(0,post_height/2,0)
  lamp_support.add(lamp_bulb)
  var lamp_light = new THREE.PointLight( 0xffffff, 1.6, 400 );
  lamp_light.position.set( 0, 10, 0 );
  lamp_bulb.add( lamp_light );

  // Teleporter Base

  var teleTexture = THREE.ImageUtils.loadTexture('./textures/metal.jpg');
  teleTexture.wrapS = teleTexture.wrapT = THREE.RepeatWrapping; 
  teleTexture.repeat.set( 2, 2 );
  var telematerial = new THREE.MeshPhongMaterial({ map: teleTexture, color: 0xbbbbbb });
  telematerial.emissiveIntensity = 0.5
  var circleGeometry = new THREE.CylinderGeometry( 30, 30, 8, 32 )
  var circle = new THREE.Mesh( circleGeometry, telematerial );
  circle.position.y = -10;
  circle.tele_id = tele_index;
  lamp_support.add( circle );
  teleporters.push(circle);
  tele_index += 1;;
}


// Make teleporters and lamp post and fence

makeLampPost(-edges+40,-edges+40);
makeLampPost(+edges-40,+edges-40);
makeLampPost(-edges+40,+edges-40);
makeLampPost(+edges-40,-edges+40);
makeLampPost(-edges+40,-edges/4+190);
makeLampPost(-edges/4+190,-edges+40);
makeLampPost(+edges-40,+edges/4-190);
makeLampPost(+edges/4-190,+edges-40);

fenceH = 25
var geometry = new THREE.CylinderGeometry( 0.5, 0.5, worldWidth, 32 );
var material = new THREE.MeshPhongMaterial( {color: 0x808B96} );

function generateFencePiece(x,y,z,axis){
 var cylinder = new THREE.Mesh( geometry, material );
 cylinder.rotateOnAxis(axis,Math.PI/2);
 cylinder.position.x = x
 cylinder.position.y = y
 cylinder.position.z = z
 scene.add( cylinder ); 
}

generateFencePiece(edges,fenceH,0,x_axis)
generateFencePiece(-edges,fenceH,0,x_axis)
generateFencePiece(0,fenceH,edges,z_axis)
generateFencePiece(0,fenceH,-edges,z_axis)
generateFencePiece(edges,fenceH+10,0,x_axis)
generateFencePiece(-edges,fenceH+10,0,x_axis)
generateFencePiece(0,fenceH+10,edges,z_axis)
generateFencePiece(0,fenceH+10,-edges,z_axis)
generateFencePiece(edges,fenceH-10,0,x_axis)
generateFencePiece(-edges,fenceH-10,0,x_axis)
generateFencePiece(0,fenceH-10,edges,z_axis)
generateFencePiece(0,fenceH-10,-edges,z_axis)

// The poles
var woodTexture = THREE.ImageUtils.loadTexture('./textures/bwood.jpg');
woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping; 
woodTexture.repeat.set( 2, 2 );
var leavesTexture = THREE.ImageUtils.loadTexture('./textures/leaves.jpg');
leavesTexture.wrapS = leavesTexture.wrapT = THREE.RepeatWrapping; 
leavesTexture.repeat.set( 2, 2 );
var geometry = new THREE.CylinderGeometry( 2, 2, 40, 32 );

function generateFencePole(x,y,z){
  var MetalMaterial = new THREE.MeshPhongMaterial({color: 0x666666 });
  var cylinder = new THREE.Mesh( geometry, MetalMaterial );
  cylinder.position.x = x
  cylinder.position.y = y
  cylinder.position.z = z
  scene.add( cylinder ); 
}

for ( var i = -edges; i <= edges; i+=Math.floor(edges/32) ) {
  generateFencePole(edges,fenceH,i)
  generateFencePole(-edges,fenceH,i)
  generateFencePole(i,fenceH,edges)
  generateFencePole(i,fenceH,-edges)
}


// SETUP Syringe AND MOTION

var isFiring = false;
var Syringe_material = new THREE.MeshPhongMaterial( { color: 0xccccff, 
                      specular: 0x00ee00, shininess: 0 } );
var Syringe_geometry = new THREE.SphereGeometry( 6, 12, 12 );
var pos = controls.getObject().position.clone();
var dir = camera.getWorldDirection()
var default_Syringe_t = 50;       // How far the initial Syringe is from the camera
var Syringe_t = default_Syringe_t;
var Syringe_speed = 10;           // How fast is the Syringe?
var Syringe_range = 800;          // How far can the Syringe fly?
var Syringe_gravity = -2;         // For possible Syringe projectile motion
var Syringe_damage = 20;         // How much damage does the Syringe do
var max_Syringes = 8;
var arrow = new THREE.Object3D();
var Syringes = new THREE.Object3D();
scene.add(Syringes);

// OBJ Loader stuff
var Syringe_obj = new THREE.Object3D();
var Syringe_scale = 0.5;

var loader = new THREE.OBJLoader();
loader.load('./obj/syringe.obj', function(object) 
{
    object.traverse( function ( child )
    {
        if ( child instanceof THREE.Mesh )
            child.material = Syringe_material.clone();   
    });

    object.scale.set(Syringe_scale,Syringe_scale,Syringe_scale);
    Syringe_obj = object.clone();
});

// Syringe Collision Detection Stuff
var Syringe_coll_distance = 10;         // How close before collision == True?
var SyringeRaycaster = new THREE.Raycaster();

var directionRays = [
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(1, 0, 1),
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(1, 0, -1),
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(-1, 0, -1),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(-1, 0, 1),
];

// Pickables and Health Packs
var pickingRaycaster = new THREE.Raycaster();
var picking_distance = 150;
function makePicking(){
  console.log('Make Picking Ray')
  pickingRaycaster.set(camera.getWorldPosition(), camera.getWorldDirection())
  var intersects = pickingRaycaster.intersectObjects( pickable.children );
  if (intersects.length > 0 && intersects[0].distance <= picking_distance) {
    console.log('Found Pickable')
    player_health += 10;
    pickable.remove(intersects[0].object)
  }
  var intersects = pickingRaycaster.intersectObjects( teleporters );
  if (intersects.length > 0 && intersects[0].distance <= picking_distance) {
    console.log('Found Teleporter')
    if(intersects[0].object.tele_id == 0){
      console.log(teleporters[1])
      controls.getObject().position.x = teleporters[1].parent.position.x+1;
      controls.getObject().position.z = teleporters[1].parent.position.z;
    }
    else{
      controls.getObject().position.x = teleporters[0].parent.position.x+1;
      controls.getObject().position.z = teleporters[0].parent.position.z;    }
  }  
}

// Generate trees

var obstacle_trees = []
var woodMaterial = new THREE.MeshPhongMaterial({ map: woodTexture, color: 0x935116 });
var leavesMaterial = new THREE.MeshPhongMaterial({ map: leavesTexture, color: 0x935116 });

function makeTree(x,z,r){
  var variation = getRand(0.9,1.02)
  var tree_height = 95*variation
  var tree_radius = tree_height / 4;
  var trunk_height = 100
  var trunk_base = 20*variation
  var geometry = new THREE.CylinderGeometry( 1, tree_radius*2, tree_height, 4 );
  var tree = new THREE.Mesh( geometry, leavesMaterial );

  // The trunk
  var geometry = new THREE.CylinderGeometry( trunk_base/2, trunk_base/2, trunk_height, 32 );
  var trunk = new THREE.Mesh( geometry, woodMaterial );
  scene.add( trunk );  

  trunk.position.x = x;
  trunk.position.z = z;
  trunk.position.y = 10;
  trunk.rotateOnAxis(y_axis, r)
  trunk.add(tree)
  obstacle_trees.push(trunk)
  tree.position.y = trunk_height/2 + tree_height/2;
}


for ( var i = 0; i < 30; i ++ ) {
  makeTree(getPosNeg()*getRand(0,edges-50),getPosNeg()*getRand(0,edges-50),getRand(0,Math.PI/4));
}


// Function to make and shoot a Syringe
function makeSyringe(){
  console.log('Making Syringe')
  if (Syringes.children.length < max_Syringes){
    // Get camera direction and position
    dir = camera.getWorldDirection();
    pos = camera.getWorldPosition();
    // Make a new Syringe
    var Syringe = Syringe_obj.clone();
    Syringe.Syringe_t = default_Syringe_t;
    Syringe.p0 = pos.clone();
    Syringe.dir = dir.clone();
    Syringe.hasCollided = false;

    Syringe.rotateOnAxis(x_axis, Math.floor((Math.random() * Math.PI)));
    Syringe.rotateOnAxis(y_axis, Math.floor((Math.random() * Math.PI)));
    Syringe.rotateOnAxis(z_axis, Math.floor((Math.random() * Math.PI)));
    Syringe.position.set(Syringe.p0.x + Syringe.Syringe_t*Syringe.dir.x,
                         Syringe.p0.y + Syringe.Syringe_t*Syringe.dir.y,
                         Syringe.p0.z + Syringe.Syringe_t*Syringe.dir.z);
    isFiring = true;
    Syringes.add(Syringe);
  }
  else{
    console.log('Max Syringes')
  }
}

var isSyringeBatCollided = false;

function updateSyringes(){
  for (var p = Syringes.children.length-1; p >= 0; p--){
    Syringe = Syringes.children[p]
    Syringe.position.set(Syringe.p0.x + Syringe.Syringe_t*Syringe.dir.x,
                     Syringe.p0.y + Syringe.Syringe_t*Syringe.dir.y,
                     Syringe.p0.z + Syringe.Syringe_t*Syringe.dir.z);
    Syringe.Syringe_t = Syringe.Syringe_t + Syringe_speed;

    // Remove out of range Syringes
    if (Syringe.Syringe_t >= Syringe_range || Syringe.position.y <= 5){
      isSyringeBatCollided = false;
      Syringes.remove(Syringe);
      console.log('Active Syringes: ' + Syringes.children.length)
      if (Syringes.length == 0 ){
        isFiring = false;
      }
    }

    // Compute collisions

    if(!Syringe.hasCollided){
      for (i = 0; i < directionRays.length; i++) {
        SyringeRaycaster.set(Syringe.position, directionRays[i])
        var intersects = SyringeRaycaster.intersectObjects( Bats.children );
        if (intersects.length > 0 && intersects[0].distance <= Syringe_coll_distance) {
          Syringe.hasCollided = true;
          intersects[ 0 ].object.material.color.offsetHSL(0,+0.25,-0.10)
          intersects[ 0 ].object.health -= Syringe_damage
          intersects[ 0 ].object.BatSpeed += 0.15
          player_score += Math.floor(Syringe_damage/2);
          computeBatSyringePhysics(intersects[ 0 ].object,Syringe)
          intersects[ 0 ].object.scale.set(2,2,2)
          isSyringeBatCollided = true;
          Syringe.children[0].material = splatterMaterial;
          splat_time = performance.now();
          if (intersects[ 0 ].object.health <= 0){
            Bats.remove(intersects[ 0 ].object)
            player_score += player_score + Syringe_damage*2;
          }
        }
      }
    }
  }  
}

function onDocumentMouseDown( event ) {
  // Left mouse click shoots Syringe
  if (event.which == 1){
    if (controlsEnabled){
      makeSyringe();
    }
  }
  // Right mouse click for picking ray
  if (event.which == 3){
    if (controlsEnabled){
      makePicking();
    }
  }  
}

// ADAPT TO WINDOW RESIZE
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

//SCROLLBAR FUNCTION DISABLE
window.onscroll = function () {
  window.scrollTo(0,0);
}


// Make floor

var floorTexture = new THREE.ImageUtils.loadTexture( 'textures/dungeon2.jpg' );
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
floorTexture.repeat.set( 6, 6 );
var floorMaterial = new THREE.MeshPhongMaterial( { map: floorTexture, side: THREE.DoubleSide } );
var floorGeometry = new THREE.PlaneGeometry(5000, 5000, 10, 10);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = -1;
floor.rotation.x = Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);



// Add a SkyBox

var path = 'textures/skybox/';
var sides = [ path + 'grimmnight_px.png', path + 'grimmnight_nx.png', path + 'grimmnight_py.png', path + 'grimmnight_ny.png', path + 'grimmnight_pz.png', path + 'grimmnight_nz.png' ];
var scCube = THREE.ImageUtils.loadTextureCube(sides);
scCube.format = THREE.RGBFormat;
var skyShader = THREE.ShaderLib["cube"];
skyShader.uniforms["tCube"].value = scCube;
var skyMaterial = new THREE.ShaderMaterial( {
  fragmentShader: skyShader.fragmentShader, vertexShader: skyShader.vertexShader,
  uniforms: skyShader.uniforms, depthWrite: false, side: THREE.BackSide
});

var skyBox = new THREE.Mesh(new THREE.CubeGeometry(1024, 1024, 1024), skyMaterial);
skyBox.scale.set(4,4,4)
skyMaterial.needsUpdate = true;
scene.add(skyBox);

var textureLoader = new THREE.TextureLoader();
var aysuTexture = textureLoader.load("textures/aysu.jpeg");
var alperTexture = textureLoader.load("textures/alper.jpeg");
var ceydaTexture =textureLoader.load("textures/ceyda.jpeg");
var map;

 var aysu = new THREE.Mesh(
new THREE.BoxGeometry(25,25,2),
new THREE.MeshPhongMaterial({
color:0xffffff,
map:aysuTexture,
})
);
scene.add(aysu);
aysu.position.set(2.5, 3/2, 2.5);
aysu.position.y = 50;
aysu.position.x = -725;
aysu.position.z = -710;
aysu.receiveShadow = true;
aysu.castShadow = true;

var alper = new THREE.Mesh(
new THREE.BoxGeometry(25,25,2),
new THREE.MeshPhongMaterial({
color:0xffffff,
map:alperTexture,
})
);
scene.add(alper);
alper.position.set(2.5, 3/2, 2.5);
alper.position.y = 50;
alper.position.x = -12;
alper.position.z = -710;
alper.receiveShadow = true;
alper.castShadow = true;
var ceyda = new THREE.Mesh(
new THREE.BoxGeometry(25,25,2),
new THREE.MeshPhongMaterial({
color:0xffffff,
map:ceydaTexture,
})
);
scene.add(ceyda);
ceyda.position.set(2.5, 3/2, 2.5);
ceyda.position.y = 50;
ceyda.position.x = 695;
ceyda.position.z = -710;
ceyda.receiveShadow = true;
ceyda.castShadow = true;

// Add the Bats

Bats = new THREE.Object3D();
scene.add( Bats );
var cubeTexture = THREE.ImageUtils.loadTexture('./textures/bat.png');
var range = 500; // How wide of a range to generate the Bats
var Bat_height = 25; // How high above the ground should the Bat be
var Bat_health = 100; // Bat starts at 100 health
var max_Bats = 10; // How many Bats
var BatSpeed = 0.50;
var BatRaycaster = new THREE.Raycaster();
var Bat_damage_distance = 30;
var Bat_damage = 25;
var canDoDamage = true;
var distance_to_player;
var isPlayerDamaged;
var blink_on = true;
var blink_duration = 0.1;
var blink_time_end;
var splat_time = 0.0;

// Splatter Blob Syringe

var splatterMaterial = new THREE.ShaderMaterial( {
    uniforms: {
      time: {type : 'f', value: splat_time}
    },
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent
} );

splatterMaterial.needsUpdate = true;


function spawnBat(x,z){
  var cubeMaterial = new THREE.MeshPhongMaterial({ map: cubeTexture, color: 0xffffff });
  cubeMaterial.color.setHSL(5, 0.54, 0.84);
  var cubeGeometry = new THREE.SphereGeometry( 10, 20, 20, 0, Math.PI*2);  
  var Bat_cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
  Bat_cube.position.set(x, Math.random()*Bat_height+25, z );
  Bat_cube.health = Bat_health;
  Bat_cube.moveTowardsDirection = new THREE.Vector3(getRandSigned(), 
                                                         0, 
                                                         getRandSigned());
  Bat_cube.rotationSpeed = getRand(8,128) // Add random rotations
  Bat_cube.isFound = false // Did the Bat see the player? initialize to false
  Bat_cube.BatSpeed = BatSpeed
  Bats.add( Bat_cube );  
  return Bat_cube
}


// To update Bat movement and health pack rotations

function updateBats(){
  for (var h = 0; h < pickable.children.length; h++){
    heart = pickable.children[h]
    heart.rotateOnAxis(y_axis, Math.PI/256)
  }

  if (isPlayerDamaged){
    if (current_time > blink_time_end){
      blink_time_end = current_time + blink_duration;
      console.log('Toggle Blink')
      if(blink_on){
        damage_plane.material.opacity = 0.15;
      }
      else
        damage_plane.material.opacity = 0.6;
      blink_on = !blink_on;
    }
    if (current_time > resistance_time_end){
      canDoDamage = true;
      isPlayerDamaged = false;
      camera.remove( damage_plane );
    }      
  }

  for(var c = 0; c < Bats.children.length; c++ ) {
    Bat = Bats.children[c]
    cx = Bat.moveTowardsDirection.x
    cz = Bat.moveTowardsDirection.z
    cx_0 = Bat.position.x; cy_0 = Bat.position.y; cz_0 = Bat.position.z   
    Bat.position.set( cx_0+Bat.BatSpeed*cx,
                        cy_0,
                        cz_0+Bat.BatSpeed*cz)
    
    // Check for collision with boundaries
    if(Math.abs(Bat.position.x) >= edges || Math.abs(Bat.position.z) >= edges){
      Bat.moveTowardsDirection.x = -Bat.moveTowardsDirection.x;
      Bat.moveTowardsDirection.z = -Bat.moveTowardsDirection.z;
    }

    // Check for collision with trees and toehr
    for (i = 0; i < directionRays.length; i++) {
      BatRaycaster.set(Bat.position, directionRays[i])
      var intersections = BatRaycaster.intersectObjects( obstacle_trees, true );
      var isBlocked = intersections.length > 0;
      if (isBlocked && intersections[0].distance < 5 ){
        console.log('Bat Collision with Tree')
        Bat.moveTowardsDirection.x = (-directionRays[i].x)
        Bat.moveTowardsDirection.y = (-directionRays[i].y)
        Bat.moveTowardsDirection.z = (-directionRays[i].z)      
      }
    }    

    // If the Bat has not detected the player then rotate
    if (!Bat.isFound){
      Bat.rotateOnAxis(y_axis, Math.PI/Bat.rotationSpeed)
    }     
    else{ // Else look at player
      Bat.lookAt(camera.getWorldPosition().clone());
    }
    // How close is the Bat to the player?
    distance_to_player = distanceVector(camera.getWorldPosition(), Bat.position);
    if (distance_to_player < Bat_damage_distance*9){
      Bat.BatSpeed = Bat.BatSpeed + 0.035
    }
    if (distance_to_player < Bat_damage_distance){     
      if (canDoDamage) {
        damageToPlayer();
        computeBatPlayerPhysics(Bat);
      }
    }
  }
}

// Compute Bat-player and Bat-Syringe physics during collision
// For the Bat-player: Bat moves away in opposite direction until updateAI() is called.
var m1 = 200
var m2 = 100
var coll_scale = 0.8;
function computeBatPlayerPhysics(Bat){
  Bat_dir = Bat.moveTowardsDirection.clone();
  Bat.moveTowardsDirection.x = -Bat_dir.x
  Bat.moveTowardsDirection.z = -Bat_dir.z
  velocity.x = Bat_dir.x * 10.0
  velocity.z = Bat_dir.z * 10.0
  controls.getObject().translateX( velocity.x * m1/m2 * coll_scale);
  controls.getObject().translateZ( velocity.z * m1/m2 * coll_scale);  
}

function computeBatSyringePhysics(Bat,Syringe){
  Bat_dir = Bat.moveTowardsDirection.clone().normalize();
  Syringe_dir = Syringe.dir.clone().normalize();
  collision_normal = Bat_dir.sub(Syringe_dir);
  rel_velocity = Bat_dir.sub(Syringe_dir).dot(collision_normal);
  console.log(rel_velocity)
  Bat.moveTowardsDirection.x = (-collision_normal.x);
  Bat.moveTowardsDirection.y = (-collision_normal.y);
  Bat.moveTowardsDirection.z = (-collision_normal.z); 
  Bat.BatSpeed += rel_velocity/50 ;
}

var resistance_time_length = 5;
var resistance_time_start;
var resistance_timend;
var geometry = new THREE.PlaneGeometry( 5, 5, 32 );
var material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
var damage_plane = new THREE.Mesh( geometry, material );
damage_plane.position.z = -1;
damage_plane.material.transparent = true
damage_plane.material.opacity = 0.5;

function damageToPlayer(){
  isPlayerDamaged = true;
  resistance_time_start = clock.getElapsedTime();
  resistance_time_end = resistance_time_start + resistance_time_length;       
  player_health = player_health - Bat_damage;
  canDoDamage = false;
  blink_time_end = current_time + blink_duration
  camera.add( damage_plane );
}

var ai_time_length = 3;
var ai_time_start = clock.getElapsedTime();
var ai_time_end = ai_time_start + ai_time_length;  

// Helper function to generate rand signed integer between -1 and 1
function getRandSigned(){
  var num = (Math.random());
  num *= Math.floor(Math.random()*2) == 1 ? 1 : -1; // this will add minus sign in 50% of cases        
  return num;
}

function getPosNeg(){
  return Math.floor(Math.random()*2) == 1 ? 1 : -1
}

// Helper function to generate rand number between x,y
function getRand(x,y){
  var num = (Math.random()*y)+x;
  return num;
}

// To update the Bat AI
// For all Bats, shoot a ray and update Bat.direction to 
// move towards the player if detected, otherwise a random direction is used
function distanceVector( v1, v2 )
{
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;

    return Math.sqrt( dx * dx + dy * dy + dz * dz );
}

var lambda = 0.5;
var lambda_health = 1;
makeHealthPack(getRand(-1000,1000),getRand(-1000,1000))
makeHealthPack(getRand(-1000,1000),getRand(-1000,1000))
function updateAI(){
  // Check if we need new health packs
  // TODO: Follow exponential distribution
  if (pickable.children.length < max_health){ //max_health as in maximum health pickables
    console.log(lambda_health*Math.exp(-player_health/20))
    if(Math.random() < lambda_health*Math.exp(-player_health/20))
      makeHealthPack(getRand(-1000,1000),getRand(-1000,1000))
  }

  // Do we need to spawn new Bats?
  // Spawn a new Bat with a certain probability and set its location to
  // a random Bat currently on the map
  if (Bats.children.length < max_Bats){
    if (Math.random() < lambda*Math.exp(-lambda*Bats.children.length/2)){
      Bat = spawnBat(getRand(edges/4,edges/2),getRand(edges/4,edges/2));
      existing_Bat = Bats.children[0]
      Bat.position.set(existing_Bat.position.x,getRand(Bat_height,Bat_height+5),existing_Bat.position.z)
    }
  }

  // Handle the Bat movements and AI
  for(var c = 0; c < Bats.children.length; c++ ) {
    Bat = Bats.children[c]
    var isFound = false;
    var distance_to_player = distanceVector(camera.getWorldPosition(), Bat.position)
    if (distance_to_player <= 450){
      Bat.isFound = true;
      player_pos = camera.getWorldPosition().clone();
      Bat_pos = Bat.position;
      Bat.lookAt(player_pos);
      move_dir = new THREE.Vector3();
      Bat.moveTowardsDirection = move_dir.subVectors(player_pos,Bat_pos).normalize();
      Bat.BatSpeed = Bat.BatSpeed + 0.05;
    }

    else{
      Bat.isFound = false;
      if (Math.random() < 0.5){
        Bat.BatSpeed = BatSpeed;
        Bat.rotationSpeed = getRand(16,256)
        Bat.moveTowardsDirection = new THREE.Vector3(getRandSigned(), getRandSigned() , getRandSigned()).normalize();
        if ((Bat.position.y) > 50 || Bat.position.y < 15) {
          Bat.moveTowardsDirection.y = -Bat.moveTowardsDirection.y;
        }
      }
    }
  }
}


// To update the HUD

function updateHUD(){
  document.getElementById('player-position').innerHTML = "(" + Math.round(controls.getObject().position.x) + ',' + Math.round(controls.getObject().position.y) + ',' + Math.round(controls.getObject().position.z) + ")";
  document.getElementById('player-health').innerHTML = "<i class='glyphicon glyphicon-heart'></i>" + (player_health).toString() + '%';
  document.getElementById('player-score').innerHTML = "<i class='glyphicon glyphicon-screenshot'></i>" + (player_score).toString();
  document.getElementById('player-syringes').innerHTML = ""

  for(var p = max_Syringes; p > Syringes.children.length; p-- ) {
    document.getElementById('player-syringes').innerHTML = document.getElementById('player-syringes').innerHTML + "<i class='glyphicon glyphicon-pushpin'></i>"
  }

  document.getElementById('player-Bats').innerHTML = ""
  for(var p = 0; p < Bats.children.length; p++ ) {
    document.getElementById('player-Bats').innerHTML = document.getElementById('player-Bats').innerHTML + "<i class='glyphicon glyphicon-warning-sign'></i>"
  }

}


function update() {
  stats.begin();
  current_time = clock.getElapsedTime();

  if ( isFiring ){
    updateSyringes();
  }

  if (current_time > ai_time_end){  
    ai_time_start = clock.getElapsedTime();
    ai_time_end = ai_time_start + ai_time_length;    
    updateAI();
  }

  if (Math.abs(controls.getObject().position.x) > edges || Math.abs(controls.getObject().position.z) > edges){
    if (canDoDamage){
      damageToPlayer()
    }
  }

  if ( controlsEnabled ) {
    if (!initBat){
      // Initialize Bats
      for(var i = 0; i < max_Bats; i++ ) {
        spawnBat(getRand(controls.getObject().position.x+100,edges-100),getRand(controls.getObject().position.z+100,edges-100));
      }  
      initBat = true;
    }    

    updateBats();   
    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
    if ( moveForward ) velocity.z -= playerMovementSpeed * delta;
    if ( moveBackward ) velocity.z += playerMovementSpeed * delta;
    if ( moveLeft ) velocity.x -= playerMovementSpeed * delta;
    if ( moveRight ) velocity.x += playerMovementSpeed * delta;
    for (i = 0; i < directionRays.length; i++) {
      raycaster.set(controls.getObject().position, directionRays[i])
      var intersections = raycaster.intersectObjects( obstacle_trees, true );
      var isBlocked = intersections.length > 0;
      if (isBlocked && intersections[0].distance < 5 ){
        console.log('Collision with Tree')
        velocity.x += (-directionRays[i].x * playerMovementSpeed * delta)
        velocity.z += (-directionRays[i].z * playerMovementSpeed * delta)      
      }
    }  

    controls.getObject().translateX( velocity.x * delta );
    controls.getObject().translateY( velocity.y * delta );
    controls.getObject().translateZ( velocity.z * delta );
    if ( controls.getObject().position.y < 10 ) {
      velocity.y = 0;
      controls.getObject().position.y = 10;
      canJump = true;
    }
    prevTime = time;
    camera.updateProjectionMatrix();
    updateHUD();
  }

  if(player_health <= 0){
    loser.style.display = '-webkit-box';
    loser.style.display = '-moz-box';
    loser.style.display = 'box';
    blocker.style.display = '-webkit-box';
    blocker.style.display = '-moz-box';
    blocker.style.display = 'box';    
    controlsEnabled = false;
    controls.enabled = false;
  }

  if(initBat && Bats.children.length < 1){
    winner.style.display = '-webkit-box';
    winner.style.display = '-moz-box';
    winner.style.display = 'box';
    blocker.style.display = '-webkit-box';
    blocker.style.display = '-moz-box';
    blocker.style.display = 'box';    
    controlsEnabled = false;
    controls.enabled = false;
  }

  // Particle system
  makeItVirus();

  // Billboarding


  if(isSyringeBatCollided){

    splatterMaterial.uniforms[ 'time' ].value = (time - splat_time)/1000;
    splatterMaterial.needsUpdate = true;
  }

  stats.end();
  requestAnimationFrame(update);
  renderer.render( scene, camera );
}

var initBat = false;
update();

vid2.play();