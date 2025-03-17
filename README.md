# 股票数据分析系统

## 最新更新
- 新增个股涨跌幅分析功能：支持查看股票的近7天、30天、3个月、6个月和1年的涨跌幅
- 优化数据展示：涨跌幅使用红绿色区分，提升数据可读性
- 完善数据计算：优化长期涨跌幅的计算逻辑，确保数据准确性
- 新增行业成分股分析功能：支持查看行业内成交额前20的股票详细信息
- 优化行业指标展示：添加行业汇总数据，方便与个股对比
- 完善数据交互：支持从行业指标页面直接跳转查看成分股

## 功能特点
1. 个股历史成交量查询
2. 个股成交额分析
3. 每日成交排名
4. 行业成交量分析
5. 行业成交趋势
6. 行业指标分析
   - 支持查看行业平均市盈率(PE)
   - 支持查看行业平均市净率(PB)
   - 支持查看行业平均市销率(PS)
   - 支持查看行业平均换手率
   - 支持查看行业平均市值
   - 按行业成交额排名展示
7. 行业成分股分析
   - 显示行业汇总指标数据
   - 展示成交额前20的股票详情
   - 支持查看个股的PE、PB、PS等指标
8. 个股涨跌幅分析（新）
   - 支持查看近7天、30天涨跌幅
   - 支持查看近3个月、6个月涨跌幅
   - 支持查看近1年涨跌幅
   - 支持按股票代码和名称筛选
   - 涨跌幅红绿色直观显示

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