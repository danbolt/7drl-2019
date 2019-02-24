var Gameplay = function () {
  //
};
Gameplay.prototype.create = function() {
  initalizeThreeScene(this);
};
Gameplay.prototype.shutdown = function() {
  unloadThreeScene();
};
Gameplay.prototype.update = function() {
	updateThreeScene(this);
  renderThreeScene();
};