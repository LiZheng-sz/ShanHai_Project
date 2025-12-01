// ================= 交互与应用主逻辑 =================

// 全局变量
let currentDexData = []; 

// 1. 初始化入口
window.addEventListener('load', () => {
    // 模拟开场加载动画
    setTimeout(() => {
        const gate = document.getElementById('intro-gate');
        if(gate) {
            gate.style.opacity = '0';
            setTimeout(() => {
                gate.style.display = 'none';
                initParticles(); // 启动粒子特效
                initHoverEffects(); // 启动悬停特效
            }, 800);
        }
    }, 1000);
    
    // 渲染各板块
    renderHome();
    initDex();      // 新版图鉴初始化
    renderCraft();
    initBreed();
    
    // 调用 map.js 中的初始化函数 (确保 map.js 已加载)
    if(typeof initMap === 'function') {
        initMap(); 
    }
});

// 2. 视图切换系统
function switchView(viewId, btn) {
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    // 页面切换动画
    const activeSection = document.querySelector('.view-section.active');
    if(activeSection) {
        activeSection.style.opacity = '0';
        activeSection.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            activeSection.classList.remove('active');
            activeSection.style.opacity = '';
            activeSection.style.transform = '';
            
            const nextSection = document.getElementById(viewId);
            if(nextSection) {
                nextSection.classList.add('active');
                // 如果切到图鉴页，重新初始化3D特效
                if(viewId === 'dex') initDetail3D();
                // 如果切到地图页，刷新Leaflet布局以防变形
                if(viewId === 'map' && typeof map !== 'undefined' && map) {
                    setTimeout(() => map.invalidateSize(), 200);
                }
            }
        }, 300);
    } else {
        const nextSection = document.getElementById(viewId);
        if(nextSection) nextSection.classList.add('active');
    }
}

// ================= 3. 首页逻辑 (Home) =================
function renderHome() {
    // 渲染新闻列表
    const newsBox = document.getElementById('news-container');
    if(newsBox && typeof newsData !== 'undefined') {
        let newsHtml = '';
        newsData.forEach((n, index) => {
            const color = n.type === 'update' ? '#d4af37' : (n.type === 'event' ? '#ff6b6b' : '#999');
            newsHtml += `
                <a href="#" class="news-item" style="display:flex; gap:10px; margin-bottom:10px; text-decoration:none; align-items:center;" data-hover>
                    <span style="background:${color}; color:#fff; padding:2px 6px; border-radius:4px; font-size:11px; white-space:nowrap;">${n.label}</span>
                    <span style="font-size:14px; color:#555; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${n.title}</span>
                    <i class="fa-solid fa-angle-right" style="margin-left:auto; color:#ccc; font-size:12px;"></i>
                </a>`;
        });
        newsBox.innerHTML = newsHtml;
    }

    // 渲染攻略卡片
    const guideBox = document.getElementById('guide-container');
    if(guideBox && typeof guideData !== 'undefined') {
        let guideHtml = '';
        guideData.forEach((g, index) => {
            guideHtml += `
                <div class="guide-card" style="cursor:pointer;" data-hover>
                    <div style="font-size:24px; color:var(--accent); min-width:40px; text-align:center;"><i class="fa-solid fa-${g.icon}"></i></div>
                    <div>
                        <h4 style="margin:0 0 5px 0; color:var(--primary);">${g.title}</h4>
                        <p style="margin:0; font-size:12px; color:#888;">${g.desc}</p>
                    </div>
                </div>`;
        });
        guideBox.innerHTML = guideHtml;
    }
    
    // 更新统计数据
    const statCount = document.getElementById('stat-count');
    if(statCount && typeof spirits !== 'undefined') {
        statCount.innerText = spirits.length;
    }
}

// ================= 4. 新版图鉴逻辑 (Dex) - 包含手机端适配 =================

// 初始化图鉴
function initDex() {
    if (typeof spirits !== 'undefined') {
        currentDexData = spirits;
    } else {
        console.error("未找到 spirits 数据，请检查 data.js");
        currentDexData = [];
    }
    renderDexList(currentDexData);
    initDetail3D(); // 启动详情卡片3D特效
}

