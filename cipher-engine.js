/* Cipher Studio reusable engine. Add cipher files before this script. */

const plain=document.getElementById('plain'), mode=document.getElementById('mode'),seed=document.getElementById('seed'),compounds=document.getElementById('compounds'),output=document.getElementById('output'),status=document.getElementById('status');
const direction=document.getElementById('direction'),sharp=document.getElementById('sharp'),cipher=document.getElementById('cipher');
const definitions=window.CIPHER_DEFINITIONS;
const cipherMenu=document.getElementById('cipher');
cipherMenu.replaceChildren();
for(const [id,def] of Object.entries(definitions)){
 const opt=document.createElement('option');opt.value=id;opt.textContent=def.name+' ('+def.glyphs.length+' glyphs)';cipherMenu.append(opt);
}
let activeKey=definitions[cipher.value].glyphs;
// Crisp: threshold grayscale at 190, preserving the original source images.
// Preserve source images; cache thresholded copies separately for display and export.
const broadCache=new Map();
function broadSource(e){return broadCache.get(e.img)||e.img}
function glyphSource(e){return sharp.value==='crisp'?broadSource(e):e.img}
async function prepareBroad(){
  await Promise.all(activeKey.map(async e=>{
    if(broadCache.has(e.img))return;
    const img=new Image();img.src=e.img;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);
    const data=ctx.getImageData(0,0,canvas.width,canvas.height);
    for(let i=0;i<data.data.length;i+=4){
      const a=data.data[i+3]/255;
      const gray=(.2126*data.data[i]+.7152*data.data[i+1]+.0722*data.data[i+2])*a+255*(1-a);
      const value=gray<=190?0:255;
      data.data[i]=data.data[i+1]=data.data[i+2]=value;data.data[i+3]=255;
    }
    ctx.putImageData(data,0,0);broadCache.set(e.img,canvas.toDataURL('image/png'));
  }));
}

