let currentPage = 1;
let totalPages = 1;
let totalRecords = 0;
let pageSize = 100;

// 当前排序状态
let currentSort = {
    column: 'trade_date',  // 设置默认排序列
    direction: 'desc'      // 设置默认排序方向为降序
};

// 格式化金额
function formatAmount(amount) {
    if (!amount) return '-';
    if (amount >= 100000000) {
        return (amount / 100000000).toFixed(2) + '亿';
    } else if (amount >= 10000) {
        return (amount / 10000).toFixed(2) + '万';
    }
    return amount.toFixed(2);
}

// 获取涨跌幅样式
function getPctChgClass(pctChg) {
    if (!pctChg) return '';
    return pctChg > 0 ? 'price-up' : pctChg < 0 ? 'price-down' : '';
}

// 显示加载动画
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// 隐藏加载动画
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// 格式化日期
function formatDate(dateStr) {
    if (!dateStr) return '-';
    return dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8);
}

// 搜索股票
async function searchStocks() {
    showLoading();
    try {
        const stockCode = document.getElementById('stockCode').value.trim();
        const stockName = document.getElementById('stockName').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        console.log('发送查询请求:', {
            stockCode,
            stockName,
            startDate,
            endDate,
            page: currentPage,
            pageSize,
            sortColumn: currentSort.column,
            sortOrder: currentSort.direction.toUpperCase()
        });

        const response = await fetch('/api/stocks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                stockCode,
                stockName,
                startDate,
                endDate,
                page: currentPage,
                pageSize,
                sortColumn: currentSort.column,
                sortOrder: currentSort.direction.toUpperCase()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('收到响应数据:', result);

        if (!result.success) {
            throw new Error(result.message || '查询失败');
        }

        if (!result.data || !result.data.records) {
            throw new Error('返回的数据格式不正确');
        }

        totalRecords = result.data.total;
        totalPages = Math.ceil(totalRecords / pageSize);
        displayStockData(result.data.records);
        updatePagination();
    } catch (error) {
        console.error('查询出错:', error);
        alert('查询失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 更新表格
function updateTable(stocks) {
    window.currentStockData = stocks; // 保存当前数据用于排序
    displayStockData(stocks);
}

// 更新分页
function updatePagination() {
    document.getElementById('currentPage').textContent = `第${currentPage}页 / 共${totalPages}页`;
    document.getElementById('prevButton').disabled = currentPage === 1;
    document.getElementById('nextButton').disabled = currentPage === totalPages;
}

// 上一页
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        searchStocks();
    }
}

// 下一页
function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        searchStocks();
    }
}

// 导出Excel
function exportToExcel() {
    const table = document.getElementById('stockTable');
    let csv = [];
    
    // 获取表头
    const headers = [];
    table.querySelectorAll('th').forEach(th => {
        headers.push(th.textContent);
    });
    csv.push(headers.join(','));
    
    // 获取数据
    table.querySelectorAll('tbody tr').forEach(tr => {
        const row = [];
        tr.querySelectorAll('td').forEach(td => {
            row.push(td.textContent);
        });
        csv.push(row.join(','));
    });
    
    // 创建下载链接
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `股票数据_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// 刷新数据
function refreshData() {
    searchStocks();
}

// 控制侧边栏显示/隐藏
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleBtn = document.querySelector('.toggle-btn i');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    
    // 更新按钮图标
    if (sidebar.classList.contains('collapsed')) {
        toggleBtn.classList.remove('fa-bars');
        toggleBtn.classList.add('fa-times');
    } else {
        toggleBtn.classList.remove('fa-times');
        toggleBtn.classList.add('fa-bars');
    }
}

// 页面加载完成后设置默认日期
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    document.getElementById('startDate').value = lastMonth.toISOString().split('T')[0];
    initTableSort();
});

// 初始化表格排序
function initTableSort() {
    const headers = document.querySelectorAll('#stockTable th[data-sort]');
    
    // 设置初始排序图标
    const tradeDateHeader = Array.from(headers).find(header => header.dataset.sort === 'trade_date');
    if (tradeDateHeader) {
        const icon = tradeDateHeader.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-sort-down';
        }
    }
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            handleSort(column, header);
            // 触发重新查询
            searchStocks();
        });
    });
}

// 处理排序
function handleSort(column, header) {
    // 更新排序图标
    const allIcons = document.querySelectorAll('#stockTable th i');
    allIcons.forEach(icon => {
        icon.className = 'fas fa-sort';
    });

    // 确定排序方向
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'desc'; // 新列默认降序
    }

    // 更新当前排序图标
    const icon = header.querySelector('i');
    icon.className = currentSort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
}

// 显示股票数据
function displayStockData(data) {
    const tbody = document.getElementById('stockTableBody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="11" class="no-data">没有找到匹配的数据</td>';
        tbody.appendChild(tr);
        return;
    }

    data.forEach(stock => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(stock.trade_date)}</td>
            <td>${stock.ts_code}</td>
            <td>${stock.name}</td>
            <td>${stock.open?.toFixed(2) || '-'}</td>
            <td>${stock.close?.toFixed(2) || '-'}</td>
            <td>${stock.high?.toFixed(2) || '-'}</td>
            <td>${stock.low?.toFixed(2) || '-'}</td>
            <td>${formatAmount(stock.vol)}</td>
            <td>${formatAmount(stock.amount)}</td>
            <td class="${getPctChgClass(stock.pct_chg)}">${stock.pct_chg?.toFixed(2) || '-'}%</td>
            <td>${stock.amount_rank || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
} 