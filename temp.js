
        // --- SPATIAL SOLAR SYSTEM DATA MODEL ---
        const SPACING = 25; // Distance between planets on X-axis

        const SOLAR_SYSTEM = [
            {
                name: "Sun", type: "Yellow Dwarf Star", shaderType: 0, color: "#FFB800", radius: 5.0,
                diameter: "1,392,700 km", moons: "0", distance: "0 AU", funFact: "The Sun contains 99.86% of the mass in the entire solar system."
            },
            {
                name: "Mercury", type: "Terrestrial Planet", shaderType: 1, color: "#B0B0B0", radius: 1.5,
                diameter: "4,880 km", moons: "0", distance: "0.39 AU", funFact: "Despite being closest to the Sun, Mercury is not the hottest planet."
            },
            {
                name: "Venus", type: "Terrestrial Planet", shaderType: 1, color: "#E6B873", radius: 2.0,
                diameter: "12,104 km", moons: "0", distance: "0.72 AU", funFact: "Venus spins in the opposite direction to most planets."
            },
            {
                name: "Earth", type: "Terrestrial Planet", shaderType: 1, color: "#3B82F6", radius: 2.1,
                diameter: "12,742 km", moons: "1", distance: "1.00 AU", funFact: "Earth is the only planet not named after a mythological god or goddess."
            },
            {
                name: "Mars", type: "Terrestrial Planet", shaderType: 1, color: "#EF4444", radius: 1.7,
                diameter: "6,779 km", moons: "2", distance: "1.52 AU", funFact: "Mars is home to Olympus Mons, the tallest mountain in the solar system."
            },
            {
                name: "Jupiter", type: "Gas Giant", shaderType: 2, color: "#D97757", radius: 4.5,
                diameter: "139,820 km", moons: "95", distance: "5.20 AU", funFact: "Jupiter's Great Red Spot is a giant storm bigger than Earth."
            },
            {
                name: "Saturn", type: "Gas Giant", shaderType: 2, color: "#FCD34D", radius: 3.5, hasRings: true,
                diameter: "116,460 km", moons: "146", distance: "9.58 AU", funFact: "Saturn has the most extensive ring system of any planet."
            },
            {
                name: "Uranus", type: "Ice Giant", shaderType: 3, color: "#67E8F9", radius: 2.8,
                diameter: "50,724 km", moons: "28", distance: "19.18 AU", funFact: "Uranus rotates on its side, with an axial tilt of 98 degrees."
            },
            {
                name: "Neptune", type: "Ice Giant", shaderType: 3, color: "#3730A3", radius: 2.7,
                diameter: "49,244 km", moons: "16", distance: "30.07 AU", funFact: "Winds on Neptune can reach up to 2,100 km/h, the fastest in the solar system."
            }
        ];

        // --- SHADERS ---
        const planetVertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const planetFragmentShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 baseColor;
            uniform float time;
            uniform float tension;
            uniform int type;

            float hash(vec3 p) {
                p = fract(p * 0.3183099 + .1);
                p *= 17.0;
                return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }
            float noise(vec3 x) {
                vec3 i = floor(x);
                vec3 f = fract(x);
                f = f * f * (3.0 - 2.0 * f);
                return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                               mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                           mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                               mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
            }
            float fbm(vec3 p) {
                float f = 0.0;
                f += 0.5000 * noise(p); p = p * 2.02;
                f += 0.2500 * noise(p); p = p * 2.03;
                f += 0.1250 * noise(p);
                return f;
            }

            void main() {
                vec3 color = baseColor;
                float n = 0.0;
                
                float t = time * (0.2 + (1.0 - tension) * 2.0);

                if (type == 0) { 
                    n = fbm(vPosition * 1.5 + t * 0.5);
                    color = mix(baseColor, vec3(1.0, 0.9, 0.6), n); 
                } else if (type == 1) { 
                    n = fbm(vPosition * 1.5 + t * 0.05);
                    vec3 landColor = baseColor * 0.4;
                    color = mix(baseColor, landColor, smoothstep(0.4, 0.6, n));
                } else if (type == 2) { 
                    n = fbm(vec3(vPosition.x * 1.5, vPosition.y * 6.0, vPosition.z * 1.5) + vec3(t * 0.2, 0.0, 0.0));
                    color = mix(baseColor * 0.6, baseColor * 1.4, n);
                } else if (type == 3) { 
                    n = fbm(vPosition * 2.0 + t * 0.1);
                    color = mix(baseColor, vec3(0.9, 0.9, 1.0), n * 0.5);
                }

                vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
                if (type == 0) lightDir = normalize(vNormal); 
                
                float diff = max(dot(vNormal, lightDir), 0.0);
                vec3 finalColor = color * (0.3 + diff * 0.7); 
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        const auraVertexShader = `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const auraFragmentShader = `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldPosition;
            uniform vec3 color;
            uniform float tension;

            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                // Sun is at origin (0,0,0)
                vec3 lightDir = normalize(-vWorldPosition);
                
                // Fresnel for edge glow
                float fresnel = dot(viewDir, normal);
                fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
                fresnel = pow(fresnel, 3.0);
                
                // Volumetric Atmospheric Scattering approximation
                float lightDot = dot(normal, lightDir);
                float wrap = 0.5; // Soft wrap lighting for atmosphere
                float scatter = max(0.0, (lightDot + wrap) / (1.0 + wrap));
                scatter = smoothstep(0.0, 1.0, scatter);
                
                // Sunset terminator effect (shift to orange/red)
                vec3 sunsetColor = mix(vec3(1.0, 0.4, 0.0), color, scatter);
                
                // If this is the Sun (distance to origin < 10), it's always fully lit
                float distToSun = length(vWorldPosition);
                if (distToSun < 10.0) {
                    scatter = 1.0;
                    sunsetColor = color;
                }
                
                float intensity = 0.2 + (1.0 - tension) * 1.0;
                
                // Final atmospheric glow
                gl_FragColor = vec4(sunsetColor, fresnel * scatter * intensity * 1.5);
            }
        `;

        // --- APP STATE & GLOBALS ---
        let scene, camera, renderer, controls, composer;
        let starParticles;
        const planetObjects = []; 
        
        let currentPlanetIndex = 0;
        let targetCamPos = new THREE.Vector3(0, 3, 18);
        let targetLookAt = new THREE.Vector3(0, 0, 0);

        let handTension = 1.0; 
        let targetHandTension = 1.0;
        let time = 0;
        let lastDetectionTime = 0;
        
        const ZONE_LEFT  = 'LEFT';
        const ZONE_CENTER= 'CENTER';
        const ZONE_RIGHT = 'RIGHT';
        let handZone = ZONE_CENTER;    
        let navigationArmed = true;    
        let lastNavTime = 0;           

        let audioCtx, oscillator, osc2, osc3, gainNode, filterNode;
        let isAudioPlaying = false;

        initThreeJS();
        initUI();
        initMediaPipe();
        
        document.getElementById('start-overlay').addEventListener('click', function() {
            this.style.opacity = '0';
            setTimeout(() => this.style.display = 'none', 500);
            startAudio();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        });

        function startAudio() {
            if (isAudioPlaying) return;
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                gainNode = audioCtx.createGain();
                gainNode.gain.value = 0.05; 
                filterNode = audioCtx.createBiquadFilter();
                filterNode.type = 'lowpass';
                filterNode.frequency.value = 800; 
                gainNode.connect(filterNode);
                filterNode.connect(audioCtx.destination);
                oscillator = audioCtx.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.value = 261.63; 
                oscillator.connect(gainNode);
                oscillator.start();
                osc2 = audioCtx.createOscillator();
                osc2.type = 'sine';
                osc2.frequency.value = 329.63; 
                osc2.connect(gainNode);
                osc2.start();
                osc3 = audioCtx.createOscillator();
                osc3.type = 'sine';
                osc3.frequency.value = 392.00; 
                osc3.connect(gainNode);
                osc3.start();
                isAudioPlaying = true;
            } catch (e) {
                console.log("Audio synthesis not supported.");
            }
        }

        function createStarTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(8, 8, 4, 0, Math.PI * 2);
            ctx.fill();
            return new THREE.CanvasTexture(canvas);
        }

        function createRingTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            // Base color
            ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
            ctx.fillRect(0, 0, 1, 256);
            
            // Draw procedural ring bands
            for (let i = 0; i < 256; i++) {
                let opacity = Math.random() * 0.8 + 0.1;
                // Create gaps and divisions
                if (Math.random() < 0.15) opacity = 0.0; 
                // Simulate Cassini division
                if (i > 180 && i < 200) opacity = 0.0; 
                
                ctx.clearRect(0, i, 1, 1);
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.fillRect(0, i, 1, 1);
            }
            
            return new THREE.CanvasTexture(canvas);
        }

        let ringTexture; // Will hold the generated texture

        function initThreeJS() {
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x050508, 0.015);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.copy(targetCamPos);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;
            
            // Enable Shadows
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            document.getElementById('canvas-container').appendChild(renderer.domElement);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.8;
            controls.enablePan = false;
            controls.minDistance = 5;
            controls.maxDistance = 40;
            controls.target.copy(targetLookAt);

            // Generate Solid Planets
            const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
            
            SOLAR_SYSTEM.forEach((planetData, index) => {
                const pivot = new THREE.Group();
                pivot.position.x = index * SPACING;
                
                // Procedural PBR Material
                const material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(planetData.color),
                    roughness: 0.7,
                    metalness: 0.1
                });

                if (planetData.shaderType === 0) { // Sun
                    material.emissive = new THREE.Color(planetData.color);
                    material.emissiveIntensity = 2.0;
                }

                material.onBeforeCompile = (shader) => {
                    shader.uniforms.time = { value: 0 };
                    shader.uniforms.tension = { value: 1.0 };
                    shader.uniforms.type = { value: planetData.shaderType };
                    
                    shader.vertexShader = `
                        varying vec3 vPosition;
                        ${shader.vertexShader}
                    `.replace(
                        `#include <begin_vertex>`,
                        `#include <begin_vertex>
                        vPosition = position;`
                    );

                    shader.fragmentShader = `
                        uniform float time;
                        uniform float tension;
                        uniform int type;
                        varying vec3 vPosition;

                        float hash(vec3 p) {
                            p = fract(p * 0.3183099 + .1);
                            p *= 17.0;
                            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
                        }
                        float noise(vec3 x) {
                            vec3 i = floor(x);
                            vec3 f = fract(x);
                            f = f * f * (3.0 - 2.0 * f);
                            return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                                           mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                                       mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                                           mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
                        }
                        float fbm(vec3 p) {
                            float f = 0.0;
                            f += 0.5000 * noise(p); p = p * 2.02;
                            f += 0.2500 * noise(p); p = p * 2.03;
                            f += 0.1250 * noise(p);
                            return f;
                        }

                        ${shader.fragmentShader}
                    `.replace(
                        `#include <color_fragment>`,
                        `#include <color_fragment>
                        
                        vec3 baseColor = diffuseColor.rgb;
                        float n = 0.0;
                        float t = time * (0.2 + (1.0 - tension) * 2.0);

                        if (type == 0) { 
                            n = fbm(vPosition * 1.5 + t * 0.5);
                            diffuseColor.rgb = mix(baseColor, vec3(1.0, 0.9, 0.6), n); 
                        } else if (type == 1) { 
                            n = fbm(vPosition * 1.5 + t * 0.05);
                            vec3 landColor = baseColor * 0.4;
                            diffuseColor.rgb = mix(baseColor, landColor, smoothstep(0.4, 0.6, n));
                        } else if (type == 2) { 
                            n = fbm(vec3(vPosition.x * 1.5, vPosition.y * 6.0, vPosition.z * 1.5) + vec3(t * 0.2, 0.0, 0.0));
                            diffuseColor.rgb = mix(baseColor * 0.6, baseColor * 1.4, n);
                        } else if (type == 3) { 
                            n = fbm(vPosition * 2.0 + t * 0.1);
                            diffuseColor.rgb = mix(baseColor, vec3(0.9, 0.9, 1.0), n * 0.5);
                        }
                        `
                    );
                    material.userData.shader = shader;
                };

                const mesh = new THREE.Mesh(sphereGeo, material);
                mesh.scale.setScalar(planetData.radius);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                pivot.add(mesh);
                
                // Aura / Atmosphere
                const auraMaterial = new THREE.ShaderMaterial({
                    vertexShader: auraVertexShader,
                    fragmentShader: auraFragmentShader,
                    uniforms: {
                        color: { value: new THREE.Color(planetData.color) },
                        tension: { value: 1.0 }
                    },
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.BackSide 
                });
                
                const auraMesh = new THREE.Mesh(sphereGeo, auraMaterial);
                auraMesh.scale.setScalar(planetData.radius * 1.15); // Slightly larger
                pivot.add(auraMesh);

                // Saturn's Rings
                if (planetData.hasRings) {
                    if (!ringTexture) ringTexture = createRingTexture();
                    
                    const ringGeo = new THREE.RingGeometry(planetData.radius * 1.4, planetData.radius * 2.2, 64);
                    
                    // Modify UVs so the 1D texture maps from inner to outer radius
                    const posAttribute = ringGeo.attributes.position;
                    const uvAttribute = ringGeo.attributes.uv;
                    for (let i = 0; i < posAttribute.count; i++) {
                        const vertex = new THREE.Vector3().fromBufferAttribute(posAttribute, i);
                        const distance = vertex.length();
                        const normalizedDistance = (distance - planetData.radius * 1.4) / (planetData.radius * 2.2 - planetData.radius * 1.4);
                        uvAttribute.setY(i, normalizedDistance);
                    }

                    const ringMat = new THREE.MeshStandardMaterial({ 
                        color: planetData.color, 
                        map: ringTexture,
                        alphaMap: ringTexture,
                        side: THREE.DoubleSide, 
                        transparent: true, 
                        opacity: 0.9,
                        roughness: 0.8
                    });
                    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
                    ringMesh.rotation.x = Math.PI / 2 + 0.3; // Tilt
                    ringMesh.castShadow = true;
                    ringMesh.receiveShadow = true;
                    pivot.add(ringMesh);
                }

                scene.add(pivot);
                planetObjects.push({ pivot, mesh, aura: auraMesh, data: planetData });
            });

            // Background Stars
            const starGeo = new THREE.BufferGeometry();
            const starCount = 8000;
            const starPos = new Float32Array(starCount * 3);
            for(let i=0; i<starCount; i++) {
                starPos[i*3] = (Math.random() * 400) - 100;
                starPos[i*3+1] = (Math.random() - 0.5) * 300;
                starPos[i*3+2] = (Math.random() - 0.5) * 300 - 50;
            }
            starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
            const starMat = new THREE.PointsMaterial({
                size: 1.0,
                color: 0xffffff,
                transparent: true,
                opacity: 0.5,
                map: createStarTexture(),
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            starParticles = new THREE.Points(starGeo, starMat);
            scene.add(starParticles);

            // Lighting Setup
            const ambientLight = new THREE.AmbientLight(0x0a0a14, 0.5);
            scene.add(ambientLight);

            const sunLight = new THREE.PointLight(0xffeedd, 4.0, 500);
            sunLight.position.set(0, 0, 0); // Sun is at origin
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.bias = -0.001;
            scene.add(sunLight);

            // Post-Processing Setup
            const renderScene = new THREE.RenderPass(scene, camera);
            const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
            bloomPass.threshold = 0.5;
            bloomPass.strength = 1.2; 
            bloomPass.radius = 0.5;

            composer = new THREE.EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);

            window.addEventListener('resize', onWindowResize, false);
            
            updateUIInfo();
            animate();
        }

        function initUI() {
            const dotsContainer = document.getElementById('nav-dots');
            SOLAR_SYSTEM.forEach((planet, index) => {
                const dot = document.createElement('div');
                dot.className = `nav-dot ${index === 0 ? 'active' : ''}`;
                dotsContainer.appendChild(dot);
            });
        }

        function flyToPlanet(index) {
            if (index < 0 || index >= SOLAR_SYSTEM.length) return;
            currentPlanetIndex = index;
            
            updateUIInfo();
            
            const targetX = currentPlanetIndex * SPACING;
            
            targetCamPos.set(targetX, 3, 18);
            targetLookAt.set(targetX, 0, 0);
            
            const targetColorHex = SOLAR_SYSTEM[currentPlanetIndex].color;
            document.documentElement.style.setProperty('--accent', targetColorHex);
            
            document.querySelectorAll('.nav-dot').forEach((dot, i) => {
                dot.className = `nav-dot ${i === currentPlanetIndex ? 'active' : ''}`;
            });
        }

        function updateUIInfo() {
            const planet = SOLAR_SYSTEM[currentPlanetIndex];
            document.getElementById('planet-name').innerText = planet.name;
            document.getElementById('planet-type').innerText = planet.type;
            document.getElementById('info-diameter').innerText = planet.diameter;
            document.getElementById('info-moons').innerText = planet.moons;
            document.getElementById('info-distance').innerText = planet.distance;
            document.getElementById('fun-fact').innerText = planet.funFact;
        }

        function initMediaPipe() {
            const videoElement = document.getElementById('input-video');
            
            const hands = new Hands({locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }});
            
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6
            });
            
            hands.onResults(onHandResults);

            const camera = new Camera(videoElement, {
                onFrame: async () => {
                    await hands.send({image: videoElement});
                },
                width: 640,
                height: 480
            });
            
            camera.start()
                .then(() => {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('ui-container').style.display = 'block';
                })
                .catch(err => {
                    console.error("Camera error.", err);
                    document.getElementById('loading-text').innerHTML = "CAMERA ERROR<br><span style='font-size:0.7rem;color:#9ba1a6;margin-top:8px;display:block;'>Please allow permissions.</span>";
                    document.querySelector('.spinner').style.display = 'none';
                    setTimeout(() => {
                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('ui-container').style.display = 'block';
                    }, 3000);
                });
        }

        function showToast(msg) {
            const toast = document.getElementById('gesture-toast');
            toast.innerText = msg;
            toast.classList.add('show-toast');
            setTimeout(() => {
                toast.classList.remove('show-toast');
            }, 1200);
        }

        function getHandZone(x) {
            if (x > 0.70) return ZONE_LEFT;   
            if (x < 0.30) return ZONE_RIGHT;  
            return ZONE_CENTER;
        }

        function checkNavigation(landmarks) {
            const wristX = landmarks[0].x;
            const newZone = getHandZone(wristX);
            const now = Date.now();

            if (now - lastNavTime < 1500) return null;

            if (newZone === ZONE_CENTER) {
                if (handZone !== ZONE_CENTER) {
                    handZone = ZONE_CENTER;
                    navigationArmed = true;
                }
                return null;
            }

            if (handZone === ZONE_CENTER && navigationArmed && newZone !== ZONE_CENTER) {
                handZone = newZone;
                navigationArmed = false; 
                lastNavTime = now;
                return newZone === ZONE_RIGHT ? 'right' : 'left';
            }

            handZone = newZone;
            return null;
        }

        function onHandResults(results) {
            const canvasElement = document.getElementById('output-canvas');
            const canvasCtx = canvasElement.getContext('2d');
            
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                lastDetectionTime = Date.now();
                
                const landmarks = results.multiHandLandmarks[0];
                
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: 'rgba(255,255,255,0.5)', lineWidth: 2});
                drawLandmarks(canvasCtx, landmarks, {color: SOLAR_SYSTEM[currentPlanetIndex].color, lineWidth: 1, radius: 3});

                const wrist = landmarks[0];
                const fingerTips = [4, 8, 12, 16, 20];
                let avgDist = 0;
                
                for (const tipIdx of fingerTips) {
                    const tip = landmarks[tipIdx];
                    const dx = tip.x - wrist.x;
                    const dy = tip.y - wrist.y;
                    const dz = tip.z - wrist.z;
                    avgDist += Math.sqrt(dx*dx + dy*dy + dz*dz);
                }
                avgDist /= fingerTips.length;
                
                let tension = (avgDist - 0.1) / 0.25;
                targetHandTension = Math.max(0, Math.min(1, tension));

                const nav = checkNavigation(landmarks);
                if (nav === 'right' && currentPlanetIndex < SOLAR_SYSTEM.length - 1) {
                    showToast('Next Planet ➔');
                    flyToPlanet(currentPlanetIndex + 1);
                } else if (nav === 'left' && currentPlanetIndex > 0) {
                    showToast('⬅ Previous Planet');
                    flyToPlanet(currentPlanetIndex - 1);
                }
            }
            canvasCtx.restore();
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            if (composer) composer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);
            
            time += 0.01;

            camera.position.lerp(targetCamPos, 0.04);
            controls.target.lerp(targetLookAt, 0.04);
            controls.update();

            if (Date.now() - lastDetectionTime > 1500) {
                targetHandTension = 1.0; 
                handZone = ZONE_CENTER;
                navigationArmed = true;
            }

            handTension += (targetHandTension - handTension) * 0.1;

            planetObjects.forEach((obj, index) => {
                const isFocused = (index === currentPlanetIndex);
                const activeTension = isFocused ? handTension : 1.0;
                
                // 1. Dynamic Scaling (Zoom)
                const targetScale = 0.6 + activeTension * 0.4;
                obj.pivot.scale.set(targetScale, targetScale, targetScale);
                
                // 2. Rotation Speed
                const rotSpeed = isFocused ? (0.005 + (1.0 - activeTension) * 0.03) : 0.005;
                obj.pivot.rotation.y += rotSpeed;
                
                // 3. Update Shaders
                if (obj.mesh.material.userData.shader) {
                    obj.mesh.material.userData.shader.uniforms.time.value = time;
                    obj.mesh.material.userData.shader.uniforms.tension.value = activeTension;
                }
                
                obj.aura.material.uniforms.tension.value = activeTension;
            });
            
            if (starParticles) {
                starParticles.position.x = -camera.position.x * 0.1;
            }
            
            if (isAudioPlaying && gainNode && filterNode) {
                gainNode.gain.setTargetAtTime(0.05 + handTension * 0.15, audioCtx.currentTime, 0.1);
                filterNode.frequency.setTargetAtTime(400 + handTension * 1000, audioCtx.currentTime, 0.1);
            }

            composer.render();
        }
    