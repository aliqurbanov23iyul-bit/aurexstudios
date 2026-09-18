(() => {
  const $=(q,e=document)=>e.querySelector(q), $$=(q,e=document)=>[...e.querySelectorAll(q)];
  let token=sessionStorage.getItem('aurex_admin_token')||'';
  let isDemo=token==='demo'||location.protocol==='file:';
  const clone=v=>JSON.parse(JSON.stringify(v));
  let content=clone(window.DEFAULT_CONTENT||{}), messages=[];
  let currentType=null,currentIndex=null;

  function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function toast(msg,isErr=false){const t=$('#toast');t.textContent=msg;t.style.background=isErr?'#c83c57':'';t.classList.add('show');setTimeout(()=>{t.classList.remove('show');t.style.background=''},2800)}
  function uid(prefix){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`}
  function previewSrc(v=''){return /^(https?:|data:)/i.test(v)?v:v}
  function slugify(v){return String(v).toLowerCase().trim().replace(/[^a-z0-9əğıöüşç]+/gi,'-').replace(/^-|-$/g,'')}

  async function api(path,opts={}){
    const headers={...(opts.headers||{}),'authorization':`Bearer ${token}`};
    if(opts.body&&!headers['content-type'])headers['content-type']='application/json';
    const r=await fetch(path,{...opts,headers}); const data=await r.json().catch(()=>({})); if(!r.ok)throw new Error(data.error||'API error'); return data;
  }


  function updateDbStatus(info={}){
    const el=$('#dbStatus'); if(!el)return;
    if(info?.connected){el.textContent='● Neon bağlıdır';el.style.cssText='background:#e8fbf3;border-color:#b7f0d4;color:#0a6645'}
    else if(info?.configured){el.textContent='● DB bağlantı xətası';el.style.cssText='background:#fff0f3;border-color:#ffd7df;color:#c83c57'}
    else{el.textContent='● DB qoşulmayıb';el.style.cssText='background:#fffbe6;border-color:#fde68a;color:#7a5a00'}
  }

  function showLogin(){
    const login=$('#adminLoginScreen'), app=$('#adminApp');
    if(login)login.style.display='grid'; if(app)app.style.display='none';
  }
  function showAdmin(){
    const login=$('#adminLoginScreen'), app=$('#adminApp');
    if(login)login.style.display='none'; if(app)app.style.display='grid';
  }
  async function handleLogin(e){
    e.preventDefault();
    const form=e.currentTarget, error=$('#loginError');
    error?.classList.remove('show');
    const password=new FormData(form).get('password');
    const btn=form.querySelector('button[type=submit]'); const old=btn.textContent;
    btn.disabled=true; btn.textContent='Yoxlanılır...';
    try{
      if((location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname)) && password==='demo'){
        token='demo'; isDemo=true; sessionStorage.setItem('aurex_admin_token',token); showAdmin(); await load(); return;
      }
      const r=await fetch('/api/admin-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error||'Daxil olmaq mümkün olmadı.');
      token=data.token||''; if(!token) throw new Error('Token yaradılmadı.');
      isDemo=false; sessionStorage.setItem('aurex_admin_token',token); showAdmin(); await load();
    }catch(err){
      if(error){error.textContent=err.message||'Daxil olmaq mümkün olmadı.';error.classList.add('show')}
    }finally{btn.disabled=false;btn.textContent=old}
  }
  function initAuth(){
    $('#loginForm')?.addEventListener('submit',handleLogin);
    if(token){showAdmin();load()} else showLogin();
  }

  async function load(){
    try{
      if(!isDemo){
        const data=await api('/api/admin-content'); if(data.content) content=data.content; updateDbStatus(data.database);
      }else{
        const saved=localStorage.getItem('aurex_admin_content'); if(saved) content=JSON.parse(saved);
      }
    }catch(e){
      const saved=localStorage.getItem('aurex_admin_content'); if(saved) content=JSON.parse(saved);
      updateDbStatus({connected:false,error:e.message});
    }
    renderAll();
  }

  async function saveContent(silent=false){
    try{
      if(isDemo){
        localStorage.setItem('aurex_admin_content',JSON.stringify(content));
      }else{
        await api('/api/admin-content',{method:'PUT',body:JSON.stringify({content})});
        localStorage.setItem('aurex_admin_content',JSON.stringify(content));
      }
      if(!silent)toast('Dəyişikliklər saxlanıldı');
    }catch(e){
      localStorage.setItem('aurex_admin_content',JSON.stringify(content));
      toast('Serverdə saxlanmadı (lokal yaddaşa yazıldı): '+e.message,true);
    }
  }

  function setTab(name){
    $$('.admin-section').forEach(s=>s.classList.toggle('active',s.dataset.section===name));
    $$('#adminNav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
    const names={dashboard:['İdarəetmə paneli','Saytın ümumi vəziyyəti.'],homepage:['Ana səhifə','Başlıq, mətnlər və görünən bölmələr.'],pages:['Səhifə mətnləri','Oyunlar, Haqqımızda, Komanda və digər səhifələrin mətnləri.'],games:['Oyunlar','Oyun kataloqunu idarə edin.'],news:['Xəbərlər','Studio yeniliklərini idarə edin.'],team:['Komanda','Komanda üzvlərini idarə edin.'],socials:['Sosial linklər','Sosial platformaları və linkləri idarə edin.'],careers:['Karyera','Açıq vakansiyaları idarə edin.'],media:['Media','Press və media fayllarını idarə edin.'],messages:['Əlaqə mesajları','Saytdan gələn mesajlar.'],newsletter:['Newsletter','Abunəçilər və e-poçt kampaniyaları.'],settings:['Ayarlar','Studio məlumatları və ümumi ayarlar.']};
    $('#adminPageTitle').textContent=names[name]?.[0]||'Admin'; $('#adminPageSub').textContent=names[name]?.[1]||'';
    if(name==='messages')loadMessages();
    if(name==='newsletter')loadSubscribers();
    if(name==='games')renderGamesTab();
  }

  function renderKpis(){
    const vals=[['🎮',(content.games||[]).filter(x=>x.published).length,'Oyun'],['▤',(content.news||[]).filter(x=>x.published).length,'Xəbər'],['♙',(content.team||[]).filter(x=>x.published).length,'Komanda üzvü'],['⌁',(content.socials||[]).filter(x=>x.published).length,'Sosial link']];
    $('#kpiGrid').innerHTML=vals.map(([i,n,l])=>`<div class="kpi"><div class="icon-bubble">${i}</div><strong>${n}</strong><small>${l}</small></div>`).join('');
  }

  function renderHomepage(){
    const h=content.homepage||{};
    $('#homepageEditor').innerHTML=`<div class="admin-panel"><div class="admin-panel-head"><div><h2>Bölmələrin görünməsi</h2><p class="section-copy" style="margin:5px 0 0">Söndürülən bölmə saytda ümumiyyətlə render olunmur; boş qutu qalmır.</p></div></div><div class="cards-3">${['hero','featured','about','games','news','community'].map(k=>`<label class="content-card toggle"><input type="checkbox" data-section-toggle="${k}" ${h[k]?.enabled!==false?'checked':''}><span>${({hero:'Hero',featured:'Seçilmiş oyun',about:'Haqqımızda',games:'Oyunlarımız',news:'Xəbərlər',community:'İcma'})[k]}</span></label>`).join('')}</div></div>
    <div class="admin-panel"><div class="admin-panel-head"><h2>Hero mətni</h2></div><div class="form-grid">
      ${dualField('Eyebrow','homepage.hero.eyebrow',h.hero?.eyebrow)}
      ${dualField('Başlıq','homepage.hero.title',h.hero?.title)}
      ${dualField('Açıqlama','homepage.hero.text',h.hero?.text,'textarea')}
      ${dualField('Əsas düymə','homepage.hero.primary',h.hero?.primary)}
      ${dualField('İkinci düymə','homepage.hero.secondary',h.hero?.secondary)}
    </div></div>
    <div class="admin-panel"><div class="admin-panel-head"><h2>Haqqımızda preview</h2></div><div class="form-grid">${dualField('Label','homepage.about.label',h.about?.label)}${dualField('Başlıq','homepage.about.title',h.about?.title)}${dualField('Mətn','homepage.about.text',h.about?.text,'textarea')}</div></div>`;
    bindInlineEditors();
  }

  function dualField(label,path,val={},type='input'){
    if(type==='textarea') return `<div class="field"><label>${label} · AZ</label><textarea data-bind="${path}.az">${esc(val?.az||'')}</textarea></div><div class="field"><label>${label} · EN</label><textarea data-bind="${path}.en">${esc(val?.en||'')}</textarea></div>`;
    return `<div class="field"><label>${label} · AZ</label><input data-bind="${path}.az" value="${esc(val?.az||'')}"></div><div class="field"><label>${label} · EN</label><input data-bind="${path}.en" value="${esc(val?.en||'')}"></div>`;
  }

  function bindInlineEditors(){
    $$('[data-bind]').forEach(el=>el.addEventListener('input',()=>setByPath(content,el.dataset.bind,el.value)));
    $$('[data-section-toggle]').forEach(el=>el.addEventListener('change',()=>{content.homepage[el.dataset.sectionToggle].enabled=el.checked;renderKpis()}));
  }
  function setByPath(obj,path,val){const a=path.split('.');let cur=obj;for(let i=0;i<a.length-1;i++){cur[a[i]]??={};cur=cur[a[i]]}cur[a.at(-1)]=val}

  function renderPages(){
    const pages=content.pages||{};
    const labels={games:'Oyunlarımız',about:'Haqqımızda',team:'Komanda',news:'Xəbərlər',careers:'Karyera',media:'Media',contact:'Əlaqə',community:'İcma',support:'Dəstək'};
    const root=$('#pagesEditor'); if(!root)return;
    root.innerHTML=Object.entries(labels).map(([key,label])=>{const p=pages[key]||{};return `<div class="admin-panel"><div class="admin-panel-head"><h2>${label}</h2></div><div class="form-grid">${dualField('Eyebrow',`pages.${key}.eyebrow`,p.eyebrow)}${dualField('Başlıq',`pages.${key}.title`,p.title)}${dualField('Açıqlama',`pages.${key}.text`,p.text,'textarea')}${key==='about'?dualField('Məzmun başlığı',`pages.${key}.heading`,p.heading)+dualField('Mətn 1',`pages.${key}.body1`,p.body1,'textarea')+dualField('Mətn 2',`pages.${key}.body2`,p.body2,'textarea'):''}</div></div>`}).join('');
    bindInlineEditors();
  }

  function renderSettings(){
    const s=content.site||{};
    $('#settingsEditor').innerHTML=`<div class="admin-panel"><div class="admin-panel-head"><h2>Studio məlumatları</h2></div><div class="form-grid"><div class="field"><label>Studio adı</label><input data-bind="site.studioName" value="${esc(s.studioName||'')}"></div><div class="field"><label>E-poçt</label><input data-bind="site.email" value="${esc(s.email||'')}"></div>${dualField('Məkan','site.location',s.location)}${dualField('Tagline','site.tagline',s.tagline)}<div class="field"><label>Copyright ili</label><input data-bind="site.copyrightYear" value="${esc(s.copyrightYear||'2026')}"></div></div></div>`;bindInlineEditors();
  }

  // ============================================================
  // GAMES TAB — STEAM IMPORT + MANUAL
  // ============================================================

  // State for steam import
  let importData = null; // məlumatlar gəldikdən sonra burada saxlanılır
  let importImageState = {
    cover: '',      // header_image URL
    hero: '',       // hero image URL
    gallery: []     // path_full array (screenshot URL-ləri)
  };

  function renderGamesTab(){
    const root=$('#gamesPanel'); if(!root)return;
    const games=content.games||[];
    root.innerHTML=`
      <div class="admin-panel" id="gamesListPanel">
        <div class="admin-panel-head">
          <div><h2>Oyunlar</h2><p class="section-copy" style="margin:5px 0 0">Silinən oyun saytda heç bir boş kart saxlamır.</p></div>
          <button class="btn btn-primary" id="addGameBtn">+ Yeni oyun əlavə et</button>
        </div>
        <div class="admin-list" id="gamesList"></div>
      </div>
      <div class="admin-panel" id="addGamePanel" style="display:none">
        <div class="admin-panel-head">
          <div><h2 id="addGamePanelTitle">Yeni oyun əlavə et</h2></div>
          <button class="btn btn-soft" id="cancelAddGame">← Geri</button>
        </div>
        <div class="import-tabs">
          <button class="import-tab active" data-import-tab="steam">🎮 Steam-dən import</button>
          <button class="import-tab" data-import-tab="manual">✎ Manual əlavə et</button>
        </div>
        <div id="steamImportSection">
          <div class="steam-import-panel">
            <p style="margin:0 0 14px;color:var(--muted);font-size:13px">Steam Store linkini daxil edin. Sistem oyun məlumatlarını avtomatik gətirəcək.</p>
            <div class="steam-url-row">
              <input type="url" id="steamUrlInput" placeholder="https://store.steampowered.com/app/1234567/Game_Name/">
              <button class="btn btn-primary" id="fetchSteamBtn">Steam-dən məlumatları gətir</button>
            </div>
            <div class="import-spinner" id="importSpinner"><div class="spinner-ring"></div>Steam-dən məlumatlar gətirilir...</div>
            <div class="import-error" id="importError"></div>
          </div>
          <div class="import-result-panel" id="importResultPanel"></div>
        </div>
        <div id="manualImportSection" style="display:none">
          <div class="admin-panel" style="margin-top:0">
            <div class="form-grid" id="manualGameForm"></div>
            <div class="import-save-row"><button class="btn btn-soft" id="cancelManualGame">Ləğv et</button><button class="btn btn-primary" id="saveManualGame">Yadda saxla</button></div>
          </div>
        </div>
      </div>`;

    renderGamesList();
    bindGamesTabEvents();
  }

  function renderGamesList(){
    const games=content.games||[];
    const root=$('#gamesList'); if(!root)return;
    if(!games.length){root.innerHTML=`<div class="empty-state"><h3>Hələ oyun yoxdur</h3><p>"Yeni oyun əlavə et" düyməsi ilə ilk oyunu əlavə edin.</p></div>`;return}
    root.innerHTML=games.map((g,i)=>{
      const img=g.cover||g.header_image||'';
      const title=typeof g.title==='object'?(g.title.az||g.title.en):g.title||'Oyun';
      const sub=g.steam_url||g.steamUrl||g.slug||'';
      return `<div class="admin-row">
        <div>${img?`<img class="admin-thumb" src="${esc(previewSrc(img))}" onerror="this.style.opacity=.2">` : `<div class="admin-thumb" style="display:grid;place-items:center">🎮</div>`}</div>
        <div><h3>${esc(title)}</h3><p>${esc(sub)}</p>
          <label class="toggle" style="margin-top:6px"><input type="checkbox" data-game-publish="${i}" ${g.published!==false?'checked':''}><span>${g.published!==false?'Dərc olunub':'Gizlidir'}</span></label>
        </div>
        <div class="row-actions">
          <button class="icon-btn" data-game-edit="${i}" title="Redaktə">✎</button>
          <button class="icon-btn danger" data-game-delete="${i}" title="Sil">🗑</button>
        </div>
      </div>`;
    }).join('');

    $$('[data-game-publish]').forEach(el=>el.addEventListener('change',async()=>{
      const i=+el.dataset.gamePublish; content.games[i].published=el.checked;
      el.nextElementSibling.textContent=el.checked?'Dərc olunub':'Gizlidir';
      await saveContent(true);renderKpis();
    }));
    $$('[data-game-edit]').forEach(b=>b.addEventListener('click',()=>openGameEditModal(+b.dataset.gameEdit)));
    $$('[data-game-delete]').forEach(b=>b.addEventListener('click',async()=>{
      const g=content.games[+b.dataset.gameDelete]; const name=typeof g.title==='object'?g.title.az:g.title||'bu oyun';
      if(!confirm(`"${name}" silinsin?`))return;
      content.games.splice(+b.dataset.gameDelete,1);
      await saveContent(true);renderGamesTab();toast('Oyun silindi');renderKpis();
    }));
  }

  function bindGamesTabEvents(){
    // Show/hide add panel
    $('#addGameBtn')?.addEventListener('click',()=>{
      $('#gamesListPanel').style.display='none';
      $('#addGamePanel').style.display='block';
      $('#addGamePanelTitle').textContent='Yeni oyun əlavə et';
      importData=null; importImageState={cover:'',hero:'',gallery:[]};
      clearImportUI();
    });
    $('#cancelAddGame')?.addEventListener('click',()=>{
      $('#gamesListPanel').style.display='';
      $('#addGamePanel').style.display='none';
    });

    // Tab switching
    $$('[data-import-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      $$('[data-import-tab]').forEach(b=>b.classList.toggle('active',b===btn));
      const tab=btn.dataset.importTab;
      $('#steamImportSection').style.display=tab==='steam'?'':'none';
      $('#manualImportSection').style.display=tab==='manual'?'':'none';
      if(tab==='manual') renderManualForm({});
    }));

    // Steam fetch button
    $('#fetchSteamBtn')?.addEventListener('click',()=>fetchSteamData());

    // Steam URL — Enter key
    $('#steamUrlInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')fetchSteamData()});
  }

  function clearImportUI(){
    const err=$('#importError'); if(err){err.classList.remove('show');err.textContent=''}
    const sp=$('#importSpinner'); if(sp)sp.classList.remove('show');
    const rp=$('#importResultPanel'); if(rp){rp.classList.remove('show');rp.innerHTML=''}
  }

  async function fetchSteamData(){
    const urlInput=$('#steamUrlInput'); if(!urlInput)return;
    const url=urlInput.value.trim();
    if(!url){showImportError('Steam linkini daxil edin.');return}

    clearImportUI();
    const spinner=$('#importSpinner'); spinner?.classList.add('show');
    const fetchBtn=$('#fetchSteamBtn'); if(fetchBtn){fetchBtn.disabled=true;fetchBtn.textContent='Gətirilir...'}

    try{
      let result;
      if(isDemo){
        // Demo mode — mock data ilə test
        result={ok:true,data:makeMockSteamData(url)};
      }else{
        result=await api('/api/steam-import',{method:'POST',body:JSON.stringify({steam_url:url})});
      }

      spinner?.classList.remove('show');
      if(fetchBtn){fetchBtn.disabled=false;fetchBtn.textContent='Steam-dən məlumatları gətir'}

      if(!result.ok||!result.data){showImportError(result.error||'Naməlum xəta.');return}

      importData=result.data;
      importImageState={
        cover: importData.header_image,
        hero: importData.hero_image || (importData.screenshots[0]?.path_full || ''),
        gallery: importData.screenshots.map(s=>s.path_full||s)
      };
      renderImportResult(importData);

    }catch(err){
      spinner?.classList.remove('show');
      if(fetchBtn){fetchBtn.disabled=false;fetchBtn.textContent='Steam-dən məlumatları gətir'}
      showImportError(err.message||'Steam məlumatlarını hazırda əldə etmək mümkün deyil. Manual əlavə edə bilərsiniz.');
    }
  }

  function showImportError(msg){
    const el=$('#importError'); if(!el)return;
    el.textContent=msg; el.classList.add('show');
  }

  function renderImportResult(d){
    const rp=$('#importResultPanel'); if(!rp)return;
    const s=d._stats||{};

    const checks=[
      {ok:true, label:`✓ Oyun tapıldı: <strong>${esc(d.title)}</strong>`},
      s.screenshots_count>0 ? {ok:true, label:`✓ ${s.screenshots_count} yüksək keyfiyyətli screenshot tapıldı`} : {ok:false, label:'⚠ Screenshot tapılmadı'},
      s.platforms_count>0 ? {ok:true, label:`✓ ${s.platforms_count} platforma tapıldı`} : {ok:false, label:'⚠ Platforma məlumatı tapılmadı'},
      s.genres_count>0 ? {ok:true, label:`✓ ${s.genres_count} janr tapıldı`} : {ok:false, label:'⚠ Janr tapılmadı'},
      s.has_trailer ? {ok:true, label:'✓ Trailer tapıldı'} : null,
      s.has_release_date ? {ok:true, label:`✓ Release date tapıldı`} : {ok:false, label:'⚠ Release date yoxdur'},
    ].filter(Boolean);

    rp.innerHTML=`
      <div class="import-checklist">
        ${checks.map(c=>`<span class="import-check${c.ok?'':' warn'}">${c.label}</span>`).join('')}
      </div>
      <div class="import-preview-form" id="importPreviewForm">
        <h3>Məlumatları yoxlayın və redaktə edin</h3>
        <p class="preview-section-title">Oyun məlumatları</p>
        <div class="form-grid">
          <div class="field"><label>Oyun adı</label><input id="imp_title" value="${esc(d.title)}"></div>
          <div class="field"><label>Slug</label><input id="imp_slug" value="${esc(d.slug)}"></div>
          <div class="field full"><label>Qısa təsvir (EN)</label><textarea id="imp_short_en" style="min-height:80px">${esc(d.short_description_en)}</textarea></div>
          <div class="field full"><label>Qısa təsvir (AZ) — Azərbaycan dilinə uyğunlaşdırın</label><textarea id="imp_short_az" style="min-height:80px" placeholder="Azərbaycanca qısa təsvir...">${esc(d.short_description_az)}</textarea></div>
          <div class="field full"><label>Ətraflı məlumat (EN)</label><textarea id="imp_desc_en" style="min-height:160px">${esc(d.description_en)}</textarea></div>
          <div class="field full"><label>Ətraflı məlumat (AZ)</label><textarea id="imp_desc_az" style="min-height:160px" placeholder="Azərbaycanca ətraflı məlumat...">${esc(d.description_az)}</textarea></div>
          <div class="field"><label>Janrlar</label><input id="imp_genres" value="${esc((d.genres||[]).map(g=>g.description).join(', '))}"></div>
          <div class="field"><label>Release date</label><input id="imp_release" value="${esc(d.release_date)}"></div>
          <div class="field full"><label>Steam URL</label><input id="imp_steam_url" value="${esc(d.steam_url)}"></div>
          ${d.website?`<div class="field full"><label>Vebsayt</label><input id="imp_website" value="${esc(d.website)}"></div>`:''}
          <div class="field"><label>Status</label><select id="imp_status"><option value="published" selected>Dərc olunmuş</option><option value="draft">Qaralama</option></select></div>
          <div class="field"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="imp_featured"> Seçilmiş oyun kimi göstər</label></div>
        </div>
        <p class="preview-section-title">Şəkil seçimi</p>
        <div style="margin-bottom:12px;padding:12px;background:#f3f8ff;border-radius:12px;font-size:12px;color:#5278aa">
          <strong>Cover:</strong> Oyun kartı üzərindəki əsas şəkil (default: Steam header image)<br>
          <strong>Hero:</strong> Oyun detail səhifəsinin arxa planı (default: ilk screenshot)<br>
          <strong>Gallery:</strong> Oyun detail səhifəsindəki screenshot qalereyası
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div><p class="preview-section-title" style="margin-top:0">Cover şəkli</p>
            <img id="coverPreviewImg" src="${esc(importImageState.cover)}" style="width:100%;border-radius:12px;aspect-ratio:16/9;object-fit:cover;background:#e8f0f8">
            <input id="imp_cover_url" value="${esc(importImageState.cover)}" style="margin-top:8px;width:100%;border:1px solid #dbe8f8;border-radius:10px;padding:9px 12px;font-size:12px" placeholder="Cover URL...">
          </div>
          <div><p class="preview-section-title" style="margin-top:0">Hero şəkli</p>
            <img id="heroPreviewImg" src="${esc(importImageState.hero)}" style="width:100%;border-radius:12px;aspect-ratio:16/9;object-fit:cover;background:#e8f0f8">
            <input id="imp_hero_url" value="${esc(importImageState.hero)}" style="margin-top:8px;width:100%;border:1px solid #dbe8f8;border-radius:10px;padding:9px 12px;font-size:12px" placeholder="Hero URL...">
          </div>
        </div>
        ${d.screenshots&&d.screenshots.length?renderScreenshotPickerHTML(d.screenshots):''}
        <div class="import-save-row">
          <button class="btn btn-soft" id="cancelImportBtn">Ləğv et</button>
          <button class="btn btn-primary" id="saveImportBtn">✓ Yadda saxla</button>
        </div>
      </div>`;

    rp.classList.add('show');
    bindImportPreviewEvents(d);
  }

  function renderScreenshotPickerHTML(screenshots){
    return `<div class="screenshot-picker">
      <h3>Screenshot seçimi (${screenshots.length} şəkil tapıldı)</h3>
      <div class="screenshot-grid" id="screenshotPickerGrid">
        ${screenshots.map((s,i)=>{
          const url=s.path_full||s;
          const isCover=url===importImageState.cover;
          const isHero=url===importImageState.hero;
          const inGallery=importImageState.gallery.includes(url);
          return `<div class="screenshot-item${isCover?' is-cover':''}${isHero?' is-hero':''}" id="si_${i}" data-url="${esc(url)}">
            <img src="${esc(url)}" loading="lazy" decoding="async" class="img-fade" onload="this.classList.add('loaded');checkResolution(this,${i})" onerror="this.style.opacity=.3">
            <div class="screenshot-item-badges" id="sib_${i}">
              ${isCover?'<span class="screenshot-badge cover">COVER</span>':''}
              ${isHero?'<span class="screenshot-badge hero">HERO</span>':''}
              ${inGallery?'<span class="screenshot-badge gallery">GALLERY</span>':''}
            </div>
            <div class="screenshot-actions">
              <button onclick="setScreenshotRole(${i},'cover')" class="${isCover?'active-action':''}">Cover</button>
              <button onclick="setScreenshotRole(${i},'hero')" class="${isHero?'active-action':''}">Hero</button>
              <button onclick="toggleGallery(${i})" class="${inGallery?'active-action':''}">Gallery</button>
            </div>
            <div class="resolution-warn" id="res_warn_${i}" style="display:none">⚠ Aşağı keyfiyyət</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // Global functions — screenshot actions
  window.checkResolution=(img,idx)=>{
    if(img.naturalWidth < 800){
      const w=$(`#res_warn_${idx}`); if(w) w.style.display='block';
      const item=$(`#si_${idx}`); if(item) item.title='Bu şəkil yüksək keyfiyyətli deyil ('+img.naturalWidth+'px)';
    }
  };

  window.setScreenshotRole=(idx,role)=>{
    if(!importData?.screenshots) return;
    const url=importData.screenshots[idx]?.path_full||importData.screenshots[idx];
    if(!url)return;
    if(role==='cover'){
      importImageState.cover=url;
      const ci=$('#imp_cover_url'); if(ci)ci.value=url;
      const ci2=$('#coverPreviewImg'); if(ci2)ci2.src=url;
    } else if(role==='hero'){
      importImageState.hero=url;
      const hi=$('#imp_hero_url'); if(hi)hi.value=url;
      const hi2=$('#heroPreviewImg'); if(hi2)hi2.src=url;
    }
    refreshPickerBadges();
  };

  window.toggleGallery=(idx)=>{
    if(!importData?.screenshots) return;
    const url=importData.screenshots[idx]?.path_full||importData.screenshots[idx];
    if(!url)return;
    const pos=importImageState.gallery.indexOf(url);
    if(pos===-1) importImageState.gallery.push(url);
    else importImageState.gallery.splice(pos,1);
    refreshPickerBadges();
  };

  function refreshPickerBadges(){
    if(!importData?.screenshots)return;
    importData.screenshots.forEach((s,i)=>{
      const url=s.path_full||s;
      const item=$(`#si_${i}`); const bwrap=$(`#sib_${i}`);
      if(!item||!bwrap)return;
      const isCover=url===importImageState.cover;
      const isHero=url===importImageState.hero;
      const inGallery=importImageState.gallery.includes(url);
      item.className=`screenshot-item${isCover?' is-cover':''}${isHero?' is-hero':''}`;
      bwrap.innerHTML=(isCover?'<span class="screenshot-badge cover">COVER</span>':'')+(isHero?'<span class="screenshot-badge hero">HERO</span>':'')+(inGallery?'<span class="screenshot-badge gallery">GALLERY</span>':'');
      const btns=$$('button',item);
      if(btns[0])btns[0].className=isCover?'active-action':'';
      if(btns[1])btns[1].className=isHero?'active-action':'';
      if(btns[2])btns[2].className=inGallery?'active-action':'';
    });
  }

  function bindImportPreviewEvents(d){
    // Live preview for cover/hero URL inputs
    $('#imp_cover_url')?.addEventListener('input',e=>{importImageState.cover=e.target.value;const img=$('#coverPreviewImg');if(img)img.src=e.target.value});
    $('#imp_hero_url')?.addEventListener('input',e=>{importImageState.hero=e.target.value;const img=$('#heroPreviewImg');if(img)img.src=e.target.value});

    $('#cancelImportBtn')?.addEventListener('click',()=>{
      clearImportUI();importData=null;
      $('#steamUrlInput').value='';
    });

    $('#saveImportBtn')?.addEventListener('click',()=>saveImportedGame(d));
  }

  async function saveImportedGame(d){
    const title=$('#imp_title')?.value?.trim(); if(!title){toast('Oyun adı boş ola bilməz.',true);return}
    const slugRaw=$('#imp_slug')?.value?.trim()||slugify(title);

    const genreStr=$('#imp_genres')?.value||'';
    const genreArr=genreStr.split(',').map(s=>s.trim()).filter(Boolean);

    const screenshotsForGallery=importImageState.gallery.map(url=>({path_full:url}));

    const gameObj={
      id:uid('game'),
      slug:slugRaw,
      published:$('#imp_status')?.value==='published',
      featured:$('#imp_featured')?.checked||false,
      // Legacy fields (site.js compat)
      title:title,
      subtitle:{az:$('#imp_short_az')?.value||'',en:$('#imp_short_en')?.value||''},
      description:{az:$('#imp_desc_az')?.value||'',en:$('#imp_desc_en')?.value||''},
      genre:{az:genreArr.join(', '),en:genreArr.join(', ')},
      platform:Object.entries(d.platforms||{}).filter(([,v])=>v).map(([k])=>k.charAt(0).toUpperCase()+k.slice(1)).join(' · ')||'PC',
      players:{az:'',en:''},
      releaseDate:$('#imp_release')?.value||'',
      price:'',
      steamUrl:$('#imp_steam_url')?.value||d.steam_url||'#',
      cover:importImageState.cover||d.header_image,
      hero:importImageState.hero||'',
      screenshots:importImageState.gallery,
      // Extended fields
      steam_app_id:d.steam_app_id,
      steam_url:$('#imp_steam_url')?.value||d.steam_url,
      short_description_en:$('#imp_short_en')?.value||'',
      short_description_az:$('#imp_short_az')?.value||'',
      description_en:$('#imp_desc_en')?.value||'',
      description_az:$('#imp_desc_az')?.value||'',
      header_image:importImageState.cover||d.header_image,
      hero_image:importImageState.hero||'',
      screenshots_full:screenshotsForGallery,
      trailer_url:d.trailer_url||'',
      genres:d.genres||[],
      categories:d.categories||[],
      platforms:d.platforms||{},
      developers:d.developers||[],
      publishers:d.publishers||[],
      website:$('#imp_website')?.value||d.website||'',
    };

    if(gameObj.featured){content.games?.forEach(g=>{if(g.id!==gameObj.id)g.featured=false})}

    content.games=content.games||[];
    content.games.push(gameObj);

    await saveContent(true);
    toast('✓ Oyun yadda saxlanıldı!');
    renderGamesTab();
    renderKpis();
    $('#gamesListPanel').style.display='';
    $('#addGamePanel').style.display='none';
  }

  // ============================================================
  // Manual game form
  // ============================================================
  const field=(name,label,value='',type='text',full=false)=>`<div class="field ${full?'full':''}"><label>${label}</label>${type==='textarea'?`<textarea name="${name}">${esc(value||'')}</textarea>`:type==='checkbox'?`<label class="toggle"><input type="checkbox" name="${name}" ${value?'checked':''}><span>Aktiv</span></label>`:`<input type="${type}" name="${name}" value="${esc(value||'')}">`}</div>`;
  const loc=(base,label,v={},type='text')=>field(`${base}_az`,`${label} · AZ`,v?.az||'',type)+field(`${base}_en`,`${label} · EN`,v?.en||'',type);

  function renderManualForm(item={}){
    const root=$('#manualGameForm'); if(!root)return;
    root.innerHTML=field('title','Oyun adı',item.title||'')+field('slug','Slug',item.slug||'')+loc('subtitle','Alt başlıq',item.subtitle)+loc('description','Açıqlama',item.description,'textarea')+loc('genre','Janr',item.genre)+field('platform','Platform',item.platform||'PC · Steam')+loc('players','Oyun rejimi',item.players)+field('releaseDate','Buraxılış tarixi',item.releaseDate||'','date')+field('price','Qiymət',item.price||'')+field('steamUrl','Steam linki',item.steamUrl||'','url',true)+field('cover','Cover URL',item.cover||'','text',true)+field('hero','Hero URL',item.hero||'','text',true)+field('screenshots','Screenshot URL-ləri — vergüllə',(item.screenshots||[]).join(', '),'textarea',true)+field('published','Saytda göstər',item.published!==false,'checkbox')+field('featured','Seçilmiş oyun',!!item.featured,'checkbox');
    $('#saveManualGame')?.removeEventListener('click',saveManualGame);
    $('#saveManualGame')?.addEventListener('click',()=>saveManualGame(item));
    $('#cancelManualGame')?.addEventListener('click',()=>$('[data-import-tab="steam"]').click());
  }

  async function saveManualGame(orig={}){
    const fd=new FormData();
    $$('#manualGameForm input,#manualGameForm textarea,#manualGameForm select').forEach(el=>{if(el.type==='checkbox')fd.set(el.name,el.checked?'on':'off');else fd.set(el.name,el.value)});
    const locObj=(base)=>({az:fd.get(base+'_az')||'',en:fd.get(base+'_en')||''});
    const obj={...orig,id:orig.id||uid('game'),title:fd.get('title')||'',slug:fd.get('slug')||slugify(fd.get('title')||''),subtitle:locObj('subtitle'),description:locObj('description'),genre:locObj('genre'),platform:fd.get('platform')||'',players:locObj('players'),releaseDate:fd.get('releaseDate')||'',price:fd.get('price')||'',steamUrl:fd.get('steamUrl')||'#',cover:fd.get('cover')||'',hero:fd.get('hero')||'',screenshots:String(fd.get('screenshots')||'').split(',').map(x=>x.trim()).filter(Boolean),published:fd.get('published')==='on',featured:fd.get('featured')==='on'};
    if(obj.featured){content.games?.forEach(g=>{if(g.id!==obj.id)g.featured=false})}
    content.games=content.games||[];
    content.games.push(obj);
    await saveContent(true);toast('Oyun yadda saxlanıldı');renderGamesTab();renderKpis();
    $('#gamesListPanel').style.display=''; $('#addGamePanel').style.display='none';
  }

  // ============================================================
  // Game edit modal (for existing games)
  // ============================================================
  function openGameEditModal(index){
    const item=content.games[index];
    currentType='games';currentIndex=index;
    const title=typeof item.title==='object'?(item.title.az||item.title.en):item.title||'';
    const sub=item.subtitle||{az:item.short_description_az||'',en:item.short_description_en||''};
    const desc=item.description||{az:item.description_az||'',en:item.description_en||''};
    $('#modalTitle').textContent='Oyunu redaktə et: '+title;
    $('#modalForm').innerHTML=`<div class="form-grid">
      ${field('title','Oyun adı',title)}
      ${field('slug','Slug',item.slug||'')}
      ${loc('subtitle','Alt başlıq / Qısa təsvir',sub)}
      ${loc('description','Ətraflı təsvir',desc,'textarea')}
      ${loc('genre','Janr',item.genre||{az:(item.genres||[]).map(x=>x.description||x).join(', '),en:(item.genres||[]).map(x=>x.description||x).join(', ')})}
      ${field('platform','Platform',item.platform||'')}
      ${loc('players','Oyun rejimi',item.players||{az:'',en:''})}
      ${field('releaseDate','Buraxılış tarixi',item.releaseDate||item.release_date||'')}
      ${field('steamUrl','Steam linki',item.steamUrl||item.steam_url||'','url',true)}
      ${field('website','Vebsayt',item.website||'','url',true)}
      ${field('trailer_url','Treyler URL (MP4 və ya YouTube)',item.trailer_url||'','text',true)}
      ${field('cover','Cover URL',item.cover||item.header_image||'','text',true)}
      ${field('hero','Hero URL',item.hero||item.hero_image||'','text',true)}
      ${field('screenshots','Gallery URL-ləri — vergüllə',(Array.isArray(item.screenshots)?item.screenshots.map(s=>typeof s==='string'?s:s.path_full||s.url||''):[]).join(', '),'textarea',true)}
      ${field('published','Saytda göstər',item.published!==false,'checkbox')}
      ${field('featured','Seçilmiş oyun',!!item.featured,'checkbox')}
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">
      <button type="button" class="btn btn-soft" id="cancelModal">Ləğv et</button>
      <button type="submit" class="btn btn-primary">Yadda saxla</button>
    </div>`;
    $('#modalBackdrop').classList.add('show');
    $('#cancelModal').onclick=closeModal;
    $('#modalForm').onsubmit=submitGameEdit;
  }

  async function submitGameEdit(e){
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const i=currentIndex; const orig=content.games[i];
    const locObj=(base)=>({az:fd.get(base+'_az')||'',en:fd.get(base+'_en')||''});
    const title=fd.get('title')||'';
    const sub=locObj('subtitle');
    const desc=locObj('description');
    const screens=String(fd.get('screenshots')||'').split(',').map(x=>x.trim()).filter(Boolean);
    const screensFull=screens.map(url=>({path_full:url}));
    const obj={
      ...orig,
      title,
      slug:fd.get('slug')||slugify(title),
      subtitle:sub,
      short_description_az:sub.az,
      short_description_en:sub.en,
      description:desc,
      description_az:desc.az,
      description_en:desc.en,
      genre:locObj('genre'),
      platform:fd.get('platform')||'',
      players:locObj('players'),
      releaseDate:fd.get('releaseDate')||'',
      release_date:fd.get('releaseDate')||'',
      steamUrl:fd.get('steamUrl')||'#',
      steam_url:fd.get('steamUrl')||'',
      website:fd.get('website')||'',
      trailer_url:fd.get('trailer_url')||'',
      cover:fd.get('cover')||'',
      header_image:fd.get('cover')||'',
      hero:fd.get('hero')||'',
      hero_image:fd.get('hero')||'',
      screenshots:screens,
      screenshots_full:screensFull,
      published:fd.get('published')==='on',
      featured:fd.get('featured')==='on'
    };
    if(obj.featured){content.games.forEach((g,gi)=>{if(gi!==i)g.featured=false})}
    content.games[i]=obj;

    await saveContent(true);closeModal();renderGamesTab();renderKpis();toast('Oyun yeniləndi');
  }

  // ============================================================
  // Other list render (news, team, etc.)
  // ============================================================
  function renderList(type){
    if(type==='games')return; // Games has its own tab
    const arr=content[type]||[]; const root=$(`#${type}List`); if(!root)return;
    if(!arr.length){root.innerHTML=`<div class="empty-state"><h3>Hələ məlumat yoxdur</h3><p>"Əlavə et" düyməsi ilə ilk elementi yaradın.</p></div>`;return}
    root.innerHTML=arr.map((item,i)=>{
      const img=item.cover||item.image||item.photo||'';
      const title=item.title?(typeof item.title==='object'?(item.title.az||item.title.en):item.title):item.name||item.id||'Element';
      const sub=item.subtitle?.az||item.excerpt?.az||item.role?.az||item.url||item.type||'';
      return `<div class="admin-row"><div>${img?`<img class="admin-thumb" src="${esc(previewSrc(img))}" onerror="this.style.opacity=.2">`:`<div class="admin-thumb" style="display:grid;place-items:center">✦</div>`}</div><div><h3>${esc(title)}</h3><p>${esc(sub)}</p><label class="toggle" style="margin-top:6px"><input type="checkbox" data-publish="${type}:${i}" ${item.published!==false?'checked':''}><span>${item.published!==false?'Dərc olunub':'Gizlidir'}</span></label></div><div class="row-actions"><button class="icon-btn" data-edit="${type}:${i}" title="Redaktə">✎</button><button class="icon-btn danger" data-delete="${type}:${i}" title="Sil">🗑</button></div></div>`
    }).join('');
  }

  function renderAll(){renderKpis();renderHomepage();renderPages();renderSettings();['news','team','socials','careers','media'].forEach(renderList);bindListActions()}

  function bindListActions(){
    $$('[data-publish]').forEach(el=>el.addEventListener('change',async()=>{const [type,idx]=el.dataset.publish.split(':');content[type][+idx].published=el.checked;el.nextElementSibling.textContent=el.checked?'Dərc olunub':'Gizlidir';await saveContent(true);renderKpis()}));
    $$('[data-edit]').forEach(b=>b.addEventListener('click',()=>{const [type,idx]=b.dataset.edit.split(':');openModal(type,+idx)}));
    $$('[data-delete]').forEach(b=>b.addEventListener('click',async()=>{const [type,idx]=b.dataset.delete.split(':');const item=content[type][+idx];const name=item.title?.az||item.title||item.name||item.id||'bu elementi';if(!confirm(`"${name}" silinsin?`))return;content[type].splice(+idx,1);await saveContent(true);renderAll();toast('Element silindi')}));
  }

  function formFor(type,item={}){
    if(type==='news') return `<div class="form-grid">${loc('category','Kateqoriya',item.category)}${loc('title','Başlıq',item.title)}${loc('excerpt','Qısa mətn',item.excerpt,'textarea')}${field('date','Tarix',item.date||'','date')}${field('image','Şəkil URL',item.image||'','text',true)}${field('published','Saytda göstər',item.published!==false,'checkbox')}</div>`;
    if(type==='team') return `<div class="form-grid">${field('name','Ad və soyad',item.name||'')}${loc('role','Rol',item.role)}${field('photo','Foto URL',item.photo||'','text',true)}${field('published','Saytda göstər',item.published!==false,'checkbox')}</div>`;
    if(type==='socials') return `<div class="form-grid">${field('name','Platforma adı',item.name||'')}${field('id','Icon ID (steam, telegram, tiktok, whatsapp, instagram)',item.id||'')}${field('url','Link',item.url||'','url',true)}${field('published','Saytda göstər',item.published!==false,'checkbox')}</div>`;
    if(type==='careers') return `<div class="form-grid">${loc('title','Vakansiya adı',item.title)}${loc('description','Açıqlama',item.description,'textarea')}${field('published','Saytda göstər',item.published!==false,'checkbox')}</div>`;
    if(type==='media') return `<div class="form-grid">${loc('title','Material adı',item.title)}${field('type','Fayl tipi',item.type||'PNG')}${field('file','Fayl URL',item.file||'','text',true)}${field('published','Saytda göstər',item.published!==false,'checkbox')}</div>`;
    return '<p>Form tapılmadı.</p>';
  }

  function openModal(type,index=null){
    currentType=type;currentIndex=index;const item=index==null?{}:content[type][index];
    $('#modalTitle').textContent=index==null?'Yeni element':'Elementi redaktə et';
    $('#modalForm').innerHTML=formFor(type,item)+`<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px"><button type="button" class="btn btn-soft" id="cancelModal">Ləğv et</button><button type="submit" class="btn btn-primary">Yadda saxla</button></div>`;
    $('#modalBackdrop').classList.add('show');
    $('#cancelModal').onclick=closeModal;
    $('#modalForm').onsubmit=submitModal;
  }
  function closeModal(){$('#modalBackdrop').classList.remove('show')}

  async function submitModal(e){
    e.preventDefault();const fd=new FormData(e.currentTarget);let obj=currentIndex==null?{}:clone(content[currentType][currentIndex]);
    const locObj=(base)=>({az:fd.get(base+'_az')||'',en:fd.get(base+'_en')||''});
    if(currentType==='news') obj={...obj,id:obj.id||uid('news'),category:locObj('category'),title:locObj('title'),excerpt:locObj('excerpt'),date:fd.get('date')||'',image:fd.get('image')||'',published:fd.get('published')==='on'};
    if(currentType==='team') obj={...obj,id:obj.id||uid('team'),name:fd.get('name')||'',role:locObj('role'),photo:fd.get('photo')||'',published:fd.get('published')==='on'};
    if(currentType==='socials') obj={...obj,id:fd.get('id')||obj.id||uid('social'),name:fd.get('name')||'',url:fd.get('url')||'#',published:fd.get('published')==='on'};
    if(currentType==='careers') obj={...obj,id:obj.id||uid('career'),title:locObj('title'),description:locObj('description'),published:fd.get('published')==='on'};
    if(currentType==='media') obj={...obj,id:obj.id||uid('media'),title:locObj('title'),type:fd.get('type')||'',file:fd.get('file')||'',published:fd.get('published')==='on'};
    if(currentIndex==null) content[currentType].push(obj); else content[currentType][currentIndex]=obj;
    await saveContent(true);closeModal();renderAll();toast('Yadda saxlanıldı');
  }

  // ============================================================
  // Messages
  // ============================================================
  async function loadMessages(){
    const root=$('#messagesList'); if(!root)return;
    if(isDemo){root.innerHTML='<div class="empty-state"><h3>Local preview</h3><p>Mesajlar yalnız Vercel + Neon qoşulduqdan sonra burada görünəcək.</p></div>';return}
    root.innerHTML='<div class="empty-state">Yüklənir...</div>';
    try{messages=await api('/api/admin-messages');root.innerHTML=messages.length?messages.map(m=>`<div class="admin-row"><div class="admin-thumb" style="display:grid;place-items:center">✉</div><div><h3>${esc(m.name)} · ${esc(m.subject||'')}</h3><p>${esc(m.email)} — ${esc(m.message)}</p></div><div class="row-actions"><button class="icon-btn danger" data-msg-delete="${m.id}">🗑</button></div></div>`).join(''):'<div class="empty-state"><h3>Mesaj yoxdur</h3></div>';$$('[data-msg-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Mesaj silinsin?'))return;await api('/api/admin-messages',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id:b.dataset.msgDelete})});loadMessages()})}catch(e){root.innerHTML=`<div class="empty-state"><h3>Mesajlar yüklənmədi</h3><p>${esc(e.message)}</p></div>`}
  }

  // ============================================================
  // Mock Steam data (demo mode only)
  // ============================================================
  function makeMockSteamData(url){
    const m=url.match(/(\d+)/); const appId=m?m[1]:'1234567';
    return {
      steam_app_id:appId, steam_url:`https://store.steampowered.com/app/${appId}/`,
      slug:'demo-game-'+appId, title:'Demo Game (Steam Preview)',
      short_description_en:'This is a demo game loaded in preview mode. Connect Vercel + Neon to fetch real Steam data.',
      short_description_az:'', description_en:'Full game description would appear here after connecting to the Vercel API.', description_az:'',
      header_image:'https://cdn.akamai.steamstatic.com/steam/apps/'+appId+'/header.jpg',
      hero_image:'', screenshots:[
        {id:1,path_full:'https://cdn.akamai.steamstatic.com/steam/apps/'+appId+'/ss_1.jpg'},
        {id:2,path_full:'https://cdn.akamai.steamstatic.com/steam/apps/'+appId+'/ss_2.jpg'},
      ],
      trailer_url:'', genres:[{id:'1',description:'Action'}], categories:[{id:'2',description:'Single-player'}],
      platforms:{windows:true,mac:false,linux:false}, developers:['Demo Developer'], publishers:['Demo Publisher'],
      release_date:'Sep 18, 2026', website:'', _stats:{screenshots_count:2,platforms_count:1,genres_count:1,has_trailer:false,has_release_date:true}
    };
  }

  // ============================================================
  // Event bindings
  // ============================================================
  $$('#adminNav button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.go)));
  $$('[data-add]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.add==='games'){setTab('games');return}openModal(b.dataset.add)}));
  $('#saveAll').addEventListener('click',()=>saveContent());
  $('#logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem('aurex_admin_token');token='';showLogin()});
  $('#modalClose').addEventListener('click',closeModal); $('#modalBackdrop').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});
  $('#reloadMessages').addEventListener('click',loadMessages);

  // ============================================================
  // Newsletter — Subscribers + Campaign
  // ============================================================
  let _subSearch='', _subFilter='', _subPage=1;

  async function loadSubscribers(search=_subSearch, filter=_subFilter, page=_subPage){
    _subSearch=search; _subFilter=filter; _subPage=page;
    const kpiRoot=$('#newsletterKpis'), listRoot=$('#subscribersList');
    if(!kpiRoot||!listRoot)return;

    if(isDemo){
      kpiRoot.innerHTML='';
      listRoot.innerHTML='<div class="empty-state"><h3>Local preview</h3><p>Abunəçilər yalnız Vercel + Neon qoşulduqdan sonra burada görünəcək.</p></div>';
      return;
    }

    listRoot.innerHTML='<div class="empty-state">Yüklənir...</div>';
    try{
      const params=new URLSearchParams({search,status:filter,page,limit:50});
      const data=await api('/api/admin-subscribers?'+params);
      renderSubscriberKpis(kpiRoot, data.counts||{});
      renderSubscriberList(listRoot, data.subscribers||[], data.total||0, page);
    }catch(e){
      listRoot.innerHTML=`<div class="empty-state"><h3>Yüklənmədi</h3><p>${esc(e.message)}</p></div>`;
    }
  }

  function renderSubscriberKpis(root, counts){
    const {total=0,active=0,unsubscribed=0}=counts;
    root.innerHTML=[
      ['📧', total,      'Ümumi abunəçi'],
      ['✅', active,     'Aktiv'],
      ['🚫', unsubscribed,'Abunəlikdən çıxmış']
    ].map(([ic,n,l])=>`<div class="kpi"><div class="icon-bubble">${ic}</div><strong>${n}</strong><small>${l}</small></div>`).join('');
  }

  function renderSubscriberList(root, subs, total, page){
    if(!subs.length){
      root.innerHTML='<div class="empty-state"><h3>Abunəçi tapılmadı</h3><p>Axtarış şərtlərini dəyişdirin və ya yeni abunəçiləri gözləyin.</p></div>';
      return;
    }
    const fmt=dt=>{ try{return new Intl.DateTimeFormat('az-AZ',{day:'numeric',month:'short',year:'numeric'}).format(new Date(dt))}catch{return dt||''} };
    root.innerHTML=subs.map(s=>{
      const isActive=s.status==='active';
      return `<div class="admin-row" data-sub-id="${s.id}">
        <div class="admin-thumb" style="display:grid;place-items:center;font-size:20px">${isActive?'📧':'🚫'}</div>
        <div>
          <h3 style="font-size:13px;margin:0 0 3px">${esc(s.email)}</h3>
          <p style="font-size:11px;margin:0;color:var(--muted)">${fmt(s.created_at)}</p>
        </div>
        <div class="row-actions">
          <span class="pill" style="font-size:11px;padding:5px 10px;${isActive?'background:#e8fbf3;border-color:#b7f0d4;color:#0a6645':'background:#fff0f3;border-color:#ffd7df;color:#c83c57'}">${isActive?'Aktiv':'Çıxmış'}</span>
          <button class="icon-btn" data-sub-toggle="${s.id}" data-sub-status="${s.status}" title="Statusu dəyiş">⇄</button>
          <button class="icon-btn danger" data-sub-delete="${s.id}" title="Sil">🗑</button>
        </div>
      </div>`;
    }).join('');

    // Pagination
    const totalPages=Math.ceil(total/50);
    if(totalPages>1){
      const pag=document.createElement('div');
      pag.style.cssText='display:flex;gap:8px;justify-content:center;margin-top:14px';
      if(page>1) pag.innerHTML+=`<button class="btn btn-soft" data-sub-page="${page-1}">← Əvvəlki</button>`;
      pag.innerHTML+=`<span style="padding:10px 14px;font-size:13px;color:var(--muted)">${page} / ${totalPages}</span>`;
      if(page<totalPages) pag.innerHTML+=`<button class="btn btn-soft" data-sub-page="${page+1}">Növbəti →</button>`;
      root.appendChild(pag);
      pag.querySelectorAll('[data-sub-page]').forEach(b=>b.addEventListener('click',()=>loadSubscribers(_subSearch,_subFilter,+b.dataset.subPage)));
    }

    // Toggle status
    root.querySelectorAll('[data-sub-toggle]').forEach(b=>b.addEventListener('click',async()=>{
      const newStatus=b.dataset.subStatus==='active'?'unsubscribed':'active';
      try{
        await api('/api/admin-subscribers',{method:'PATCH',body:JSON.stringify({id:+b.dataset.subToggle,status:newStatus})});
        loadSubscribers();
        toast('Status yeniləndi');
      }catch(e){toast('Xəta: '+e.message,true)}
    }));

    // Delete
    root.querySelectorAll('[data-sub-delete]').forEach(b=>b.addEventListener('click',async()=>{
      if(!confirm('Abunəçi silinsin?'))return;
      try{
        await api('/api/admin-subscribers',{method:'DELETE',body:JSON.stringify({id:+b.dataset.subDelete})});
        loadSubscribers();
        toast('Abunəçi silindi');
      }catch(e){toast('Xəta: '+e.message,true)}
    }));
  }

  // Search + filter bindings (use event delegation since elements render dynamically)
  document.addEventListener('input', e=>{ if(e.target.id==='subSearch') loadSubscribers(e.target.value,_subFilter,1) });
  document.addEventListener('change', e=>{ if(e.target.id==='subFilter') loadSubscribers(_subSearch,e.target.value,1) });
  document.getElementById('reloadSubscribers')?.addEventListener('click',()=>loadSubscribers(_subSearch,_subFilter,1));

  // Campaign UI
  function setCampaignMsg(text, type='info'){
    const msg=document.getElementById('campaignMsg');
    if(!msg)return;
    const styles={
      info:'background:#eef6ff;border:1px solid #cfe2fb;color:#245ea8',
      ok:'background:#e8fbf3;border:1px solid #b7f0d4;color:#0a6645',
      warn:'background:#fffbe6;border:1px solid #fde68a;color:#7a5a00',
      err:'background:#fff0f3;border:1px solid #ffd7df;color:#c83c57'
    };
    msg.textContent=text;
    msg.style.cssText=`display:block;${styles[type]||styles.info};border-radius:12px;padding:12px 16px;font-size:13px;font-weight:700;margin-top:12px`;
  }

  function campaignPayload(){
    return {
      subject:(document.getElementById('campaignSubject')?.value||'').trim(),
      message:(document.getElementById('campaignBody')?.value||'').trim(),
      testEmail:(document.getElementById('campaignTestEmail')?.value||'').trim()
    };
  }

  async function sendCampaign(mode){
    const payload=campaignPayload();
    if(!payload.subject){setCampaignMsg('Mövzu daxil edin.','warn');return}
    if(!payload.message){setCampaignMsg('Mesaj məzmununu daxil edin.','warn');return}
    if(mode==='test'&&!payload.testEmail){setCampaignMsg('Test e-poçt ünvanını daxil edin.','warn');return}

    if(mode==='all'){
      const activeText=document.querySelector('#newsletterKpis .kpi:nth-child(2) strong')?.textContent||'aktiv';
      if(!confirm(`Kampaniya ${activeText} aktiv abunəçiyə göndəriləcək. Davam edilsin?`))return;
    }

    const testBtn=document.getElementById('campaignTestBtn');
    const sendBtn=document.getElementById('campaignSendBtn');
    const btn=mode==='test'?testBtn:sendBtn;
    const old=btn?.textContent||'';
    if(btn){btn.disabled=true;btn.textContent=mode==='test'?'Göndərilir...':'Kampaniya göndərilir...'}
    if(testBtn)testBtn.disabled=true;
    if(sendBtn)sendBtn.disabled=true;

    setCampaignMsg(mode==='test'?'Test email göndərilir...':'Kampaniya göndərilir...','info');

    try{
      const data=await api('/api/send-campaign',{
        method:'POST',
        body:JSON.stringify({
          mode,
          testEmail:payload.testEmail,
          subject:payload.subject,
          message:payload.message
        })
      });

      if(mode==='test'){
        setCampaignMsg('✅ Test email uğurla göndərildi. Inbox və Spam qovluğunu yoxlayın.','ok');
      }else{
        const sent=Number(data.sent||0), failed=Number(data.failed||0);
        setCampaignMsg(failed
          ? `⚠ ${sent} göndərildi, ${failed} uğursuz oldu.`
          : `✅ ${sent} abunəçiyə uğurla göndərildi.`,
          failed?'warn':'ok'
        );
      }
    }catch(err){
      setCampaignMsg('❌ '+(err.message||'E-poçt göndərilmədi.'),'err');
    }finally{
      if(btn){btn.disabled=false;btn.textContent=old}
      if(testBtn)testBtn.disabled=false;
      if(sendBtn)sendBtn.disabled=false;
    }
  }

  document.addEventListener('click', async e=>{
    if(e.target.id==='campaignTestBtn'){
      await sendCampaign('test');
      return;
    }

    if(e.target.id==='campaignSendBtn'){
      await sendCampaign('all');
      return;
    }

    if(e.target.id==='campaignPreviewBtn'){
      const subject=document.getElementById('campaignSubject')?.value||'(mövzu yoxdur)';
      const body=document.getElementById('campaignBody')?.value||'(məzmun yoxdur)';
      const box=document.getElementById('campaignPreviewBox');
      if(!box)return;
      box.style.display='block';
      box.innerHTML=`<p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#5278aa">MÖVZU: ${esc(subject)}</p><hr style="border:0;border-top:1px solid #e0eaf6;margin:10px 0"><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.65;color:var(--text);margin:0">${esc(body)}</pre>`;
    }
  });

  initAuth();
})();
