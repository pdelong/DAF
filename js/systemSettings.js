var SystemSettings = SystemSettings || {};
var boundary_w = 50;

SystemSettings.standardMaterial = new THREE.ShaderMaterial( {

    uniforms: {
        texture:  { type: 't',  value: new THREE.ImageUtils.loadTexture( 'images/blank.png' ) },
    },

    attributes: {
        velocity: { type: 'v3', value: new THREE.Vector3() },
        color:    { type: 'v4', value: new THREE.Vector3( 0.0, 0.0, 1.0, 1.0 ) },
        lifetime: { type: 'f', value: 1.0 },
        size:     { type: 'f', value: 1.0 },
    },

    vertexShader:   document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,

    blending:    Gui.values.blendTypes,
    transparent: Gui.values.transparent,
    depthTest:   Gui.values.depthTest,

} );

////////////////////////////////////////////////////////////////////////////////
// Flocking system
////////////////////////////////////////////////////////////////////////////////

SystemSettings.flocking = {

    // Particle material
    particleMaterial : SystemSettings.standardMaterial,

    // Initialization
    initializerFunction : FlockingInitializer,
    initializerSettings : {
        sphere: new THREE.Vector4 ( 0.0, 0.0, 0.0, 10.0),
        color:    new THREE.Vector4 ( 0.0, 0.0, 0.0, 1.0 ),
        velocity: new THREE.Vector3 ( 0.0, 0.0, 0.0),
        lifetime: 7,
        size:     6.0,
    },

    // Update
    updaterFunction : EulerUpdater,
    updaterSettings : {
        externalForces : {
            gravity :     new THREE.Vector3( 0, 0, 0),
            attractors : [],
        },
        collidables: {
            boundingBoxes: [ [-boundary_w, boundary_w, -boundary_w, boundary_w, -boundary_w, boundary_w] ],
        },
    },

    // Scene
    maxParticles :  500,
    particlesFreq : 1000,
    createScene : function () {
        drawLine(new THREE.Vector3(-boundary_w, -boundary_w, -boundary_w), new THREE.Vector3(-boundary_w, -boundary_w, boundary_w));
        drawLine(new THREE.Vector3(-boundary_w, -boundary_w, -boundary_w), new THREE.Vector3(-boundary_w, boundary_w, -boundary_w));
        drawLine(new THREE.Vector3(-boundary_w, -boundary_w, -boundary_w), new THREE.Vector3(boundary_w, -boundary_w, -boundary_w));
        drawLine(new THREE.Vector3(boundary_w, boundary_w, -boundary_w), new THREE.Vector3(boundary_w, -boundary_w, -boundary_w));
        drawLine(new THREE.Vector3(boundary_w, -boundary_w, boundary_w), new THREE.Vector3(boundary_w, -boundary_w, -boundary_w));
        drawLine(new THREE.Vector3(boundary_w, -boundary_w, boundary_w), new THREE.Vector3(boundary_w, boundary_w, boundary_w));
        drawLine(new THREE.Vector3(boundary_w, -boundary_w, boundary_w), new THREE.Vector3(-boundary_w, -boundary_w, boundary_w));
        drawLine(new THREE.Vector3(-boundary_w, boundary_w, boundary_w), new THREE.Vector3(-boundary_w, -boundary_w, boundary_w));
        drawLine(new THREE.Vector3(-boundary_w, boundary_w, boundary_w), new THREE.Vector3(-boundary_w, boundary_w, -boundary_w));
        drawLine(new THREE.Vector3(-boundary_w, boundary_w, boundary_w), new THREE.Vector3(boundary_w, boundary_w, boundary_w));
        drawLine(new THREE.Vector3(boundary_w, boundary_w, -boundary_w), new THREE.Vector3(boundary_w, boundary_w, boundary_w));
        drawLine(new THREE.Vector3(boundary_w, boundary_w, -boundary_w), new THREE.Vector3(-boundary_w, boundary_w, -boundary_w));

        drawLine(new THREE.Vector3(-boundary_w, boundary_w, boundary_w), new THREE.Vector3(boundary_w, boundary_w, -boundary_w));
        drawLine(new THREE.Vector3(-boundary_w, -boundary_w, -boundary_w), new THREE.Vector3(boundary_w, -boundary_w, boundary_w));
        drawLine(new THREE.Vector3(-boundary_w, -boundary_w, boundary_w), new THREE.Vector3(boundary_w, boundary_w, boundary_w));
        drawLine(new THREE.Vector3(boundary_w, -boundary_w, boundary_w), new THREE.Vector3(boundary_w, boundary_w, -boundary_w));
        drawLine(new THREE.Vector3(boundary_w, -boundary_w, -boundary_w), new THREE.Vector3(-boundary_w, boundary_w, -boundary_w));
        drawLine(new THREE.Vector3(-boundary_w, -boundary_w, -boundary_w), new THREE.Vector3(-boundary_w, boundary_w, boundary_w));       
    },
};

// draw line from a to b
function drawLine( a, b ) 
{
    var lineGeometry = new THREE.Geometry();
    var vertArray = lineGeometry.vertices;
    vertArray.push( a, b );
    lineGeometry.computeLineDistances();
    var lineMaterial = new THREE.LineDashedMaterial( { color: 0x000080, dashSize: 1, gapSize: 1 } );
    var line = new THREE.Line( lineGeometry, lineMaterial );
    Scene.addObject(line);
}