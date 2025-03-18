// 加载侧边栏
async function loadSidebar() {
    try {
        const response = await fetch('sidebar.html');
        const html = await response.text();
        document.getElementById('sidebar-container').innerHTML = html;
        
        // 获取当前页面路径
        let currentPage = window.location.pathname.split('/').pop() || 'index.html';
        // 如果路径为空，则使用默认值
        if (!currentPage || currentPage === '/') {
            currentPage = 'index.html';
        }
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
    // 移除所有导航项的激活状态
    document.querySelectorAll('.sidebar-nav a').forEach(item => {
        item.classList.remove('active');
    });
    
    // 处理页面路径
    currentPage = currentPage.replace('/', '');  // 移除开头的斜杠
    
    // 根据当前页面设置对应的导航项为激活状态
    switch (currentPage) {
        case 'index.html':
            document.getElementById('nav-stock-query')?.classList.add('active');
            break;
        case 'analysis.html':
            document.getElementById('nav-data-analysis')?.classList.add('active');
            break;
        case 'volume.html':
            document.getElementById('nav-volume-sort')?.classList.add('active');
            break;
        case 'industry_volume':
        case 'industry_volume.html':
            document.getElementById('nav-industry-volume')?.classList.add('active');
            break;
        case 'industry_trend':
        case 'industry_trend.html':
            document.getElementById('nav-industry-trend')?.classList.add('active');
            break;
        case 'industry_metrics':
        case 'industry_metrics.html':
            document.getElementById('nav-industry-metrics')?.classList.add('active');
            break;
        case 'stock_changes':
        case 'stock_changes.html':
            document.getElementById('nav-stock-changes')?.classList.add('active');
            break;
        case 'top_traders':
        case 'top_traders.html':
            document.getElementById('nav-top-traders')?.classList.add('active');
            break;
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