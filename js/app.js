// ================= 交互与应用主逻辑 (修复版) =================

const app = {
    // 1. 初始化
    init: function() {
        this.hideLoader();
        this.renderHome();
        this.initDex();
        this.renderCraft();
        this.initBreed();
        this.initParticles();
        this.initEffects();
        
        // 修正：调用 map.js 中的全局 initMap 函数
        if(typeof initMap === 'function') {
            initMap();
        }
    },

    hideLoader: function() {
        setTimeout(() => {
            const gate = document.getElementById('intro-gate');
            if (gate) {
                gate.style.opacity = '0';
                setTimeout(() => gate.style.display = 'none', 800);
            }
        }, 800);
    },

    // 2. 首页渲染
    renderHome: function() {
        if (typeof newsData !== 'undefined') {
            const newsBox = document.getElementById('news-container');
            if(newsBox) {
                newsBox.innerHTML = newsData.map(n => {
                    const color = n.type === 'update' ? '#d4af37' : (n.type === 'event' ? '#ff6b6b' : '#999');
                    // 修复：添加链接跳转
                    const url = n.url || '#';
                    const target = url !== '#' ? 'target="_blank"' : '';
                    return `<a href="${url}" ${target} class="news-item" data-hover style="text-decoration:none; display:flex; align-items:center;">
                        <span style="background:${color}; color:#fff; padding:2px 6px; border-radius:4px; font-size:11px;">${n.label}</span>
                        <span style="font-size:14px; color:#555; flex:1; margin-left:10px;">${n.title}</span>
                        <span style="font-size:12px; color:#ccc;">${n.date}</span>
                    </a>`;
                }).join('');
            }
        }

        if (typeof guideData !== 'undefined') {
            const guideBox = document.getElementById('guide-container');
            if(guideBox) {
                guideBox.innerHTML = guideData.map(g => `
                    <div class="guide-card" data-hover>
                        <div style="font-size:24px; color:var(--accent); min-width:40px; text-align:center;">
                            <i class="fa-solid fa-${g.icon || 'star'}"></i>
                        </div>
                        <div>
                            <h4 style="margin:0 0 5px 0; color:var(--primary);">${g.title}</h4>
                            <p style="margin:0; font-size:12px; color:#888;">${g.desc}</p>
                        </div>
                    </div>`).join('');
            }
        }

        if (typeof spirits !== 'undefined' && document.getElementById('stat-count')) {
            document.getElementById('stat-count').innerText = spirits.length;
        }
    },

    // 3. 图鉴逻辑
    initDex: function() {
        this.renderDexList(typeof spirits !== 'undefined' ? spirits : []);
    },

    renderDexList: function(data) {
        const listContainer = document.getElementById('dex-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        data.forEach((mon, idx) => {
            const item = document.createElement('div');
            item.className = 'dex-item';
            
            // 修复：图片路径统一设在 assets/spirits/ 文件夹下
            const iconHtml = `<img src="assets/spirits/${mon.id}.png" class="dex-item-img" 
                                   alt="${mon.name}" 
                                   style="object-fit: contain; background: #fff;" 
                                   onerror="this.src='assets/none.png'">`; 
            
            item.innerHTML = `
                ${iconHtml}
                <div class="dex-item-info">
                    <div>
                        <div style="font-size:10px; color:#999;">NO.${mon.id}</div>
                        <div class="dex-item-name">${mon.name}</div>
                    </div>
                </div>`;
            
            item.onclick = () => this.selectDexItem(mon, item);
            listContainer.appendChild(item);
            
            // 桌面端默认选中第一个
            if(idx === 0 && window.innerWidth > 768) this.selectDexItem(mon, item, false);
        });
    },

    selectDexItem: function(mon, domElement, animate = true) {
        document.querySelectorAll('.dex-item').forEach(el => el.classList.remove('active'));
        if (domElement) domElement.classList.add('active');

        // 填充文字数据
        const setTxt = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
        setTxt('detail-id', mon.id);
        setTxt('detail-name', mon.name);
        setTxt('detail-desc', mon.desc || "暂无描述");
        setTxt('detail-role', mon.job || "未知");
        
        const elIcon = document.getElementById('detail-element');
        if(elIcon) elIcon.innerHTML = this.getElementIcon(mon.el);
        
        // 显示详情容器
        const content = document.getElementById('detail-content');
        if(content) content.style.display = 'grid'; // 确保这里是 grid 或 flex
        const emptyState = document.querySelector('.dex-detail-card .empty-state');
        if(emptyState) emptyState.style.display = 'none';

        // 修复：大图路径
        const bigImg = document.getElementById('detail-img');
        if (bigImg) {
            bigImg.src = `assets/spirits/${mon.id}.png`; // 确保这里路径与你实际存放的一致
            bigImg.onerror = function() { this.src = 'assets/none.png'; };
        }

        // 渲染工作适应性
        const workContainer = document.getElementById('detail-work');
        if(workContainer) {
            workContainer.innerHTML = (mon.tags || []).map(t => 
                `<div class="work-item">${t}</div>`
            ).join('') || '<div class="work-item" style="color:#999">无</div>';
        }

        // 手机端滑入效果
        if (animate && window.innerWidth <= 768) {
            const layout = document.querySelector('.dex-layout-container');
            if(layout) layout.classList.add('show-detail');
        }
    },

    filterDex: function() {
        const search = document.getElementById('dexSearch').value.toLowerCase();
        const filter = document.getElementById('dexFilter').value;
        if(typeof spirits === 'undefined') return;

        const filtered = spirits.filter(s => {
            const matchName = s.name.toLowerCase().includes(search);
            const matchType = filter === 'all' || s.el.includes(filter);
            return matchName && matchType;
        });
        this.renderDexList(filtered);
    },


    // 5. 融合逻辑
    initBreed: function() {
        if(typeof spirits === 'undefined') return;
        const fill = (id) => {
            const el = document.getElementById(id);
            if(el) el.innerHTML = '<option>请选择</option>' + spirits.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        };
        fill('p1'); fill('p2');
    },

    checkBreed: function() {
        const p1 = document.getElementById('p1').value;
        const p2 = document.getElementById('p2').value;
        if(p1 !== '请选择' && p2 !== '请选择') {
            document.getElementById('result-name').innerText = "推演中...";
            document.getElementById('result-egg').classList.add('active');
            setTimeout(() => {
                document.getElementById('result-name').innerText = "神秘灵兽";
                document.getElementById('result-egg').classList.remove('active');
            }, 1000);
        }
    },

    // 工具函数
    getElementIcon: function(type) {
        if (!type) return '';
        if (typeof ELEMENT_ICONS !== 'undefined') {
            // 模糊匹配
            for (let k in ELEMENT_ICONS) {
                if (type.includes(k)) return ELEMENT_ICONS[k];
            }
        }
        return '<i class="fa-solid fa-circle" style="color:#ccc"></i>';
    },

    initParticles: function() {
        const canvas = document.getElementById('particle-canvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        resize();
        
        const p = Array.from({length: 40}, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2,
            s: Math.random() * 0.5 + 0.1
        }));

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(212, 175, 55, 0.3)";
            p.forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
                ctx.fill();
                pt.y -= pt.s;
                if(pt.y < 0) pt.y = canvas.height;
            });
            requestAnimationFrame(draw);
        }
        draw();
    },

    initEffects: function() {
        // 全局交互
        window.switchView = function(viewId, btn) {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            if(btn) btn.classList.add('active');
            
            document.querySelectorAll('.view-section').forEach(el => {
                if(el.id === viewId) {
                    el.classList.add('active');
                    // 修复：切换到地图时刷新Leaflet大小，防止地图显示不全
                    if(viewId === 'map' && typeof map !== 'undefined' && map) {
                        setTimeout(() => map.invalidateSize(), 200);
                    }
                } else {
                    el.classList.remove('active');
                }
            });
        };
        
        window.backToDexList = function() {
            document.querySelector('.dex-layout-container').classList.remove('show-detail');
        };

        // 搜索绑定
        const dexSearch = document.getElementById('dexSearch');
        if(dexSearch) dexSearch.oninput = () => this.filterDex();
        
        const dexFilter = document.getElementById('dexFilter');
        if(dexFilter) dexFilter.onchange = () => this.filterDex();
        
        const craftSearch = document.getElementById('craftSearch');
        if(craftSearch) craftSearch.oninput = () => this.renderCraft();

        // 音乐播放器
        const musicBtn = document.getElementById('music-toggle');
        const bgm = document.getElementById('bgm-audio');
        if(musicBtn && bgm) {
            musicBtn.onclick = () => {
                if(bgm.paused) {
                    bgm.play();
                    musicBtn.classList.add('playing');
                    musicBtn.innerHTML = '<i class="fa-solid fa-compact-disc fa-spin"></i>';
                } else {
                    bgm.pause();
                    musicBtn.classList.remove('playing');
                    musicBtn.innerHTML = '<i class="fa-solid fa-music"></i>';
                }
            };
        }
        
        // 鼠标跟随
        const dot = document.getElementById('cursor-dot');
        const outline = document.getElementById('cursor-outline');
        if(dot && window.innerWidth > 768) {
            window.addEventListener('mousemove', e => {
                dot.style.left = e.clientX + 'px';
                dot.style.top = e.clientY + 'px';
                outline.animate({left: e.clientX + 'px', top: e.clientY + 'px'}, {duration: 500, fill: "forwards"});
            });
        }
    }
};



