from flask import Flask, request, jsonify, send_from_directory, render_template, session, redirect, url_for
import pymysql
from datetime import datetime, timedelta
import json
import os
import hashlib
import secrets
from functools import wraps

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)  # 为session设置密钥
app.permanent_session_lifetime = timedelta(days=7)  # 设置session过期时间为7天

# 修改静态文件配置
app.static_folder = 'static'
app.static_url_path = '/static'

# 确保使用绝对路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'static')

print(f"基础目录: {BASE_DIR}")
print(f"静态文件目录: {STATIC_DIR}")

# 确保静态文件目录存在
if not os.path.exists(STATIC_DIR):
    print(f"创建静态文件目录: {STATIC_DIR}")
    os.makedirs(STATIC_DIR)

# 打印所有静态文件
print("\n静态文件列表:")
try:
    for file in os.listdir(STATIC_DIR):
        print(f"- {file}")
except Exception as e:
    print(f"无法列出静态文件: {e}")

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

# 密码哈希函数
def hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_hex(8)
    pw_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return salt + ':' + pw_hash.hex()

# 密码验证函数
def verify_password(stored_password, provided_password):
    salt, stored_hash = stored_password.split(':')
    pw_hash = hashlib.pbkdf2_hmac('sha256', provided_password.encode(), salt.encode(), 100000)
    return pw_hash.hex() == stored_hash

# 用户角色
USER_ROLES = {
    'admin': '管理员',
    'advanced': '高级用户',
    'normal': '普通用户'
}

# 初始化数据库表
def init_db():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 创建用户表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'advanced', 'normal') NOT NULL DEFAULT 'normal',
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE
                )
            """)
            
            # 创建页面权限表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS permissions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    page_name VARCHAR(50) NOT NULL,
                    page_path VARCHAR(100) NOT NULL,
                    description VARCHAR(255),
                    UNIQUE KEY (page_path)
                )
            """)
            
            # 创建用户-权限关联表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_permissions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    permission_id INT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
                    UNIQUE KEY (user_id, permission_id)
                )
            """)
            
            # 检查是否已有管理员账户
            cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
            admin_count = cursor.fetchone()[0]
            
            # 如果没有管理员，创建默认管理员账户
            if admin_count == 0:
                admin_password_hash = hash_password('admin123')
                cursor.execute(
                    "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)",
                    ('admin', admin_password_hash, 'admin')
                )
                
            # 检查是否需要预设权限
            cursor.execute("SELECT COUNT(*) FROM permissions")
            permissions_count = cursor.fetchone()[0]
            
            # 如果没有预设权限，则添加
            if permissions_count == 0:
                pages = [
                    ('个股历史成交量', 'index.html', '查询股票的历史成交量数据'),
                    ('个股成交额分析', 'analysis.html', '股票成交额的分析图表'),
                    ('每日成交排名', 'volume.html', '每日股票成交量排名'),
                    ('行业成交量', 'industry_volume.html', '各行业成交量统计'),
                    ('行业成交趋势', 'industry_trend.html', '行业成交量趋势分析'),
                    ('行业指标分析', 'industry_metrics.html', '行业关键指标分析'),
                    ('个股涨跌幅分析', 'stock_changes.html', '股票价格涨跌幅分析'),
                    ('龙虎榜买卖排行', 'top_traders.html', '龙虎榜买卖排行统计'),
                    ('用户管理', 'user_management.html', '管理系统用户'),
                    ('权限管理', 'permission_management.html', '管理用户权限')
                ]
                
                for page in pages:
                    cursor.execute(
                        "INSERT INTO permissions (page_name, page_path, description) VALUES (%s, %s, %s)",
                        page
                    )
                
                # 为管理员赋予所有权限
                cursor.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
                admin_id = cursor.fetchone()[0]
                
                cursor.execute("SELECT id FROM permissions")
                permission_ids = cursor.fetchall()
                
                for permission_id in permission_ids:
                    cursor.execute(
                        "INSERT INTO user_permissions (user_id, permission_id) VALUES (%s, %s)",
                        (admin_id, permission_id[0])
                    )
            
            conn.commit()
    except Exception as e:
        print(f"初始化数据库出错: {e}")
        conn.rollback()
    finally:
        conn.close()

# 在应用启动时初始化数据库
init_db()

# 检查用户是否有权限访问页面的装饰器
def check_permission(page_path):
    def decorator(func):
        @wraps(func)  # 使用functools.wraps保留原始函数的属性
        def wrapper(*args, **kwargs):
            if 'user_id' not in session:
                return redirect('/login.html')
            
            user_id = session['user_id']
            
            # 检查是否为管理员，管理员有所有权限
            if session.get('role') == 'admin':
                return func(*args, **kwargs)
            
            # 检查用户是否有访问该页面的权限
            conn = get_db_connection()
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT COUNT(*) FROM user_permissions up
                        JOIN permissions p ON up.permission_id = p.id
                        WHERE up.user_id = %s AND p.page_path = %s
                    """, (user_id, page_path))
                    
                    has_permission = cursor.fetchone()[0] > 0
                    
                    if has_permission:
                        return func(*args, **kwargs)
                    else:
                        return jsonify({'success': False, 'message': '您没有权限访问此页面'}), 403
            finally:
                conn.close()
                
        return wrapper
    return decorator

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/index.html')
def index_html():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/analysis.html')
def analysis():
    return send_from_directory(app.static_folder, 'analysis.html')

