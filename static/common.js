// 加载侧边栏
async function loadSidebar() {
    try {
        const response = await fetch('sidebar.html');
        const html = await response.text();
        document.getElementById('sidebar-container').innerHTML = html;
        
        // 设置当前页面的导航项为激活状态
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        setActiveNavItem(currentPage);
        
        // 从localStorage恢复侧边栏状态
        const sidebarState = localStorage.getItem('sidebarState');
        if (sidebarState === 'collapsed') {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('main-content');
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }
    } catch (error) {
        console.error('加载侧边栏失败:', error);
    }
}

// 设置当前激活的导航项
function setActiveNavItem(currentPage) {
    // 移除所有激活状态
    document.querySelectorAll('.sidebar-nav li').forEach(item => {
        item.classList.remove('active');
    });
    
    // 设置当前页面的导航项为激活状态
    let activeNavId = 'nav-stock-query'; // 默认为股票查询页
    
    // 根据当前页面路径设置激活项
    switch(currentPage) {
        case 'index.html':
            activeNavId = 'nav-stock-query';
            break;
        case 'analysis.html':
            activeNavId = 'nav-data-analysis';
            break;
        case 'volume.html':
            activeNavId = 'nav-volume-sort';
            break;
        case 'industry_volume':
        case 'industry_volume.html':
            // 为行业成交量页面添加处理
            document.querySelector('a[href="/industry_volume"]')
                ?.parentElement?.classList.add('active');
            return; // 直接返回，不执行后面的代码
    }
    
    const activeNav = document.getElementById(activeNavId);
    if (activeNav) {
        activeNav.parentElement.classList.add('active');
    }
}

// 切换侧边栏
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    
    // 保存侧边栏状态到localStorage
    localStorage.setItem('sidebarState', 
        sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded'
    );
}

// 切换侧边栏显示状态
function toggleSidebar() {
    const wrapper = document.querySelector('.wrapper');
    wrapper.classList.toggle('sidebar-collapsed');
    
    // 触发自定义事件
    const event = new Event('sidebarToggle');
    document.dispatchEvent(event);
}

// 当DOM加载完成时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadSidebar().then(() => {
        // 获取当前页面路径
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        setActiveNavItem(currentPage);
        
        // 从localStorage恢复侧边栏状态
        const sidebarState = localStorage.getItem('sidebarState');
        if (sidebarState === 'collapsed') {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('main-content');
            if (sidebar && mainContent) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
            }
        }
    });
}); 