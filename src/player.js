
// angleLerp taken from:
// https://gist.github.com/shaunlebron/8832585
function shortAngleDist(a0,a1) {
    var max = Math.PI*2;
    var da = (a1 - a0) % max;
    return 2*da % max - da;
};
function angleLerp(a0,a1,t) {
    return a0 + shortAngleDist(a0,a1)*t;
};

var PlayerState = {
  NORMAL: 0,
  STRIKE: 1,
  BACKSTEP: 2,
  DAMAGED: 3,
  WINDUP: 4
};

const PlayerMoveSpeed = 190.0;
const PlayerBurstSpeed = 270.0;
const PlayerBurstDecayTime = 230;
const PlayerStaminaReplenishRate = 0.00025;

var Player = function(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'test_sheet', 17);
  this.game.add.existing(this);

  this.data.prevMoveDirection = new Phaser.Point(0, 0);
  this.data.moveDirection = new Phaser.Point(0, 0);
  this.data.damagedDirection = new Phaser.Point(1, 0);
  this.data.moveSpeed = PlayerMoveSpeed;
  this.data.burstTween = null;
  this.data.movementTween = null;
  this.data.state = PlayerState.NORMAL;
  this.data.stamina = 1.0;
  this.data.powerValue = 0;

  // keyboard input initalization
  const aButtonKey = Phaser.KeyCode.X;
  const bButtonKey = Phaser.KeyCode.C;
  const cButtonKey = Phaser.KeyCode.V;
  const downKey = Phaser.KeyCode.DOWN;
  const upKey = Phaser.KeyCode.UP;
  const leftKey = Phaser.KeyCode.LEFT;
  const rightKey = Phaser.KeyCode.RIGHT;
  this.data.inputInfo = {
    inputDirection: new Phaser.Point(0, 0),
    aButtonCallback: () => {},
    bButtonCallback: () => {},
    cButtonCallback: () => {}
  };
  this.game.input.keyboard.addKey(aButtonKey).onDown.add( () => { this.data.inputInfo.aButtonCallback(); });
  this.game.input.keyboard.addKey(bButtonKey).onDown.add( () => { this.data.inputInfo.bButtonCallback(); });
  this.game.input.keyboard.addKey(cButtonKey).onDown.add( () => { this.data.inputInfo.bCuttonCallback(); });
  var rightArrowKey = this.game.input.keyboard.addKey(rightKey);
  rightArrowKey.onDown.add(function () { this.data.inputInfo.inputDirection.x += 1.0; }, this);
  rightArrowKey.onUp.add(function () { this.data.inputInfo.inputDirection.x -= 1.0; }, this); 
  var leftArrowKey = this.game.input.keyboard.addKey(leftKey);
  leftArrowKey.onDown.add(function () { this.data.inputInfo.inputDirection.x -= 1.0; }, this);
  leftArrowKey.onUp.add(function () { this.data.inputInfo.inputDirection.x += 1.0; }, this); 
  var downArrowKey = this.game.input.keyboard.addKey(downKey);
  downArrowKey.onDown.add(function () { this.data.inputInfo.inputDirection.y += 1.0; }, this);
  downArrowKey.onUp.add(function () { this.data.inputInfo.inputDirection.y -= 1.0; }, this); 
  var upArrowKey = this.game.input.keyboard.addKey(upKey);
  upArrowKey.onDown.add(function () { this.data.inputInfo.inputDirection.y -= 1.0; }, this);
  upArrowKey.onUp.add(function () { this.data.inputInfo.inputDirection.y += 1.0; }, this); 

  // gamepad input initalization
  this.game.input.gamepad.onAxisCallback = ((gamepad) => {
    this.data.inputInfo.inputDirection.x = gamepad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X);
    this.data.inputInfo.inputDirection.y = gamepad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y);
  });
  this.game.input.gamepad.onDownCallback = ((buttonCode) => {
    if (buttonCode === Phaser.Gamepad.XBOX360_A) {
      this.data.inputInfo.aButtonCallback();
    } else if (buttonCode === Phaser.Gamepad.XBOX360_B) {
      this.data.inputInfo.bButtonCallback();
    } else if (buttonCode === Phaser.Gamepad.XBOX360_X) {
      this.data.inputInfo.bCuttonCallback();
    }
  });

  this.data.mesh = null;
  this.events.onKilled.add(function () {
    if (this.data.mesh) {
      this.data.mesh.matrixAutoUpdate = false;
      this.data.mesh.visible = false;
    }
  }, this);

  this.game.physics.enable(this, Phaser.Physics.ARCADE);
  this.anchor.set(0.5, 0.5);
}
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;
Player.prototype.updateDirectionFromInput = function() {
  this.data.prevMoveDirection.x = this.data.moveDirection.x;
  this.data.prevMoveDirection.y = this.data.moveDirection.y;

  if (this.data.state === PlayerState.NORMAL) {
    this.data.moveDirection.x = this.data.inputInfo.inputDirection.x;
    this.data.moveDirection.y = this.data.inputInfo.inputDirection.y;
  }

  this.data.moveDirection.normalize();
};

