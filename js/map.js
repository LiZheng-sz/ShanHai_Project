// ================= 地图与新模态框逻辑 =================

let map;
let layerGroups = {};
let labelLayerGroup; // 文字标签图层组
let currentImageBase64 = "";

// 新增：缩放阈值常量
const ZOOM_THRESHOLD = 0; // 当地图缩放级别小于等于这个值时显示文字标签

const MARKER_TYPES = {
    'orb': { label: '灵珠', img: 'assets/orb.png', class: 'icon-orb' },
    'chest': { label: '宝箱', img: 'assets/chest.png', class: 'icon-chest' },
    'teleport': { label: '传送点', img: 'assets/teleport.png', class: 'icon-teleport' },
    'user': { label: '野外boss', img: 'assets/user.png', class: 'icon-user' }
};

const initialMapData = [
    // ============ 传送点 ============
    {id: 'sys_t1', lat: 70, lng: 770, type: 'teleport', name: '三绝试炼', desc: '初始之地', img: ''},
    {id: 'sys_t2', lat: 145.5, lng: 599.5, type: 'teleport', name: '第一封印塔', desc: '', img: ''},
    {id: 'sys_t3', lat: 543.5, lng: 376.5, type: 'teleport', name: '第二封印塔', desc: '', img: ''},
    {id: 'sys_t4', lat: 680.5, lng: 589, type: 'teleport', name: '第三封印塔', desc: '', img: ''},
    {id: 'sys_t5', lat: 764, lng: 849, type: 'teleport', name: '第四封印塔', desc: '', img: ''},
    {id: 'sys_t6', lat: 138, lng: 714, type: 'teleport', name: '巨兽领地', desc: '', img: ''},
    {id: 'sys_t7', lat: 177.5, lng: 667, type: 'teleport', name: '金袖君外', desc: '', img: ''},
    {id: 'sys_t8', lat: 173, lng: 755, type: 'teleport', name: '未命名', desc: '', img: ''},
    {id: 'sys_t9', lat: 95.5, lng: 773.5, type: 'teleport', name: '新手村', desc: '', img: ''},

    // ============ 灵珠 ============
    {id: 'sys_orb1', lat: 251.5, lng: 716, type: 'orb', name: '山道2', desc: '', img: ''},

    // ============ 宝箱 ============
    {id: 'sys_chest1', lat: 98, lng: 744.5, type: 'chest', name: '草地', desc: '', img: ''},

    // ============ 野外BOSS ============
    {id: 'sys_boss1', lat: 169.5, lng: 718.5, type: 'user', name: '草猿山', desc: '', img: ''},
    {id: 'sys_boss2', lat: 179.5, lng: 632.5, type: 'user', name: '金袖君', desc: '', img: ''},
    {id: 'sys_boss3', lat: 231.5, lng: 743, type: 'user', name: '锦鹰卫', desc: '', img: ''}
];

// 文字标签数据
const mapLabels = [
    {id: 'sys_label1', lat: 190, lng:670, text: '号角之丘', fontSize: 24, color: '#8B4513', fontWeight: 'bold'},
    {id: 'sys_label2', lat: 370, lng: 560, text: '月升岛', fontSize: 23, color: '#44b4da', fontWeight: 'bold'},
    {id: 'sys_label3', lat: 460, lng: 370, text: '遗秋岛', fontSize: 26, color: '#375480', fontWeight: 'bold'},
    {id: 'sys_label4', lat: 610, lng: 570, text: '鲤越泽', fontSize: 30, color: '#fabc82', fontWeight: 'bold'},
    {id: 'sys_label5', lat: 760, lng: 700, text: '银龙雪山', fontSize: 32, color: '#375480', fontWeight: 'bold'},
    {id: 'sys_label6', lat: 500, lng: 100, text: '溪舟屿',fontSize: 22, color: '#ff69b4', fontWeight: 'bold'},
    // 其他文字标签示例（根据需要取消注释）
];

const STORAGE_KEY = 'shanhai_full_v3';

// 模态框元素引用
const modalOverlay = document.getElementById('marker-modal-overlay');
const imgPreview = document.getElementById('marker-img-preview');
const imgInput = document.getElementById('marker-img-input');

