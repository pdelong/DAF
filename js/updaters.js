/*
 * In this file you can specify all sort of updaters
 *  We provide an example of simple updater that updates pixel positions based on initial velocity and gravity
 */

////////////////////////////////////////////////////////////////////////////////
// Collisions
////////////////////////////////////////////////////////////////////////////////

var Collisions = Collisions || {};

Collisions.Plane = function ( particleAttributes, alive, delta_t, plane,damping ) {
    var positions    = particleAttributes.position;
    var velocities   = particleAttributes.velocity;

    for ( var i = 0 ; i < alive.length ; ++i ) {

        if ( !alive[i] ) continue;
        // ----------- STUDENT CODE BEGIN ------------
        var pos = getElement( i, positions );
        var vel = getElement( i, velocities );

        setElement( i, positions, pos );
        setElement( i, velocities, vel );
        // ----------- STUDENT CODE END ------------
    }
};

Collisions.boundingBox = function ( particleAttributes, alive, delta_t, boundingBox ) {
    var positions    = particleAttributes.position;
    var velocities   = particleAttributes.velocity;

    // var sphere_center = new THREE.Vector3(sphere.x, sphere.y, sphere.z);
    // var sphere_radius = sphere.w;

    for ( var i = 0 ; i < alive.length ; ++i ) {

        if ( !alive[i] ) continue;
        // ----------- STUDENT CODE BEGIN ------------
        var pos = getElement( i, positions );
        var vel = getElement( i, velocities );

        var new_pos = pos.clone().add( vel.clone().multiplyScalar( delta_t ) );

        var min_x = boundingBox[0];
        var max_x = boundingBox[1];
        var min_y = boundingBox[2];
        var max_y = boundingBox[3];
        var min_z = boundingBox[4];
        var max_z = boundingBox[5];

        var center = new THREE.Vector3((min_x + max_x) / 2, 
        							   (min_y + max_y) / 2, 
        							   (min_z + max_z) / 2);

        // constraint code
        // if (new_pos.x < min_x) pos.x = max_x;
        // if (new_pos.x > max_x) pos.x = min_x;
        // if (new_pos.y < min_y) pos.y = max_y;
        // if (new_pos.y > max_y) pos.y = min_y;
        // if (new_pos.z < min_z) pos.z = max_z;
        // if (new_pos.z > max_z) pos.z = min_z;

        // attractor code
       	if (new_pos.x < min_x || new_pos.x > max_x || new_pos.y < min_y ||
       		new_pos.y > max_y || new_pos.z < min_z || new_pos.z > max_z) {
       		vel.add(center.sub(new_pos).multiplyScalar(0.0025));
       	}

        setElement( i, positions, pos );
        setElement( i, velocities, vel );
        // ----------- STUDENT CODE END ------------
    }
}

////////////////////////////////////////////////////////////////////////////////
// Null updater - does nothing
////////////////////////////////////////////////////////////////////////////////

function VoidUpdater ( opts ) {
    this._opts = opts;
    return this;
};

VoidUpdater.prototype.update = function ( particleAttributes, initialized, delta_t ) {
    //do nothing
};

////////////////////////////////////////////////////////////////////////////////
// Euler updater
////////////////////////////////////////////////////////////////////////////////

function EulerUpdater ( opts ) {
    this._opts = opts;
    return this;
};


EulerUpdater.prototype.updatePositions = function ( particleAttributes, alive, delta_t ) {
    var positions  = particleAttributes.position;
    var velocities = particleAttributes.velocity;

    for ( var i  = 0 ; i < alive.length ; ++i ) {
        if ( !alive[i] ) continue;
        var p = getElement( i, positions );
        var v = getElement( i, velocities );
        p.add( v.clone().multiplyScalar( delta_t ) );
        setElement( i, positions, p );
    }
};

