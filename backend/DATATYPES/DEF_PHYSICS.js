let Physics = class {
    // On physics tick
    static OnTick (players, gameMap) {
        // Loop through all players
        for (const [id, player] of Object.entries(players)) {
            // Calculate next position
            let newPosX = player.physics.x + player.physics.vx;
            let newPosY = player.physics.y + player.physics.vy;
            
            //Test for x coordinate collisions
            if (gameMap.getCurrentTile(newPosX, player.physics.y) !== "#") {
                // On no collision, update player position
                player.physics.x = newPosX;
            }else{
                // On collision, bounce x velocity with energy lost
                player.physics.vx *= -0.9;
                
                // Set player rotation velocity based on current y velocity
                player.physics.vr = player.physics.vy * (player.physics.vx > 0 ? 1 : -1) * 0.015;
            }

            //Test for y coordinate collision
            if (gameMap.getCurrentTile(player.physics.x, newPosY) !== "#") {
                 // On no collision, update player position
                player.physics.y = newPosY;
            }else{
                // On collision, bounce y velocity with energy lost
                player.physics.vy *= -0.9;

                // Set player rotation velocity based on current x velocity and whether a floor or ceiling was hit
                if(Math.abs(player.physics.vx) > 0.7){
                    player.physics.vr = player.physics.vx * (player.physics.vy > 0 ? -0.5 : 1) * 0.02;
                }else{
                    player.physics.vr = player.physics.vx * (player.physics.vy > 0 ? 1 : -1) * 0.005;
                }
                
                // If player rotation velocity is lower than threthhold, update player rotation to slowly align to surface
                if(Math.abs(player.physics.vr) < 0.2){
                    if(player.physics.r < Math.PI/2){
                        player.physics.r *= 0.6;
                    }else if(player.physics.r > Math.PI * 3/2){
                        player.physics.r = 2 * Math.PI + (player.physics.r - 2 * Math.PI) * 0.6;
                    }else{
                        player.physics.r = Math.PI + (player.physics.r - Math.PI) * 0.6;
                    }
                }
            }

            // Apply forces
            this.ApplyForces();

            // Update player rotation
            player.physics.r += player.physics.vr;

            // Bound player rotation between 0 and 2 * PI
            player.physics.r = ((Math.PI * 4) + player.physics.r) % (Math.PI * 2);
            
            // Calculate and set player action (fish bend)
            this.setAction();
        }
    }

    // Apply forces
    static ApplyForces(){
        // Add gravity
        player.physics.vy += 0.06;

        // Add air resistance
        player.physics.vy *= 0.998;
        player.physics.vx *= 0.997;
        player.physics.vr *= 0.995;
    }

    // Calculate and set player action (fishbend)
    static setAction(){
        // Calculate angle of velocity
        let vAngle = ((Math.PI * 2) + Math.atan2(player.physics.vy, player.physics.vx)) % (Math.PI * 2);

        if(player.physics.vy**2 + player.physics.vx**2 < 1){
            // If absolute player velocity is less than 1, flatfish
            player.physics.action = 0;
        }else if(Math.abs(((Math.PI * 4) + player.physics.r + Math.PI/2) % (Math.PI * 2) - vAngle) < Math.PI/2){
            // If velocity angle pointed up down the fish, bend ends up
            player.physics.action = 2;
        }else{
            // If velocity angle pointed down on the fish, bend ends down
            player.physics.action = 1;
        }
    }

    // On player input
    static OnInput (player){
        // Break cursor into x,y components
        let dx = Math.sin(player.input.cursorR);
        let dy = Math.cos(player.input.cursorR);

        // If player can hit a tile
        if(gameMap.getTileCluster(player.physics.x + dx * 60, player.physics.y + dy * 60)){
            // Set hit power
            let power = 7;

            // Calculate what factor of new movement to conserved momentum to use on both the x and y axis
            let xFactor = Math.min(Math.max(Math.abs((-power*dx)/player.physics.vx), 0.01), 0.99);
            let yFactor = Math.min(Math.max(Math.abs((-power*dy)/player.physics.vy), 0.01), 0.99);     
    
            // Apply new player velocities
            player.physics.vx = (-power*dx) * xFactor + player.physics.vx * (1 - xFactor);
            player.physics.vy = (-power*dy) * yFactor + player.physics.vy * (1 - yFactor);
            player.physics.vr = 0.2 * (player.physics.vx > 0 ? 1 : -1);

            // Update player rotation to point of contact
            player.physics.r = (player.input.cursorR + Math.PI) % (Math.PI * 2);

            // Add slap effect
            effects.push([
                player.physics.x + dx * 15,
                player.physics.y + dy * 15
            ]);
        }
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined'){
    module.exports = Physics
}
