var initalizeThreeJS = undefined;
var initalizeThreeShaders = undefined;
var initalizeThreeScene = undefined;
var updateThreeScene = undefined;
var unloadThreeScene = undefined;
var renderThreeScene = undefined;

let threeCanvas = undefined;

(function () {
  var scene = undefined;
  var camera = undefined;
  var renderer = undefined;

  var testMaterial = undefined;

  initalizeThreeJS = function (phaserWebGLContext) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 60, phaserWebGLContext.drawingBufferWidth / phaserWebGLContext.drawingBufferHeight, 0.1, 600 );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(phaserWebGLContext.drawingBufferWidth, phaserWebGLContext.drawingBufferHeight );
    document.body.appendChild( renderer.domElement );
    renderer.domElement.style["z-index"] = -1;
    threeCanvas = renderer.domElement;
  };

  initalizeThreeShaders = function() {
    testMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 1.0 },
        resolution: { value: new THREE.Vector2() }
      },

      vertexShader: `
                      uniform float time;
                      uniform vec2 resolution;

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
                        if (noise(modelViewPosition.xyz * 1.0) > 0.5) {
                          modelViewPosition = modelViewPosition + (vec4(((sin(time * 0.0125 + 2.0)) * noise(modelViewPosition.xyz) * 0.125), 0.0, ((sin(time * 0.0125 + 4.0)) * noise(modelViewPosition.xyz) * 0.125), 0.0));
                        }

                        gl_Position = projectionMatrix * modelViewPosition;
                      }
                    `,
      fragmentShader: `
                        uniform float time;
                        uniform vec2 resolution;
                        void main() {
                          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                        }
                      `
    });
  }

  initalizeThreeScene = function(gameplayState) {
    var boxGeom = new THREE.BoxBufferGeometry( 1, 1, 1, 7, 7, 7 );
    var boxMesh = new THREE.Mesh( boxGeom, testMaterial );
    

    const count = 5;
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 5; j++) {
        var box = boxMesh.clone();
        box.position.x = (i * 3) - ((count * 3) / 2);
        box.position.z = (j * 3) - ((count * 3) / 2);
        scene.add(box);

        var t = gameplayState.game.add.tween(box.position);
        t.to( {x: [box.position.x + Math.random(), box.position.x + Math.random(), box.position.x, box.position.x], z: [box.position.z, box.position.z + Math.random(), box.position.z + Math.random(), box.position.z]}, 2000, Phaser.Easing.Linear.None, true, 0, -1);
      }
    }

    camera.position.y = 10;
    camera.position.z = 5;
    camera.lookAt(0, 0, 0);


  };
  updateThreeScene = function(gameplayState) {
    testMaterial.uniforms.time.value += gameplayState.game.time.elapsed;
    testMaterial.needsUpdate = true;

  };

  renderThreeScene = function () {
    renderer.render( scene, camera );
  };

  unloadThreeScene = function() {
    //
  };
})();