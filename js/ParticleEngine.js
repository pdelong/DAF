////////////////////////////////////////////////////////////////////////////////
// COS 426 Assignement 4 stub                                                 //
// Particle Systems                                                           //
// Many ideas here are taken from SPARKS.js                                   //
////////////////////////////////////////////////////////////////////////////////

// TODO :
// - shader requires more exploration / better interface
// - change moving particle to setting it invisible in shader
// - initializers and particle engine must work with all the sahder supported attributes
// - incorporate gui controls

// Singleton Engine - we will have one particle engine per application,
// driving the entire application.

var old_objects = [];

var ParticleEngine = ParticleEngine || new ( function() {
    var _self      = this;

    // Instance variables - list of emitters, and global delta time
    _self._emitters   = [];
    _self._meshes     = [];
    _self._animations = [];
    _self._prev_t     = undefined;
    _self._cur_t      = undefined;
    _self._isRunning  = false;
    _self.spawnAmount = 25;
    _self.speedUpFactor = 1.25;

    _self.addEmitter = function ( emitter ) {
        _self._emitters.push( emitter );
    };

    _self.removeEmitters = function() {
        _self._emitters = [];
    };

    _self.addMesh = function ( mesh ) {
        _self._meshes.push( mesh );
    };

    _self.removeMeshes = function() {
        _self._meshes = [];
    };

    _self.addAnimation = function ( animation ) {
        _self._animations.push( animation );
        animation.play()
    };

    _self.removeAnimations = function () {
        for ( var i = 0 ; i < _self._animations.length; ++i ) {
            _self._animations[i].isPlaying = false;
        }
        _self._animations = [];
    };

    _self.start = function () {
        _self._prev_t = Date.now();
        _self._cur_t  = Date.now();
        _self._isRunning = true;
    };

    _self.step = function () {
        // deal with time
        _self._cur_t  = Date.now();
        var elapsed  = (_self._cur_t - _self._prev_t) / 1000.0;
        _self._prev_t = _self._cur_t;
        if ( !_self._isRunning ) elapsed = 0.0;

        for ( var i = 0; i < _self._animations.length ; ++i ) {
            _self._animations[i].update( elapsed * 1000.0 );
        }

        for ( var i = 0 ; i < _self._emitters.length ; ++i ) {
            _self._emitters[i].update( elapsed );
        }
    };

    _self.stop = function () {
        _self._isRunning = false;
    },

    _self.pause = function () {
        if ( _self._isRunning ) {
            _self.stop();
        } else {
            _self.start();
        }
    };

    _self.restart = function () {
        _self.stop();
        for ( var i = 0 ; i < _self._emitters.length ; ++i ) {
            _self._emitters[i].restart();
        }
        _self.start();
    };

    _self.getDrawableParticles = function ( emitter_idx ) {
        return _self._emitters[emitter_idx].getDrawableParticles();
    }

    _self.getEmitters = function( ) {
        return _self._emitters;
    }

    _self.reinitialize = function() {
        for (var i = 0; i < _self._emitters.length; ++i ) {
            _self._emitters[i].addSpawn(_self.spawnAmount);
        }

        for ( var i = 0; i < _self._animations.length ; ++i ) {
            _self._animations[i].addSpawn(_self.spawnAmount);
        }
    }

    _self.speedup = function() {
        for ( var i = 0 ; i < _self._emitters.length ; ++i ) {
            _self._emitters[i].addSpeed(_self.speedUpFactor);
        }

        for ( var i = 0; i < _self._animations.length ; ++i ) {
            _self._emitters[i].addSpeed(_self.speedUpFactor);
        }
    }

    _self.addFood = function() {
        for ( var i = 0 ; i < _self._emitters.length ; ++i ) {
            _self._emitters[i].addFood();
        }

        for ( var i = 0; i < _self._animations.length ; ++i ) {
            _self._emitters[i].addFood();
        }
    }

    _self.setSpawnAmount = function(amt) {
        _self.spawnAmount = amt;
    }

    _self.redraw  = function(pos, vel, i) {
        var old_phase =  Math.floor( Math.random() * 62.83 );
        if (old_objects[i] !== undefined) {
            old_phase = old_objects[i].phase;
            Scene.removeObject( old_objects[i] );
        }   

        var bird = new THREE.Mesh( new Bird(), new THREE.MeshBasicMaterial( { color: 0x996515, side: THREE.DoubleSide } ) );
        bird.position.set(pos.x, pos.y, pos.z);
        old_objects[i] = bird;

        bird.rotation.y = Math.atan2( - vel.z, vel.x );
        bird.rotation.z = Math.asin( vel.y / vel.length() );
        bird.phase = ( old_phase + ( Math.max( 0, bird.rotation.z ) + 0.1 )  ) % 62.83;
        bird.geometry.vertices[ 5 ].y = bird.geometry.vertices[ 4 ].y = Math.sin( bird.phase ) * 10;
        Scene.addObject( bird );
    }

    return _self;
})();
var counter = 0;
function Emitter ( opts ) {

    // initialize some base variables needed by emitter, that we will extract from options
    this._maxParticleCount     = undefined;
    this._particlesPerSecond   = undefined;
    this._initializer          = undefined;
    this._updater              = undefined;
    this._cloth                = false;
    this._attributeInformation = {
        position:      3,
        velocity:      3,
        color:         4,
        size:          1,
        lifetime:      1,
    };

    // parse options
    for ( var option in opts ) {
        var value = opts[option];
        if ( option === "material" ) {
            this._material = value;
        } else if ( option === "maxParticles" ) {
            this._maxParticleCount = value;
        } else if ( option === "particlesFreq" ) {
            this._particlesPerSecond = value;
        } else if ( option === "initialize" ) {
            this._initializer = value;
        } else if ( option === "update" ) {
            this._updater = value;
        } else if ( option === "material" ) {
            this._material = value;
        } else if ( option === "cloth" ) {
            this._cloth = value;
        } else if ( option === "width" ) {
            this._width = value;
        } else if ( option === "height" ) {
            this._height = value;
        } else {
            console.log( "Unknown option " + option + "! Make sure to register it!" )
        }
    }

    // These are more internal variables that will be initialized based on parsed arguments.
    // For example, attributes given to THREE.BufferGeometry will depend on attributeInformation
    // variable.
    this._particles          = new THREE.BufferGeometry();
    this._initialized        = [];

    // Store indices of available particles - these are not initialized yet
    for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {
        this._initialized[i] = false;
    }

    // Allocate memory for the particles
    for ( var attributeKey in this._attributeInformation ) {
        // get info from attributeInformation, required to initialize correctly sized arrays
        var attributeLength = this._attributeInformation[ attributeKey ];
        var attributeArray = new Float32Array( this._maxParticleCount * attributeLength );

        // Since these are zero - initialized, they will appear in the scene.
        // By setting all to be negative infinity we will effectively remove these from rendering.
        // This is also how you "remove" dead particles
        for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {
            for ( var j = 0 ; j < attributeLength ; ++j ) {
                attributeArray[ attributeLength * i + j ] = 1e-9;
            }
        }

        this._particles.addAttribute( attributeKey, new THREE.BufferAttribute( attributeArray, attributeLength ) );
    }

    this._particleAttributes = this._particles.attributes; // for convenience / less writing / not sure / #badprogramming

    this._sorting = false;
    this._distances = [];
    this._backupArray = new Float32Array( this._maxParticleCount * 4 );

    // Create the drawable particles - this is the object that three.js will use to draw stuff onto screen
    this._drawableParticles = new THREE.PointCloud( this._particles, this._material );

    return this;
};

