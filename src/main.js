var main = function () {
	console.log('hello, 7drl! 😊');

	var game = new Phaser.Game(320, 240, Phaser.AUTO, undefined, undefined, true, false);
	game.state.add('Preload', Preload, false);
  game.state.add('LoadingScreen', LoadingScreen, false);
  game.state.add('SplashScreen', SplashScreen, false);
  game.state.add('CutSceneScreen', CutSceneScreen, false);
  game.state.add('TitleScreen', TitleScreen, false);
  game.state.add('Gameplay', Gameplay, false);

	game.state.start('Preload');
};
