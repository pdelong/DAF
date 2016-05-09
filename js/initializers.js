
////////////////////////////////////////////////////////////////////////////////
// Void Initializer
////////////////////////////////////////////////////////////////////////////////

function VoidInitializer ( opts ) {
    this._opts = opts;
    return this;
};

VoidInitializer.prototype.initialize = function ( particleAttributes, toSpawn ) {

};

////////////////////////////////////////////////////////////////////////////////
// Flocking Initializer
////////////////////////////////////////////////////////////////////////////////

function FlockingInitializer ( opts ) {
    this._opts = opts;
    this.initialized = false;
    return this;
};

FlockingInitializer.prototype.initializePositions = function ( positions, toSpawn) {
    var r = 5;
    for ( var i = 0 ; i < toSpawn.length ; ++i ) {
        var idx = toSpawn[i];

        var z = 2*r * Math.random() - r;
        var phi = 2*Math.PI*Math.random();
        d = Math.sqrt(r*r - z*z);

        var pos = new THREE.Vector3(d * Math.cos(phi),
                                    d * Math.sin(phi),
                                    z);

        setElement( idx, positions, pos );

    }
    positions.needUpdate = true;
}

FlockingInitializer.prototype.initializeVelocities = function ( velocities, positions, toSpawn ) {

    // generate general direction for flock
    var z = 2 * Math.random() - 1;
    var phi = 2*Math.PI*Math.random();
    d = Math.sqrt(1 - z*z);

    var fvel = new THREE.Vector3(d * Math.cos(phi),
                                 d * Math.sin(phi),
                                 z);
    fvel.multiplyScalar(20);
    for ( var i = 0 ; i < toSpawn.length ; ++i ) {
        var idx = toSpawn[i];

        // generate individual direction
        var z = 2* Math.random() - 1;
        var phi = 2*Math.PI*Math.random();
        d = Math.sqrt(1 - z*z);

        var vel = new THREE.Vector3(d * Math.cos(phi),
                                    d * Math.sin(phi),
                                    z);

        vel.add(fvel);
        vel.multiplyScalar(1.0);

        setElement( idx, velocities, vel );
    }
    velocities.needUpdate = true;
}

FlockingInitializer.prototype.initializeColors = function ( colors, toSpawn ) {
    var base_col = this._opts.color;
    for ( var i = 0 ; i < toSpawn.length ; ++i ) {
        var idx = toSpawn[i];
        var col = base_col;
        setElement( idx, colors, col );
    }
    colors.needUpdate = true;
}

FlockingInitializer.prototype.initializeSizes = function ( sizes, toSpawn ) {
    for ( var i = 0 ; i < toSpawn.length ; ++i ) {
        var idx = toSpawn[i];
        var size = this._opts.size;
        setElement( idx, sizes, size );
    }
    sizes.needUpdate = true;
}

FlockingInitializer.prototype.initializeLifetimes = function ( lifetimes, toSpawn ) {
    for ( var i = 0 ; i < toSpawn.length ; ++i ) {
        var idx = toSpawn[i];
        var lifetime = this._opts.lifetime;
        setElement( idx, lifetimes, lifetime );
    }
    lifetimes.needUpdate = true;
}

FlockingInitializer.prototype.initialize = function ( particleAttributes, toSpawn ) {
    if (this.initialized)
        return;

    // update required values
    this.initializePositions( particleAttributes.position, toSpawn );

    this.initializeVelocities( particleAttributes.velocity, particleAttributes.position, toSpawn );

    this.initializeColors( particleAttributes.color, toSpawn );

    this.initializeLifetimes( particleAttributes.lifetime, toSpawn );

    this.initializeSizes( particleAttributes.size, toSpawn );

    this.initialized = true;
};
