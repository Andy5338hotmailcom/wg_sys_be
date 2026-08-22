// ==============================
// 全局窗口焦点、层级管理
// ==============================
let maxZIndex = 1000;
let activeWindowDom = null;

/**
 * 将指定窗口置顶并设为激活焦点
 * @param {HTMLElement} winDom 窗口DOM对象
 */
function bringWindowToTop(winDom) {
    if (activeWindowDom) {
        activeWindowDom.classList.remove("win-focus");
    }
    maxZIndex++;
    winDom.style.zIndex = maxZIndex;
    winDom.classList.add("win-focus");
    activeWindowDom = winDom;
}

// ==============================
// 应用列表
// ==============================
const DEFAULT_APPS = [
    { id: "appstore", name: "应用商店", icon: "apps/appstore/ico.svg", path: "apps/appstore/index.html" },
    { id: "reg", name: "软件注册表", icon: "apps/reg/ico.png", path: "apps/reg/index.html" },
    { id: "appinstall", name: "wgppp软件安装器", icon: "apps/reg/ico.png", path: "apps/appinstall/index.html" },
    { id: "settings", name: "设置", icon: "apps/settings/ico.svg", path: "apps/settings/index.html" },
    { id: "wgver", name: "关于Wildgoose BE", icon: "icon.png", path: "apps/wgver/index.html" }
];

function getLocalApps() {
    try {
        const local = localStorage.getItem("app_list");
        return local ? JSON.parse(local) : [];
    } catch (e) {
        return [];
    }
}

function mergeAppList() {
    const localApps = getLocalApps();
    const result = [...DEFAULT_APPS];
    for (const app of localApps) {
        if (!app.id) continue;
        const exists = result.some(item => item.id === app.id);
        if (!exists) {
            result.push(app);
        }
    }
    return result;
}

const APP_LIST = mergeAppList();
let currentRightClickApp = null;

if (!localStorage.getItem("fixedApps")) {
    localStorage.setItem("fixedApps", JSON.stringify(["doc", "setting"]));
}
if (!localStorage.getItem("desktopIcons")) {
    localStorage.setItem("desktopIcons", JSON.stringify(["doc", "setting"]));
}

// ==============================
// 渲染桌面图标
// ==============================
function renderDesktopIcons() {
    const container = document.getElementById("desktop-icons");
    container.innerHTML = "";
    const ids = JSON.parse(localStorage.getItem("desktopIcons"));
    ids.forEach(id => {
        const app = APP_LIST.find(a => a.id === id);
        if (!app) return;
        const el = document.createElement("div");
        el.className = "desktop-icon";
        el.innerHTML = `<img src="${app.icon}" alt=""><div>${app.name}</div>`;
        el.ondblclick = () => openApp(app);
        container.appendChild(el);
    });
}

// ==============================
// 渲染任务栏应用图标
// ==============================
function renderTaskbarApps() {
    const taskApps = document.querySelector(".task-apps");
    if (!taskApps) return;
    taskApps.innerHTML = "";
    document.querySelectorAll(".app-window").forEach(win => {
        const appId = win.dataset.id;
        const app = APP_LIST.find(a => a.id === appId);
        if (!app) return;
        const item = document.createElement("div");
        item.className = "task-app-item";
        item.innerHTML = `<img src="${app.icon}">`;
        item.onclick = () => {
            win.style.display = win.style.display === "none" ? "block" : "none";
            if(win.style.display === "block") bringWindowToTop(win);
        };
        taskApps.appendChild(item);
    });
}

// ==============================
// 渲染开始菜单
// ==============================
function renderStartMenu() {
    const fixedIds = JSON.parse(localStorage.getItem("fixedApps"));
    const fixedEl = document.getElementById("fixedApps");
    const allEl = document.getElementById("allApps");
    if (!fixedEl || !allEl) return;

    fixedEl.innerHTML = `<h4>固定应用</h4>`;
    allEl.innerHTML = `<h4>全部应用</h4>`;

    fixedIds.forEach(id => {
        const app = APP_LIST.find(a => a.id === id);
        if (app) fixedEl.appendChild(createAppItem(app));
    });

    APP_LIST.forEach(app => {
        allEl.appendChild(createAppItem(app));
    });
}

