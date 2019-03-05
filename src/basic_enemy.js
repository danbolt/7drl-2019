var BasicEnemy = function (game, x, y, player) {
  Phaser.Sprite.call(this, game, x, y, 'test_sheet', 7);
  this.game.add.existing = this;

  this.events.onKilled.add(function () {
    if (this.data.mesh) {
      this.data.mesh.matrixAutoUpdate = false;
      this.data.mesh.visible = false;
    }
  }, this);

  this.data.player = player;
  this.data.moveSpeed = 50;
  this.data.playerMinSightRange = 128;
  this.data.playerMinSightRangeSquared = (this.data.playerMinRange * this.data.playerMinRange);

  this.renderable = false;
};

BasicEnemy.prototype = Object.create(Phaser.Sprite.prototype);
BasicEnemy.prototype.constructor = BasicEnemy;

BasicEnemy.prototype.update = function() {
  if (this.position.distance(this.data.player.position) <= this.data.playerMinSightRange) {
    var theta = Math.atan2(this.data.player.position.y - this.position.y, this.data.player.position.x - this.position.x);
    this.body.velocity.set(Math.cos(theta) * this.data.moveSpeed, Math.sin(theta) * this.data.moveSpeed)
  } else {
    this.body.velocity.set(0, 0);
  }

  if (this.data.mesh) {
    this.data.mesh.position.set(this.x * WorldScale, 0, this.y * WorldScale);
    this.data.mesh.rotation.y = (this.rotation - (Math.PI * 0.5)) * -1;
  }
};