@app.route('/volume.html')
def volume():
    return send_from_directory(app.static_folder, 'volume.html')

# 添加一个通用的静态文件路由
@app.route('/<path:filename>')
def serve_static(filename):
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
        code = request.args.get('code')
        name = request.args.get('name')
        
        print(f"收到查询请求 - 股票代码: {code}, 股票名称: {name}")
        
        # 构建查询条件
        conditions = []
        params = []
        if code:
            conditions.append("ts_code LIKE %s")
            params.append(f"%{code}%")
        if name:
            conditions.append("name LIKE %s")
            params.append(f"%{name}%")
            
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
                amount * 1000 as amount,  # 将千元转换为元
                vol,
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
        amounts = []
        volumes = []
        
        # 反转数据以按时间正序排列
        for row in reversed(rows):
            dates.append(str(row[0]))  # trade_date
            rankings.append(int(row[3]) if row[3] is not None else None)  # amount_rank
            changes.append(float(row[4]) if row[4] is not None else 0.0)  # pct_chg
            amounts.append(float(row[1]) if row[1] is not None else 0.0)  # amount
            volumes.append(float(row[2]) if row[2] is not None else 0.0)  # vol
            
        response_data = {
            'success': True,
            'data': {
                'dates': dates,
                'amounts': amounts,  # 这里的数据已经是以元为单位
                'volumes': volumes,
                'rankings': rankings,
                'changes': changes
            }
        }
        print(f"返回数据: {json.dumps(response_data, ensure_ascii=False)}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"分析数据时出错: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/latest-trade-date', methods=['GET'])
def get_latest_trade_date():
    try:
        cursor = get_db_connection().cursor()
        sql = "SELECT MAX(trade_date) as latest_date FROM daily_data"
        cursor.execute(sql)
        result = cursor.fetchone()
        cursor.close()
        
        return jsonify({
            'success': True,
            'latestDate': str(result[0])
        })
    except Exception as e:
        print(f"获取最新交易日期出错: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/stocks/volume', methods=['POST'])
def get_stocks_by_volume():
    try:
        data = request.get_json()
        trade_date = data.get('tradeDate')
        page = int(data.get('page', 1))
        page_size = int(data.get('pageSize', 100))
        sort_column = data.get('sortColumn', 'amount_rank')  # 默认按成交额排名排序
        sort_order = data.get('sortOrder', 'ASC')  # 默认升序
        
        if not trade_date:
            # 如果没有提供日期，获取最新交易日期
            cursor = get_db_connection().cursor()
            cursor.execute("SELECT MAX(trade_date) FROM daily_data")
            result = cursor.fetchone()
            trade_date = str(result[0])
            cursor.close()
        
        offset = (page - 1) * page_size
        
        # 构建SQL查询
        count_sql = """
            SELECT COUNT(*) as total
            FROM daily_data
            WHERE trade_date = %s
        """
        
        sql = """
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
            WHERE trade_date = %s
            ORDER BY {} {}
            LIMIT %s OFFSET %s
        """.format(sort_column, 'ASC' if sort_order == 'ASC' else 'DESC')
        
        # 执行查询
        cursor = get_db_connection().cursor()
        
        # 获取总记录数
        cursor.execute(count_sql, (trade_date,))
        total = cursor.fetchone()[0]
        
        # 获取分页数据
        cursor.execute(sql, (trade_date, page_size, offset))
        stocks = cursor.fetchall()
        cursor.close()
        
        print(f"找到 {len(stocks)} 条记录")
        
        # 转换结果为字典列表
        results = []
        for record in stocks:
            results.append({
                'trade_date': str(record[0]),
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
                'total': total,
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

@app.route('/industry_volume')
def industry_volume_page():
    return render_template('industry_volume.html')

@app.route('/api/industry_volume')
def get_industry_volume():
    try:
        # 获取日期参数，如果没有则使用最新日期
        trade_date = request.args.get('date')
        cursor = get_db_connection().cursor()
        
        if not trade_date:
            # 获取最新的交易日期
            cursor.execute("SELECT MAX(trade_date) as latest_date FROM daily_data")
            result = cursor.fetchone()
            trade_date = result[0]

        # SQL查询来获取行业成交量数据
        sql = """
        SELECT 
            ci.industry,
            SUM(dd.amount) as total_amount,
            COUNT(DISTINCT dd.ts_code) as stock_count
        FROM daily_data dd
        JOIN company_info_list ci ON dd.ts_code = ci.ts_code
        WHERE dd.trade_date = %s AND ci.industry IS NOT NULL
        GROUP BY ci.industry
        ORDER BY total_amount DESC
        """
        
        cursor.execute(sql, (trade_date,))
        results = cursor.fetchall()
        cursor.close()

        # 格式化数据
        industry_data = []
        for row in results:
            industry_data.append({
                'industry': row[0],
                'total_amount': float(row[1]) if row[1] is not None else 0.0,
                'stock_count': int(row[2]) if row[2] is not None else 0
            })

        # 格式化日期
        formatted_date = f"{trade_date[:4]}-{trade_date[4:6]}-{trade_date[6:]}"

        return jsonify({
            'status': 'success',
            'data': industry_data,
            'trade_date': formatted_date
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/industry_trend')
@app.route('/industry_trend.html')  # 添加.html后缀的路由
def industry_trend_page():
    return send_from_directory(app.static_folder, 'industry_trend.html')

@app.route('/api/industries')
def get_industries():
    try:
        cursor = get_db_connection().cursor()
        sql = """
            SELECT DISTINCT industry 
            FROM company_info_list 
            WHERE industry IS NOT NULL 
            ORDER BY industry
        """
        cursor.execute(sql)
        industries = [row[0] for row in cursor.fetchall()]
        cursor.close()
        
        return jsonify({
            'success': True,
            'industries': industries
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/industry/trend')
def get_industry_trend():
    try:
        industry = request.args.get('industry')
        if not industry:
            return jsonify({
                'success': False,
                'message': '请提供行业名称'
            })
            
        cursor = get_db_connection().cursor()
        
        # 获取最近30天的日期
        sql = """
            SELECT DISTINCT trade_date 
            FROM daily_data 
            ORDER BY trade_date DESC 
            LIMIT 30
        """
        cursor.execute(sql)
        dates = [row[0] for row in cursor.fetchall()]
        dates.reverse()  # 按时间正序排列
        
        # 获取每天的行业成交额和排名
        amounts = []
        rankings = []
        
        for date in dates:
            # 计算该行业当天的总成交额
            sql = """
                SELECT 
                    SUM(dd.amount) as total_amount
                FROM daily_data dd
                JOIN company_info_list ci ON dd.ts_code = ci.ts_code
                WHERE dd.trade_date = %s AND ci.industry = %s
            """
            cursor.execute(sql, (date, industry))
            amount = cursor.fetchone()[0] or 0
            amounts.append(float(amount))
            
            # 计算该行业在当天的排名
            sql = """
                WITH industry_amounts AS (
                    SELECT 
                        ci.industry,
                        SUM(dd.amount) as total_amount,
                        RANK() OVER (ORDER BY SUM(dd.amount) DESC) as `rank`
                    FROM daily_data dd
                    JOIN company_info_list ci ON dd.ts_code = ci.ts_code
                    WHERE dd.trade_date = %s AND ci.industry IS NOT NULL
                    GROUP BY ci.industry
                )
                SELECT `rank`
                FROM industry_amounts
                WHERE industry = %s
            """
            cursor.execute(sql, (date, industry))
            rank = cursor.fetchone()
            rankings.append(int(rank[0]) if rank else None)
        
        cursor.close()
        
        # 格式化日期
        formatted_dates = [f"{str(d)[:4]}-{str(d)[4:6]}-{str(d)[6:]}" for d in dates]
        
        return jsonify({
            'success': True,
            'data': {
                'dates': formatted_dates,
                'amounts': amounts,
                'rankings': rankings
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/industry_metrics')
def industry_metrics_page():
    return send_from_directory(app.static_folder, 'industry_metrics.html')

@app.route('/api/industry/metrics')
def get_industry_metrics():
    try:
        trade_date = request.args.get('date')
        cursor = get_db_connection().cursor()
        
        if not trade_date:
            cursor.execute("SELECT MAX(trade_date) as latest_date FROM daily_stock_data")
            result = cursor.fetchone()
            trade_date = result[0]

        sql = """
        WITH industry_amount AS (
            SELECT 
                ci.industry,
                SUM(dd.amount) as total_amount,
                RANK() OVER (ORDER BY SUM(dd.amount) DESC) as amount_rank
            FROM daily_data dd
            JOIN company_info_list ci ON dd.ts_code = ci.ts_code
            WHERE dd.trade_date = %s AND ci.industry IS NOT NULL
            GROUP BY ci.industry
        )
        SELECT 
            ci.industry,
            ia.total_amount,
            ia.amount_rank,
            ROUND(AVG(NULLIF(ds.pe, 0)), 2) as avg_pe,
            ROUND(AVG(NULLIF(ds.pb, 0)), 2) as avg_pb,
            ROUND(AVG(NULLIF(ds.ps, 0)), 2) as avg_ps,
            ROUND(AVG(NULLIF(ds.turnover_rate, 0)), 2) as avg_turnover,
            ROUND(AVG(NULLIF(ds.total_mv, 0))/10000, 2) as avg_total_mv  -- 从万元转换为亿元
        FROM daily_stock_data ds
        JOIN company_info_list ci ON ds.ts_code = ci.ts_code
        JOIN industry_amount ia ON ci.industry = ia.industry
        WHERE ds.trade_date = %s AND ci.industry IS NOT NULL
        GROUP BY ci.industry, ia.total_amount, ia.amount_rank
        ORDER BY ia.amount_rank ASC
        """
        
        cursor.execute(sql, (trade_date, trade_date))
        results = cursor.fetchall()
        cursor.close()

        industry_data = []
        for row in results:
            industry_data.append({
                'industry': row[0],
                'totalAmount': float(row[1]) if row[1] is not None else None,
                'amountRank': int(row[2]) if row[2] is not None else None,
                'avgPE': float(row[3]) if row[3] is not None else None,
                'avgPB': float(row[4]) if row[4] is not None else None,
                'avgPS': float(row[5]) if row[5] is not None else None,
                'avgTurnover': float(row[6]) if row[6] is not None else None,
                'avgTotalMV': float(row[7]) if row[7] is not None else None
            })

        formatted_date = f"{trade_date[:4]}-{trade_date[4:6]}-{trade_date[6:]}"
        
        return jsonify({
            'success': True,
            'data': industry_data,
            'trade_date': formatted_date
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/industry/top_companies')
def get_industry_top_companies():
    try:
        industry = request.args.get('industry')
        trade_date = request.args.get('date')
        
        if not industry:
            return jsonify({
                'success': False,
                'message': '请提供行业名称'
            })
            
        cursor = get_db_connection().cursor()
        
        if not trade_date:
            cursor.execute("SELECT MAX(trade_date) as latest_date FROM daily_stock_data")
            result = cursor.fetchone()
            trade_date = result[0]

        # 获取行业内成交额前20的公司数据
        sql = """
        SELECT 
            ds.ts_code,
            ci.name,
            dd.amount as daily_amount,
            ds.pe,
            ds.pb,
            ds.ps,
            ds.turnover_rate,
            ds.total_mv/10000 as total_mv  # 从万元转换为亿元
        FROM daily_data dd
        JOIN company_info_list ci ON dd.ts_code = ci.ts_code
        JOIN daily_stock_data ds ON dd.ts_code = ds.ts_code AND dd.trade_date = ds.trade_date
        WHERE dd.trade_date = %s 
        AND ci.industry = %s
        ORDER BY dd.amount DESC
        LIMIT 20
        """
        
        cursor.execute(sql, (trade_date, industry))
        results = cursor.fetchall()
        cursor.close()

        companies_data = []
        for row in results:
            companies_data.append({
                'tsCode': row[0],
                'name': row[1],
                'amount': float(row[2])/10000 if row[2] else None,  # 转换为亿元
                'pe': float(row[3]) if row[3] else None,
                'pb': float(row[4]) if row[4] else None,
                'ps': float(row[5]) if row[5] else None,
                'turnoverRate': float(row[6]) if row[6] else None,
                'totalMv': float(row[7]) if row[7] else None
            })

        return jsonify({
            'success': True,
            'data': companies_data,
            'industry': industry,
            'trade_date': trade_date
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/stock/changes')
def get_stock_changes():
    try:
        code = request.args.get('code')
        name = request.args.get('name')
        
        conditions = []
        params = []
        if code:
            conditions.append("ci.ts_code LIKE %s")
            params.append(f"%{code}%")
        if name:
            conditions.append("ci.name LIKE %s")
            params.append(f"%{name}%")
            
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        cursor = get_db_connection().cursor()
        
        sql = f"""
        WITH latest_dates AS (
            SELECT 
                MAX(trade_date) as latest_weekly_date,
                (SELECT MAX(trade_date) FROM stock_monthly_info) as latest_monthly_date
            FROM stock_weekly_info
        ),
        monthly_changes AS (
            SELECT 
                m1.ts_code,
                m1.close as latest_close,
                m3.close as m3_close,
                m6.close as m6_close,
                m12.close as m12_close,
                m1.trade_date,
                m12.trade_date as m12_trade_date
            FROM stock_monthly_info m1
            LEFT JOIN (
                SELECT ts_code, close, trade_date
                FROM stock_monthly_info m3
                WHERE trade_date = (
                    SELECT MAX(trade_date)
                    FROM stock_monthly_info
                    WHERE trade_date <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%%Y%%m%%d')
                )
            ) m3 ON m1.ts_code = m3.ts_code
            LEFT JOIN (
                SELECT ts_code, close, trade_date
                FROM stock_monthly_info m6
                WHERE trade_date = (
                    SELECT MAX(trade_date)
                    FROM stock_monthly_info
                    WHERE trade_date <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%%Y%%m%%d')
                )
            ) m6 ON m1.ts_code = m6.ts_code
            LEFT JOIN (
                SELECT ts_code, close, trade_date
                FROM stock_monthly_info m12
                WHERE trade_date = (
                    SELECT MAX(trade_date)
                    FROM stock_monthly_info
                    WHERE trade_date <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 12 MONTH), '%%Y%%m%%d')
                )
            ) m12 ON m1.ts_code = m12.ts_code
            WHERE m1.trade_date = (SELECT latest_monthly_date FROM latest_dates)
        )
        SELECT 
            ci.ts_code,
            ci.name,
            w.change as weekly_change,
            m.change as monthly_change,
            ROUND(CASE WHEN mc.m3_close > 0 THEN (mc.latest_close/mc.m3_close - 1) * 100 ELSE NULL END, 2) as change_3m,
            ROUND(CASE WHEN mc.m6_close > 0 THEN (mc.latest_close/mc.m6_close - 1) * 100 ELSE NULL END, 2) as change_6m,
            ROUND(CASE WHEN mc.m12_close > 0 THEN (mc.latest_close/mc.m12_close - 1) * 100 ELSE NULL END, 2) as change_1y,
            mc.trade_date as monthly_date,
            mc.m12_trade_date,
            mc.latest_close,
            mc.m12_close
        FROM company_info_list ci
        LEFT JOIN stock_weekly_info w ON ci.ts_code = w.ts_code 
            AND w.trade_date = (SELECT latest_weekly_date FROM latest_dates)
        LEFT JOIN stock_monthly_info m ON ci.ts_code = m.ts_code 
            AND m.trade_date = (SELECT latest_monthly_date FROM latest_dates)
        LEFT JOIN monthly_changes mc ON ci.ts_code = mc.ts_code
        WHERE {where_clause}
        ORDER BY ci.ts_code
        """
        
        cursor.execute(sql, params)
        results = cursor.fetchall()
        cursor.close()
        
        stocks_data = []
        for row in results:
            stocks_data.append({
                'tsCode': row[0],
                'name': row[1],
                'weeklyChange': float(row[2]) if row[2] is not None else None,
                'monthlyChange': float(row[3]) if row[3] is not None else None,
                'change3m': float(row[4]) if row[4] is not None else None,
                'change6m': float(row[5]) if row[5] is not None else None,
                'change1y': float(row[6]) if row[6] is not None else None,
                'updateDate': row[7],
                'm12TradeDate': row[8],
                'latestClose': float(row[9]) if row[9] is not None else None,
                'm12Close': float(row[10]) if row[10] is not None else None
            })
            
        return jsonify({
            'success': True,
            'data': stocks_data
        })
        
    except Exception as e:
        print(f"Error in get_stock_changes: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/top_traders')
def top_traders_page():
    return send_from_directory(app.static_folder, 'top_traders.html')

@app.route('/api/top_traders')
def get_top_traders():
    try:
        trade_date = request.args.get('date')
        cursor = get_db_connection().cursor()
        
        if not trade_date:
            cursor.execute("SELECT MAX(trade_date) as latest_date FROM stock_top_inst")
            result = cursor.fetchone()
            trade_date = result[0]
        
        # 获取买入龙虎榜数据
        buy_sql = """
        SELECT 
            st.ts_code,
            ci.name,
            st.buy/10000 as buy_amount,  # 转换为万元
            st.buy_rate,
            st.exalter
        FROM stock_top_inst st
        LEFT JOIN company_info_list ci ON st.ts_code = ci.ts_code
        WHERE st.trade_date = %s AND st.buy > 0
        ORDER BY st.buy DESC
        LIMIT 100
        """
        
        # 获取卖出龙虎榜数据
        sell_sql = """
        SELECT 
            st.ts_code,
            ci.name,
            st.sell/10000 as sell_amount,  # 转换为万元
            st.sell_rate,
            st.exalter
        FROM stock_top_inst st
        LEFT JOIN company_info_list ci ON st.ts_code = ci.ts_code
        WHERE st.trade_date = %s AND st.sell > 0
        ORDER BY st.sell DESC
        LIMIT 100
        """
        
        cursor.execute(buy_sql, (trade_date,))
        buy_results = cursor.fetchall()
        
        cursor.execute(sell_sql, (trade_date,))
        sell_results = cursor.fetchall()
        
        cursor.close()
        
        # 处理买入数据
        buy_data = []
        for i, row in enumerate(buy_results):
            buy_data.append({
                'rank': i + 1,
                'tsCode': row[0],
                'name': row[1],
                'buyAmount': float(row[2]) if row[2] is not None else 0,
                'buyRate': float(row[3]) if row[3] is not None else 0,
                'exalter': row[4]
            })
        
        # 处理卖出数据
        sell_data = []
        for i, row in enumerate(sell_results):
            sell_data.append({
                'rank': i + 1,
                'tsCode': row[0],
                'name': row[1],
                'sellAmount': float(row[2]) if row[2] is not None else 0,
                'sellRate': float(row[3]) if row[3] is not None else 0,
                'exalter': row[4]
            })
        
        # 格式化日期
        formatted_date = f"{trade_date[:4]}-{trade_date[4:6]}-{trade_date[6:]}"
        
        return jsonify({
            'success': True,
            'data': {
                'buyData': buy_data,
                'sellData': sell_data
            },
            'trade_date': formatted_date
        })
        
    except Exception as e:
        print(f"Error in get_top_traders: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# 登录页面路由
@app.route('/login.html')
def login_page():
    if 'user_id' in session:
        return redirect('/')
    return send_from_directory(app.static_folder, 'login.html')

# 设置页面路由
@app.route('/settings.html')
@check_permission('settings.html')
def settings_page():
    return send_from_directory(app.static_folder, 'settings.html')

# 用户管理页面路由
@app.route('/user_management.html')
@check_permission('user_management.html')
def user_management_page():
    return send_from_directory(app.static_folder, 'user_management.html')

# 权限管理页面路由
@app.route('/permission_management.html')
@check_permission('permission_management.html')
def permission_management_page():
    return send_from_directory(app.static_folder, 'permission_management.html')

# 登录API
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': '用户名和密码不能为空'})
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, username, password_hash, role FROM users WHERE username = %s AND is_active = TRUE",
                (username,)
            )
            user = cursor.fetchone()
            
            if user and verify_password(user[2], password):
                # 更新最后登录时间
                cursor.execute(
                    "UPDATE users SET last_login = NOW() WHERE id = %s",
                    (user[0],)
                )
                conn.commit()
                
                # 设置session
                session['user_id'] = user[0]
                session['username'] = user[1]
                session['role'] = user[3]
                session.permanent = True
                
                # 获取用户权限
                cursor.execute("""
                    SELECT p.page_path FROM permissions p
                    JOIN user_permissions up ON p.id = up.permission_id
                    WHERE up.user_id = %s
                """, (user[0],))
                
                permissions = [row[0] for row in cursor.fetchall()]
                session['permissions'] = permissions
                
                return jsonify({
                    'success': True,
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'role': user[3],
                        'permissions': permissions
                    }
                })
            else:
                return jsonify({'success': False, 'message': '用户名或密码错误'})
    finally:
        conn.close()

# 注销API
@app.route('/api/logout', methods=['POST'])
def logout():
    print("收到退出登录请求，当前session:", session)
    if 'user_id' in session:
        print(f"用户退出登录: user_id={session['user_id']}, username={session.get('username', '未知')}")
    else:
        print("退出登录请求，但用户未登录")
    
    # 清除session
    session.clear()
    print("清除session完成")
    
    response = jsonify({'success': True, 'message': '成功退出登录'})
    print("构建响应完成:", response)
    return response

# 获取当前用户信息
@app.route('/api/current_user')
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'success': False, 'authenticated': False})
    
    return jsonify({
        'success': True,
        'authenticated': True,
        'user': {
            'id': session['user_id'],
            'username': session['username'],
            'role': session['role'],
            'permissions': session.get('permissions', [])
        }
    })

# 获取所有用户列表（仅管理员可用）
@app.route('/api/users')
def get_users():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': '无权访问'}), 403
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, username, role, created_at, last_login, is_active FROM users"
            )
            users = []
            for row in cursor.fetchall():
                users.append({
                    'id': row[0],
                    'username': row[1],
                    'role': row[2],
                    'created_at': row[3].strftime('%Y-%m-%d %H:%M:%S') if row[3] else None,
                    'last_login': row[4].strftime('%Y-%m-%d %H:%M:%S') if row[4] else None,
                    'is_active': bool(row[5])
                })
            
            return jsonify({'success': True, 'users': users})
    finally:
        conn.close()

# 创建新用户（仅管理员可用）
@app.route('/api/users', methods=['POST'])
def create_user():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': '无权创建用户'}), 403
    
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'normal')
    
    if not username or not password:
        return jsonify({'success': False, 'message': '用户名和密码不能为空'})
    
    if role not in USER_ROLES:
        return jsonify({'success': False, 'message': '无效的用户角色'})
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 检查用户名是否已存在
            cursor.execute("SELECT COUNT(*) FROM users WHERE username = %s", (username,))
            if cursor.fetchone()[0] > 0:
                return jsonify({'success': False, 'message': '用户名已存在'})
            
            # 创建用户
            password_hash = hash_password(password)
            cursor.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)",
                (username, password_hash, role)
            )
            conn.commit()
            
            # 获取新创建的用户ID
            user_id = cursor.lastrowid
            
            # 如果是管理员，为其添加所有权限
            if role == 'admin':
                cursor.execute("SELECT id FROM permissions")
                permission_ids = cursor.fetchall()
                
                for permission_id in permission_ids:
                    cursor.execute(
                        "INSERT INTO user_permissions (user_id, permission_id) VALUES (%s, %s)",
                        (user_id, permission_id[0])
                    )
                conn.commit()
            
            return jsonify({'success': True, 'message': '用户创建成功', 'user_id': user_id})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'创建用户失败: {str(e)}'})
    finally:
        conn.close()

# 更新用户信息（仅管理员可用）
@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': '无权修改用户'}), 403
    
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')  # 可选，如果提供则更新密码
    role = data.get('role')
    is_active = data.get('is_active')
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 检查用户是否存在
            cursor.execute("SELECT COUNT(*) FROM users WHERE id = %s", (user_id,))
            if cursor.fetchone()[0] == 0:
                return jsonify({'success': False, 'message': '用户不存在'})
            
            # 检查是否更新自己的账户
            if int(session['user_id']) == user_id and (role != session['role'] or is_active is False):
                return jsonify({'success': False, 'message': '不能降级或禁用自己的账户'})
            
            # 构建更新语句
            update_fields = []
            params = []
            
            if username:
                # 检查新用户名是否与其他用户冲突
                cursor.execute("SELECT COUNT(*) FROM users WHERE username = %s AND id != %s", (username, user_id))
                if cursor.fetchone()[0] > 0:
                    return jsonify({'success': False, 'message': '用户名已存在'})
                
                update_fields.append("username = %s")
                params.append(username)
            
            if password:
                password_hash = hash_password(password)
                update_fields.append("password_hash = %s")
                params.append(password_hash)
            
            if role:
                if role not in USER_ROLES:
                    return jsonify({'success': False, 'message': '无效的用户角色'})
                update_fields.append("role = %s")
                params.append(role)
            
            if is_active is not None:
                update_fields.append("is_active = %s")
                params.append(is_active)
            
            if not update_fields:
                return jsonify({'success': False, 'message': '没有提供要更新的字段'})
            
            # 执行更新
            params.append(user_id)
            cursor.execute(
                f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s",
                tuple(params)
            )
            
            # 如果角色变更为管理员，为其添加所有权限
            if role == 'admin':
                # 删除现有权限
                cursor.execute("DELETE FROM user_permissions WHERE user_id = %s", (user_id,))
                
                # 添加所有权限
                cursor.execute("SELECT id FROM permissions")
                permission_ids = cursor.fetchall()
                
                for permission_id in permission_ids:
                    cursor.execute(
                        "INSERT INTO user_permissions (user_id, permission_id) VALUES (%s, %s)",
                        (user_id, permission_id[0])
                    )
            
            conn.commit()
            return jsonify({'success': True, 'message': '用户更新成功'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'更新用户失败: {str(e)}'})
    finally:
        conn.close()

# 删除用户（仅管理员可用）
@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': '无权删除用户'}), 403
    
    # 不允许删除自己
    if int(session['user_id']) == user_id:
        return jsonify({'success': False, 'message': '不能删除自己的账户'})
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 检查用户是否存在
            cursor.execute("SELECT COUNT(*) FROM users WHERE id = %s", (user_id,))
            if cursor.fetchone()[0] == 0:
                return jsonify({'success': False, 'message': '用户不存在'})
            
            # 删除用户
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
            
            return jsonify({'success': True, 'message': '用户删除成功'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'删除用户失败: {str(e)}'})
    finally:
        conn.close()

# 获取所有权限
@app.route('/api/permissions')
def get_permissions():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': '无权访问'}), 403
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, page_name, page_path, description FROM permissions"
            )
            permissions = []
            for row in cursor.fetchall():
                permissions.append({
                    'id': row[0],
                    'page_name': row[1],
                    'page_path': row[2],
                    'description': row[3]
                })
            
            return jsonify({'success': True, 'permissions': permissions})
    finally:
        conn.close()

# 获取用户权限
@app.route('/api/users/<int:user_id>/permissions')
def get_user_permissions(user_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'}), 401
    
    # 普通用户只能查看自己的权限，管理员可以查看所有用户的权限
    if int(session['user_id']) != user_id and session.get('role') != 'admin':
        return jsonify({'success': False, 'message': '无权访问'}), 403
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 检查用户是否存在
            cursor.execute("SELECT COUNT(*) FROM users WHERE id = %s", (user_id,))
            if cursor.fetchone()[0] == 0:
                return jsonify({'success': False, 'message': '用户不存在'})
            
            # 获取用户权限
            cursor.execute("""
                SELECT p.id, p.page_name, p.page_path, p.description
                FROM permissions p
                JOIN user_permissions up ON p.id = up.permission_id
                WHERE up.user_id = %s
            """, (user_id,))
            
            permissions = []
            for row in cursor.fetchall():
                permissions.append({
                    'id': row[0],
                    'page_name': row[1],
                    'page_path': row[2],
                    'description': row[3]
                })
            
            return jsonify({'success': True, 'permissions': permissions})
    finally:
        conn.close()

# 更新用户权限
@app.route('/api/users/<int:user_id>/permissions', methods=['PUT'])
def update_user_permissions(user_id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': '无权修改用户权限'}), 403
    
    data = request.get_json()
    permission_ids = data.get('permission_ids', [])
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 检查用户是否存在
            cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({'success': False, 'message': '用户不存在'})
            
            # 检查是否是管理员，管理员不能修改其权限
            if user[0] == 'admin':
                return jsonify({'success': False, 'message': '不能修改管理员的权限，管理员拥有所有权限'})
            
            # 删除现有权限
            cursor.execute("DELETE FROM user_permissions WHERE user_id = %s", (user_id,))
            
            # 添加新权限
            for permission_id in permission_ids:
                # 检查权限ID是否有效
                cursor.execute("SELECT COUNT(*) FROM permissions WHERE id = %s", (permission_id,))
                if cursor.fetchone()[0] == 0:
                    return jsonify({'success': False, 'message': f'权限ID {permission_id} 不存在'})
                
                cursor.execute(
                    "INSERT INTO user_permissions (user_id, permission_id) VALUES (%s, %s)",
                    (user_id, permission_id)
                )
            
            conn.commit()
            return jsonify({'success': True, 'message': '用户权限更新成功'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'更新用户权限失败: {str(e)}'})
    finally:
        conn.close()

# 在应用启动时检查设置页面权限
@app.route('/api/check_settings_permission')
def check_settings_permission():
    # 检查设置页面权限
    if 'user_id' not in session:
        return jsonify({'success': False, 'authenticated': False})
    
    # 管理员可以访问所有设置
    if session.get('role') == 'admin':
        return jsonify({
            'success': True,
            'authenticated': True,
            'has_user_management': True,
            'has_permission_management': True
        })
    
    # 检查普通用户是否有对应权限
    permissions = session.get('permissions', [])
    
    return jsonify({
        'success': True,
        'authenticated': True,
        'has_user_management': 'user_management.html' in permissions,
        'has_permission_management': 'permission_management.html' in permissions
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 