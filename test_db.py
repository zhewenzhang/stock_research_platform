import pymysql

# 数据库配置
DB_CONFIG = {
    'host': '139.199.228.87',
    'port': 9998,
    'user': 'root',
    'password': 'mysql_NGhBZQ',
    'database': 'tushare_api',
    'charset': 'utf8mb4'
}

def test_connection():
    try:
        # 尝试连接数据库
        conn = pymysql.connect(**DB_CONFIG)
        print("数据库连接成功！")
        
        # 测试查询
        with conn.cursor() as cursor:
            # 测试 daily_data 表
            cursor.execute("SELECT COUNT(*) FROM daily_data")
            daily_count = cursor.fetchone()[0]
            print(f"daily_data 表记录数: {daily_count}")
            
            # 测试 stock_basic 表
            cursor.execute("SELECT COUNT(*) FROM stock_basic")
            basic_count = cursor.fetchone()[0]
            print(f"stock_basic 表记录数: {basic_count}")
            
            # 测试关联查询
            cursor.execute("""
                SELECT COUNT(*) 
                FROM daily_data d
                LEFT JOIN stock_basic s ON d.ts_code = s.ts_code
                LIMIT 1
            """)
            join_count = cursor.fetchone()[0]
            print(f"关联查询测试成功，记录数: {join_count}")
        
        conn.close()
        print("数据库连接已关闭")
        
    except Exception as e:
        print(f"数据库连接测试失败: {str(e)}")

if __name__ == "__main__":
    test_connection() 