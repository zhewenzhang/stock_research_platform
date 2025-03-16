# 股票数据研究平台

基于 Python Flask 的股票数据查询和分析平台，提供个股历史数据查询、成交量分析、行业分析等功能。

## 主要功能

1. 个股历史成交查询
   - 支持按股票代码和名称搜索
   - 支持日期范围筛选
   - 多维度数据展示和排序

2. 个股成交额分析
   - 展示近30天成交额排名走势
   - 涨跌幅分布分析
   - 成交额和成交量趋势对比

3. 行业成交量分析
   - 行业成交金额排名
   - 行业股票数量统计
   - 支持日期选择

## 技术栈

- 后端：Python Flask
- 前端：HTML5 + CSS3 + JavaScript
- 数据可视化：ECharts
- 数据库：MySQL

## 安装和运行

1. 克隆仓库
```bash
git clone https://github.com/zhewenzhang/stock_research_platform.git
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 运行应用
```bash
python app.py
```

4. 访问系统
浏览器访问 http://localhost:5000

## 项目结构

```
stock-query/
├── static/
│   ├── index.html      # 股票查询页面
│   ├── analysis.html   # 数据分析页面
│   ├── sidebar.html    # 导航栏组件
│   ├── styles.css      # 样式文件
│   ├── script.js       # 查询页面脚本
│   ├── analysis.js     # 分析页面脚本
│   └── common.js       # 共用功能脚本
├── app.py             # Flask应用主文件
├── requirements.txt   # 项目依赖
└── README.md         # 项目文档
```

## 使用说明

1. 股票查询
   - 在查询页面输入股票代码或名称
   - 选择日期范围（可选）
   - 点击查询按钮获取数据
   - 可以对数据进行排序和翻页

2. 数据分析
   - 在分析页面输入股票代码或名称
   - 点击分析按钮查看图表
   - 查看成交额排名走势和涨跌幅分布

## 注意事项

- 确保已安装所有依赖包
- 数据库文件需要正确配置
- 建议使用现代浏览器访问系统 