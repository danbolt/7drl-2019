
const clipsToLoad = [
  'backstep_0',
  'backstep_1',
  'backstep_2',
  'big_backstep_0',
  'death',
  'end_level',
  'enemy_respawn',
  'enemy_temp_death',
  'enemy_true_death_0',
  'enemy_true_death_1',
  'enraged_0',
  'enraged_1',
  'enter',
  'heavy_strike_0',
  'heavy_strike_1',
  'heavy_strike_2',
  'level_start_0',
  'level_start_1',
  'level_start_2',
  'mid_strike_0',
  'mid_strike_1',
  'mid_strike_2',
  'small_strike_0',
  'small_strike_1',
  'small_strike_2',
  'swap_a',
  'swap_b',
  'swap_c',
  'talk_1',
  'talk_m',
  'windup_0',
  'windup_1'
];

var stageSeeds = [0, 0, 0, 0, 0, 0, 0, 0];
var currentStageIndex = 0;

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

  var onePxBitmap = new Phaser.BitmapData(this.game, 'onePx', 1, 1);
  onePxBitmap.fill(255, 255, 255);
  this.game.cache.addBitmapData('onePx', onePxBitmap);
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

  var loadingText = this.game.add.bitmapText(this.game.width * 0.5, this.game.height * 0.5, 'font', 'loading...', 8);
  loadingText.anchor.set(0.5);

  this.game.state.start('LoadingScreen', false, false);
};

var LoadingScreen = function() {
  //
};
LoadingScreen.prototype.preload = function() {
  this.game.load.spritesheet('test_sheet', 'asset/image/test.png', 32, 32);
  this.game.load.image('test_sheet_sprite', 'asset/image/test.png');

  clipsToLoad.forEach((clipName) => {
    this.game.load.audio(clipName, 'asset/sfx/' + clipName + '.wav');
  });

  this.game.load.audio('bgm', 'asset/bgm/awoken_leg.mp3');

  this.game.load.image('logo', 'asset/image/logo.png');
};
LoadingScreen.prototype.create = function() {
  clipsToLoad.forEach((clipName) => {
    sfx[clipName] = this.game.add.audio(clipName);
  });
};

LoadingScreen.prototype.update = function() {
  if (threeAllAssetsLoaded === true) {
    this.game.state.start('SplashScreen');
    
    //this.game.state.start('Gameplay', true, false, 405050);
  }
}
LoadingScreen.prototype.shutdown = function() {
  //
};

var SplashScreen = function() {
  //
};
SplashScreen.prototype.create = function() {
  var backing = this.game.add.sprite(0, 0, this.game.cache.getBitmapData('onePx'));
  backing.width = this.game.width;
  backing.height = this.game.height;
  backing.tint = 0;

  var splashText = this.game.add.bitmapText(this.game.width * 0.5, -100, 'font', 'http://danbolt.itch.io/', 8);
  splashText.align = 'center';
  splashText.anchor.set(0.5, 0.5);
  jibberize(splashText, this.game);

  splashText.children.forEach(function (letter, i) {
    var t = this.game.add.tween(letter.position);
    t.to( { y: 200 }, 300, Phaser.Easing.Cubic.In);
    this.game.time.events.add(200 + (i * 100), function () {
      t.start();
    });
    if (i === (splashText.children.length - 1)) {
      t.onComplete.add(function () {
        sfx['enter'].play(undefined, undefined, 0.4);
        this.game.time.events.add(1500, function () {
          var bgm = this.game.add.audio('bgm');
          bgm.play(undefined, undefined, 0.45, true);
          this.game.state.start('TitleScreen');
        }, this);
      }, this);
    }
  }, this);
};

