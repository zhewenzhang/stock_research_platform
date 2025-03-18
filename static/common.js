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
        
        // 检查用户权限并更新导航项显示
        await updateNavigationItems();
        
        // 加载完侧边栏后检查用户权限
        checkPagePermission(currentPage);
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
        case 'settings.html':
            document.getElementById('nav-settings')?.classList.add('active');
            break;
        case 'user_management.html':
            document.getElementById('nav-settings')?.classList.add('active');
            break;
        case 'permission_management.html':
            document.getElementById('nav-settings')?.classList.add('active');
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

// 全局退出登录函数
window.logoutUser = async function() {
    console.log('开始全局退出登录函数...');
    try {
        console.log('正在发送退出请求到 /api/logout');
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin' // 确保包含cookies
        });
        
        console.log('收到响应:', response);
        if (!response.ok) {
            throw new Error(`HTTP错误，状态: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('退出登录响应数据:', result);
        
        if (result.success) {
            console.log('退出成功，即将跳转到登录页...');
            // 使用replace而不是href，避免浏览器历史问题
            window.location.replace('/login.html');
        } else {
            console.error('退出登录响应表明失败:', result);
            alert('退出登录失败，请稍后重试');
        }
    } catch (error) {
        console.error('退出登录过程中发生错误:', error);
        alert('退出登录失败: ' + error.message);
    }
};

// 检查页面访问权限
async function checkPagePermission(pagePath) {
    // 登录页面不需要权限检查
    if (pagePath === 'login.html') {
        return;
    }
    
    try {
        const response = await fetch('/api/current_user');
        const result = await response.json();
        
        if (!result.success || !result.authenticated) {
            // 用户未登录，且当前页不是登录页，跳转到登录页
            window.location.href = '/login.html';
            return;
        }
        
        // 管理员拥有所有权限
        if (result.user.role === 'admin') {
            return;
        }
        
        // 检查普通用户是否有对应页面的权限
        const permissions = result.user.permissions || [];
        
        // 首页不需要权限检查
        if (pagePath === 'index.html' || pagePath === '/') {
            return;
        }
        
        // 检查是否有访问当前页面的权限
        if (!permissions.includes(pagePath)) {
            alert('您没有权限访问此页面');
            window.location.href = '/';
        }
    } catch (error) {
        console.error('检查权限失败:', error);
    }
}

// 更新导航项的显示状态
async function updateNavigationItems() {
    try {
        // 获取当前用户信息
        const response = await fetch('/api/current_user');
        const result = await response.json();
        
        // 处理设置菜单可见性（只对管理员可见）
        const settingsNavItem = document.getElementById('nav-settings')?.parentElement;
        if (settingsNavItem) {
            if (result.success && result.authenticated && result.user.role === 'admin') {
                settingsNavItem.style.display = 'block';
            } else {
                settingsNavItem.style.display = 'none';
            }
        }
        
        // 更新用户信息显示
        const userNotLoggedIn = document.getElementById('userNotLoggedIn');
        const userLoggedIn = document.getElementById('userLoggedIn');
        const userDisplayName = document.getElementById('userDisplayName');
        const userRole = document.getElementById('userRole');
        
        if (result.success && result.authenticated) {
            // 已登录，显示用户信息
            if (userNotLoggedIn) userNotLoggedIn.style.display = 'none';
            if (userLoggedIn) userLoggedIn.style.display = 'block';
            
            // 设置用户名和角色
            if (userDisplayName) userDisplayName.textContent = result.user.username || '未知用户';
            
            if (userRole) {
                const roleMap = {
                    'admin': '管理员',
                    'user': '普通用户',
                    'advanced': '高级用户'
                };
                userRole.textContent = roleMap[result.user.role] || result.user.role || '未知角色';
                
                // 根据用户角色添加不同的样式类
                userRole.className = 'role-badge';
                if (result.user.role === 'admin') {
                    userRole.classList.add('role-admin');
                } else if (result.user.role === 'advanced') {
                    userRole.classList.add('role-advanced');
                } else {
                    userRole.classList.add('role-user');
                }
            }
            
            console.log('已更新用户信息', {
                name: result.user.username,
                role: result.user.role
            });
        } else {
            // 未登录，显示登录按钮
            if (userNotLoggedIn) userNotLoggedIn.style.display = 'block';
            if (userLoggedIn) userLoggedIn.style.display = 'none';
        }
    } catch (error) {
        console.error('更新导航项失败:', error);
    }
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