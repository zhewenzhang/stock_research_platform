// 等待DOM加载完成后再初始化图表
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有图表
    initCharts();

    // 侧边栏切换
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            
            // 重新调整图表大小
            setTimeout(() => {
                rankingChart && rankingChart.resize();
                changeChart && changeChart.resize();
                volumeChart && volumeChart.resize();
            }, 300);
        }
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
    // 确保DOM元素存在
    const rankingChartDom = document.getElementById('rankingChart');
    const changeChartDom = document.getElementById('changeChart');
    const volumeChartDom = document.getElementById('volumeChart');

    if (!rankingChartDom || !changeChartDom || !volumeChartDom) {
        console.error('图表容器元素未找到');
        return;
    }

    // 销毁已存在的图表实例
    if (rankingChart) {
        rankingChart.dispose();
    }
    if (changeChart) {
        changeChart.dispose();
    }
    if (volumeChart) {
        volumeChart.dispose();
    }

    // 初始化图表实例
    rankingChart = echarts.init(rankingChartDom);
    changeChart = echarts.init(changeChartDom);
    volumeChart = echarts.init(volumeChartDom);
    
    // 设置默认配置
    setChartOptions();
    
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        rankingChart && rankingChart.resize();
        changeChart && changeChart.resize();
        volumeChart && volumeChart.resize();
    });

    // 监听侧边栏切换
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.addEventListener('transitionend', function() {
            setTimeout(() => {
                rankingChart && rankingChart.resize();
                changeChart && changeChart.resize();
                volumeChart && volumeChart.resize();
            }, 300);
        });
    }
}

// 设置图表默认配置
function setChartOptions() {
    // 成交额排名图表默认配置
    const rankingOption = {
        title: {
            text: '成交额排名走势',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                return formatDate(params[0].axisValue) + '<br/>' + 
                       params[0].marker + '排名: ' + params[0].value + '名';
            },
            padding: [2, 6],
            textStyle: {
                fontSize: 10,
                lineHeight: 10
            },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderWidth: 1,
            extraCssText: 'width: auto; height: auto; min-width: 0; box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);'
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
    };
    rankingChart.setOption(rankingOption);
    rankingChart.resize();

    // 涨跌幅图表默认配置
    changeChart.setOption({
        title: {
            text: '涨跌幅分布',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                return formatDate(params[0].axisValue) + '<br/>' + 
                       params[0].marker + '涨跌幅: ' + params[0].value.toFixed(2) + '%';
            },
            padding: [2, 6],
            textStyle: {
                fontSize: 10,
                lineHeight: 10
            },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderWidth: 1,
            extraCssText: 'width: auto; height: auto; min-width: 0; box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);'
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
    rankingChart.resize();
    
    // 更新涨跌幅图表
    updateChangeChart(data);
    changeChart.resize();
    
    // 更新成交额和成交量图表
    updateVolumeChart(data);
    volumeChart.resize();
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
                let result = formatDate(params[0].axisValue) + '<br/>';
                params.forEach(param => {
                    let value = param.seriesName === '成交额' ? 
                        formatAmount(param.value) : 
                        (param.value / 10000).toFixed(1) + '万手';
                    result += param.marker + param.seriesName + ':' + value + '<br/>';
                });
                return result;
            },
            padding: [2, 6],
            textStyle: {
                fontSize: 10,
                lineHeight: 10
            },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderWidth: 1,
            extraCssText: 'width: auto; height: auto; min-width: 0; box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);'
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

// 声明全局变量
let rankingChart = null;
let changeChart = null;
let volumeChart = null;
 