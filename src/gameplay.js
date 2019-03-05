const StaminaBarWidth = 96;
const StaminaBarHeight = 16;

const mapSize = 100;

var Gameplay = function () {
  this.player = null;

  this.map = null;
  this.foregroundLayer = null;

  this.ui = null;
  this.staminaBarBacking = null;
  this.staminaBar = null;
};
Gameplay.prototype.shutdown = function() {
  unloadThreeScene();

  this.player = null;

  this.map = null;
  this.foregroundLayer = null;

  this.ui = null;
  this.staminaBarBacking = null;
  this.staminaBar = null;
};

Gameplay.prototype.preload = function () {
  this.game.cache.removeTilemap('gen_map');


  var mapCsv = '';
  noise.seed(101);
  for (var x = 0; x < mapSize; x++) {
    for (var y = 0; y < mapSize; y++) {
      if ((x === 0) || (y === 0) || (x === (mapSize-1)) || (y === (mapSize-1))) {
        mapCsv += '2';
      } else if ((~~(x / PillarSpacing) % 2 === 0) && (~~(y / PillarSpacing) % 2 === 0)) {
        mapCsv += '2';
      } else {
        var valueAt = noise.simplex2(x / 10, y / 10);
        if (valueAt > 0.1) {
          mapCsv += '17';
        } else {
          mapCsv += '-1';
        }
      }
        
      if (y !== (mapSize - 1)) {
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