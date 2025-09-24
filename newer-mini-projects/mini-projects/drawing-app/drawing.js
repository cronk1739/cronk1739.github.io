// Basic Paint-like drawing app
(() =>{
  const canvas = document.getElementById('paint');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const colorEl = document.getElementById('color');
  const sizeEl = document.getElementById('size');
  const toolEl = document.getElementById('tool');
  const undoBtn = document.getElementById('undo');
  const clearBtn = document.getElementById('clear');
  const saveBtn = document.getElementById('save');
  const resizeBtn = document.getElementById('resize');
  const wIn = document.getElementById('canvas-width');
  const hIn = document.getElementById('canvas-height');

  let drawing = false;
  let start = {x:0,y:0};
  let last = {x:0,y:0};
  let tool = 'pen';
  let brush = parseInt(sizeEl.value,10) || 6;
  let color = colorEl.value || '#111';

  // undo stack of ImageData (limit to 30)
  const undoStack = [];
  const redoStack = [];
  const redoBtn = document.getElementById('redo');
  const canvasWrap = document.getElementById('canvas-wrap');
  const MAX_UNDO = 30;
  function pushUndo(){
    try{
      const data = ctx.getImageData(0,0,canvas.width,canvas.height);
      undoStack.push(data);
      if(undoStack.length>MAX_UNDO) undoStack.shift();
      // new action invalidates redo history
      redoStack.length = 0;
      if(redoBtn) redoBtn.disabled = true;
      undoBtn.disabled = false;
    }catch(e){ console.warn('Unable to push undo', e); }
  }
  function doUndo(){
    if(!undoStack.length) return;
    const img = undoStack.pop();
    // move current state to redo
    try{ const cur = ctx.getImageData(0,0,canvas.width,canvas.height); redoStack.push(cur); }catch(e){}
    ctx.putImageData(img,0,0);
    undoBtn.disabled = undoStack.length === 0;
    if(redoBtn) redoBtn.disabled = redoStack.length === 0;
  }

  function doRedo(){
    if(!redoStack.length) return;
    const img = redoStack.pop();
    try{ const cur = ctx.getImageData(0,0,canvas.width,canvas.height); undoStack.push(cur); }catch(e){}
    ctx.putImageData(img,0,0);
    // update buttons
    undoBtn.disabled = undoStack.length === 0;
    if(redoBtn) redoBtn.disabled = redoStack.length === 0;
  }

  function setCanvasSize(w,h){
    // preserve current drawing when resizing larger by copying into temp canvas
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d');
    tctx.fillStyle = '#fff'; tctx.fillRect(0,0,w,h);
    tctx.drawImage(canvas, 0, 0);
    canvas.width = w; canvas.height = h;
    ctx.drawImage(tmp,0,0);
  }

  function clearCanvas(){ pushUndo(); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); }

  // coordinate helpers
  function posFromEvent(e){
    const r = canvas.getBoundingClientRect();
    return { x: Math.round((e.clientX - r.left) * (canvas.width / r.width)), y: Math.round((e.clientY - r.top) * (canvas.height / r.height)) };
  }

  // drawing primitives
  function drawLine(a,b,opts={}){
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = opts.color || color;
    ctx.lineWidth = opts.width || brush;
    ctx.beginPath(); ctx.moveTo(a.x+0.5,a.y+0.5); ctx.lineTo(b.x+0.5,b.y+0.5); ctx.stroke(); ctx.restore();
  }
  function drawRect(a,b,opts={}){
    ctx.save();
    ctx.strokeStyle = opts.color||color;
    ctx.fillStyle = opts.fillColor||opts.color||color;
    ctx.lineWidth = opts.width||brush;
    const x = a.x, y = a.y, w = b.x - a.x, h = b.y - a.y;
    ctx.beginPath(); ctx.rect(x,y,w,h);
    if(opts.fill) ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function drawCircle(a,b,opts={}){
    const dx = b.x - a.x, dy = b.y - a.y; const r = Math.sqrt(dx*dx+dy*dy);
    ctx.save();
    ctx.beginPath(); ctx.arc(a.x,a.y,r,0,Math.PI*2);
    ctx.strokeStyle = opts.color||color;
    ctx.fillStyle = opts.fillColor||opts.color||color;
    ctx.lineWidth = opts.width||brush;
    if(opts.fill) ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // flood fill (stack-based) - works reasonably for moderate sizes
  function floodFill(x,y, fillColor){
    const w = canvas.width, h = canvas.height;
    const img = ctx.getImageData(0,0,w,h);
    const data = img.data;
    const idx = (y*w + x) * 4;
    const targetR = data[idx], targetG = data[idx+1], targetB = data[idx+2], targetA = data[idx+3];
    const newCol = hexToRgba(fillColor);
    if(targetR===newCol.r && targetG===newCol.g && targetB===newCol.b && targetA===newCol.a) return; // nothing to do
    const stack = [[x,y]];
    while(stack.length){
      const [sx,sy] = stack.pop();
      let px = sx, py = sy;
      // move up to find top of span
      while(py>=0){ const i=(py*w+px)*4; if(data[i]===targetR && data[i+1]===targetG && data[i+2]===targetB && data[i+3]===targetA) py--; else break; }
      py++;
      let reachLeft=false, reachRight=false;
      while(py<h){
        const i=(py*w+px)*4;
        if(!(data[i]===targetR && data[i+1]===targetG && data[i+2]===targetB && data[i+3]===targetA)) break;
        // color pixel
        data[i]=newCol.r; data[i+1]=newCol.g; data[i+2]=newCol.b; data[i+3]=newCol.a;
        // check left
        if(px-1>=0){ const li=(py*w + (px-1))*4; if(data[li]===targetR && data[li+1]===targetG && data[li+2]===targetB && data[li+3]===targetA){ if(!reachLeft){ stack.push([px-1,py]); reachLeft=true; } } else reachLeft=false; }
        // check right
        if(px+1<w){ const ri=(py*w + (px+1))*4; if(data[ri]===targetR && data[ri+1]===targetG && data[ri+2]===targetB && data[ri+3]===targetA){ if(!reachRight){ stack.push([px+1,py]); reachRight=true; } } else reachRight=false; }
        py++;
      }
    }
    ctx.putImageData(img,0,0);
  }

  function hexToRgba(hex){
    const h = hex.replace('#','');
    let r=0,g=0,b=0,a=255;
    if(h.length===3){ r=parseInt(h[0]+h[0],16); g=parseInt(h[1]+h[1],16); b=parseInt(h[2]+h[2],16); }
    else if(h.length===6){ r=parseInt(h.substr(0,2),16); g=parseInt(h.substr(2,2),16); b=parseInt(h.substr(4,2),16); }
    else { r=g=b=0; }
    return {r,g,b,a};
  }

  // pointer event handlers
  function onPointerDown(e){
    if(e.button!==0 && e.pointerType!=='touch') return; // left button or touch
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    drawing = true; tool = toolEl.value;
    start = last = posFromEvent(e);
    if(tool === 'fill'){
      pushUndo(); floodFill(last.x,last.y,color);
      drawing = false; canvas.releasePointerCapture(e.pointerId); return;
    }
    if(tool === 'eraser'){
      pushUndo(); ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = brush; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(last.x,last.y);
      return;
    }
    // for pen, begin path
    pushUndo();
    if(tool==='pen'){
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = brush; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(last.x+0.5,last.y+0.5);
    }
  }
  function onPointerMove(e){ if(!drawing) return; e.preventDefault(); const p = posFromEvent(e);
    if(tool==='pen' || tool==='eraser'){
      ctx.lineTo(p.x+0.5,p.y+0.5); ctx.stroke(); last = p; return;
    }
    // dynamic preview: redraw from saved current state
    // create overlay by drawing on temporary canvas and copying
    // For simplicity, we'll clear the top layer and redraw by restoring last saved image then drawing the preview shape
    // restore last undo state (peek)
    const img = undoStack[undoStack.length-1]; if(img) ctx.putImageData(img,0,0);
    const fillPreview = fillShapesChk && fillShapesChk.checked;
    if(tool==='line') drawLine(start,p,{color:color,width:brush});
    if(tool==='rect') drawRect(start,p,{color:color,width:brush, fill: fillPreview});
    if(tool==='circle') drawCircle(start,p,{color:color,width:brush, fill: fillPreview});
  }
  function onPointerUp(e){ if(!drawing) return; drawing=false; canvas.releasePointerCapture(e.pointerId); const p = posFromEvent(e);
    if(tool==='pen') { ctx.closePath(); ctx.restore(); }
    else if(tool==='eraser'){ ctx.closePath(); ctx.globalCompositeOperation='source-over'; }
    else if(tool==='line') drawLine(start,p,{color:color,width:brush});
    else if(tool==='rect') drawRect(start,p,{color:color,width:brush, fill: fillShapesChk && fillShapesChk.checked});
    else if(tool==='circle') drawCircle(start,p,{color:color,width:brush, fill: fillShapesChk && fillShapesChk.checked});
  }

  // wire up controls
  colorEl.addEventListener('input', ()=> color = colorEl.value );
  sizeEl.addEventListener('input', ()=> brush = parseInt(sizeEl.value,10));
  toolEl.addEventListener('change', ()=> tool = toolEl.value);
  undoBtn.addEventListener('click', doUndo);
  if(redoBtn) redoBtn.addEventListener('click', doRedo);
  clearBtn.addEventListener('click', ()=>{ if(confirm('Clear canvas?')) clearCanvas(); });
  saveBtn.addEventListener('click', ()=>{
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'drawing.png'; a.click();
  });
  resizeBtn.addEventListener('click', ()=>{
    const w = Math.max(100, parseInt(wIn.value,10)||800); const h = Math.max(100, parseInt(hIn.value,10)||600);
    if(confirm('Resizing will preserve current drawing as much as possible. Continue?')) setCanvasSize(w,h);
  });

  // pointer listeners
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // secondary toolbar controls
  const fillShapesChk = document.getElementById('fill-shapes');
  const smoothingChk = document.getElementById('smoothing');
  const toggleGridBtn = document.getElementById('toggle-grid');
  const presets = document.querySelectorAll('#presets .preset');
  presets.forEach(p=> p.addEventListener('click', ()=>{ const c=p.dataset.color; colorEl.value = c; color = c; }));
  let gridOn = false;
  toggleGridBtn.addEventListener('click', ()=>{
    gridOn = !gridOn; if(gridOn) canvasWrap.classList.add('grid-bg'); else canvasWrap.classList.remove('grid-bg');
  });
  smoothingChk.addEventListener('change', ()=>{
    if(smoothingChk.checked) canvas.classList.add('smoothing-on'); else canvas.classList.remove('smoothing-on');
  });

  // initialize
  function init(){
    const w = parseInt(wIn.value,10) || 1000; const h = parseInt(hIn.value,10) || 700;
    canvas.width = w; canvas.height = h; canvas.style.width = w+'px'; canvas.style.height = h+'px';
    // default white background
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    // push initial state
    pushUndo(); undoStack.length=0; // keep only blank as initial if wanted
    pushUndo(); undoStack.pop(); // ensure undo button disabled
    undoBtn.disabled = true;

    // keyboard shortcuts
    window.addEventListener('keydown', (e)=>{
      if(e.key==='z' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); doUndo(); }
      if(e.key==='y' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); doRedo(); }
      if(e.key==='Escape') { drawing=false; }
    });
  }

  init();
})();
