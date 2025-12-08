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
        const gate = document.getElementById('intro-gate');
        if (!gate) return;

        // 检查浏览器是否“记得”用户已经来过 (sessionStorage 在关闭浏览器标签前都有效)
        if (sessionStorage.getItem('hasVisited')) {
            // 如果访问过，直接把遮罩层设为不显示，跳过动画
            gate.style.display = 'none';
        } else {
            // 如果是第一次来，按原计划播放动画
            // 动画结束后，记录“已访问”状态
            setTimeout(() => {
                gate.style.opacity = '0';
                setTimeout(() => {
                    gate.style.display = 'none';
                    sessionStorage.setItem('hasVisited', 'true'); // 标记：我来过了
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
                    // 1. 去掉了 href 和 target="_blank"
                    // 2. 增加了 onclick="app.loadNews(...)"
                    // 3. 标签从 <a> 改为了 <div>
                    return `
                    <div class="news-item" onclick="app.loadNews('${n.url}')" data-hover style="cursor:pointer; display:flex; align-items:center; padding: 5px 0;">
                        <span style="background:${color}; color:#fff; padding:2px 6px; border-radius:4px; font-size:11px; margin-right:10px;">${n.label}</span>
                        <span style="font-size:14px; color:#555; flex:1;">${n.title}</span>
                        <span style="font-size:12px; color:#ccc;">${n.date}</span>
                    </div>`;
                    // ★★★ 修改结束 ★★★
                    
                }).join('');
            }
        }

        // ... (renderHome 函数后面的 guideData 和 stat-count 代码保持不变) ...
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

// --- 新增功能：动态加载新闻 ---

    // 加载新闻详情
    loadNews: function(url) {
        if(!url || url === '#') return;

        const container = document.getElementById('news-content-area');
        // 显示加载中的提示
        container.innerHTML = '<div style="text-align:center; padding:50px; color:#999;"><i class="fa-solid fa-circle-notch fa-spin"></i> 正在读取卷宗...</div>';
        
        // 切换到新闻视图（这一步由 global switchView 处理，平滑过渡）
        switchView('news-view');

        // 使用 fetch 技术“抓取”目标网页的内容
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('网络响应错误');
                return response.text();
            })
            .then(html => {
                // 把抓取到的 HTML 文本转换成文档对象
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // ★★★ 关键点：只提取对方网页里的 .article-wrapper 内容 ★★★
                const articleContent = doc.querySelector('.article-wrapper');
                
                if(articleContent) {
                    container.innerHTML = ''; // 清空加载动画
                    container.appendChild(articleContent); // 放入真正的文章
                } else {
                    container.innerHTML = '<p style="text-align:center; margin-top:50px;">卷宗内容已损坏或格式不符。</p>';
                }
            })
            .catch(err => {
                console.error(err);
                container.innerHTML = '<p style="text-align:center; margin-top:50px;">读取失败，请检查网络连接。</p>';
            });
    },

    // 关闭新闻，返回首页
    closeNews: function() {
        switchView('home'); // 切回首页视图
        
        // 等动画播放完（500ms）再清空内容，释放内存
        setTimeout(() => {
            const container = document.getElementById('news-content-area');
            if(container) container.innerHTML = '';
        }, 500); 
    },

    // ================= 核心修改：选中图鉴时的逻辑 =================
    // ================= 新增：点击属性图标进行筛选 =================
    filterByAttribute: function(type) {
        if(!type) return;
        const select = document.getElementById('dexFilter');
        if(select) {
            // 1. 修改下拉框的值
            select.value = type;
            // 2. 如果下拉框里没有这个属性（比如数据填错了），则不做筛选以免列表为空
            if (select.value !== type && type !== '一般') {
                 // 兼容处理：如果传进来的是'一般'，对应option是'无'
                 if(type === '一般') select.value = '无';
                 else return; 
            }
            // 3. 触发筛选逻辑
            this.filterDex();
            
            // 4. (可选) 手机端点击后，如果想自动切回列表看结果，可取消注释下面这行
            // document.querySelector('.dex-layout-container').classList.remove('show-detail');
        }
    },

    // ================= 选中图鉴时的逻辑 (带点击功能版) =================
    selectDexItem: function(mon, domElement, animate = true) {
        // 1. 列表高亮
        document.querySelectorAll('.dex-item').forEach(el => el.classList.remove('active'));
        if (domElement) domElement.classList.add('active');

        // 2. 填充文字
        const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.innerHTML = val; };
        setTxt('detail-id', mon.id);
        setTxt('detail-name', mon.name);
        setTxt('detail-desc', mon.desc || "暂无描述");
        setTxt('detail-role', mon.job || "未知");
        
        // 3. ★★★ 设置本系属性图标 (新增点击事件) ★★★
        const elIcon = document.getElementById('detail-element');
        if(elIcon) {
            elIcon.innerHTML = this.getElementIcon(mon.el);
            // 增加鼠标手势和点击事件
            elIcon.style.cursor = 'pointer';
            elIcon.title = `点击筛选所有【${mon.el}】系啾灵`;
            // 绑定点击筛选
            elIcon.onclick = () => { this.filterByAttribute(mon.el); };
        }
        
        // 4. 设置大图
        const bigImg = document.getElementById('detail-img');
        if (bigImg) {
            bigImg.src = `assets/spirits/${mon.id}.png`; 
            bigImg.onerror = function() { this.src = 'assets/none.png'; };
        }

        // 5. 工作适应性
        const workContainer = document.getElementById('detail-work');
        if(workContainer) {
            workContainer.innerHTML = (mon.tags || []).map(t => `<div class="work-item">${t}</div>`).join('') || '<div class="work-item" style="color:#999">无</div>';
        }

        // 6. 立正锐评
        const reviewContainer = document.getElementById('detail-drops');
        if(reviewContainer) {
            const reviewText = mon.review ? mon.review : "懒得喷啊，没啥好说的";
            reviewContainer.innerHTML = `<div style="font-size:14px; color:#555; font-style:italic; line-height:1.5;">“${reviewText}”</div>`;
        }

        // 7. ★★★ 属性克制计算 (新增点击事件) ★★★
        const relationContainer = document.getElementById('detail-relation-area'); 
        if (relationContainer) {
            const myEl = mon.el;
            const target = RELATION_MAP[myEl]; 
            let threat = null;
            for (const [key, val] of Object.entries(RELATION_MAP)) {
                if (val === myEl) { threat = key; break; }
            }

            // 辅助渲染函数：增加了 onclick 和 cursor:pointer
            const renderRel = (label, elType, colorHex) => {
                if (!elType) return `<div style="text-align:center; opacity:0.5;"><span style="font-size:12px;">${label}</span><br><span style="font-size:12px;">无</span></div>`;
                
                const icon = this.getElementIcon(elType); 
                // 注意：这里 onclick 调用了 app.filterByAttribute
                return `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;" 
                         onclick="app.filterByAttribute('${elType}')"
                         title="点击筛选所有【${elType}】系">
                        <span style="font-size:12px; color:#888;">${label}</span>
                        <div style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.6); padding:4px 10px; border-radius:20px; border:1px solid ${colorHex}; transition:0.2s;" onmouseover="this.style.background='#fff'" onmouseout="this.style.background='rgba(255,255,255,0.6)'">
                            <div style="width:20px; height:20px; display:flex; align-items:center;">${icon}</div>
                            <span style="font-weight:bold; color:${colorHex}; font-size:14px;">${elType}</span>
                        </div>
                    </div>
                `;
            };

            relationContainer.innerHTML = `
                <div style="display:flex; justify-content:space-around; align-items:center; width:100%; background:rgba(255,255,255,0.5); padding:10px; border-radius:12px;">
                    ${renderRel('克制 <i class="fa-solid fa-check"></i>', target, '#4caf50')}
                    <div style="width:1px; height:30px; background:#ddd;"></div>
                    ${renderRel('被克 <i class="fa-solid fa-xmark"></i>', threat, '#f44336')}
                </div>
            `;
        }

        // 8. 手机端动画
        const content = document.getElementById('detail-content');
        if(content) content.style.display = 'grid';
        const emptyState = document.querySelector('.dex-detail-card .empty-state');
        if(emptyState) emptyState.style.display = 'none';

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
    },

