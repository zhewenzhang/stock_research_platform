from flask import Flask, request, jsonify, send_from_directory
import pymysql
from datetime import datetime
import json
import os

app = Flask(__name__)

# 添加静态文件配置
app.static_folder = 'static'
app.static_url_path = ''

print("启动服务器...")
print(f"静态文件目录: {os.path.abspath(app.static_folder)}")
print(f"index.html 是否存在: {os.path.exists(os.path.join(app.static_folder, 'index.html'))}")
print(f"analysis.html 是否存在: {os.path.exists(os.path.join(app.static_folder, 'analysis.html'))}")

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
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/index.html')
def index_html():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/analysis.html')
def analysis():
    print(f"请求analysis.html, 文件路径: {os.path.join(app.static_folder, 'analysis.html')}")
    return send_from_directory(app.static_folder, 'analysis.html')

@app.route('/<path:filename>')
def serve_static(filename):
    print(f"请求静态文件: {filename}")
    return send_from_directory(app.static_folder, filename)

@app.route('/api/stocks', methods=['POST'])
def get_stocks():
    try:
        data = request.get_json()
        stock_code = data.get('stockCode', '')
        stock_name = data.get('stockName', '')
        start_date = data.get('startDate', '').replace('-', '')
        end_date = data.get('endDate', '').replace('-', '')
        page = data.get('page', 1)
        page_size = data.get('pageSize', 100)
        sort_column = data.get('sortColumn', 'trade_date')
        sort_order = data.get('sortOrder', 'DESC')

        print(f"收到请求数据: {data}")

        # 构建查询条件
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
            params.append(start_date)
        if end_date:
            conditions.append("trade_date <= %s")
            params.append(end_date)

        # 构建WHERE子句
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        # 获取总记录数
        count_sql = f"SELECT COUNT(*) FROM daily_data WHERE {where_clause}"
        cursor = get_db_connection().cursor()
        cursor.execute(count_sql, params)
        total_records = cursor.fetchone()[0]
        
        print(f"SQL查询条件: {where_clause}")
        print(f"参数: {params}")
        print(f"总记录数: {total_records}")

        # 构建完整的SQL查询
        offset = (page - 1) * page_size
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
        params.extend([page_size, offset])
        
        cursor.execute(sql, params)
        records = cursor.fetchall()
        print(f"获取到 {len(records)} 条记录")

        # 转换结果为字典列表
        results = []
        for record in records:
            results.append({
                'trade_date': record[0],
                'ts_code': record[1],
                'name': record[2],
                'open': float(record[3]) if record[3] else 0,
                'close': float(record[4]) if record[4] else 0,
                'high': float(record[5]) if record[5] else 0,
                'low': float(record[6]) if record[6] else 0,
                'vol': float(record[7]) if record[7] else 0,
                'amount': float(record[8]) if record[8] else 0,
                'pct_chg': float(record[9]) if record[9] else 0,
                'amount_rank': int(record[10]) if record[10] else 0
            })

        return jsonify({
            'success': True,
            'data': {
                'records': results,
                'total': total_records,
                'page': page,
                'pageSize': page_size
            }
        })

    except Exception as e:
        print(f"查询出错: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/stock/analysis')
def analyze_stock():
    try:
        stock_code = request.args.get('code')
        stock_name = request.args.get('name')
        
        print(f"收到查询请求 - 股票代码: {stock_code}, 股票名称: {stock_name}")
        
        # 构建查询条件
        conditions = []
        params = []
        if stock_code:
            conditions.append("ts_code LIKE %s")
            params.append(f"%{stock_code}%")
        if stock_name:
            conditions.append("name LIKE %s")
            params.append(f"%{stock_name}%")
            
        if not conditions:
            return jsonify({
                'success': False,
                'message': '请提供股票代码或名称'
            })
            
        # 构建SQL查询
        where_clause = " AND ".join(conditions)
        sql = f"""
            SELECT 
                trade_date,
                ts_code,
                name,
                amount_rank,
                pct_chg
            FROM daily_data
            WHERE {where_clause}
            ORDER BY trade_date DESC
            LIMIT 30
        """
        
        print(f"执行SQL查询: {sql}")
        print(f"参数: {params}")
        
        # 执行查询
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            print("未找到匹配的股票数据")
            return jsonify({
                'success': False,
                'message': '未找到相关股票数据'
            })
            
        print(f"找到 {len(rows)} 条记录")
        
        # 处理数据
        dates = []
        rankings = []
        changes = []
        
        # 反转数据以按时间正序排列
        for row in reversed(rows):
            dates.append(str(row[0]))  # trade_date
            rankings.append(int(row[3]) if row[3] is not None else None)  # amount_rank
            changes.append(float(row[4]) if row[4] is not None else 0.0)  # pct_chg
            
        response_data = {
            'success': True,
            'data': {
                'stockCode': rows[0][1],
                'stockName': rows[0][2],
                'dates': dates,
                'rankings': rankings,
                'changes': changes
            }
        }
        print(f"返回数据: {json.dumps(response_data, ensure_ascii=False)}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"分析数据时发生错误: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'获取数据时发生错误: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 