var TitleScreen = function() {
  //
};
TitleScreen.prototype.create = function() {
  var backing = this.game.add.sprite(0, 0, this.game.cache.getBitmapData('onePx'));
  backing.width = this.game.width;
  backing.height = this.game.height;
  backing.tint = 0;

  var titleText = this.game.add.bitmapText(this.game.width * 0.5, this.game.height * 0.65, 'font', 'press spacebar to start', 8);
  titleText.align = 'center';
  titleText.anchor.set(0.5, 0.5);
  jibberize(titleText, this.game);

  var infoText = this.game.add.bitmapText(0.0, this.game.height - 9, 'font', '(c) Daniel Savage 2019 #7drl', 8);
  jibberize(infoText, this.game);


  var logoFragmentSrc = `
    precision mediump float;

    varying vec2 vTextureCoord;

    uniform sampler2D uSampler;
    uniform vec2 resolution;
    uniform float time;

    void main(void) {

      gl_FragColor = texture2D(uSampler, vTextureCoord);

      float fidelity = (sin(time * 1.2) * 0.25 + 0.6) * 4.0;

      vec2 p = vTextureCoord * resolution + vec2(0.5, 0.5);
      vec2 pSlot = floor(p / fidelity) * fidelity;
      vec2 fragColorPSlot = pSlot / resolution;

      gl_FragColor = texture2D(uSampler, fragColorPSlot);

      if (gl_FragColor.w < 1.0) {
        gl_FragColor = vec4(gl_FragColor.xyz, 0.0);
      }
    }
    `;
  var logoFilter = new Phaser.Filter(this.game, null, logoFragmentSrc);

  var logoImage = this.game.add.image(this.game.width * 0.5, this.game.height * 0.25, 'logo');
  logoImage.anchor.set(0.5, 0.5);
  logoImage.width = 240;
  logoImage.scale.y = logoImage.scale.x;
  logoImage.filters = [logoFilter];
  logoImage.update = function () {
    this.filters[0].update();
  };
  var t = this.game.add.tween(logoImage.scale);
  t.to( { x: [logoImage.scale.x + 0.05, logoImage.scale.x], y: [logoImage.scale.y + 0.05, logoImage.scale.y] }, 2000, Phaser.Easing.Cubic.InOut, true, 0, -1);
  t.interpolation(function (v, k) {

        var m = v.length - 1;
        var f = m * k;
        var i = Math.floor(f);

        var result = 0;

        if (k < 0) {
          result = this.linear(v[0], v[1], f);
        } else if (k > 1) {
          result = this.linear(v[m], v[m - 1], m - f);
        } else {
          result = this.linear(v[i], v[i + 1 > m ? m : i + 1], f - i);
        }
        return Math.floor(result * 75) / 75;

    });

  this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR).onDown.add( function() {
    for (var i = 0; i < stageSeeds.length; i++) {
      stageSeeds[i] = ~~(Math.random() * Number.MAX_SAFE_INTEGER);
    }
    currentStageIndex = 0;

    this.game.state.start('CutSceneScreen', true, false, introLines, 'IntermitentScreen', 'Gameplay');
  }, this);
};


var IntermitentScreen = function() {
  this.nextState = 'TitleScreen';
};
IntermitentScreen.prototype.init = function(nextState) {
  this.nextState = (nextState ? nextState : 'TitleScreen');
}
IntermitentScreen.prototype.create = function() {
  var backing = this.game.add.sprite(0, 0, this.game.cache.getBitmapData('onePx'));
  backing.width = this.game.width;
  backing.height = this.game.height;
  backing.tint = 0;

  const msg = 'floor ' + (currentStageIndex + 1) + ' of ' + stageSeeds.length;
  var titleText = this.game.add.bitmapText(this.game.width * 0.5, this.game.height * 0.5, 'font', msg, 8);
  titleText.align = 'center';
  titleText.anchor.set(0.5, 0.5);
  titleText.visible = false;
  jibberize(titleText, this.game);
  this.game.time.events.add(400, function () {
    titleText.visible = true;
  }, this);
  this.game.time.events.add(1600, function () {
    titleText.visible = false;
  }, this);

  this.game.time.events.add(2000, function () {
    this.game.state.start(this.nextState);
  }, this);
};