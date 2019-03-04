const StaminaBarWidth = 96;
const StaminaBarHeight = 16;

var Gameplay = function () {
  this.player = null;

  this.ui = null;
  this.staminaBarBacking = null;
  this.staminaBar = null;
};
Gameplay.prototype.shutdown = function() {
  unloadThreeScene();

  this.player = null;

  this.ui = null;
  this.staminaBarBacking = null;
  this.staminaBar = null;
};

Gameplay.prototype.create = function() {
  this.player = new Player(this.game, 0, 0);
  this.player.renderable = false;
  this.game.camera.follow(this.player);
  this.game.camera.bounds = null;

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
};