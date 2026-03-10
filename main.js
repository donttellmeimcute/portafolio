import * as THREE from 'three/webgpu';
import { uv, time, sin, cos, texture } from 'three/tsl';

// ─── CONFIG ───
const projects = [
    { text: "CREATE", link: "https://github.com/donttellmeimcute/specforge" },
    { text: "THE", link: "https://github.com/donttellmeimcute/stolascript" },
    { text: "THINGS", link: "https://github.com/donttellmeimcute/SessionManager" },
    { text: "YOU", link: "https://github.com/donttellmeimcute/realtimetranslator" },
    { text: "WISH", link: "https://github.com/donttellmeimcute/vvvf-FPGA" },
    { text: "EXISTED", link: "https://github.com/donttellmeimcute/CURP-RFC-OSINT" }
];

// ─── DOM REFS ───
const loadingBar = document.getElementById('loading-bar');
const loadingPct = document.getElementById('loading-pct');
const loadingScreen = document.getElementById('loading');
const heroEl = document.getElementById('hero');
const hoverLabel = document.getElementById('hover-label');
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
const fpsEl = document.getElementById('fps');

function setLoading(pct) {
    const p = Math.round(pct);
    if (loadingBar) loadingBar.style.width = p + '%';
    if (loadingPct) loadingPct.textContent = p + '%';
}

setLoading(5);

// ─── RENDERER ───
const canvasEl = document.createElement('canvas');
document.body.appendChild(canvasEl);

const renderer = new THREE.WebGPURenderer({ canvas: canvasEl, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
await renderer.init();

setLoading(30);

// ─── SCENE ───
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040406);
scene.fog = new THREE.FogExp2(0x040406, 0.045);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0.5, 16);

// ─── LIGHTING ───
const keyLight = new THREE.DirectionalLight(0xffffff, 2);
keyLight.position.set(4, 8, 10);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x4af5c7, 0.6);
rimLight.position.set(-5, 2, -3);
scene.add(rimLight);

const backLight = new THREE.DirectionalLight(0xff3a6e, 0.25);
backLight.position.set(0, -4, -6);
scene.add(backLight);

scene.add(new THREE.AmbientLight(0x8888aa, 0.35));

const hoverSpotLight = new THREE.PointLight(0x4af5c7, 0, 8, 2);
hoverSpotLight.position.set(0, 0, 4);
scene.add(hoverSpotLight);

setLoading(45);

// ─── FLOOR GRID ───
function createFloorGrid() {
    const gridGroup = new THREE.Group();

    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardNodeMaterial({
        color: 0x040406,
        roughness: 0.95,
        metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.2;
    gridGroup.add(floor);

    const gridMat = new THREE.LineBasicMaterial({ color: 0x4af5c7, transparent: true, opacity: 0.06 });

    for (let i = -30; i <= 30; i += 1.5) {
        const geoH = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-30, -3.19, i),
            new THREE.Vector3(30, -3.19, i),
        ]);
        gridGroup.add(new THREE.Line(geoH, gridMat));

        const geoV = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i, -3.19, -30),
            new THREE.Vector3(i, -3.19, 30),
        ]);
        gridGroup.add(new THREE.Line(geoV, gridMat));
    }

    const horizonGeo = new THREE.PlaneGeometry(60, 8);
    const horizonMat = new THREE.MeshBasicMaterial({
        color: 0x4af5c7,
        transparent: true,
        opacity: 0.015,
        side: THREE.DoubleSide,
    });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.rotation.x = -Math.PI / 2;
    horizon.position.set(0, -3.18, -20);
    gridGroup.add(horizon);

    return gridGroup;
}

const floorGrid = createFloorGrid();
scene.add(floorGrid);

setLoading(55);

