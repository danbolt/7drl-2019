// message format:
// { line: <string> }

var CutSceneScreen = function () {
  this.messages = [];
  this.nextState = 'TitleScreen';
};

CutSceneScreen.prototype.shutdown = function () {
  this.messages = [];
  this.nextState = 'TitleScreen';
};
CutSceneScreen.prototype.init = function (messages, nextState) {
  this.messages = messages;
  this.nextState = nextState;
};
CutSceneScreen.prototype.startGame = function(seed) {
  this.game.state.start(this.nextState, true, false, seed);
}
CutSceneScreen.prototype.create = function () {
  var backing = this.game.add.sprite(0, 0, this.game.cache.getBitmapData('onePx'));
  backing.width = this.game.width;
  backing.height = this.game.height;
  backing.tint = 0;

  // Daniel fix this
  var seed = ~~(Math.random() * Number.MAX_SAFE_INTEGER);

  var pressEscToSkip = this.game.add.bitmapText(2, 2, 'font', '(press ESC to SKIP this)', 8);
  this.game.input.keyboard.addKey(Phaser.KeyCode.ESC).onDown.add(() => {
    this.startGame(seed);
  });
  jibberize(pressEscToSkip, this.game);
  this.game.time.events.add(2000, function() {
    pressEscToSkip.visible = false;
  });

  var titleText = this.game.add.bitmapText(this.game.width * 0.5, this.game.height * 0.5, 'font', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 8);
  titleText.align = 'center';
  titleText.anchor.set(0.5, 0.5);
  jibberize(titleText, this.game);
  var clearTitleText = () => {
    titleText.children.forEach(function (letter) {
      letter.visible = false;
    });
  };
  clearTitleText();

  const lineDelay = 1000;
  const textBipDelay = 40;

  var messageCounter = 0;
  var playLine = () => {
    titleText.text = this.messages[messageCounter].line;
    if (this.messages[messageCounter].shock) {
      const shockTime = 500;
      var shockTweenScale = this.game.add.tween(titleText.scale);
      shockTweenScale.to({ x: [3, 1], y: [3, 1] }, shockTime, Phaser.Easing.Cubic.InOut);
      shockTweenScale.start();

      var shockTweenRotation = this.game.add.tween(titleText);
      shockTweenRotation.to({ rotation: [Math.PI * -0.25, Math.PI * 0.25, Math.PI * -0.25, Math.PI * 0.25, Math.PI * -0.25, Math.PI * 0.25, Math.PI * -0.25, Math.PI * 0.25, 0] }, shockTime, Phaser.Easing.Linear.None );
      shockTweenRotation.start();
    }
    if (this.messages[messageCounter].tint) {
      titleText.tint = this.messages[messageCounter].tint;
    } else {
      titleText.tint = 0xFFFFFF;
    }
    titleText.children.forEach((child, i, arr) => {
      const delay = i * textBipDelay;
      this.game.time.events.add(delay, function () {
        child.visible = true;
      });

      if (i === (arr.length - 1)) {
        this.game.time.events.add(delay + lineDelay, function () {
          clearTitleText();
          messageCounter++;

          if (messageCounter < this.messages.length) {
            playLine();
          } else {
            this.game.time.events.add(1000, () => {
              this.startGame(seed);
            }, this);
          }
        }, this);
      }
    });
  };
  playLine();
};