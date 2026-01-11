document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const scoreDisplay = document.querySelector('.score');
    const timerDisplay = document.querySelector('.timer');
    const gameOverScreen = document.querySelector('.game-over');
    const finalScoreDisplay = document.querySelector('.final-score');
    const canvas = document.getElementById('game-canvas');
    
    // Game variables
    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let comboTimer = null;
    let timeRemaining = 90;
    let gameActive = true;
    let fishes = [];
    let powerUps = [];
    let timerInterval;
    let obstacles = [];
    let particles = [];
    let waterRipples = [];
    
    // Power-up states
    let speedBoostActive = false;
    let magnetActive = false;
    let freezeActive = false;
    
    // Camera variables
    let rotationViewMode = false;
    let cameraRotationAngle = 0;
    let cameraDistance = 18;
    let cameraHeight = 10;
    let cameraShake = 0;

    // Three.js variables
    let scene, camera, renderer, bear, water;
    let mixer;
    let clock = new THREE.Clock();
    
    // Bear movement
    const bearMovement = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        speed: 0.18,
        rotationSpeed: 0.06,
        velocity: new THREE.Vector3(),
        acceleration: 0.02,
        friction: 0.95
    };

    // Fish types with different properties
    const fishTypes = [
        { name: 'salmon', color: 0xFA8072, points: 1, speed: 0.08, size: 1 },
        { name: 'golden', color: 0xFFD700, points: 3, speed: 0.12, size: 0.8 },
        { name: 'rainbow', color: 0xFF69B4, points: 5, speed: 0.15, size: 1.2 },
        { name: 'giant', color: 0x4169E1, points: 10, speed: 0.05, size: 1.8 }
    ];

    // Power-up types
    const powerUpTypes = [
        { type: 'speed', color: 0x00FF00, duration: 5000, icon: '⚡' },
        { type: 'magnet', color: 0xFF00FF, duration: 4000, icon: '🧲' },
        { type: 'freeze', color: 0x00FFFF, duration: 3000, icon: '❄️' },
        { type: 'time', color: 0xFFFF00, duration: 0, icon: '⏰' }
    ];

    // Initialize Three.js scene
    function initScene() {
        scene = new THREE.Scene();
        
        // Create beautiful gradient sky
        const skyColor = new THREE.Color(0x87CEEB);
        scene.background = skyColor;
        scene.fog = new THREE.FogExp2(0xADDFFF, 0.008);
        
        // Camera setup
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 12, 20);
        camera.lookAt(0, 0, 0);
        
        // Enhanced renderer
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        
        // Enhanced lighting
        setupLighting();
        
        // Create environment
        createWater();
        createTerrain();
        createSkyElements();
        loadBearModel();
        
        // Spawn initial fish
        for (let i = 0; i < 8; i++) {
            createFish();
        }
        
        window.addEventListener('resize', onWindowResize);
    }
    
    function setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        // Hemisphere light for natural outdoor feel
        const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.6);
        scene.add(hemiLight);
        
        // Main sun light
        const sunLight = new THREE.DirectionalLight(0xFFF5E6, 1.2);
        sunLight.position.set(30, 50, 30);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 100;
        sunLight.shadow.camera.left = -30;
        sunLight.shadow.camera.right = 30;
        sunLight.shadow.camera.top = 30;
        sunLight.shadow.camera.bottom = -30;
        sunLight.shadow.bias = -0.0001;
        scene.add(sunLight);
        
        // Rim light for depth
        const rimLight = new THREE.DirectionalLight(0x4FC3F7, 0.3);
        rimLight.position.set(-20, 20, -20);
        scene.add(rimLight);
    }
    
    function createWater() {
        // Create animated water surface
        const waterGeometry = new THREE.CircleGeometry(35, 64);
        
        // Water shader material
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x1E90FF,
            transparent: true,
            opacity: 0.85,
            metalness: 0.1,
            roughness: 0.2,
        });
        
        water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = -0.3;
        water.receiveShadow = true;
        scene.add(water);
        
        // Add water shimmer effect
        const shimmerGeometry = new THREE.CircleGeometry(34, 64);
        const shimmerMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.3,
        });
        const shimmer = new THREE.Mesh(shimmerGeometry, shimmerMaterial);
        shimmer.rotation.x = -Math.PI / 2;
        shimmer.position.y = -0.25;
        scene.add(shimmer);
        
        // Animate water
        water.userData.update = function(time) {
            water.material.opacity = 0.8 + Math.sin(time * 2) * 0.05;
            shimmer.material.opacity = 0.25 + Math.sin(time * 3) * 0.1;
        };
    }
    
    function createTerrain() {
        // Shore/beach area
        const shoreGeometry = new THREE.RingGeometry(35, 80, 64);
        const shoreMaterial = new THREE.MeshStandardMaterial({
            color: 0xC2B280,
            roughness: 0.9,
        });
        const shore = new THREE.Mesh(shoreGeometry, shoreMaterial);
        shore.rotation.x = -Math.PI / 2;
        shore.position.y = -0.1;
        shore.receiveShadow = true;
        scene.add(shore);
        
        // Grass area
        const grassGeometry = new THREE.RingGeometry(50, 150, 64);
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.95,
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.15;
        grass.receiveShadow = true;
        scene.add(grass);
        
        // Add boundary visual
        createBoundary();
        
        // Add environment decorations
        addTrees();
        addRocks();
    }
    
    function createBoundary() {
        const boundaryRadius = 33;
        const segments = 100;
        const points = [];
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(theta) * boundaryRadius,
                0.1,
                Math.sin(theta) * boundaryRadius
            ));
        }
        
        const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const boundaryMaterial = new THREE.LineDashedMaterial({
            color: 0xf4a3bb,
            dashSize: 2,
            gapSize: 1,
            opacity: 0.6,
            transparent: true
        });
        
        const boundary = new THREE.Line(boundaryGeometry, boundaryMaterial);
        boundary.computeLineDistances();
        scene.add(boundary);
        
        // Glowing particles along boundary
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0xf9c5d5,
                    transparent: true,
                    opacity: 0.7
                })
            );
            particle.position.set(
                Math.cos(angle) * boundaryRadius,
                0.2,
                Math.sin(angle) * boundaryRadius
            );
            particle.userData.angle = angle;
            scene.add(particle);
            particles.push(particle);
        }
    }
    
    function createSkyElements() {
        // Procedural clouds
        for (let i = 0; i < 15; i++) {
            const cloudGroup = new THREE.Group();
            const particleCount = 4 + Math.floor(Math.random() * 4);
            
            for (let j = 0; j < particleCount; j++) {
                const cloud = new THREE.Mesh(
                    new THREE.SphereGeometry(6 + Math.random() * 4, 8, 8),
                    new THREE.MeshStandardMaterial({
                        color: 0xFFFFFF,
                        transparent: true,
                        opacity: 0.9,
                        roughness: 1
                    })
                );
                cloud.position.set(
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 12
                );
                cloudGroup.add(cloud);
            }
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 50 + Math.random() * 40;
            cloudGroup.position.set(
                Math.cos(angle) * radius,
                35 + Math.random() * 15,
                Math.sin(angle) * radius
            );
            scene.add(cloudGroup);
        }
    }
    
    function addTrees() {
        for (let i = 0; i < 25; i++) {
            const treeGroup = new THREE.Group();
            const height = 4 + Math.random() * 3;
            
            // Trunk
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.4, height * 0.4, 8),
                new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 })
            );
            trunk.position.y = height * 0.2;
            trunk.castShadow = true;
            treeGroup.add(trunk);
            
            // Foliage layers
            for (let j = 0; j < 3; j++) {
                const foliage = new THREE.Mesh(
                    new THREE.ConeGeometry(1.5 - j * 0.3, height * 0.3, 8),
                    new THREE.MeshStandardMaterial({
                        color: new THREE.Color(0x228B22).lerp(new THREE.Color(0x006400), Math.random()),
                        roughness: 0.8
                    })
                );
                foliage.position.y = height * 0.4 + j * height * 0.18;
                foliage.castShadow = true;
                treeGroup.add(foliage);
            }
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 45 + Math.random() * 40;
            treeGroup.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
            treeGroup.rotation.y = Math.random() * Math.PI * 2;
            scene.add(treeGroup);
        }
    }
    
    function addRocks() {
        for (let i = 0; i < 20; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(0.8, 1);
            const positions = rockGeometry.attributes.position;
            
            for (let j = 0; j < positions.count; j++) {
                positions.setX(j, positions.getX(j) + (Math.random() - 0.5) * 0.3);
                positions.setY(j, positions.getY(j) + (Math.random() - 0.5) * 0.3);
                positions.setZ(j, positions.getZ(j) + (Math.random() - 0.5) * 0.3);
            }
            rockGeometry.computeVertexNormals();
            
            const rock = new THREE.Mesh(
                rockGeometry,
                new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.9 })
            );
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 36 + Math.random() * 20;
            rock.position.set(Math.cos(angle) * radius, 0.3, Math.sin(angle) * radius);
            rock.scale.setScalar(0.5 + Math.random() * 1.5);
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            rock.castShadow = true;
            scene.add(rock);
        }
    }
    
    function loadBearModel() {
        bear = new THREE.Group();
        
        const bearColor = 0x8B4513;
        const bearMaterial = new THREE.MeshStandardMaterial({
            color: bearColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Body
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            bearMaterial
        );
        body.scale.set(1.3, 1.1, 1.8);
        body.position.y = 1.5;
        body.castShadow = true;
        bear.add(body);
        
        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 32, 32),
            bearMaterial
        );
        head.position.set(0, 2.5, -1.1);
        head.castShadow = true;
        bear.add(head);
        bear.userData.head = head;
        
        // Muzzle
        const muzzle = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 32, 32),
            bearMaterial
        );
        muzzle.scale.set(1, 0.7, 0.9);
        muzzle.position.set(0, 2.3, -1.7);
        bear.add(muzzle);
        
        // Ears
        const earGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const earMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.5, 3.1, -1.1);
        bear.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.5, 3.1, -1.1);
        bear.add(rightEar);
        
        // Eyes with cute style
        const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const eyeBlackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        [-0.3, 0.3].forEach(x => {
            const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), eyeWhiteMat);
            eyeWhite.position.set(x, 2.65, -1.85);
            eyeWhite.scale.set(1, 1.2, 0.5);
            bear.add(eyeWhite);
            
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), eyeBlackMat);
            pupil.position.set(x, 2.68, -1.95);
            bear.add(pupil);
            
            const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeWhiteMat);
            highlight.position.set(x - 0.03, 2.72, -1.98);
            bear.add(highlight);
        });
        
        // Nose
        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
        );
        nose.scale.set(1.3, 0.9, 0.8);
        nose.position.set(0, 2.35, -2);
        bear.add(nose);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.28, 0.22, 1.2, 16);
        const legPositions = [
            [-0.55, 0.6, -0.7],
            [0.55, 0.6, -0.7],
            [-0.55, 0.6, 0.7],
            [0.55, 0.6, 0.7]
        ];
        
        bear.userData.legs = [];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, bearMaterial);
            leg.position.set(...pos);
            leg.castShadow = true;
            bear.add(leg);
            bear.userData.legs.push(leg);
        });
        
        // Tail
        const tail = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 16, 16),
            bearMaterial
        );
        tail.position.set(0, 1.4, 1.4);
        bear.add(tail);
        
        bear.position.y = 0.2;
        bear.rotation.y = Math.PI;
        scene.add(bear);
        
        // Bear animation data
        bear.userData.walkCycle = 0;
        bear.userData.bounceClock = 0;
        bear.userData.hitbox = new THREE.Box3();
    }
    
    function createFish(specificType = null) {
        if (!gameActive) return;
        
        const fishType = specificType || fishTypes[Math.random() < 0.6 ? 0 : Math.random() < 0.8 ? 1 : Math.random() < 0.95 ? 2 : 3];
        const fishBody = new THREE.Group();
        
        // Fish material with glow for special types
        const fishMaterial = new THREE.MeshStandardMaterial({
            color: fishType.color,
            roughness: 0.4,
            metalness: 0.3,
            emissive: fishType.points > 1 ? fishType.color : 0x000000,
            emissiveIntensity: fishType.points > 1 ? 0.2 : 0
        });
        
        // Body
        const bodyGeometry = new THREE.SphereGeometry(0.5 * fishType.size, 16, 16);
        bodyGeometry.scale(1.8, 0.8, 1);
        const body = new THREE.Mesh(bodyGeometry, fishMaterial);
        fishBody.add(body);
        
        // Tail
        const tailGeometry = new THREE.ConeGeometry(0.4 * fishType.size, 0.8 * fishType.size, 8);
        tailGeometry.rotateZ(-Math.PI / 2);
        const tail = new THREE.Mesh(tailGeometry, fishMaterial);
        tail.position.x = -0.8 * fishType.size;
        fishBody.add(tail);
        bear.userData.tail = tail;
        
        // Dorsal fin
        const dorsalFin = new THREE.Mesh(
            new THREE.ConeGeometry(0.2 * fishType.size, 0.4 * fishType.size, 6),
            fishMaterial
        );
        dorsalFin.position.set(0, 0.4 * fishType.size, 0);
        dorsalFin.rotation.z = Math.PI / 6;
        fishBody.add(dorsalFin);
        
        // Eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        [-0.15, 0.15].forEach(z => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06 * fishType.size, 8, 8), eyeMat);
            eye.position.set(0.5 * fishType.size, 0.1, z * fishType.size);
            fishBody.add(eye);
        });
        
        // Random position within water area
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 25;
        fishBody.position.set(
            Math.cos(angle) * radius,
            -0.2 + Math.random() * 0.3,
            Math.sin(angle) * radius
        );
        fishBody.rotation.y = Math.random() * Math.PI * 2;
        
        scene.add(fishBody);
        
        fishes.push({
            mesh: fishBody,
            type: fishType,
            speed: fishType.speed * (0.8 + Math.random() * 0.4),
            turnSpeed: 0.03 + Math.random() * 0.02,
            targetPosition: new THREE.Vector3(),
            changeTargetTime: 0,
            hitbox: new THREE.Box3(),
            wiggleOffset: Math.random() * Math.PI * 2,
            fleeing: false,
            health: fishType.points > 5 ? 3 : fishType.points > 1 ? 2 : 1
        });
        
        updateFishTarget(fishes[fishes.length - 1]);
    }
    
    function updateFishTarget(fish) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 25;
        fish.targetPosition.set(
            Math.cos(angle) * radius,
            -0.2 + Math.random() * 0.3,
            Math.sin(angle) * radius
        );
        fish.changeTargetTime = Date.now() + 3000 + Math.random() * 4000;
    }
    
    function updateFishes() {
        const now = Date.now();
        const time = now * 0.001;
        
        // Spawn new fish
        if (fishes.length < 12 && Math.random() < 0.02) {
            createFish();
        }
        
        // Spawn power-ups occasionally
        if (powerUps.length < 2 && Math.random() < 0.003) {
            createPowerUp();
        }
        
        fishes.forEach((fish, index) => {
            // Update hitbox
            fish.hitbox.setFromObject(fish.mesh);
            
            // Check if need new target
            if (now > fish.changeTargetTime && !fish.fleeing) {
                updateFishTarget(fish);
            }
            
            // Magnet effect - fish attracted to bear
            if (magnetActive && bear) {
                fish.targetPosition.copy(bear.position);
                fish.speed = fish.type.speed * 2;
            }
            
            // Freeze effect - fish stop moving
            if (freezeActive) {
                return;
            }
            
            // Calculate movement
            const direction = new THREE.Vector3().subVectors(fish.targetPosition, fish.mesh.position);
            
            if (direction.length() > 0.5) {
                const targetRotation = Math.atan2(direction.x, direction.z);
                fish.mesh.rotation.y = lerp(fish.mesh.rotation.y, targetRotation, fish.turnSpeed);
                
                const moveDir = new THREE.Vector3(
                    Math.sin(fish.mesh.rotation.y),
                    0,
                    Math.cos(fish.mesh.rotation.y)
                );
                fish.mesh.position.add(moveDir.multiplyScalar(fish.speed));
            }
            
            // Swimming animation
            const wiggle = Math.sin(time * 8 + fish.wiggleOffset) * 0.1;
            fish.mesh.rotation.z = wiggle * 0.5;
            fish.mesh.position.y = -0.2 + Math.sin(time * 2 + fish.wiggleOffset) * 0.1;
            
            // Keep fish in bounds
            const dist = fish.mesh.position.length();
            if (dist > 32) {
                fish.mesh.position.normalize().multiplyScalar(32);
                updateFishTarget(fish);
            }
            
            // Check collision with bear
            if (bear && fish.hitbox.intersectsBox(bear.userData.hitbox)) {
                fish.health--;
                fish.fleeing = true;
                
                // Flash effect
                fish.mesh.children.forEach(child => {
                    if (child.material) {
                        const origColor = child.material.color.clone();
                        child.material.color.set(0xFFFFFF);
                        setTimeout(() => child.material.color.copy(origColor), 100);
                    }
                });
                
                if (fish.health <= 0) {
                    catchFish(fish, index);
                } else {
                    // Fish flees
                    const awayDir = fish.mesh.position.clone().sub(bear.position).normalize();
                    fish.targetPosition.copy(fish.mesh.position).add(awayDir.multiplyScalar(15));
                    fish.changeTargetTime = now + 2000;
                }
            }
        });
    }
    
    function catchFish(fish, index) {
        // Update score with combo
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        
        const basePoints = fish.type.points;
        const comboMultiplier = Math.min(combo, 5);
        const totalPoints = basePoints * comboMultiplier;
        
        score += totalPoints;
        scoreDisplay.textContent = `捕獲: ${score}`;
        
        // Show floating score
        showFloatingText(`+${totalPoints}`, fish.mesh.position, fish.type.color);
        
        if (combo > 1) {
            showFloatingText(`${combo}x COMBO!`, fish.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xFFD700);
        }
        
        // Reset combo timer
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => { combo = 0; }, 2000);
        
        // Create splash effect
        createSplashEffect(fish.mesh.position, fish.type.color);
        
        // Camera shake for big catches
        if (fish.type.points >= 5) {
            cameraShake = 0.5;
        }
        
        // Remove fish
        scene.remove(fish.mesh);
        fishes.splice(index, 1);
    }
    
    function createPowerUp() {
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        const powerUp = new THREE.Group();
        
        // Glowing sphere
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({
                color: type.color,
                emissive: type.color,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            })
        );
        powerUp.add(sphere);
        
        // Outer ring
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.7, 0.05, 8, 32),
            new THREE.MeshBasicMaterial({ color: type.color })
        );
        powerUp.add(ring);
        
        // Random position
        const angle = Math.random() * Math.PI * 2;
        const radius = 8 + Math.random() * 20;
        powerUp.position.set(
            Math.cos(angle) * radius,
            0.5,
            Math.sin(angle) * radius
        );
        
        scene.add(powerUp);
        
        powerUps.push({
            mesh: powerUp,
            type: type,
            hitbox: new THREE.Box3(),
            spawnTime: Date.now()
        });
    }
    
    function updatePowerUps() {
        const time = Date.now() * 0.001;
        
        powerUps.forEach((powerUp, index) => {
            // Animate
            powerUp.mesh.rotation.y = time * 2;
            powerUp.mesh.position.y = 0.5 + Math.sin(time * 3) * 0.2;
            powerUp.mesh.children[1].rotation.x = time * 3;
            
            // Update hitbox
            powerUp.hitbox.setFromObject(powerUp.mesh);
            
            // Check collision
            if (bear && powerUp.hitbox.intersectsBox(bear.userData.hitbox)) {
                activatePowerUp(powerUp.type);
                scene.remove(powerUp.mesh);
                powerUps.splice(index, 1);
            }
            
            // Remove old power-ups
            if (Date.now() - powerUp.spawnTime > 15000) {
                scene.remove(powerUp.mesh);
                powerUps.splice(index, 1);
            }
        });
    }
    
    function activatePowerUp(type) {
        showFloatingText(type.icon + ' ' + type.type.toUpperCase(), bear.position, type.color);
        
        switch (type.type) {
            case 'speed':
                speedBoostActive = true;
                bearMovement.speed = 0.35;
                setTimeout(() => {
                    speedBoostActive = false;
                    bearMovement.speed = 0.18;
                }, type.duration);
                break;
            case 'magnet':
                magnetActive = true;
                setTimeout(() => { magnetActive = false; }, type.duration);
                break;
            case 'freeze':
                freezeActive = true;
                setTimeout(() => { freezeActive = false; }, type.duration);
                break;
            case 'time':
                timeRemaining += 10;
                timerDisplay.textContent = `時間: ${timeRemaining}`;
                break;
        }
    }
    
    function showFloatingText(text, position, color) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        ctx.font = 'Bold 48px Quicksand, Arial';
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(text, 128, 64);
        ctx.fillText(text, 128, 64);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: texture, transparent: true })
        );
        sprite.position.copy(position);
        sprite.position.y += 2;
        sprite.scale.set(4, 2, 1);
        scene.add(sprite);
        
        // Animate
        let frame = 0;
        function animate() {
            frame++;
            sprite.position.y += 0.05;
            sprite.material.opacity = 1 - frame / 60;
            
            if (frame < 60) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(sprite);
            }
        }
        animate();
    }
    
    function createSplashEffect(position, color = 0x87CEEB) {
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: i < particleCount / 2 ? color : 0xFFFFFF,
                    transparent: true,
                    opacity: 0.9
                })
            );
            particle.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.4,
                0.3 + Math.random() * 0.4,
                (Math.random() - 0.5) * 0.4
            );
            particle.userData.velocity = velocity;
            scene.add(particle);
            
            // Animate particle
            let frame = 0;
            function animateParticle() {
                frame++;
                particle.position.add(particle.userData.velocity);
                particle.userData.velocity.y -= 0.02;
                particle.material.opacity -= 0.02;
                particle.scale.multiplyScalar(0.96);
                
                if (frame < 50 && particle.material.opacity > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    scene.remove(particle);
                }
            }
            animateParticle();
        }
        
        // Water ripple
        createWaterRipple(position);
    }
    
    function createWaterRipple(position) {
        const ripple = new THREE.Mesh(
            new THREE.RingGeometry(0.1, 0.2, 32),
            new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            })
        );
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.set(position.x, -0.1, position.z);
        scene.add(ripple);
        waterRipples.push(ripple);
        
        // Animate ripple
        let scale = 1;
        function animateRipple() {
            scale += 0.15;
            ripple.scale.set(scale, scale, 1);
            ripple.material.opacity -= 0.02;
            
            if (ripple.material.opacity > 0) {
                requestAnimationFrame(animateRipple);
            } else {
                scene.remove(ripple);
                const idx = waterRipples.indexOf(ripple);
                if (idx > -1) waterRipples.splice(idx, 1);
            }
        }
        animateRipple();
    }
    
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    function setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!rotationViewMode) {
                switch (e.key.toLowerCase()) {
                    case 'w': bearMovement.forward = true; break;
                    case 's': bearMovement.backward = true; break;
                    case 'a': bearMovement.left = true; break;
                    case 'd': bearMovement.right = true; break;
                }
            } else {
                switch (e.key.toLowerCase()) {
                    case 'a': cameraRotationAngle += 0.1; break;
                    case 'd': cameraRotationAngle -= 0.1; break;
                }
            }
            
            if (e.key === ' ') {
                rotationViewMode = !rotationViewMode;
                if (rotationViewMode) {
                    const bearToCam = new THREE.Vector3().subVectors(camera.position, bear.position);
                    cameraRotationAngle = Math.atan2(bearToCam.x, bearToCam.z);
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w': bearMovement.forward = false; break;
                case 's': bearMovement.backward = false; break;
                case 'a': bearMovement.left = false; break;
                case 'd': bearMovement.right = false; break;
            }
        });
    }
    
    function updateBear() {
        if (!bear) return;
        
        const isMoving = bearMovement.forward || bearMovement.backward;
        
        // Smooth acceleration
        if (bearMovement.forward) {
            bearMovement.velocity.z = lerp(bearMovement.velocity.z, -bearMovement.speed, bearMovement.acceleration);
        } else if (bearMovement.backward) {
            bearMovement.velocity.z = lerp(bearMovement.velocity.z, bearMovement.speed * 0.6, bearMovement.acceleration);
        } else {
            bearMovement.velocity.z *= bearMovement.friction;
        }
        
        // Rotation
        if (bearMovement.left) bear.rotateY(bearMovement.rotationSpeed);
        if (bearMovement.right) bear.rotateY(-bearMovement.rotationSpeed);
        
        // Apply movement
        bear.translateZ(bearMovement.velocity.z);
        
        // Walking animation
        if (isMoving) {
            bear.userData.walkCycle += 0.15;
            bear.userData.legs.forEach((leg, i) => {
                const offset = i < 2 ? 0 : Math.PI;
                const side = i % 2 === 0 ? 1 : -1;
                leg.rotation.x = Math.sin(bear.userData.walkCycle + offset) * 0.3 * side;
            });
        }
        
        // Breathing animation
        bear.userData.bounceClock += 0.02;
        bear.position.y = 0.2 + Math.sin(bear.userData.bounceClock) * 0.03;
        bear.userData.head.rotation.z = Math.sin(bear.userData.bounceClock * 0.5) * 0.02;
        
        // Keep in bounds
        const maxDist = 32;
        if (bear.position.length() > maxDist) {
            bear.position.normalize().multiplyScalar(maxDist);
        }
        
        // Update hitbox
        bear.userData.hitbox.setFromObject(bear);
        bear.userData.hitbox.expandByScalar(0.5);
    }
    
    function updateCamera() {
        if (!bear) return;
        
        let targetPos;
        
        if (rotationViewMode) {
            targetPos = new THREE.Vector3(
                bear.position.x + Math.sin(cameraRotationAngle) * cameraDistance,
                bear.position.y + cameraHeight,
                bear.position.z + Math.cos(cameraRotationAngle) * cameraDistance
            );
        } else {
            const offset = new THREE.Vector3(0, cameraHeight, cameraDistance);
            offset.applyQuaternion(bear.quaternion);
            targetPos = bear.position.clone().add(offset);
        }
        
        // Apply camera shake
        if (cameraShake > 0) {
            targetPos.x += (Math.random() - 0.5) * cameraShake;
            targetPos.y += (Math.random() - 0.5) * cameraShake;
            cameraShake *= 0.9;
        }
        
        camera.position.lerp(targetPos, 0.08);
        camera.lookAt(bear.position);
    }
    
    function updateParticles() {
        const time = Date.now() * 0.001;
        
        particles.forEach(p => {
            if (p.userData.angle !== undefined) {
                p.position.y = 0.2 + Math.sin(time * 2 + p.userData.angle) * 0.15;
                p.material.opacity = 0.5 + Math.sin(time + p.userData.angle) * 0.2;
            }
        });
        
        // Update water
        if (water && water.userData.update) {
            water.userData.update(time);
        }
    }
    
    function startTimer() {
        timerInterval = setInterval(() => {
            timeRemaining--;
            timerDisplay.textContent = `時間: ${timeRemaining}`;
            
            // Progressive difficulty
            if (timeRemaining === 60) {
                fishes.forEach(f => f.speed *= 1.2);
            } else if (timeRemaining === 30) {
                fishes.forEach(f => f.speed *= 1.2);
            }
            
            if (timeRemaining <= 0) {
                endGame();
            }
        }, 1000);
    }
    
    function endGame() {
        gameActive = false;
        clearInterval(timerInterval);
        
        let message = `你捕獲了 ${score} 條鮭魚!`;
        if (maxCombo > 1) {
            message += `\n最高連擊: ${maxCombo}x`;
        }
        
        finalScoreDisplay.innerHTML = message.replace('\n', '<br>');
        gameOverScreen.style.display = 'flex';
    }
    
    window.restartGame = function() {
        score = 0;
        combo = 0;
        maxCombo = 0;
        timeRemaining = 90;
        gameActive = true;
        speedBoostActive = false;
        magnetActive = false;
        freezeActive = false;
        bearMovement.speed = 0.18;
        
        scoreDisplay.textContent = `捕獲: ${score}`;
        timerDisplay.textContent = `時間: ${timeRemaining}`;
        gameOverScreen.style.display = 'none';
        
        // Clear fish and power-ups
        fishes.forEach(f => scene.remove(f.mesh));
        fishes = [];
        powerUps.forEach(p => scene.remove(p.mesh));
        powerUps = [];
        
        // Reset bear
        if (bear) {
            bear.position.set(0, 0.2, 0);
            bear.rotation.set(0, Math.PI, 0);
        }
        
        // Spawn initial fish
        for (let i = 0; i < 8; i++) {
            createFish();
        }
        
        startTimer();
    };
    
    window.goToHomePage = function() {
        window.location.href = 'index.html';
    };
    
    function animate() {
        requestAnimationFrame(animate);
        
        if (gameActive) {
            updateBear();
            updateFishes();
            updatePowerUps();
        }
        
        updateCamera();
        updateParticles();
        
        renderer.render(scene, camera);
    }
    
    // Initialize
    initScene();
    setupControls();
    startTimer();
    animate();
});

function lerp(a, b, t) {
    return a + (b - a) * t;
}
