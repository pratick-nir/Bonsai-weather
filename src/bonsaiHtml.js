// The whole 3D bonsai lives in this HTML string. React Native shows it inside a WebView.
// React Native -> tree : window.setClimate({condition,temp,wind,mood})
// tree -> React Native : {type:'ready'} and {type:'done'} (growth finished)
export const BONSAI_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;height:100%;background:transparent;overflow:hidden}canvas{display:block;width:100%;height:100%}</style>
</head><body><canvas id="c"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
var P={duration:4,curvature:1,branchDensity:1,foliageDensity:1,seed:7,height:3.3,trunkRadius:0.22};
var REF=4, TR=1.9;
var clamp=function(x,a,b){return Math.min(b,Math.max(a,x))};
var ease=function(u){u=clamp(u,0,1);return 3*u*u-2*u*u*u};
var win=function(t,a,b){return ease((t-a)/(b-a))};
var invE=function(y){var lo=0,hi=1;for(var i=0;i<24;i++){var m=(lo+hi)/2;ease(m)<y?lo=m:hi=m}return lo};
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function post(o){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(o))}

/* ---------- PART 1: procedural tree generation (pure data) ---------- */
function generateTree(P){
  var R=rng(P.seed), V=function(x,y,z){return new THREE.Vector3(x,y,z)}, UP=V(0,1,0);
  var tubes=[], pads=[], leaves=[];
  var H=P.height, A=0.55*P.curvature, B=0.22*P.curvature, om=2*Math.PI*1.15, ka=2*Math.PI*0.8, ph=0.5;
  var trunkPos=function(s){return V(A*Math.sin(om*s+ph)*s+0.3*P.curvature*s*s, H*s, B*Math.sin(ka*s))};
  var pts=[];for(var i=0;i<=24;i++)pts.push(trunkPos(i/24));
  var trunkR=function(s){return P.trunkRadius*Math.pow(1-s,1.5)+0.022+0.1*Math.exp(-s*18)};
  var trunk={curve:new THREE.CatmullRomCurve3(pts),r:trunkR,rings:64,seg:12,t0:0,t1:TR,isTrunk:true};
  tubes.push(trunk);
  var invT=function(s){return TR*invE(s)};
  function bez(p0,d,L){
    var side=V(-d.z,0,d.x), w1=(R()-.5)*.25*L, w2=(R()-.5)*.25*L;
    return new THREE.CubicBezierCurve3(p0,
      p0.clone().addScaledVector(d,L*.33).addScaledVector(UP,L*.10).addScaledVector(side,w1),
      p0.clone().addScaledVector(d,L*.70).addScaledVector(UP,L*.02).addScaledVector(side,w2),
      p0.clone().addScaledVector(d,L).addScaledVector(UP,L*.10));
  }
  function addPad(tube,rx){
    var ry=rx*.38, rz=rx*.85, pad={tube:tube,rx:rx,ry:ry,rz:rz,t0:clamp(tube.t1-.15,1.6,2.4),dur:1.1,fin:tube.curve.getPoint(1)};
    var pi=pads.push(pad)-1, n=Math.round(150*P.foliageDensity*rx/.5), p1=R()*6.28, p2=R()*6.28;
    for(var i=0;i<n;i++){
      var dy=1-2*(i+.5)/n, rad=Math.sqrt(1-dy*dy), th=i*2.39996+p1, dx=rad*Math.cos(th), dz=rad*Math.sin(th);
      var rho=.5+.5*Math.sqrt(R()), lump=1+.22*Math.sin(4.1*dx+p1)*Math.sin(3.7*dz+p2);
      var off=V(dx*rx*rho*lump, dy*ry*(dy<0?.55:1)*rho*lump, dz*rz*rho*lump);
      var dv=V(dx,dy+.35,dz).multiplyScalar(.8).add(V(R()-.5,R()-.5,R()-.5).multiplyScalar(.9)).normalize();
      var q=new THREE.Quaternion().setFromUnitVectors(UP,dv).multiply(new THREE.Quaternion().setFromAxisAngle(UP,R()*6.28));
      var col=new THREE.Color().setHSL(.24+.07*R(),.5+.15*R(),.2+.14*(dy*.5+.5)+.05*R());
      leaves.push({pad:pi,off:off,q:q,size:.2*(.8+.5*R()),d:.5*R(),col:col});
    }
  }
  var nB=Math.max(3,Math.round(7*P.branchDensity));
  for(var k=0;k<nB;k++){
    (function(k){
      var s=clamp(.26+.64*k/(nB-1)+(R()-.5)*.03,.2,.92), az=k*2.39996+R()*.5, el=.06+.16*R();
      var d=V(Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el));
      var L=1.9*(1-.72*s)*(.85+.3*R()), rb=.55*trunkR(s);
      var t0=Math.max(invT(s)+.15,.9), t1=Math.min(t0+.9+.5*(1-s),2.7);
      var br=function(u){return rb*Math.pow(1-u,1.2)+.01};
      var tb={curve:bez(trunk.curve.getPoint(s),d,L),r:br,rings:18,seg:7,t0:t0,t1:t1};
      tubes.push(tb); addPad(tb,.2+.3*L);
      var subs=P.branchDensity<.8?[.45]:[.42,.72];
      subs.forEach(function(u,j){
        var tg=tb.curve.getTangent(u).applyAxisAngle(UP,(j%2?1:-1)*(.7+.4*R())); tg.y+=.25; tg.normalize();
        var Ls=.42*L*(1-.3*u), s0=tb.t0+(tb.t1-tb.t0)*invE(u)+.08, s1=Math.max(Math.min(s0+.8,2.75),s0+.45);
        var rs=.5*br(u);
        var sb={curve:bez(tb.curve.getPoint(u),tg,Ls),r:function(v){return rs*Math.pow(1-v,1.2)+.008},rings:12,seg:6,t0:s0,t1:s1};
        tubes.push(sb); addPad(sb,.2+.3*Ls);
      });
    })(k);
  }
  addPad(trunk,.55);
  for(var i2=0;i2<12;i2++){
    var s2=.1+.9*Math.pow(i2/11,.9), a=i2*2.4;
    var q2=new THREE.Quaternion().setFromUnitVectors(UP,V(Math.cos(a),.6,Math.sin(a)).normalize());
    leaves.push({sap:s2,q:q2,size:.17,col:new THREE.Color().setHSL(.27,.55,.32),pad:-1,d:0});
  }
  return {tubes:tubes,pads:pads,leaves:leaves,trunk:trunk};
}

