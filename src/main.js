var Preload = function () {
	//
};
Preload.prototype.init = function() {
  this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  this.game.scale.refresh();

  this.game.scale.pageAlignHorizontally = true;
  this.game.scale.pageAlignVertically = true;

  // enable crisp rendering
  this.game.stage.smoothed = false;
  this.game.renderer.renderSession.roundPixels = true;  
  Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
  PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST; //for WebGL

  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.DOWN);
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.UP);
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR);

  this.game.input.gamepad.start();
};
Preload.prototype.preload = function() {
  // Font is Gamegirl Classic by freakyfonts
  // License is for noncommercial use
  // http://www.fontspace.com/freaky-fonts/gamegirl-classic
  this.game.load.bitmapFont('font', 'asset/font/font.png', 'asset/font/font.json');

  // Move these to load later
  this.game.load.spritesheet('test_sheet', 'asset/image/test.png', 32, 32);
};
Preload.prototype.create = function() {
  this.game.scale.onSizeChange.add(function () {
    var cv = this.game.canvas;
    this.game.canvas = threeCanvas;
    this.game.scale.reflowCanvas();
    this.game.canvas = cv;
  }, this);
  initalizeThreeJS(this.game.renderer.gl);
  loadThreeAssets();
  this.game.scale.onSizeChange.dispatch();
};

Preload.prototype.update = function() {
  if (threeAllAssetsLoaded === true) {
    this.game.state.start('Gameplay');
  }
}

var main = function () {
	console.log('hello, rendering! 😊');

	var game = new Phaser.Game(320, 240, Phaser.AUTO, undefined, undefined, true, false);
	game.state.add('Preload', Preload, false);
  game.state.add('Gameplay', Gameplay, false);

	game.state.start('Preload');
};
