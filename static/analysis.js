// 等待DOM加载完成后再初始化图表
document.addEventListener('DOMContentLoaded', function() {
    // 初始化图表
    let rankChart = echarts.init(document.getElementById('rankChart'));
    let changeChart = echarts.init(document.getElementById('changeChart'));

    // 侧边栏切换
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        // 重新调整图表大小
        rankChart.resize();
        changeChart.resize();
    }

    // 窗口大小改变时重新调整图表大小
    window.addEventListener('resize', function() {
        rankChart.resize();
        changeChart.resize();
    });

    // 搜索股票数据
    window.searchStock = async function() {
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

    // 更新图表数据
    function updateCharts(data) {
        console.log('更新图表数据:', data);
        
        // 成交额排名走势图配置
        const rankOption = {
            title: {
                text: '成交额排名走势',
                left: 'center',
                top: 10
            },
            tooltip: {
                trigger: 'axis',
                formatter: '{b}<br/>排名: {c}'
            },
            xAxis: {
                type: 'category',
                data: data.dates,
                axisLabel: {
                    rotate: 45
                }
            },
            yAxis: {
                type: 'value',
                inverse: true,
                name: '排名',
                axisLabel: {
                    formatter: '{value}'
                }
            },
            series: [{
                name: '排名',
                type: 'line',
                data: data.rankings,
                smooth: true,
                lineStyle: {
                    width: 3
                },
                itemStyle: {
                    color: '#1a237e'
                }
            }]
        };

        // 涨跌幅柱状图配置
        const changeOption = {
            title: {
                text: '涨跌幅分布',
                left: 'center',
                top: 10
            },
            tooltip: {
                trigger: 'axis',
                formatter: '{b}<br/>涨跌幅: {c}%'
            },
            xAxis: {
                type: 'category',
                data: data.dates,
                axisLabel: {
                    rotate: 45
                }
            },
            yAxis: {
                type: 'value',
                name: '涨跌幅(%)',
                axisLabel: {
                    formatter: '{value}%'
                }
            },
            series: [{
                name: '涨跌幅',
                type: 'bar',
                data: data.changes,
                itemStyle: {
                    color: function(params) {
                        return params.value >= 0 ? '#f44336' : '#4caf50';
                    }
                }
            }]
        };

        // 设置图表配置
        rankChart.setOption(rankOption);
        changeChart.setOption(changeOption);
    }

    // 初始化空的图表
    rankChart.setOption({
        title: {
            text: '成交额排名走势',
            left: 'center',
            top: 10
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            data: []
        },
        yAxis: {
            type: 'value',
            inverse: true,
            name: '排名'
        },
        series: [{
            type: 'line',
            data: [],
            smooth: true
        }]
    });

    changeChart.setOption({
        title: {
            text: '涨跌幅分布',
            left: 'center',
            top: 10
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            data: []
        },
        yAxis: {
            type: 'value',
            name: '涨跌幅(%)'
        },
        series: [{
            type: 'bar',
            data: []
        }]
    });
});

// ... rest of the file remains unchanged ...
 