Player.prototype.generateStrikeStepCallbackFromConfig = function(config) {
    var generateStrikeStepCallback = (cost, newState, newSpeed, newTime, newDecayTime, windupSpeed, windupTime, power) => {
    return () => {
      if (this.data.state !== PlayerState.NORMAL) {
        return;
      }

      if (this.data.stamina < cost) {
        return;
      }

      if (this.data.burstTween !== null) {
        this.data.burstTween.stop();
        this.data.burstTween = null;
      }

      var performAction = () => {
        this.data.powerValue = power;
        this.data.stamina -= cost;
        this.data.state = newState;
        this.data.moveSpeed = newSpeed;
        this.data.movementTween = this.game.add.tween(this.data);
        this.data.movementTween.to({ moveSpeed: PlayerMoveSpeed }, newDecayTime, Phaser.Easing.Cubic.In, false, newTime);
        this.data.movementTween.onComplete.add(() => {
          this.data.state = PlayerState.NORMAL;
          this.data.movementTween = null;
          this.data.powerValue = 0;
        });
        this.data.movementTween.start();
      };

      this.data.prevMoveDirection.x = this.data.moveDirection.x;
      this.data.prevMoveDirection.y = this.data.moveDirection.y;
      this.data.moveDirection.x = Math.cos(this.rotation);
      this.data.moveDirection.y = Math.sin(this.rotation);

      if ((windupTime !== undefined) && (windupSpeed !== undefined)) {
        this.data.state = PlayerState.WINDUP;
        this.data.moveSpeed = windupSpeed;
        this.game.time.events.add(windupTime, function () {
          performAction();
        }, this);

        return;
      }

      performAction();

    };
  };

  return generateStrikeStepCallback(config.staminaCost, config.state, config.speed, config.duration, config.decayTime, config.windupSpeed, config.windupTime, config.power);
};
Player.prototype.setAButtonConfig = function(config) {
  this.data.inputInfo.aButtonCallback = this.generateStrikeStepCallbackFromConfig(config);
};
Player.prototype.setBButtonConfig = function(config) {
  this.data.inputInfo.bButtonCallback = this.generateStrikeStepCallbackFromConfig(config);
};
Player.prototype.setCButtonConfig = function(config) {
  this.data.inputInfo.bCuttonCallback = this.generateStrikeStepCallbackFromConfig(config);
};
Player.prototype.updateVelocityFromDirection = function() {
  const prevDirectionLengthSqr = this.data.prevMoveDirection.getMagnitudeSq();
  const currentDirectionLengthSqr = this.data.moveDirection.getMagnitudeSq();

  // Dash a bit when movement starts from a standstill
  if ((prevDirectionLengthSqr <= Epsilon) && (currentDirectionLengthSqr > prevDirectionLengthSqr) && (this.data.burstTween === null) && (this.data.state === PlayerState.NORMAL)) {
    this.data.moveSpeed = PlayerBurstSpeed;
    this.data.burstTween = this.game.add.tween(this.data);
    this.data.burstTween.to( { moveSpeed: PlayerMoveSpeed }, PlayerBurstDecayTime, Phaser.Easing.Cubic.Out);
    this.data.burstTween.onComplete.add(function () {
      this.data.burstTween = null;
    }, this);
    this.data.burstTween.start();
  }

  if (currentDirectionLengthSqr > Epsilon) {
    const targetRotation = Math.atan2(this.data.moveDirection.y, this.data.moveDirection.x);
    this.rotation = angleLerp(this.rotation, targetRotation, 0.18);
  }

  this.body.velocity.x = this.data.moveSpeed * this.data.moveDirection.x;
  this.body.velocity.y = this.data.moveSpeed * this.data.moveDirection.y;
};
Player.prototype.update = function() {
  this.updateDirectionFromInput();
  this.updateVelocityFromDirection();

  if (this.data.state === PlayerState.NORMAL) {
    this.tint = 0xFFFFFF;
  } else if (this.data.state === PlayerState.STRIKE) {
    this.tint = 0xFF0000;
  } else if (this.data.state === PlayerState.BACKSTEP) {
    this.tint = 0x0000FF;
  }

  this.data.stamina = Math.min((PlayerStaminaReplenishRate * this.game.time.elapsed) + this.data.stamina, 1.0);
};
