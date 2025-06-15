import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatGptService {
  private apiUrl = 'https://api.openai.com/v1/chat/completions';
  private apiKey = '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'; // Reemplaza con tu clave real

  constructor(private http: HttpClient) {}

  getChatResponse(message: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    });

    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Eres un asistente amigable que ayuda a estudiantes de primaria a entender conceptos básicos de matemáticas.' },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    };

    return this.http.post(this.apiUrl, body, { headers });
  }
}
