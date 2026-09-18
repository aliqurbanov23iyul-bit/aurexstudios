(() => {
  const $ = (q, el=document) => el.querySelector(q);
  const $$ = (q, el=document) => [...el.querySelectorAll(q)];

  const state = {
    content: window.DEFAULT_CONTENT || {},
    lang: localStorage.getItem('aurex_lang') || 'az'
  };

  const tr = (v) => {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    return v[state.lang] ?? v.az ?? v.en ?? '';
  };

  const escapeHtml = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const icons = {
    arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M14 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.5 17 12l-8.5 5.5z" fill="currentColor"/></svg>`,
    game: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h10a4 4 0 0 1 3.7 5.5l-1 2.6a2 2 0 0 1-3.2.8L14.5 15h-5l-2 1.9a2 2 0 0 1-3.2-.8l-1-2.6A4 4 0 0 1 7 8Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7.5 12h3M9 10.5v3M15.5 11.5h.01M17.5 13h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    people: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.8a4.2 4.2 0 0 0-4.2-4.2H7.2A4.2 4.2 0 0 0 3 18.2V20M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 1 0 0-6M18 14.5c1.8.7 3 2.4 3 4.5V20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/> </svg>`,
    globe: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 12h17M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.7a5.4 5.4 0 0 0-7.6 0L12 5.9l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.6Z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
    spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.4 4.1L17.5 7.5l-4.1 1.4L12 13l-1.4-4.1-4.1-1.4 4.1-1.4L12 2ZM18.5 13l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6ZM6 14l1.1 3.2L10.3 18l-3.2 1.1L6 22.3l-1.1-3.2L1.7 18l3.2-1.1L6 14Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
    steam: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.8A10.2 10.2 0 0 0 1.9 10.5l5.5 2.3a3.3 3.3 0 0 1 1.8-1l2.4-3.5a4.6 4.6 0 1 1 4.6 4.6l-3.6 2.6a3.4 3.4 0 0 1-6.6 1.1L2.8 15A10.2 10.2 0 1 0 12 1.8Zm-2.7 15.6-1.8-.7a2.3 2.3 0 1 0 4.4-1.3 2.3 2.3 0 0 0-1.2-1.2l-1.8-.8a1.7 1.7 0 0 1 .4 4Zm7-5.8a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm0-.8a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8Z"/></svg>`,
    telegram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 3.65c-.26-.2-.62-.25-.93-.13L2.4 10.64c-.4.16-.65.55-.63.98.02.43.3.79.7.92l4.8 1.55 1.83 5.56c.14.41.51.69.94.69.3 0 .59-.14.77-.38l2.67-3.4 4.54 3.35c.23.17.51.26.79.26.13 0 .26-.02.39-.07.39-.14.67-.49.73-.9l2.8-14.8c.07-.37-.07-.75-.33-.95zm-3.1 3.27-8.1 7.33-.82 2.47-.53-4.33 9.45-5.47z"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.88 2.89 2.89 0 0 1-2.89-2.88 2.89 2.89 0 0 1 2.89-2.89c.37 0 .72.07 1.04.19V9.41a6.33 6.33 0 0 0-1.04-.08 6.34 6.34 0 1 0 6.34 6.34V8.58a8.28 8.28 0 0 0 4.76 1.54V6.69z"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 17.65c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    discord: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
    x: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    twitter: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.225 0z"/></svg>`,
    github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`
  };

  const navItems = [
    ['index.html', {az:'Ana səhifə',en:'Home'}, 'home'],
    ['games.html', {az:'Oyunlarımız',en:'Games'}, 'games'],
    ['about.html', {az:'Haqqımızda',en:'About'}, 'about'],
    ['team.html', {az:'Komanda',en:'Team'}, 'team'],
    ['news.html', {az:'Xəbərlər',en:'News'}, 'news'],
    ['careers.html', {az:'Karyera',en:'Careers'}, 'careers'],
    ['contact.html', {az:'Əlaqə',en:'Contact'}, 'contact']
  ];

  async function loadContent(){
    try {
      const r = await fetch('/api/content', {cache:'no-store'});
      if (r.ok) {
        state.content = await r.json();
        return state.content;
      }
    } catch (_) {}
    try {
      const saved = localStorage.getItem('aurex_admin_content');
      if (saved) state.content = JSON.parse(saved);
    } catch (_) {}
    return state.content;
  }

  function activePage(){ return document.body.dataset.page || 'home'; }

  function renderHeader(){
    const root = $('[data-header]'); if (!root) return;
    root.innerHTML = `<header class="site-header">
      <div class="container navbar">
        <a class="brand" href="index.html" aria-label="Aurex Studio">
          <img class="brand-logo" src="assets/brand/aurex-logo.png" alt="Aurex Studio">
          <span class="brand-text"><strong>AUREX</strong><span>STUDIO</span></span>
        </a>
        <nav class="nav-links" id="siteNav">
          ${navItems.map(([href,label,key])=>`<a class="nav-link ${activePage()===key?'active':''}" href="${href}">${escapeHtml(tr(label))}</a>`).join('')}
        </nav>
        <div class="nav-actions">
          <div class="lang-switch" aria-label="Language"><button data-lang="az" class="${state.lang==='az'?'active':''}">AZ</button><button data-lang="en" class="${state.lang==='en'?'active':''}">EN</button></div>
          <button class="menu-toggle" id="menuToggle" aria-label="Menu">☰</button>
        </div>
      </div>
    </header>`;
    const h = $('.site-header');
    const onScroll = () => h.classList.toggle('scrolled', scrollY>10); onScroll(); addEventListener('scroll', onScroll, {passive:true});
    $('#menuToggle')?.addEventListener('click',()=>$('#siteNav')?.classList.toggle('open'));
    $$('[data-lang]').forEach(b=>b.addEventListener('click',()=>{
      state.lang=b.dataset.lang; localStorage.setItem('aurex_lang',state.lang); renderAll();
    }));
  }

  function renderFooter(){
    const root = $('[data-footer]'); if (!root) return;
    const socials=(state.content.socials||[]).filter(x=>x.published);
    root.innerHTML=`<footer class="site-footer"><div class="container">
      <div class="footer-top">
        <a class="brand" href="index.html"><img class="brand-logo" src="assets/brand/aurex-logo.png" alt=""><span class="brand-text"><strong>AUREX</strong><span>STUDIO</span></span></a>
        <div class="footer-links"><a href="games.html">${state.lang==='az'?'Oyunlar':'Games'}</a><a href="about.html">${state.lang==='az'?'Haqqımızda':'About'}</a><a href="media.html">Media</a><a href="contact.html">${state.lang==='az'?'Əlaqə':'Contact'}</a></div>
        <div class="social-row">${socials.map(s=>socialButton(s)).join('')}</div>
      </div>
      <div class="footer-bottom"><span>© ${escapeHtml(state.content.site?.copyrightYear||'2026')} Aurex Studio. ${state.lang==='az'?'Bütün hüquqlar qorunur.':'All rights reserved.'}</span><span><a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></span></div>
    </div></footer>`;
  }

  function socialButton(s){
    const pid = String(s.id || '').toLowerCase().trim();
    const ic = icons[pid] || icons[s.id] || icons.globe;
    const href = s.url && s.url !== '#' ? s.url : 'javascript:void(0)';
    return `<a class="social-btn" data-platform="${escapeHtml(pid)}" href="${escapeHtml(href)}" ${href.startsWith('http')?'target="_blank" rel="noopener"':''} title="${escapeHtml(s.name)}" aria-label="${escapeHtml(s.name)}">${ic}</a>`;
  }

  function gameCard(g){
    const cover = g.cover || g.header_image || (Array.isArray(g.screenshots)&&g.screenshots[0]) || '';
    const title = typeof g.title === 'object' ? (g.title[state.lang] || g.title.az || g.title.en) : g.title || '';
    const subtitle = typeof g.subtitle === 'object' ? tr(g.subtitle) : (state.lang === 'az' ? (g.short_description_az || g.subtitle) : (g.short_description_en || g.subtitle)) || '';
    const genre = typeof g.genre === 'object' ? tr(g.genre) : (Array.isArray(g.genres) && g.genres.length ? g.genres.map(x => x.description || x).join(', ') : g.genre || '');
    const platform = g.platform || (g.platforms ? Object.entries(g.platforms).filter(([, v]) => v).map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)).join(' · ') : '');
    const relDate = g.releaseDate || g.release_date || '';

    return `<article class="game-card reveal"><a href="game.html?id=${encodeURIComponent(g.slug || g.id)}"><div class="game-card-media"><img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}"><span class="game-status">${relDate ? (state.lang==='az'?'Yayımlanıb':'Released') : (state.lang==='az'?'Tezliklə':'Coming soon')}</span></div><div class="game-card-body"><h3>${escapeHtml(title)}</h3>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}${(genre || platform) ? `<div class="meta-row" style="margin-top:12px;margin-bottom:0">${genre ? `<span class="pill">${escapeHtml(genre)}</span>` : ''}${platform ? `<span class="pill">${escapeHtml(platform)}</span>` : ''}</div>` : ''}</div></a></article>`;
  }

  function newsCard(n){
    return `<article class="news-card reveal"><div class="news-card-media"><img src="${escapeHtml(n.image||'assets/studio-world.jpg')}" alt=""></div><div class="news-card-body"><div class="news-category">${escapeHtml(tr(n.category))}</div><div class="news-date">${formatDate(n.date)}</div><h3>${escapeHtml(tr(n.title))}</h3><p>${escapeHtml(tr(n.excerpt))}</p></div></article>`;
  }

  function formatDate(v){
    if(!v) return '';
    if(typeof v === 'object' && v.date) v = v.date;
    if(typeof v !== 'string') return '';
    let str = v.trim();
    const mMatch = str.match(/^(\d{4})\s*M(\d{1,2})\s*(\d{1,2})$/i);
    if(mMatch){
      str = mMatch[1] + '-' + mMatch[2].padStart(2, '0') + '-' + mMatch[3].padStart(2, '0');
    }
    let d = new Date(str.includes('T') ? str : (str.match(/^\d{4}-\d{2}-\d{2}$/) ? str + 'T12:00:00' : str));
    if(isNaN(d.getTime())) d = new Date(str);
    if(!isNaN(d.getTime())){
      try {
        return new Intl.DateTimeFormat(state.lang === 'az' ? 'az-AZ' : 'en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(d);
      } catch(e){}
    }
    return v;
  }

  function renderHome(){
    const root=$('[data-home]'); if(!root)return;
    const c=state.content, h=c.homepage||{}, games=(c.games||[]).filter(x=>x.published), featured=games.find(x=>x.featured)||games[0], news=(c.news||[]).filter(x=>x.published).slice(0,3), socials=(c.socials||[]).filter(x=>x.published);
    root.innerHTML=`
      ${h.hero?.enabled!==false?`<section class="hero"><div class="container hero-grid"><div class="hero-copy reveal"><span class="eyebrow">${escapeHtml(tr(h.hero.eyebrow))}</span><h1>${highlightLastWord(tr(h.hero.title))}</h1><p class="hero-lead">${escapeHtml(tr(h.hero.text))}</p><div class="hero-actions"><a class="btn btn-primary" href="games.html">${escapeHtml(tr(h.hero.primary))} <span style="width:18px">${icons.arrow}</span></a><a class="btn btn-soft" href="about.html">${escapeHtml(tr(h.hero.secondary))}</a></div><div class="hero-note"><div class="mini-orbs"><span></span><span></span><span></span></div><span>${state.lang==='az'?'İlk oyunumuz artıq Steam-dədir.':'Our first game is already on Steam.'}</span></div></div><div class="hero-side"><div class="floating-quote"><p>“${state.lang==='az'?'Hər oyun öz dünyası ilə yadda qalmalıdır.':'Every game should be remembered for its own world.'}”</p><small>— Aurex Studio</small></div></div></div><div class="scroll-hint">${state.lang==='az'?'AŞAĞI':'SCROLL'}</div></section>`:''}
      <div class="container">
      ${featured && h.featured?.enabled!==false ? featuredBlock(featured,h.featured) : ''}
      ${featured ? `<div class="info-strip reveal"><div class="info-box"><div class="icon-bubble">${icons.game}</div><div><strong>${games.length}</strong><small>${state.lang==='az'?'Yayımlanmış oyun':'Released game'}</small></div></div><div class="info-box"><div class="icon-bubble">${icons.globe}</div><div><strong>${escapeHtml(featured.platform)}</strong><small>${state.lang==='az'?'Hazırkı platforma':'Current platform'}</small></div></div><div class="info-box"><div class="icon-bubble">${icons.people}</div><div><strong>${escapeHtml(tr(featured.players))}</strong><small>${state.lang==='az'?'Oyun rejimi':'Game mode'}</small></div></div><div class="info-box"><div class="icon-bubble">${icons.heart}</div><div><strong>Aurex Studio</strong><small>${state.lang==='az'?'Müstəqil studio':'Independent studio'}</small></div></div></div>`:''}
      </div>
      ${h.about?.enabled!==false?`<section class="section"><div class="container about-grid"><div class="about-copy-card reveal"><span class="eyebrow">${escapeHtml(tr(h.about.label))}</span><h2>${escapeHtml(tr(h.about.title))}</h2><p>${escapeHtml(tr(h.about.text))}</p><a class="btn btn-ghost" href="about.html">${state.lang==='az'?'Daha çox öyrən':'Learn more'} <span style="width:16px">${icons.arrow}</span></a></div><div class="value-grid"><article class="value-card reveal"><div class="icon-bubble">${icons.spark}</div><h3>${state.lang==='az'?'Yaradıcı azadlıq':'Creative freedom'}</h3><p>${state.lang==='az'?'Hər layihənin öz vizual dili və öz ritmi olmalıdır.':'Every project deserves its own visual language and rhythm.'}</p></article><article class="value-card reveal"><div class="icon-bubble">${icons.people}</div><h3>${state.lang==='az'?'Oyunçu mərkəzli':'Player focused'}</h3><p>${state.lang==='az'?'Qərarları oyunçunun yaşayacağı təcrübəyə görə veririk.':'We make decisions around the experience the player will have.'}</p></article><article class="value-card reveal"><div class="icon-bubble">${icons.globe}</div><h3>${state.lang==='az'?'Fərqli dünyalar':'Different worlds'}</h3><p>${state.lang==='az'?'Aurex bir janrla məhdudlaşmır; hər oyun yeni istiqamət ola bilər.':'Aurex is not limited to one genre; every game can go somewhere new.'}</p></article><article class="value-card reveal"><div class="icon-bubble">${icons.heart}</div><h3>${state.lang==='az'?'Detala diqqət':'Care for detail'}</h3><p>${state.lang==='az'?'Atmosfer, səs və gameplay eyni dünyaya xidmət etməlidir.':'Atmosphere, sound and gameplay should serve the same world.'}</p></article></div></div></section>`:''}
      ${h.games?.enabled!==false && games.length?`<section class="section compact"><div class="container"><div class="section-head"><div><span class="eyebrow">AUREX GAMES</span><h2 class="section-title">${escapeHtml(tr(h.games.title))}</h2><p class="section-copy">${state.lang==='az'?'Hazırkı və gələcək Aurex layihələri üçün vahid kataloq.':'One catalogue for current and future Aurex projects.'}</p></div><a class="btn btn-soft" href="games.html">${state.lang==='az'?'Hamısına bax':'View all'}</a></div><div class="cards-3">${games.slice(0,3).map(gameCard).join('')}</div></div></section>`:''}
      ${h.news?.enabled!==false && news.length?`<section class="section compact"><div class="container"><div class="section-head"><div><span class="eyebrow">JOURNAL</span><h2 class="section-title">${escapeHtml(tr(h.news.title))}</h2></div><a class="btn btn-soft" href="news.html">${state.lang==='az'?'Bütün xəbərlər':'All news'}</a></div><div class="news-grid">${news.map(newsCard).join('')}</div></div></section>`:''}
      ${h.community?.enabled!==false && socials.length?`<section class="section compact"><div class="container"><div class="community-card reveal"><div><span class="eyebrow">COMMUNITY</span><h3>${escapeHtml(tr(h.community.title))}</h3><p>${state.lang==='az'?'Yeni elanlar, oyun yenilikləri və studio xəbərləri üçün Aurex kanallarını izlə.':'Follow Aurex for game updates, announcements and studio news.'}</p></div><div class="social-row">${socials.map(s=>socialButton(s)).join('')}</div></div></div></section>`:''}
    `;
    bindFeatureThumbs();
  }

  function featuredBlock(g, cfg){
    return `<section class="featured-card reveal"><div class="featured-media"><img id="featuredMain" src="${escapeHtml(g.cover)}" alt="${escapeHtml(g.title)}"><div class="featured-title-overlay"><strong>${escapeHtml(g.title)}</strong><span>${escapeHtml(tr(g.subtitle))}</span></div></div><div class="featured-info"><span class="pill live"><span class="dot"></span>${state.lang==='az'?'İNDİ STEAM-DƏ':'NOW ON STEAM'}</span><h2>${escapeHtml(g.title)}</h2><p>${escapeHtml(tr(g.description))}</p><div class="meta-row"><span class="pill">${escapeHtml(tr(g.genre))}</span><span class="pill">${escapeHtml(g.platform)}</span><span class="pill">${escapeHtml(tr(g.players))}</span></div><div class="feature-actions"><a class="btn btn-primary" href="${escapeHtml(g.steamUrl)}" target="_blank" rel="noopener">Steam-də bax <span style="width:16px">${icons.arrow}</span></a><a class="btn btn-soft" href="game.html?id=${encodeURIComponent(g.slug)}">${state.lang==='az'?'Ətraflı':'Details'}</a></div>${(g.screenshots||[]).length?`<div class="screens-preview">${g.screenshots.map((s,i)=>`<img data-feature-thumb src="${escapeHtml(s)}" class="${i===0?'active':''}" alt="">`).join('')}</div>`:''}</div></section>`;
  }

  function highlightLastWord(text){
    const words=String(text).trim().split(/\s+/); if(words.length<2)return escapeHtml(text); const last=words.pop(); return `${escapeHtml(words.join(' '))}<span class="accent">${escapeHtml(last)}</span>`;
  }

  function bindFeatureThumbs(){
    $$('[data-feature-thumb]').forEach(img=>img.addEventListener('click',()=>{const main=$('#featuredMain');if(!main)return; main.src=img.src; $$('[data-feature-thumb]').forEach(x=>x.classList.remove('active'));img.classList.add('active')}));
  }

  function renderGames(){
    const root=$('[data-games]'); if(!root)return;
    const games=(state.content.games||[]).filter(x=>x.published);
    const p=state.content.pages?.games||{};
    root.innerHTML=`<section class="page-hero"><div class="container"><span class="eyebrow">${escapeHtml(tr(p.eyebrow)||'AUREX GAMES')}</span><h1>${highlightLastWord(tr(p.title)||(state.lang==='az'?'Oyunlarımız':'Our games'))}</h1><p>${escapeHtml(tr(p.text)||'')}</p></div></section><section class="section"><div class="container"><div class="filters"><button class="filter-btn active">${state.lang==='az'?'Hamısı':'All'}</button><button class="filter-btn">${state.lang==='az'?'Yayımlanıb':'Released'} (${games.length})</button></div><div class="game-list">${games.length?games.map(gameListItem).join(''):`<div class="empty-state"><h3>${state.lang==='az'?'Yeni layihələr tezliklə':'New projects coming soon'}</h3><p>${state.lang==='az'?'Yeni oyun elan olunanda burada görünəcək.':'New games will appear here when announced.'}</p></div>`}</div></div></section>`;
  }

  function gameListItem(g){
    const cover = g.cover || g.header_image || (Array.isArray(g.screenshots) && g.screenshots[0]) || '';
    const steamUrl = g.steam_url || g.steamUrl || '';
    const title = typeof g.title === 'object' ? (g.title[state.lang] || g.title.az || g.title.en) : g.title || '';
    const desc = typeof g.description === 'object' ? tr(g.description) : (state.lang === 'az' ? (g.description_az || g.short_description_az || g.description) : (g.description_en || g.short_description_en || g.description)) || '';
    const genre = typeof g.genre === 'object' ? tr(g.genre) : (Array.isArray(g.genres) && g.genres.length ? g.genres.map(x => x.description || x).join(', ') : g.genre || '');
    const platform = g.platform || (g.platforms ? Object.entries(g.platforms).filter(([, v]) => v).map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)).join(' · ') : '');
    const players = typeof g.players === 'object' ? tr(g.players) : g.players || '';

    return `<article class="game-list-item reveal">
      <img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}">
      <div class="game-list-copy">
        <span class="pill live"><span class="dot"></span>${state.lang==='az'?'YAYIMLANIB':'RELEASED'}</span>
        <h2>${escapeHtml(title)}</h2>
        ${(genre || platform || players) ? `<div class="meta-row">
          ${genre ? `<span class="pill">${escapeHtml(genre)}</span>` : ''}
          ${platform ? `<span class="pill">${escapeHtml(platform)}</span>` : ''}
          ${players ? `<span class="pill">${escapeHtml(players)}</span>` : ''}
        </div>` : ''}
        ${desc ? `<p>${escapeHtml(desc)}</p>` : ''}
        <div class="feature-actions">
          <a class="btn btn-primary" href="game.html?id=${encodeURIComponent(g.slug || g.id)}">${state.lang==='az'?'Ətraflı bax':'View details'}</a>
          ${steamUrl && steamUrl !== '#' ? `<a class="btn btn-steam" href="${escapeHtml(steamUrl)}" target="_blank" rel="noopener">${icons.steam} ${state.lang==='az'?'Steam səhifəsi':'Steam Page'}</a>` : ''}
        </div>
      </div>
    </article>`;
  }

  function renderGame(){
    const root = $('[data-game]'); if(!root) return;
    const id = new URLSearchParams(location.search).get('id');
    const slug = new URLSearchParams(location.search).get('slug') || id;
    const games = (state.content.games || []).filter(x => x.published !== false);
    const g = games.find(x => x.slug === slug) || games.find(x => x.id === slug) || games[0];
    if(!g){
      root.innerHTML = `<section class="section"><div class="container empty-state"><h3>${state.lang==='az'?'Oyun tapılmadı':'Game not found'}</h3><p>${state.lang==='az'?'Bu oyun artıq mövcud deyil və ya URL səhvdir.':'This game is no longer available or the link is incorrect.'}</p><a class="btn btn-soft" href="games.html">${state.lang==='az'?'Bütün oyunlara bax':'View all games'}</a></div></section>`;
      return;
    }

    // Resolved values
    const title = typeof g.title === 'object' ? (g.title[state.lang] || g.title.az || g.title.en) : g.title || '';
    let subtitle = '';
    if (g.subtitle) {
      subtitle = typeof g.subtitle === 'object' ? (g.subtitle[state.lang] || g.subtitle.az || g.subtitle.en || '') : String(g.subtitle);
    } else if (state.lang === 'az' && g.short_description_az) {
      subtitle = g.short_description_az;
    } else if (state.lang === 'en' && g.short_description_en) {
      subtitle = g.short_description_en;
    }
    subtitle = (subtitle || '').trim();

    let fullDescription = '';
    if (state.lang === 'az') {
      fullDescription = g.description_az || (typeof g.description === 'object' ? (g.description.az || '') : (g.description || ''));
      if (!fullDescription && g.short_description_az) fullDescription = g.short_description_az;
    } else {
      fullDescription = g.description_en || (typeof g.description === 'object' ? (g.description.en || '') : (g.description || ''));
      if (!fullDescription && g.short_description_en) fullDescription = g.short_description_en;
    }
    fullDescription = (fullDescription || '').trim();
    const longDesc = fullDescription;

    // Clean description for hero: concise, avoids repeating subtitle
    let heroDesc = fullDescription;
    if (subtitle && heroDesc) {
      if (heroDesc.toLowerCase() === subtitle.toLowerCase()) {
        heroDesc = '';
      } else if (heroDesc.toLowerCase().startsWith(subtitle.toLowerCase())) {
        heroDesc = heroDesc.slice(subtitle.length).replace(/^[\s.:,-]+/, '').trim();
      }
    }
    if (heroDesc.length > 220) {
      const match = heroDesc.match(/^([^.!?]+[.!?])/);
      if (match && match[1].length >= 35) {
        heroDesc = match[1].trim();
      } else {
        heroDesc = heroDesc.slice(0, 200).replace(/[,; ]+\S*$/, '') + '...';
      }
    }

    const steamUrl = (g.steam_url || g.steamUrl || '').trim();
    const hasSteam = Boolean(steamUrl && steamUrl !== '#' && steamUrl !== 'javascript:void(0)');

    let trailerUrl = (g.trailer_url || '').trim();
    if (!trailerUrl && Array.isArray(g.movies) && g.movies.length) {
      const m = g.movies[0];
      trailerUrl = (m.mp4?.max || m.mp4?.[480] || m.webm?.max || m.webm?.[480] || '').trim();
    }
    const hasTrailer = Boolean(trailerUrl);

    const releaseDate = g.release_date || g.releaseDate || '';
    const playersStr = (tr(g.players) || '').trim();

    // Screenshots: extract both full quality and thumbnail quality
    const rawScreenshots = (Array.isArray(g.screenshots) && g.screenshots.length)
      ? g.screenshots
      : (Array.isArray(g.screenshots_full) ? g.screenshots_full : []);

    const screenshotItems = rawScreenshots.map(s => {
      if (!s) return null;
      if (typeof s === 'string') {
        const url = s.trim();
        return url ? { full: url, thumb: url } : null;
      }
      const full = (s.path_full || s.url || '').trim();
      const thumb = (s.path_thumbnail || s.path_full || s.url || '').trim();
      return full ? { full, thumb: thumb || full } : null;
    }).filter(Boolean);

    const galleryUrls = screenshotItems.map(item => item.full);

    // Universal hero image resolution (non-hardcoded):
    // 1. hero_image
    // 2. header_image
    // 3. screenshots[].path_full (first valid)
    // 4. fallback image
    let firstScreenshotFull = '';
    for (const s of rawScreenshots) {
      const full = typeof s === 'string' ? s : (s && (s.path_full || s.url));
      if (full && typeof full === 'string' && full.trim()) {
        firstScreenshotFull = full.trim();
        break;
      }
    }

    const defaultFallback = 'assets/studio-world.jpg';
    const heroCandidates = [
      g.hero_image,
      g.header_image,
      firstScreenshotFull,
      g.hero,
      g.cover
    ];
    const heroImg = heroCandidates.find(url => typeof url === 'string' && url.trim().length > 0) || defaultFallback;
    const coverImg = [g.header_image, g.cover, heroImg, defaultFallback].find(url => typeof url === 'string' && url.trim().length > 0);

    // Platforms (e.g. "PC / Steam")
    let platformStr = '';
    if (typeof g.platform === 'string' && g.platform.trim()) {
      platformStr = g.platform.replace(/\s*[·•|]\s*/g, ' / ').trim();
    } else if (g.platforms && typeof g.platforms === 'object') {
      const pList = Object.entries(g.platforms).filter(([, v]) => v).map(([k]) => {
        if (k === 'windows') return 'PC / Steam';
        if (k === 'mac') return 'macOS';
        return k.charAt(0).toUpperCase() + k.slice(1);
      });
      platformStr = pList.join(', ');
    }

    // Genres
    let genreStr = '';
    if (Array.isArray(g.genres) && g.genres.length) {
      genreStr = g.genres.map(x => (typeof x === 'object' ? x.description : x)).filter(Boolean).slice(0, 2).join(', ');
    } else if (g.genre) {
      genreStr = tr(g.genre) || '';
    }
    genreStr = genreStr.trim();

    // Developers / Publishers
    const devs = Array.isArray(g.developers) && g.developers.length ? g.developers : [].concat(g.developer || []).filter(Boolean);
    const pubs = Array.isArray(g.publishers) && g.publishers.length ? g.publishers : [].concat(g.publisher || []).filter(Boolean);

    // Other games (exclude current)
    const otherGames = games.filter(x => (x.slug !== g.slug && x.id !== g.id)).slice(0, 4);

    // Update page title & meta desc
    document.title = `${escapeHtml(title)} — Aurex Studio`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = (subtitle || heroDesc || fullDescription || title).slice(0, 155);

    // ── Metadata chips ──
    const dateFormatted = releaseDate ? formatDate(releaseDate) : '';
    const chipsList = [];
    if (genreStr) chipsList.push(`<span class="gdh-chip">${escapeHtml(genreStr)}</span>`);
    if (platformStr) chipsList.push(`<span class="gdh-chip">${escapeHtml(platformStr)}</span>`);
    if (playersStr) chipsList.push(`<span class="gdh-chip">${escapeHtml(playersStr)}</span>`);
    if (dateFormatted) chipsList.push(`<span class="gdh-chip">${escapeHtml(dateFormatted)}</span>`);
    const chipsHtml = chipsList.length ? `<div class="gdh-chips">${chipsList.join('')}</div>` : '';

    // ── Action buttons: 1 primary Steam button, 1 secondary Trailer button (if trailer exists) ──
    const actionBtns = [];
    if (hasSteam) {
      actionBtns.push(`<a class="gdh-btn-steam" href="${escapeHtml(steamUrl)}" target="_blank" rel="noopener">${icons.steam}<span>${state.lang==='az'?'Steam-də bax':'View on Steam'}</span></a>`);
    }
    if (hasTrailer) {
      actionBtns.push(`<button class="gdh-btn-trailer" id="heroTrailerBtn" type="button">${icons.play}<span>${state.lang==='az'?'Treyləri izlə':'Watch trailer'}</span></button>`);
    }
    const actionsHtml = actionBtns.length ? `<div class="gdh-actions">${actionBtns.join('')}</div>` : '';

    // ── Horizontal Screenshot Strip (Desktop bottom-right / Mobile under content) ──
    const heroThumbs = screenshotItems.slice(0, 5);
    const thumbsHtml = heroThumbs.length ? `
      <div class="gdh-thumbs-box" role="region" aria-label="${state.lang==='az'?'Ekran görüntüləri':'Screenshots'}">
        <div class="gdh-thumbs-strip">
          ${heroThumbs.map((item, i) => `
            <button class="gdh-thumb ${i===0?'active':''}" data-hero-full="${escapeHtml(item.full)}" type="button" aria-label="${state.lang==='az'?'Şəkil':'Screenshot'} ${i+1}">
              <img src="${escapeHtml(item.thumb)}" alt="" loading="eager" decoding="async">
            </button>
          `).join('')}
        </div>
      </div>` : '';

    root.innerHTML = `
      <!-- CINEMATIC HERO -->
      <section class="gdh">
        <div class="gdh-bg">
          <img class="gdh-img"
            src="${escapeHtml(heroImg)}"
            alt="${escapeHtml(title)}"
            loading="eager" decoding="async"
            onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='${defaultFallback}';}">
          <div class="gdh-overlay"></div>
        </div>
        <div class="gdh-container">
          <div class="gdh-layout">
            <div class="gdh-text-col">
              <div class="gdh-eyebrow">
                <span class="gdh-eyebrow-dot"></span>
                <span>${state.lang==='az'?'Aurex Studio təqdim edir':'Aurex Studio presents'}</span>
              </div>
              <h1 class="gdh-title">${escapeHtml(title)}</h1>
              ${subtitle ? `<p class="gdh-subtitle">${escapeHtml(subtitle)}</p>` : ''}
              ${heroDesc ? `<p class="gdh-desc">${escapeHtml(heroDesc)}</p>` : ''}
              ${chipsHtml}
              ${actionsHtml}
            </div>
            ${thumbsHtml}
          </div>
        </div>
      </section>

      <div class="container">
        <!-- INFO BAR -->
        ${(devs.length || pubs.length || platformStr || genreStr || releaseDate) ? `
        <div class="game-info-bar">
          ${devs.length ? `<div class="game-info-cell"><small>${state.lang==='az'?'Tərtibatçı':'Developer'}</small><strong>${escapeHtml(devs.join(', '))}</strong></div>` : ''}
          ${pubs.length ? `<div class="game-info-cell"><small>${state.lang==='az'?'Naşir':'Publisher'}</small><strong>${escapeHtml(pubs.join(', '))}</strong></div>` : ''}
          ${platformStr ? `<div class="game-info-cell"><small>${state.lang==='az'?'Platforma':'Platform'}</small><strong>${escapeHtml(platformStr)}</strong></div>` : ''}
          ${genreStr ? `<div class="game-info-cell"><small>${state.lang==='az'?'Janr':'Genre'}</small><strong>${escapeHtml(genreStr)}</strong></div>` : ''}
          ${releaseDate ? `<div class="game-info-cell"><small>${state.lang==='az'?'Çıxış tarixi':'Release date'}</small><strong>${escapeHtml(formatDate(releaseDate) || releaseDate)}</strong></div>` : ''}
        </div>` : ''}

        <!-- ABOUT -->
        ${longDesc ? `
        <section class="section compact">
          <div class="game-about-section">
            <span class="eyebrow">${state.lang==='az'?'OYUN HAQQINDA':'ABOUT THE GAME'}</span>
            <h2 class="section-title" style="margin-top:10px">${state.lang==='az'?'Oyun haqqında':'About the game'}</h2>
            <div class="game-about-body">${escapeHtml(longDesc)}</div>
          </div>
        </section>` : ''}

        <!-- SCREENSHOT GALLERY -->
        ${galleryUrls.length ? `
        <section class="section compact">
          <div class="section-head">
            <div>
              <span class="eyebrow">SCREENSHOTS</span>
              <h2 class="section-title" style="margin-top:10px">${state.lang==='az'?'Oyundan görüntülər':'In-game screenshots'}</h2>
            </div>
          </div>
          <div class="game-gallery-grid" id="gameGallery">
            ${galleryUrls.map((url, i) => `
              <div class="game-gallery-item" data-gallery-idx="${i}" role="button" tabindex="0" aria-label="${state.lang==='az'?'Screenshot':'Screenshot'} ${i+1}">
                <img src="${escapeHtml(url)}" alt="${escapeHtml(title)} screenshot ${i+1}" loading="${i<4?'eager':'lazy'}" decoding="async" class="img-fade" onload="this.classList.add('loaded')">
              </div>`).join('')}
          </div>
        </section>` : ''}

        <!-- TRAILER -->
        ${trailerUrl ? `
        <section class="section compact">
          <span class="eyebrow">TRAILER</span>
          <h2 class="section-title" style="margin-top:10px;margin-bottom:18px">${state.lang==='az'?'Treyler':'Game trailer'}</h2>
          <div class="game-trailer-wrap" id="gameTrailerWrap">
            ${trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be')
              ? `<iframe src="${escapeHtml(trailerUrl.replace('watch?v=','embed/').replace('youtu.be/','www.youtube.com/embed/'))}" allowfullscreen title="${escapeHtml(title)} trailer"></iframe>`
              : `<video src="${escapeHtml(trailerUrl)}" controls preload="metadata" poster="${escapeHtml(coverImg)}"></video>`}
          </div>
        </section>` : ''}

        <!-- MORE GAMES -->
        ${otherGames.length ? `
        <section class="section compact">
          <div class="section-head">
            <div>
              <span class="eyebrow">AUREX GAMES</span>
              <h2 class="section-title" style="margin-top:10px">${state.lang==='az'?'Digər oyunlarımız':'More games'}</h2>
            </div>
            <a class="btn btn-soft" href="games.html">${state.lang==='az'?'Hamısına bax':'View all'}</a>
          </div>
          <div class="more-games-grid">
            ${otherGames.map(x => gameCard(x)).join('')}
          </div>
        </section>` : ''}
      </div>`;

    // Hero trailer button scroll
    const trailerBtn = $('#heroTrailerBtn');
    if (trailerBtn) {
      trailerBtn.addEventListener('click', () => {
        const trailerSection = $('#gameTrailerWrap') || $('.game-trailer-wrap');
        if (trailerSection) {
          trailerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const video = trailerSection.querySelector('video');
          if (video) video.play().catch(() => {});
        }
      });
    }

    // Hero screenshot thumbnail switcher (uses full-resolution path_full for large background)
    const heroThumbBtns = $$('[data-hero-full]');
    if (heroThumbBtns.length) {
      heroThumbBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const heroImgEl = $('.gdh-img');
          const fullSrc = btn.dataset.heroFull;
          if (heroImgEl && fullSrc) heroImgEl.src = fullSrc;
          heroThumbBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    }

    // Gallery lightbox
    if (galleryUrls.length) bindLightbox(galleryUrls);
  }

  // Lightbox
  function bindLightbox(urls){
    let cur = 0;
    const backdrop = $('#lightboxBackdrop');
    const img = $('#lightboxImg');
    const counter = $('#lightboxCounter');
    if (!backdrop || !img) return;

    function open(idx){
      cur = Math.max(0, Math.min(idx, urls.length - 1));
      img.src = urls[cur];
      if (counter) counter.textContent = `${cur + 1} / ${urls.length}`;
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close(){
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
      img.src = '';
    }
    function prev(){ open((cur - 1 + urls.length) % urls.length); }
    function next(){ open((cur + 1) % urls.length); }

    $$('[data-gallery-idx]').forEach(el => {
      el.addEventListener('click', () => open(+el.dataset.galleryIdx));
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(+el.dataset.galleryIdx); });
    });
    backdrop.addEventListener('click', e => { if (e.target === backdrop || e.target === e.currentTarget) close(); });
    $('#lightboxClose')?.addEventListener('click', close);
    $('#lightboxPrev')?.addEventListener('click', prev);
    $('#lightboxNext')?.addEventListener('click', next);
    document.addEventListener('keydown', function lb(e){
      if (!backdrop.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  }

  function renderAbout(){
    const root=$('[data-about]'); if(!root)return;
    const p=state.content.pages?.about||{};
    root.innerHTML=`<section class="page-hero"><div class="container"><span class="eyebrow">${escapeHtml(tr(p.eyebrow)||'AUREX STUDIO')}</span><h1>${highlightLastWord(tr(p.title)||(state.lang==='az'?'Dünyaları oyunla qururuq.':'Worlds built through play.'))}</h1><p>${escapeHtml(tr(p.text)||'')}</p></div></section><section class="section"><div class="container content-grid"><article class="content-card reveal"><span class="eyebrow">${state.lang==='az'?'BİZ KİMİK?':'WHO WE ARE'}</span><h2>${escapeHtml(tr(p.heading)||(state.lang==='az'?'Aurex Studio haqqında':'About Aurex Studio'))}</h2><p>${escapeHtml(tr(p.body1)||'')}</p><p>${escapeHtml(tr(p.body2)||'')}</p></article><div class="value-grid"><article class="value-card reveal"><div class="icon-bubble">${icons.spark}</div><h3>${state.lang==='az'?'Yaradıcı yanaşma':'Creative direction'}</h3><p>${state.lang==='az'?'Hər layihənin öz vizual və emosional dili.':'A distinct visual and emotional language for every project.'}</p></article><article class="value-card reveal"><div class="icon-bubble">${icons.game}</div><h3>Gameplay</h3><p>${state.lang==='az'?'Atmosferi dəstəkləyən aydın və məqsədli mexanikalar.':'Clear, purposeful mechanics that support the atmosphere.'}</p></article><article class="value-card reveal"><div class="icon-bubble">${icons.people}</div><h3>${state.lang==='az'?'Kiçik komanda':'Small team'}</h3><p>${state.lang==='az'?'Daha birbaşa qərarlar və daha yaxın yaradıcı əməkdaşlıq.':'More direct decisions and closer creative collaboration.'}</p></article><article class="value-card reveal"><div class="icon-bubble">${icons.globe}</div><h3>${state.lang==='az'?'Gələcəyə açıq':'Built to grow'}</h3><p>${state.lang==='az'?'Aurex bir janra və ya bir oyuna bağlı deyil.':'Aurex is not tied to a single game or genre.'}</p></article></div></div></section>`;
  }

  function renderTeam(){
    const root=$('[data-team]'); if(!root)return; const team=(state.content.team||[]).filter(x=>x.published); const p=state.content.pages?.team||{};
    root.innerHTML=`<section class="page-hero"><div class="container"><span class="eyebrow">${escapeHtml(tr(p.eyebrow)||'TEAM')}</span><h1>${highlightLastWord(tr(p.title)||(state.lang==='az'?'Arxasında insanlar var.':'The people behind Aurex.'))}</h1><p>${escapeHtml(tr(p.text)||'')}</p></div></section><section class="section"><div class="container">${team.length?`<div class="team-grid">${team.map(m=>`<article class="team-card reveal"><div class="team-photo">${m.photo?`<img src="${escapeHtml(m.photo)}" alt="">`:'✦'}</div><div class="team-body"><h3>${escapeHtml(m.name||'')}</h3><p>${escapeHtml(tr(m.role)||'')}</p></div></article>`).join('')}</div>`:`<div class="empty-state"><h3>${state.lang==='az'?'Komanda profilləri hazırlanır':'Team profiles are being prepared'}</h3><p>${state.lang==='az'?'Komanda profilləri tamamlandıqca burada paylaşılacaq.':'Team profiles will be shared here as they are completed.'}</p></div>`}</div></section>`;
  }

  function renderNews(){
    const root=$('[data-news]'); if(!root)return; const news=(state.content.news||[]).filter(x=>x.published); const p=state.content.pages?.news||{};
    root.innerHTML=`<section class="page-hero"><div class="container"><span class="eyebrow">${escapeHtml(tr(p.eyebrow)||'AUREX JOURNAL')}</span><h1>${highlightLastWord(tr(p.title)||(state.lang==='az'?'Studio xəbərləri':'Studio news'))}</h1><p>${escapeHtml(tr(p.text)||'')}</p></div></section><section class="section"><div class="container">${news.length?`<div class="news-grid">${news.map(newsCard).join('')}</div>`:`<div class="empty-state"><h3>${state.lang==='az'?'Hələ xəbər yoxdur':'No news yet'}</h3></div>`}</div></section>`;
  }

  function renderCareers(){
    const root=$('[data-careers]'); if(!root)return; const jobs=(state.content.careers||[]).filter(x=>x.published); const p=state.content.pages?.careers||{};
    root.innerHTML=`<section class="page-hero"><div class="container"><span class="eyebrow">${escapeHtml(tr(p.eyebrow)||'CAREERS')}</span><h1>${highlightLastWord(tr(p.title)||(state.lang==='az'?'Aurex-ə qoşul.':'Join Aurex.'))}</h1><p>${escapeHtml(tr(p.text)||'')}</p></div></section><section class="section"><div class="container">${jobs.length?jobs.map(j=>`<article class="content-card reveal"><h2>${escapeHtml(tr(j.title)||j.title)}</h2><p>${escapeHtml(tr(j.description)||j.description)}</p></article>`).join(''):`<div class="empty-state"><h3>${state.lang==='az'?'Hazırda açıq vakansiya yoxdur':'No open positions right now'}</h3><p>${state.lang==='az'?'Yeni rol açıldıqda burada görünəcək.':'New roles will appear here when available.'}</p><a class="btn btn-soft" href="contact.html">${state.lang==='az'?'Əlaqə saxla':'Contact us'}</a></div>`}</div></section>`;
  }

  function renderMedia(){
    const root=$('[data-media]'); if(!root)return; const media=(state.content.media||[]).filter(x=>x.published); const p=state.content.pages?.media||{};
    root.innerHTML=`<section class="page-hero"><div class="container"><span class="eyebrow">${escapeHtml(tr(p.eyebrow)||'PRESS & MEDIA')}</span><h1>${highlightLastWord(tr(p.title)||'Media kit')}</h1><p>${escapeHtml(tr(p.text)||'')}</p></div></section><section class="section"><div class="container cards-3">${media.map(m=>`<article class="content-card reveal"><h3>${escapeHtml(tr(m.title))}</h3><p>${escapeHtml(m.type||'')}</p><a class="btn btn-soft" href="${escapeHtml(m.file)}" download>${state.lang==='az'?'Faylı aç':'Open file'}</a></article>`).join('')}</div></section>`;
  }

  function renderContact(){
    const root=$('[data-contact]'); if(!root)return; const p=state.content.pages?.contact||{};
    root.innerHTML=`<section class="page-hero"><div class="container"><span class="eyebrow">${escapeHtml(tr(p.eyebrow)||'CONTACT')}</span><h1>${highlightLastWord(tr(p.title)||(state.lang==='az'?'Bizimlə əlaqə':'Talk to Aurex'))}</h1><p>${escapeHtml(tr(p.text)||'')}</p></div></section><section class="section"><div class="container content-grid"><div class="content-card reveal"><h2>${state.lang==='az'?'Əlaqə məlumatı':'Contact details'}</h2><p>${state.lang==='az'?'E-poçt':'Email'}: <strong>${escapeHtml(state.content.site?.email||'hello@aurexstudio.com')}</strong></p><p>${state.lang==='az'?'Məkan':'Location'}: <strong>${escapeHtml(tr(state.content.site?.location)||'Azerbaijan')}</strong></p><div class="social-row">${(state.content.socials||[]).filter(s=>s.published).map(s=>socialButton(s)).join('')}</div></div><form class="form-card reveal" id="contactForm"><div class="form-grid"><div class="field"><label>${state.lang==='az'?'Ad':'Name'}</label><input name="name" required></div><div class="field"><label>Email</label><input type="email" name="email" required></div><div class="field full"><label>${state.lang==='az'?'Mövzu':'Subject'}</label><select name="subject"><option>${state.lang==='az'?'Ümumi sual':'General enquiry'}</option><option>Press / Media</option><option>Business / Partnership</option><option>Support</option></select></div><div class="field full"><label>${state.lang==='az'?'Mesaj':'Message'}</label><textarea name="message" required></textarea></div><div class="field full"><button class="btn btn-primary" type="submit">${state.lang==='az'?'Mesajı göndər':'Send message'}</button></div></div></form></div></section>`;
    $('#contactForm')?.addEventListener('submit',async e=>{e.preventDefault(); const btn=e.currentTarget.querySelector('button'); const old=btn.textContent; btn.disabled=true; btn.textContent=state.lang==='az'?'Göndərilir...':'Sending...'; try{const body=Object.fromEntries(new FormData(e.currentTarget)); const r=await fetch('/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}); if(!r.ok)throw 0; e.currentTarget.reset(); alert(state.lang==='az'?'Mesaj göndərildi.':'Message sent.')}catch{alert(state.lang==='az'?'Mesaj göndərilmədi. Deploy zamanı Neon və API ayarlarını yoxlayın.':'Message could not be sent. Check Neon/API settings after deployment.')} finally{btn.disabled=false;btn.textContent=old}})
  }


  function renderCommunity(){
    const root=$('[data-community]'); if(!root)return; const p=state.content.pages?.community||{}; const socials=(state.content.socials||[]).filter(x=>x.published);
    root.innerHTML=`<section class="page-hero"><div class="container"><span class="eyebrow">${escapeHtml(tr(p.eyebrow)||'COMMUNITY')}</span><h1>${highlightLastWord(tr(p.title)||(state.lang==='az'?'Aurex-i öz platformanda izlə.':'Follow Aurex your way.'))}</h1><p>${escapeHtml(tr(p.text)||'')}</p></div></section><section class="section"><div class="container"><div class="cards-3">${socials.map(s=>{
      const pid = String(s.id || '').toLowerCase().trim();
      return `<a class="content-card social-card reveal" data-platform="${escapeHtml(pid)}" href="${escapeHtml(s.url||'#')}" ${String(s.url||'').startsWith('http')?'target="_blank" rel="noopener"':''}><div class="icon-bubble social-bubble" data-platform="${escapeHtml(pid)}">${icons[pid]||icons[s.id]||icons.globe}</div><h3 style="margin:18px 0 7px">${escapeHtml(s.name)}</h3><p>${state.lang==='az'?'Aurex Studio-nu bu platformada izlə.':'Follow Aurex Studio on this platform.'}</p></a>`;
    }).join('')}</div></div></section>`;
  }

  function renderSupport(){
    const root=$('[data-support]'); if(!root)return; const p=state.content.pages?.support||{}; const games=(state.content.games||[]).filter(x=>x.published);
    root.innerHTML=`<section class="page-hero"><div class="container"><span class="eyebrow">${escapeHtml(tr(p.eyebrow)||'SUPPORT')}</span><h1>${highlightLastWord(tr(p.title)||(state.lang==='az'?'Oyunda problem var?':'Need help with a game?'))}</h1><p>${escapeHtml(tr(p.text)||'')}</p></div></section><section class="section"><div class="container content-grid"><article class="content-card reveal"><h2>${state.lang==='az'?'Dəstək üçün nə göndərmək lazımdır?':'What to include'}</h2><p>${state.lang==='az'?'Problemi mümkün qədər dəqiq təsvir edin. Oyun adı, problemin baş verdiyi hissə, sistem məlumatı və varsa ekran görüntüsü əlavə etmək cavabı sürətləndirir.':'Describe the issue as clearly as possible. Include the game, where the issue occurred, your system information and a screenshot if available.'}</p><p>${state.lang==='az'?'Birbaşa əlaqə:':'Direct contact:'} <strong>${escapeHtml(state.content.site?.email||'hello@aurexstudio.com')}</strong></p></article><form class="form-card reveal" id="supportForm"><div class="form-grid"><div class="field"><label>${state.lang==='az'?'Ad':'Name'}</label><input name="name" required></div><div class="field"><label>Email</label><input type="email" name="email" required></div><div class="field full"><label>${state.lang==='az'?'Oyun':'Game'}</label><select name="game">${games.map(g=>`<option>${escapeHtml(g.title)}</option>`).join('')}<option>${state.lang==='az'?'Digər':'Other'}</option></select></div><div class="field full"><label>${state.lang==='az'?'Problemin təsviri':'Issue description'}</label><textarea name="message" required></textarea></div><div class="field full"><button class="btn btn-primary" type="submit">${state.lang==='az'?'Dəstək sorğusu göndər':'Send support request'}</button></div></div></form></div></section>`;
    $('#supportForm')?.addEventListener('submit',async e=>{e.preventDefault(); const fd=new FormData(e.currentTarget); const body={name:fd.get('name'),email:fd.get('email'),subject:`Support · ${fd.get('game')}`,message:fd.get('message')}; const btn=e.currentTarget.querySelector('button'); const old=btn.textContent;btn.disabled=true;btn.textContent=state.lang==='az'?'Göndərilir...':'Sending...';try{const r=await fetch('/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw 0;e.currentTarget.reset();alert(state.lang==='az'?'Sorğu göndərildi.':'Request sent.')}catch{alert(state.lang==='az'?'Sorğu göndərilmədi.':'Request could not be sent.')}finally{btn.disabled=false;btn.textContent=old}})
  }

  function renderSimpleLegal(type){
    const root=$(`[data-${type}]`); if(!root)return; const isPrivacy=type==='privacy'; const title=isPrivacy?(state.lang==='az'?'Məxfilik siyasəti':'Privacy policy'):(state.lang==='az'?'İstifadə şərtləri':'Terms of use');
    root.innerHTML=`<section class="page-hero"><div class="container"><span class="eyebrow">AUREX STUDIO</span><h1>${escapeHtml(title)}</h1></div></section><section class="section"><div class="container"><article class="content-card"><p>${state.lang==='az'?'Bu səhifə hüquqi mətn üçün ayrılıb. Sayt yayımlanmadan əvvəl şirkətin rəsmi hüquqi məlumatları ilə tamamlanmalıdır.':'This page is reserved for legal text and should be completed with the studio’s official legal information before launch.'}</p></article></div></section>`;
  }

  function animateReveal(){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1}); $$('.reveal').forEach(x=>io.observe(x));
  }

  function renderNewsletter(){
    const root=$('[data-newsletter]'); if(!root)return;
    const az=state.lang==='az';
    root.innerHTML=`<section class="newsletter-section"><div class="container">
      <div class="newsletter-card reveal">
        <div class="newsletter-copy">
          <span class="eyebrow">NEWSLETTER</span>
          <h2>${az?'Yeniliklərdən xəbərdar olun':'Stay updated'}</h2>
          <p>${az?'Aurex Studio oyunları, yenilikləri və yeni layihələri haqqında xəbərləri e-poçtunuza alın.':'Get news about Aurex Studio games, updates and new projects delivered to your inbox.'}</p>
        </div>
        <div class="newsletter-form-wrap">
          <form class="newsletter-form" id="newsletterForm" novalidate>
            <input type="email" id="newsletterEmail" placeholder="${az?'E-poçt ünvanınız':'Your email address'}" autocomplete="email" required>
            <button type="submit" class="btn-subscribe" id="newsletterBtn">
              <span class="nl-label">${az?'Abunə ol':'Subscribe'}</span>
              <span class="nl-spinner"></span>
            </button>
          </form>
          <div class="newsletter-msg" id="newsletterMsg" role="alert" aria-live="polite"></div>
        </div>
      </div>
    </div></section>`;

    $('#newsletterForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const emailEl = $('#newsletterEmail');
      const btn = $('#newsletterBtn');
      const msg = $('#newsletterMsg');
      const email = emailEl?.value?.trim() || '';

      // Client-side validation
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        msg.className='newsletter-msg error show';
        msg.textContent=state.lang==='az'?'Düzgün e-poçt ünvanı daxil edin.':'Please enter a valid email address.';
        emailEl?.focus(); return;
      }

      // Loading state
      btn.disabled=true; btn.classList.add('loading');
      emailEl.disabled=true;
      msg.className='newsletter-msg'; msg.textContent='';

      try{
        const r=await fetch('/api/subscribe',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({email})
        });
        const data=await r.json().catch(()=>({}));

        if(r.ok){
          msg.className='newsletter-msg success show';
          msg.textContent=data.message||(state.lang==='az'?'Abunəliyiniz qeydə alındı.':'You have been subscribed.');
          emailEl.value='';
        } else if(r.status===409){
          msg.className='newsletter-msg duplicate show';
          msg.textContent=data.message||(state.lang==='az'?'Bu e-poçt artıq abunədir.':'This email is already subscribed.');
        } else if(r.status===400){
          msg.className='newsletter-msg error show';
          msg.textContent=data.message||(state.lang==='az'?'Düzgün e-poçt ünvanı daxil edin.':'Please enter a valid email address.');
        } else {
          throw new Error(data.message||'error');
        }
      }catch{
        msg.className='newsletter-msg error show';
        msg.textContent=state.lang==='az'?'Xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.':'An error occurred. Please try again later.';
      }finally{
        btn.disabled=false; btn.classList.remove('loading');
        emailEl.disabled=false;
      }
    });
  }

  function renderAll(){
    renderHeader(); renderFooter();
    renderHome(); renderGames(); renderGame(); renderAbout(); renderTeam(); renderNews(); renderCareers(); renderMedia(); renderContact(); renderCommunity(); renderSupport(); renderSimpleLegal('privacy'); renderSimpleLegal('terms');
    renderNewsletter();
    animateReveal();
  }

  loadContent().then(renderAll);
})();
