// 等待DOM加载完成后再初始化图表
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有图表
    initCharts();

    // 侧边栏切换
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        // 重新调整图表大小
        rankingChart.resize();
        changeChart.resize();
        volumeChart.resize();
    }
});

// 搜索股票数据
async function searchStock() {
    const stockCode = document.getElementById('stockCode').value.trim();
    const stockName = document.getElementById('stockName').value.trim();

    if (!stockCode && !stockName) {
        alert('请输入股票代码或名称');
        return;
    }

    try {
        const response = await fetch(`/api/stock/analysis?code=${encodeURIComponent(stockCode)}&name=${encodeURIComponent(stockName)}`);
        const data = await response.json();
        console.log('API返回数据:', data);

        if (data.success) {
            updateCharts(data.data);
        } else {
            alert(data.message || '获取数据失败');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('获取数据时发生错误');
    }
}

// 初始化所有图表
function initCharts() {
    // 初始化成交额排名图表
    rankingChart = echarts.init(document.getElementById('rankingChart'));
    // 初始化涨跌幅图表
    changeChart = echarts.init(document.getElementById('changeChart'));
    // 初始化成交额和成交量图表
    volumeChart = echarts.init(document.getElementById('volumeChart'));
    
    // 设置默认配置
    setChartOptions();
    
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        rankingChart.resize();
        changeChart.resize();
        volumeChart.resize();
    });
}

// 设置图表默认配置
function setChartOptions() {
    // 成交额排名图表默认配置
    rankingChart.setOption({
        title: {
            text: '成交额排名走势',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>{a}: {c}名'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: [],
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '排名',
            inverse: true
        },
        series: [{
            name: '排名',
            type: 'line',
            data: [],
            itemStyle: {
                color: '#1a237e'
            },
            lineStyle: {
                width: 2
            },
            symbol: 'circle',
            symbolSize: 6
        }]
    });

    // 涨跌幅图表默认配置
    changeChart.setOption({
        title: {
            text: '涨跌幅分布',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>{a}: {c}%'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: [],
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '涨跌幅(%)'
        },
        series: [{
            name: '涨跌幅',
            type: 'bar',
            data: [],
            itemStyle: {
                color: function(params) {
                    return params.value >= 0 ? '#f44336' : '#4caf50';
                }
            }
        }]
    });
}

// 更新图表数据
function updateCharts(data) {
    if (!data || !data.dates) return;
    
    // 更新成交额排名图表
    updateRankingChart(data);
    
    // 更新涨跌幅图表
    updateChangeChart(data);
    
    // 更新成交额和成交量图表
    updateVolumeChart(data);
}

// 格式化日期
function formatDate(dateStr) {
    return dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
}

// 更新成交额排名图表
function updateRankingChart(data) {
    const option = {
        xAxis: {
            data: data.dates.map(date => formatDate(date))
        },
        series: [{
            name: '排名',
            data: data.rankings
        }]
    };
    rankingChart.setOption(option);
}

// 更新涨跌幅图表
function updateChangeChart(data) {
    const option = {
        xAxis: {
            data: data.dates.map(date => formatDate(date))
        },
        series: [{
            name: '涨跌幅',
            data: data.changes
        }]
    };
    changeChart.setOption(option);
}

// 格式化成交额
function formatAmount(value) {
    if (value >= 100000000) {
        return (value / 100000000).toFixed(2) + '亿';
    } else if (value >= 10000) {
        return (value / 10000).toFixed(2) + '万';
    }
    return value.toFixed(2);
}

// 更新成交额和成交量图表
function updateVolumeChart(data) {
    const option = {
        title: {
            text: '成交额和成交量走势',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            formatter: function(params) {
                let result = params[0].axisValue + '<br/>';
                params.forEach(param => {
                    let value = param.seriesName === '成交额' ? 
                        formatAmount(param.value) : 
                        (param.value / 10000).toFixed(2) + '万手';
                    result += param.marker + param.seriesName + ': ' + value + '<br/>';
                });
                return result;
            }
        },
        legend: {
            data: ['成交额', '成交量'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.dates.map(date => formatDate(date)),
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: [
            {
                type: 'value',
                name: '成交额',
                axisLabel: {
                    formatter: function(value) {
                        return formatAmount(value);
                    }
                }
            },
            {
                type: 'value',
                name: '成交量(手)',
                axisLabel: {
                    formatter: function(value) {
                        return (value / 10000).toFixed(2) + '万';
                    }
                }
            }
        ],
        series: [
            {
                name: '成交额',
                type: 'bar',
                data: data.amounts,
                itemStyle: {
                    color: '#1a237e'
                }
            },
            {
                name: '成交量',
                type: 'line',
                yAxisIndex: 1,
                data: data.volumes,
                itemStyle: {
                    color: '#f44336'
                },
                lineStyle: {
                    width: 2
                },
                symbol: 'circle',
                symbolSize: 6
            }
        ]
    };
    
    volumeChart.setOption(option);
}
 