// ---------------- 天工造物模块 ----------------

let currentCraftItem = null;

app.renderCraft = function() {
    this.filterCraft(); // 初始化显示列表
};

// 1. 列表渲染与过滤
app.filterCraft = function() {
    const search = document.getElementById('craftSearch').value.toLowerCase();
    const container = document.getElementById('recipe-list');
    if(!container || typeof RECIPE_DB === 'undefined') return;

    container.innerHTML = '';
    
    // 将 Object 转换为 Array 并排序
    const list = Object.keys(RECIPE_DB).map(key => ({name: key, ...RECIPE_DB[key]}));
    
    list.forEach(item => {
        if(search && !item.name.toLowerCase().includes(search) && !item.type.includes(search)) return;

        const div = document.createElement('div');
        div.className = 'craft-item';
        div.onclick = () => app.selectCraftItem(item.name);
        div.innerHTML = `
            <div>
                <div style="font-weight:bold; color:var(--primary)">${item.name}</div>
                <div style="font-size:12px; color:#888;">${item.type} ${item.lv ? '| Lv.'+item.lv : ''}</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="color:#ccc; font-size:12px;"></i>
        `;
        container.appendChild(div);
    });
};

// 2. 选中物品
app.selectCraftItem = function(name) {
    currentCraftItem = name;
    document.querySelector('.empty-state-craft').style.display = 'none';
    document.getElementById('craft-detail-content').style.display = 'block';
    
    // 高亮列表项
    document.querySelectorAll('.craft-item').forEach(el => {
        el.classList.toggle('active', el.innerText.includes(name));
    });

    const data = RECIPE_DB[name];
    document.getElementById('bp-name').innerText = name;
    document.getElementById('bp-type').innerText = data.type;
    
    const yieldEl = document.getElementById('bp-yield');
    if(data.yield > 1) {
        yieldEl.style.display = 'inline-block';
        yieldEl.innerText = `产量: 每份 ${data.yield} 个`;
    } else {
        yieldEl.style.display = 'none';
    }

    // 重置数量为1并计算
    document.getElementById('calc-qty').value = 1;
    this.calcCraftMaterials();
};

