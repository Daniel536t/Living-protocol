import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.5, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg'), antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Particles
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 2000;
const positions = new Float32Array(particlesCount * 3);
const colors = new Float32Array(particlesCount * 3);
const c1 = new THREE.Color('#64ffda'), c2 = new THREE.Color('#00b8ff'), c3 = new THREE.Color('#7c4dff');
for (let i = 0; i < particlesCount; i++) {
  positions[i*3] = (Math.random()-0.5)*20;
  positions[i*3+1] = (Math.random()-0.5)*14;
  positions[i*3+2] = (Math.random()-0.5)*10-2;
  const col = c1.clone().lerp(c2, Math.random()).lerp(c3, Math.random()*0.5);
  colors[i*3]=col.r; colors[i*3+1]=col.g; colors[i*3+2]=col.b;
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const particles = new THREE.Points(particlesGeo, new THREE.PointsMaterial({
  size:0.015, vertexColors:true, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, opacity:0.7,
}));
scene.add(particles);

// Core
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.25, 2),
  new THREE.MeshBasicMaterial({ color:'#64ffda', wireframe:true, transparent:true, opacity:0.15 })
);
scene.add(core);

const glow = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 32, 32),
  new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}},
    vertexShader:`varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec3 vNormal;void main(){float f=pow(1.0-abs(dot(vNormal,vec3(0,0,1))),3.0);gl_FragColor=vec4(0.392,1.0,0.855,f*0.6);}`,
    transparent:true, depthWrite:false,
  })
);
scene.add(glow);

// Agent rings + nodes
const rings = [], agentNodes = [], agentColors = ['#64ffda','#00b8ff','#7c4dff'];
for (let i=0;i<3;i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.8+i*1.2, 0.008, 16, 120),
    new THREE.MeshBasicMaterial({color:agentColors[i],transparent:true,opacity:0.25,depthWrite:false})
  );
  ring.rotation.x=Math.PI/2+(i-1)*0.3; ring.rotation.y=i*0.5;
  ring.userData={brx:ring.rotation.x,bry:ring.rotation.y};
  scene.add(ring); rings.push(ring);

  const node = new THREE.Mesh(
    new THREE.SphereGeometry(0.12,32,32),
    new THREE.MeshStandardMaterial({color:agentColors[i],emissive:agentColors[i],emissiveIntensity:1.5,roughness:0.2})
  );
  node.userData={orbitRadius:1.8+i*1.2,speed:0.3+i*0.15,angle:Math.random()*Math.PI*2};
  scene.add(node); agentNodes.push(node);
}

// Lighting
scene.add(new THREE.AmbientLight('#111133',0.5));
scene.add(new THREE.PointLight('#64ffda',2,10)).position.set(0,2,3);

// Mouse
const mouse={x:0,y:0};
window.addEventListener('mousemove',e=>{mouse.x=(e.clientX/window.innerWidth)*2-1;mouse.y=-(e.clientY/window.innerHeight)*2+1;});

// Animate
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime(), dt=Math.min(clock.getDelta(),0.1);
  particles.rotation.y+=dt*0.04; particles.rotation.x+=dt*0.02;
  core.scale.setScalar(1+Math.sin(t*1.5)*0.15);
  core.rotation.x+=dt*0.3; core.rotation.y+=dt*0.5;
  glow.material.uniforms.uTime.value=t;
  agentNodes.forEach((n,i)=>{
    n.userData.angle+=n.userData.speed*dt;
    n.position.set(Math.cos(n.userData.angle)*n.userData.orbitRadius, Math.sin(n.userData.angle*2)*0.3, Math.sin(n.userData.angle)*n.userData.orbitRadius);
  });
  rings.forEach(r=>{r.rotation.z+=dt*0.1;r.rotation.x=r.userData.brx+Math.sin(t*0.5)*0.15;});
  camera.position.x+=(mouse.x*1.5-camera.position.x)*0.03;
  camera.position.y+=(-mouse.y*0.8+0.5-camera.position.y)*0.03;
  camera.lookAt(0,0,0);
  renderer.render(scene,camera);
}
animate();
window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});

// Agent activation
window.activateAgent=function(i){
  const n=agentNodes[i];
  n.scale.set(1.8,1.8,1.8); n.material.emissiveIntensity=4;
  setTimeout(()=>{n.scale.set(1,1,1);n.material.emissiveIntensity=1.5;},800);
};
window.flashCore=()=>{core.material.opacity=0.5;setTimeout(()=>core.material.opacity=0.15,400);};
console.log('🧬 3D Engine Ready');