// --- 新增功能：动态加载新闻 ---

    // 加载新闻详情
    loadNews: function(url) {
        // 如果没有链接，或者链接无效，直接忽略
        if(!url || url === '#') return;

        const container = document.getElementById('news-content-area');
        
        // 1. 显示加载中的提示（转圈圈动画）
        container.innerHTML = '<div style="text-align:center; padding:80px 0; color:#999;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i><br>正在读取卷宗...</div>';
        
        // 2. 切换视图到新闻页 (利用我们全局的 switchView 函数)
        switchView('news-view');

        // 3. 使用 fetch 技术“抓取”目标网页的内容
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('网络响应错误');
                return response.text();
            })
            .then(html => {
                // 4. 把抓取到的 HTML 文本转换成文档对象
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // ★★★ 关键点：只提取对方网页里的 .article-wrapper 内容 ★★★
                // 这样能避开对方页面的 head, body, navbar 等重复元素
                const articleContent = doc.querySelector('.article-wrapper');
                
                if(articleContent) {
                    container.innerHTML = ''; // 清空加载动画
                    container.appendChild(articleContent); // 放入真正的文章
                    
                    // 滚动到顶部，防止停留在页面下方
                    document.getElementById('news-view').scrollTop = 0;
                } else {
                    container.innerHTML = '<p style="text-align:center; margin-top:50px;">卷宗内容已损坏或格式不符。</p>';
                }
            })
            .catch(err => {
                console.error(err);
                container.innerHTML = '<p style="text-align:center; margin-top:50px;">读取失败，请检查网络连接。</p>';
            });
    },

    // 关闭新闻，返回首页
    closeNews: function() {
        switchView('home'); // 切回首页视图
        
        // 等动画播放完（500ms）再清空内容，释放内存，也防止下次打开闪现旧内容
        setTimeout(() => {
            const container = document.getElementById('news-content-area');
            if(container) container.innerHTML = '';
        }, 500); 
    },

};


