let currentPage = 1;
const pageSize = 100;
let totalPages = 1;
let currentData = [];

// 当前排序状态
let currentSort = {
    column: 'amount_rank',  // 默认按成交额排名排序
    direction: 'ASC'  // 默认升序（从小到大）
};

document.addEventListener('DOMContentLoaded', function() {
    loadSidebar();
    
    // 初始化排序图标
    updateSortIcons(currentSort.column);
    
    // 获取最新交易日期
    fetch('/api/latest-trade-date')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const dateInput = document.getElementById('dateInput');
                const latestDate = data.latestDate;
                dateInput.value = `${latestDate.slice(0, 4)}-${latestDate.slice(4, 6)}-${latestDate.slice(6, 8)}`;
                // 自动加载最新日期的数据
                searchStocks();
            }
        })
        .catch(error => {
            console.error('获取最新交易日期失败:', error);
        });
});

function searchStocks() {
    const dateInput = document.getElementById('dateInput');
    const date = dateInput.value;
    
    if (!date) {
        alert('请选择交易日期！');
        return;
    }

    // 转换日期格式从YYYY-MM-DD到YYYYMMDD
    const formattedDate = date.replace(/-/g, '');

    const requestData = {
        tradeDate: formattedDate,
        page: currentPage,
        pageSize: pageSize,
        sortColumn: currentSort.column,
        sortOrder: currentSort.direction
    };

    fetch('/api/stocks/volume', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayStockData(data.data);
        } else {
            alert('查询失败：' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('查询出错，请检查网络连接或稍后重试');
    });
}

function displayStockData(data) {
    const tableBody = document.getElementById('stockTableBody');
    tableBody.innerHTML = '';
    currentData = data.records;
    
    if (!currentData || currentData.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 11;
        cell.className = 'no-data';
        cell.textContent = '没有找到相关数据';
        updatePagination(0, 1);
        return;
    }

    currentData.forEach(stock => {
        const row = tableBody.insertRow();
        
        // 添加单元格
        row.insertCell().textContent = stock.ts_code;
        row.insertCell().textContent = stock.name;
        row.insertCell().textContent = formatDate(stock.trade_date);
        row.insertCell().textContent = formatNumber(stock.open);
        row.insertCell().textContent = formatNumber(stock.close);
        row.insertCell().textContent = formatNumber(stock.high);
        row.insertCell().textContent = formatNumber(stock.low);
        row.insertCell().textContent = formatVolume(stock.vol);
        row.insertCell().textContent = formatAmount(stock.amount);
        
        const changeCell = row.insertCell();
        changeCell.textContent = formatPercentage(stock.pct_chg);
        changeCell.className = stock.pct_chg >= 0 ? 'price-up' : 'price-down';
        
        row.insertCell().textContent = stock.amount_rank;
    });

    // 更新分页信息
    totalPages = Math.ceil(data.total / pageSize);
    updatePagination(data.total, totalPages);
}

function formatNumber(value) {
    if (value === undefined || value === null) return '';
    return value.toFixed(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

function formatVolume(vol) {
    if (vol === undefined || vol === null) return '';
    return (vol / 100).toFixed(2) + '手';
}

function formatAmount(amount) {
    if (amount === undefined || amount === null) return '';
    // 数据库中的成交额单位是千元，需要先转换为元
    amount = amount * 1000;
    if (amount >= 100000000) {
        return (amount / 100000000).toFixed(2) + '亿';
    } else if (amount >= 10000) {
        return (amount / 10000).toFixed(2) + '万';
    }
    return amount.toFixed(2);
}

function formatPercentage(value) {
    if (value === undefined || value === null) return '';
    return value.toFixed(2) + '%';
}

function updatePagination(total, totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页 (总记录数: ${total})`;
    
    document.getElementById('prevButton').disabled = currentPage === 1;
    document.getElementById('nextButton').disabled = currentPage === totalPages;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        searchStocks();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        searchStocks();
    }
}

function sortTable(column) {
    // 更新排序状态
    if (currentSort.column === column) {
        // 如果点击的是当前排序列，则切换排序方向
        currentSort.direction = currentSort.direction === 'ASC' ? 'DESC' : 'ASC';
    } else {
        // 如果点击的是新列，则设置为升序（从小到大）
        currentSort.column = column;
        currentSort.direction = 'ASC';
    }

    // 更新表头图标
    updateSortIcons(column);
    
    // 重新加载数据
    currentPage = 1;
    searchStocks();
}

function updateSortIcons(column) {
    // 重置所有图标
    document.querySelectorAll('th i.fas').forEach(icon => {
        icon.className = 'fas fa-sort';
    });

    // 设置当前排序列的图标
    const th = document.querySelector(`th[onclick="sortTable('${column}')"]`);
    if (th) {
        const icon = th.querySelector('i');
        if (icon) {
            icon.className = `fas fa-sort-${currentSort.direction.toLowerCase()}`;
        }
    }
} 