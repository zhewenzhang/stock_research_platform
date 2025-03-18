// 格式化数值
function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined) return '-';
    return Number(value).toFixed(decimals);
}

// 获取并显示数据
async function fetchAndDisplayData() {
    try {
        const dateInput = document.getElementById('dateInput');
        const date = dateInput.value?.replace(/-/g, '');
        
        const response = await fetch(`/api/top_traders${date ? `?date=${date}` : ''}`);
        const result = await response.json();
        
        if (result.success) {
            // 更新日期选择器（如果未选择日期）
            if (!date && result.trade_date) {
                dateInput.value = result.trade_date;
            }
            
            // 更新买入龙虎榜
            updateTable('buyTable', result.data.buyData);
            
            // 更新卖出龙虎榜
            updateTable('sellTable', result.data.sellData, false);
        } else {
            alert('获取数据失败：' + result.message);
        }
    } catch (error) {
        console.error('请求失败:', error);
        alert('请求失败：' + error.message);
    }
}

// 更新表格
function updateTable(tableId, data, isBuy = true) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center;">暂无数据</td>`;
        tbody.appendChild(row);
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        
        if (isBuy) {
            row.innerHTML = `
                <td>${item.rank}</td>
                <td>${item.tsCode}</td>
                <td>${item.name || '-'}</td>
                <td>${formatNumber(item.buyAmount)}</td>
                <td>${formatNumber(item.buyRate)}</td>
                <td>${item.exalter || '-'}</td>
            `;
        } else {
            row.innerHTML = `
                <td>${item.rank}</td>
                <td>${item.tsCode}</td>
                <td>${item.name || '-'}</td>
                <td>${formatNumber(item.sellAmount)}</td>
                <td>${formatNumber(item.sellRate)}</td>
                <td>${item.exalter || '-'}</td>
            `;
        }
        
        tbody.appendChild(row);
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化日期选择器为今天
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const dateInput = document.getElementById('dateInput');
    dateInput.value = `${year}-${month}-${day}`;
    
    // 加载数据
    fetchAndDisplayData();
}); 