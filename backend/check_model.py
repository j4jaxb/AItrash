from ultralytics import YOLO
import os

model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'best.pt'))
model = YOLO(model_path)
print("Task:", model.task)
print("Names:", model.names)