/* ---------- PART 2: scene, lights, textures ---------- */
var canvas=document.getElementById('c');
var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setClearColor(0x000000,0);
renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(32,1,.1,60);
function fit(){
  var w=window.innerWidth,h=window.innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h;
  var D=Math.max(8.6,3.4/(Math.tan(camera.fov*Math.PI/360)*camera.aspect));
  camera.position.set(0,2.6,D); camera.lookAt(0,2.0,0); camera.updateProjectionMatrix();
}
var hemi=new THREE.HemisphereLight(0xffffff,0xb9a98f,.75); scene.add(hemi);
var sun=new THREE.DirectionalLight(0xfff2de,1.15); sun.position.set(4,9,6); sun.target.position.set(0,2,0);
sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.bias=-.0008; sun.shadow.normalBias=.02;
sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.camera.near=1;sun.shadow.camera.far=25;
scene.add(sun,sun.target);

function canvasTex(draw,rep){var c=document.createElement('canvas');c.width=c.height=256;draw(c.getContext('2d'));
  var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.encoding=THREE.sRGBEncoding;return t}
var TRN=rng(99);
var barkTex=canvasTex(function(g){g.fillStyle='#4a3524';g.fillRect(0,0,256,256);
  for(var i=0;i<700;i++){var x=TRN()*256,y=TRN()*256,len=10+TRN()*50;
    var col='hsl('+(22+TRN()*10)+','+(25+TRN()*20)+'%,'+(18+TRN()*22)+'%)', lw=.6+TRN()*2.2;
    var c1=TRN()*6-3,c2=TRN()*6-3,c3=TRN()*4-2;
    [0,-256].forEach(function(dx){[0,-256].forEach(function(dy){g.save();g.translate(dx,dy);
      g.strokeStyle=col;g.lineWidth=lw;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+c1,y+len/3,x+c2,y+len*2/3,x+c3,y+len);g.stroke();g.restore();})});}},1);
var soilTex=canvasTex(function(g){g.fillStyle='#3b2c20';g.fillRect(0,0,256,256);
  for(var i=0;i<2000;i++){g.fillStyle='hsl('+(20+TRN()*12)+','+(20+TRN()*20)+'%,'+(12+TRN()*22)+'%)';g.fillRect(TRN()*256,TRN()*256,1+TRN()*3,1+TRN()*3)}},3);

