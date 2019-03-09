const StaminaBarWidth = 96;
const StaminaBarHeight = 16;

const testLongStrikeConfig = {
  name: 'heavy strike',
  state: PlayerState.STRIKE,
  speed: 600,
  decayTime: 90,
  duration: 201,
  staminaCost: 0.411,
  windupSpeed: -40,
  windupTime: 920,
  power: 5
};

const testSmallStrikeConfig = {
  name: 'small strike',
  state: PlayerState.STRIKE,
  speed: 800,
  decayTime: 30,
  duration: 40,
  staminaCost: 0.2,
  windupSpeed: -70,
  windupTime: 100,
  power: 2
};

const testMediumStrikeConfig = {
  name: 'mid strike',
  state: PlayerState.STRIKE,
  speed: 800,
  decayTime: 50,
  duration: 70,
  staminaCost: 0.3,
  windupSpeed: -55,
  windupTime: 250,
  power: 3
};

const testBackstepConfig = {
  name: 'small backstep',
  state: PlayerState.BACKSTEP,
  speed: -600,
  decayTime: 100,
  duration: 50,
  staminaCost: 0.19,
  windupSpeed: undefined,
  windupTime: undefined,
  power: undefined
};

const testBigBackstepConfig = {
  name: 'big backstep',
  state: PlayerState.BACKSTEP,
  speed: -800,
  decayTime: 80,
  duration: 90,
  staminaCost: 0.4,
  windupSpeed: undefined,
  windupTime: undefined,
  power: undefined
};

// randomize me later
const mapSize = 100;

var Gameplay = function () {
  this.player = null;
  this.aButtonItem = null;
  this.bButtonItem = null;
  this.cButtonItem = null;

  this.enemies = null;
  this.items = null;

  this.map = null;
  this.foregroundLayer = null;

  this.seed = '';
  this.levelGenData = { enemies: [], items: [], exit: new Phaser.Point(-1, -1), spawn: new Phaser.Point(-1, -1) };

  this.ui = null;
  this.staminaBarBacking = null;
  this.staminaBar = null;
  this.itemInfoText = null;
  this.weaponInfoText = null;
  this.deathText = null;
};
Gameplay.prototype.shutdown = function() {
  unloadThreeScene();

  this.player = null;
  this.aButtonItem = null;
  this.bButtonItem = null;
  this.cButtonItem = null;

  this.enemies = null;
  this.items = null;

  this.map = null;
  this.foregroundLayer = null;

  this.seed = '';
  this.levelGenData = { enemies: [], items: [], exit: new Phaser.Point(-1, -1), spawn: new Phaser.Point(-1, -1) };

  this.ui = null;
  this.staminaBarBacking = null;
  this.staminaBar = null;
  this.itemInfoText = null;
  this.weaponInfoText = null;
  this.deathText = null;
};

var itemDistReport = {
  big: 0,
  medium: 0,
  short:0 ,

  bigBack:  0,
  smallBack: 0
};

const bigStrikeNames = [
  'ardent',
  'knowing',
  'devoted',
  'comitted',
  'zealous',
  'content',
  'starved',
  'stonelike',
  'finished',
  'dying',
  'lying'
];
const midStrikeNames = [
  'even',
  'anxious',
  'fearful',
  'scarred',
  'cautious',
  'unliving',
  'jaded',
  'pained',
  'coy',
  'untrusting',
  'worshipped',
  'survived',
  'remained',
  'false'
];
const shortStrikeNames = [
  'enraged',
  'sporadic',
  'vigorous',
  'burning',
  'naive',
  'open',
  'turbulent',
  'weak',
  'blind',
  'truthful',
  'mocked',
  'merciful',
  'abandoned'
];

const suffixNames = [
  'wind',
  'heart',
  'pages',
  'foe',
  'beheading',
  'jolt',
  'itch',
  'grounds',
  'icon',
  'scratch'
];

const backStepNames = [
  'rumnating',
  'shocked',
  'fumbling',
  'red',
  'embarassed',
  'apologetic',
  'fraught',
  'hindered',
  'unlovable'
];

const bigBackStepNames = [
  'hateful',
  'cunning',
  'corrupt',
  'obidient',
  'honest',
  'dishonest',
  'attractive',
  'surreal'
];

const deathMessages = [
  'death',
  'it ended',
  'suddenly it all ends',
  'death is inevitable',
  'out of chances'
];


const ShortWindup = 0;
const LongDuration = 1;
const FastSpeed = 2;
const LowStaminaCost = 3; 
const LongDecay = 4;
const HiPower = 5;

