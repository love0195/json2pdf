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
    return {
        "title": "白龙马",
        "type": "歌曲",
        "content": [
            [["白","bái"],["龙","lóng"],["马","mǎ"]],
            [["白","bái"],["龙","lóng"],["马","mǎ"],["蹄","tí"],["儿","ér"],["朝","cháo"],["西","xī"]],
            [["驮","tuó"],["着","zhe"],["唐","táng"],["三","sān"],["藏","zàng"],["跟","gēn"],["着","zhe"],["仨","sā"],["徒","tú"],["弟","dì"]],
            [["西","xī"],["天","tiān"],["取","qǔ"],["经","jīng"],["上","shàng"],["大","dà"],["路","lù"]],
            [["一","yī"],["走","zǒu"],["就","jiù"],["是","shì"],["几","jǐ"],["万","wàn"],["里","lǐ"]],
            [["什","shén"],["么","me"],["妖","yāo"],["魔","mó"],["鬼","guǐ"],["怪","guài"],["什","shén"],["么","me"],["美","měi"],["女","nǚ"],["画","huà"],["皮","pí"]],
            [["什","shén"],["么","me"],["刀","dāo"],["山","shān"],["火","huǒ"],["海","hǎi"],["什","shén"],["么","me"],["陷","xiàn"],["阱","jǐng"],["诡","guǐ"],["计","jì"]],
            [["都","dōu"],["挡","dǎng"],["不","bù"],["住","zhù"],["火","huǒ"],["眼","yǎn"],["金","jīn"],["睛","jīng"],["的","de"],["如","rú"],["意","yì"],["棒","bàng"]],
            [["护","hù"],["送","sòng"],["师","shī"],["徒","tú"],["朝","cháo"],["西","xī"],["去","qù"]],
            [["白","bái"],["龙","lóng"],["马","mǎ"],["脖","bó"],["铃","líng"],["儿","ér"],["急","jí"]],
            [["颠","diān"],["簸","bǒ"],["唐","táng"],["玄","xuán"],["奘","zàng"],["小","xiǎo"],["跑","pǎo"],["仨","sā"],["兄","xiōng"],["弟","dì"]],
            [["西","xī"],["天","tiān"],["取","qǔ"],["经","jīng"],["不","bù"],["容","róng"],["易","yì"]],
            [["容","róng"],["易","yì"],["干","gàn"],["不","bù"],["成","chéng"],["大","dà"],["业","yè"],["绩","jì"]],
            [["什","shén"],["么","me"],["魔","mó"],["法","fǎ"],["狠","hěn"],["毒","dú"],["自","zì"],["有","yǒu"],["招","zhāo"],["数","shù"],["神","shén"],["奇","qí"]],
            [["八","bā"],["十","shí"],["一","yī"],["难","nàn"],["拦","lán"],["路","lù"],["七","qī"],["十","shí"],["二","èr"],["变","biàn"],["制","zhì"],["敌","dí"]],
            [["西","xī"],["天","tiān"],["取","qǔ"],["经","jīng"],["不","bù"],["容","róng"],["易","yì"]],
            [["容","róng"],["易","yì"],["干","gàn"],["不","bù"],["成","chéng"],["大","dà"],["业","yè"],["绩","jì"]]
        ]
    }

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/api/data', methods=['GET'])
def get_data():
    data = load_data()
    return jsonify(data)

@app.route('/api/data', methods=['POST'])
def update_data():
    new_data = request.get_json()
    save_data(new_data)
    return jsonify({"status": "success"})

@app.route('/api/data/title', methods=['PUT'])
def update_title():
    data = load_data()
    data['title'] = request.json.get('title', data['title'])
    save_data(data)
    return jsonify({"status": "success", "title": data['title']})

@app.route('/api/data/content', methods=['POST'])
def add_content():
    data = load_data()
    new_line = request.json.get('content', [])
    if new_line:
        data['content'].append(new_line)
        save_data(data)
    return jsonify({"status": "success", "content": data['content']})

@app.route('/api/data/content/<int:index>', methods=['PUT'])
def update_line(index):
    data = load_data()
    if 0 <= index < len(data['content']):
        data['content'][index] = request.json.get('content', data['content'][index])
        save_data(data)
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Index out of range"}), 400

@app.route('/api/data/content/<int:index>', methods=['DELETE'])
def delete_line(index):
    data = load_data()
    if 0 <= index < len(data['content']):
        del data['content'][index]
        save_data(data)
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Index out of range"}), 400

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    if path == '' or not os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, 'index.html')
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    if not os.path.exists(DATA_FILE):
        save_data(load_data())
    app.run(host='0.0.0.0', port=5000)
