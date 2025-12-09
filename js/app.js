// ================= 属性克制关系定义 =================
const RELATION_MAP = {
    '水': '火',
    '火': '金',
    '金': '木',
    '木': '土',
    '土': '水',
    '冰': '龙',
    '龙': '妖',
    '妖': '冰',
    '一般': null 
};

// ================= 交互与应用主逻辑 (V3.6 精简版) =================
const app = {
    // === 核心状态 ===
    currentFilteredList: [], // 存储当前筛选后的啾灵列表
    currentSpiritIndex: -1,  // 当前选中啾灵在列表中的索引

    // 1. 初始化
    init: function() {
        this.hideLoader();
        this.renderHome();
        this.initDex();
        this.renderCraft();
        this.initBreed();
        this.initParticles();
        this.initEffects();
        
        // 确保地图模块已加载
        if(typeof initMap === 'function') initMap();
    },

    hideLoader: function() {
        const gate = document.getElementById('intro-gate');
        if (!gate) return;
        if (sessionStorage.getItem('hasVisited')) {
            gate.style.display = 'none';
        } else {
            setTimeout(() => {
                gate.style.opacity = '0';
                setTimeout(() => {
                    gate.style.display = 'none';
                    sessionStorage.setItem('hasVisited', 'true');
                }, 800);
            }, 1000);
        }
    },

    // 2. 首页渲染
    renderHome: function() {
        if (typeof newsData !== 'undefined') {
            const newsBox = document.getElementById('news-container');
            if(newsBox) {
                newsBox.innerHTML = newsData.map(n => {
                    const color = n.type === 'update' ? '#d4af37' : (n.type === 'event' ? '#ff6b6b' : '#999');
                    return `
                    <div class="news-item" onclick="app.loadNews('${n.url}')" data-hover style="cursor:pointer; display:flex; align-items:center; padding: 5px 0;">
                        <span style="background:${color}; color:#fff; padding:2px 6px; border-radius:4px; font-size:11px; margin-right:10px;">${n.label}</span>
                        <span style="font-size:14px; color:#555; flex:1;">${n.title}</span>
                        <span style="font-size:12px; color:#ccc;">${n.date}</span>
                    </div>`;
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
        // 初始化时，默认列表就是全部数据
        this.currentFilteredList = typeof spirits !== 'undefined' ? spirits : [];
        this.renderDexList(this.currentFilteredList);
    },

    renderDexList: function(data) {
        const listContainer = document.getElementById('dex-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        data.forEach((mon) => {
            const item = document.createElement('div');
            item.className = 'dex-item';
            
            const iconHtml = `<img src="assets/spirits/${mon.id}.png" class="dex-item-img" 
                                   alt="${mon.name}" 
                                   onload="this.style.opacity=1"
                                   style="object-fit: contain; background: #fff; opacity:0; transition:opacity 0.3s;" 
                                   onerror="this.src='assets/none.png';this.style.opacity=1;">`; 
            
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
        });
    },

    // === 核心逻辑：筛选 ===
    filterDex: function() {
        const search = document.getElementById('dexSearch').value.toLowerCase();
        const filter = document.getElementById('dexFilter').value;
        if(typeof spirits === 'undefined') return;

        // 1. 筛选并保存结果到状态变量
        this.currentFilteredList = spirits.filter(s => {
            const matchName = s.name.toLowerCase().includes(search) || s.id.includes(search);
            const matchType = filter === 'all' || s.el.includes(filter);
            return matchName && matchType;
        });
        
        // 2. 重新渲染列表
        this.renderDexList(this.currentFilteredList);
    },

    // === 核心逻辑：选中详情 ===
    selectDexItem: function(mon, domElement, animate = true) {
        // 1. 更新索引
        this.currentSpiritIndex = this.currentFilteredList.indexOf(mon);

        // 2. 列表高亮
        document.querySelectorAll('.dex-item').forEach(el => el.classList.remove('active'));
        if (domElement) {
            domElement.classList.add('active');
        } else {
            // 如果是从“上一只/下一只”触发，反向查找DOM并高亮
            const items = document.getElementById('dex-list').children;
            for (let item of items) {
                if (item.innerHTML.includes(`NO.${mon.id}`)) {
                    item.classList.add('active');
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    break;
                }
            }
        }

        // 3. 填充基础信息
        const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.innerHTML = val; };
        setTxt('detail-id', mon.id);
        setTxt('detail-name', mon.name);
        setTxt('detail-desc', mon.desc || "暂无描述");
        setTxt('detail-role', mon.job || "未知");
        
        // 4. 双属性图标显示
        const elIconContainer = document.getElementById('detail-element');
        if(elIconContainer) {
            const types = mon.el.split(/、| /); 
            elIconContainer.innerHTML = types.map(type => {
                const icon = this.getElementIcon(type);
                return `<div title="点击筛选${type}系" onclick="app.filterByAttribute('${type}')" style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:#fff; border-radius:10px; box-shadow:0 3px 8px rgba(0,0,0,0.1); cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${icon}</div>`;
            }).join('');
        }
        
        // 5. 图片加载
        const bigImg = document.getElementById('detail-img');
        if (bigImg) {
            bigImg.style.opacity = '0';
            bigImg.src = `assets/spirits/${mon.id}.png`; 
            bigImg.onload = function() { this.style.opacity = '1'; };
            bigImg.onerror = function() { this.src = 'assets/none.png'; this.style.opacity = '1'; };
        }

        // 6. 工作适应性
        const workContainer = document.getElementById('detail-work');
        if(workContainer) {
            workContainer.innerHTML = (mon.tags || []).map(t => `<div class="work-item">${t}</div>`).join('') || '<div class="work-item" style="color:#999">无</div>';
        }

        // 7. 立正锐评
        const reviewContainer = document.getElementById('detail-drops');
        if(reviewContainer) {
            const reviewText = mon.review ? mon.review : "懒得喷啊，没啥好说的";
            reviewContainer.innerHTML = `<div style="font-size:14px; color:#555; font-style:italic; line-height:1.5;">“${reviewText}”</div>`;
        }

        // 8. 计算双属性克制
        this.renderDualRelations(mon.el);

        // 9. 手机端动画
        const content = document.getElementById('detail-content');
        if(content) content.style.display = 'grid';
        const emptyState = document.querySelector('.dex-detail-card .empty-state');
        if(emptyState) emptyState.style.display = 'none';

        if (animate && window.innerWidth <= 768) {
            const layout = document.querySelector('.dex-layout-container');
            if(layout) layout.classList.add('show-detail');
        }
    },

    // === 点击属性图标进行筛选 ===
    filterByAttribute: function(type) {
        if(!type) return;
        const select = document.getElementById('dexFilter');
        if(select) {
            select.value = type;
            if (select.value !== type && type === '一般') select.value = '无';
            this.filterDex();
        }
    },

    // === 渲染双属性克制逻辑 ===
    renderDualRelations: function(elString) {
        const relationContainer = document.getElementById('detail-relation-area');
        if (!relationContainer) return;

        const myTypes = elString.split(/、| /);
        let strongAgainst = new Set(); 
        let weakAgainst = new Set();   

        myTypes.forEach(myType => {
            if (RELATION_MAP[myType]) strongAgainst.add(RELATION_MAP[myType]);
            for (const [attacker, defender] of Object.entries(RELATION_MAP)) {
                if (defender === myType) weakAgainst.add(attacker);
            }
        });

        const renderBadges = (title, typeSet, color) => {
            if (typeSet.size === 0) return '';
            const badges = Array.from(typeSet).map(type => {
                const icon = this.getElementIcon(type);
                return `<div title="点击筛选${type}系" onclick="app.filterByAttribute('${type}')" style="display:inline-flex; align-items:center; gap:4px; background:#fff; padding:4px 10px; border-radius:15px; border:1px solid ${color}; font-size:12px; color:${color}; font-weight:bold; margin-right:5px; margin-bottom:5px; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <span style="display:flex; width:16px;">${icon}</span> ${type}
                </div>`;
            }).join('');
            
            return `<div style="margin-bottom:10px;">
                <div style="font-size:12px; color:#888; margin-bottom:5px;">${title}</div>
                <div style="display:flex; flex-wrap:wrap;">${badges}</div>
            </div>`;
        };

        relationContainer.innerHTML = `
            <div style="background:rgba(255,255,255,0.5); padding:15px; border-radius:12px; border:1px solid rgba(0,0,0,0.05);">
                ${renderBadges('<i class="fa-solid fa-gavel"></i> 克制属性', strongAgainst, '#e67e22')}
                ${strongAgainst.size > 0 && weakAgainst.size > 0 ? '<div style="height:1px; background:rgba(0,0,0,0.05); margin:8px 0;"></div>' : ''}
                ${renderBadges('<i class="fa-solid fa-shield-cat"></i> 被克属性', weakAgainst, '#c0392b')}
            </div>
        `;
    },

    // === 前后切换 ===
    switchSpirit: function(direction) {
        if (this.currentFilteredList.length === 0) return;
        
        let newIndex = this.currentSpiritIndex + direction;
        if (newIndex < 0) newIndex = this.currentFilteredList.length - 1;
        if (newIndex >= this.currentFilteredList.length) newIndex = 0;
        
        const nextSpirit = this.currentFilteredList[newIndex];
        if (nextSpirit) {
            this.selectDexItem(nextSpirit, null, false);
        }
    },

    // === 跳转地图 ===
    jumpToLocation: function() {
        const currentSpirit = this.currentFilteredList[this.currentSpiritIndex];
        if (!currentSpirit) return alert("请先选择一只啾灵！");

        switchView('map');
        
        setTimeout(() => {
            if (window.highlightMapSpirit) {
                window.highlightMapSpirit(currentSpirit.name);
            } else {
                alert("地图模块正在初始化，请稍后再试...");
            }
        }, 300);
    },

    // 动态加载新闻
    loadNews: function(url) {
        if(!url || url === '#') return;
        const container = document.getElementById('news-content-area');
        container.innerHTML = '<div style="text-align:center; padding:80px 0; color:#999;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i><br>正在读取卷宗...</div>';
        switchView('news-view');

        fetch(url).then(r => r.ok ? r.text() : Promise.reject())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const content = doc.querySelector('.article-wrapper');
                if(content) {
                    container.innerHTML = ''; 
                    container.appendChild(content);
                    document.getElementById('news-view').scrollTop = 0;
                } else {
                    container.innerHTML = '<p style="text-align:center;">内容解析失败。</p>';
                }
            })
            .catch(() => container.innerHTML = '<p style="text-align:center;">读取失败。</p>');
    },

    closeNews: function() {
        switchView('home'); 
        setTimeout(() => {
            const container = document.getElementById('news-content-area');
            if(container) container.innerHTML = '';
        }, 500); 
    },

    // 融合逻辑
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

    getElementIcon: function(type) {
        if (!type) return '';
        if (typeof ELEMENT_ICONS !== 'undefined') {
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
        window.switchView = function(viewId, btn) {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            if(btn) btn.classList.add('active');
            
            document.querySelectorAll('.view-section').forEach(el => {
                if(el.id === viewId) {
                    el.classList.add('active');
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

        const craftSearch = document.getElementById('craftSearch');
        if(craftSearch) craftSearch.oninput = () => this.renderCraft();

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
    },

    // === 横屏切换 (简化版：只负责调用系统API，不支持则弹窗) ===
    toggleLandscape: function() {
        // 1. 检测浏览器是否支持相关的 API
        if (document.documentElement.requestFullscreen && screen.orientation && screen.orientation.lock) {
            // 2. 如果已经在全屏状态，则退出全屏
            if (document.fullscreenElement) {
                document.exitFullscreen()
                    .then(() => screen.orientation.unlock())
                    .catch(err => console.log(err));
            } else {
                // 3. 尝试进入全屏并锁定横屏
                document.documentElement.requestFullscreen()
                    .then(() => {
                        return screen.orientation.lock("landscape");
                    })
                    .catch(err => {
                        // 4. 锁定失败（如权限问题或设备不支持）
                        console.warn("横屏锁定失败:", err);
                        alert("您的设备暂不支持自动强制横屏，请尝试在系统设置中开启旋转后手动横屏。");
                    });
            }
        } else {
            // 5. 根本不支持 API (如 iOS Safari)
            alert("当前浏览器不支持自动横屏控制，请手动旋转手机。");
        }
    }
};

// ---------------- 天工造物模块 (升级版：带购物车) ----------------
app.cart = JSON.parse(localStorage.getItem('shanhai_cart_v1') || '{}');
let currentCraftItem = null;

app.renderCraft = function() {
    this.filterCraft(); 
    this.updateCartBadge();
};

app.switchCraftMode = function(mode) {
    document.querySelectorAll('.c-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('c-tab-' + mode).classList.add('active');
    document.querySelectorAll('.craft-view-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('view-craft-' + mode).classList.add('active');
    if(mode === 'cart') this.renderCartView();
};

app.filterCraft = function() {
    const search = document.getElementById('craftSearch').value.toLowerCase();
    const container = document.getElementById('recipe-list');
    if(!container || typeof RECIPE_DB === 'undefined') return;

    container.innerHTML = '';
    const list = Object.keys(RECIPE_DB).map(key => ({name: key, ...RECIPE_DB[key]}));
    
    list.forEach(item => {
        if(search && !item.name.toLowerCase().includes(search) && !item.type.includes(search)) return;
        const div = document.createElement('div');
        div.className = 'craft-item';
        div.onclick = () => { 
            app.switchCraftMode('lookup'); 
            app.selectCraftItem(item.name); 
        };
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

app.selectCraftItem = function(name) {
    currentCraftItem = name;
    document.querySelector('.empty-state-craft').style.display = 'none';
    document.getElementById('craft-detail-content').style.display = 'block';
    
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
    document.getElementById('calc-qty').value = 1;
    this.calcCraftMaterials();
};

app.updateCraftCalc = function(delta) {
    const input = document.getElementById('calc-qty');
    let val = parseInt(input.value) + delta;
    if(val < 1) val = 1;
    input.value = val;
    this.calcCraftMaterials();
};

app.calcCraftMaterials = function() {
    if(!currentCraftItem) return;
    const qty = parseInt(document.getElementById('calc-qty').value);
    const rawTotals = {};
    this.recursiveGetRaw(currentCraftItem, qty, rawTotals);
    document.getElementById('raw-mat-list').innerHTML = this.renderMatGrid(rawTotals);
    document.getElementById('tree-container').innerHTML = this.renderTreeHTML(currentCraftItem, qty);
};

app.addToCart = function() {
    if(!currentCraftItem) return;
    const qty = parseInt(document.getElementById('calc-qty').value);
    if(this.cart[currentCraftItem]) this.cart[currentCraftItem] += qty;
    else this.cart[currentCraftItem] = qty;
    this.saveCart();
    this.updateCartBadge();
    const btn = document.querySelector('.btn-add-cart');
    const orgHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> 已添加';
    setTimeout(() => btn.innerHTML = orgHtml, 1000);
};

app.renderCartView = function() {
    const listContainer = document.getElementById('cart-list-container');
    const totalContainer = document.getElementById('cart-total-mats');
    if(Object.keys(this.cart).length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; color:#999; padding:40px;">清单是空的，快去左侧添加配方吧~</div>';
        totalContainer.innerHTML = '';
        return;
    }
    let listHtml = '';
    const grandTotalRaw = {};
    for(let [name, qty] of Object.entries(this.cart)) {
        listHtml += `
            <div class="cart-row">
                <div class="cart-row-name">${name}</div>
                <div class="cart-row-ctrl">
                    <span style="font-size:12px; color:#888;">数量:</span>
                    <input type="number" value="${qty}" min="1" 
                        style="width:50px; text-align:center; border:1px solid #ddd; border-radius:4px; padding:2px;"
                        onchange="app.updateCartItem('${name}', this.value)">
                    <i class="fa-solid fa-trash-can cart-del-btn" onclick="app.removeCartItem('${name}')"></i>
                </div>
            </div>`;
        this.recursiveGetRaw(name, qty, grandTotalRaw);
    }
    listContainer.innerHTML = listHtml;
    totalContainer.innerHTML = this.renderMatGrid(grandTotalRaw);
};

app.updateCartItem = function(name, newQty) {
    const q = parseInt(newQty);
    if(q <= 0) this.removeCartItem(name);
    else {
        this.cart[name] = q;
        this.saveCart();
        this.renderCartView();
    }
};

app.removeCartItem = function(name) {
    delete this.cart[name];
    this.saveCart();
    this.updateCartBadge();
    this.renderCartView();
};

app.clearCart = function() {
    if(confirm('确定清空所有清单吗？')) {
        this.cart = {};
        this.saveCart();
        this.updateCartBadge();
        this.renderCartView();
    }
};

app.saveCart = function() { localStorage.setItem('shanhai_cart_v1', JSON.stringify(this.cart)); };
app.updateCartBadge = function() {
    const count = Object.keys(this.cart).length;
    const badge = document.getElementById('cart-badge');
    if(count > 0) { badge.style.display = 'inline-block'; badge.innerText = count; } 
    else { badge.style.display = 'none'; }
};

app.renderMatGrid = function(matData) {
    return Object.entries(matData).map(([name, count]) => `
        <div class="mat-card">
            <div class="mat-icon"><i class="fa-solid fa-cube"></i></div>
            <div class="mat-qty">${Math.ceil(count)}</div> 
            <div class="mat-name">${name}</div>
        </div>`).join('');
};

app.recursiveGetRaw = function(itemName, needQty, accumulator) {
    if(BASIC_MATS.has(itemName) || !RECIPE_DB[itemName]) {
        accumulator[itemName] = (accumulator[itemName] || 0) + needQty;
        return;
    }
    const recipe = RECIPE_DB[itemName];
    const craftTimes = needQty / recipe.yield; 
    for(let [matName, matQty] of Object.entries(recipe.mat)) {
        this.recursiveGetRaw(matName, matQty * craftTimes, accumulator);
    }
};

app.renderTreeHTML = function(itemName, needQty, depth = 0) {
    const isBasic = BASIC_MATS.has(itemName) || !RECIPE_DB[itemName];
    const qtyDisplay = Number(needQty).toFixed(1).replace(/\.0$/, ''); 
    let html = `<div class="tree-node"><div class="node-content ${isBasic ? 'basic' : 'inter'}"><span style="font-weight:bold; margin-right:5px;">${qtyDisplay}</span>${itemName}</div>`;
    if(!isBasic) {
        const recipe = RECIPE_DB[itemName];
        const craftTimes = needQty / recipe.yield;
        for(let [matName, matQty] of Object.entries(recipe.mat)) {
            html += app.renderTreeHTML(matName, matQty * craftTimes, depth + 1);
        }
    }
    html += `</div>`;
    return html;
};

app.switchBpTab = function(tabName) {
    document.querySelectorAll('.bp-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.bp-view').forEach(v => v.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    document.getElementById('view-' + tabName).classList.add('active');
};

// 禁止右键等 (如不需要可删除)
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
document.addEventListener('selectstart', function(e) { e.preventDefault(); });

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});