// 3. 数量变更辅助
app.updateCraftCalc = function(delta) {
    const input = document.getElementById('calc-qty');
    let val = parseInt(input.value) + delta;
    if(val < 1) val = 1;
    input.value = val;
    this.calcCraftMaterials();
};

// 4. 核心计算逻辑 (递归)
app.calcCraftMaterials = function() {
    if(!currentCraftItem) return;
    const qty = parseInt(document.getElementById('calc-qty').value);
    
    // A. 计算基础材料汇总
    const rawTotals = {};
    this.recursiveGetRaw(currentCraftItem, qty, rawTotals);
    
    // 渲染原材料网格
    const rawContainer = document.getElementById('raw-mat-list');
    rawContainer.innerHTML = Object.entries(rawTotals).map(([name, count]) => `
        <div class="mat-card">
            <div class="mat-icon"><i class="fa-solid fa-cube"></i></div>
            <div class="mat-qty">${Math.ceil(count)}</div> <div class="mat-name">${name}</div>
        </div>
    `).join('');

    // B. 渲染树状图
    const treeContainer = document.getElementById('tree-container');
    treeContainer.innerHTML = this.renderTreeHTML(currentCraftItem, qty);
};

// 递归函数：计算基础材料
app.recursiveGetRaw = function(itemName, needQty, accumulator) {
    // 如果是基础材料，直接累加
    if(BASIC_MATS.has(itemName) || !RECIPE_DB[itemName]) {
        accumulator[itemName] = (accumulator[itemName] || 0) + needQty;
        return;
    }

    const recipe = RECIPE_DB[itemName];
    // 计算需要制作的次数。比如需要8个布，每次产5个，则需要制作 Math.ceil(8/5) = 2次
    // 注意：这里为了计算准确的“原材料消耗”，我们通常假设可以拆分，或者严格按照制作次数。
    // 为了给玩家准确的“准备材料”建议，我们按“制作次数 * 单次消耗”来算比较保险，
    // 但为了展示比例，这里使用精确除法，最后显示时向上取整。
    
    const craftTimes = needQty / recipe.yield; 

    for(let [matName, matQty] of Object.entries(recipe.mat)) {
        this.recursiveGetRaw(matName, matQty * craftTimes, accumulator);
    }
};

