// 格式化金额
function formatAmount(amount) {
    if (!amount && amount !== 0) return '-';
    amount = amount * 1000; // 转换为元
    if (amount >= 100000000) {
        return (amount / 100000000).toFixed(2) + '亿';
    } else if (amount >= 10000) {
        return (amount / 10000).toFixed(2) + '万';
    }
    return amount.toFixed(2);
}

// 初始化图表
function initChart(data) {
    const chartDom = document.getElementById('trendChart');
    const myChart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985'
                }
            },
            formatter: function(params) {
                return `<div style="width:150px;height:80px;display:flex;flex-direction:column;justify-content:center">
                    <div style="font-size:11px;white-space:nowrap">${params[0].name}</div>
                    <div style="font-size:11px;white-space:nowrap">${formatAmount(params[0].value)}</div>
                    <div style="font-size:11px;white-space:nowrap">第${params[1].value}名</div>
                </div>`;
            },
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderColor: '#ccc',
            borderWidth: 1,
            padding: [2, 4],
            textStyle: {
                fontSize: 11,
                lineHeight: 14
            },
            extraCssText: 'width:150px;height:80px;' // 强制设置固定宽高
        },
        legend: {
            data: ['成交金额', '排名'],
            top: 'top',
            left: 'center'
        },
        grid: {
            left: '8%',
            right: '8%',
            bottom: '10%',
            top: '8%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.dates,
            axisLabel: {
                interval: 0,
                rotate: 45
            }
        },
        yAxis: [
            {
                type: 'value',
                name: '成交金额',
                position: 'left',
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#3498db'
                    }
                },
                axisLabel: {
                    formatter: function(value) {
                        return formatAmount(value);
                    }
                }
            },
            {
                type: 'value',
                name: '排名',
                position: 'right',
                inverse: true,  // 排名从小到大
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#e74c3c'
                    }
                },
                axisLabel: {
                    formatter: '{value}名'
                }
            }
        ],
        series: [
            {
                name: '成交金额',
                type: 'bar',
                data: data.amounts,
                itemStyle: {
                    color: '#3498db'
                }
            },
            {
                name: '排名',
                type: 'line',
                yAxisIndex: 1,
                data: data.rankings,
                itemStyle: {
                    color: '#e74c3c'
                },
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: {
                    width: 2
                }
            }
        ]
    };

    myChart.setOption(option);
}

// 加载行业列表
async function loadIndustries() {
    try {
        const response = await fetch('/api/industries');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('industrySelect');
            data.industries.forEach(industry => {
                const option = document.createElement('option');
                option.value = industry;
                option.textContent = industry;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('获取行业列表失败:', error);
    }
}

// 获取并显示数据
async function fetchAndDisplayData() {
    const industry = document.getElementById('industrySelect').value;
    
    if (!industry) {
        alert('请选择行业');
        return;
    }
    
    try {
        const response = await fetch(`/api/industry/trend?industry=${encodeURIComponent(industry)}`);
        const result = await response.json();
        
        if (result.success) {
            initChart(result.data);
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
    loadIndustries();
}); 