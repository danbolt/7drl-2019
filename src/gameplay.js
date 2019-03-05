const StaminaBarWidth = 96;
const StaminaBarHeight = 16;

// randomize me later
const mapSize = 100;

var Gameplay = function () {
  this.player = null;

  this.enemies = null;

  this.map = null;
  this.foregroundLayer = null;

  this.levelGenData = { enemies: [], items: [], exit: new Phaser.Point(-1, -1), spawn: new Phaser.Point(-1, -1) };

  this.ui = null;
  this.staminaBarBacking = null;
  this.staminaBar = null;
};
Gameplay.prototype.shutdown = function() {
  unloadThreeScene();

  this.player = null;

  this.enemies = null;

  this.map = null;
  this.foregroundLayer = null;

  this.levelGenData = { enemies: [], items: [], exit: new Phaser.Point(-1, -1), spawn: new Phaser.Point(-1, -1) };

  this.ui = null;
  this.staminaBarBacking = null;
  this.staminaBar = null;
};

Gameplay.prototype.preload = function () {
  this.game.cache.removeTilemap('gen_map');

  // data drive this later
  const TEST_SEED = 101;

  var enemySpawnSkew = new Phaser.Matrix();

  var posScratchPad = new Phaser.Point();
  var mapCsv = '';
  noise.seed(TEST_SEED);
  for (var x = 0; x < mapSize; x++) {
    for (var y = 0; y < mapSize; y++) {
      posScratchPad.x = x;
      posScratchPad.y = y;

      if ((posScratchPad.x === 0) || (posScratchPad.y === 0) || (posScratchPad.x === (mapSize-1)) || (posScratchPad.y === (mapSize-1))) {
        mapCsv += '2';
      } else if ((~~(posScratchPad.x / PillarSpacing) % 2 === 0) && (~~(posScratchPad.y / PillarSpacing) % 2 === 0)) {
        mapCsv += '2';
      } else {
        var valueAt = noise.simplex2(posScratchPad.x / 10, posScratchPad.y / 10);
        if (valueAt > 0.1) {
          mapCsv += '17';
        } else {
          mapCsv += '-1';
        }

        if (valueAt < -0.8) {
          this.levelGenData.enemies.push({ x: posScratchPad.x, y: posScratchPad.y });
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
  this.player = new Player(this.game, 300, 300);
  this.player.renderable = false;
  this.game.camera.follow(this.player);
  this.game.camera.bounds = null;

  this.enemies = this.game.add.group(undefined, 'enemies');
  this.levelGenData.enemies.forEach(function (enemyData) {
    var enemy = this.game.add.sprite(enemyData.x * GameplayTileSize, enemyData.y * GameplayTileSize, 'test_sheet', 7);
    enemy.renderable = false;
    this.enemies.addChild(enemy);
    enemy.update = function() {
      this.data.mesh.position.set(this.x * WorldScale, 0, this.y * WorldScale);
      this.body.velocity.y = 50;
    }
  }, this);
  this.game.physics.enable(this.enemies);
  console.log(this.enemies);

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

  this.staminaBarBacking = this.game.add.sprite(32, 32, 'test_sheet', 17);
  this.staminaBarBacking.tint = 0x999999;
  this.staminaBarBacking.width = StaminaBarWidth;
  this.staminaBarBacking.height = StaminaBarHeight;
  this.ui.addChild(this.staminaBarBacking);
  this.staminaBar = this.game.add.sprite(34, 34, 'test_sheet', 17);
  this.staminaBar.tint = 0x00FF00;
  this.staminaBar.width = StaminaBarWidth - 4;
  this.staminaBar.height = StaminaBarHeight - 4;
  this.ui.addChild(this.staminaBar);
};
Gameplay.prototype.updateUI = function () {
  this.staminaBar.width = (StaminaBarWidth - 4) * this.player.data.stamina;
};

Gameplay.prototype.update = function() {
	updateThreeScene(this);
  renderThreeScene();

  this.updateUI();

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