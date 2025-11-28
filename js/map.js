// ================= 地图与新模态框逻辑 =================

let map;
let layerGroups = {};
let currentImageBase64 = "";

const MARKER_TYPES = {
    'orb': { label: '灵珠', icon: 'circle', class: 'icon-orb' },
    'chest': { label: '宝箱', icon: 'box-open', class: 'icon-chest' },
    'teleport': { label: '传送点', icon: 'dungeon', class: 'icon-teleport' },
    'user': { label: '野外boss', icon: 'location-dot', class: 'icon-user' }
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

    map = L.map('map-container', { crs: L.CRS.Simple, minZoom: -2, zoomControl: false, attributionControl: false });
    const bounds = [[0,0], [1000,1000]];
    
    // ⚠️ 确保 assets 文件夹下有图片，或者修改路径
    // 如果没有图片，背景会是蓝色，这是正常的
    L.imageOverlay('assets/山海大陆地图.png', bounds).addTo(map); 
    map.fitBounds(bounds);
    
    Object.keys(MARKER_TYPES).forEach(k => layerGroups[k] = L.layerGroup().addTo(map));
    initialMapData.forEach(d => renderMarker(d)); 
    loadUserMarkers();

    map.on('click', (e) => openModal({lat: e.latlng.lat, lng: e.latlng.lng, id:'', name:'', type:'user', desc:'', img:''}));
}

function renderMarker(data) {
    removeMarkerFromMap(data.id);
    const config = MARKER_TYPES[data.type] || MARKER_TYPES['user'];
    const icon = L.divIcon({
        html: `<i class="fa-solid fa-${config.icon}"></i>`,
        className: `icon-base ${config.class}`,
        iconSize: [30, 30], iconAnchor: [15, 15]
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