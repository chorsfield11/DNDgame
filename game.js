// ==========================================
// SCENE 1: THE OVERWORLD (Leveling, Tracking, & AI Innkeeper)
// ==========================================
const WorldScene = {
    key: 'WorldScene',
    
    init: function() {
        if (this.registry.get('playerHP') === undefined) {
            this.registry.set('playerHP', 20);
            this.registry.set('playerMaxHP', 20);
            this.registry.set('inventory', ['Health Potion', 'Health Potion']);
            this.registry.set('playerGold', 0);
            
            // RPG PROGRESSION STATS
            this.registry.set('playerLevel', 1);
            this.registry.set('playerXP', 0);
            this.registry.set('playerAttackBonus', 4); 
        }
    },

    preload: function() {
        this.load.spritesheet('desert-tiles', 'https://labs.phaser.io/assets/tilemaps/tiles/tmw_desert_spacing.png', { frameWidth: 32, frameHeight: 32, margin: 1, spacing: 1 });
        this.load.spritesheet('player-sprite', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
        this.load.image('npc-sprite', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
    },

    create: function() {
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

        this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('player-sprite', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'turn', frames: [ { key: 'player-sprite', frame: 4 } ], frameRate: 20 });
        this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('player-sprite', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });

        this.player = this.physics.add.sprite(100, 100, 'player-sprite');
        this.player.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, layer);

        this.npc = this.physics.add.sprite(300, 300, 'npc-sprite');
        this.npc.setImmovable(true);
        this.physics.add.collider(this.player, this.npc);

        this.dialogBox = this.add.rectangle(400, 500, 600, 100, 0xffffff).setScrollFactor(0).setStrokeStyle(4, 0x000000).setVisible(false);
        this.dialogText = this.add.text(120, 470, '', { font: '20px Arial', fill: '#000000' }).setScrollFactor(0).setVisible(false);
        this.isDialogShowing = false;

        this.worldHealthText = this.add.text(20, 20, '', { font: '24px Arial', fill: '#00ff00', fontStyle: 'bold' }).setScrollFactor(0).setStroke('#000000', 4);
        this.worldPotionText = this.add.text(20, 50, '', { font: '20px Arial', fill: '#ffff00', fontStyle: 'bold' }).setScrollFactor(0).setStroke('#000000', 4);
        this.worldGoldText = this.add.text(20, 80, '', { font: '20px Arial', fill: '#ffaa00', fontStyle: 'bold' }).setScrollFactor(0).setStroke('#000000', 4);
        this.worldLevelText = this.add.text(20, 110, '', { font: '20px Arial', fill: '#00ccff', fontStyle: 'bold' }).setScrollFactor(0).setStroke('#000000', 4);

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); 
        this.yKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y); 
    },

    update: function() {
        this.worldHealthText.setText(`HP: ${this.registry.get('playerHP')}/${this.registry.get('playerMaxHP')}`);
        this.worldGoldText.setText(`Gold: ${this.registry.get('playerGold')}`);
        
        const inv = this.registry.get('inventory');
        const potionCount = inv.filter(item => item === 'Health Potion').length;
        this.worldPotionText.setText(`Potions: ${potionCount}`);

        let currentLvl = this.registry.get('playerLevel');
        let currentXP = this.registry.get('playerXP');
        this.worldLevelText.setText(`Lvl: ${currentLvl} | XP: ${currentXP}/${currentLvl * 100}`);

        if (this.isDialogShowing) {
            this.player.body.setVelocity(0);
            this.player.anims.play('turn');
            
            if (Phaser.Input.Keyboard.JustDown(this.yKey)) {
                let currentGold = this.registry.get('playerGold');
                let maxHP = this.registry.get('playerMaxHP');
                let currentHP = this.registry.get('playerHP');
                
                if (currentHP === maxHP) {
                    this.dialogText.setText("You are already at full health!\n[Press SPACE to leave]");
                } else if (currentGold >= 10) {
                    this.registry.set('playerGold', currentGold - 10);
                    this.registry.set('playerHP', maxHP);
                    this.dialogText.setText("You rested well! HP fully restored.\n[Press SPACE to leave]");
                    this.cameras.main.flash(300, 0, 255, 0);
                } else {
                    this.dialogText.setText("You don't have enough Gold! You need 10.\n[Press SPACE to leave]");
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialogBox.setVisible(false);
                this.dialogText.setVisible(false);
                this.time.delayedCall(100, () => { this.isDialogShowing = false; });
            }
            return;
        }

        this.player.body.setVelocity(0);
        let isMoving = false; 

        if (this.cursors.left.isDown) { this.player.body.setVelocityX(-200); this.player.anims.play('left', true); isMoving = true; } 
        else if (this.cursors.right.isDown) { this.player.body.setVelocityX(200); this.player.anims.play('right', true); isMoving = true; } 
        else if (this.cursors.up.isDown) { this.player.body.setVelocityY(-200); this.player.anims.play('turn'); isMoving = true; } 
        else if (this.cursors.down.isDown) { this.player.body.setVelocityY(200); this.player.anims.play('turn'); isMoving = true; } 
        else { this.player.anims.play('turn'); }

        if (isMoving && Math.random() < 0.005) {
            this.player.body.setVelocity(0); 
            this.cameras.main.flash(500, 255, 255, 255); 
            this.time.delayedCall(500, () => {
                this.scene.switch('BattleScene'); 
            });
        }

        // ==========================================
        // --- NEW: THE AI INNKEEPER LOGIC ---
        // ==========================================
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isDialogShowing) {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
            if (distance < 60) {
                // 1. Show the box so they know the AI is thinking
                this.dialogText.setText("Innkeeper is looking you up and down...");
                this.dialogBox.setVisible(true);
                this.dialogText.setVisible(true);
                this.isDialogShowing = true;

                // 2. Ask the backend for a custom line!
                fetch('/.netlify/functions/chat', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        hp: this.registry.get('playerHP'),
                        maxHp: this.registry.get('playerMaxHP'),
                        gold: this.registry.get('playerGold')
                    })
                })
                .then(res => res.json())
                .then(data => {
                    // Update the text box with Gemini's response!
                    this.dialogText.setText(data.reply + "\n\n[Press 'Y' to Rest (10g), 'SPACE' to Leave]");
                })
                .catch(err => {
                    // Fallback just in case the AI server takes too long
                    this.dialogText.setText("Welcome to the Desert Inn! Rest for 10 Gold?\n\n[Press 'Y' to Buy, 'SPACE' to Leave]");
                });
            }
        }
    }
};

