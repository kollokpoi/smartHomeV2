
import sys
import json
import base64
import tempfile
import os
import wave
import io
from vosk import Model, KaldiRecognizer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "vosk-model-small-ru")

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

if not os.path.exists(MODEL_PATH):
    sys.stderr.write(f"Ошибка: модель не найдена по пути {MODEL_PATH}\n")
    sys.exit(1)

model = Model(MODEL_PATH)

def recognize(audio_bytes: bytes) -> str:
    """Распознаёт WAV аудио из байтов"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    
    try:
        wf = wave.open(tmp_path, "rb")
        
        # Проверяем формат
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 16000:
            sys.stderr.write(f"Предупреждение: неверный формат аудио. Ожидается 16кГц, моно, 16-bit\n")
        
        rec = KaldiRecognizer(model, wf.getframerate())
        
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            rec.AcceptWaveform(data)
        
        result = json.loads(rec.FinalResult())
        wf.close()
        
        return result.get("text", "")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

def main():
    sys.stderr.write("Speech recognizer ready\n")
    sys.stderr.flush()
    
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        
        line = line.strip()
        if not line:
            continue
        
        try:
            audio_bytes = base64.b64decode(line)
            text = recognize(audio_bytes)
            print(text)
            sys.stdout.flush()
        except Exception as e:
            sys.stderr.write(f"ERROR: {e}\n")
            sys.stderr.flush()

if __name__ == "__main__":
    main()