// 递归函数：生成树状 HTML
app.renderTreeHTML = function(itemName, needQty, depth = 0) {
    const isBasic = BASIC_MATS.has(itemName) || !RECIPE_DB[itemName];
    const qtyDisplay = Number(needQty).toFixed(1).replace(/\.0$/, ''); // 去掉多余小数
    
    let html = `
        <div class="tree-node">
            <div class="node-content ${isBasic ? 'basic' : 'inter'}">
                <span style="font-weight:bold; margin-right:5px;">${qtyDisplay}</span> 
                ${itemName}
            </div>
    `;

    if(!isBasic) {
        const recipe = RECIPE_DB[itemName];
        // 计算下一级需要的数量
        const craftTimes = needQty / recipe.yield;
        
        for(let [matName, matQty] of Object.entries(recipe.mat)) {
            html += app.renderTreeHTML(matName, matQty * craftTimes, depth + 1);
        }
    }

    html += `</div>`;
    return html;
};

// 5. 切换 Tab
app.switchBpTab = function(tabName) {
    document.querySelectorAll('.bp-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.bp-view').forEach(v => v.classList.remove('active'));
    
    document.getElementById('tab-' + tabName).classList.add('active');
    document.getElementById('view-' + tabName).classList.add('active');
};

// 防盗措施//
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('selectstart', function(e) {
    e.preventDefault();
});

// 禁用F12和开发者工具
document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.shiftKey && e.key === 'J') || 
        (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        alert('操作已被禁止');
    }
});

window.onload = () => app.init();