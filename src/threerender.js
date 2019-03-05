var initalizeThreeJS = undefined;
var initalizeThreeShaders = undefined;
var initalizeThreeScene = undefined;
var loadThreeAssets = undefined;
var updateThreeScene = undefined;
var unloadThreeScene = undefined;
var renderThreeScene = undefined;

let threeCanvas = undefined;

var threeModelsLoaded = false;
var threeTexturesLoaded = false;
var threeAllAssetsLoaded = false;

(function () {
  const globalLightDirection = new THREE.Vector3(0.4, -2.0, 0.0, 0.0);
  globalLightDirection.normalize();
  const globalLightAmbiance = new THREE.Vector3(0.1, 0.1, 0.1, 0.0);

  var scene = undefined;
  var camera = undefined;
  var renderer = undefined;

  var playerInWorld = undefined;
  var playerAnimations = undefined;
  var wallsInWorld = [];
  var needUpdateWalls = true;

  var testMaterial = undefined;
  var playerMaterial = undefined;
  var wallMaterial = undefined;
  var enemyMaterial = undefined;

  var modelsToLoad = [
    'player_test'
  ];
  var modelsMap = {};
  var animationsMap = {};

  var texturesToLoad = [
    'player_tex'
  ];
  var texturesMap = {};

  var playerAnimationMixer = undefined;

  // taken from:
  // https://gist.github.com/Anthodpnt/f4ad9127a3c5479d1c0e8ff5ed79078e
  var lerp = function (a, b, n) {
    return (1 - n) * a + n * b;
  }

  initalizeThreeJS = function (phaserWebGLContext) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 60, phaserWebGLContext.drawingBufferWidth / phaserWebGLContext.drawingBufferHeight, 0.1, 600 );

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0.2, 0.2, 0.2), 1.0);
    renderer.setSize(phaserWebGLContext.drawingBufferWidth, phaserWebGLContext.drawingBufferHeight );
    document.body.appendChild( renderer.domElement );
    renderer.domElement.style["z-index"] = -1;
    threeCanvas = renderer.domElement;
  };

  loadThreeAssets = function() {
    var modelsFinishedLoading = 0;
    var ml = new THREE.GLTFLoader();
    modelsToLoad.forEach(function (modelName) {
      ml.load('asset/model/' + modelName + '.gltf', function (gltf) {
        modelsMap[modelName] = gltf.scene;
        animationsMap[modelName] = gltf.animations;
        modelsFinishedLoading++;
        if (modelsFinishedLoading === modelsToLoad.length) {
          threeModelsLoaded = true;
          console.log('done loading three three textures!');

          if (threeTexturesLoaded && threeModelsLoaded) {
            threeAllAssetsLoaded = true;
            initalizeThreeShaders();
            console.log('done loading all assets!');
          }
        }
      });
    }, this);

    var texturesFinishedLoading = 0;
    var tl = new THREE.TextureLoader();
    texturesToLoad.forEach(function (textureName) {
      tl.load('asset/model/' + textureName + '.png', function (loadedTexture) {
        texturesMap[textureName] = loadedTexture;

        texturesFinishedLoading++;
        if (texturesFinishedLoading === texturesToLoad.length) {
          threeTexturesLoaded = true;
          console.log('done loading three images!');

          if (threeTexturesLoaded && threeModelsLoaded) {
            threeAllAssetsLoaded = true;
            initalizeThreeShaders();
            console.log('done loading all assets!');
          }
        }
      });
    }, this);
  };

  initalizeThreeShaders = function() {
    testMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 1.0 },
        lightDirection: { value: globalLightDirection },
        lightAmbiance: { value: globalLightAmbiance },
        ambianceColor: { value: new THREE.Vector4(1.0, 0.0, 0.0, 1.0) }
      },

      vertexShader: `
                      uniform float time;
                      uniform vec3 lightDirection;

                      varying float noiseVal;
                      varying float diffuse;

                      // 3D noise function taken from:
                      // https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
                      float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
                      vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
                      vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
                      float noise(vec3 p){
                          vec3 a = floor(p);
                          vec3 d = p - a;
                          d = d * d * (3.0 - 2.0 * d);

                          vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
                          vec4 k1 = perm(b.xyxy);
                          vec4 k2 = perm(k1.xyxy + b.zzww);

                          vec4 c = k2 + a.zzzz;
                          vec4 k3 = perm(c);
                          vec4 k4 = perm(c + 1.0);

                          vec4 o1 = fract(k3 * (1.0 / 41.0));
                          vec4 o2 = fract(k4 * (1.0 / 41.0));

                          vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
                          vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

                          return o4.y * d.y + o4.x * (1.0 - d.y);
                      }


                      float ps1(float v) {
                        float granularity = 0.05;
                        if (mod(v, granularity) > (granularity * 0.5)) {
                          return floor(v / granularity) * granularity;
                        } else {
                          return ceil(v / granularity) * granularity;
                        }
                        
                      }

                      void main() {
                        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);

                        // warp position
                        noiseVal = noise(modelViewPosition.xyz * ((0.5 * sin(time * 0.0002)) + 1.0));
                        if (noiseVal > 0.5) {
                          modelViewPosition = modelViewPosition + (vec4(((sin(time * 0.012 + 2.0)) * noise(modelViewPosition.xyz) * 0.125), 0.0, ((sin(time * 0.012 + 4.0)) * noise(modelViewPosition.xyz) * 0.12), 0.0));
                        }
                        gl_Position = projectionMatrix * modelViewPosition;
                        gl_Position = vec4(ps1(gl_Position.x), ps1(gl_Position.y), ps1(gl_Position.z), ps1(gl_Position.w));

                        vec4 worldSpaceNormal = modelViewMatrix * vec4(normal, 0.0);
                        // diffuse calculation
                        diffuse = max(dot((lightDirection * -1.0), worldSpaceNormal.xyz), 0.0);
                      }
                    `,
      fragmentShader: `
                        uniform float time;
                        uniform vec4 lightAmbiance;
                        uniform vec4 ambianceColor;

                        varying float noiseVal;
                        varying float diffuse;

                        void main() {
                          vec3 noiseColor = ambianceColor.xyz * noiseVal;

                          float clampedDiffuse = diffuse;
                          if (diffuse > 0.7) {
                            clampedDiffuse = 1.0;
                          } else if (diffuse > 0.45) {
                            clampedDiffuse = 0.7;
                          } else if (diffuse > 0.2) {
                            clampedDiffuse = 0.3;
                          } else {
                            clampedDiffuse = 0.18;
                          }
                          gl_FragColor = vec4(clampedDiffuse * noiseColor, 1.0) + lightAmbiance;
                        }
                      `
    });

    playerMaterial = testMaterial.clone();
    playerMaterial.uniforms.ambianceColor.value.set(0.0, 1.0, 1.0, 1.0);
    playerMaterial.needsUpdate = true;

    wallMaterial = testMaterial.clone();
    wallMaterial.uniforms.ambianceColor.value.set(0.6, 0.6, 0.6, 1.0);
    wallMaterial.needsUpdate = true;

    enemyMaterial = testMaterial.clone();
    enemyMaterial.uniforms.ambianceColor.value.set(0.9, 0.8, 0.0, 1.0);
    enemyMaterial.needsUpdate = true;
  }

  var initializePlayerGeom = function() {
    var boxGeom = new THREE.BoxBufferGeometry( 1.0, 1.0, 1.0, 3, 3, 3);
    var boxMesh = new THREE.Mesh( boxGeom, playerMaterial );

    var playerMesh = modelsMap['player_test'];

    var torsoBone = playerMesh.getObjectByName('Armature001_Bone016');
    var torso = new THREE.Mesh(boxGeom, playerMaterial);
    torso.scale.x = 0.5;
    torso.scale.z = 0.5;
    torsoBone.add(torso);

    var gutBone = playerMesh.getObjectByName('Armature001_Bone015');
    var gut = new THREE.Mesh(boxGeom, playerMaterial);
    gut.scale.y = 0.5;
    gut.scale.z = 0.5;
    gutBone.add(gut);

    var leftFootBone = playerMesh.getObjectByName('Armature001_Bone029');
    var leftFoot = new THREE.Mesh(boxGeom, playerMaterial);
    leftFoot.scale.set(0.4, 0.4, 0.4);
    leftFootBone.add(leftFoot);

    var rightFootBone = playerMesh.getObjectByName('Armature001_Bone004');
    var rightFoot = new THREE.Mesh(boxGeom, playerMaterial);
    rightFoot.scale.set(0.4, 0.4, 0.4);
    rightFootBone.add(rightFoot);

    var leftHandBone = playerMesh.getObjectByName('Armature001_Bone020');
    var leftHand = new THREE.Mesh(boxGeom, playerMaterial);
    leftHand.scale.set(0.4, 0.4, 0.4);
    leftHandBone.add(leftHand);

    var rightHandBone = playerMesh.getObjectByName('Armature001_Bone009');
    var rightHand = new THREE.Mesh(boxGeom, playerMaterial);
    rightHand.scale.set(0.4, 0.4, 0.4);
    rightHandBone.add(rightHand);

    var leftShoulderBone = playerMesh.getObjectByName('Armature001_Bone018');
    var leftShoulder = new THREE.Mesh(boxGeom, playerMaterial);
    leftShoulder.scale.set(0.5, 0.4, 0.4);
    leftShoulderBone.add(leftShoulder);

    var rightShoulderBone = playerMesh.getObjectByName('Armature001_Bone007');
    var rightShoulder = new THREE.Mesh(boxGeom, playerMaterial);
    rightShoulder.scale.set(0.5, 0.4, 0.4);
    rightShoulderBone.add(rightShoulder);

    var headBone = playerMesh.getObjectByName('Armature001_Bone013');
    var head = new THREE.Mesh(boxGeom, playerMaterial);
    head.scale.set(0.7, 0.7, 0.7);
    headBone.add(head);

    var ponyTailBone = playerMesh.getObjectByName('Armature001_Bone014');
    var ponyTail = new THREE.Mesh(boxGeom, playerMaterial);
    ponyTail.scale.set(0.4, 1.0, 0.3);
    ponyTailBone.add(ponyTail);

  };
  initalizeThreeScene = function(gameplayState) {
    var boxGeom = new THREE.BoxBufferGeometry( 1.0, 1.0, 1.0, 3, 3, 3);
    var boxMesh = new THREE.Mesh( boxGeom, testMaterial );

    var playerMesh = modelsMap['player_test'];
    scene.add(playerMesh);
    playerInWorld = playerMesh;
    playerMesh.scale.set(0.7, 0.7, 0.7);
    gameplayState.player.data.mesh = playerMesh;

    playerAnimations = {};
    playerAnimationMixer = new THREE.AnimationMixer(playerMesh);
    var idleClip = THREE.AnimationClip.findByName(animationsMap['player_test'], "Idle");
    var idleAction = playerAnimationMixer.clipAction(idleClip);
    idleAction.setLoop(THREE.LoopRepeat, 1000);
    idleAction.clampWhenFinished = true;
    playerAnimations["Idle"] = idleAction;
    var dashClip = THREE.AnimationClip.findByName(animationsMap['player_test'], "Dash");
    var dashAction = playerAnimationMixer.clipAction(dashClip);
    dashAction.setLoop(THREE.LoopRepeat, 1000);
    dashAction.clampWhenFinished = true;
    dashAction.timeScale = 2.1;
    playerAnimations["Dash"] = dashAction;
    playerAnimations["Idle"].play();
    initializePlayerGeom();

    var testEnemyGeom = new THREE.SphereBufferGeometry(1, 5, 5);
    gameplayState.enemies.forEach(function (enemy) {
      var enemyMesh = new THREE.Mesh(testEnemyGeom, enemyMaterial);
      enemyMesh.position.set(enemy.x * WorldScale, 0, enemy.y * WorldScale);
      scene.add(enemyMesh);
      enemy.data.mesh = enemyMesh;
    }, this);

    // uncomment this for animation debugging
    //var helper = new THREE.SkeletonHelper( playerMesh );
    //helper.material.linewidth = 3;
    //scene.add( helper );

    needUpdateWalls = true;
    const mapWidth = gameplayState.map.width;
    const mapHeight = gameplayState.map.height;
    for (var x = 0; x < mapWidth; x++) {
      for (var y = 0; y < mapHeight; y++) {
        var tileAt = gameplayState.map.getTile(x, y, gameplayState.foregroundLayer);
        if ((tileAt != null) && (tileAt.index > 0)) {
          if (tileAt.index === 17) {
            var newWallBox = new THREE.Mesh(boxGeom, testMaterial);
            newWallBox.position.set(x, 0, y);
            scene.add(newWallBox);
            wallsInWorld.push(newWallBox);
            tileAt.properties.wallMesh = newWallBox;
          } else {
            if (tileAt.index === 2) {
              var newWallBox = new THREE.Mesh(boxGeom, wallMaterial);
              newWallBox.scale.set(1, 25, 1);
              newWallBox.position.set(x, 12.5, y);
              scene.add(newWallBox);
              wallsInWorld.push(newWallBox);
              tileAt.properties.wallMesh = newWallBox;
            }
          }
        }
      }
    }

    camera.position.y = 9.3;
  };
  updateThreeScene = function(gameplayState) {
    testMaterial.uniforms.time.value += gameplayState.game.time.elapsed;
    testMaterial.needsUpdate = true;
    playerMaterial.uniforms.time.value += gameplayState.game.time.elapsed;
    playerMaterial.needsUpdate = true;
    wallMaterial.uniforms.time.value += gameplayState.game.time.elapsed;
    wallMaterial.needsUpdate = true;
    enemyMaterial.uniforms.time.value += gameplayState.game.time.elapsed;
    enemyMaterial.needsUpdate = true;

    if (gameplayState.player.data.moveDirection.getMagnitudeSq() > Epsilon) {
      playerAnimations["Idle"].stop();
      playerAnimations["Dash"].play();
    } else {
      playerAnimations["Dash"].stop();
      playerAnimations["Idle"].play();
    }
    playerAnimationMixer.update(gameplayState.game.time.elapsed / 1000);

    playerInWorld.position.x = (gameplayState.player.x - gameplayState.player.width * 0.5) * WorldScale;
    playerInWorld.position.y = 0;
    playerInWorld.position.z = (gameplayState.player.y - gameplayState.player.height * 0.5) * WorldScale;
    playerInWorld.rotation.y = (gameplayState.player.rotation - (Math.PI * 0.5)) * -1;
    
    var targetX = (gameplayState.game.camera.x + (gameplayState.game.width * 0.5)) *  WorldScale;
    var targetZ = (gameplayState.game.camera.y + (gameplayState.game.height * 0.5)) * WorldScale + 3;

    const pillarSpotX = targetX / PillarSpacing;
    const pillarSpotY = targetZ / PillarSpacing;
    if ((~~(pillarSpotX) % 2 === 0) && (~~(pillarSpotY) % 2 === 0)) {
      targetZ -= ((pillarSpotY - Math.floor(pillarSpotY)) * PillarSpacing) + 0.4;

      camera.position.y = 10.5;
    } else {
      camera.position.y = 9.3;
    }

    camera.position.x = lerp(camera.position.x, targetX, 0.25);
    camera.position.z = lerp(camera.position.z, targetZ, 0.25);

    camera.lookAt(playerInWorld.position.x, 0, playerInWorld.position.z);
  };

  renderThreeScene = function () {
    renderer.render( scene, camera );

    if (needUpdateWalls) {
      for (var i = 0; i < wallsInWorld.length; i++) {
        wallsInWorld[i].matrixAutoUpdate = false;
      }
      needUpdateWalls = false;
    }
  };

  unloadThreeScene = function() {
    playerInWorld = null;
    wallsInWorld = [];
  };
})();