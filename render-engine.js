// ═══════════════════════════════════════
// 🐛 渲染引擎 v2 — 真实风格
// ═══════════════════════════════════════

// 简化perlin噪声
let pSeed=[];
for(let i=0;i<256;i++)pSeed.push(Math.random());
function pNoise(x,y){
  let ix=x|0,iy=y|0;
  let fx=x-ix,fy=y-iy;
  fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
  let a=pSeed[(ix&255)+(iy&255)*37&255];
  let b=pSeed[((ix+1)&255)+(iy&255)*37&255];
  let c=pSeed[(ix&255)+((iy+1)&255)*37&255];
  let d=pSeed[((ix+1)&255)+((iy+1)&255)*37&255];
  return a+(b-a)*fx+(c-a)*fy*((d-c)-(b-a));
}

function drawMap(){
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    let t=map[y][x],cx=x*T,cy=y*T;
    if(t===2){ // 池塘
      ctx.fillStyle=`hsl(210,70%,${45+Math.sin(gameTime*0.5+x+y)*3}%)`;
      ctx.fillRect(cx,cy,T,T);
      ctx.fillStyle=`rgba(200,230,255,${0.08+Math.sin(gameTime*2+x*0.5+y*0.3)*0.04})`;
      ctx.fillRect(cx+4,cy+6,T-8,4);
    }else if(t===1){ // 山路
      let n=pNoise(x*2.5,y*2.5);
      ctx.fillStyle=`hsl(35,15%,${45+n*15}%)`;
      ctx.fillRect(cx,cy,T,T);
      ctx.fillStyle=`rgba(80,70,50,${0.1+n*0.15})`;
      ctx.beginPath();ctx.arc(cx+8+n*10,cy+8+n*10,3+n*3,0,7);ctx.fill();
    }else{ // 草地 — 模拟航拍
      let n1=pNoise(x*1.7,y*1.7),n2=pNoise(x*0.3,y*0.3);
      let h=65+n1*15+n2*5;
      ctx.fillStyle=`hsl(110,50%,${h}%)`;
      ctx.fillRect(cx,cy,T,T);
      // 植被纹理
      if(n1>.2){
        ctx.fillStyle=`rgba(50,120,40,${(n1-.2)*0.15})`;
        ctx.beginPath();ctx.arc(cx+8+n1*16,cy+10+n1*12,2+n1*3,0,7);ctx.fill();
      }
    }
  }
}

// 画真实昆虫
function drawBug(b){
  let bx=b.x,by=b.y-(b.flying?12:0);
  
  // 影子
  ctx.fillStyle='rgba(0,0,0,.15)';ctx.beginPath();
  ctx.ellipse(bx+2,by+b.sz*.6,b.sz*.6,3,0,0,7);ctx.fill();

  // 不同昆虫不同画法
  if(b.id==='hopper')drawGrasshopper(bx,by,b.sz,b.dir);
  else if(b.id==='mantis')drawMantis(bx,by,b.sz,b.dir);
  else if(b.id==='beetle')drawBeetle(bx,by,b.sz,b.dir);
  else if(b.id==='butterfly')drawButterfly(bx,by,b.sz,b.dir,b.flying);
  else if(b.id==='cicada')drawCicada(bx,by,b.sz);
  else if(b.id==='spider')drawSpider(bx,by,b.sz);
  else drawDungBeetle(bx,by,b.sz);
}

