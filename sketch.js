/* global p5, createCanvas, background, constrain, abs, keyIsDown, UP_ARROW, LEFT_ARROW, RIGHT_ARROW, min, max, random, noise, cos, sin, TWO_PI, beginShape, endShape, CLOSE, vertex, push, pop, fill, noStroke, drawingContext, stroke, strokeWeight, line, rect, height, width, loadImage, image, imageMode, CENTER, CORNER */

/* STREAMING_CHUNK:Declaring global variables and preloading assets... */
// Physics constants configured exactly to your specifications
const GRAVITY = 0.6; // Downward pull per frame

// The player state object containing exact tuned parameters
let player = {
  x: 150,
  y: 0,
  vx: 0,
  vy: 0,
  r: 24,              // Player collision radius
  speed: 0.7,         // High acceleration for responsive handling
  maxSpeed: 7,        // Max Speed set exactly to 7
  jumpForce: -14.5,   // Jump Force set exactly to -14.5
  friction: 0.8,      // Passive deceleration factor
  onGround: false     // State tracker for jumping limits
};

// Static & Dynamic platforms
let platforms = [
  { x: 80,  y: 300, w: 220, h: 16, color: [45, 160, 150] }, // Left platform (Fixed)
  { x: 500, y: 190, w: 220, h: 16, color: [52, 211, 153] }  // Right platform (Dynamic shifting)
];

const initialRightY = 190; // Default reference point for the right platform
let floorY;                // Dynamic floor limit calculated in setup

// Image asset variables
let backgroundImg;
let characterImg;

// Preload assets before initialization
function preload() {
  // These files must reside in your VS Code workspace directory
  backgroundImg = loadImage('assets/images/celestebackground.jpeg');
  characterImg = loadImage('assets/images/celestestrawberry.png');
}

/* STREAMING_CHUNK:Setting up the canvas... */
function setup() {
  createCanvas(800, 450);
  floorY = height - 40;         // Set floor position 40px from bottom of canvas
  player.y = floorY - player.r; // Spawn player standing on the floor
}

/* STREAMING_CHUNK:Running the main draw loop... */
function draw() {
  // Core fix: Explicitly enforce CORNER mode so the background renders perfectly at (0, 0)
  imageMode(CORNER);
  image(backgroundImg, 0, 0, width, height);

  // Update physical calculations
  handleInput();
  applyPhysics();

  // Draw scene objects
  drawFloor();
  drawPlatforms();
  drawPlayer();
}

/* STREAMING_CHUNK:Handling keyboard input... */
function handleInput() {
  // Move Left using Left Arrow or A
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    player.vx -= player.speed;
  }
  // Move Right using Right Arrow or D
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    player.vx += player.speed;
  }

  // Cap horizontal speed limits to your specified speed (7)
  player.vx = constrain(player.vx, -player.maxSpeed, player.maxSpeed);

  // Apply passive deceleration friction when no movement keys are held
  if (!keyIsDown(LEFT_ARROW) && !keyIsDown(65) && !keyIsDown(RIGHT_ARROW) && !keyIsDown(68)) {
    player.vx *= player.friction;
    if (abs(player.vx) < 0.1) player.vx = 0;
  }

  // Jump triggered by Up Arrow, W, or Spacebar (Only if standing on a firm surface)
  if ((keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(32)) && player.onGround) {
    player.vy = player.jumpForce;
    player.onGround = false;
  }
}

/* STREAMING_CHUNK:Applying physics and collision detection... */
function applyPhysics() {
  let prevY = player.y;
  let wasOnGround = player.onGround;

  // Add gravity to fall speed
  player.vy += GRAVITY;

  // Shift position coordinates by velocity
  player.x += player.vx;
  player.y += player.vy;

  // Floor collision detection
  if (player.y + player.r >= floorY) {
    player.y = floorY - player.r;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // One-way solid platform check (Player can pass upwards through them, but lands on top of them)
  for (let i = 0; i < platforms.length; i++) {
    let plat = platforms[i];
    
    // Check if player is horizontally overlapping the platform
    if (player.x + player.r - 8 > plat.x && player.x - player.r + 8 < plat.x + plat.w) {
      // Land only when moving downward
      if (player.vy >= 0) {
        let feetPrevY = prevY + player.r;
        let feetCurrY = player.y + player.r;
        
        // Match player feet positions to detect crossing the threshold
        if (feetPrevY <= plat.y + 4 && feetCurrY >= plat.y) {
          player.y = plat.y - player.r; // Securely land without sinking
          player.vy = 0;
          player.onGround = true;

          // When landing on the right platform, trigger its layout mutation
          if (i === 1 && !wasOnGround) {
            triggerRandomShift();
          }
        }
      }
    }
  }

  // Keep player within the side walls of the canvas window
  player.x = constrain(player.x, player.r, width - player.r);
}

/* STREAMING_CHUNK:Triggering platform shifting... */
function triggerRandomShift() {
  let leftY = platforms[0].y; // Referencing left platform Y (300)

  // Establish boundaries: between right platform original height (190) and left platform height (300)
  let minY = min(initialRightY, leftY);
  let maxY = max(initialRightY, leftY);

  // Pull a random whole value within this vertical range
  let randomY = Math.round(random(minY, maxY));

  // Shift the platform to the new coordinate
  platforms[1].y = randomY;
  
  // Snap player to the updated platform surface so they don't fall off during the shift
  player.y = randomY - player.r;
}

/* STREAMING_CHUNK:Rendering the player and background images... */
function drawPlayer() {
  push();
  
  // Center the image draw mode for accurate physics positioning
  imageMode(CENTER);
  translate(player.x, player.y);
  
  // Apply a simple visual flip depending on horizontal velocity direction
  if (player.vx < -0.1) {
    scale(-1, 1); // Flip horizontally when moving left
  }
  
  // Draw your preloaded character sprite at player's position
  image(characterImg, 0, 0, player.r * 2.5, player.r * 2.5);
  
  pop();
}

/* STREAMING_CHUNK:Rendering the static and dynamic platforms... */
function drawFloor() {
  push();
  fill(31, 41, 55); // Dark gray base
  noStroke();
  rect(0, floorY, width, height - floorY);

  // Cyan bright surface edge
  stroke(45, 212, 191);
  strokeWeight(3);
  line(0, floorY, width, floorY);
  pop();
}

function drawPlatforms() {
  for (let plat of platforms) {
    push();
    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = `rgba(${plat.color[0]}, ${plat.color[1]}, ${plat.color[2]}, 0.3)`;

    fill(17, 24, 39); // Deep dark gray filling
    stroke(plat.color[0], plat.color[1], plat.color[2]); // Dynamic platform border color
    strokeWeight(2.5);
    rect(plat.x, plat.y, plat.w, plat.h, 6); // Beautiful rounded corners on platforms
    pop();
  }
}