// 渲染左侧列表
function renderDexList(data) {
    const listContainer = document.getElementById('dex-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';

    if (data.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">未找到啾灵</div>';
        return;
    }

    data.forEach((mon, index) => {
        const item = document.createElement('div');
        item.className = 'dex-item';
        item.onclick = () => selectDexItem(mon, item);
        
        // 生成列表小图标
        const iconHtml = `<div class="dex-item-img" style="display:flex;align-items:center;justify-content:center;font-size:20px;">
             ${getElementIconSimple(mon.el)}
        </div>`;
        
        item.innerHTML = `
            ${iconHtml}
            <div class="dex-item-info">
                <div>
                    <div style="font-size:10px; color:#999;">No.${mon.id}</div>
                    <div class="dex-item-name">${mon.name}</div>
                </div>
                <div class="dex-item-type">${getElementIcon(mon.el)}</div>
            </div>
        `;
        listContainer.appendChild(item);

        // 默认选中第一个 (仅在桌面端)
        if (index === 0 && window.innerWidth > 768) {
            selectDexItem(mon, item, false); // false 表示不触发滑入动画
        }
    });
}

// 选中某一只啾灵
function selectDexItem(mon, domElement, triggerMobileAnim = true) {
    // 1. 高亮列表项
    document.querySelectorAll('.dex-item').forEach(el => el.classList.remove('active'));
    if(domElement) domElement.classList.add('active');

    // 2. 显示详情区域
    const detailContent = document.getElementById('detail-content');
    const emptyState = document.querySelector('#dex-detail-view .empty-state');
    if(detailContent) detailContent.style.display = 'grid';
    if(emptyState) emptyState.style.display = 'none';

    // 3. 填充数据
    setText('detail-id', mon.id);
    setText('detail-name', mon.name);
    setText('detail-desc', mon.desc || "暂无描述");
    
    // 职业
    const roleContainer = document.getElementById('detail-role');
    if(roleContainer) roleContainer.innerHTML = `<i class="fa-solid fa-crosshairs"></i> ${mon.job || '未知'}`;
    
    // 大立绘 (暂时用占位符，实际请换成 mon.img)
    const imgEl = document.getElementById('detail-img');
    if(imgEl) {
        // imgEl.src = `assets/spirits/${mon.id}.png`; // 真实路径
        imgEl.src = `https://via.placeholder.com/300x300/transparent/d4af37?text=${encodeURIComponent(mon.name)}`; // 演示用
    }

    // 属性图标
    const elBadge = document.getElementById('detail-element');
    if(elBadge) elBadge.innerHTML = getElementIcon(mon.el);

    // 工作适应性
    const workContainer = document.getElementById('detail-work');
    if(workContainer) {
        workContainer.innerHTML = '';
        if(mon.tags && mon.tags.length > 0) {
            mon.tags.forEach(tagStr => {
                let type = tagStr;
                let lv = 1;
                if(tagStr.includes('Lv')) {
                    const parts = tagStr.split('Lv');
                    type = parts[0];
                    lv = parts[1];
                }
                workContainer.innerHTML += `
                    <div class="work-item">
                        <i class="fa-solid fa-briefcase"></i> 
                        <span>${type} <span style="font-weight:bold;color:#2c3e50;">Lv.${lv}</span></span>
                    </div>`;
            });
        } else {
            workContainer.innerHTML = '<span style="font-size:12px;color:#999;">无工作适应性</span>';
        }
    }

    // 掉落物
    const dropContainer = document.getElementById('detail-drops');
    if(dropContainer) {
        dropContainer.innerHTML = '';
        const drops = mon.drops || ["???"]; 
        drops.forEach(d => {
            dropContainer.innerHTML += `
                <div class="drop-item" title="${d}">
                    <i class="fa-solid fa-cube" style="font-size:14px; color:#888;"></i>
                </div>`;
        });
    }

    // 4. 手机端交互：滑入详情页
    if (triggerMobileAnim) {
        const layout = document.querySelector('.dex-layout-container');
        if (layout) layout.classList.add('show-detail');
    }

    // 重置 3D 角度
    const card = document.getElementById('dex-detail-view');
    if(card) card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
}

// 手机端返回列表
function backToDexList() {
    const layout = document.querySelector('.dex-layout-container');
    if (layout) {
        layout.classList.remove('show-detail');
    }
}

// 搜索功能
function filterDex() {
    const searchInput = document.getElementById('dexSearch');
    const filterSelect = document.getElementById('dexFilter');
    
    if(!searchInput || !filterSelect) return;

    const searchText = searchInput.value.toLowerCase();
    const filterType = filterSelect.value;

    const filtered = currentDexData.filter(mon => {
        const matchName = mon.name.toLowerCase().includes(searchText);
        const matchType = filterType === 'all' || (mon.el && mon.el.includes(filterType));
        return matchName && matchType;
    });

    renderDexList(filtered);
}

// ================= 5. 工坊逻辑 (Craft) =================
function renderCraft() {
    const container = document.getElementById('recipe-list');
    if(!container || typeof recipes === 'undefined') return;

    const searchInput = document.getElementById('craftSearch');
    const search = searchInput ? searchInput.value.toLowerCase() : "";
    
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
}

// ================= 6. 配种逻辑 (Breed) =================
function initBreed() {
    const p1 = document.getElementById('p1');
    const p2 = document.getElementById('p2');
    if(!p1 || !p2 || typeof spirits === 'undefined') return;
    
    // 清空现有选项
    p1.innerHTML = '<option>选择父本</option>';
    p2.innerHTML = '<option>选择母本</option>';

    spirits.forEach(s => {
        const opt = `<option value="${s.id}">${s.name}</option>`;
        p1.innerHTML += opt;
        p2.innerHTML += opt;
    });
}

function checkBreed() {
    const p1 = document.getElementById('p1').value;
    const p2 = document.getElementById('p2').value;
    const resultName = document.getElementById('result-name');
    const resultEgg = document.getElementById('result-egg');

    if(p1 !== '选择父本' && p2 !== '选择母本') {
        if(resultName) resultName.innerText = "推演中...";
        if(resultEgg) resultEgg.classList.add('active');
        
        setTimeout(() => {
            if(resultName) resultName.innerText = "未知灵兽 (需实地探索)"; 
            if(resultEgg) resultEgg.classList.remove('active');
        }, 1500);
    }
}

// ================= 7. 视觉特效与工具函数 =================

// 获取属性图标 (优先读取 data.js 的全局配置)
function getElementIcon(type) {
    // 默认图标
    const defaultIcons = {
        '金': '<i class="fa-solid fa-bolt" style="color:#f2d027"></i>',
        '木': '<i class="fa-solid fa-leaf" style="color:#4caf50"></i>',
        '水': '<i class="fa-solid fa-droplet" style="color:#2196f3"></i>',
        '火': '<i class="fa-solid fa-fire" style="color:#f44336"></i>',
        '土': '<i class="fa-solid fa-mountain" style="color:#795548"></i>',
        '冰': '<i class="fa-regular fa-snowflake" style="color:#00bcd4"></i>',
        '龙': '<i class="fa-solid fa-dragon" style="color:#9c27b0"></i>',
        '妖': '<i class="fa-solid fa-ghost" style="color:#e91e63"></i>',
        '无': '<i class="fa-solid fa-circle" style="color:#9e9e9e"></i>',
        '默认': '<i class="fa-solid fa-question" style="color:#ccc"></i>'
    };

    // 如果 data.js 定义了 ELEMENT_ICONS，就合并使用
    const icons = (typeof ELEMENT_ICONS !== 'undefined') ? ELEMENT_ICONS : defaultIcons;

    if (!type) return icons['默认'] || defaultIcons['默认'];

    // 匹配逻辑
    for (const key in icons) {
        if (type.includes(key)) {
            return icons[key];
        }
    }
    return icons['默认'] || defaultIcons['默认'];
}

function getElementIconSimple(type) {
    return getElementIcon(type); 
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}

// 详情卡片 3D 跟随特效 (仅在桌面端)
function initDetail3D() {
    const card = document.getElementById('dex-detail-view');
    const container = document.querySelector('.dex-main-content');

    if(!card || !container) return;

    // 清除旧的事件监听 (防止重复绑定较为复杂，这里通过简单的逻辑覆盖)
    // 实际项目中推荐 removeEventListener，但这里每次切换视图可能需要重新绑
    container.onmousemove = (e) => {
        if (window.innerWidth < 768) return; // 手机端禁用

        const rect = card.getBoundingClientRect();
        // 计算鼠标相对于卡片中心的偏移
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // 旋转系数
        const rotateX = ((y - centerY) / centerY) * -5; 
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    container.onmouseleave = () => {
        card.style.transform = `perspective(1000px) rotateX(0) rotateY(0)`;
    };
}

// 粒子背景特效
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    const particles = Array.from({length: 60}, () => ({
        x: Math.random()*canvas.width, 
        y: Math.random()*canvas.height,
        r: Math.random()*1.5, 
        d: Math.random()*0.3 + 0.1, 
        alpha: Math.random()
    }));
    
    function draw(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particles.forEach(p => {
            ctx.beginPath(); 
            ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha * 0.4})`; // 金色微尘
            ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); 
            ctx.fill();
            p.y -= p.d; 
            p.alpha -= 0.003;
            if(p.y < 0 || p.alpha <= 0) { 
                p.y = canvas.height; 
                p.alpha = 1; 
                p.x = Math.random()*canvas.width; 
            }
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// 全局光标跟随
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
        // 使用 Web Animations API 实现平滑跟随
        cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 500, fill: "forwards" });
    }
});

// 悬停特效注册
function initHoverEffects() {
    const hoverables = document.querySelectorAll('button, a, input, select, .dex-item, .recipe-card, .nav-btn, .layer-toggle, [data-hover]');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });
}

// 拖拽波纹特效
let isDragging = false;
let lastRippleTime = 0;

document.addEventListener('mousedown', () => isDragging = true);
document.addEventListener('touchstart', () => isDragging = true);
document.addEventListener('mouseup', () => isDragging = false);
document.addEventListener('touchend', () => isDragging = false);

document.addEventListener('mousemove', (e) => handleDragRipple(e.clientX, e.clientY));
document.addEventListener('touchmove', (e) => {
    if(e.touches.length > 0) {
        handleDragRipple(e.touches[0].clientX, e.touches[0].clientY);
    }
});

function handleDragRipple(x, y) {
    if (!isDragging) return;
    const now = Date.now();
    if (now - lastRippleTime > 50) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        const size = Math.random() * 50 + 50;
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x - size/2}px`;
        ripple.style.top = `${y - size/2}px`;
        ripple.style.background = 'rgba(212, 175, 55, 0.2)'; 
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
        lastRippleTime = now;
    }
}

// 点击波纹
document.addEventListener('click', function(e) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    const size = 100;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - size/2}px`;
    ripple.style.top = `${e.clientY - size/2}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
});

// 音乐播放器
const musicBtn = document.getElementById('music-toggle');
const bgm = document.getElementById('bgm-audio');

document.body.addEventListener('click', function() {
    if(bgm && bgm.paused) {
        // 尝试自动播放背景音 (可选)
        // bgm.play().catch(()=>{}); 
    }
}, {once:true});

if(musicBtn && bgm) {
    musicBtn.addEventListener('click', () => {
        if (bgm.paused) {
            bgm.play();
            musicBtn.classList.add('playing');
            musicBtn.innerHTML = '<i class="fa-solid fa-compact-disc fa-spin"></i>'; 
        } else {
            bgm.pause();
            musicBtn.classList.remove('playing');
            musicBtn.innerHTML = '<i class="fa-solid fa-music"></i>';
        }
    });
}
