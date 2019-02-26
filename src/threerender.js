var initalizeThreeJS = undefined;
var initalizeThreeShaders = undefined;
var initalizeThreeScene = undefined;
var updateThreeScene = undefined;
var unloadThreeScene = undefined;
var renderThreeScene = undefined;

let threeCanvas = undefined;

(function () {
  const globalLightDirection = new THREE.Vector3(1.0, -1.0, 0.0, 0.0);
  globalLightDirection.normalize();
  const globalLightAmbiance = new THREE.Vector3(0.0, 0.2, 0.0, 0.0);

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
        lightDirection: { value: globalLightDirection },
        lightAmbiance: { value: globalLightAmbiance }
      },

      vertexShader: `
                      uniform float time;
                      uniform vec3 lightDirection;

                      varying float noiseVal;
                      varying vec3 diffuse;

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

                        // diffuse calculation
                        float diff = max(dot((lightDirection * -1.0), normal), 0.0);
                        diffuse = diff * vec3(1.0, 1.0, 1.0);
                      }
                    `,
      fragmentShader: `
                        uniform float time;
                        uniform vec4 lightAmbiance;

                        varying float noiseVal;
                        varying vec3 diffuse;

                        void main() {
                          vec3 noiseColor = vec3(1.0, 0.0, noiseVal * (sin(time * 0.01) * 0.5 + 1.0));
                          gl_FragColor = vec4(diffuse * noiseColor, 1.0) + lightAmbiance;
                        }
                      `
    });
  }

  initalizeThreeScene = function(gameplayState) {
    var boxGeom = new THREE.SphereBufferGeometry( 0.8, 8, 8);
    var boxMesh = new THREE.Mesh( boxGeom, testMaterial );
    

    const count = 10;
    for (var i = 0; i < count; i++) {
      for (var j = 0; j < count; j++) {
        var box = boxMesh.clone();
        box.position.x = (i * 2) - (count / 1.5);
        box.position.z = (j * 2) - (count / 1.5);
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
    testMaterial.needsUpdate = true;

  };

  renderThreeScene = function () {
    renderer.render( scene, camera );
  };

  unloadThreeScene = function() {
    //
  };
})();