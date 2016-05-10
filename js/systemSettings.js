
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
// Flocking System
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
            predator:    { p: new THREE.Vector3( 0, 0, 0 ), v: new THREE.Vector3( 0, 0, 0 ) },
            foods : [],
        },
        collidables: {
            boundingBoxes: [ [-boundary_w, boundary_w, -boundary_w, boundary_w, -boundary_w, boundary_w] ],
        },
    },

    // Scene
    maxParticles :  5000,
    particlesFreq : 5000,
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
        
        // box planes
        var plane_geo = new THREE.PlaneBufferGeometry( 200, 200, 0, 1 );
        // var phong     = new THREE.MeshPhongMaterial( {color: 0x2194ce, emissive:0xff00aa, side: THREE.DoubleSide } );
        var phong     = new THREE.MeshPhongMaterial( {color: 0xffd700, emissive:0xffd700, side: THREE.DoubleSide } );
        phong.opacity = 0.25;
        phong.transparent = true;

        var plane1 = new THREE.Mesh( plane_geo, phong );
        plane1.position.set(0, 0, -100);
        Scene.addObject( plane1 );

        var plane2 = new THREE.Mesh( plane_geo, phong );
        plane2.position.set(0, -100, 0);
        plane2.rotation.x = 1.57;
        Scene.addObject( plane2 );

        var plane3 = new THREE.Mesh( plane_geo, phong );
        plane3.position.set(-100, 0, 0);
        plane3.rotation.y = 1.57;
        Scene.addObject( plane3 );

        // clouds
        var sprite = THREE.ImageUtils.loadTexture( "images/test.png" );
        material = new THREE.PointCloudMaterial( { size: 250.0,
            map: sprite,
            blending: THREE.NormalBlending, //THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true} );

        var geometry = new THREE.Geometry();

        geometry.vertices.push(
            new THREE.Vector3( -50,  110, -500 ), new THREE.Vector3( 25,  100, -500 ), new THREE.Vector3( -125,  100, -500 ),
            new THREE.Vector3( -50,  160, -500 ), new THREE.Vector3( 25,  150, -500 ), new THREE.Vector3( -125,  150, -500 ),
            new THREE.Vector3(  -370, 0, -500 ), new THREE.Vector3(  -370, 0, -410 ), new THREE.Vector3( -300, 0, -410 ),
            new THREE.Vector3( -300,  120, -50 ), new THREE.Vector3( -300,  130, 25 ), new THREE.Vector3( -300, 130, -125 ),
            new THREE.Vector3(  240, 20, 0 ), new THREE.Vector3( 240, 20, 40 ),
            new THREE.Vector3(  0, 25, 300 ), new THREE.Vector3( 40, 10, 300 ), new THREE.Vector3( 80, -5, 300 ), new THREE.Vector3( -40, 25, 300 ), new THREE.Vector3( 30, 25, 280 ),
            new THREE.Vector3(  125, 100, -100 ), new THREE.Vector3( 125, 100, -140 ),
            new THREE.Vector3(  -150, -80, 70 ), new THREE.Vector3( -150, -80, 110 ),
            new THREE.Vector3(  170, -50, 170 ), new THREE.Vector3( 170, -50, 210 ), new THREE.Vector3( 150, -50, 210 ),
            new THREE.Vector3(  0, -200, -50 ), new THREE.Vector3( 0, -210, 0 ), new THREE.Vector3( 0, -200, 50 ), new THREE.Vector3( -50 , -200, 0 ),
            new THREE.Vector3(  0, 200, -50 ), new THREE.Vector3( 0, 210, 0 ), new THREE.Vector3( 0, 200, 50 ), new THREE.Vector3( -50 , 200, 0 )
        );

        var particleCloud  = new THREE.PointCloud( geometry, material );
        Scene.addObject(particleCloud);
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
