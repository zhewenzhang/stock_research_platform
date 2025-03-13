from flask import Flask, request, jsonify, send_from_directory
import pymysql
from datetime import datetime
import json
import os

app = Flask(__name__, static_folder='static')

# 数据库配置
DB_CONFIG = {
    'host': '139.199.228.87',
    'port': 9998,
    'user': 'root',
    'password': 'mysql_NGhBZQ',
    'database': 'tushare_api',
    'charset': 'utf8mb4'
}

def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

@app.route('/')
def index():
    print("访问首页")
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        print(f"错误: {str(e)}")
        return str(e), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    print(f"请求静态文件: {filename}")
    try:
        return send_from_directory(app.static_folder, filename)
    except Exception as e:
        print(f"静态文件错误: {str(e)}")
        return str(e), 404

@app.route('/api/stocks', methods=['POST'])
def get_stocks():
    try:
        data = request.get_json()
        print(f"收到请求数据: {data}")
        stock_code = data.get('stockCode', '')
        stock_name = data.get('stockName', '')
        start_date = data.get('startDate', '')
        end_date = data.get('endDate', '')
        page = int(data.get('page', 1))
        page_size = int(data.get('pageSize', 100))
        sort_column = data.get('sortColumn', 'trade_date')
        sort_order = data.get('sortOrder', 'DESC')

        # 计算偏移量
        offset = (page - 1) * page_size

        # 构建SQL查询
        conditions = []
        params = []
        
        if stock_code:
            conditions.append("ts_code LIKE %s")
            params.append(f"%{stock_code}%")
            
        if stock_name:
            conditions.append("name LIKE %s")
            params.append(f"%{stock_name}%")
        
        if start_date:
            conditions.append("trade_date >= %s")
            params.append(start_date.replace('-', ''))
        
        if end_date:
            conditions.append("trade_date <= %s")
            params.append(end_date.replace('-', ''))

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        print(f"SQL查询条件: {where_clause}")
        print(f"参数: {params}")

        # 连接数据库
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                # 获取总记录数
                count_sql = f"""
                    SELECT COUNT(*) as total 
                    FROM daily_data
                    WHERE {where_clause}
                """
                cursor.execute(count_sql, params)
                total = cursor.fetchone()['total']
                print(f"总记录数: {total}")

                # 获取数据
                sql = f"""
                    SELECT 
                        trade_date,
                        ts_code,
                        name,
                        open,
                        close,
                        high,
                        low,
                        vol,
                        amount,
                        pct_chg,
                        amount_rank
                    FROM daily_data
                    WHERE {where_clause}
                    ORDER BY {sort_column} {sort_order}
                    LIMIT %s OFFSET %s
                """
                cursor.execute(sql, params + [page_size, offset])
                stocks = cursor.fetchall()
                print(f"获取到 {len(stocks)} 条记录")

                # 格式化日期和数值
                for stock in stocks:
                    stock['trade_date'] = str(stock['trade_date'])
                    # 格式化数值
                    for key in ['open', 'close', 'high', 'low']:
                        if key in stock and stock[key] is not None:
                            stock[key] = float(stock[key])
                    if 'vol' in stock and stock['vol'] is not None:
                        stock['vol'] = int(stock['vol'])
                    if 'amount' in stock and stock['amount'] is not None:
                        stock['amount'] = float(stock['amount'])
                    if 'pct_chg' in stock and stock['pct_chg'] is not None:
                        stock['pct_chg'] = float(stock['pct_chg'])
                    if 'amount_rank' in stock and stock['amount_rank'] is not None:
                        stock['amount_rank'] = int(stock['amount_rank'])

        return jsonify({
            'stocks': stocks,
            'total': total,
            'page': page,
            'pageSize': page_size
        })

    except Exception as e:
        print(f"错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("启动服务器...")
    print(f"静态文件目录: {os.path.abspath(app.static_folder)}")
    print(f"index.html 是否存在: {os.path.exists(os.path.join(app.static_folder, 'index.html'))}")
    app.run(debug=True, host='0.0.0.0', port=5000) 