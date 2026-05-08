import cv2
import os

# Ruta del video
video_path = "carton.mp4"

# Carpeta donde se guardarán las imágenes
output_folder = "frames"

# Crear carpeta si no existe
os.makedirs(output_folder, exist_ok=True)

# Abrir video
cap = cv2.VideoCapture(video_path)

count = 0

while True:
    ret, frame = cap.read()

    if not ret:
        break

    # Guardar una imagen cada 10 frames
    if count % 10 == 0:
        filename = os.path.join(output_folder, f"frame_{count}.jpg")
        cv2.imwrite(filename, frame)

    count += 1

cap.release()

print("Frames extraídos correctamente")