from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import json

app = Flask(__name__, static_folder='static')
CORS(app)

# 数据库目录和文件路径
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
DB_PATH = os.path.join(DATA_DIR, 'pinyin.db')

def init_db():
    """初始化数据库"""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 创建文档表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建设置表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')
    
    # 检查是否有默认设置，如果没有则添加
    cursor.execute("SELECT COUNT(*) FROM settings WHERE key = 'fontSize'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO settings (key, value) VALUES (?, ?)", ('fontSize', '20'))
        cursor.execute("INSERT INTO settings (key, value) VALUES (?, ?)", ('pyFontSize', '12'))
    
    conn.commit()
    conn.close()

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_settings():
    """获取设置"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    settings = {row['key']: row['value'] for row in rows}
    conn.close()
    return {
        'fontSize': int(settings.get('fontSize', 20)),
        'pyFontSize': int(settings.get('pyFontSize', 12))
    }

def save_settings(settings):
    """保存设置"""
    conn = get_db_connection()
    cursor = conn.cursor()
    for key, value in settings.items():
        cursor.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            (key, str(value))
        )
    conn.commit()
    conn.close()

@app.route('/api/data', methods=['GET'])
def get_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, content FROM documents")
    docs = cursor.fetchall()
    conn.close()
    
    documents = []
    for doc in docs:
        documents.append({
            'id': doc['id'],
            'title': doc['title'],
            'content': json.loads(doc['content'])
        })
    
    return jsonify({'documents': documents, 'settings': get_settings()})

@app.route('/api/data/documents', methods=['GET'])
def get_documents():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, content FROM documents")
    docs = cursor.fetchall()
    conn.close()
    
    documents = []
    for doc in docs:
        documents.append({
            'id': doc['id'],
            'title': doc['title'],
            'content': json.loads(doc['content'])
        })
    
    return jsonify(documents)

@app.route('/api/data/documents', methods=['POST'])
def add_document():
    doc_data = request.get_json()
    if not doc_data or 'content' not in doc_data:
        return jsonify({"status": "error", "message": "缺少content字段"}), 400
    
    doc_id = doc_data.get('id', str(int(os.times()[4])))
    title = doc_data.get('title', f'文档{doc_id}')
    content = json.dumps(doc_data['content'], ensure_ascii=False)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO documents (id, title, content) VALUES (?, ?, ?)",
        (doc_id, title, content)
    )
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success", "document": {'id': doc_id, 'title': title, 'content': doc_data['content']}})

@app.route('/api/data/documents/<doc_id>', methods=['PUT'])
def update_document(doc_id):
    doc_data = request.get_json()
    content = json.dumps(doc_data['content'], ensure_ascii=False)
    title = doc_data.get('title', '未命名文档')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE documents SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (title, json.dumps(doc_data.get('content'), ensure_ascii=False), doc_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success"})

@app.route('/api/data/documents/<doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success"})

@app.route('/api/data/settings', methods=['GET'])
def api_get_settings():
    return jsonify(get_settings())

@app.route('/api/data/settings', methods=['PUT'])
def api_update_settings():
    settings = request.get_json()
    save_settings(settings)
    return jsonify({"status": "success", "settings": settings})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    if path == '' or not os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, 'index.html')
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
