# 股票数据查询系统

一个基于Flask的股票数据查询系统，支持实时查询股票历史交易数据。

## 功能特点

- 支持股票代码和股票名称的模糊搜索
- 支持按日期范围查询
- 支持分页显示
- 支持导出Excel
- 实时显示涨跌幅
- 响应式设计，支持移动端访问
- 美观的用户界面

## 技术栈

- 后端：Python Flask
- 前端：HTML5, CSS3, JavaScript
- 数据库：MySQL
- UI框架：Font Awesome

## 安装说明

1. 克隆项目
```bash
git clone https://github.com/你的用户名/stock-query.git
cd stock-query
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 配置数据库
修改 `app.py` 中的数据库配置：
```python
DB_CONFIG = {
    'host': '你的数据库地址',
    'port': 你的端口号,
    'user': '用户名',
    'password': '密码',
    'database': '数据库名',
    'charset': 'utf8mb4'
}
```

4. 运行项目
```bash
python app.py
```

5. 访问系统
打开浏览器访问 http://localhost:5000

## 使用说明

1. 在搜索框中输入股票代码或股票名称
2. 选择查询的日期范围
3. 选择每页显示的数据条数
4. 点击查询按钮获取数据
5. 可以使用导出Excel功能导出数据

## 项目结构

```
stock-query/
├── app.py              # Flask应用主文件
├── static/             # 静态文件目录
│   ├── index.html     # 主页面
│   ├── styles.css     # 样式文件
│   └── script.js      # JavaScript文件
├── requirements.txt    # 项目依赖
└── README.md          # 项目说明文档
```

## 注意事项

- 确保MySQL数据库已正确配置并运行
- 确保数据库中存在必要的表结构
- 建议使用Python 3.7或更高版本

## 许可证

MIT License 