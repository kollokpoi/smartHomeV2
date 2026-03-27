# record_test.py
import pyaudio
import wave
import sys

def record_audio(filename="test.wav", duration=5, sample_rate=16000):
    """
    Записывает аудио с микрофона
    """
    chunk = 1024
    format = pyaudio.paInt16
    channels = 1
    
    p = pyaudio.PyAudio()
    
    print(f"🔴 Запись {duration} секунд...")
    
    stream = p.open(format=format,
                    channels=channels,
                    rate=sample_rate,
                    input=True,
                    frames_per_buffer=chunk)
    
    frames = []
    
    for i in range(0, int(sample_rate / chunk * duration)):
        data = stream.read(chunk)
        frames.append(data)
    
    print("✅ Запись завершена")
    
    stream.stop_stream()
    stream.close()
    p.terminate()
    
    wf = wave.open(filename, 'wb')
    wf.setnchannels(channels)
    wf.setsampwidth(p.get_sample_size(format))
    wf.setframerate(sample_rate)
    wf.writeframes(b''.join(frames))
    wf.close()
    
    print(f"💾 Сохранено: {filename}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        record_audio(filename=sys.argv[1])
    else:
        record_audio()