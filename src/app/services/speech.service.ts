import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private preferredVoices = [
    'Google español de Estados Unidos',
    'Google Spanish',
    'Microsoft Sabina Desktop',
    'Microsoft Helena Desktop',
    'Microsoft Eva Mobile',
    'Alex'
  ];

  speak(message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(message);

      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();

        if (voices.length === 0) {
          setTimeout(trySpeak, 150);
          return;
        }

        const selectedVoice = voices.find(voice =>
          this.preferredVoices.some(name => voice.name.includes(name))
        ) || voices.find(v => v.lang.startsWith('es')) || voices[0];

        utterance.voice = selectedVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Animar robot cuando hable
        const robot = document.querySelector('.robot-image');
        if (robot) robot.classList.add('speaking');

        utterance.onend = () => {
          if (robot) robot.classList.remove('speaking');
          resolve();
        };

        utterance.onerror = (error) => {
          console.error('Error en síntesis de voz:', error);
          reject(error);
        };

        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          trySpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      } else {
        trySpeak();
      }
    });
  }

  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

      if (!SpeechRecognition) {
        reject(new Error('Tu navegador no soporta reconocimiento de voz.'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-PE';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎙️ Escuchando...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Transcripción:', transcript);
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Error en reconocimiento de voz:', event.error);
        reject(new Error('Hubo un error al usar el micrófono. Intenta nuevamente.'));
      };

      recognition.onend = () => {
        console.log('Reconocimiento de voz terminado');
      };

      recognition.start();
    });
  }

  stopSpeaking(): void {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }
}
