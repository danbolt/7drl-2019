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



var introLines = [
  {
    line: 'hey kid...'
  },
  {
    line: 'wake up!',
    shock: true
  },
  {
    line: 'i know, i know, it\'s a ' + (new Date().toLocaleString(window.navigator.language, {weekday: 'long'}))
  },
  {
    line: 'but get some\n\n!!! responsibilites !!!\n\nfor once okay?'
  },
  {
    line: '...it\'s like im talking to a child...'
  },
  {
    line: 'ever heard of\nthe amulet of yendor?'
  },
  {
    line: '...huh?',
    shock: true
  },
  {
    line: 'yeah, typical\n\ni figured you\'d be be like that'
  },
  {
    line: '...'
  },
  {
    line: 'i want you to go get\nthat goddamn amulet'
  },
  {
    line: 'dont die though'
  },
  {
    line: '...nerd'
  },
  {
    line: 'you ready?'
  },
];

var winLines = [
  {
    line: 'holy crap!!!!',
    shock: true
  },
  {
    line: 'you actually got the amulet!!!',
    shock: true
  },
  {
    line: '...wow'
  },
  {
    line: 'that\'s too crazy\n\ni totally thought you were\ngoing to die'
  },
  {
    line: '...'
  },
  {
    line: 'anyway, well done'
  },
  {
    line: 'you\'re free to go\n\ni\'ll probably, uh...'
  },
  {
    line: '...put this amulet on the altar'
  },
  {
    line: 'you cool with that moloch?'
  },
  {
    line: '...yeah, no prob...',
    tint: 0xFF0000,
    shock: true
  },
  {
    line: 'cool.'
  },
  {
    line: 'congrats for winning the game!'
  }
];
