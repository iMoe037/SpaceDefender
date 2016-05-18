var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.image('stars', 'assets/misc/starfield.jpg');
    game.load.spritesheet('ship', 'assets/sprites/humstar.png', 32, 32);
    game.load.spritesheet('invader', 'assets/games/invaders/invader32x32x4.png', 32, 32);
    game.load.image('sweet', 'assets/sprites/spinObj_06.png');
    game.load.spritesheet('kaboom', 'assets/games/invaders/explode.png', 128, 128);
    game.load.image('cursor', 'assets/sprites/enemy-bullet.png');
}

var ship;
var starfield;
var cursors;
var scoreString;
var scoreText;
var score = 0;
var scoreString = '';
var scoreText;
var stateText;
var explosions;
var line;
var mouseBody;
var mouseSpring;
var drawLine = false;
var invaders;

function create() {

    console.log('Space Defender');

    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    //  Enable P2
    game.physics.startSystem(Phaser.Physics.P2JS);

    //  Turn on impact events for the world, without this we get no collision callbacks
    game.physics.p2.setImpactEvents(true);

    game.physics.p2.restitution = 0.8;

    //The score
    scoreString = 'Score : ';
    scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Arial', fill: '#fff' });

    //  Text
    stateText = game.add.text(game.world.centerX, game.world.centerY, ' ', { font: '84px Arial', fill: '#fff' });
    stateText.anchor.setTo(0.5, 0.5);
    stateText.visible = false;

    //Explosionc
    explosions = game.add.group();
    explosions.createMultiple(30, 'kaboom');
    explosions.forEach(setupInvader, this);

    //Add Sling shot
    mouseBody = game.add.sprite(100, 100, 'cursor');
    game.physics.p2.enable(mouseBody, true);
    mouseBody.body.static = true;
    mouseBody.body.setCircle(10);
    mouseBody.body.data.shapes[0].sensor = true;


    game.input.onDown.add(click, this);
    game.input.onUp.add(release, this);
    game.input.addMoveCallback(move, this);

    //  Create our collision groups. One for the player, one for the invaders
    var playerCollisionGroup = game.physics.p2.createCollisionGroup();
    var invaderCollisionGroup = game.physics.p2.createCollisionGroup();

    //  This part is vital if you want the objects with their own collision groups to still collide with the world bounds
    //  (which we do) - what this does is adjust the bounds to use its own collision group.
    game.physics.p2.updateBoundsCollisionGroup();

    // starfield = game.add.tileSprite(0, 0, 800, 600, 'stars');
    // starfield.fixedToCamera = true;

    invaders = game.add.group();
    invaders.enableBody = true;
    invaders.physicsBodyType = Phaser.Physics.P2JS;

    for (var i = 0; i < 30; i++) {
        var invader = invaders.create(game.world.randomX, game.world.randomY, 'invader');
        invader.body.setRectangle(40, 40);
        invader.animations.add('fly', [0, 1, 2, 3], 20, true);
        invader.play('fly');


        //  Tell the invader to use the invaderCollisionGroup 
        invader.body.setCollisionGroup(invaderCollisionGroup);

        //  Invaders will collide against themselves and the player
        //  If you don't set this they'll not collide with anything.
        //  The first parameter is either an array or a single collision group.
        invader.body.collides([invaderCollisionGroup, playerCollisionGroup]);
    }

    //  Create our ship sprite
    ship = game.add.sprite(200, 200, 'ship');
    ship.scale.set(2);
    ship.smoothed = false;
    ship.animations.add('fly', [0, 1, 2, 3, 4, 5], 10, true);
    ship.play('fly');

    game.physics.p2.enable(ship, false);
    ship.body.setCircle(28);
    ship.body.fixedRotation = true;

    //  Set the ships collision group
    ship.body.setCollisionGroup(playerCollisionGroup);

    //  The ship will collide with the invaders, and when it strikes one the hitInvader callback will fire, causing it to alpha out a bit
    //  When invaders collide with each other, nothing happens to them.
    ship.body.collides(invaderCollisionGroup, hitInvader, this);

    line = new Phaser.Line(ship.x, ship.y, mouseBody.x, mouseBody.y);

    game.camera.follow(ship);

    cursors = game.input.keyboard.createCursorKeys();

}

function click(pointer) {
    game.scale.startFullScreen(false);
    var bodies = game.physics.p2.hitTest(pointer.position, [ship.body]);

    if (bodies.length) {
        //  Attach to the first body the mouse hit
        mouseSpring = game.physics.p2.createSpring(mouseBody, bodies[0], 0, 30, 1);
        line.setTo(ship.x, ship.y, mouseBody.x, mouseBody.y);
        drawLine = true;
    }
}

function release() {

    game.physics.p2.removeSpring(mouseSpring);

    drawLine = false;

}

function move(pointer, x, y, isDown) {

    mouseBody.body.x = x;
    mouseBody.body.y = y;
    line.setTo(ship.x, ship.y, mouseBody.x, mouseBody.y);

}

function preRender() {

    if (line) {
        line.setTo(ship.x, ship.y, mouseBody.x, mouseBody.y);
    }

}


function hitInvader(body1, body2) {

    score += 10;
    scoreText.text = scoreString + score;

    //  body1 is the space ship (as it's the body that owns the callback)
    //  body2 is the body it impacted with, in this case our invader
    //  As body2 is a Phaser.Physics.P2.Body object, you access its own (the sprite) via the sprite property:
    body2.sprite.alpha -= 0.5;
    // invaders.remove(body1);

    // var explosion = explosions.getFirstExists(false);
    //explosion.reset(body2.body.x, body2.body.x);
    // explosion.play('kaboom', 30, false, true);

}

function setupInvader(invader) {
    invader.animations.add('kaboom');
}

function update() {

    if (cursors.left.isDown) {
        ship.body.moveLeft(200);
    } else if (cursors.right.isDown) {
        ship.body.moveRight(200);
    }

    if (cursors.up.isDown) {
        ship.body.moveUp(200);
    } else if (cursors.down.isDown) {
        ship.body.moveDown(200);
    }

    if (!game.camera.atLimit.x) {
        starfield.tilePosition.x += (ship.body.velocity.x * 16) * game.time.physicsElapsed;
    }

    if (!game.camera.atLimit.y) {
        starfield.tilePosition.y += (ship.body.velocity.y * 16) * game.time.physicsElapsed;
    }

}

function render() {
    if (drawLine) {
        game.debug.geom(line);
    }

    game.debug.text('Elapsed seconds: ' + Math.floor(this.game.time.totalElapsedSeconds()), 10, 70);
}
