// 格式化数值，处理null和undefined
function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined) return '-';
    return Number(value).toFixed(decimals);
}

// 获取并显示数据
async function fetchAndDisplayData() {
    try {
        const dateInput = document.getElementById('dateSelect');
        const date = dateInput.value.replace(/-/g, '');
        
        const response = await fetch(`/api/industry/metrics${date ? `?date=${date}` : ''}`);
        const result = await response.json();
        
        if (result.success) {
            // 更新日期选择器（如果未选择日期）
            if (!date) {
                const tradeDate = result.trade_date;
                dateInput.value = tradeDate;
            }
            
            // 更新表格数据
            const tbody = document.querySelector('#metricsTable tbody');
            tbody.innerHTML = '';
            
            result.data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.industry}</td>
                    <td>${formatNumber(item.totalAmount/10000, 2)}</td>
                    <td>${item.amountRank}</td>
                    <td>${formatNumber(item.avgPE)}</td>
                    <td>${formatNumber(item.avgPB)}</td>
                    <td>${formatNumber(item.avgPS)}</td>
                    <td>${formatNumber(item.avgTurnover)}</td>
                    <td>${formatNumber(item.avgTotalMV)}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            console.error('获取数据失败:', result.message);
            alert('获取数据失败：' + result.message);
        }
    } catch (error) {
        console.error('请求失败:', error);
        alert('请求失败：' + error.message);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 获取最新交易日期并设置为默认日期
    fetch('/api/latest-trade-date')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const date = result.latestDate;
                document.getElementById('dateSelect').value = 
                    `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`;
                fetchAndDisplayData();
            }
        })
        .catch(error => console.error('获取最新交易日期失败:', error));
}); 