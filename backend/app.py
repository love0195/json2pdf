from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os

app = Flask(__name__, static_folder='static')
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'pinyin_data.json')

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"documents": [], "settings": {"fontSize": 20, "pyFontSize": 12}}

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/api/data', methods=['GET'])
def get_data():
    data = load_data()
    return jsonify(data)

@app.route('/api/data/settings', methods=['GET'])
def get_settings():
    data = load_data()
    return jsonify(data.get('settings', {"fontSize": 20, "pyFontSize": 12}))

@app.route('/api/data/settings', methods=['PUT'])
def update_settings():
    settings = request.get_json()
    data = load_data()
    data['settings'] = settings
    save_data(data)
    return jsonify({"status": "success", "settings": settings})

@app.route('/api/data/documents', methods=['GET'])
def get_documents():
    data = load_data()
    return jsonify(data.get('documents', []))

@app.route('/api/data/documents', methods=['POST'])
def add_document():
    doc = request.get_json()
    if not doc or 'content' not in doc:
        return jsonify({"status": "error", "message": "缺少content字段"}), 400
    
    data = load_data()
    if 'documents' not in data:
        data['documents'] = []
    
    doc['id'] = doc.get('id', str(len(data['documents']) + 1))
    doc['title'] = doc.get('title', f'文档{len(data["documents"]) + 1}')
    data['documents'].append(doc)
    save_data(data)
    return jsonify({"status": "success", "document": doc})

@app.route('/api/data/documents/<doc_id>', methods=['PUT'])
def update_document(doc_id):
    updated_doc = request.get_json()
    data = load_data()
    
    for i, doc in enumerate(data.get('documents', [])):
        if doc.get('id') == doc_id:
            updated_doc['id'] = doc_id
            data['documents'][i] = updated_doc
            save_data(data)
            return jsonify({"status": "success"})
    
    return jsonify({"status": "error", "message": "文档不存在"}), 404

@app.route('/api/data/documents/<doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    data = load_data()
    data['documents'] = [d for d in data.get('documents', []) if d.get('id') != doc_id]
    save_data(data)
    return jsonify({"status": "success"})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    if path == '' or not os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, 'index.html')
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    if not os.path.exists(DATA_FILE):
        save_data({"documents": []})
    app.run(host='0.0.0.0', port=5000)
