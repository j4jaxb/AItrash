import os
import base64
from io import BytesIO
from PIL import Image
import cv2
import numpy as np
import datetime
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO

def check_image_similarity(img_path1, img_path2):
    """
    เปรียบเทียบความคล้ายกันของสองภาพด้วย ORB Feature Matching
    คืนค่าเป็นสัดส่วนการแมตช์ที่ตรงกัน (0.0 ถึง 1.0)
    """
    img1 = cv2.imread(img_path1, cv2.IMREAD_GRAYSCALE)
    img2 = cv2.imread(img_path2, cv2.IMREAD_GRAYSCALE)

    if img1 is None or img2 is None:
        return 0.0

    # สร้าง ORB detector
    orb = cv2.ORB_create(nfeatures=1000)

    # ค้นหาจุดเด่นและ descriptors
    kp1, des1 = orb.detectAndCompute(img1, None)
    kp2, des2 = orb.detectAndCompute(img2, None)

    if des1 is None or des2 is None:
        return 0.0

    # จับคู่ลักษณะเด่นด้วย Brute-Force Matcher
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des1, des2)

    # เรียงลำดับจุดแมตช์ตามความคล้ายมากไปน้อย
    matches = sorted(matches, key=lambda x: x.distance)

    # คำนวณสัดส่วนเมื่อเทียบกับจำนวนลักษณะเด่นทั้งหมด
    min_keypoints = min(len(kp1), len(kp2))
    if min_keypoints == 0:
        return 0.0

    # กรองลักษณะเด่นที่จับคู่กันตามระยะห่าง (Hamming Distance) ต่างๆ
    good_matches_35 = [m for m in matches if m.distance < 35]
    good_matches_50 = [m for m in matches if m.distance < 50]
    good_matches_60 = [m for m in matches if m.distance < 60]

    ratio_35 = len(good_matches_35) / min_keypoints
    ratio_50 = len(good_matches_50) / min_keypoints
    ratio_60 = len(good_matches_60) / min_keypoints

    print(f"Similarity ratios - dist<35: {ratio_35:.4f}, dist<50: {ratio_50:.4f}, dist<60: {ratio_60:.4f}")
    
    # ส่งค่าการจับคู่ที่ใช้ความละเอียดระดับกล้องจริง (dist < 50) กลับไปตรวจสอบ
    return ratio_50

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
    
    user_id = request.form.get('user_id')
    scans_dir = None
    today_str = datetime.date.today().strftime('%Y-%m-%d')
    
    # กำหนดที่อยู่โฟลเดอร์สำหรับบันทึกขยะรายวัน
    if user_id:
        # กรองตัวอักษรเพื่อความปลอดภัยในการสร้างโฟลเดอร์
        safe_user_id = "".join([c for c in user_id if c.isalnum() or c in "-_"])
        scans_root = os.path.abspath(os.path.join(os.path.dirname(__file__), 'user_scans'))
        scans_dir = os.path.join(scans_root, safe_user_id)
        if not os.path.exists(scans_dir):
            os.makedirs(scans_dir)
            
    similarity = 0.0
    try:
        # ตรวจสอบความซ้ำซ้อนกับขยะทั้งหมดที่เคยสแกนสำเร็จในวันนี้
        if scans_dir:
            # 1. ทำความสะอาด: ลบไฟล์ของวันอื่นๆ ออกเพื่อเคลียร์พื้นที่
            for filename in os.listdir(scans_dir):
                file_path = os.path.join(scans_dir, filename)
                if os.path.isfile(file_path) and not filename.startswith(today_str):
                    try:
                        os.remove(file_path)
                        print(f"Deleted old scan file: {filename}")
                    except Exception as clean_err:
                        print(f"Error deleting old scan file {filename}: {clean_err}")
            
            # 2. ดึงรูปทั้งหมดที่แสกนเสร็จสิ้นของวันนี้มาเปรียบเทียบความซ้ำซ้อน
            today_files = [
                os.path.join(scans_dir, f)
                for f in os.listdir(scans_dir)
                if os.path.isfile(os.path.join(scans_dir, f)) and f.startswith(today_str)
            ]
            
            max_similarity = 0.0
            matched_file = None
            for prev_scan_path in today_files:
                try:
                    sim = check_image_similarity(temp_path, prev_scan_path)
                    if sim > max_similarity:
                        max_similarity = sim
                        matched_file = os.path.basename(prev_scan_path)
                except Exception as sim_err:
                    print(f"Error comparing with {prev_scan_path}: {sim_err}")
            
            similarity = max_similarity
            print(f"Daily scans check: found {len(today_files)} files for today. Max similarity={max_similarity:.4f}")
            
            if max_similarity > 0.25:
                return jsonify({
                    'error': f'ตรวจพบว่านี่คือขยะชิ้นเดิมที่คุณเพิ่งแสกนไปในวันนี้! (ความคล้ายคลึง: {max_similarity * 100:.1f}%)',
                    'is_duplicate': True,
                    'similarity': max_similarity,
                    'matched_file': matched_file
                }), 400

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
        class_map = {
            "glass": "glass",
            "hdpe": "HDPE",
            "ldpe": "LDPE",
            "metal": "metal",
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
            if not isinstance(mapped_name, str) or 'other' not in mapped_name.lower():
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
                if not isinstance(mapped_name, str) or 'other' not in mapped_name.lower():
                    predictions.append({
                        'class_name': mapped_name,
                        'raw_class_name': raw_name,
                        'confidence': conf
                    })
        else:
            return jsonify({'error': 'No objects detected', 'predictions': []}), 200
            
        # ถ้าพบขยะจริง ให้บันทึกรูปนี้ลงในประวัติของวันนี้เพื่อเปรียบเทียบในครั้งถัดไป
        if len(predictions) > 0 and scans_dir:
            timestamp = datetime.datetime.now().strftime('%H%M%S_%f')
            save_filename = f"{today_str}_{timestamp}.jpg"
            save_path = os.path.join(scans_dir, save_filename)
            try:
                shutil.copy(temp_path, save_path)
                print(f"Saved current scan image for future comparison: {save_filename}")
            except Exception as save_err:
                print(f"Error saving scan file: {save_err}")
            
        return jsonify({
            'predictions': predictions,
            'image_base64': img_base64,
            'similarity_score': similarity
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    # รันบน host 0.0.0.0 เพื่อให้เครื่องอื่น (มือถือ, emulator) เรียกใช้งานได้
    app.run(host='0.0.0.0', port=5000, debug=True)
