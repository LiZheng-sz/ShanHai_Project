// ================= 交互与应用主逻辑 =================

// 1. 初始化入口
window.addEventListener('load', () => {
    // 模拟加载动画
    setTimeout(() => {
        const gate = document.getElementById('intro-gate');
        gate.style.opacity = '0';
        setTimeout(() => {
            gate.style.display = 'none';
            initParticles();
            initHoverEffects(); 
        }, 800);
    }, 1000);
    
    // 渲染各板块
    renderHome();
    renderDex();
    renderCraft();
    initBreed();
    
    // 调用 map.js 中的初始化函数
    initMap(); 
});

// 2. 视图切换系统
function switchView(viewId, btn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    const activeSection = document.querySelector('.view-section.active');
    if(activeSection) {
        activeSection.style.opacity = '0';
        activeSection.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            activeSection.classList.remove('active');
            activeSection.style.opacity = '';
            activeSection.style.transform = '';
            const nextSection = document.getElementById(viewId);
            nextSection.classList.add('active');
            // 如果切到地图页，刷新Leaflet布局以防变形
            if(viewId === 'map' && map) setTimeout(() => map.invalidateSize(), 200);
        }, 300);
    } else {
        document.getElementById(viewId).classList.add('active');
    }
}

// 3. 渲染函数
function renderHome() {
    const newsBox = document.getElementById('news-container');
    let newsHtml = '';
    newsData.forEach(n => {
        const color = n.type === 'update' ? '#d4af37' : (n.type === 'event' ? '#ff6b6b' : '#999');
        newsHtml += `
            <div class="news-item" style="display:flex; gap:10px; margin-bottom:10px; cursor:pointer;" data-hover>
                <span style="background:${color}; color:#fff; padding:2px 6px; border-radius:4px; font-size:11px;">${n.label}</span>
                <span style="font-size:14px; color:#555;">${n.title}</span>
            </div>`;
    });
    newsBox.innerHTML = newsHtml;

    const guideBox = document.getElementById('guide-container');
    let guideHtml = '';
    guideData.forEach(g => {
        guideHtml += `
            <div class="guide-card" data-hover>
                <div style="font-size:24px; color:var(--accent);"><i class="fa-solid fa-${g.icon}"></i></div>
                <div><h4 style="margin:0 0 5px 0;">${g.title}</h4><p style="margin:0; font-size:12px; color:#888;">${g.desc}</p></div>
            </div>`;
    });
    guideBox.innerHTML = guideHtml;
    document.getElementById('stat-count').innerText = spirits.length;
    setTimeout(initHoverEffects, 100);
}

function renderDex() {
    const container = document.getElementById('dex-grid');
    const search = document.getElementById('dexSearch').value.toLowerCase();
    const filter = document.getElementById('dexFilter').value;
    container.innerHTML = '';
    let delay = 0;
    const elMap = { '金':'el-metal','木':'el-wood','水':'el-water','火':'el-fire','土':'el-earth','无':'el-none','妖':'el-metal','龙':'el-water' };

    spirits.forEach(s => {
        if (filter !== 'all' && !s.el.includes(filter)) return;
        if (search && !JSON.stringify(s).toLowerCase().includes(search)) return;
        const elClass = elMap[s.el] || 'el-none';
        const card = document.createElement('div');
        card.className = 'spirit-card';
        card.style.animation = `fadeSlideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards ${delay}s`;
        card.style.opacity = '0';
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-badge ${elClass}">${s.el}</div>
                <div class="card-img-placeholder"><i class="fa-solid fa-dragon"></i></div>
                <div class="card-content">
                    <div class="card-title">${s.name} <span class="card-id">NO.${s.id}</span></div>
                    <div class="card-desc">${s.desc}</div>
                    <div class="tag-group">${s.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
                </div>
            </div>`;
        container.appendChild(card);
        initTilt(card);
        delay += 0.05;
    });
    initHoverEffects();
}

function renderCraft() {
    const container = document.getElementById('recipe-list');
    const search = document.getElementById('craftSearch').value.toLowerCase();
    container.innerHTML = '';
    let delay = 0;
    recipes.forEach(r => {
        if (search && !JSON.stringify(r).toLowerCase().includes(search)) return;
        const item = document.createElement('div');
        item.className = 'recipe-card';
        item.setAttribute('data-hover', '');
        item.style.animationDelay = `${delay}s`;
        item.innerHTML = `
            <div style="font-size:28px; color:var(--accent); margin-right:25px;"><i class="fa-solid fa-scroll"></i></div>
            <div style="flex:1;">
                <div style="font-size:18px; font-weight:bold; color:#333;">${r.name}</div>
                <div style="font-size:13px; color:#888; margin-top:4px;">${r.type} | <i class="fa-solid fa-lock-open"></i> Lv.${r.lv}</div>
            </div>
            <div style="font-size:12px; color:#666; background:#f4f4f4; padding:8px 12px; border-radius:8px;">${r.mat}</div>`;
        container.appendChild(item);
        delay += 0.05;
    });
    initHoverEffects();
}

function initBreed() {
    const p1 = document.getElementById('p1');
    const p2 = document.getElementById('p2');
    spirits.forEach(s => {
        const opt = `<option value="${s.id}">${s.name}</option>`;
        p1.innerHTML += opt;
        p2.innerHTML += opt;
    });
}

function checkBreed() {
    const p1 = document.getElementById('p1').value;
    const p2 = document.getElementById('p2').value;
    if(p1 !== '选择父本' && p2 !== '选择母本') {
        document.getElementById('result-name').innerText = "推演中...";
        document.getElementById('result-egg').classList.add('active');
        setTimeout(() => {
            document.getElementById('result-name').innerText = "未知灵兽 (需实地探索)"; 
            document.getElementById('result-egg').classList.remove('active');
        }, 1500);
    }
}

// 4. 特效逻辑 (光标、3D卡片、粒子)
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');

window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;
    if(cursorDot) {
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;
    }
    if(cursorOutline) {
        cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 500, fill: "forwards" });
    }
});

function initHoverEffects() {
    const hoverables = document.querySelectorAll('button, a, input, select, .spirit-card, .recipe-card, .nav-btn, .layer-toggle, .upload-area, .modal-close, [data-hover]');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });
}

document.addEventListener('mousedown', function(e) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    const size = 100;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - size/2}px`;
    ripple.style.top = `${e.clientY - size/2}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
});

function initTilt(card) {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10; 
        const rotateY = ((x - centerX) / centerX) * 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
    });
}

function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = Array.from({length: 60}, () => ({
        x: Math.random()*canvas.width, y: Math.random()*canvas.height,
        r: Math.random()*2, d: Math.random()*0.5 + 0.2, alpha: Math.random()
    }));
    function draw(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particles.forEach(p => {
            ctx.beginPath(); ctx.fillStyle = `rgba(212,175,55,${p.alpha})`;
            ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
            p.y -= p.d; p.alpha -= 0.002;
            if(p.y < 0 || p.alpha <= 0) { p.y = canvas.height; p.alpha = 1; p.x = Math.random()*canvas.width; }
        });
        requestAnimationFrame(draw);
    }
    draw();
}