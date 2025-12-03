const ELEMENT_ICONS = {
    '金': '<img src="assets/metal.png" width="20">',
    '木': '<img src="assets/wood.png" width="20">',
    '土': '<img src="assets/earth.png" width="20">',
    '水': '<img src="assets/water.png" width="20">',
    '火': '<img src="assets/fire.png" width="20">',
    '冰': '<img src="assets/Ice.png" width="20">',
    '龙': '<img src="assets/dragon.png" width="20">',
    '妖': '<img src="assets/yao.png" width="20">',
    '无': '<img src="assets/none.png" width="20">',



    // ... 其他属性
};

// ================= 数据中心 =================

// ⚠️ 注意：这里我仅展示了部分数据，请将原文件中的完整数组复制过来
const spirits = [
            {"id": "001", "name": "菜叶鸡", "el": "木", "job": "辅助", "tags": ["牧场Lv1"], "desc": "身躯浑圆，静静地卧在绿叶之间，像极了一颗新鲜的大白菜；其鸡蛋质地细腻，富含维生素和蛋白质，入口味道美妙"},
            {"id": "002", "name": "略略汪", "el": "无", "job": "辅助", "tags": ["手工Lv1", "伐木Lv1", "搬运Lv1"], "desc": "很常见的啾灵，吐舌头是标志性表情"},
            {"id": "003", "name": "罗汉鼠", "el": "土", "job": "输出", "tags": ["手工Lv1", "矿Lv1"], "desc": "会沉迷重复性工作，脾气差；若打断它做事，会凶狠咆哮并挥起愤怒的小拳头"},
            {"id": "004", "name": "绒绒羊", "el": "无", "job": "辅助", "tags": ["牧场Lv1"], "desc": "沾了水会移动困难；路边常见躺着不动的绒绒羊，非懒，而是等待太阳晒干自己"},
            {"id": "005", "name": "松松鱼", "el": "水", "job": "输出", "tags": ["浇水Lv1"], "desc": "生活在浅海区域，两颗门牙极抢眼；因眼神不好，常无法分辨咬的是贝壳还是石头"},
            {"id": "006", "name": "梦云妖", "el": "妖", "job": "辅助", "tags": ["手工Lv1", "伐木Lv1", "搬运Lv1"], "desc": "可爱的外形和软萌的表情具有相当大的迷惑性"},
            {"id": "007", "name": "星汪汪", "el": "无", "job": "输出", "tags": ["手工Lv1", "采矿Lv1", "搬运Lv1"], "desc": "眼中闪烁着好奇与热情，性格温顺却充满活力"},
            {"id": "008", "name": "南瓜猴", "el": "木", "job": "输出", "tags": ["手工Lv1", "伐木Lv1", "播种Lv1"], "desc": "传说南瓜猴是播种女神创造的啾灵"},
            {"id": "009", "name": "陶陶鹿", "el": "无", "job": "坦克", "tags": ["采矿Lv1", "搬运Lv1"], "desc": "喜欢呆着一动不动，总让人误以为它是一件易碎的装饰品"}
        ];

const recipes = [
    { name: "初级啾灵葫芦", type: "消耗", lv: 5, mat: "1星叶石, 6木材, 3石头" },
    { name: "龙马驹的鞍具", type: "鞍具", lv: 7, mat: "20木材, 5纤维" },
    { name: "铁制镐头", type: "工具", lv: 28, mat: "10铁锭, 50石头" },
    { name: "传奇啾灵葫芦", type: "消耗", lv: 50, mat: "6星叶石, 8碳纤维" }
];

// 新闻中心
const newsData = [
    { 
        type: 'update', 
        label: '更新', 
        title: 'v2.1版本发布：新增"山海地图"与"点位标记"功能', 
        date: '11-28',
        url: 'news_v2.1.html' // 指向新的静态页面
    },
    { 
        type: 'event', 
        label: '活动', 
        title: '找老邓寄存啾灵去正式服', 
        date: '11-27',
        url: '#' 
    },
    { 
        type: 'news', 
        label: '新闻', 
        title: '新模式，天空竞技场', 
        date: '11-25',
        url: '#' 
    },
    { 
        type: 'news', 
        label: '新闻', 
        title: '前期开荒注意指南', 
        date: '11-20',
        url: '#' 
    }
];

const guideData = [
    { title: '属性克制表', desc: '金克木，木克土，水克火...', icon: 'fire' },
    { title: '稀有蛋分布', desc: '全地图高阶灵兽点位一览', icon: 'egg' },
    { title: 'BOSS讨伐战', desc: '玄冰白虎无伤通关教学', icon: 'skull' },
    { title: '快速赚钱', desc: '前期如何靠搬运工日入过万', icon: 'coins' }
];
