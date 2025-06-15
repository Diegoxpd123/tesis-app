import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Docente } from '../models/docente.model';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {

   private readonly API_URL = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient
  ) { }

  getDocentes(): Observable<Docente[]> {
    return this.http.get<Docente[]>(`${this.API_URL}/docentes`);
  }

  getDocente(id: number): Observable<Docente> {
    return this.http.get<Docente>(`${this.API_URL}/docentes/${id}`);
  }

  createDocente(data: Docente): Observable<Docente> {
    return this.http.post<Docente>(`${this.API_URL}/docentes`, data);
  }

  updateDocente(id: number, data: Docente): Observable<Docente> {
    return this.http.put<Docente>(`${this.API_URL}/docentes/${id}`, data);
  }

  deleteDocente(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/docentes/${id}`);
  }
}