var shadowPlane=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.ShadowMaterial({opacity:.35}));
shadowPlane.rotation.x=-Math.PI/2; shadowPlane.receiveShadow=true; scene.add(shadowPlane);
var potProfile=[[0,0],[.7,0],[.72,.08],[.95,.12],[1.12,.42],[1.16,.52],[1.05,.52],[1.02,.44],[0,.44]].map(function(p){return new THREE.Vector2(p[0],p[1])});
var pot=new THREE.Mesh(new THREE.LatheGeometry(potProfile,64),new THREE.MeshStandardMaterial({color:0x4b3a33,roughness:.5,side:THREE.DoubleSide}));
pot.scale.x=1.45; pot.castShadow=pot.receiveShadow=true; scene.add(pot);
var soil=new THREE.Mesh(new THREE.CircleGeometry(1.02,48),new THREE.MeshStandardMaterial({map:soilTex,roughness:1}));
soil.rotation.x=-Math.PI/2; soil.position.y=.455; soil.scale.x=1.45; soil.receiveShadow=true; scene.add(soil);

var barkMat=new THREE.MeshStandardMaterial({map:barkTex,bumpMap:barkTex,bumpScale:.8,roughness:.95,side:THREE.DoubleSide});
var leafGeo=new THREE.BufferGeometry();
leafGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.32,.42,.08,.32,.42,.08,0,1,0],3));
leafGeo.setIndex([0,1,3,0,3,2]); leafGeo.computeVertexNormals();
var leafMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.7,side:THREE.DoubleSide});

