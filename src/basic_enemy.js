var BasicEnemy = function (game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'test_sheet', 7);
  this.game.add.existing = this;

  this.events.onKilled.add(function () {
    if (this.data.mesh) {
      this.data.mesh.matrixAutoUpdate = false;
      this.data.mesh.visible = false;
    }
  }, this);

  this.renderable = false;
};

BasicEnemy.prototype = Object.create(Phaser.Sprite.prototype);
BasicEnemy.prototype.constructor = BasicEnemy;

BasicEnemy.prototype.update = function() {
  if (this.data.mesh) {
    this.data.mesh.position.set(this.x * WorldScale, 0, this.y * WorldScale);
  }
};