// ─── SCREEN TEXTURE ───
function createScreenTexture(text, isHover = false) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, 512, 512);

    const grd = ctx.createRadialGradient(256, 256, 30, 256, 256, 280);
    grd.addColorStop(0, isHover ? 'rgba(74,245,199,0.12)' : 'rgba(74,245,199,0.04)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 512);

    for (let y = 0; y < 512; y += 3) {
        ctx.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.04})`;
        ctx.fillRect(0, y, 512, 1);
    }

    const glowColor = isHover ? '#4af5c7' : '#3adba8';
    ctx.fillStyle = glowColor;
    ctx.font = '800 68px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isHover ? 35 : 15;
    ctx.fillText(text, 256, 240);
    ctx.shadowBlur = isHover ? 60 : 30;
    ctx.fillText(text, 256, 240);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = `rgba(74,245,199,${isHover ? 0.2 : 0.08})`;
    ctx.lineWidth = 1;
    const m = 35;
    ctx.strokeRect(m, m, 512 - m * 2, 512 - m * 2);

    const cornerLen = 15;
    ctx.strokeStyle = `rgba(74,245,199,${isHover ? 0.5 : 0.2})`;
    ctx.lineWidth = 2;
    [[m, m, 1, 1], [512 - m, m, -1, 1], [m, 512 - m, 1, -1], [512 - m, 512 - m, -1, -1]].forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + dy * cornerLen);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dx * cornerLen, cy);
        ctx.stroke();
    });

    ctx.fillStyle = `rgba(74,245,199,${isHover ? 0.5 : 0.2})`;
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(isHover ? '→ OPEN PROJECT' : '[ CLICK ]', 256, 420);

    ctx.fillStyle = 'rgba(74,245,199,0.1)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SYS:OK', m + 8, m + 14);
    ctx.textAlign = 'right';
    ctx.fillText('RDY', 512 - m - 8, m + 14);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// ─── TV BUILDER ───
const tvScreens = [];
const tvGroups = [];
const screenTextures = [];
const hoverTextures = [];
const cols = 3;
const tvWidth = 2.5;
const tvHeight = 1.9;

const casingGeo = new THREE.BoxGeometry(2, 1.5, 0.9);
const screenGeo = new THREE.PlaneGeometry(1.7, 1.2);
const bezelGeo = new THREE.BoxGeometry(2.06, 1.56, 0.88);

function createAntenna(side) {
    const group = new THREE.Group();
    const rodGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.8, 6);
    const rodMat = new THREE.MeshStandardNodeMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.7 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(side * 0.3, 1.1, -0.1);
    rod.rotation.z = side * -0.35;
    group.add(rod);

    const tipGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const tipMat = new THREE.MeshStandardNodeMaterial({ color: 0x4af5c7, roughness: 0.2, metalness: 0.8 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(side * 0.3 + side * Math.sin(0.35) * 0.4, 1.1 + Math.cos(0.35) * 0.4, -0.1);
    group.add(tip);

    return group;
}

function createKnobs() {
    const group = new THREE.Group();
    const knobGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12);
    const knobMat = new THREE.MeshStandardNodeMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.4 });

    for (let i = 0; i < 2; i++) {
        const knob = new THREE.Mesh(knobGeo, knobMat);
        knob.rotation.x = Math.PI / 2;
        knob.position.set(1.06, -0.35 + i * 0.25, 0);
        group.add(knob);
    }
    return group;
}

setLoading(65);

projects.forEach((proj, index) => {
    const group = new THREE.Group();

    const casingMat = new THREE.MeshStandardNodeMaterial({
        color: 0x151518,
        roughness: 0.82,
        metalness: 0.08,
    });
    const casing = new THREE.Mesh(casingGeo, casingMat);
    group.add(casing);

    const bezelMat = new THREE.MeshStandardNodeMaterial({
        color: 0x1c1c22,
        roughness: 0.6,
        metalness: 0.2,
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.z = 0.02;
    group.add(bezel);

    group.add(createAntenna(-1));
    group.add(createAntenna(1));
    group.add(createKnobs());

    const feetGeo = new THREE.BoxGeometry(0.15, 0.08, 0.3);
    const feetMat = new THREE.MeshStandardNodeMaterial({ color: 0x222222, roughness: 0.9 });
    [-0.6, 0.6].forEach(x => {
        const foot = new THREE.Mesh(feetGeo, feetMat);
        foot.position.set(x, -0.79, 0);
        group.add(foot);
    });

    const normalMap = createScreenTexture(proj.text, false);
    const hoverMap = createScreenTexture(proj.text, true);
    screenTextures.push(normalMap);
    hoverTextures.push(hoverMap);

    const screenMat = new THREE.MeshStandardNodeMaterial();
    const texNode = texture(normalMap);
    const scanlines = sin(uv().y.mul(350).add(time.mul(6))).mul(0.05).add(0.95);
    const flicker = sin(time.mul(25)).mul(0.005).add(1.0);
    const vignette = uv().sub(0.5).length().mul(0.3).oneMinus();

    screenMat.colorNode = texNode.mul(scanlines).mul(flicker).mul(vignette);
    screenMat.emissiveNode = texNode.mul(0.45);

    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.47;
    screen.userData = { link: proj.link, text: proj.text, index, material: screenMat, normalMap, hoverMap };
    group.add(screen);
    tvScreens.push(screen);

    const row = Math.floor(index / cols);
    const col = index % cols;
    const totalRows = Math.ceil(projects.length / cols);
    const xOffset = (col - (cols - 1) / 2) * tvWidth;
    const yOffset = -(row - (totalRows - 1) / 2) * tvHeight;

    group.position.set(xOffset, yOffset, -5);
    group.userData = {
        basePos: new THREE.Vector3(xOffset, yOffset, 0),
        currentPos: new THREE.Vector3(xOffset, yOffset, -5),
        hoverZ: 0,
        entryDelay: 0.15 * index,
        entered: false,
        rotVelY: 0,
        rotVelX: 0,
    };
    scene.add(group);
    tvGroups.push(group);
});

setLoading(80);

// ─── PARTICLES (DUST) ───
const particleCount = 200;
const particleGeo = new THREE.BufferGeometry();
const pPositions = new Float32Array(particleCount * 3);
const pSizes = new Float32Array(particleCount);
const pVelocities = [];

for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 24;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 3;
    pSizes[i] = Math.random() * 0.02 + 0.005;
    pVelocities.push({
        x: (Math.random() - 0.5) * 0.004,
        y: (Math.random() - 0.5) * 0.002 + 0.001,
        z: (Math.random() - 0.5) * 0.001,
    });
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

const particleMat = new THREE.PointsNodeMaterial({
    size: 0.018,
    color: 0x4af5c7,
    transparent: true,
    opacity: 0.3,
    sizeAttenuation: true,
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ─── AMBIENT LIGHT SPHERES ───
const glowSpheres = [];
[
    { pos: [-6, 4, -8], color: 0x4af5c7, intensity: 0.8 },
    { pos: [7, -3, -10], color: 0xff3a6e, intensity: 0.5 },
    { pos: [0, 5, -12], color: 0xffb347, intensity: 0.3 },
].forEach(({ pos, color, intensity }) => {
    const geo = new THREE.SphereGeometry(0.15, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: intensity * 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    scene.add(mesh);
    glowSpheres.push(mesh);

    const pl = new THREE.PointLight(color, intensity, 15, 2);
    pl.position.set(...pos);
    scene.add(pl);
});

setLoading(100);
setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.add('done');
}, 500);

// ─── INTERACTION ───
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const mouseSmooth = new THREE.Vector2();
const mouseRaw = { x: 0, y: 0 };
let hoveredIndex = -1;
let prevHoveredIndex = -1;
let heroHidden = false;

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouseRaw.x = e.clientX;
    mouseRaw.y = e.clientY;
});

window.addEventListener('click', (e) => {
    const cm = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(cm, camera);
    const hits = raycaster.intersectObjects(tvScreens);
    if (hits.length > 0) {
        const flash = document.createElement('div');
        flash.className = 'click-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 400);

        setTimeout(() => {
            window.open(hits[0].object.userData.link, '_blank');
        }, 200);
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ─── ANIMATION LOOP ───
const clock = new THREE.Clock();
const introStart = performance.now();
const introDuration = 2800;
let frameCount = 0;
let lastFpsTime = performance.now();

function animate() {
    const elapsed = clock.getElapsedTime();

    // FPS
    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime > 500) {
        const fps = Math.round(frameCount / ((now - lastFpsTime) / 1000));
        if (fpsEl) fpsEl.textContent = fps + ' FPS';
        frameCount = 0;
        lastFpsTime = now;
    }

    // Intro camera
    const introP = Math.min((now - introStart) / introDuration, 1);
    const introE = 1 - Math.pow(1 - introP, 4);
    const camTargetZ = 8;
    camera.position.z = 16 - introE * (16 - camTargetZ);

    // Mouse parallax
    mouseSmooth.x += (mouse.x - mouseSmooth.x) * 0.04;
    mouseSmooth.y += (mouse.y - mouseSmooth.y) * 0.04;

    camera.position.x = mouseSmooth.x * 0.8;
    camera.position.y = 0.5 + mouseSmooth.y * 0.5;
    camera.lookAt(0, 0, 0);

    // Custom cursor
    if (cursorDot) {
        cursorDot.style.left = mouseRaw.x + 'px';
        cursorDot.style.top = mouseRaw.y + 'px';
    }
    if (cursorRing) {
        const rx = parseFloat(cursorRing.style.left || mouseRaw.x);
        const ry = parseFloat(cursorRing.style.top || mouseRaw.y);
        cursorRing.style.left = (rx + (mouseRaw.x - rx) * 0.15) + 'px';
        cursorRing.style.top = (ry + (mouseRaw.y - ry) * 0.15) + 'px';
    }

    // Hover tooltip
    if (hoverLabel) {
        hoverLabel.style.left = mouseRaw.x + 'px';
        hoverLabel.style.top = mouseRaw.y + 'px';
    }

    // Raycast hover
    raycaster.setFromCamera(mouseSmooth, camera);
    const hits = raycaster.intersectObjects(tvScreens);
    const newHovered = hits.length > 0 ? hits[0].object.userData.index : -1;

    if (newHovered !== hoveredIndex) {
        prevHoveredIndex = hoveredIndex;
        hoveredIndex = newHovered;

        if (hoveredIndex >= 0) {
            if (cursorDot) cursorDot.classList.add('hovering');
            if (cursorRing) cursorRing.classList.add('hovering');
            if (hoverLabel) {
                hoverLabel.textContent = projects[hoveredIndex].text + ' →';
                hoverLabel.classList.add('visible');
            }
            if (!heroHidden && heroEl) {
                heroHidden = true;
                heroEl.classList.add('hide');
            }

            const screen = tvScreens[hoveredIndex];
            const hMap = hoverTextures[hoveredIndex];
            const texNode = texture(hMap);
            const scanlines = sin(uv().y.mul(350).add(time.mul(6))).mul(0.05).add(0.95);
            const flicker = sin(time.mul(25)).mul(0.005).add(1.0);
            const vig = uv().sub(0.5).length().mul(0.3).oneMinus();
            screen.userData.material.colorNode = texNode.mul(scanlines).mul(flicker).mul(vig);
            screen.userData.material.emissiveNode = texNode.mul(0.7);
            screen.userData.material.needsUpdate = true;
        } else {
            if (cursorDot) cursorDot.classList.remove('hovering');
            if (cursorRing) cursorRing.classList.remove('hovering');
            if (hoverLabel) hoverLabel.classList.remove('visible');
        }

        if (prevHoveredIndex >= 0 && prevHoveredIndex !== hoveredIndex) {
            const screen = tvScreens[prevHoveredIndex];
            const nMap = screenTextures[prevHoveredIndex];
            const texNode = texture(nMap);
            const scanlines = sin(uv().y.mul(350).add(time.mul(6))).mul(0.05).add(0.95);
            const flicker = sin(time.mul(25)).mul(0.005).add(1.0);
            const vig = uv().sub(0.5).length().mul(0.3).oneMinus();
            screen.userData.material.colorNode = texNode.mul(scanlines).mul(flicker).mul(vig);
            screen.userData.material.emissiveNode = texNode.mul(0.45);
            screen.userData.material.needsUpdate = true;
        }
    }

    // Hover spotlight follows hovered TV
    if (hoveredIndex >= 0) {
        const tg = tvGroups[hoveredIndex];
        hoverSpotLight.position.x += (tg.position.x - hoverSpotLight.position.x) * 0.1;
        hoverSpotLight.position.y += (tg.position.y - hoverSpotLight.position.y) * 0.1;
        hoverSpotLight.position.z = 4;
        hoverSpotLight.intensity += (4 - hoverSpotLight.intensity) * 0.1;
    } else {
        hoverSpotLight.intensity += (0 - hoverSpotLight.intensity) * 0.08;
    }

    // TV animation
    tvGroups.forEach((group, i) => {
        const ud = group.userData;

        // Staggered entry
        if (!ud.entered) {
            const entryT = Math.max(0, (introP - ud.entryDelay) / (1 - ud.entryDelay));
            const entryE = 1 - Math.pow(1 - Math.min(entryT, 1), 3);
            group.position.x = ud.basePos.x;
            group.position.y = ud.basePos.y + (1 - entryE) * 2;
            group.position.z = -5 + entryE * 5;
            group.scale.setScalar(0.6 + entryE * 0.4);

            if (entryE >= 0.99) {
                ud.entered = true;
                group.position.copy(ud.basePos);
                group.scale.setScalar(1);
            }
            return;
        }

        // Hover Z
        const targetZ = i === hoveredIndex ? 0.8 : 0;
        ud.hoverZ += (targetZ - ud.hoverZ) * 0.06;
        group.position.z = ud.hoverZ;

        // Hover scale
        const targetScale = i === hoveredIndex ? 1.06 : 1;
        const s = group.scale.x + (targetScale - group.scale.x) * 0.06;
        group.scale.setScalar(s);

        // Idle sway
        group.rotation.y = Math.sin(elapsed * 0.4 + i * 1.5) * 0.025;
        group.rotation.x = Math.cos(elapsed * 0.35 + i * 0.9) * 0.015;

        // Slight hover tilt toward mouse
        if (i === hoveredIndex) {
            group.rotation.y += mouseSmooth.x * 0.06;
            group.rotation.x += -mouseSmooth.y * 0.04;
        }
    });

    // Particles
    const posAttr = particles.geometry.getAttribute('position');
    for (let i = 0; i < particleCount; i++) {
        posAttr.array[i * 3] += pVelocities[i].x;
        posAttr.array[i * 3 + 1] += pVelocities[i].y;
        posAttr.array[i * 3 + 2] += pVelocities[i].z;

        if (Math.abs(posAttr.array[i * 3]) > 12) pVelocities[i].x *= -1;
        if (posAttr.array[i * 3 + 1] > 8) {
            posAttr.array[i * 3 + 1] = -8;
            posAttr.array[i * 3] = (Math.random() - 0.5) * 24;
        }
        if (posAttr.array[i * 3 + 1] < -8) pVelocities[i].y = Math.abs(pVelocities[i].y);
        if (posAttr.array[i * 3 + 2] > 3 || posAttr.array[i * 3 + 2] < -10) pVelocities[i].z *= -1;
    }
    posAttr.needsUpdate = true;

    // Glow sphere pulse
    glowSpheres.forEach((sp, i) => {
        const pulse = Math.sin(elapsed * (0.8 + i * 0.3) + i * 2) * 0.5 + 0.5;
        sp.material.opacity = 0.15 + pulse * 0.25;
        sp.scale.setScalar(0.8 + pulse * 0.4);
    });

    // Floor grid scroll
    floorGrid.position.z = (elapsed * 0.3) % 1.5;

    renderer.renderAsync(scene, camera);
}

renderer.setAnimationLoop(animate);
