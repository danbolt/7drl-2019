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
  const globalLightDirection = new THREE.Vector3(1.0, -2.0, 0.0, 0.0);
  globalLightDirection.normalize();
  const globalLightAmbiance = new THREE.Vector3(0.1, 0.1, 0.1, 0.0);

  var scene = undefined;
  var camera = undefined;
  var renderer = undefined;

  var playerInWorld = undefined;
  var playerAnimations = undefined;

  var testMaterial = undefined;
  var texturedPlayerMatieral = undefined;

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

  initalizeThreeJS = function (phaserWebGLContext) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 60, phaserWebGLContext.drawingBufferWidth / phaserWebGLContext.drawingBufferHeight, 0.1, 600 );

    renderer = new THREE.WebGLRenderer();
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
        lightAmbiance: { value: globalLightAmbiance }
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

                      void main() {
                        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);

                        // warp position
                        noiseVal = noise(modelViewPosition.xyz * 1.0);
                        if (noiseVal > 0.5) {
                          modelViewPosition = modelViewPosition + (vec4(((sin(time * 0.0125 + 2.0)) * noise(modelViewPosition.xyz) * 0.125), 0.0, ((sin(time * 0.0125 + 4.0)) * noise(modelViewPosition.xyz) * 0.125), 0.0));
                        }
                        gl_Position = projectionMatrix * modelViewPosition;

                        vec4 worldSpaceNormal = modelViewMatrix * vec4(normal, 0.0);
                        // diffuse calculation
                        diffuse = max(dot((lightDirection * -1.0), worldSpaceNormal.xyz), 0.0);
                      }
                    `,
      fragmentShader: `
                        uniform float time;
                        uniform vec4 lightAmbiance;

                        varying float noiseVal;
                        varying float diffuse;

                        void main() {
                          vec3 noiseColor = vec3(1.0, 0.0, noiseVal * (sin(time * 0.01) * 0.5 + 1.0));

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

    texturedPlayerMatieral = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 1.0 },
        lightDirection: { value: globalLightDirection },
        lightAmbiance: { value: new THREE.Vector4(0.2, 0.2, 0.2, 0.0) },
        playerTex: { value: texturesMap['player_tex'] }
      },

      vertexShader: `
                      uniform float time;
                      uniform vec3 lightDirection;

                      varying float noiseVal;
                      varying float diffuse;
                      varying vec2 uVu;

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

                      void main() {
                        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_Position = projectionMatrix * modelViewPosition;

                        vec4 worldSpaceNormal = vec4(normal, 0.0) * modelViewMatrix;

                        // diffuse calculation
                        diffuse = max(dot((lightDirection * -1.0), worldSpaceNormal.xyz) + 0.5, 0.0) / 1.5;

                        uVu = uv;
                      }
                    `,
      fragmentShader: `
                        uniform float time;
                        uniform vec4 lightAmbiance;
                        uniform sampler2D playerTex;

                        varying float noiseVal;
                        varying float diffuse;
                        varying vec2 uVu;

                        void main() {
                          vec3 noiseColor = vec3(1.0, 0.0, noiseVal * (sin(time * 0.01) * 0.5 + 1.0));
                          vec4 texColor = texture2D(playerTex, uVu);

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
                          gl_FragColor = (clampedDiffuse * texColor) + lightAmbiance;
                        }
                      `
    });
  }

  initalizeThreeScene = function(gameplayState) {
    var boxGeom = new THREE.SphereBufferGeometry( 0.3, 8, 8);
    var boxMesh = new THREE.Mesh( boxGeom, testMaterial );

    var playerBones = [];
    var playerMesh = modelsMap['player_test'];
    scene.add(playerMesh);
    playerInWorld = playerMesh;

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
    playerAnimations["Dash"] = dashAction;

    playerAnimations["Idle"].play();

    var leftHandBone = playerMesh.getObjectByName('Armature001_Bone020');
    var leftHand = new THREE.Mesh(boxGeom, testMaterial);
    leftHandBone.add(leftHand);

    var rightHandBone = playerMesh.getObjectByName('Armature001_Bone009');
    var rightHand = new THREE.Mesh(boxGeom, testMaterial);
    rightHandBone.add(rightHand);

    var helper = new THREE.SkeletonHelper( playerMesh );
    helper.material.linewidth = 3;
    scene.add( helper );

    const count = 10;
    for (var i = 0; i < count; i++) {
      for (var j = 0; j < count; j++) {
        var box = boxMesh.clone();
        box.position.x = (i * 2) - (count / 1.5);
        box.position.z = (j * 2) - (count / 1.5);
        box.position.y = -2;
        scene.add(box);

        var t = gameplayState.game.add.tween(box.position);
        t.to( {x: [box.position.x + Math.random() * 0.2, box.position.x + Math.random() * 0.2, box.position.x, box.position.x], z: [box.position.z, box.position.z + Math.random() * 0.2, box.position.z + Math.random() * 0.2, box.position.z]}, 2000, Phaser.Easing.Linear.None, true, 0, -1);
      }
    }

    camera.position.y = 10;
    camera.position.z = 5;
    camera.lookAt(0, 0, 0);
  };
  updateThreeScene = function(gameplayState) {
    testMaterial.uniforms.time.value += gameplayState.game.time.elapsed;
    testMaterial.uniforms.lightDirection.value.x = Math.sin(gameplayState.game.time.now * 0.005) ;
    testMaterial.uniforms.lightDirection.value.y = -2;
    testMaterial.uniforms.lightDirection.value.z = 0.0;
    testMaterial.uniforms.lightDirection.value.normalize();
    testMaterial.needsUpdate = true;

    if (gameplayState.player.data.moveDirection.getMagnitudeSq() > Epsilon) {
      playerAnimations["Idle"].stop();
      playerAnimations["Dash"].play();
    } else {
      playerAnimations["Dash"].stop();
      playerAnimations["Idle"].play();
    }
    playerAnimationMixer.update(gameplayState.game.time.elapsed / 1000);

    playerInWorld.position.x = gameplayState.player.x;
    playerInWorld.position.z = gameplayState.player.y;
    playerInWorld.rotation.y = (gameplayState.player.rotation - (Math.PI * 0.5)) * -1;
    camera.position.x = gameplayState.game.camera.x + (gameplayState.game.width * 0.5);
    camera.position.z = gameplayState.game.camera.y + 5 + (gameplayState.game.height * 0.5);
    camera.lookAt(playerInWorld.position.x, 0, playerInWorld.position.z);
  };

  renderThreeScene = function () {
    renderer.render( scene, camera );
  };

  unloadThreeScene = function() {
    //
  };
})();