Emitter.prototype.restart = function() {

    for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {
    	this._initialized[i] = 0;
    	killParticle(i, this._particleAttributes, this._initialized);
    }
    var foods = this._updater._opts.externalForces.foods;
    for (var i = 0; i < foods.length; i++)
        Scene.removeObject(foods[i]);
    this._updater._opts.externalForces.foods = [];
    // Gui.values.systems = Gui.particleSystems[3];
    this._initializer.initialize(this._particleAttributes, this.addSpawn(250) );

};

for ( var attributeKey in this._particleAttributes ) {

    var attribute       = this._particleAttributes[attributeKey];
    var attributeArray  = attribute.array;
    var attributeLength = attribute.itemSize;

    for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {
        for ( var j = 0 ; j < attributeLength ; ++j ) {
            attributeArray[ attributeLength * i + j ] = 1e-9;
        }
    }

    attribute.needsUpdate = true;

}

Emitter.prototype.update = function( delta_t ) {
    // how many particles should we add?
    var toAdd = Math.floor( delta_t * this._particlesPerSecond );

    if (toAdd > 0 && !this._initializer.initialized) {
        this._initializer.initialize (this._particleAttributes, this.addSpawn(250) );
    }

    // add check for existence
    this._updater.update( this._particleAttributes, this._initialized, delta_t );

    // sorting -> Move it to camera update / loop update so that it is updated each time even if time is paused?
    if ( this._sorting === true ) {
        this.sortParticles();
    }

    // for visibility culling
    this._drawableParticles.geometry.computeBoundingSphere();
};