function drawGrasshopper(x,y,s,dir){
  ctx.save();ctx.translate(x,y);ctx.rotate(dir);
  // 身体
  let g=ctx.createLinearGradient(-s*.8,0,s*.8,0);
  g.addColorStop(0,'#5a8a30');g.addColorStop(.5,'#7ab648');g.addColorStop(1,'#4a7a28');
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,s*.8,s*.4,0,0,7);ctx.fill();
  // 头
  ctx.fillStyle='#6a8a40';ctx.beginPath();ctx.arc(s*.6,-s*.1,s*.3,0,7);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.arc(s*.7,-s*.15,1.5,0,7);ctx.arc(s*.7,s*.05,1.5,0,7);ctx.fill();
  // 后腿
  ctx.strokeStyle='#5a7a28';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(-s*.3,s*.2);ctx.lineTo(-s*.7,s*.7);ctx.lineTo(-s*.5,s*.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-s*.3,-s*.2);ctx.lineTo(-s*.7,-s*.7);ctx.lineTo(-s*.5,-s*.8);ctx.stroke();
  // 翅膀
  ctx.fillStyle='rgba(150,200,100,0.3)';
  ctx.beginPath();ctx.ellipse(-s*.1,-s*.35,s*.4,s*.15,-.1,0,7);ctx.fill();
  // 触角
  ctx.strokeStyle='#4a6a20';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(s*.7,-s*.2);ctx.lineTo(s*1.1,-s*.5);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*.7,s*.2);ctx.lineTo(s*1.1,s*.5);ctx.stroke();
  ctx.restore();
}

function drawMantis(x,y,s,dir){
  ctx.save();ctx.translate(x,y);ctx.rotate(dir);
  // 身体 — 细长
  let g=ctx.createLinearGradient(-s*1,0,s*1,0);
  g.addColorStop(0,'#4a7a30');g.addColorStop(.5,'#6aaa40');g.addColorStop(1,'#3a6a20');
  ctx.fillStyle=g;ctx.beginPath();
  ctx.moveTo(-s*.8,0);ctx.lineTo(0,-s*.2);ctx.lineTo(s*.8,-s*.1);ctx.lineTo(s*.8,s*.1);ctx.lineTo(0,s*.2);ctx.closePath();ctx.fill();
  // 头 — 三角形
  ctx.fillStyle='#5a8a30';ctx.beginPath();
  ctx.moveTo(s*.6,-s*.3);ctx.lineTo(s*1.1,0);ctx.lineTo(s*.6,s*.3);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(s*.9,-s*.1,2,0,7);ctx.arc(s*.9,s*.1,2,0,7);ctx.fill();
  // 捕捉足
  ctx.strokeStyle='#4a7a28';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(0,-s*.1);ctx.lineTo(-s*.3,-s*.6);ctx.lineTo(-s*.5,-s*.5);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,s*.1);ctx.lineTo(-s*.3,s*.6);ctx.lineTo(-s*.5,s*.5);ctx.stroke();
  // 翅膀
  ctx.fillStyle='rgba(120,180,80,0.25)';
  ctx.beginPath();ctx.ellipse(-s*.2,-s*.3,s*.4,s*.12,-.05,0,7);ctx.fill();
  ctx.restore();
}

function drawBeetle(x,y,s,dir){
  ctx.save();ctx.translate(x,y);ctx.rotate(dir);
  // 身体 — 大
  let g=ctx.createRadialGradient(0,-s*.1,0,0,0,s*.9);
  g.addColorStop(0,'#5a3a1a');g.addColorStop(.5,'#4a2a10');g.addColorStop(1,'#3a1a00');
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,s*.9,s*.5,0,0,7);ctx.fill();
  // 头
  ctx.fillStyle='#3a2a10';ctx.beginPath();ctx.arc(s*.6,-s*.05,s*.3,0,7);ctx.fill();
  // 角
  ctx.strokeStyle='#2a1a00';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(s*.7,-s*.15);ctx.lineTo(s*1.1,-s*.35);ctx.lineTo(s*1.2,-s*.2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*.7,s*.15);ctx.lineTo(s*1.1,s*.35);ctx.lineTo(s*1.2,s*.2);ctx.stroke();
  // 背线
  ctx.strokeStyle='rgba(30,15,0,0.3)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-s*.4,-s*.1);ctx.lineTo(s*.4,0);ctx.stroke();
  // 腿
  ctx.strokeStyle='#3a2010';ctx.lineWidth=1.5;
  for(let i=-1;i<=1;i+=1){
    if(i===0)continue;
    ctx.beginPath();ctx.moveTo(i*s*.3,s*.1);ctx.lineTo(i*s*.7,s*.55);ctx.stroke();
  }
  ctx.restore();
}

