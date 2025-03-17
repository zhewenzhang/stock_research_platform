// 格式化数值
function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined) return '-';
    return Number(value).toFixed(decimals);
}

// 获取并显示数据
async function fetchAndDisplayData() {
    try {
        const code = document.getElementById('codeInput').value;
        const name = document.getElementById('nameInput').value;
        
        const response = await fetch(`/api/stock/changes?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#changesTable tbody');
            tbody.innerHTML = '';
            
            result.data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.tsCode}</td>
                    <td>${item.name}</td>
                    <td class="${item.weeklyChange > 0 ? 'positive' : item.weeklyChange < 0 ? 'negative' : ''}">${formatNumber(item.weeklyChange)}</td>
                    <td class="${item.monthlyChange > 0 ? 'positive' : item.monthlyChange < 0 ? 'negative' : ''}">${formatNumber(item.monthlyChange)}</td>
                    <td class="${item.change3m > 0 ? 'positive' : item.change3m < 0 ? 'negative' : ''}">${formatNumber(item.change3m)}</td>
                    <td class="${item.change6m > 0 ? 'positive' : item.change6m < 0 ? 'negative' : ''}">${formatNumber(item.change6m)}</td>
                    <td class="${item.change1y > 0 ? 'positive' : item.change1y < 0 ? 'negative' : ''}">${formatNumber(item.change1y)}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            alert('获取数据失败：' + result.message);
        }
    } catch (error) {
        console.error('请求失败:', error);
        alert('请求失败：' + error.message);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', fetchAndDisplayData); 