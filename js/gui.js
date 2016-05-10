"use strict";

var Gui = Gui || {};

// list of presets available in the GUI
Gui.sceneList = [];

Gui.windowSizes = [ "full","400x400","600x400","600x600","800x600","800x800" ];

Gui.particleSystems = [ "User", "Auto" ];

Gui.spawnAmount = [ 1, 5, 10, 25, 100 ];

Gui.textures = [ "blank", "base", "fire", "smoke", "spark", "sphere", "smoke" ];

Gui.factors = [ 1, 1, 1 ];


// due to a bug in dat GUI we need to initialize floats to non-interger values (like 0.5)
// (the variable Gui.defaults below then carries their default values, which we set later)
Gui.values = {
    windowSize:  Gui.windowSizes[0],
    reset:       function () {},
    stopTime:    function () {},
    help:  		 function () {},
    rule1:    	 Gui.factors[0],
    rule2:    	 Gui.factors[1],
    rule3:    	 Gui.factors[2],
    spawnAmount: Gui.spawnAmount[3],
    textures:    Gui.textures[0],
    systems:     Gui.particleSystems[0],
    depthTest:   true,
    transparent: true,
    sorting:     true,
};

// defaults only hold actual mesh modifiers, no display
Gui.defaults = { };

Gui.alertOnce = function( msg ) {
    var mainDiv = document.getElementById('main_div');
    mainDiv.style.opacity = "0.3";
    var alertDiv = document.getElementById('alert_div');
    alertDiv.innerHTML = '<p>'+msg + '</p><button id="ok" onclick="Gui.closeAlert()">ok</button>';
    alertDiv.style.display = 'inline';
};

Gui.closeAlert = function () {
    var mainDiv = document.getElementById('main_div');
    mainDiv.style.opacity = "1";
    var alertDiv = document.getElementById('alert_div');
    alertDiv.style.display = 'none';
};

Gui.init = function ( meshChangeCallback, controlsChangeCallback, displayChangeCallback ) {
    // create top level controls
    var gui     = new dat.GUI( { width: 300 } );
    var size    = gui.add( Gui.values, 'windowSize', Gui.windowSizes ).name("Window Size");

    // gui controls are added to this object below
    var gc = {};
    gc.systems 	= gui.add( Gui.values, 'systems', Gui.particleSystems ).name("Flocking System");
    gc.stopTime	= gui.add( Gui.values, 'stopTime' ).name("Pause");
    gc.reset 	= gui.add( Gui.values, 'reset' ).name("Reset");
    gc.help 	= gui.add( Gui.values, 'help').name("Help");
    gc.spawnAmount = gui.add(Gui.values, 'spawnAmount', Gui.spawnAmount).name("Spawn Amount");

    var advanced = gui.addFolder("Flocking Parameters");
    gc.rule1 = advanced.add(Gui.values, 'rule1', 0.2, 5).name("Center of Mass");
    gc.rule2 = advanced.add(Gui.values, 'rule2', 0.5, 2).name("Collision Avoidance");
    gc.rule3 = advanced.add(Gui.values, 'rule3', 0.2, 5).name("Velocity Matching");

    // var disp = gui.addFolder( "DISPLAY OPTIONS");
    // gc.blends    = disp.add( Gui.values, 'blendTypes', Gui.blendTypes ).name("Blending Types");
    // gc.textures  = disp.add( Gui.values, 'textures', Gui.textures ).name("Textures");
    // gc.depthTest = disp.add( Gui.values, 'depthTest' ).name("Depth Test");
    // gc.transp    = disp.add( Gui.values, 'transparent' ).name("Transparent");
    // gc.sort      = disp.add( Gui.values, 'sorting' ).name("Sorting");

    // REGISTER CALLBACKS FOR WHEN GUI CHANGES:
    size.onChange( Renderer.onWindowResize );

    gc.stopTime.onChange( ParticleEngine.pause );
    gc.reset.onChange( ParticleEngine.restart );
    gc.help.onChange( function() {
    	Gui.alertOnce("Press 'a' to add boids, 's' to speed up birds,<br>" +
    				  "and use i+k, j+l, and u+o to control the <br>" + 
    				  "x, y, and z of the predator. <br>" +
                      "Press 'd' to add food balls to the system.");
    });

    // gc.textures.onChange( function( value ) {
    //     var emitters = ParticleEngine.getEmitters();
    //     for ( var i = 0 ; i < emitters.length ; i++ ) {
    //         emitters[i]._material.uniforms.texture.value = new THREE.ImageUtils.loadTexture( 'images/' + value + '.png' );
    //         emitters[i]._material.needsUpdate  = true;
    //     }
    // } );

    gc.systems.onChange( function(value) {
        // var settings = SystemSettings[value];
        // Main.particleSystemChangeCallback ( settings ); // kek
        if (value == 'User') { // prob horrible style but its k
            Gui.values.systems = Gui.particleSystems[0];
        } else if (value == 'Auto') {
            Gui.values.systems = Gui.particleSystems[1];
        }
    } );

    gc.spawnAmount.onChange( function(value) {
        ParticleEngine.setSpawnAmount(value);
    } );

    gc.rule1.onChange( function(value) {
    	Gui.factors[0] = value;
    });

    gc.rule2.onChange( function(value) {
    	Gui.factors[1] = value;
    });

    gc.rule3.onChange( function(value) {
    	Gui.factors[2] = value;
    });

    // gc.depthTest.onChange( function( value ) {
    //     var emitters = ParticleEngine.getEmitters();
    //     for ( var i = 0 ; i < emitters.length ; i++ ) {
    //         emitters[i]._material.depthTest = value;
    //     }
    // });

    // gc.transp.onChange( function( value ) {
    //     var emitters = ParticleEngine.getEmitters();
    //     for ( var i = 0 ; i < emitters.length ; i++ ) {
    //         emitters[i]._material.transparent = value;
    //         emitters[i]._material.needsUpdate  = true ;
    //     }
    // });

    // gc.sort.onChange( function( value ) {
    //     var emitters = ParticleEngine.getEmitters();
    //     for ( var i = 0 ; i < emitters.length ; i++ ) {
    //         emitters[i]._sorting = value;
    //     }
    // });
};