Gameplay.prototype.generateItem = function(rng) {
  var t = rng.frac();

  var val = {
  };

  var genName = function (first, second, t, t2) {
    const firstIndex = ~~(t * first.length);
    const secondIndex = ~~(t2 * second.length);
    return first[firstIndex] + ' ' + second[secondIndex];
  };

  if (t < 0.7) {
    val.state = PlayerState.STRIKE;
    const scaledT = rng.frac();
    const subT = rng.frac();
    const subT2 = rng.frac();
    const bonusValue = rng.integerInRange(ShortWindup, HiPower);

    if (scaledT < 0.333) {
      Object.assign(val, testLongStrikeConfig);
      val.name = genName(bigStrikeNames, suffixNames, (subT + (bonusValue / 6.0)) / 2.0, subT2);
    } else if (scaledT < 0.666) {
      Object.assign(val, testSmallStrikeConfig);
      val.name = genName(shortStrikeNames, suffixNames, (subT + (bonusValue / 6.0)) / 2.0, subT2);
    } else {
      Object.assign(val, testMediumStrikeConfig);
      val.name = genName(midStrikeNames, suffixNames, (subT + (bonusValue / 6.0)) / 2.0, subT2);
    }

    switch (bonusValue) {
        case ShortWindup:
        val.windupTime -= 75;
      break;
        case LongDuration:
        val.duration += 70;
      break;
        case FastSpeed:
        val.speed += 100;
      break;
        case LowStaminaCost:
        val.staminaCost -= 0.6;
      break;
        case LongDecay:
        val.decayTime += 50;
      break;
        case HiPower:
        val.power++;
        val.windupTime += rng.realInRange(60, 88);
        val.name = 'enraged ' + val.name;
      break;
    }
  } else {
    val.state = PlayerState.BACKSTEP;
    var scaledT = rng.frac();
    const subT = rng.frac();
    const subT2 = rng.frac();

    if (scaledT < 0.3) {
      Object.assign(val, testBigBackstepConfig);
      val.name = genName(bigBackStepNames, suffixNames, subT, subT2);
    } else {
      Object.assign(val, testBackstepConfig);
      val.name = genName(backStepNames, suffixNames, subT, subT2);
    }
  }

  return val;
};
Gameplay.prototype.init = function(seed) {
  this.seed = seed;
};
Gameplay.prototype.preload = function () {
  this.game.cache.removeTilemap('gen_map');
  this.levelGenData = { enemies: [], items: [], exit: new Phaser.Point(-1, -1), spawn: new Phaser.Point(-1, -1), deathMessage: '' };

  var rng = new Phaser.RandomDataGenerator([this.seed]);
  noise.seed(rng.realInRange(0, 65536));

  var enemySpawnSkew = new Phaser.Matrix();

  this.levelGenData.deathMessage = deathMessages[~~(rng.frac() * deathMessages.length)];

  var posScratchPad = new Phaser.Point();
  var translatedScratchPad = new Phaser.Point();
  var translationMatrix = new Phaser.Matrix();
  translationMatrix.translate(-2000, 0);
  translationMatrix.rotate(Math.PI);
  var mapCsv = '';

  const exitCleanRadius = 6;
  const spawnCleanRadius = 7.6;
  this.levelGenData.exit.x = mapSize - 8;
  this.levelGenData.exit.y = mapSize - 8;
  this.levelGenData.spawn.x = 10;
  this.levelGenData.spawn.y = 10;
  for (var x = 0; x < mapSize; x++) {
    for (var y = 0; y < mapSize; y++) {
      posScratchPad.x = x;
      posScratchPad.y = y;
      translationMatrix.apply(posScratchPad, translatedScratchPad);

      const closeToExit = (posScratchPad.distance(this.levelGenData.exit) < exitCleanRadius);
      const closeToSpawn = (posScratchPad.distance(this.levelGenData.spawn) < spawnCleanRadius);
      const clearFromBothSpawnAndExit = ((closeToExit === false) && (closeToSpawn === false));

      if ((posScratchPad.x === 0) || (posScratchPad.y === 0) || (posScratchPad.x === (mapSize-1)) || (posScratchPad.y === (mapSize-1))) {
        mapCsv += '2';
      } else if ((~~(posScratchPad.x / PillarSpacing) % 2 === 0) && (~~(posScratchPad.y / PillarSpacing) % 2 === 0)) {
        mapCsv += '2';
      } else {
        var valueAt = noise.simplex2(posScratchPad.x / 10, posScratchPad.y / 10);
        if (valueAt > 0.1 && clearFromBothSpawnAndExit) {
          mapCsv += '17';
        } else {
          mapCsv += '-1';

          var itemNoiseValueAt = noise.simplex2(translatedScratchPad.x, translatedScratchPad.y);
          if (itemNoiseValueAt > 0.9 && clearFromBothSpawnAndExit) {
            var newItem = this.generateItem(rng);
            newItem.x = posScratchPad.y;
            newItem.y = posScratchPad.x;
            this.levelGenData.items.push(newItem);
          }

          if (valueAt < -0.899) {
            if (clearFromBothSpawnAndExit) {
              this.levelGenData.enemies.push({ x: posScratchPad.y, y: posScratchPad.x });
            }
          }
        }
      }
        
      if (posScratchPad.y !== (mapSize - 1)) {
        mapCsv += ',';
      }
    }
    mapCsv += '\n';
  }

  this.game.cache.addTilemap('gen_map', null, mapCsv, Phaser.Tilemap.CSV);
}
Gameplay.prototype.create = function() {
  this.player = new Player(this.game, this.levelGenData.spawn.x * GameplayTileSize, this.levelGenData.spawn.y * GameplayTileSize);
  this.player.renderable = false;
  this.player.events.onKilled.add(() => {
    this.deathText.visible = true;

    this.game.time.events.add(2000, () => {
      this.game.state.start('Gameplay');
    });
  });
  this.game.camera.follow(this.player);
  this.game.camera.bounds = null;

  this.enemies = this.game.add.group(undefined, 'enemies');
  this.levelGenData.enemies.forEach(function (enemyData) {
    var enemy = new BasicEnemy(this.game, enemyData.x * GameplayTileSize, enemyData.y * GameplayTileSize, this.player, 5, 940);
    this.enemies.addChild(enemy);
  }, this);
  this.game.physics.enable(this.enemies);

  this.items = this.game.add.group(undefined, 'items');
  this.levelGenData.items.forEach(function (itemData) {
    var item = this.game.add.sprite(itemData.x * GameplayTileSize, itemData.y * GameplayTileSize, 'test_sheet', 1);
    item.renderable = false;
    item.data.info = itemData;
    this.items.addChild(item);
  }, this);
  this.game.physics.enable(this.items);

  this.map = this.game.add.tilemap('gen_map', 32, 32);
  this.map.addTilesetImage('test_sheet_sprite', 'test_sheet_sprite', 32, 32);
  this.foregroundLayer = this.map.createLayer(0);
  this.foregroundLayer.resizeWorld();
  this.map.setCollisionByExclusion([0], true, this.foregroundLayer);
  this.game.physics.enable(this.foregroundLayer, Phaser.Physics.ARCADE);
  this.foregroundLayer.renderable = false;

  this.initalizeUI();

  this.setAButtonConfig(testLongStrikeConfig);
  this.setBButtonConfig(testMediumStrikeConfig);
  this.setCButtonConfig(testSmallStrikeConfig);
  this.refreshWeaponInfoText();

  initalizeThreeScene(this);
};
Gameplay.prototype.initalizeUI = function () {
  this.ui = this.game.add.group();
  this.ui.fixedToCamera = true;

  let jibberize = (bitmapText) => {
    bitmapText.children.forEach(function(letter) {
      var lt = this.game.add.tween(letter.scale);
      lt.to({ y: [ (letter.scale.y), (letter.scale.y * 1.6), letter.scale.y ] }, 200 + (Math.random() * 100), Phaser.Easing.Cubic.InOut, true, Math.random() * 1000, -1);
    }, this);
  };

  const staminaBarSpot = 6;
  this.staminaBarBacking = this.game.add.sprite(staminaBarSpot, staminaBarSpot, 'test_sheet', 17);
  this.staminaBarBacking.tint = 0x999999;
  this.staminaBarBacking.width = StaminaBarWidth;
  this.staminaBarBacking.height = StaminaBarHeight;
  this.ui.addChild(this.staminaBarBacking);
  this.staminaBar = this.game.add.sprite(staminaBarSpot + 2, staminaBarSpot + 2, 'test_sheet', 17);
  this.staminaBar.tint = 0x00FF00;
  this.staminaBar.width = StaminaBarWidth - 4;
  this.staminaBar.height = StaminaBarHeight - 4;
  this.ui.addChild(this.staminaBar);

  this.weaponInfoText = this.game.add.bitmapText(112, staminaBarSpot, 'font', 'Move A: ohhhhhaaaaaaaaaaaaaaaaaaaaaah\n\nMove B: umaaaaaaaaaaaaaaaaaaaaaamm\n\nMove C: ahhaaaaaaaaaaaaaaaaaaaaaah', 7);
  this.ui.addChild(this.weaponInfoText);
  jibberize(this.weaponInfoText);

  this.deathText = this.game.add.bitmapText(this.game.width * 0.5, this.game.height * 0.5, 'font', this.levelGenData.deathMessage, 8);
  this.deathText.align = 'center';
  this.deathText.anchor.set(0.5, 0.5);
  this.deathText.visible = false;
  this.ui.addChild(this.deathText);
  jibberize(this.deathText);

  this.itemInfoText = this.game.add.bitmapText(32, 32, 'font', 'a!aaaaaaaaaaaaaaaaaaaaaaaaaaa\naaaaaaaaaaaaaaaaaaaaaaaaaaaaa\naaaaaaaaaaaaaaaaaaaaaaaaaaaaa\naaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 8);
  jibberize(this.itemInfoText);
  this.itemInfoText.anchor.x = 0.5;
  this.itemInfoText.align = 'center';
  this.ui.addChild(this.itemInfoText);
};
Gameplay.prototype.updateUI = function () {
  this.staminaBar.width = (StaminaBarWidth - 4) * this.player.data.stamina;

  this.itemInfoText.visible = false;
};
Gameplay.prototype.refreshWeaponInfoText = function() {
  this.weaponInfoText.text = 'Move A: ' + this.aButtonItem.name + '\nMove B: ' + this.bButtonItem.name + '\nMove C: ' + this.cButtonItem.name;
}
Gameplay.prototype.setAButtonConfig = function(config) {
  this.player.setAButtonConfig(config);
  this.aButtonItem = config;
};
Gameplay.prototype.setBButtonConfig = function(config) {
  this.player.setBButtonConfig(config);
  this.bButtonItem = config;
};
Gameplay.prototype.setCButtonConfig = function(config) {
  this.player.setCButtonConfig(config);
  this.cButtonItem = config;
};

Gameplay.prototype.update = function() {
  
  const xDist = (this.levelGenData.exit.x * GameplayTileSize) - this.player.x;
  const xDistSqr = xDist * xDist;
  const yDist = (this.levelGenData.exit.y * GameplayTileSize) - this.player.y;
  const yDistSqr = yDist * yDist;
  const minDistToExitSqr = 32 * 32;
  if ((xDistSqr + yDistSqr) < minDistToExitSqr) {
    this.game.state.start('Gameplay');
    return;
  }

	updateThreeScene(this);
  renderThreeScene();

  this.updateUI();

  this.game.physics.arcade.overlap(this.player, this.enemies, function (player, enemy) {
    if (player.data.state === PlayerState.STRIKE) {
      enemy.damage(player.data.powerValue)
    } else {
      player.kill();
    }
  }, undefined, this);
  this.game.physics.arcade.overlap(this.player, this.items, function(player, item) {
    if (player.data.state === PlayerState.NORMAL) {
      this.itemInfoText.visible = true;
      this.itemInfoText.text = item.data.info.name;
      this.itemInfoText.position.set((item.data.mesh.position.x * GameplayTileSize) - this.game.camera.x, 32 + (item.data.mesh.position.z * GameplayTileSize) - this.game.camera.y)

      
        if (this.game.input.keyboard.isDown(Phaser.KeyCode.S)) {
          this.setAButtonConfig(item.data.info);
          this.refreshWeaponInfoText();
          item.data.mesh.visible = false;
          item.data.mesh.matrixAutoUpdate = false;
          item.kill();
        } else if (this.game.input.keyboard.isDown(Phaser.KeyCode.D)) {
          this.setBButtonConfig(item.data.info);
          this.refreshWeaponInfoText();
          item.data.mesh.visible = false;
          item.data.mesh.matrixAutoUpdate = false;
          item.kill();
        } else if (this.game.input.keyboard.isDown(Phaser.KeyCode.F)) {
          this.setCButtonConfig(item.data.info);
          this.refreshWeaponInfoText();
          item.data.mesh.visible = false;
          item.data.mesh.matrixAutoUpdate = false;
          item.kill();
        
      }
    }
  }, undefined, this);
  this.game.physics.arcade.collide(this.enemies, this.foregroundLayer);
  this.game.physics.arcade.collide(this.player, this.foregroundLayer, undefined, function (player, tile) {
    if ((player.data.state === PlayerState.STRIKE) && (tile.index === 17)) {
      if (tile.properties.wallMesh) {
        tile.properties.wallMesh.visible = false;
      }
      this.map.removeTile(tile.x, tile.y, this.foregroundLayer);
      return false;
    }

    return true;
  }, this);
};