function drawButterfly(x,y,s,dir,flying){
  ctx.save();ctx.translate(x,y);
  let wingFlap=flying?Math.sin(gameTime*12)*.3:.05;
  // 左翅
  let g=ctx.createRadialGradient(-s*.4,-s*.2,0,0,0,s*.8);
  g.addColorStop(0,'#ff88c0');g.addColorStop(.3,'#ffaa40');g.addColorStop(.7,'#e890d0');g.addColorStop(1,'#8a60aa');
  ctx.fillStyle=g;
  ctx.beginPath();ctx.ellipse(-s*.4,-s*.2+wingFlap,s*.6,s*.4,-.2,0,7);ctx.fill();
  // 右翅
  ctx.fillStyle=g;
  ctx.beginPath();ctx.ellipse(s*.4,-s*.2+wingFlap,s*.6,s*.4,.2,0,7);ctx.fill();
  // 身体
  ctx.fillStyle='#2a2a2a';ctx.beginPath();ctx.ellipse(0,0,s*.1,s*.3,0,0,7);ctx.fill();
  // 触角
  ctx.strokeStyle='#2a2a2a';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,-s*.25);ctx.lineTo(-s*.3,-s*.5);ctx.moveTo(0,-s*.25);ctx.lineTo(s*.3,-s*.5);ctx.stroke();
  ctx.restore();
}

function drawCicada(x,y,s){
  // 知了在树上
  ctx.fillStyle='#4a6a3a';ctx.fillRect(x-4,y-14,8,22);
  ctx.fillStyle='#5a8a3a';ctx.beginPath();ctx.arc(x,y-16,12,0,7);ctx.fill();
  // 知了身体
  ctx.fillStyle='#3a4a2a';ctx.beginPath();ctx.ellipse(x,y-12,5,4,0,0,7);ctx.fill();
  ctx.fillStyle='rgba(180,200,150,0.3)';ctx.beginPath();ctx.ellipse(x-2,y-14,3,2,-.2,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+2,y-14,3,2,.2,0,7);ctx.fill();
  // 眼
  ctx.fillStyle='#cc3333';ctx.beginPath();ctx.arc(x-2,y-13,1.5,0,7);ctx.arc(x+2,y-13,1.5,0,7);ctx.fill();
}

function drawSpider(x,y,s){
  ctx.save();ctx.translate(x,y);
  // 网
  ctx.strokeStyle='rgba(200,200,200,0.15)';ctx.lineWidth=.5;
  for(let i=0;i<8;i++){let a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*s*2.5,Math.sin(a)*s*2.5);ctx.stroke()}
  for(let r=1;r<=2;r+=.5){ctx.beginPath();ctx.arc(0,0,s*r*1.2,0,7);ctx.stroke()}
  // 身体
  ctx.fillStyle='#2a2a2a';ctx.beginPath();ctx.ellipse(0,0,s*.4,s*.35,0,0,7);ctx.fill();
  ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.ellipse(0,-s*.3,s*.3,s*.25,0,0,7);ctx.fill();
  // 眼
  ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(-s*.15,-s*.35,1.5,0,7);ctx.arc(s*.15,-s*.35,1.5,0,7);ctx.fill();
  // 腿
  ctx.strokeStyle='#1a1a1a';ctx.lineWidth=1.2;
  for(let i=0;i<4;i++){
    let a=i*.8-.4;ctx.beginPath();ctx.moveTo(0,0);
    ctx.lineTo(Math.cos(a)*s*1.2,Math.sin(a)*s*1.2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,0);
    ctx.lineTo(Math.cos(a+Math.PI)*s*1.2,Math.sin(a+Math.PI)*s*1.2);ctx.stroke();
  }
  ctx.restore();
}

