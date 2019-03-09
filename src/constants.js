const Epsilon = 0.0001;

const GameplayTileSize = 32;
const WorldScale = ( 1 / GameplayTileSize );

const PillarSpacing = 8;



  let jibberize = (bitmapText, game) => {
    bitmapText.children.forEach(function(letter) {
      var lt = game.add.tween(letter.scale);
      lt.to({ y: [ (letter.scale.y), (letter.scale.y * 1.6), letter.scale.y ] }, 200 + (Math.random() * 100), Phaser.Easing.Cubic.InOut, true, Math.random() * 1000, -1);
    }, this);
  };

  const aButtonKey = Phaser.KeyCode.X;
  const bButtonKey = Phaser.KeyCode.C;
  const cButtonKey = Phaser.KeyCode.V;
  const dButtonKey = Phaser.KeyCode.SHIFT;
  const downKey = Phaser.KeyCode.DOWN;
  const upKey = Phaser.KeyCode.UP;
  const leftKey = Phaser.KeyCode.LEFT;
  const rightKey = Phaser.KeyCode.RIGHT;
