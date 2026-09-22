(() => {
'use strict';

const OWNER='amsasw', REPO='hello-world', CODE_BRANCH='main', IMAGE_BRANCH='images', MAX_BYTES=10*1024*1024;
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));

const token=$('#token'), fileInput=$('#file'), drop=$('#drop'), previewBox=$('#previewBox'), preview=$('#preview');
const fileName=$('#fileName'), fileSize=$('#fileSize'), saving=$('#saving'), uploadBtn=$('#upload');
const statusEl=$('#status'), progress=$('#progress'), result=$('#result'), toast=$('#toast');
const quality=$('#quality'), qualityOut=$('#qualityOut'), maxSide=$('#maxSide'), webpToggle=$('#webpToggle');
const gallery=$('#gallery'), historyStatus=$('#historyStatus'), historySearch=$('#historySearch'), showMore=$('#showMore');

let selectedFile=null, uploadFile=null, previewUrl='', historyFiles=[], visibleCount=24;

function headers(){
  const h={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  const t=token.value.trim(); if(t) h.Authorization='Bearer '+t;
  return h;
}
function humanSize(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB'}
function pctSaved(a,b){if(!a||b>=a)return 0;return Math.round((1-b/a)*100)}
function safeStem(name){
  const dot=name.lastIndexOf('.');
  return (dot>-1?name.slice(0,dot):name).normalize('NFKD').replace(/[^a-zA-Z0-9-_]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55)||'image';
}
function extOf(name){const m=name.toLowerCase().match(/\.[a-z0-9]+$/);return m?m[0]:''}
function setStatus(t,e=false){statusEl.textContent=t;statusEl.classList.toggle('error',e)}
function showToast(t){toast.textContent=t;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),1400)}
function revokePreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=''}}
function readAsBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=()=>rej(r.error);r.readAsDataURL(blob)})}
function copyText(text){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(text);const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve()}

async function decodeImage(file){
  if('createImageBitmap' in window) return await createImageBitmap(file);
  return await new Promise((res,rej)=>{const img=new Image();const u=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(u);res(img)};img.onerror=e=>{URL.revokeObjectURL(u);rej(e)};img.src=u});
}
async function optimizeFile(file){
  uploadBtn.disabled=true;
  setStatus('正在本地优化图片…');
  if(file.type==='image/gif'||!webpToggle.checked){
    uploadFile=file;
    updatePreviewInfo(file,file,false);
    uploadBtn.disabled=false;
    setStatus(file.type==='image/gif'?'GIF 保留原动画，准备上传。':'已关闭 WebP 转换，准备上传。');
    return;
  }
  try{
    const img=await decodeImage(file);
    const iw=img.width||img.naturalWidth, ih=img.height||img.naturalHeight;
    const limit=Number(maxSide.value)||0;
    const scale=limit&&Math.max(iw,ih)>limit?limit/Math.max(iw,ih):1;
    const ow=Math.max(1,Math.round(iw*scale)), oh=Math.max(1,Math.round(ih*scale));
    const c=document.createElement('canvas');c.width=ow;c.height=oh;
    const x=c.getContext('2d',{alpha:true});x.drawImage(img,0,0,ow,oh);
    if(img.close) img.close();
    const blob=await new Promise(res=>c.toBlob(res,'image/webp',Number(quality.value)/100));
    if(!blob) throw new Error('浏览器无法编码 WebP');
    const webp=new File([blob],safeStem(file.name)+'.webp',{type:'image/webp',lastModified:Date.now()});
    const resized=scale<1;
    uploadFile=(!resized&&webp.size>=file.size)?file:webp;
    updatePreviewInfo(file,uploadFile,resized);
    setStatus(uploadFile===file?'WebP 没有更小，自动保留原图。':'优化完成，准备上传。');
  }catch(e){
    uploadFile=file;
    updatePreviewInfo(file,file,false);
    setStatus('WebP 转换失败，已自动改为上传原图。');
  }finally{uploadBtn.disabled=false}
}
function updatePreviewInfo(original,out,resized){
  revokePreview();previewUrl=URL.createObjectURL(out);preview.src=previewUrl;
  fileName.textContent=out.name;
  const saved=pctSaved(original.size,out.size);
  fileSize.textContent=humanSize(original.size)+' → '+humanSize(out.size)+' · '+out.type;
  saving.textContent=saved>0?'节省 '+saved+'%'+(resized?' · 已缩放尺寸':''):'保持原文件';
}
async function choose(file){
  if(!file)return;
  if(!file.type.startsWith('image/'))return setStatus('请选择图片文件。',true);
  if(file.size>MAX_BYTES)return setStatus('原图片不能超过 10 MB。',true);
  selectedFile=file;uploadFile=null;previewBox.classList.remove('hidden');result.classList.add('hidden');
  await optimizeFile(file);
}
let optimizeTimer=0;
function reoptimize(){if(!selectedFile)return;clearTimeout(optimizeTimer);optimizeTimer=setTimeout(()=>optimizeFile(selectedFile),160)}

