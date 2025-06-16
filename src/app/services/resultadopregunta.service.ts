import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resultadopregunta } from '../models/resultadopregunta.model';

@Injectable({
  providedIn: 'root'
})
export class ResultadopreguntaService {

   private readonly API_URL = 'https://moving-firefly-neatly.ngrok-free.app/api';

  constructor(
    private http: HttpClient
  ) { }

  getResultadopreguntas(): Observable<Resultadopregunta[]> {
    return this.http.get<Resultadopregunta[]>(`${this.API_URL}/resultados`);
  }

  getResultadopregunta(id: number): Observable<Resultadopregunta> {
    return this.http.get<Resultadopregunta>(`${this.API_URL}/resultados/${id}`);
  }

  createResultadopregunta(data: Resultadopregunta): Observable<Resultadopregunta> {

      console.log("si entra");
    return this.http.post<Resultadopregunta>(`${this.API_URL}/resultados`, data);
  }

  updateResultadopregunta(id: number, data: Resultadopregunta): Observable<Resultadopregunta> {
    return this.http.put<Resultadopregunta>(`${this.API_URL}/resultados/${id}`, data);
  }

  deleteResultadopregunta(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/resultados/${id}`);
  }
}
