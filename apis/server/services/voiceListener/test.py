# test.py
import base64
import os
from recognizer import recognize  # ← так

def test_recognize():
    if os.path.exists("test.wav"):
        with open("test.wav", "rb") as f:
            audio_bytes = f.read()
        
        text = recognize(audio_bytes)
        print(f"Результат: '{text}'")
    else:
        print("Нет test.wav для тестирования")

if __name__ == "__main__":
    test_recognize()