// ==============================
// 创建应用项
// ==============================
function createAppItem(app) {
    const item = document.createElement("div");
    item.className = "app-item";
    item.innerHTML = `<img src="${app.icon}"><span>${app.name}</span>`;
    item.onclick = () => {
        openApp(app);
        const menu = document.getElementById("startMenu");
        if (menu) menu.style.display = "none";
        hideContextMenu();
    };
    item.oncontextmenu = (e) => {
        e.preventDefault();
        currentRightClickApp = app;
        showContextMenu(e.clientX, e.clientY);
    };
    return item;
}

// ==============================
// 右键菜单
// ==============================
function createContextMenu() {
    const menu = document.createElement("div");
    menu.id = "customContextMenu";
    menu.style.cssText = `
        position: fixed;
        width: 180px;
        background: #222;
        color: white;
        border-radius: 10px;
        padding: 6px 0;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 99999;
        display: none;
    `;
    document.body.appendChild(menu);
}

function showContextMenu(x, y) {
    const menu = document.getElementById("customContextMenu");
    if (!menu || !currentRightClickApp) return;
    menu.innerHTML = "";

    const fixedStartList = JSON.parse(localStorage.getItem("fixedApps"));
    const desktopList = JSON.parse(localStorage.getItem("desktopIcons"));
    const isFixedStart = fixedStartList.includes(currentRightClickApp.id);
    const isFixedDesktop = desktopList.includes(currentRightClickApp.id);

    const menuItems = [
        { text: "打开", action: "open" },
        isFixedStart
            ? { text: "从“开始”取消固定", action: "unfixStart" }
            : { text: "固定到开始", action: "fixStart" },
        isFixedDesktop
            ? { text: "从桌面取消固定", action: "unfixDesktop" }
            : { text: "固定到桌面", action: "fixDesktop" }
    ];

    menuItems.forEach(it => {
        const div = document.createElement("div");
        div.innerText = it.text;
        div.style.padding = "8px 14px";
        div.style.cursor = "pointer";
        div.style.fontSize = "14px";
        div.onclick = () => {
            if (it.action === "open" && currentRightClickApp) openApp(currentRightClickApp);
            if (it.action === "fixStart" && currentRightClickApp) toggleFixed(currentRightClickApp.id, true);
            if (it.action === "unfixStart" && currentRightClickApp) toggleFixed(currentRightClickApp.id, false);
            if (it.action === "fixDesktop" && currentRightClickApp) toggleDesktopPin(currentRightClickApp.id, true);
            if (it.action === "unfixDesktop" && currentRightClickApp) toggleDesktopPin(currentRightClickApp.id, false);

            hideContextMenu();
            const menu = document.getElementById("startMenu");
            if (menu) menu.style.display = "none";
        };
        div.onmouseover = () => div.style.background = "rgba(255,255,255,0.1)";
        div.onmouseout = () => div.style.background = "transparent";
        menu.appendChild(div);
    });

    // 边界避让，防止菜单超出屏幕
    let posX = x;
    let posY = y;
    const rect = menu.getBoundingClientRect();
    if (posX + rect.width > window.innerWidth) posX = window.innerWidth - rect.width - 10;
    if (posY + rect.height > window.innerHeight) posY = window.innerHeight - rect.height - 10;

    menu.style.left = posX + "px";
    menu.style.top = posY + "px";
    menu.style.display = "block";
}

function hideContextMenu() {
    const menu = document.getElementById("customContextMenu");
    if (menu) menu.style.display = "none";
}

// 固定/取消固定【开始菜单】原有函数
function toggleFixed(appId, isFix) {
    let fixed = JSON.parse(localStorage.getItem("fixedApps"));
    if (isFix) {
        if (!fixed.includes(appId)) fixed.push(appId);
    } else {
        fixed = fixed.filter(id => id !== appId);
    }
    localStorage.setItem("fixedApps", JSON.stringify(fixed));
    renderStartMenu();
}

// 固定/取消固定【桌面】新增镜像函数
function toggleDesktopPin(appId, isFix) {
    let list = JSON.parse(localStorage.getItem("desktopIcons"));
    if (isFix) {
        if (!list.includes(appId)) list.push(appId);
    } else {
        list = list.filter(id => id !== appId);
    }
    localStorage.setItem("desktopIcons", JSON.stringify(list));
    renderDesktopIcons();
}