let selected=[];
function updateView(){let decoding=direction.value==='decode';document.getElementById('encodePanel').hidden=decoding;document.getElementById('outputPanel').hidden=decoding;document.getElementById('decodePanel').hidden=!decoding;mode.disabled=decoding;seed.disabled=decoding;compounds.disabled=decoding;renderPalette();renderDecoded()}
function renderPalette(){let palette=document.getElementById('glyphPalette');palette.replaceChildren();let filter=document.getElementById('glyphFilter').value.trim().toUpperCase();for(let e of activeKey){if(filter&&!((e.label+' '+e.value).toUpperCase().includes(filter)))continue;let b=document.createElement('button');b.type='button';b.title=e.label+' → '+(e.value||'unknown');let im=document.createElement('img');im.src=glyphSource(e);im.alt='Glyph '+e.label;let small=document.createElement('small');small.textContent=e.label;b.append(im,small);b.onclick=()=>{selected.push(e);renderDecoded()};palette.append(b)}}
function renderDecoded(){let area=document.getElementById('selectedGlyphs');area.replaceChildren();let decoded='';for(let e of selected){if(e===null){decoded+=' ';let sp=document.createElement('span');sp.className='space';area.append(sp);continue}decoded+=e.value&&/^[A-Z0-9,]+$/.test(e.value)?e.value:'[?'+e.label+']';let el=document.createElement('span');el.className='glyph';el.title=e.label+' → '+(e.value||'unknown');let im=document.createElement('img');im.src=glyphSource(e);im.alt=e.label;el.append(im);area.append(el)}document.getElementById('decoded').value=decoded}
document.getElementById('glyphFilter').oninput=renderPalette;
document.getElementById('undoGlyph').onclick=()=>{selected.pop();renderDecoded()};
document.getElementById('spaceGlyph').onclick=()=>{selected.push(null);renderDecoded()};
document.getElementById('clearGlyph').onclick=()=>{selected=[];renderDecoded()};
document.getElementById('copyDecoded').onclick=()=>navigator.clipboard.writeText(document.getElementById('decoded').value).catch(()=>window.prompt('Copy plaintext:',document.getElementById('decoded').value));
document.getElementById('saveDecoded').onclick=()=>download(new Blob([document.getElementById('decoded').value],{type:'text/plain'}),'decoded-plaintext.txt');
direction.onchange=updateView;sharp.onchange=()=>{document.body.classList.remove('render-balanced','render-original','render-crisp');document.body.classList.add('render-'+sharp.value);if(sharp.value==='crisp'){prepareBroad().then(()=>{if(sharp.value==='crisp'){encode();renderPalette();renderDecoded()}})}else{encode();renderPalette();renderDecoded()}};sharp.onchange();cipher.onchange=()=>{activeKey=definitions[cipher.value].glyphs;selected=[];encode();updateView();if(sharp.value==='crisp')prepareBroad().then(()=>{encode();renderPalette();renderDecoded()})};
let tokens=[];
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function randomIndex(s,n){return hash(seed.value+'|'+s)%n}
function encode(){let source=plain.value.toUpperCase(), groups={};for(const e of activeKey){if(!e.value||!(/^[A-Z0-9]+$/).test(e.value))continue;if(!compounds.checked&&e.value.length>1)continue;(groups[e.value]??=[]).push(e)}
for(const g of Object.values(groups))g.sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));
let vals=Object.keys(groups).sort((a,b)=>b.length-a.length||a.localeCompare(b));let counts={},newTokens=[];let pos=0;
while(pos<source.length){let match=vals.find(v=>source.startsWith(v,pos));if(!match){newTokens.push({char:plain.value[pos]});pos++;continue}let candidates=groups[match],num=counts[match]||0;counts[match]=num+1;let idx=mode.value==='first'?0:mode.value==='sequential'?num%candidates.length:randomIndex(match+'|'+num,candidates.length);newTokens.push({entry:candidates[idx]});pos+=match.length}
tokens=newTokens;output.replaceChildren();let encoded=0;for(const t of tokens){let el=document.createElement('span');if(t.entry){el.className='glyph';el.title=t.entry.label+' → '+t.entry.value;let im=document.createElement('img');im.src=glyphSource(t.entry);im.alt=t.entry.label;el.append(im);encoded++}else if(t.char===' '){el.className='space';el.textContent=' '}else{el.textContent=t.char;el.className=/[A-Za-z]/.test(t.char)?'unknown':''}output.append(el)}status.textContent=encoded+' glyphs • '+activeKey.length+' glyph definitions loaded';}
for(const line of ['1234567890','QWERTYUIOP','ASDFGHJKL','ZXCVBNM']){let row=document.createElement('div');row.className='keys';for(const ch of line){let b=document.createElement('button');b.textContent=ch;b.onclick=()=>insert(ch);row.append(b)}document.getElementById('keyboard').append(row)}
function insert(s){let start=plain.selectionStart,end=plain.selectionEnd;plain.setRangeText(s,start,end,'end');plain.focus();encode()}
document.getElementById('space').onclick=()=>insert(' ');document.getElementById('back').onclick=()=>{let a=plain.selectionStart,b=plain.selectionEnd;if(a===b&&a>0)a--;plain.setRangeText('',a,b,'end');plain.focus();encode()};document.getElementById('clear').onclick=()=>{plain.value='';encode()};
function download(blob,name){let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
document.getElementById('copy').onclick=async()=>{let s=tokens.map(t=>t.entry?'['+t.entry.label+']':t.char).join('');try{await navigator.clipboard.writeText(s);status.textContent='Glyph IDs copied'}catch{let t=document.createElement('textarea');t.value=s;document.body.append(t);t.select();document.execCommand('copy');t.remove();status.textContent='Glyph IDs copied'}};
document.getElementById('save').onclick=()=>download(new Blob([plain.value],{type:'text/plain'}),'cipher-plaintext.txt');
document.getElementById('export').onclick=async()=>{let items=[];for(const t of tokens){if(t.entry){let im=new Image();im.src=glyphSource(t.entry);await im.decode();items.push({im})}else items.push({char:t.char})}let maxWidth=1100,x=20,y=20,rowHeight=95,placed=[];for(const it of items){let w=it.im?Math.max(38,it.im.width+24):it.char===' '?24:24;if(it.char==='\n'){x=20;y+=rowHeight;continue}if(x+w>maxWidth-20){x=20;y+=rowHeight}placed.push({...it,x,y,w});x+=w+12}let canvas=document.createElement('canvas');canvas.width=maxWidth;canvas.height=y+rowHeight+10;let ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#111';ctx.font='24px sans-serif';for(const it of placed){if(it.im){ctx.drawImage(it.im,it.x,it.y+Math.max(0,(65-it.im.height)/2))}else ctx.fillText(it.char,it.x,it.y+40)}canvas.toBlob(blob=>download(blob,'cipher-ciphertext.png'),'image/png')};
for(const el of [plain,mode,seed,compounds])el.addEventListener(el===plain||el===seed?'input':'change',encode);encode();updateView();