function initMap() {
    // 确保容器存在
    if(!document.getElementById('map-container')) return;

    // 初始化地图对象
    map = L.map('map-container', { 
        crs: L.CRS.Simple, 
        minZoom: -0.5, 
        maxZoom: 2,
        zoomControl: false, 
        attributionControl: false 
    });
    
    // 设置地图边界和图片
    const bounds = [[0,0], [1000,1000]];
    // ⚠️ 请确保 assets 文件夹下有 '山海大陆地图.png'
    L.imageOverlay('assets/山海大陆地图.png', bounds).addTo(map); 
    
    // ✅ 设置默认视图：中心点 [150, 680]，缩放等级 1 (放大效果)
    map.setView([140, 700], 0.8); 

    // 初始化图层组
    Object.keys(MARKER_TYPES).forEach(k => layerGroups[k] = L.layerGroup().addTo(map));
    
    // 新增：初始化文字标签图层组
    labelLayerGroup = L.layerGroup().addTo(map);
    
    // 渲染标记
    initialMapData.forEach(d => renderMarker(d)); 
    loadUserMarkers();
    
    // 新增：监听缩放事件
    map.on('zoomend', handleZoomChange);
    
    // 新增：初始渲染文字标签
    renderMapLabels();
    
    // 初始切换图层显示
    handleZoomChange();

    // 点击地图空白处添加标记
    map.on('click', (e) => openModal({lat: e.latlng.lat, lng: e.latlng.lng, id:'', name:'', type:'user', desc:'', img:''}));
}

// 新增：处理缩放变化的函数
function handleZoomChange() {
    const currentZoom = map.getZoom();
    
    if (currentZoom <= ZOOM_THRESHOLD) {
        // 显示文字标签，隐藏图标标记
        Object.values(layerGroups).forEach(group => map.removeLayer(group));
        if (!map.hasLayer(labelLayerGroup)) {
            map.addLayer(labelLayerGroup);
        }
    } else {
        // 显示图标标记，隐藏文字标签
        Object.values(layerGroups).forEach(group => {
            if (!map.hasLayer(group)) {
                map.addLayer(group);
            }
        });
        if (map.hasLayer(labelLayerGroup)) {
            map.removeLayer(labelLayerGroup);
        }
    }
}

// 新增：渲染文字标签函数
function renderMapLabels() {
    // 清空现有标签
    labelLayerGroup.clearLayers();
    
    // 遍历所有标签数据并创建文字标签
    mapLabels.forEach(label => {
        // 创建自定义的div图标作为文字标签
        const icon = L.divIcon({
            html: `<div style="
                color: ${label.color || '#000000'}; 
                font-size: ${label.fontSize || 12}px; 
                font-weight: ${label.fontWeight || 'normal'}; 
                text-shadow: 1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8);
                white-space: nowrap;
                pointer-events: none;
                user-select: none;
            ">${label.text}</div>`,
            className: 'map-label',
            iconSize: null, // 让divIcon根据内容自动调整大小
            iconAnchor: [0, 0]
        });
        
        // 创建标记（但只显示文字）
        const marker = L.marker([label.lat, label.lng], {
            icon: icon,
            interactive: false // 设置不可交互，避免阻挡地图点击
        }).addTo(labelLayerGroup);
    });
}

function renderMarker(data) {
    removeMarkerFromMap(data.id);
    const config = MARKER_TYPES[data.type] || MARKER_TYPES['user'];
    const icon = L.divIcon({
        html: `<img src="${config.img}" style="width:100%; height:100%; object-fit:contain;">`,
        className: `icon-base ${config.class}`, // 保留 icon-base 用于做鼠标悬停变大特效
        iconSize: [40, 40],   // 调整图标大小
        iconAnchor: [20, 20]  // 锚点设为中心 (大小的一半)
    });
    const marker = L.marker([data.lat, data.lng], { icon: icon }).addTo(layerGroups[data.type]);
    marker.meta = data; 
    
    marker.bindTooltip(`
        <div style="text-align:center">
            <div style="font-weight:bold; color:#d4af37; margin-bottom:2px;">${data.name}</div>
            <div style="font-size:10px; color:#ddd;">${config.label}</div>
            ${data.img ? '<div style="font-size:9px; color:#ffd700; margin-top:2px;"><i class="fa-regular fa-image"></i> 含图片</div>' : ''}
        </div>
    `, { direction: 'top', className: 'custom-tooltip', offset: [0, -20], opacity: 1 });

    marker.on('click', (e) => { L.DomEvent.stopPropagation(e); openModal(data); });
    marker.on('mouseover', () => document.body.classList.add('hovering'));
    marker.on('mouseout', () => document.body.classList.remove('hovering'));
    return marker;
}

function removeMarkerFromMap(id) {
    Object.values(layerGroups).forEach(group => {
        group.eachLayer(layer => { if (layer.meta && layer.meta.id === id) group.removeLayer(layer); });
    });
}