drop.addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',()=>choose(fileInput.files&&fileInput.files[0]));
['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('drag')}));
['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('drag')}));
drop.addEventListener('drop',e=>choose(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]));
quality.addEventListener('input',()=>{qualityOut.textContent=quality.value;reoptimize()});
maxSide.addEventListener('change',reoptimize);webpToggle.addEventListener('change',reoptimize);
$('#toggleToken').addEventListener('click',e=>{const show=token.type==='password';token.type=show?'text':'password';e.currentTarget.textContent=show?'隐藏':'显示'});

uploadBtn.addEventListener('click',async()=>{
  const t=token.value.trim();
  if(!uploadFile)return setStatus('请先选择图片。',true);
  if(!t)return setStatus('请先输入 GitHub Token。',true);
  uploadBtn.disabled=true;progress.classList.remove('hidden');result.classList.add('hidden');setStatus('正在上传到 GitHub…');
  try{
    const now=new Date(), y=now.getUTCFullYear(), m=String(now.getUTCMonth()+1).padStart(2,'0');
    const stamp=now.toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
    const path='images/'+y+'/'+m+'/'+stamp+'-'+safeStem(uploadFile.name)+extOf(uploadFile.name);
    const content=await readAsBase64(uploadFile);
    const r=await fetch('https://api.github.com/repos/'+OWNER+'/'+REPO+'/contents/'+encodeURIComponent(path).replace(/%2F/g,'/'),{
      method:'PUT',headers:{...headers(),'Content-Type':'application/json'},
      body:JSON.stringify({message:'upload: '+uploadFile.name,content,branch:IMAGE_BRANCH})
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.message||('HTTP '+r.status));
    const raw='https://raw.githubusercontent.com/'+OWNER+'/'+REPO+'/'+IMAGE_BRANCH+'/'+path;
    const cdn='https://cdn.jsdelivr.net/gh/'+OWNER+'/'+REPO+'@'+IMAGE_BRANCH+'/'+path;
    const alt=safeStem(uploadFile.name);
    $('#cdnUrl').value=cdn;$('#rawUrl').value=raw;$('#markdownUrl').value='!['+alt+']('+cdn+')';$('#htmlUrl').value='<img src="'+cdn+'" alt="'+alt+'">';$('#openImage').href=raw;
    result.classList.remove('hidden');setStatus('上传完成。');showToast('上传成功');loadHistory();
  }catch(e){setStatus('上传失败：'+(e.message||e),true)}
  finally{uploadBtn.disabled=false;progress.classList.add('hidden')}
});

document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-copy]');if(!b)return;
  const input=$('#'+b.dataset.copy);if(!input)return;
  try{await copyText(input.value);showToast('已复制')}catch{}
});

async function loadHistory(){
  historyStatus.textContent='正在读取仓库中的图片…';
  gallery.innerHTML='';
  try{
    const br=await fetch('https://api.github.com/repos/'+OWNER+'/'+REPO+'/branches/'+IMAGE_BRANCH,{headers:headers()});
    if(!br.ok)throw new Error('无法读取分支');
    const bd=await br.json(), treeSha=bd.commit.commit.tree.sha;
    const tr=await fetch('https://api.github.com/repos/'+OWNER+'/'+REPO+'/git/trees/'+treeSha+'?recursive=1',{headers:headers()});
    if(!tr.ok)throw new Error('无法读取图片目录');
    const td=await tr.json();
    historyFiles=(td.tree||[]).filter(x=>x.type==='blob'&&/^images\//.test(x.path)&&/\.(png|jpe?g|webp|gif)$/i.test(x.path)).sort((a,b)=>b.path.localeCompare(a.path));
    visibleCount=24;renderHistory();
    historyStatus.textContent='共 '+historyFiles.length+' 张图片';
  }catch(e){
    historyStatus.textContent='读取失败；可以输入 Token 后点“刷新”。';
    gallery.innerHTML='<div class="empty">暂时无法读取历史图库</div>';
  }
}
function formatPathDate(path){
  const m=path.match(/images\/(\d{4})\/(\d{2})\/(\d{8})(\d{6})-/);
  if(!m)return '';
  return m[1]+'-'+m[2]+'-'+m[3].slice(6,8)+' '+m[4].slice(0,2)+':'+m[4].slice(2,4);
}
function renderHistory(){
  const q=historySearch.value.trim().toLowerCase();
  const list=historyFiles.filter(x=>x.path.toLowerCase().includes(q));
  const shown=list.slice(0,visibleCount);
  if(!shown.length){gallery.innerHTML='<div class="empty">没有找到图片</div>';showMore.classList.add('hidden');return}
  gallery.innerHTML=shown.map((f,i)=>{
    const raw='https://raw.githubusercontent.com/'+OWNER+'/'+REPO+'/'+IMAGE_BRANCH+'/'+f.path;
    const cdn='https://cdn.jsdelivr.net/gh/'+OWNER+'/'+REPO+'@'+IMAGE_BRANCH+'/'+f.path;
    const name=f.path.split('/').pop();
    return '<article class="gallery-item">'+
      '<a class="thumb" href="'+raw+'" target="_blank" rel="noreferrer"><img loading="lazy" src="'+raw+'" alt=""></a>'+
      '<div class="gallery-info"><div class="gallery-name" title="'+escapeHtml(name)+'">'+escapeHtml(name)+'</div>'+
      '<div class="gallery-date">'+escapeHtml(formatPathDate(f.path))+'</div>'+
      '<div class="gallery-actions"><button data-history-copy="'+encodeURIComponent(cdn)+'">复制直链</button><button data-history-md="'+encodeURIComponent('!['+name+']('+cdn+')')+'">Markdown</button></div></div></article>'
  }).join('');
  showMore.classList.toggle('hidden',shown.length>=list.length);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
historySearch.addEventListener('input',()=>{visibleCount=24;renderHistory()});
showMore.addEventListener('click',()=>{visibleCount+=24;renderHistory()});
$('#refreshHistory').addEventListener('click',loadHistory);
gallery.addEventListener('click',async e=>{
  const a=e.target.closest('[data-history-copy],[data-history-md]');if(!a)return;
  const v=a.dataset.historyCopy||a.dataset.historyMd;try{await copyText(decodeURIComponent(v));showToast('已复制')}catch{}
});

loadHistory();
})();