EulerUpdater.prototype.updateVelocities = function ( particleAttributes, alive, delta_t ) {
    var positions = particleAttributes.position;
    var velocities = particleAttributes.velocity;

    // scale factors for each rule
    var f_1 = 0.00025; 	// center of mass
    var f_2a = 15; 		// collision avoidance: distance threshold
    var f_2b = 0.001;	// collision avoidance: shift scale factor
    var f_3 = 0.005;	// velocity matching

    var flock_size = 0;
    var pos_sum = new THREE.Vector3();
    var vel_sum = new THREE.Vector3();
	for (var i = 0 ; i < alive.length ; ++i) {
        if (!alive[i]) continue;
        flock_size++;
        pos_sum.add(getElement(i, positions));
        vel_sum.add(getElement(i, velocities));
    }

    // boids rules: http://www.kfish.org/boids/pseudocode.html
    for (var i = 0 ; i < alive.length ; ++i) {
        if (!alive[i]) continue;
        var p = getElement(i, positions).clone();
        var v = getElement(i, velocities).clone();

        // rule 3: velocity matching
        // do first so v isn't yet altered by rules 1 and 2
        var flock_vel = vel_sum.clone().sub(v).divideScalar(flock_size - 1);
        flock_vel.sub(v).multiplyScalar(f_3);
        v.add(flock_vel);

        // rule 2: collision avoidance
    	var shift = new THREE.Vector3();
        for (var j = 0 ; j < alive.length; ++j) {
        	var p_j = getElement(j, positions);
        	if (alive[j] && j != i && p.distanceTo(p_j) < f_2a) {
        		shift.sub((new THREE.Vector3()).subVectors(p_j, p));
        	}
        }
        shift.multiplyScalar(f_2b);
        v.add(shift);

        // rule 1: center of mass
        var flock_pos = pos_sum.clone().sub(p).divideScalar(flock_size - 1);
        flock_pos.sub(p).multiplyScalar(f_1);
        v.add(flock_pos);

        setElement(i, velocities, v);
    }

};

EulerUpdater.prototype.updateColors = function ( particleAttributes, alive, delta_t ) {
    var colors    = particleAttributes.color;

    for ( var i = 0 ; i < alive.length ; ++i ) {

        if ( !alive[i] ) continue;
        // ----------- STUDENT CODE BEGIN ------------
        var c = getElement( i, colors );

        setElement( i, colors, c );
        // ----------- STUDENT CODE END ------------
    }
};

EulerUpdater.prototype.updateSizes= function ( particleAttributes, alive, delta_t ) {
    var sizes    = particleAttributes.size;

    for ( var i = 0 ; i < alive.length ; ++i ) {

        if ( !alive[i] ) continue;
        // ----------- STUDENT CODE BEGIN ------------
        var s = getElement( i, sizes );

        setElement( i, sizes, s );
        // ----------- STUDENT CODE END ------------
    }

};

EulerUpdater.prototype.speedup = function ( particleAttributes, alive, factor ) {
	var velocities = particleAttributes.velocity;
	for (var i = 0 ; i < alive.length ; ++i) {
        if (!alive[i]) continue;
        var v = getElement(i, velocities).clone();
        v.multiplyScalar(factor);
        setElement(i, velocities, v);
    }
};

// EulerUpdater.prototype.updateLifetimes = function ( particleAttributes, alive, delta_t) {
//     var positions     = particleAttributes.position;
//     var lifetimes     = particleAttributes.lifetime;

//     for ( var i = 0 ; i < alive.length ; ++i ) {

//         if ( !alive[i] ) continue;

//         var lifetime = getElement( i, lifetimes );

//         if ( lifetime < 0 ) {
//             killParticle( i, particleAttributes, alive );
//         } else {
//             setElement( i, lifetimes, lifetime - delta_t );
//         }
//     }

// };

EulerUpdater.prototype.collisions = function ( particleAttributes, alive, delta_t ) {
    if ( !this._opts.collidables ) {
        return;
    }
    if ( this._opts.collidables.bouncePlanes ) {
        for (var i = 0 ; i < this._opts.collidables.bouncePlanes.length ; ++i ) {
            var plane = this._opts.collidables.bouncePlanes[i].plane;
            var damping = this._opts.collidables.bouncePlanes[i].damping;
            Collisions.Plane( particleAttributes, alive, delta_t, plane, damping );
        }
    }

    // axis box code
    if ( this._opts.collidables.boundingBoxes ) {
        for (var i = 0; i < this._opts.collidables.boundingBoxes.length ; ++i ) {
            Collisions.boundingBox (particleAttributes, alive, delta_t, this._opts.collidables.boundingBoxes[i]);
        }
    }
};

EulerUpdater.prototype.update = function ( particleAttributes, alive, delta_t ) {

    // this.updateLifetimes( particleAttributes, alive, delta_t );
    this.updateVelocities( particleAttributes, alive, delta_t );
    this.updatePositions( particleAttributes, alive, delta_t );

    this.collisions( particleAttributes, alive, delta_t );

    this.updateColors( particleAttributes, alive, delta_t );
    this.updateSizes( particleAttributes, alive, delta_t );

    // tell webGL these were updated
    particleAttributes.position.needsUpdate = true;
    particleAttributes.color.needsUpdate = true;
    particleAttributes.velocity.needsUpdate = true;
    particleAttributes.lifetime.needsUpdate = true;
    particleAttributes.size.needsUpdate = true;

}