// ---------------- 天工造物模块 (升级版：带购物车) ----------------

// 初始化购物车数据 (存储结构: { "物品名": 数量, ... })
app.cart = JSON.parse(localStorage.getItem('shanhai_cart_v1') || '{}');
let currentCraftItem = null;

// 1. 初始化渲染
app.renderCraft = function() {
    this.filterCraft(); 
    this.updateCartBadge();
};

// 2. 模式切换 (查询 / 购物车)
app.switchCraftMode = function(mode) {
    // 切换 Tab 样式
    document.querySelectorAll('.c-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('c-tab-' + mode).classList.add('active');
    
    // 切换视图内容
    document.querySelectorAll('.craft-view-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('view-craft-' + mode).classList.add('active');

    // 如果切到购物车，立即刷新数据
    if(mode === 'cart') {
        this.renderCartView();
    }
};

// 3. 列表过滤 (保持不变)
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
        // 核心改动：点击列表时，强制切回“检索模式”查看详情
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

// 4. 选中单品详情 (保持不变)
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

// 5. 单品计算器逻辑
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
    
    // 计算单品材料
    const rawTotals = {};
    this.recursiveGetRaw(currentCraftItem, qty, rawTotals);
    
    document.getElementById('raw-mat-list').innerHTML = this.renderMatGrid(rawTotals);
    document.getElementById('tree-container').innerHTML = this.renderTreeHTML(currentCraftItem, qty);
};


// ==================== 核心升级：购物车逻辑 ====================

// A. 添加到清单
app.addToCart = function() {
    if(!currentCraftItem) return;
    const qty = parseInt(document.getElementById('calc-qty').value);
    
    // 逻辑：如果已存在，累加数量；否则新建
    if(this.cart[currentCraftItem]) {
        this.cart[currentCraftItem] += qty;
    } else {
        this.cart[currentCraftItem] = qty;
    }

    this.saveCart();
    this.updateCartBadge();
    
    // 简单的反馈动画
    const btn = document.querySelector('.btn-add-cart');
    const orgHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> 已添加';
    setTimeout(() => btn.innerHTML = orgHtml, 1000);
};

// B. 渲染清单视图 (列表 + 总统计)
app.renderCartView = function() {
    const listContainer = document.getElementById('cart-list-container');
    const totalContainer = document.getElementById('cart-total-mats');
    
    // 1. 渲染列表
    if(Object.keys(this.cart).length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; color:#999; padding:40px;">清单是空的，快去左侧添加配方吧~</div>';
        totalContainer.innerHTML = '';
        return;
    }

    let listHtml = '';
    // 用于统计总材料
    const grandTotalRaw = {};

    for(let [name, qty] of Object.entries(this.cart)) {
        // 生成列表行
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
            </div>
        `;

        // 累加材料计算
        this.recursiveGetRaw(name, qty, grandTotalRaw);
    }

    listContainer.innerHTML = listHtml;
    
    // 2. 渲染总材料网格
    totalContainer.innerHTML = this.renderMatGrid(grandTotalRaw);
};

// C. 清单管理辅助函数
app.updateCartItem = function(name, newQty) {
    const q = parseInt(newQty);
    if(q <= 0) {
        this.removeCartItem(name);
    } else {
        this.cart[name] = q;
        this.saveCart();
        this.renderCartView(); // 重新计算总和
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

app.saveCart = function() {
    localStorage.setItem('shanhai_cart_v1', JSON.stringify(this.cart));
};

app.updateCartBadge = function() {
    const count = Object.keys(this.cart).length;
    const badge = document.getElementById('cart-badge');
    if(count > 0) {
        badge.style.display = 'inline-block';
        badge.innerText = count;
    } else {
        badge.style.display = 'none';
    }
};

// ==================== 递归计算核心 (公用) ====================

// 渲染材料网格 HTML (提取出来公用)
app.renderMatGrid = function(matData) {
    return Object.entries(matData).map(([name, count]) => `
        <div class="mat-card">
            <div class="mat-icon"><i class="fa-solid fa-cube"></i></div>
            <div class="mat-qty">${Math.ceil(count)}</div> 
            <div class="mat-name">${name}</div>
        </div>
    `).join('');
};

// 递归计算原材料 (与之前相同)
app.recursiveGetRaw = function(itemName, needQty, accumulator) {
    // 基础材料或未知配方，直接统计
    if(BASIC_MATS.has(itemName) || !RECIPE_DB[itemName]) {
        accumulator[itemName] = (accumulator[itemName] || 0) + needQty;
        return;
    }

    const recipe = RECIPE_DB[itemName];
    // 需要制作的次数
    const craftTimes = needQty / recipe.yield; 

    for(let [matName, matQty] of Object.entries(recipe.mat)) {
        this.recursiveGetRaw(matName, matQty * craftTimes, accumulator);
    }
};

// 树状图渲染 (与之前相同)
app.renderTreeHTML = function(itemName, needQty, depth = 0) {
    const isBasic = BASIC_MATS.has(itemName) || !RECIPE_DB[itemName];
    const qtyDisplay = Number(needQty).toFixed(1).replace(/\.0$/, ''); 
    
    let html = `
        <div class="tree-node">
            <div class="node-content ${isBasic ? 'basic' : 'inter'}">
                <span style="font-weight:bold; margin-right:5px;">${qtyDisplay}</span> 
                ${itemName}
            </div>
    `;

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

// 切换Tab (保持不变)
app.switchBpTab = function(tabName) {
    document.querySelectorAll('.bp-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.bp-view').forEach(v => v.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    document.getElementById('view-' + tabName).classList.add('active');
};


// ================= 手机端地图横屏切换 =================
app.toggleLandscape = function() {
    // 1. 优先尝试原生全屏 + 横屏锁定 (安卓体验最佳，触控正常)
    if (document.documentElement.requestFullscreen && screen.orientation && screen.orientation.lock) {
        // 如果已经在全屏/横屏模式，则退出
        if (document.fullscreenElement) {
            document.exitFullscreen();
            screen.orientation.unlock();
            return;
        }
        // 进入全屏并锁定横向
        document.documentElement.requestFullscreen().then(() => {
            screen.orientation.lock("landscape").catch(err => {
                console.log("横屏锁定失败，转为CSS旋转:", err);
                // 锁定失败（如权限问题），回退到 CSS 方案
                toggleCssLandscape();
            });
        }).catch(err => {
            // 全屏失败，回退到 CSS 方案
            toggleCssLandscape();
        });
    } else {
        // 2. iOS/不支持原生的设备：使用 CSS 强制旋转 (触控方向会反)
        toggleCssLandscape();
    }

    // 内部工具函数：执行 CSS 旋转类切换
    function toggleCssLandscape() {
        const isLandscape = document.body.classList.toggle('is-landscape');
        
        // 提示 iOS 用户
        if(isLandscape && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            // 您可以用一个更好看的 toast 替代 alert，或者删掉这行
            // alert("提示：iOS强制横屏下，滑动方向可能会翻转，请以实际体验为准。");
        }

        // 重绘地图，防止灰屏
        setTimeout(() => {
            if (typeof map !== 'undefined' && map) {
                map.invalidateSize();
            }
        }, 350);
    }
};

// ————————防盗措施————————//
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