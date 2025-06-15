import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pregunta } from '../models/pregunta.model';

@Injectable({
  providedIn: 'root'
})
export class PreguntaService {

   private readonly API_URL = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient
  ) { }

  getPreguntas(): Observable<Pregunta[]> {
    return this.http.get<Pregunta[]>(`${this.API_URL}/preguntas`);
  }

  getPregunta(id: number): Observable<Pregunta> {
    return this.http.get<Pregunta>(`${this.API_URL}/preguntas/${id}`);
  }

  createPregunta(data: Pregunta): Observable<Pregunta> {
    return this.http.post<Pregunta>(`${this.API_URL}/preguntas`, data);
  }

  updatePregunta(id: number, data: Pregunta): Observable<Pregunta> {
    return this.http.put<Pregunta>(`${this.API_URL}/preguntas/${id}`, data);
  }

  deletePregunta(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/preguntas/${id}`);
  }
}
