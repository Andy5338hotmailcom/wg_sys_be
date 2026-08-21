// ==============================
// Wildgoose OS 文件系统内核
// 虚拟路径 + 保护机制 + 桌面联动
// ==============================
const WGFS = {
    // 固定路径
    PATHS: {
        SYSTEM: "C:/Wildgoose/System",
        APPS: "C:/Wildgoose/Programs",
        DESKTOP: "C:/Users/Administrator/Desktop",
        DOCUMENTS: "C:/Users/Administrator/Documents"
    },

    // 受保护的路径（不可删除）
    PROTECTED: [
        "C:/Wildgoose",
        "C:/Wildgoose/System",
        "C:/Wildgoose/Programs",
        "C:/Users",
        "C:/Users/Administrator"
    ],

    // 初始化文件系统
    init() {
        if (!localStorage.wgfs) {
            const defaultFiles = [
                // 桌面默认图标
                { name: "此电脑", type: "folder", path: this.PATHS.DESKTOP, target: "explorer" },
                { name: "软件商店", type: "app", path: this.PATHS.DESKTOP, target: "store.html" },
                { name: "wgver", type: "app", path: this.PATHS.DESKTOP, target: "wgver.html" },
                { name: "回收站", type: "folder", path: this.PATHS.DESKTOP, target: "recycle" },

                // 系统保护文件
                { name: "内核文件", type: "txt", path: this.PATHS.SYSTEM, content: "Wildgoose 系统核心" },
                { name: "启动项", type: "txt", path: this.PATHS.SYSTEM, content: "系统启动配置" }
            ];
            localStorage.wgfs = JSON.stringify(defaultFiles);
        }
    },

    // 获取所有文件
    getAll() {
        return JSON.parse(localStorage.wgfs || "[]");
    },

    // 保存文件列表
    save(files) {
        localStorage.wgfs = JSON.stringify(files);
    },

    // 判断路径是否受保护
    isProtected(path) {
        return this.PROTECTED.some(p => path.startsWith(p));
    },

    // 获取某个目录下的文件
    getDir(path) {
        return this.getAll().filter(f => f.path === path);
    },

    // 删除文件/文件夹（智能保护）
    delete(targetPath, isFolder = false) {
        let files = this.getAll();
        let protectedItems = [];
        let deletable = [];

        for (let f of files) {
            const fullPath = f.path + "/" + f.name;
            const inTarget = fullPath.startsWith(targetPath);

            if (inTarget && this.isProtected(f.path)) {
                protectedItems.push(f);
            } else if (!inTarget) {
                protectedItems.push(f);
            } else {
                deletable.push(f);
            }
        }

        this.save(protectedItems);
        return deletable.length;
    }
};

// 初始化文件系统
WGFS.init();

// 桌面联动：渲染桌面图标
function renderDesktopIcons() {
    const desktop = document.getElementById("desktop-icons");
    if (!desktop) return;

    desktop.innerHTML = "";
    const icons = WGFS.getDir(WGFS.PATHS.DESKTOP);

    icons.forEach(icon => {
        const div = document.createElement("div");
        div.className = "desktop-icon";
        div.innerText = icon.name;
        div.dataset.target = icon.target || "";
        div.dataset.type = icon.type;
        desktop.appendChild(div);
    });
}

// 页面加载时自动渲染桌面
window.onload = function () {
    if (window.location.pathname.includes("desktop.html")) {
        renderDesktopIcons();
    }
};