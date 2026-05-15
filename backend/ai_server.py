import os
import base64
from io import BytesIO
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO

app = Flask(__name__)
CORS(app) # Allow cross-origin requests

# โหลดโมเดล (ปรับ path ให้ตรงกับที่ตั้งของ best.pt)
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'best.pt'))
try:
    model = YOLO(model_path)
    print(f"Loaded model from {model_path}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
        
    file = request.files['image']
    temp_path = 'temp_image.jpg'
    file.save(temp_path)
    
    try:
        # ทำการคาดการณ์ (Prediction) โดยกำหนดค่าความมั่นใจขั้นต่ำที่ 0.5 (50%)
        results = model(temp_path, conf=0.5)
        result = results[0]
        
        # วาด bounding box หรือข้อมูลวิเคราะห์ลงในภาพ
        plotted_img_array = result.plot()
        # แปลง BGR เป็น RGB สำหรับ PIL และแปลงเป็น base64
        plotted_img = Image.fromarray(plotted_img_array[..., ::-1])
        buffered = BytesIO()
        plotted_img.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        img_base64 = f"data:image/jpeg;base64,{img_str}"
        
        # พจนานุกรมสำหรับแปลงชื่อคลาสของ AI ให้ตรงกับตาราง material ใน Supabase
        # คลาสที่ได้จาก best.pt: GLASS, HDPE, LDPE, METAL, OTHERS, PAPER, PETE, PP, PS, PVC
        class_map = {
            "glass": "glass",
            "hdpe": "HDPE",
            "ldpe": "LDPE",
            "metal": "metal",
            "others": "OTHER",
            "paper": "paper",
            "pete": "PETE",
            "pp": "PP",
            "ps": "PS",
            "pvc": "PVC"
        }

        # ตรวจสอบว่าเป็นโมเดล Classification หรือ Object Detection
        predictions = []
        if result.probs is not None:
            # Image Classification (คืนค่าอันดับ 1)
            top1_index = result.probs.top1
            conf = float(result.probs.top1conf)
            raw_name = result.names[top1_index]
            mapped_name = class_map.get(raw_name.lower(), raw_name)
            predictions.append({
                'class_name': mapped_name,
                'raw_class_name': raw_name,
                'confidence': conf
            })
        elif result.boxes is not None and len(result.boxes) > 0:
            # Object Detection (คืนค่าทุก object ที่ตรวจเจอ)
            for box in result.boxes:
                conf = float(box.conf[0])
                raw_name = result.names[int(box.cls[0])]
                mapped_name = class_map.get(raw_name.lower(), raw_name)
                predictions.append({
                    'class_name': mapped_name,
                    'raw_class_name': raw_name,
                    'confidence': conf
                })
        else:
            return jsonify({'error': 'No objects detected', 'predictions': []}), 200
            
        return jsonify({
            'predictions': predictions,
            'image_base64': img_base64
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    # รันบน host 0.0.0.0 เพื่อให้เครื่องอื่น (มือถือ, emulator) เรียกใช้งานได้
    app.run(host='0.0.0.0', port=5000, debug=True)
