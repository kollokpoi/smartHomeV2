// composables/useVoiceRecorder.ts
import { ref } from "vue";
import audioBufferToWav from "audiobuffer-to-wav";

export function useVoiceRecorder() {
  const isRecording = ref(false);
  const isProcessing = ref(false);
  
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const start = async (duration: number = 5000) => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        isProcessing.value = true;
        try {
          const webmBlob = new Blob(audioChunks, { type: "audio/webm" });
          const arrayBuffer = await webmBlob.arrayBuffer();
          
          audioContext = new AudioContext({ sampleRate: 16000 });
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const wavBuffer = audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
          
          // возвращаем blob наружу
          if (onStopCallback) {
            onStopCallback(wavBlob);
          }
        } finally {
          isProcessing.value = false;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
          }
          if (audioContext) {
            await audioContext.close();
            audioContext = null;
          }
        }
      };

      mediaRecorder.start(1000);
      isRecording.value = true;

      timeoutId = setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
          stop();
        }
      }, duration);
      
    } catch (error) {
      console.error("Microphone error:", error);
      throw error;
    }
  };

  let onStopCallback: ((blob: Blob) => void) | null = null;

  const stop = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      isRecording.value = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };

  const onStop = (callback: (blob: Blob) => void) => {
    onStopCallback = callback;
  };

  return {
    isRecording,
    isProcessing,
    start,
    stop,
    onStop,
  };
}