// ==============================
// 搜索
// ==============================
function bindSearch() {
    const search = document.getElementById("appSearch");
    if (!search) return;
    search.oninput = () => {
        const key = search.value.toLowerCase();
        const allEl = document.getElementById("allApps");
        if (!allEl) return;
        allEl.innerHTML = `<h4>全部应用</h4>`;
        APP_LIST.forEach(app => {
            if (app.name.toLowerCase().includes(key)) allEl.appendChild(createAppItem(app));
        });
    };
}

// ==============================
// 打开应用（已修复iframe内部点击无法置顶问题）
// ==============================
function openApp(app) {
    const container = document.getElementById("window-container");
    if (!container) return;

    const exists = document.querySelector(`.app-window[data-id="${app.id}"]`);
    if (exists) {
        exists.style.display = "block";
        bringWindowToTop(exists);
        renderTaskbarApps();
        return;
    }

    const win = document.createElement("div");
    win.className = "app-window";
    win.dataset.id = app.id;
    win.style.left = "100px";
    win.style.top = "100px";

    win.innerHTML = `
        <div class="window-header">
            <div>${app.name}</div>
            <div class="window-actions">
                <button class="minimize">—</button>
                <button class="maximize">□</button>
                <button class="close">×</button>
            </div>
        </div>
        <iframe src="${app.path}"></iframe>
    `;

    container.appendChild(win);
    makeWindowDraggable(win);
    bindWindowActions(win);
    renderTaskbarApps();
    bringWindowToTop(win);

    // 点击窗口外层（标题栏、边框）置顶
    win.addEventListener("mousedown", () => {
        bringWindowToTop(win);
    })
    // iframe 加载完成后，监听内部点击实现置顶
    const iframe = win.querySelector("iframe");
    iframe.addEventListener("load", ()=>{
        iframe.contentWindow.addEventListener("mousedown", ()=>{
            bringWindowToTop(win);
        })
    })
}

// ==============================
// 窗口拖动
// ==============================
function makeWindowDraggable(win) {
    const header = win.querySelector(".window-header");
    if (!header) return;
    header.addEventListener("mousedown", function (e) {
        if (win.classList.contains("maximized")) return;
        const rect = win.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        function move(e) {
            win.style.left = e.clientX - offsetX + "px";
            win.style.top = e.clientY - offsetY + "px";
        }
        function stop() {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", stop);
        }
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
        e.preventDefault();
    });
}

// ==============================
// 窗口按钮
// ==============================
function bindWindowActions(win) {
    const minBtn = win.querySelector(".minimize");
    const maxBtn = win.querySelector(".maximize");
    const closeBtn = win.querySelector(".close");

    let oldWinStyle = {};

    if (minBtn) minBtn.onclick = () => {
        win.style.display = "none";
        renderTaskbarApps();
    };
    if (maxBtn) maxBtn.onclick = () => {
        win.classList.toggle("maximized");
        bringWindowToTop(win);
        if(win.classList.contains("maximized")){
            oldWinStyle = {
                width: win.style.width,
                height: win.style.height,
                left: win.style.left,
                top: win.style.top
            };
            const taskbar = document.querySelector(".taskbar");
            const taskHeight = taskbar.offsetHeight;
            win.style.width = "100vw";
            win.style.height = `calc(100vh - ${taskHeight}px)`;
            win.style.left = "0";
            win.style.top = "0";
        }else{
            win.style.width = oldWinStyle.width;
            win.style.height = oldWinStyle.height;
            win.style.left = oldWinStyle.left;
            win.style.top = oldWinStyle.top;
        }
    };
    if (closeBtn) closeBtn.onclick = () => {
        win.remove();
        renderTaskbarApps();
    };
}

// ==============================
// 窗口缩放
// ==============================
function enableWindowResize() {
    document.addEventListener('mousedown', function (e) {
        const win = e.target.closest('.app-window');
        if (!win || win.classList.contains('maximized')) return;
        const rect = win.getBoundingClientRect();
        const edge = 8;
        let mode = '';
        if (e.clientX > rect.right - edge) mode = 'e';
        if (e.clientY > rect.bottom - edge) mode += 's';
        if (mode === '') return;
        document.onmousemove = (ev) => {
            let w = parseInt(win.style.width) || 600;
            let h = parseInt(win.style.height) || 400;
            if (mode.includes('e')) w = ev.clientX - rect.left + 10;
            if (mode.includes('s')) h = ev.clientY - rect.top + 10;
            win.style.width = Math.max(300, w) + 'px';
            win.style.height = Math.max(200, h) + 'px';
        };
        document.onmouseup = () => {
            document.onmousemove = null;
            document.onmouseup = null;
        };
    });
}