var tree,group;
function build(){
  tree=generateTree(P); group=new THREE.Group(); group.position.y=.46; scene.add(group);
  tree.tubes.forEach(function(tb){
    var n=tb.rings,seg=tb.seg,cnt=n*(seg+1),len=tb.curve.getLength(), fr=tb.curve.computeFrenetFrames(n-1,false);
    tb.C=[];tb.rad=[];tb.N=fr.normals;tb.B=fr.binormals;tb.pos=new Float32Array(cnt*3);
    var uv=new Float32Array(cnt*2),idx=[];
    for(var i=0;i<n;i++){var t=i/(n-1);tb.C.push(tb.curve.getPoint(t));tb.rad.push(tb.r(t));
      for(var j=0;j<=seg;j++){var k=(i*(seg+1)+j)*2;uv[k]=j/seg*1.5;uv[k+1]=t*len*.9}}
    for(var i2=0;i2<n-1;i2++)for(var j2=0;j2<seg;j2++){var a=i2*(seg+1)+j2,b=a+seg+1;idx.push(a,b,a+1,b,b+1,a+1)}
    var geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(tb.pos,3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv',new THREE.BufferAttribute(uv,2)); geo.setIndex(idx);
    tb.mesh=new THREE.Mesh(geo,barkMat); tb.mesh.castShadow=tb.mesh.receiveShadow=true; tb.mesh.frustumCulled=false;
    group.add(tb.mesh);
  });
  var lm=new THREE.InstancedMesh(leafGeo,leafMat,tree.leaves.length);
  lm.castShadow=lm.receiveShadow=true; lm.frustumCulled=false;
  tree.leaves.forEach(function(l,i){lm.setColorAt(i,l.col)}); lm.instanceColor.needsUpdate=true;
  group.add(lm); group.leafMesh=lm;
}

/* growth: a pure function of elapsed time */
function updateTubes(ts){
  var thick=.16+.84*win(ts,.2,3.6);
  tree.tubes.forEach(function(tb){
    var g=tb.isTrunk?win(ts,0,TR):win(ts,tb.t0,tb.t1); tb.g=g;
    tb.mesh.visible=g>.0005; if(!tb.mesh.visible)return;
    var tip=tb.curve.getPoint(g),n=tb.rings,seg=tb.seg,pos=tb.pos,rt=tb.r(g)*thick*.05;
    for(var i=0;i<n;i++){
      var inside=i/(n-1)<=g, c=inside?tb.C[i]:tip, r=inside?tb.rad[i]*thick:rt, N=tb.N[i], Bn=tb.B[i];
      for(var j=0;j<=seg;j++){
        var a=j/seg*6.2832, ca=Math.cos(a)*r, sa=Math.sin(a)*r, k=(i*(seg+1)+j)*3;
        pos[k]=c.x+N.x*ca+Bn.x*sa; pos[k+1]=c.y+N.y*ca+Bn.y*sa; pos[k+2]=c.z+N.z*ca+Bn.z*sa;
      }
    }
    tb.mesh.geometry.attributes.position.needsUpdate=true; tb.mesh.geometry.computeVertexNormals();
  });
}
var _m=new THREE.Matrix4(),_p=new THREE.Vector3(),_s=new THREE.Vector3();
function updateLeaves(ts,tm){
  var trunkG=tree.trunk.g||0, fade=1-win(ts,2.3,3.1), lm=group.leafMesh, gust=Math.sin(tm*.7)*.5+.5;
  var ps=tree.pads.map(function(p){return {pg:win(ts,p.t0,p.t0+p.dur),tip:p.tube.curve.getPoint(p.tube.g||0)}});
  tree.leaves.forEach(function(L,i){
    var e,x,y,z;
    if(L.sap!==undefined){
      e=win(trunkG,L.sap,L.sap+.08)*fade; var c=tree.trunk.curve.getPoint(L.sap); x=c.x;y=c.y;z=c.z;
    }else{
      var p=tree.pads[L.pad],S=ps[L.pad]; e=S.pg<=L.d?0:ease((S.pg-L.d)/(1-L.d));
      var tx=p.fin.x+L.off.x, ty=p.fin.y+p.ry*.6+L.off.y, tz=p.fin.z+L.off.z;
      x=S.tip.x+(tx-S.tip.x)*e; y=S.tip.y+(ty-S.tip.y)*e; z=S.tip.z+(tz-S.tip.z)*e;
    }
    // wind sway: stronger with wind speed and with height
    var a=cur.wind*(.02+.035*gust)*(.3+Math.min(1,y/4));
    x+=Math.sin(tm*2.4+i*1.7)*a; z+=Math.cos(tm*2.1+i*1.3)*a*.6; y+=Math.sin(tm*3+i)*a*.25;
    _p.set(x,y,z); _s.setScalar(L.size*e); _m.compose(_p,L.q,_s); lm.setMatrixAt(i,_m);
  });
  lm.instanceMatrix.needsUpdate=true;
}

/* ---------- PART 3: climate (smoothly blended toward targets) ---------- */
var MOODS={
  day:{sc:0xfff2de,si:1.15,sp:[4,9,6],hi:.75,hc:0xffffff,exp:1.05},
  golden:{sc:0xffa24a,si:1.4,sp:[6,3.2,5],hi:.55,hc:0xffd9a8,exp:1.1},
  night:{sc:0x8f86e0,si:.5,sp:[-3,8,4],hi:.45,hc:0x7a6fb8,exp:1.0}};
var CLOUD={clear:1,partly:.8,cloudy:.5,fog:.45,rain:.4,storm:.3,snow:.55};
function mk(){return {si:1.15,hi:.75,exp:1.05,wind:.2,rain:0,snow:0,sp:new THREE.Vector3(4,9,6),sc:new THREE.Color(0xfff2de),hc:new THREE.Color(0xffffff),tint:new THREE.Color(1,1,1)}}
var cur=mk(), tgt=mk(), storm=false, flash=0;
window.setClimate=function(c){
  var m=MOODS[c.mood]||MOODS.day, cl=CLOUD[c.condition]; if(cl===undefined)cl=1;
  tgt.si=m.si*cl; tgt.hi=m.hi*(1+(1-cl)*.5); tgt.exp=m.exp; tgt.sp.set(m.sp[0],m.sp[1],m.sp[2]); tgt.sc.set(m.sc); tgt.hc.set(m.hc);
  tgt.wind=clamp((c.wind||0)/35,.12,1.6);
  tgt.rain=c.condition==='rain'?.7:(c.condition==='storm'?1:0);
  tgt.snow=c.condition==='snow'?1:0; storm=c.condition==='storm';
  // light theme: darker precipitation so it stays visible on a cream background
  snowPts.material.color.set(c.light?0x9db4d8:0xffffff); rainLines.material.color.set(c.light?0x5b7bbf:0xbcd0ff);
  var t=c.temp, tint=new THREE.Color(1,1,1);
  if(t>=28)tint.lerp(new THREE.Color(1,.82,.5),clamp((t-28)/12,0,1));       // heat: dry, yellowing leaves
  else if(t<=6)tint.lerp(new THREE.Color(.8,.92,1.05),clamp((6-t)/16,0,1)); // cold: bluish, muted leaves
  tgt.tint.copy(tint);
};
function applyClimate(dt){
  var k=1-Math.exp(-dt*2.5);
  ['si','hi','exp','wind','rain','snow'].forEach(function(n){cur[n]+=(tgt[n]-cur[n])*k});
  cur.sp.lerp(tgt.sp,k); cur.sc.lerp(tgt.sc,k); cur.hc.lerp(tgt.hc,k); cur.tint.lerp(tgt.tint,k);
  flash=Math.max(0,flash-dt*4); if(storm&&Math.random()<dt*.35)flash=1;
  sun.intensity=cur.si; sun.color.copy(cur.sc); sun.position.copy(cur.sp);
  hemi.intensity=cur.hi+flash*1.5; hemi.color.copy(cur.hc);
  renderer.toneMappingExposure=cur.exp; leafMat.color.copy(cur.tint);
}
// rain: line segments, snow: points. Both recycle at the ground.
var PR=rng(5), RN=500, SN=400, rx=[],ry=[],rz=[],rv=[], sx=[],sy=[],sz=[],sv=[];
for(var i=0;i<RN;i++){rx.push((PR()-.5)*8);ry.push(PR()*7);rz.push((PR()-.5)*7);rv.push(9+PR()*5)}
for(var i3=0;i3<SN;i3++){sx.push((PR()-.5)*8);sy.push(PR()*7);sz.push((PR()-.5)*7);sv.push(.5+PR()*.6)}
var rainPos=new Float32Array(RN*6), rainGeo=new THREE.BufferGeometry();
rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
var rainLines=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xbcd0ff,transparent:true,opacity:.55}));
rainLines.frustumCulled=false; scene.add(rainLines);
var snowPos=new Float32Array(SN*3), snowGeo=new THREE.BufferGeometry();
snowGeo.setAttribute('position',new THREE.BufferAttribute(snowPos,3));
var snowPts=new THREE.Points(snowGeo,new THREE.PointsMaterial({color:0xffffff,size:.07,transparent:true,opacity:.9}));
snowPts.frustumCulled=false; scene.add(snowPts);
function stepPrecip(dt,tm){
  var n=Math.round(RN*Math.min(1,cur.rain)); rainGeo.setDrawRange(0,n*2); rainLines.visible=n>0;
  for(var i=0;i<n;i++){ry[i]-=rv[i]*dt;if(ry[i]<0)ry[i]+=7;var o=i*6;
    rainPos[o]=rx[i];rainPos[o+1]=ry[i];rainPos[o+2]=rz[i];rainPos[o+3]=rx[i]-.02-cur.wind*.06;rainPos[o+4]=ry[i]+.25;rainPos[o+5]=rz[i]}
  rainGeo.attributes.position.needsUpdate=true;
  var m=Math.round(SN*Math.min(1,cur.snow)); snowGeo.setDrawRange(0,m); snowPts.visible=m>0;
  for(var j=0;j<m;j++){sy[j]-=sv[j]*dt;if(sy[j]<0)sy[j]+=7;var q=j*3;
    snowPos[q]=sx[j]+Math.sin(tm+j)*.15+cur.wind*.1*Math.sin(tm*.5);snowPos[q+1]=sy[j];snowPos[q+2]=sz[j]}
  snowGeo.attributes.position.needsUpdate=true;
}

/* ---------- PART 4: main loop ---------- */
fit(); build(); window.addEventListener('resize',fit);
window.setClimate({condition:'clear',temp:20,wind:8,mood:'day'});
Object.keys(tgt).forEach(function(k){var v=tgt[k];if(v&&v.isVector3)cur[k].copy(v);else if(v&&v.isColor)cur[k].copy(v);else cur[k]=v});
var last=performance.now(),tm=0,prevTs=-1,sentDone=false;
post({type:'ready'});
function loop(now){
  requestAnimationFrame(loop);
  var dt=Math.min(.1,Math.max(0,(now-last)/1000)); last=now; tm+=dt;
  var ts=clamp(tm/P.duration,0,1)*REF;
  if(ts!==prevTs){updateTubes(ts);prevTs=ts}
  updateLeaves(ts,tm); applyClimate(dt); stepPrecip(dt,tm);
  group.rotation.z=Math.sin(tm*1.3)*.006*cur.wind;
  renderer.render(scene,camera);
  if(!sentDone&&tm>P.duration+.5){sentDone=true;post({type:'done'})}
}
requestAnimationFrame(loop);
</script></body></html>`;