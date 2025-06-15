import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Evaluacion } from '../models/evaluacion.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionService {

   private readonly API_URL = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient
  ) { }

  getEvaluacions(): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(`${this.API_URL}/evaluaciones`);
  }

  getEvaluacion(id: number): Observable<Evaluacion> {
    return this.http.get<Evaluacion>(`${this.API_URL}/evaluaciones/${id}`);
  }

  createEvaluacion(data: Evaluacion): Observable<Evaluacion> {
    return this.http.post<Evaluacion>(`${this.API_URL}/evaluaciones`, data);
  }

  updateEvaluacion(id: number, data: Evaluacion): Observable<Evaluacion> {
    return this.http.put<Evaluacion>(`${this.API_URL}/evaluaciones/${id}`, data);
  }

  deleteEvaluacion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/evaluaciones/${id}`);
  }
}
