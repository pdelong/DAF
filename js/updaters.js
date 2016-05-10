
var speedingUp = 0;

////////////////////////////////////////////////////////////////////////////////
// Boundaries
////////////////////////////////////////////////////////////////////////////////

var Boundaries = Boundaries || {};

Boundaries.boundingBox = function ( particleAttributes, alive, delta_t, boundingBox ) {
    var positions    = particleAttributes.position;
    var velocities   = particleAttributes.velocity;

    for ( var i = 0 ; i < alive.length ; ++i ) {

        if ( !alive[i] ) continue;
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

        // attractor box code
        if (new_pos.x < min_x || new_pos.x > max_x || new_pos.y < min_y ||
                new_pos.y > max_y || new_pos.z < min_z || new_pos.z > max_z) {
            vel.add(center.sub(new_pos).multiplyScalar(0.002));
        }

        setElement( i, positions, pos );
        setElement( i, velocities, vel );
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
    var predator = this._opts.externalForces.predator;

    for ( var i  = 0 ; i < alive.length ; ++i ) {
        if ( !alive[i] ) continue;
        var p = getElement( i, positions );
        var v = getElement( i, velocities );
        p.add( v.clone().multiplyScalar( delta_t ) );
        setElement( i, positions, p );
    }

    if (Key_l || Key_j || Key_i || Key_k || Key_u || Key_o) {
        predator.p.add(predator.v.clone().multiplyScalar( delta_t ));
        ParticleEngine.redraw(predator.p, predator.v, 0);
    } else if (Gui.values.systems == Gui.particleSystems[1] || 
               Gui.values.systems == Gui.particleSystems[2]) {
        predator.p.add(predator.v.clone().multiplyScalar( delta_t ));
        ParticleEngine.redraw(predator.p, predator.v, 0);        
    } else if (Gui.values.systems == Gui.particleSystems[3]) {
        Scene.removeObject( old_objects[0] );
    }
};

var counter = 0;
EulerUpdater.prototype.updateVelocities = function ( particleAttributes, alive, delta_t ) {
    var positions = particleAttributes.position;
    var velocities = particleAttributes.velocity;
    var predator = this._opts.externalForces.predator;
    var foods = this._opts.externalForces.foods;
    
    var flock = flockInfo( particleAttributes, alive );
    var pos_sum = flock.p.multiplyScalar(flock.size);
    var vel_sum = flock.v.multiplyScalar(flock.size);

    // scale factors for each rule
    var f_1 = 0.0003 * Gui.factors[0]; 	// center of mass
    var f_2a = 15 * Gui.factors[1]; 		// collision avoidance: distance threshold
    var f_2b = 0.0015 * Gui.factors[1];		// collision avoidance: shift scale factor
    var f_3 = 0.01 * Gui.factors[2];		// velocity matching

    // boids rules: http://www.kfish.org/boids/pseudocode.html
    for (var i = 0 ; i < alive.length ; ++i) {
        if (!alive[i]) continue;
        var p = getElement(i, positions).clone();
        var v = getElement(i, velocities).clone();

        // rule 3: velocity matching
        // do first so v isn't yet altered by rules 1 and 2
        var flock_vel = vel_sum.clone().sub(v).divideScalar(flock.size - 1);
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
        var flock_pos = pos_sum.clone().sub(p).divideScalar(flock.size - 1);
        flock_pos.sub(p).multiplyScalar(f_1);
        v.add(flock_pos);

        // predator avoidance
        var dist_to_predator = p.distanceTo(predator.p);
        var acc = p.clone().sub(predator.p).divideScalar(dist_to_predator);
        acc.multiplyScalar(20);
        if (dist_to_predator < 50 && old_objects.length != 0 &&
                Gui.values.systems != Gui.particleSystems[3]) {
            v.add(acc.multiplyScalar(delta_t));
        }

        // speed 'clamping'
        if (v.length() > 100)
            v.sub(v.clone().multiplyScalar(.1*delta_t));
        if (v.length() < 20)
            v.add(v.clone().multiplyScalar(.1*delta_t*(10-v.length())));

        // food attraction
        var toRemove = [];
        for (var f = 0; f < foods.length; f++) {
            var dist_to_food = p.distanceTo(foods[f].position);
            if (dist_to_food < foods[f].r + 2) {
                Scene.removeObject(foods[f]);
                foods.splice(f, 1);
                f--;
            }
            else {
                var acc = foods[f].position.clone().sub(p);
                if (dist_to_food >= 1.0)
                    acc.divideScalar(dist_to_food);
                acc.multiplyScalar(foods[f].magnitude);
                v.add(acc.multiplyScalar(delta_t));
            }
        }
        // remove foods

        setElement(i, velocities, v);
    }
};

EulerUpdater.prototype.updatePredatorVelocity = function ( particleAttributes, alive, delta_t ) {
    
    var pe = ParticleEngine;
    var predator = this._opts.externalForces.predator;
    var bb = this._opts.collidables.boundingBoxes[0];

    if (Gui.values.systems == Gui.particleSystems[0]) {            
        var delta = 25;
        predator.v = new THREE.Vector3(0, 0, 0);

        if (Key_l) predator.v.x += delta;
        if (Key_j) predator.v.x -= delta;
        if (Key_i) predator.v.y += delta;
        if (Key_k) predator.v.y -= delta;
        if (Key_u) predator.v.z += delta;
        if (Key_o) predator.v.z -= delta;

    } else if (Gui.values.systems == Gui.particleSystems[1]) {

        // do something better here ?
        if (predator.v.length() == 0) {
            predator.v = new THREE.Vector3(25, 0, 0);
            return;
        }
        
        var delta = Math.PI / 20;
        var y_axis = new THREE.Vector3(0, 1, 0);
        normal = new THREE.Vector3(predator.v.z, 0, -predator.v.x).normalize();

        // i and k incline the particle, prevent fully vertical flight
        var new_v = predator.v.clone();
        if (Key_i) new_v.applyAxisAngle( normal, -delta / 2 );
        if (Key_k) new_v.applyAxisAngle( normal,  delta / 2 );
        if (new_v.y < 20 && new_v.y > -20) predator.v = new_v;

        // l and j rotate in the horizontal (x-z) plane
        if (Key_l) predator.v.applyAxisAngle( y_axis, -delta );
        if (Key_j) predator.v.applyAxisAngle( y_axis,  delta );

        predator.v.setLength(25);

    } else if (Gui.values.systems == Gui.particleSystems[2]) {
        
        if (predator.v.length() == 0) {
            var z = 2 * Math.random() - 1;
            var phi = 2*Math.PI*Math.random();
            d = Math.sqrt(1 - z*z);
            predator.v = new THREE.Vector3(d * Math.cos(phi),
                                           d * Math.sin(phi),
                                           z);
            predator.v.setLength(25);
            return;
        }

        var z = 2 * Math.random() - 1;
        var phi = 2*Math.PI*Math.random();
        d = Math.sqrt(1 - z*z);
        var acc = new THREE.Vector3(d * Math.cos(phi),
                                    d * Math.sin(phi),
                                    z);
        predator.v.add(acc.normalize());

        // vaguely seek the flock center
        var flock = flockInfo( particleAttributes, alive );
        var f_dist = flock.p.clone().sub(predator.p).setLength(1);
        predator.v.add(f_dist);

        predator.v.setLength(25);
    }
};

EulerUpdater.prototype.updateColors = function ( particleAttributes, alive, delta_t ) {
    var colors     = particleAttributes.color;
    var positions = particleAttributes.position;
    var velocities = particleAttributes.velocity;
    var predator = this._opts.externalForces.predator;

    var flock_size = 0;
    var vel_sum = new THREE.Vector3();
    for (var i = 0 ; i < alive.length ; ++i) {
        if (!alive[i]) continue;
        flock_size++;
        vel_sum.add(getElement(i, velocities));
    }
    var flock_vel = vel_sum.multiplyScalar(1 / flock_size).normalize();

    for ( var i = 0 ; i < alive.length ; ++i ) {
        if ( !alive[i] ) continue;
        var p = getElement(i, positions).clone();
        var v = getElement( i, velocities ).clone().normalize();
        var p = getElement( i, positions );
        var dot = 0.5 - 0.5 * v.dot(flock_vel);

        var dist_to_predator = p.distanceTo(predator.p);
        var blue = 0; 
        if (dist_to_predator < 50 && old_objects.length != 0) {
            blue = (50 - dist_to_predator) / 10;
        }
        c = new THREE.Vector4(Math.min(1, dot + speedingUp), dot, 
                              Math.min(1, dot + blue), 1);

        // if (p.distanceTo(predator.p) < 50 && old_objects.length != 0)
            // c = new THREE.Vector4(0.0, 0.0, 1.0, 1.0);

        setElement( i, colors, c );
    }
    
    if (speedingUp > 0)
        speedingUp -= 0.01;
    else
        speedingUp = 0;
};

EulerUpdater.prototype.updateSizes = function ( particleAttributes, alive, delta_t ) {
    var sizes     = particleAttributes.size;
    var base_size = SystemSettings.flocking.initializerSettings.size;
    var positions = particleAttributes.position;
    var flock = flockInfo( particleAttributes, alive );

    for ( var i = 0 ; i < alive.length ; ++i ) {
        if ( !alive[i] ) continue;
        var s = base_size;
        var p = getElement(i, positions);
        var dist = flock.p.clone().sub(p).length(); 
        if (dist < 50) {
            s += 2 * s * ((50 - dist) / 50);
        }

        setElement( i, sizes, s );
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

EulerUpdater.prototype.boundaries = function ( particleAttributes, alive, delta_t ) {
    if ( !this._opts.collidables ) {
        return;
    }

    if ( this._opts.collidables.boundingBoxes ) {
        for (var i = 0; i < this._opts.collidables.boundingBoxes.length ; ++i ) {
            Boundaries.boundingBox (particleAttributes, alive, delta_t, this._opts.collidables.boundingBoxes[i]);
        }
    }
};

EulerUpdater.prototype.update = function ( particleAttributes, alive, delta_t ) {

    // this.updateLifetimes( particleAttributes, alive, delta_t );
    this.updateVelocities( particleAttributes, alive, delta_t );
    this.updatePredatorVelocity( particleAttributes, alive, delta_t );
    this.updatePositions( particleAttributes, alive, delta_t );

    this.boundaries( particleAttributes, alive, delta_t );

    this.updateColors( particleAttributes, alive, delta_t );
    this.updateSizes( particleAttributes, alive, delta_t );

    
    // tell webGL these were updated
    particleAttributes.position.needsUpdate = true;
    particleAttributes.color.needsUpdate = true;
    particleAttributes.velocity.needsUpdate = true;
    particleAttributes.lifetime.needsUpdate = true;
    particleAttributes.size.needsUpdate = true;

};

var flockInfo = function ( particleAttributes, alive ) {
    var positions  = particleAttributes.position;
    var velocities = particleAttributes.velocity;

    var flock_size = 0;
    var pos_sum = new THREE.Vector3();
    var vel_sum = new THREE.Vector3();
    for (var i = 0 ; i < alive.length ; ++i) {
        if (!alive[i]) continue;
        flock_size++;
        pos_sum.add(getElement(i, positions));
        vel_sum.add(getElement(i, velocities));
    }

    return { p: pos_sum.multiplyScalar(1 / flock_size), 
             v: vel_sum.multiplyScalar(1 / flock_size),
             size: flock_size };
};