Emitter.prototype.enableSorting = function( val ) {
    this._sorting = val;
};

Emitter.prototype.getDrawableParticles = function () {
    return this._drawableParticles;
};

Emitter.prototype.sortParticles = function () {
    var positions  = this._particleAttributes.position;
    var cameraPosition = Renderer._camera.position;

    for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {
        var currentPosition =  getElement( i, positions );
        this._distances[i] = [cameraPosition.distanceToSquared( currentPosition ),i];
    }

    this._distances.sort( function( a, b ) { return a[0] < b[0] } );

    for ( var attributeKey in this._particleAttributes ) {

        var attributeLength = this._particleAttributes[ attributeKey ].itemSize;
        var attributeArray  = this._particleAttributes[ attributeKey ].array;

        for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {
            for ( var j = 0 ; j < attributeLength ; ++j ) {
                this._backupArray[4 * i + j ] = attributeArray[ attributeLength * this._distances[i][1] + j ]
            }
        }

        for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {
            for ( var j = 0 ; j < attributeLength ; ++j ) {
                attributeArray[ attributeLength * i + j ] = this._backupArray[4 * i + j ];
            }
        }
    }

    initialized_cpy = []
        for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {
            initialized_cpy[ i ] = this._initialized[ this._distances[i][1] ];
        }

    for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {
        this._initialized[ i ] = initialized_cpy[i];
    }
};

Emitter.prototype.getSpawnable = function ( toAdd ) {
    var toSpawn = [];
    for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {

        if ( this._initialized[i] ) continue;
        if ( toSpawn.length >= toAdd ) break;
        this._initialized[i] = true;
        toSpawn.push(i);
    }

    return toSpawn;
};

Emitter.prototype.addSpawn = function ( toAdd ) {
    var toSpawn = [];
    var counter = 0;
    for ( var i = 0 ; i < this._maxParticleCount ; ++i ) {
        if ( this._initialized[i] ) continue;
        if ( counter >= toAdd ) break;
        this._initialized[i] = true;
        toSpawn.push(i);
        counter++;
    }

    this._initializer.initialized = false;
    this._initializer.initialize ( this._particleAttributes, toSpawn);

    // add check for existence
    this._updater.update( this._particleAttributes, this._initialized, 0 );

    // sorting -> Move it to camera update / loop update so that it is updated each time even if time is paused?
    if ( this._sorting === true ) {
        this.sortParticles();
    }

    // for visibility culling
    this._drawableParticles.geometry.computeBoundingSphere();

    return toSpawn;
};

Emitter.prototype.addSpeed = function ( toScale ) {
    this._updater.speedup( this._particleAttributes, this._initialized, toScale );
};

Emitter.prototype.addFood = function () {
    var pos = new THREE.Vector3(1.0 - 2.0 * Math.random(), 1.0 - 2.0 * Math.random(), 1.0 - 2.0 * Math.random());
    pos.multiplyScalar(boundary_w);
    
    var r = Math.random() * 2.0 + 3.0;
    var geo = new THREE.SphereGeometry( r, 32, 32 );
    var phong      = new THREE.MeshPhongMaterial( {color: 0xea0b29, emissive:0x442222, side: THREE.DoubleSide } );

    var food_obj = new THREE.Mesh( geo, phong )
    food_obj.position.set (pos.x, pos.y, pos.z);
    food_obj.magnitude = (r * 2.0) + 5;
    food_obj.r = r;
    Scene.addObject( food_obj );

    var foods = this._updater._opts.externalForces.foods;
    setTimeout(function() {
        for (var i = 0; i < foods.length; i++) {
            if (food_obj === foods[i]) {
                Scene.removeObject(food_obj);
                foods.splice(i, 1);
                break;
            }
        }
    }, 15000);

    this._updater._opts.externalForces.foods.push(food_obj);
};
