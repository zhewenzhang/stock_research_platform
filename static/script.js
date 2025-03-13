let currentPage = 1;
let totalPages = 1;
let totalRecords = 0;
let pageSize = 100;

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
        const stockCode = document.getElementById('stockCode').value;
        const stockName = document.getElementById('stockName').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        pageSize = parseInt(document.getElementById('pageSize').value);

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
                sortColumn: 'trade_date',
                sortOrder: 'DESC'
            })
        });

        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }

        totalRecords = data.total;
        totalPages = Math.ceil(totalRecords / pageSize);
        updateTable(data.stocks);
        updatePagination();
    } catch (error) {
        console.error('Error:', error);
        alert('查询失败，请重试');
    } finally {
        hideLoading();
    }
}

// 更新表格
function updateTable(stocks) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    stocks.forEach(stock => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(stock.trade_date)}</td>
            <td>${stock.ts_code || '-'}</td>
            <td>${stock.name || '-'}</td>
            <td>${stock.open?.toFixed(2) || '-'}</td>
            <td>${stock.close?.toFixed(2) || '-'}</td>
            <td>${stock.high?.toFixed(2) || '-'}</td>
            <td>${stock.low?.toFixed(2) || '-'}</td>
            <td>${stock.vol?.toLocaleString() || '-'}</td>
            <td>${formatAmount(stock.amount)}</td>
            <td class="${getPctChgClass(stock.pct_chg)}">${stock.pct_chg?.toFixed(2) || '-'}%</td>
            <td>${stock.amount_rank || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// 更新分页
function updatePagination() {
    document.getElementById('currentPage').textContent = `第${currentPage}页 / 共${totalPages}页`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
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
}); 