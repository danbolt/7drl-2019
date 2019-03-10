
const DefaultMoveSpeed = 50;

var BasicEnemy = function (game, x, y, player, health, beDeadTime, config) {
  Phaser.Sprite.call(this, game, x, y, 'test_sheet', 7);
  this.game.add.existing(this);

  var deadTime = beDeadTime ? beDeadTime : 1000;

  this.maxHealth = 1;

  this.events.onKilled.add(function () {
    this.data.enemyHealth += this.health;
    if (this.data.mesh) {
      this.data.mesh.matrixAutoUpdate = false;
      this.data.mesh.visible = false;
    }
    if (this.data.enemyHealth > 0) {
      sfx['enemy_temp_death'].play();
      this.game.time.events.add(deadTime + 200, function () {
        this.data.reviveOnNextFrame = true;

        if (this.data.resetStrikeTween !== null) {
          this.game.time.events.remove(this.data.resetStrikeTween);
          this.data.resetStrikeTween = null;
          this.data.strikeAble = false;

          this.data.resetStrikeTween = this.game.time.events.add(500, () => {
            this.data.strikeAble = true;
            this.data.resetStrikeTween = null;
          });
        }
      }, this);

      for (var i = 0; i < this.data.enemyHealth; i++) {
        let m = this.data.deathParticleMesh[i];
        m.visible = true;
        m.matrixAutoUpdate = true;
        m.position.set(this.x * WorldScale, 0, this.y * WorldScale);
        var t = this.game.add.tween(m.position);
        const startX = this.x * WorldScale;
        const startZ = this.y * WorldScale;
        t.to({x: [startX + (2 * Math.cos(i / this.data.enemyHealth * Math.PI * 2)), startX + (2 * Math.cos((i+1) / this.data.enemyHealth * Math.PI * 2)), startX], y: [3, 0], z: [startZ + (2 * Math.sin(i / this.data.enemyHealth * Math.PI * 2)), startZ + (2 * Math.sin((i+1) / this.data.enemyHealth * Math.PI * 2)), startZ]}, deadTime, Phaser.Easing.Cubic.InOut);
        t.onComplete.add(() => {
          m.visible = false;
          m.matrixAutoUpdate = false;
        });
        t.interpolation(Phaser.Math.catmullRomInterpolation);
        t.start();

        var ts = this.game.add.tween(m.scale);
        ts.to({x: [0.3, this.data.enemyHealth / health], y: [0.3, this.data.enemyHealth / health], z: [0.3, this.data.enemyHealth / health]}, deadTime, Phaser.Easing.Cubic.InOut);
        ts.start();
      }
    } else {

      sfx['enemy_true_death_0'].play();
    }
  }, this);
  this.events.onRevived.add(function () {
    if (this.data.mesh) {
      this.data.mesh.matrixAutoUpdate = true;
      this.data.mesh.visible = true;
    }
  }, this);

  this.data.player = player;
  this.data.realMoveSpeed = config.moveSpeed ? config.moveSpeed : DefaultMoveSpeed;
  this.data.moveSpeed = this.data.realMoveSpeed;
  this.data.playerMinSightRange = 256;
  this.data.playerMinSightRangeSquared = (this.data.playerMinRange * this.data.playerMinRange);
  this.data.reviveOnNextFrame = false;
  this.data.enemyHealth = health;
  this.data.config = config;
  this.data.strikeAble = true;
  this.data.strikeTween = null;
  this.data.resetStrikeTween = null;

  this.renderable = false;
};

BasicEnemy.prototype = Object.create(Phaser.Sprite.prototype);
BasicEnemy.prototype.constructor = BasicEnemy;

BasicEnemy.prototype.update = function() {
  if (this.alive === false) {
    if (this.data.reviveOnNextFrame === true) {
      this.revive();
      this.data.reviveOnNextFrame = false;
    }
  }

  var withinPlayerRange = this.position.distance(this.data.player.position) <= this.data.playerMinSightRange;
  if (withinPlayerRange) {
      var theta = Math.atan2(this.data.player.position.y - this.position.y, this.data.player.position.x - this.position.x);
      this.body.velocity.set(Math.cos(theta) * this.data.moveSpeed, Math.sin(theta) * this.data.moveSpeed)
      this.rotation = theta;
  } else {
    this.body.velocity.set(0, 0);
  }

  if (withinPlayerRange && (this.data.config.striker === true) && (this.data.strikeAble === true)) {
    this.data.strikeAble = false;

    this.data.moveSpeed = -70;
    if (this.data.mesh) {
      if (this.data.strikeTween === null) {
        var t = this.game.add.tween(this.data.mesh.scale);
        t.to( { z: [0.25, this.data.mesh.scale.z] }, 300, Phaser.Easing.Cubic.Out);
        t.start();
        this.data.strikeTween = t;
      }
      this.data.strikeTween.start();
    }

    this.data.resetStrikeTween = this.game.time.events.add(300, () => {
      this.data.moveSpeed = this.data.config.strikeSpeed;
      this.game.time.events.add(this.data.config.strikeTime, () => {
        this.data.moveSpeed = this.data.realMoveSpeed;
        this.data.resetStrikeTween = this.game.time.events.add(500, () => {
          this.data.strikeAble = true;
          this.data.resetStrikeTween = null;
        });
      });
    });
  }

  if (this.data.mesh) {
    this.data.mesh.position.set(this.x * WorldScale, 0, this.y * WorldScale);
    this.data.mesh.rotation.y = (this.rotation - (Math.PI * 0.5)) * -1;
  }
};

