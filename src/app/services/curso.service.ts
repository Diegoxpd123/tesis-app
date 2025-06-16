import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Curso } from '../models/curso.model';

@Injectable({
  providedIn: 'root'
})
export class CursoService {

   private readonly API_URL = 'https://moving-firefly-neatly.ngrok-free.app/api';

  constructor(
    private http: HttpClient
  ) { }

  getCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.API_URL}/cursos`);
  }

  getCurso(id: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.API_URL}/cursos/${id}`);
  }

  createCurso(data: Curso): Observable<Curso> {
    return this.http.post<Curso>(`${this.API_URL}/cursos`, data);
  }

  updateCurso(id: number, data: Curso): Observable<Curso> {
    return this.http.put<Curso>(`${this.API_URL}/cursos/${id}`, data);
  }

  deleteCurso(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/cursos/${id}`);
  }
}
