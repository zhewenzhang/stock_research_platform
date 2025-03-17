// 从URL获取参数
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        industry: params.get('industry'),
        date: params.get('date')
    };
}

// 格式化数值
function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined) return '-';
    return Number(value).toFixed(decimals);
}

// 获取并显示数据
async function fetchAndDisplayData() {
    try {
        const params = getQueryParams();
        if (!params.industry) {
            alert('未提供行业名称');
            return;
        }

        // 获取行业汇总数据
        const metricsResponse = await fetch(`/api/industry/metrics${params.date ? `?date=${params.date}` : ''}`);
        const metricsResult = await metricsResponse.json();
        
        if (metricsResult.success) {
            const industryData = metricsResult.data.find(item => item.industry === params.industry);
            if (industryData) {
                document.getElementById('totalAmount').textContent = formatNumber(industryData.totalAmount/10000);
                document.getElementById('avgPE').textContent = formatNumber(industryData.avgPE);
                document.getElementById('avgPB').textContent = formatNumber(industryData.avgPB);
                document.getElementById('avgPS').textContent = formatNumber(industryData.avgPS);
                document.getElementById('avgTurnover').textContent = formatNumber(industryData.avgTurnover);
                document.getElementById('avgTotalMV').textContent = formatNumber(industryData.avgTotalMV);
            }
        }

        // 获取成分股数据
        const response = await fetch(`/api/industry/top_companies?industry=${encodeURIComponent(params.industry)}${params.date ? `&date=${params.date}` : ''}`);
        const result = await response.json();

        if (result.success) {
            // 更新页面标题和日期
            document.getElementById('industryName').textContent = result.industry;
            document.getElementById('tradeDate').textContent = result.trade_date;
            document.title = `${result.industry} - 成分股分析`;

            // 更新表格数据
            const tbody = document.querySelector('#companiesTable tbody');
            tbody.innerHTML = '';

            result.data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.tsCode}</td>
                    <td>${item.name}</td>
                    <td>${formatNumber(item.amount)}</td>
                    <td>${formatNumber(item.pe)}</td>
                    <td>${formatNumber(item.pb)}</td>
                    <td>${formatNumber(item.ps)}</td>
                    <td>${formatNumber(item.turnoverRate)}</td>
                    <td>${formatNumber(item.totalMv)}</td>
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