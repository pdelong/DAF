
var SystemSettings = SystemSettings || {};
var boundary_w = 100;

SystemSettings.standardMaterial = new THREE.ShaderMaterial( {

    uniforms: {
        texture:  { type: 't',  value: new THREE.ImageUtils.loadTexture( 'images/sphere.png' ) },
    },

    attributes: {
        velocity: { type: 'v3', value: new THREE.Vector3() },
        color:    { type: 'v4', value: new THREE.Vector3( 0.0, 0.0, 1.0, 1.0 ) },
        lifetime: { type:  'f', value: 1.0 },
        size:     { type:  'f', value: 1.0 },
    },

    vertexShader:   document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,

    blending:    Gui.values.blendTypes,
    transparent: Gui.values.transparent,
    depthTest:   Gui.values.depthTest,

});

////////////////////////////////////////////////////////////////////////////////
// Flocking system
////////////////////////////////////////////////////////////////////////////////

SystemSettings.flocking = {

    // Particle material
    particleMaterial : SystemSettings.standardMaterial,

    // Initialization
    initializerFunction : FlockingInitializer,
    initializerSettings : {
        sphere:   new THREE.Vector4 ( 0.0, 0.0, 0.0, 10.0),
        color:    new THREE.Vector4 ( 0.0, 0.0, 0.0, 1.0 ),
        velocity: new THREE.Vector3 ( 0.0, 0.0, 0.0),
        lifetime: 100,
        size:     10.0,
    },

    // Update
    updaterFunction : EulerUpdater,
    updaterSettings : {
        externalForces : {
            gravity :    new THREE.Vector3( 0, 0, 0 ),
            predator:    new THREE.Vector3( 0, 0, 0 ),
            foods : [],
        },
        collidables: {
            boundingBoxes: [ [-boundary_w, boundary_w, -boundary_w, boundary_w, -boundary_w, boundary_w] ],
        },
    },

    // Scene
    maxParticles :  5000,
    particlesFreq : 1000,
    createScene : function () {
        drawLine(new THREE.Vector3(-boundary_w, -boundary_w, -boundary_w), new THREE.Vector3(-boundary_w, -boundary_w,  boundary_w));
        drawLine(new THREE.Vector3(-boundary_w, -boundary_w, -boundary_w), new THREE.Vector3(-boundary_w,  boundary_w, -boundary_w));
        drawLine(new THREE.Vector3(-boundary_w, -boundary_w, -boundary_w), new THREE.Vector3( boundary_w, -boundary_w, -boundary_w));
        drawLine(new THREE.Vector3( boundary_w,  boundary_w, -boundary_w), new THREE.Vector3( boundary_w, -boundary_w, -boundary_w));
        drawLine(new THREE.Vector3( boundary_w, -boundary_w,  boundary_w), new THREE.Vector3( boundary_w, -boundary_w, -boundary_w));
        drawLine(new THREE.Vector3( boundary_w, -boundary_w,  boundary_w), new THREE.Vector3( boundary_w,  boundary_w,  boundary_w));
        drawLine(new THREE.Vector3( boundary_w, -boundary_w,  boundary_w), new THREE.Vector3(-boundary_w, -boundary_w,  boundary_w));
        drawLine(new THREE.Vector3(-boundary_w,  boundary_w,  boundary_w), new THREE.Vector3(-boundary_w, -boundary_w,  boundary_w));
        drawLine(new THREE.Vector3(-boundary_w,  boundary_w,  boundary_w), new THREE.Vector3(-boundary_w,  boundary_w, -boundary_w));
        drawLine(new THREE.Vector3(-boundary_w,  boundary_w,  boundary_w), new THREE.Vector3( boundary_w,  boundary_w,  boundary_w));
        drawLine(new THREE.Vector3( boundary_w,  boundary_w, -boundary_w), new THREE.Vector3( boundary_w,  boundary_w,  boundary_w));
        drawLine(new THREE.Vector3( boundary_w,  boundary_w, -boundary_w), new THREE.Vector3(-boundary_w,  boundary_w, -boundary_w));
        
        var plane_geo = new THREE.PlaneBufferGeometry( 200, 200, 0, 1 );
        var phong     = new THREE.MeshPhongMaterial( {color: 0x2194ce, emissive:0xff00aa, side: THREE.DoubleSide } );
        phong.opacity = 0.1;
        phong.transparent = true;

        var plane1 = new THREE.Mesh( plane_geo, phong );
        plane1.position.set(0, 0, -100);
        Scene.addObject( plane1 );
        // plane.rotation.x = -1.57;
        var plane2 = new THREE.Mesh( plane_geo, phong );
        plane2.position.set(0, -100, 0);
        plane2.rotation.x = 1.57;
        console.log(plane2);
        Scene.addObject( plane2 );

        var plane3 = new THREE.Mesh( plane_geo, phong );
        plane3.position.set(-100, 0, 0);
        plane3.rotation.y = 1.57;
        Scene.addObject( plane3 );
        
        // plane.position.y = 0;

        
    },
};

// draw line from a to b
function drawLine( a, b ) {
    var lineGeometry = new THREE.Geometry();
    var vertArray = lineGeometry.vertices;
    vertArray.push( a, b );
    lineGeometry.computeLineDistances();
    var lineMaterial = new THREE.LineDashedMaterial( { color: 0x000080, linewidth: 2, dashSize: 2, gapSize: 2 } );
    var line = new THREE.Line( lineGeometry, lineMaterial );
    Scene.addObject(line);
}
