// ================= 地图与新模态框逻辑 =================

let map;
let layerGroups = {};
let currentImageBase64 = "";

const MARKER_TYPES = {
    'orb': { label: '灵珠', img: 'assets/orb.png', class: 'icon-orb' },
    'chest': { label: '宝箱', img: 'assets/chest.png', class: 'icon-chest' },
    'teleport': { label: '传送点', img: 'assets/teleport.png', class: 'icon-teleport' },
    'user': { label: '野外boss', img: 'assets/user.png', class: 'icon-user' }
};
const initialMapData = [ {id: 'sys_t1', lat: 70, lng: 770, type: 'teleport', name: '初始之地', desc: '世界的中心'} ];
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
        minZoom: -2, 
        zoomControl: false, 
        attributionControl: false 
    });
    
    // 设置地图边界和图片
    const bounds = [[0,0], [1000,1000]];
    // ⚠️ 请确保 assets 文件夹下有 '山海大陆地图.png'
    L.imageOverlay('assets/山海大陆地图.png', bounds).addTo(map); 
    
    // ✅ 设置默认视图：中心点 [500, 500]，缩放等级 1 (放大效果)
    map.setView([150, 680], 1); 

    // 初始化图层组
    Object.keys(MARKER_TYPES).forEach(k => layerGroups[k] = L.layerGroup().addTo(map));
    
    // 渲染标记
    initialMapData.forEach(d => renderMarker(d)); 
    loadUserMarkers();

    // 点击地图空白处添加标记
    map.on('click', (e) => openModal({lat: e.latlng.lat, lng: e.latlng.lng, id:'', name:'', type:'user', desc:'', img:''}));
}

function renderMarker(data) {
    removeMarkerFromMap(data.id);
    const config = MARKER_TYPES[data.type] || MARKER_TYPES['user'];
    const icon = L.divIcon({
        html: `<img src="${config.img}" style="width:100%; height:100%; object-fit:contain;">`,        className: `icon-base ${config.class}`, // 保留 icon-base 用于做鼠标悬停变大特效
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
        if (map.hasLayer(layerGroups[type])) { map.removeLayer(layerGroups[type]); btn.classList.remove('active'); btn.style.opacity = '0.5'; } 
        else { map.addLayer(layerGroups[type]); btn.classList.add('active'); btn.style.opacity = '1'; }
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
    
    if (currentImageBase64) { imgPreview.src = currentImageBase64; imgPreview.style.display = 'block'; } 
    else { imgPreview.style.display = 'none'; }
    imgInput.value = ''; 
    document.getElementById('btn-delete').style.display = data.id ? 'block' : 'none';
    modalOverlay.classList.add('open');
}

function closeModal() { modalOverlay.classList.remove('open'); }

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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch (e) { alert("存储空间已满"); }
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