const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    // 1. Load the Tileset
    this.load.spritesheet('desert-tiles', 'https://labs.phaser.io/assets/tilemaps/tiles/tmw_desert_spacing.png', {
        frameWidth: 32, frameHeight: 32, margin: 1, spacing: 1
    });

    // 2. Load the Player Spritesheet (32x48 pixels per frame)
    this.load.spritesheet('player-sprite', 'https://labs.phaser.io/assets/sprites/dude.png', {
        frameWidth: 32, frameHeight: 48
    });

    // 3. Load an NPC sprite (we'll just use a single frame for now)
    this.load.image('npc-sprite', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
}

function create() {
    // --- MAP GENERATION ---
    const levelData = [];
    for (let y = 0; y < 40; y++) {
        let row = [];
        for (let x = 0; x < 50; x++) {
            if (x === 0 || x === 49 || y === 0 || y === 39) row.push(14);
            else if (Math.random() < 0.05) row.push(14); 
            else row.push(0);
        }
        levelData.push(row);
    }
    const map = this.make.tilemap({ data: levelData, tileWidth: 32, tileHeight: 32 });
    const tileset = map.addTilesetImage('desert-tiles');
    const layer = map.createLayer(0, tileset, 0, 0);
    layer.setCollision(14);

    // --- ANIMATIONS ---
    // We define how the "dude" walks by picking frames from the spritesheet
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player-sprite', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [ { key: 'player-sprite', frame: 4 } ],
        frameRate: 20
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player-sprite', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // --- CHARACTER CREATION ---
    // Create the Player Sprite
    this.player = this.physics.add.sprite(100, 100, 'player-sprite');
    this.player.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, layer);

    // Create the NPC Sprite
    this.npc = this.physics.add.sprite(300, 300, 'npc-sprite');
    this.npc.setImmovable(true); // NPC doesn't move when bumped
    this.physics.add.collider(this.player, this.npc);

    // --- UI & CAMERA ---
    this.dialogBox = this.add.rectangle(400, 500, 600, 100, 0xffffff).setScrollFactor(0).setStrokeStyle(4, 0x000000).setVisible(false);
    this.dialogText = this.add.text(120, 470, '', { font: '20px Arial', fill: '#000000' }).setScrollFactor(0).setVisible(false);
    this.isDialogShowing = false;

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); 
}

function update() {
    if (this.isDialogShowing) {
        this.player.body.setVelocity(0);
        this.player.anims.play('turn'); // Stand still while talking
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.dialogBox.setVisible(false);
            this.dialogText.setVisible(false);
            this.isDialogShowing = false;
        }
        return;
    }

    // --- MOVEMENT & ANIMATION LOGIC ---
    this.player.body.setVelocity(0);

    if (this.cursors.left.isDown) {
        this.player.body.setVelocityX(-200);
        this.player.anims.play('left', true);
    } else if (this.cursors.right.isDown) {
        this.player.body.setVelocityX(200);
        this.player.anims.play('right', true);
    } else if (this.cursors.up.isDown) {
        this.player.body.setVelocityY(-200);
        // Note: This specific sprite only has left/right anims, so we use 'turn' for vertical
        this.player.anims.play('turn'); 
    } else if (this.cursors.down.isDown) {
        this.player.body.setVelocityY(200);
        this.player.anims.play('turn');
    } else {
        this.player.anims.play('turn'); // Idle animation
    }

    // --- INTERACTION LOGIC ---
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
        if (distance < 60) {
            this.dialogText.setText("It's dangerous to go alone! Take... \nwell, I don't have anything. I'm just a sprite.");
            this.dialogBox.setVisible(true);
            this.dialogText.setVisible(true);
            this.isDialogShowing = true;
        }
    }
}