// ==============================
// 时钟
// ==============================
function updateTime() {
    const timeEl = document.getElementById("time");
    if (timeEl) timeEl.innerText = new Date().toLocaleTimeString();
}

// ==============================
// 关机 / 重启 / 注销 / 刷新桌面
// ==============================
function shutdown() { location.href = "shutdown.html"; }
function restart() { location.href = "restart.html"; }
function logout() { location.href = "logout.html"; }
function desktopreflash() { location.href = "desktop.html"; }

// ==============================
// 页面加载入口
// ==============================
window.onload = () => {
    createContextMenu();
    renderDesktopIcons();
    renderTaskbarApps();
    bindSearch();
    enableWindowResize();

    const desktopBg = document.querySelector(".desktop-bg");
    if(desktopBg){
        desktopBg.addEventListener("mousedown", (e) => {
            if (e.target.closest(".app-window")) return;
            if (activeWindowDom) {
                activeWindowDom.classList.remove("win-focus");
                activeWindowDom = null;
            }
        })
    }

    const showDesktop = document.querySelector(".show-desktop");
    if (showDesktop) {
        showDesktop.onclick = () => {
            document.querySelectorAll(".app-window").forEach(win => win.style.display = "none");
            const menu = document.getElementById("startMenu");
            if (menu) menu.style.display = "none";
            hideContextMenu();
            renderTaskbarApps();
        };
    }

    const startBtn = document.querySelector(".start-btn");
    if (startBtn) {
        startBtn.onclick = () => {
            const menu = document.getElementById("startMenu");
            if (!menu) return;
            menu.style.display = menu.style.display === "block" ? "none" : "block";
            hideContextMenu();
            renderStartMenu();
        };
    }

    document.onclick = hideContextMenu;

    updateTime();
    setInterval(updateTime, 1000);
};

// ==============================
// 【修复版】提供给iframe子页面调用：通过appId打开应用（实时读取已安装应用）
// ==============================
window.openAppById = function (appId) {
    // ✅ 每次打开都重新合并默认+本地安装应用，获取最新列表
    function getLocalApps() {
        try {
            const local = localStorage.getItem("app_list");
            return local ? JSON.parse(local) : [];
        } catch (e) {
            return [];
        }
    }
    function mergeAppList() {
        const localApps = getLocalApps();
        const result = [...DEFAULT_APPS];
        for (const app of localApps) {
            if (!app.id) continue;
            const exists = result.some(item => item.id === app.id);
            if (!exists) {
                result.push(app);
            }
        }
        return result;
    }
    const latestAppList = mergeAppList();
    const app = latestAppList.find(item => item.id === appId);
    if (!app) {
        console.warn("不存在该应用id：", appId);
        alert("系统未找到该应用，请确认已安装！");
        return;
    }
    openApp(app);
};

// ==============================
// 【新增】postMessage 接收子页面打开应用请求（解决file跨域拦截）
// ==============================
window.addEventListener("message", function (e) {
    const data = e.data;
    if (data && data.action === "openApp" && data.appId) {
        // 每次实时合并最新应用列表
        function getLocalApps() {
            try {
                const local = localStorage.getItem("app_list");
                return local ? JSON.parse(local) : [];
            } catch (e) {
                return [];
            }
        }
        function mergeAppList() {
            const localApps = getLocalApps();
            const result = [...DEFAULT_APPS];
            for (const app of localApps) {
                if (!app.id) continue;
                const exists = result.some(item => item.id === app.id);
                if (!exists) {
                    result.push(app);
                }
            }
            return result;
        }
        const latestAppList = mergeAppList();
        const app = latestAppList.find(item => item.id === data.appId);
        if (!app) {
            console.warn("不存在该应用id：", data.appId);
            alert("系统未找到该应用，请确认已安装！");
            return;
        }
        openApp(app);
    }
});