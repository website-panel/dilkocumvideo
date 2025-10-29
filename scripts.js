// scripts.js – DİLKOÇUM

/* ---------------------------------------------------------
   0) UTIL: Tema (Dark/Light) – LocalStorage ile kalıcı
--------------------------------------------------------- */
(function initTheme(){
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  if (!btn) return; 

  function updateIcon(theme) {
    btn.textContent = (theme === "dark") ? "☀️" : "🌙";
  }

  function toggleTheme(){
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("dilkocum-theme", next);
    updateIcon(next);
  }

  function bindToggle(){
    const saved = localStorage.getItem("dilkocum-theme") || "dark";
    root.setAttribute("data-theme", saved);
    updateIcon(saved); 
    btn.addEventListener("click", toggleTheme);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bindToggle);
  } else {
    bindToggle();
  }
})();

/* ---------------------------------------------------------
   1) SCROLL REVEAL – IntersectionObserver
--------------------------------------------------------- */
(function initReveal(){
  function run(){
    const els = document.querySelectorAll(".reveal");
    if (els.length === 0) return;

    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e => {
        if(e.isIntersecting){
          e.target.classList.add("show");
          io.unobserve(e.target);
        }
      });
    }, { root: null, threshold: 0.08 });

    els.forEach(el => io.observe(el));
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", run);
  } else { run(); }
})();

/* ---------------------------------------------------------
   2) ANA SAYFA – Video Kartları
--------------------------------------------------------- */
function createVideoCards() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;

  if (typeof videoListesi === 'undefined' || videoListesi.length === 0) {
    console.error("HATA: 'videoListesi' bulunamadı veya 'videos.js' yüklenemedi.");
    grid.innerHTML = "<p style='color: var(--text-2);'>Dersler yüklenemedi. 'videos.js' dosyasını ve içindeki listeyi kontrol edin.</p>";
    return;
  }

  grid.innerHTML = ""; 

  videoListesi.forEach((video, idx) => {
    const card = document.createElement('a');
    card.href = `player.html?id=${video.id}`;
    card.className = 'video-card reveal';
    card.style.transitionDelay = `${Math.min(idx * 0.03, 0.25)}s`;

    card.innerHTML = `
      <div class="thumbnail-container">
        <img src="${video.thumbnail}" alt="${video.title}">
      </div>
      <div class="video-card-content">
        <h3>${video.title}</h3>
        <p>${video.description}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ---------------------------------------------------------
   3) OYNATICI – Yükleme & Kalite Seçimi & İlerleme Çubuğu
--------------------------------------------------------- */
function loadPlayer() {
  const playerContainer = document.getElementById('video-player-container');
  if (!playerContainer) return;

  if (typeof videoListesi === 'undefined') {
    console.error("HATA: 'videoListesi' bulunamadı veya 'videos.js' yüklenemedi.");
    playerContainer.innerHTML = "<h2>Ders listesi yüklenemedi!</h2>";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const videoId = parseInt(params.get('id'), 10);

  if (!videoId) {
    playerContainer.innerHTML = "<h2>Video bulunamadı!</h2>";
    return;
  }

  const video = videoListesi.find(v => v.id === videoId);
  if (!video) {
    playerContainer.innerHTML = "<h2>Geçersiz video ID!</h2>";
    return;
  }

  const titleEl = document.getElementById('video-title');
  const descEl  = document.getElementById('video-description');
  const videoEl = document.getElementById('video-player');
  const qSel    = document.getElementById('quality-selector');
  const pBar    = document.getElementById('progressBar');
  
  // YENİ EKLENDİ (Dışarı tıklama için)
  const mainEl  = document.getElementById('player-page-main');

  if (!titleEl || !descEl || !videoEl || !qSel || !pBar || !mainEl) {
    console.error("Oynatıcı HTML elementlerinden biri eksik!");
    return;
  }

  // Başlık & açıklama
  titleEl.textContent = video.title;
  descEl.textContent  = video.description;

  // Kalite butonları
  qSel.innerHTML = '';
  const qualities = Object.keys(video.videoFiles);
  let defaultQ = qualities.includes('720p') ? '720p' : qualities[0];
  let currentActiveBtn = null;

  qualities.forEach((q) => {
    const btn = document.createElement('button');
    btn.className = 'quality-btn';
    btn.textContent = q;

    if (q === defaultQ) {
      btn.classList.add('active');
      currentActiveBtn = btn;
    }

    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;
      if (currentActiveBtn) currentActiveBtn.classList.remove('active');
      btn.classList.add('active'); currentActiveBtn = btn;

      changeVideoQuality(video.videoFiles[q], videoEl);
    });

    qSel.appendChild(btn);
  });

  // Varsayılan kaynağı yükle
  videoEl.src = video.videoFiles[defaultQ];
  videoEl.load();

  // İlerleme çubuğu
  function updateProgress(){
    if(!videoEl.duration || isNaN(videoEl.duration)) return;
    const pct = (videoEl.currentTime / videoEl.duration) * 100;
    if(pBar) pBar.style.width = `${pct}%`;
  }
  videoEl.addEventListener('timeupdate', updateProgress);
  videoEl.addEventListener('loadedmetadata', updateProgress);

  // --- YENİ EKLENEN ÖZELLİK ---
  // Video oynatıcının dışındaki boşluğa (arka plana) tıklanırsa ana sayfaya dön
  mainEl.addEventListener('click', (e) => {
    // Sadece <main> elementinin kendisine (yani arka plana) tıklandığında çalışır.
    // Video oynatıcı, başlık, kalite butonları vb. tıklanırsa çalışmaz.
    if (e.target.id === 'player-page-main') {
      location.href = 'index.html';
    }
  });
}

// Yardımcı: Kalite değiştirme (zamanı koru)
function changeVideoQuality(newSrc, videoElement) {
  const t = videoElement.currentTime;
  const wasPlaying = !videoElement.paused;

  videoElement.src = newSrc;
  videoElement.addEventListener('loadedmetadata', () => {
    videoElement.currentTime = Math.min(t, videoElement.duration || t);
    if (wasPlaying) videoElement.play().catch(()=>{});
  }, { once: true });
}

/* ---------------------------------------------------------
   4) BOOTSTRAP
--------------------------------------------------------- */
(function boot(){
  function run(){
    if (document.getElementById('video-grid')) createVideoCards();
    if (document.getElementById('video-player-container')) loadPlayer();
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", run);
  } else { run(); }
})();