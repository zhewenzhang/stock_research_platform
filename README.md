# 股票分析系统

## 最新更新
- 新增 AI 问答功能
  - 添加智能问答界面作为系统默认首页
  - 支持自然语言交互，方便用户查询股票信息
  - 提供常见问题建议，优化用户体验
- 优化导航栏设计
  - 美化滚动条样式，提升视觉体验
  - 优化导航项间距和字体大小
  - 改进导航栏布局，使界面更加紧凑
- 调整页面结构
  - 将原有首页改为 index_old.html
  - 新增 index_dt.html 作为个股历史成交量查询页面
  - 优化页面路由和导航逻辑
- 优化用户界面设计
  - 改进用户信息显示区域布局，采用更紧凑的左右布局
  - 为不同用户角色添加特色标识：管理员和高级用户使用金色标识，普通用户使用蓝色标识
  - 优化导航栏权限控制，系统设置仅对管理员可见
- 改进用户认证系统
  - 优化登录/登出流程
  - 增强用户权限管理
  - 完善用户角色显示
- 新增龙虎榜买卖排行功能：支持查看每日龙虎榜买入和卖出前100名的详细信息
- 新增个股涨跌幅分析功能：支持查看股票的近7天、30天、3个月、6个月和1年的涨跌幅
- 优化数据展示：涨跌幅使用红绿色区分，提升数据可读性
- 完善数据计算：优化长期涨跌幅的计算逻辑，确保数据准确性
- 新增行业成分股分析功能：支持查看行业内成交额前20的股票详细信息
- 优化行业指标展示：添加行业汇总数据，方便与个股对比
- 完善数据交互：支持从行业指标页面直接跳转查看成分股

## 功能特点

1. 股票数据查询
   - 支持按股票代码和名称搜索
   - 实时显示股票涨跌幅数据
   - 支持查看不同时间段的涨跌幅（7天、30天、3个月、6个月、1年）
   - 点击股票代码可直接跳转到腾讯股票页面查看详细信息

2. 系统设置
   - 用户管理
   - 权限管理
   - 页面设置（支持文件夹管理、页面排序、显示名称修改）

3. 数据展示
   - 表格化展示数据
   - 涨跌幅颜色区分（红色表示上涨，绿色表示下跌）
   - 支持数据排序和筛选

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
- 前端：HTML5, CSS3, JavaScript
- 数据可视化：ECharts
- 数据库：MySQL
- UI组件：Font Awesome图标库

## 安装说明

1. 克隆项目
```bash
git clone https://github.com/yourusername/stock-query.git
cd stock-query
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 配置数据库
```bash
python init_db.py
```

4. 运行应用
```bash
python app.py
```

## 使用说明

1. 访问系统
   - 打开浏览器访问 http://localhost:5000
   - 使用默认账号密码登录（admin/admin）

2. 查询股票
   - 在搜索框输入股票代码或名称
   - 点击搜索按钮获取数据
   - 点击股票代码可跳转到腾讯股票页面查看详细信息

3. 系统设置
   - 点击右上角设置图标进入系统设置
   - 可以进行用户管理、权限管理和页面设置

## 更新日志

### 2024-03-xx
- 新增功能：点击股票代码可直接跳转到腾讯股票页面
- 优化页面布局和样式
- 改进数据展示效果

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 许可证

MIT License

## 默认账户
- 管理员账户：admin
- 默认密码：admin123

## 注意事项
- 首次使用请及时修改默认管理员密码
- 建议定期备份数据库
- 请确保数据库连接配置正确

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

## 注意事项

- 确保已安装所有依赖包
- 数据库文件需要正确配置
- 建议使用现代浏览器访问系统 