function toggleLayer(type, btn) {
    if (map.hasLayer(layerGroups[type])) { 
        map.removeLayer(layerGroups[type]); 
        btn.classList.remove('active'); 
        btn.style.opacity = '0.5'; 
    } else { 
        map.addLayer(layerGroups[type]); 
        btn.classList.add('active'); 
        btn.style.opacity = '1'; 
    }
}

// ================= 手机端菜单逻辑 =================

function toggleMapControls() {
    const panel = document.getElementById('map-controls');
    // 切换 open 类名来控制显示/隐藏
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
    } else {
        panel.classList.add('open');
    }
}

function openModal(data) {
    document.getElementById('marker-id').value = data.id;
    document.getElementById('marker-lat').value = data.lat;
    document.getElementById('marker-lng').value = data.lng;
    document.getElementById('marker-name').value = data.name;
    document.getElementById('marker-type').value = data.type;
    document.getElementById('marker-desc').value = data.desc || '';
    currentImageBase64 = data.img || '';
    
    if (currentImageBase64) { 
        imgPreview.src = currentImageBase64; 
        imgPreview.style.display = 'block'; 
    } else { 
        imgPreview.style.display = 'none'; 
    }
    imgInput.value = ''; 
    document.getElementById('btn-delete').style.display = data.id ? 'block' : 'none';
    modalOverlay.classList.add('open');
}

function closeModal() { 
    modalOverlay.classList.remove('open'); 
}

function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if(e.total > 500000) console.warn("图片较大");
            currentImageBase64 = e.target.result;
            imgPreview.src = currentImageBase64;
            imgPreview.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function saveMarkerData() {
    const id = document.getElementById('marker-id').value || 'u_' + Date.now();
    const data = {
        id: id,
        lat: parseFloat(document.getElementById('marker-lat').value),
        lng: parseFloat(document.getElementById('marker-lng').value),
        name: document.getElementById('marker-name').value,
        type: document.getElementById('marker-type').value,
        desc: document.getElementById('marker-desc').value,
        img: currentImageBase64
    };
    if(!data.name) return alert("请填写名称");
    saveToStorage(data);
    renderMarker(data);
    closeModal();
}

function deleteCurrentMarker() {
    const id = document.getElementById('marker-id').value;
    if(!id || !confirm("确定删除？")) return;
    removeMarkerFromMap(id);
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    saved = saved.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    closeModal();
}

function saveToStorage(data) {
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const idx = saved.findIndex(m => m.id === data.id);
    if (idx > -1) saved[idx] = data; else saved.push(data);
    try { 
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); 
    } catch (e) { 
        alert("存储空间已满"); 
    }
}

function loadUserMarkers() {
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    saved.forEach(d => renderMarker(d));
}

// ================= 数据导入/导出逻辑 =================

// 1. 导出数据
function exportMapData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data || data === '[]') {
        alert("当前没有标记数据可导出！");
        return;
    }

    // 创建 Blob 对象
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 创建临时下载链接
    const a = document.createElement('a');
    a.href = url;
    // 文件名包含当前时间，方便区分版本
    const date = new Date().toISOString().slice(0, 10);
    a.download = `山海寻灵_地图备份_${date}.json`;
    
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 2. 触发导入（点击隐藏的 input）
function triggerImport() {
    document.getElementById('import-input').click();
}

// 3. 处理导入文件
function importMapData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = e.target.result;
            const parsedData = JSON.parse(json);

            // 简单的数据格式校验
            if (!Array.isArray(parsedData)) {
                throw new Error("格式错误：数据必须是数组");
            }
            if (parsedData.length > 0 && (!parsedData[0].id || !parsedData[0].lat)) {
                throw new Error("格式错误：缺少必要的地图字段");
            }

            // 确认覆盖
            if (!confirm(`读取到 ${parsedData.length} 条标记数据。\n导入将覆盖当前的本地记录，确定继续吗？`)) {
                input.value = ''; // 清空 input 以便下次能选同一个文件
                return;
            }

            // 保存并刷新
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
            
            // 清除地图上现有的所有自定义标记
            Object.values(layerGroups).forEach(group => group.clearLayers());
            
            // 重新加载标记
            // 注意：因为 initialMapData 也会被渲染，所以这里我们只加载用户的
            // 你的 loadUserMarkers 函数会读取 storage 并渲染
            loadUserMarkers(); 
            
            alert("导入成功！");

        } catch (err) {
            alert("导入失败：" + err.message);
            console.error(err);
        }
        // 清空 input，防止选中同一个文件不触发 change
        input.value = '';
    };
    reader.readAsText(file);
}