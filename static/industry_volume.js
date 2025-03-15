// 加载侧边栏
document.addEventListener('DOMContentLoaded', function() {
    // 加载侧边栏
    loadSidebar().then(() => {
        // 高亮当前页面在侧边栏中的链接
        highlightCurrentPage();
    });
    
    // 获取并显示数据
    fetchAndDisplayData();
});

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

// 高亮当前页面在侧边栏中的链接
function highlightCurrentPage() {
    const links = document.querySelectorAll('.sidebar-nav a');
    links.forEach(link => {
        if (link.getAttribute('href') === '/industry_volume') {
            link.classList.add('active');
        }
    });
}

// 初始化图表
function initChart(data) {
    const chartDom = document.getElementById('volumeChart');
    const myChart = echarts.init(chartDom);
    
    const industries = data.map(item => item.industry);
    const amounts = data.map(item => item.total_amount);
    const stockCounts = data.map(item => item.stock_count);

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            formatter: function(params) {
                const industryData = params[0];
                const stockCountData = params[1];
                return `${industryData.name}<br/>
                        成交金额：${formatAmount(industryData.value)}<br/>
                        股票数量：${stockCountData.value}家`;
            }
        },
        legend: {
            data: ['成交金额', '股票数量'],
            top: 'top',
            left: 'center'  // 图例居中显示
        },
        grid: {
            left: '8%',
            right: '8%',
            bottom: '10%',
            top: '8%',     // 减少顶部空间
            containLabel: true
        },
        dataZoom: [
            {
                type: 'slider',
                show: true,
                xAxisIndex: [0],
                start: 0,
                end: 20,
                height: 20,
                bottom: 0,
                borderColor: 'transparent',
                backgroundColor: '#e2e2e2',
                fillerColor: '#3498db',
                handleIcon: 'path://M-9.35,34.56V42m0-40V9.5m-2,0h4m-4,32.5h4',
                handleSize: '60%',
                handleStyle: {
                    color: '#3498db',
                    borderColor: '#fff',
                    borderWidth: 1,
                    shadowBlur: 2,
                    shadowColor: 'rgba(0, 0, 0, 0.2)',
                    shadowOffsetX: 1,
                    shadowOffsetY: 1
                }
            }
        ],
        xAxis: {
            type: 'category',
            data: industries,
            axisLabel: {
                interval: 0,
                rotate: 45,
                fontSize: 12,
                margin: 8
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
                name: '股票数量',
                position: 'right',
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#e74c3c'
                    }
                },
                axisLabel: {
                    formatter: '{value}家'
                }
            }
        ],
        series: [
            {
                name: '成交金额',
                type: 'bar',
                data: amounts,
                itemStyle: {
                    color: '#3498db'
                },
                barMaxWidth: 40
            },
            {
                name: '股票数量',
                type: 'line',
                yAxisIndex: 1,
                data: stockCounts,
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
    
    // 监听窗口大小变化和侧边栏状态变化
    const resizeChart = () => {
        const chartDom = document.getElementById('volumeChart');
        chartDom.style.height = window.innerHeight - 180 + 'px';  // 减小图表与顶部的间距
        
        // 强制重新计算图表大小
        setTimeout(() => {
            myChart.resize({
                width: 'auto',
                animation: {
                    duration: 300
                }
            });
        }, 50);  // 添加小延迟确保DOM已更新
    };

    // 监听窗口大小变化
    window.addEventListener('resize', resizeChart);
    
    // 监听侧边栏切换事件
    document.addEventListener('sidebarToggle', () => {
        // 在侧边栏动画完成后重新调整图表大小
        setTimeout(resizeChart, 300);
    });
    
    // 初始调整大小
    resizeChart();
}

// 更新表格
function updateTable(data) {
    const tbody = document.getElementById('industryTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    data.forEach((item, index) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = index + 1;
        row.insertCell(1).textContent = item.industry;
        row.insertCell(2).textContent = formatAmount(item.total_amount);
        row.insertCell(3).textContent = item.stock_count;
    });
}

// 添加日期选择和数据加载功能
document.addEventListener('DOMContentLoaded', async function() {
    // 获取最新交易日期
    try {
        const response = await fetch('/api/latest-trade-date');
        const data = await response.json();
        if (data.success) {
            const dateInput = document.getElementById('dateInput');
            const latestDate = data.latestDate;
            dateInput.value = `${latestDate.slice(0, 4)}-${latestDate.slice(4, 6)}-${latestDate.slice(6, 8)}`;
            // 加载数据
            fetchAndDisplayData();
        }
    } catch (error) {
        console.error('获取最新交易日期失败:', error);
    }
});

// 修改获取数据的函数
async function fetchAndDisplayData() {
    try {
        const dateInput = document.getElementById('dateInput');
        const date = dateInput.value?.replace(/-/g, '') || '';  // 如果没有日期，传空字符串
        
        const response = await fetch(`/api/industry_volume?date=${date}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            initChart(result.data);
            updateTable(result.data);
        } else {
            console.error('获取数据失败:', result.message);
            alert('获取数据失败：' + result.message);
        }
    } catch (error) {
        console.error('请求失败:', error);
        alert('请求失败：' + error.message);
    }
} 