function drawDungBeetle(x,y,s){
  ctx.save();ctx.translate(x,y);
  // 粪球
  let bg=ctx.createRadialGradient(-2,4,0,0,3,s*.8);
  bg.addColorStop(0,'#6a4a2a');bg.addColorStop(.5,'#5a3a1a');bg.addColorStop(1,'#3a2a10');
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(s*.5,s*.3,s*.6,0,7);ctx.fill();
  // 屎壳郎身体
  ctx.fillStyle='#2a1a0a';ctx.beginPath();ctx.ellipse(0,0,s*.6,s*.35,0,0,7);ctx.fill();
  ctx.fillStyle='#1a0a00';ctx.beginPath();ctx.arc(-s*.4,-s*.1,s*.3,0,7);ctx.fill();
  // 腿
  ctx.strokeStyle='#1a0a00';ctx.lineWidth=1.5;
  for(let i=-1;i<=1;i+=1){
    if(i===0)continue;
    ctx.beginPath();ctx.moveTo(i*s*.2,s*.1);ctx.lineTo(i*s*.5,s*.5);ctx.stroke();
  }
  ctx.restore();
}

// 玩家 — 更真实风格
function drawPlayer(){
  if(gameOver)return;
  ctx.save();ctx.translate(pl.x,pl.y);
  let sz=pl.sz;
  // 影子
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();
  ctx.ellipse(2,sz*.6,sz*.7,4,0,0,7);ctx.fill();
  // 身体 — 渐变
  let bg=ctx.createLinearGradient(-sz,0,sz,0);
  bg.addColorStop(0,poisoned?'#a080c0':'#e8c8a8');
  bg.addColorStop(.5,poisoned?'#c0a0d0':'#f0d8b8');
  bg.addColorStop(1,poisoned?'#9070b0':'#d8b898');
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,sz,0,7);ctx.fill();
  // 头
  let hg=ctx.createLinearGradient(-sz*.5,-sz*.5,sz*.5,sz*.5);
  hg.addColorStop(0,poisoned?'#d0b8e0':'#f0dcc0');
  hg.addColorStop(1,poisoned?'#b098c8':'#e0c0a0');
  ctx.fillStyle=hg;ctx.beginPath();ctx.arc(0,-sz*.3,sz*.5,0,7);ctx.fill();
  // 帽子
  ctx.fillStyle='#c89830';ctx.beginPath();
  ctx.ellipse(0,-sz*.6,sz*.55,sz*.12,0,0,7);ctx.fill();
  ctx.fillRect(-sz*.4,-sz*.8,sz*.8,sz*.25);
  // 眼
  ctx.fillStyle='#333';ctx.beginPath();
  ctx.arc(-sz*.2,-sz*.35,2.5,0,7);ctx.arc(sz*.2,-sz*.35,2.5,0,7);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();
  ctx.arc(-sz*.17,-sz*.38,1,0,7);ctx.arc(sz*.23,-sz*.38,1,0,7);ctx.fill();
  // 嘴
  ctx.strokeStyle='#c08060';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(0,-sz*.15,sz*.12,0.1,Math.PI-0.1);ctx.stroke();
  // 抄子
  let d2=pl.dir;ctx.strokeStyle='#8B4513';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(Math.cos(d2)*sz*.5,Math.sin(d2)*sz*.5);
  ctx.lineTo(Math.cos(d2)*(sz+18),Math.sin(d2)*(sz+18));ctx.stroke();
  ctx.strokeStyle='rgba(200,200,200,0.4)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(Math.cos(d2)*(sz+22),Math.sin(d2)*(sz+22),8,0,7);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fill();
  ctx.restore();
}
