const StaminaBarWidth = 96;
const StaminaBarHeight = 16;

const testLongStrikeConfig = {
  name: 'test strike',
  state: PlayerState.STRIKE,
  speed: 1000,
  decayTime: 90,
  duration: 111,
  staminaCost: 0.411,
  windupSpeed: -70,
  windupTime: 500,
  power: 4
};

const testSmallStrikeConfig = {
  name: 'test small strike',
  state: PlayerState.STRIKE,
  speed: 1000,
  decayTime: 30,
  duration: 40,
  staminaCost: 0.2,
  windupSpeed: -70,
  windupTime: 100,
  power: 2
};

const testBackstepConfig = {
  name: 'backstep',
  state: PlayerState.BACKSTEP,
  speed: -600,
  decayTime: 100,
  duration: 50,
  staminaCost: 0.19,
  windupSpeed: undefined,
  windupTime: undefined,
  power: undefined
};

// randomize me later
const mapSize = 100;

var Gameplay = function () {
  this.player = null;

  this.enemies = null;
  this.items = null;

  this.map = null;
  this.foregroundLayer = null;

  this.levelGenData = { enemies: [], items: [], exit: new Phaser.Point(-1, -1), spawn: new Phaser.Point(-1, -1) };

  this.ui = null;
  this.staminaBarBacking = null;
  this.staminaBar = null;
  this.itemInfoText = null;
  this.weaponInfoText = null;
  this.deathText = null;
};
Gameplay.prototype.shutdown = function() {
  unloadThreeScene();

  this.player = null;

  this.enemies = null;
  this.items = null;

  this.map = null;
  this.foregroundLayer = null;

  this.levelGenData = { enemies: [], items: [], exit: new Phaser.Point(-1, -1), spawn: new Phaser.Point(-1, -1) };

  this.ui = null;
  this.staminaBarBacking = null;
  this.staminaBar = null;
  this.itemInfoText = null;
  this.weaponInfoText = null;
  this.deathText = null;
};