// ==========================================
// SCENE 2: THE BATTLE SCREEN (Bestiary & Levels)
// ==========================================
const BattleScene = {
    key: 'BattleScene',

    create: function() {
        const rollDice = (sides) => {
            return Math.floor(Math.random() * sides) + 1;
        };

        let playerHP;
        let playerMaxHP;
        let playerAttackBonus;
        let inventory; 
        
        const enemyTypes = [
            { name: 'Goblin', maxHP: 15, ac: 12, atkMod: 2, dmgDie: 4, xp: 40, goldBonus: 0, color: 0xff0000 }, 
            { name: 'Orc', maxHP: 25, ac: 14, atkMod: 4, dmgDie: 6, xp: 90, goldBonus: 10, color: 0x00aa00 },   
            { name: 'Skeleton', maxHP: 10, ac: 11, atkMod: 3, dmgDie: 6, xp: 30, goldBonus: -5, color: 0xdddddd } 
        ];
        
        let currentEnemy;
        let enemyHP;
        let isPlayerTurn = true; 

        this.add.rectangle(400, 300, 800, 600, 0x1a2b3c); 
        this.playerSprite = this.add.sprite(200, 250, 'player-sprite', 4).setScale(2); 
        this.enemySprite = this.add.sprite(600, 250, 'npc-sprite').setScale(2); 

        const playerHealthText = this.add.text(130, 150, '', { font: '20px Arial', fill: '#00ff00', fontStyle: 'bold' });
        const enemyHealthText = this.add.text(530, 150, '', { font: '20px Arial', fill: '#ff0000', fontStyle: 'bold' });

        this.add.rectangle(400, 500, 760, 160, 0x000000).setStrokeStyle(4, 0xffffff);
        const combatLog = this.add.text(300, 440, '', { font: '20px Arial', fill: '#ffffff' });

        const attackBtn = this.add.text(60, 440, '⚔️ ATTACK', { font: '24px Arial', fill: '#ffffff' }).setInteractive();
        const itemBtn = this.add.text(60, 490, '🎒 ITEM', { font: '24px Arial', fill: '#ffffff' }).setInteractive();
        const runBtn = this.add.text(60, 540, '🏃 RUN', { font: '24px Arial', fill: '#ffffff' }).setInteractive();

        const buttons = [attackBtn, itemBtn, runBtn];
        buttons.forEach(btn => {
            btn.on('pointerover', () => btn.setStyle({ fill: '#ffff00' })); 
            btn.on('pointerout', () => btn.setStyle({ fill: '#ffffff' })); 
        });

        const spawnEnemy = () => {
            playerHP = this.registry.get('playerHP');
            playerMaxHP = this.registry.get('playerMaxHP');
            playerAttackBonus = this.registry.get('playerAttackBonus');
            inventory = this.registry.get('inventory');
            
            currentEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            enemyHP = currentEnemy.maxHP;
            isPlayerTurn = true;

            this.enemySprite.setVisible(true);
            this.enemySprite.setTint(currentEnemy.color);
            this.playerSprite.clearTint();

            combatLog.setText(`A Wild ${currentEnemy.name} blocks your path!`);
            playerHealthText.setText(`Player HP: ${playerHP}/${playerMaxHP}`);
            enemyHealthText.setText(`${currentEnemy.name} HP: ${enemyHP}/${currentEnemy.maxHP}`);
        };

        const enemyTurn = () => {
            combatLog.setText(`The ${currentEnemy.name} attacks!`);
            const enemyRoll = rollDice(20) + currentEnemy.atkMod; 
            
            this.time.delayedCall(1000, () => {
                if (enemyRoll >= 14) { 
                    const damage = rollDice(currentEnemy.dmgDie) + 1;
                    playerHP -= damage;
                    this.registry.set('playerHP', playerHP); 

                    combatLog.setText(`${currentEnemy.name} hits! (Roll: ${enemyRoll}). You take ${damage} damage!`);
                    playerHealthText.setText(`Player HP: ${playerHP}/${playerMaxHP}`);
                    
                    this.playerSprite.setTint(0xff0000);
                    this.time.delayedCall(100, () => this.playerSprite.clearTint());
                } else {
                    combatLog.setText(`${currentEnemy.name} misses! (Roll: ${enemyRoll}). You dodge!`);
                }

                if (playerHP <= 0) {
                    this.time.delayedCall(1500, () => {
                        combatLog.setText('YOU DIED. Game Over.');
                        this.playerSprite.setTint(0x555555); 
                    });
                } else {
                    this.time.delayedCall(1500, () => {
                        combatLog.setText('It is your turn. Choose an action.');
                        isPlayerTurn = true; 
                    });
                }
            });
        };

        attackBtn.on('pointerdown', () => {
            if (!isPlayerTurn) return; 
            isPlayerTurn = false; 
            
            const attackRoll = rollDice(20) + playerAttackBonus; 
            
            if (attackRoll >= currentEnemy.ac) {
                const damage = rollDice(6) + 2; 
                enemyHP -= damage;
                combatLog.setText(`Hit! You deal ${damage} damage!`);
                enemyHealthText.setText(`${currentEnemy.name} HP: ${enemyHP}/${currentEnemy.maxHP}`);
                this.enemySprite.setTint(0xffffff); 
                this.time.delayedCall(100, () => this.enemySprite.setTint(currentEnemy.color)); 
            } else {
                combatLog.setText(`Miss! Your attack went wide.`);
            }

            if (enemyHP <= 0) {
                this.time.delayedCall(1500, () => {
                    this.enemySprite.setVisible(false); 
                    
                    let pLevel = this.registry.get('playerLevel');
                    let pXP = this.registry.get('playerXP') + currentEnemy.xp;
                    let nextLevelXP = pLevel * 100; 
                    
                    let victoryText = `VICTORY! Gained ${currentEnemy.xp} XP.`;

                    if (pXP >= nextLevelXP) {
                        pLevel++;
                        pXP -= nextLevelXP; 
                        
                        let newMaxHP = playerMaxHP + 5;
                        this.registry.set('playerLevel', pLevel);
                        this.registry.set('playerMaxHP', newMaxHP);
                        this.registry.set('playerHP', newMaxHP); 
                        this.registry.set('playerAttackBonus', playerAttackBonus + 1); 
                        
                        victoryText += `\nLEVEL UP! You are now Level ${pLevel}!`;
                    }
                    this.registry.set('playerXP', pXP);

                    const goldFound = Math.max(0, rollDice(10) + currentEnemy.goldBonus); 
                    let currentGold = this.registry.get('playerGold');
                    this.registry.set('playerGold', currentGold + goldFound);
                    
                    if (goldFound > 0) victoryText += ` Found ${goldFound} Gold.`;

                    if (Math.random() < 0.3) {
                        inventory.push('Health Potion');
                        this.registry.set('inventory', inventory);
                        victoryText += ` Found a Potion!`;
                    }
                    
                    combatLog.setText(victoryText);
                    this.time.delayedCall(4000, () => this.scene.switch('WorldScene'));
                });
            } else {
                this.time.delayedCall(1500, () => enemyTurn()); 
            }
        });

        itemBtn.on('pointerdown', () => {
            if (!isPlayerTurn) return; 
            const potionIndex = inventory.indexOf('Health Potion');
            
            if (potionIndex > -1) {
                isPlayerTurn = false; 
                inventory.splice(potionIndex, 1);
                this.registry.set('inventory', inventory); 
                
                playerHP += 10;
                if (playerHP > playerMaxHP) playerHP = playerMaxHP;
                this.registry.set('playerHP', playerHP);

                combatLog.setText('You drank a Health Potion! Recovered 10 HP.');
                playerHealthText.setText(`Player HP: ${playerHP}/${playerMaxHP}`);
                
                this.playerSprite.setTint(0x00ff00);
                this.time.delayedCall(200, () => this.playerSprite.clearTint());
                this.time.delayedCall(1500, () => enemyTurn());
            } else {
                combatLog.setText('You have no Health Potions left!');
            }
        });

        runBtn.on('pointerdown', () => {
            if (isPlayerTurn) {
                combatLog.setText('Got away safely!');
                this.time.delayedCall(500, () => this.scene.switch('WorldScene'));
            }
        });

        spawnEnemy();

        this.events.on('wake', () => {
            spawnEnemy();
        });
    }
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: [WorldScene, BattleScene] 
};
const game = new Phaser.Game(config); 