Gameplay.prototype.preload = function () {
  this.game.cache.removeTilemap('gen_map');
  this.levelGenData = { enemies: [], items: [], exit: new Phaser.Point(-1, -1), spawn: new Phaser.Point(-1, -1) };

  // data drive this later
  const TEST_SEED = 80;

  var enemySpawnSkew = new Phaser.Matrix();

  var posScratchPad = new Phaser.Point();
  var translatedScratchPad = new Phaser.Point();
  var translationMatrix = new Phaser.Matrix();
  translationMatrix.translate(-2000, 0);
  translationMatrix.rotate(Math.PI);
  var mapCsv = '';
  noise.seed(TEST_SEED);

  const exitCleanRadius = 6;
  const spawnCleanRadius = 5.3;
  this.levelGenData.exit.x = mapSize - 8;
  this.levelGenData.exit.y = mapSize - 8;
  this.levelGenData.spawn.x = 10;
  this.levelGenData.spawn.y = 10;
  for (var x = 0; x < mapSize; x++) {
    for (var y = 0; y < mapSize; y++) {
      posScratchPad.x = x;
      posScratchPad.y = y;
      translationMatrix.apply(posScratchPad, translatedScratchPad);

      const closeToExit = (posScratchPad.distance(this.levelGenData.exit) < exitCleanRadius);
      const closeToSpawn = (posScratchPad.distance(this.levelGenData.spawn) < spawnCleanRadius);
      const clearFromBothSpawnAndExit = ((closeToExit === false) && (closeToSpawn === false));

      if ((posScratchPad.x === 0) || (posScratchPad.y === 0) || (posScratchPad.x === (mapSize-1)) || (posScratchPad.y === (mapSize-1))) {
        mapCsv += '2';
      } else if ((~~(posScratchPad.x / PillarSpacing) % 2 === 0) && (~~(posScratchPad.y / PillarSpacing) % 2 === 0)) {
        mapCsv += '2';
      } else {
        var valueAt = noise.simplex2(posScratchPad.x / 10, posScratchPad.y / 10);
        if (valueAt > 0.1 && clearFromBothSpawnAndExit) {
          mapCsv += '17';
        } else {
          mapCsv += '-1';

          var itemNoiseValueAt = noise.simplex2(translatedScratchPad.x, translatedScratchPad.y);
          if (itemNoiseValueAt > 0.9) {
            this.levelGenData.items.push( {
              x: posScratchPad.y,
              y: posScratchPad.x,
              name: 'test name',
              
            });
          }

          if (valueAt < -0.8) {
            if (clearFromBothSpawnAndExit) {
              this.levelGenData.enemies.push({ x: posScratchPad.y, y: posScratchPad.x });
            }
          }
        }
      }
        
      if (posScratchPad.y !== (mapSize - 1)) {
        mapCsv += ',';
      }
    }
    mapCsv += '\n';
  }

  this.game.cache.addTilemap('gen_map', null, mapCsv, Phaser.Tilemap.CSV);
}
Gameplay.prototype.create = function() {
  this.player = new Player(this.game, this.levelGenData.spawn.x * GameplayTileSize, this.levelGenData.spawn.y * GameplayTileSize);
  this.player.renderable = false;
  this.player.events.onKilled.add(() => {
    this.deathText.visible = true;

    this.game.time.events.add(2000, () => {
      this.game.state.start('Gameplay');
    });
  });
  this.game.camera.follow(this.player);
  this.game.camera.bounds = null;

  this.player.setAButtonConfig(testLongStrikeConfig);
  this.player.setBButtonConfig(testSmallStrikeConfig);
  this.player.setCButtonConfig(testBackstepConfig);

  this.enemies = this.game.add.group(undefined, 'enemies');
  this.levelGenData.enemies.forEach(function (enemyData) {
    var enemy = new BasicEnemy(this.game, enemyData.x * GameplayTileSize, enemyData.y * GameplayTileSize, this.player, 5, 600);
    this.enemies.addChild(enemy);
  }, this);
  this.game.physics.enable(this.enemies);

  this.items = this.game.add.group(undefined, 'items');
  this.levelGenData.items.forEach(function (itemData) {
    var item = this.game.add.sprite(itemData.x * GameplayTileSize, itemData.y * GameplayTileSize, 'test_sheet', 1);
    item.renderable = false;
    item.data.info = itemData;
    this.items.addChild(item);
  }, this);
  this.game.physics.enable(this.items);

  this.map = this.game.add.tilemap('gen_map', 32, 32);
  this.map.addTilesetImage('test_sheet_sprite', 'test_sheet_sprite', 32, 32);
  this.foregroundLayer = this.map.createLayer(0);
  this.foregroundLayer.resizeWorld();
  this.map.setCollisionByExclusion([0], true, this.foregroundLayer);
  this.game.physics.enable(this.foregroundLayer, Phaser.Physics.ARCADE);
  this.foregroundLayer.renderable = false;

  this.initalizeUI();

  initalizeThreeScene(this);
};
Gameplay.prototype.initalizeUI = function () {
  this.ui = this.game.add.group();
  this.ui.fixedToCamera = true;

  let jibberize = (bitmapText) => {
    bitmapText.children.forEach(function(letter) {
      var lt = this.game.add.tween(letter.scale);
      lt.to({ y: [ (letter.scale.y), (letter.scale.y * 1.6), letter.scale.y ] }, 200 + (Math.random() * 100), Phaser.Easing.Cubic.InOut, true, Math.random() * 1000, -1);
    }, this);
  };

  const staminaBarSpot = 6;
  this.staminaBarBacking = this.game.add.sprite(staminaBarSpot, staminaBarSpot, 'test_sheet', 17);
  this.staminaBarBacking.tint = 0x999999;
  this.staminaBarBacking.width = StaminaBarWidth;
  this.staminaBarBacking.height = StaminaBarHeight;
  this.ui.addChild(this.staminaBarBacking);
  this.staminaBar = this.game.add.sprite(staminaBarSpot + 2, staminaBarSpot + 2, 'test_sheet', 17);
  this.staminaBar.tint = 0x00FF00;
  this.staminaBar.width = StaminaBarWidth - 4;
  this.staminaBar.height = StaminaBarHeight - 4;
  this.ui.addChild(this.staminaBar);

  this.weaponInfoText = this.game.add.bitmapText(112, staminaBarSpot, 'font', 'Move A: ohhhhhh\n\nMove B: ummm\n\nMove C: ahhh', 7);
  this.ui.addChild(this.weaponInfoText);
  jibberize(this.weaponInfoText);

  this.deathText = this.game.add.bitmapText(this.game.width * 0.5, this.game.height * 0.5, 'font', 'death was inevitable', 8);
  this.deathText.align = 'center';
  this.deathText.anchor.set(0.5, 0.5);
  this.deathText.visible = false;
  this.ui.addChild(this.deathText);
  jibberize(this.deathText);

  this.itemInfoText = this.game.add.bitmapText(32, 32, 'font', 'a!aaaaaaaaaaaaaaaaaaaaaaaaaaa\naaaaaaaaaaaaaaaaaaaaaaaaaaaaa\naaaaaaaaaaaaaaaaaaaaaaaaaaaaa\naaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 8);
  jibberize(this.itemInfoText);
  this.itemInfoText.anchor.x = 0.5;
  this.itemInfoText.align = 'center';
  this.ui.addChild(this.itemInfoText);
};
Gameplay.prototype.updateUI = function () {
  this.staminaBar.width = (StaminaBarWidth - 4) * this.player.data.stamina;

  this.itemInfoText.visible = false;
};

Gameplay.prototype.update = function() {
  
  const xDist = (this.levelGenData.exit.x * GameplayTileSize) - this.player.x;
  const xDistSqr = xDist * xDist;
  const yDist = (this.levelGenData.exit.y * GameplayTileSize) - this.player.y;
  const yDistSqr = yDist * yDist;
  const minDistToExitSqr = 32 * 32;
  if ((xDistSqr + yDistSqr) < minDistToExitSqr) {
    this.game.state.start('Gameplay');
    return;
  }

	updateThreeScene(this);
  renderThreeScene();

  this.updateUI();

  this.game.physics.arcade.overlap(this.player, this.enemies, function (player, enemy) {
    if (player.data.state === PlayerState.STRIKE) {
      enemy.damage(player.data.powerValue)
    } else {
      player.kill();
    }
  }, undefined, this);
  this.game.physics.arcade.overlap(this.player, this.items, function(player, item) {
    if (player.data.state === PlayerState.NORMAL) {
      this.itemInfoText.visible = true;
      this.itemInfoText.text = item.data.info.name;
      this.itemInfoText.position.set((item.data.mesh.position.x * GameplayTileSize) - this.game.camera.x, 32 + (item.data.mesh.position.z * GameplayTileSize) - this.game.camera.y)
    }
  }, undefined, this);
  this.game.physics.arcade.collide(this.enemies, this.foregroundLayer);
  this.game.physics.arcade.collide(this.player, this.foregroundLayer, undefined, function (player, tile) {
    if ((player.data.state === PlayerState.STRIKE) && (tile.index === 17)) {
      if (tile.properties.wallMesh) {
        tile.properties.wallMesh.visible = false;
      }
      this.map.removeTile(tile.x, tile.y, this.foregroundLayer);
      return false;
    }

    return true;
  }, this);
};