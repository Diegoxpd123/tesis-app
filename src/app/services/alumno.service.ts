import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Alumno } from '../models/alumno.model';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {

   private readonly API_URL = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient
  ) { }

  getAlumnos(): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(`${this.API_URL}/alumnos`);
  }

  getAlumno(id: number): Observable<Alumno> {
    return this.http.get<Alumno>(`${this.API_URL}/alumnos/${id}`);
  }

  createAlumno(data: Alumno): Observable<Alumno> {
    return this.http.post<Alumno>(`${this.API_URL}/alumnos`, data);
  }

  updateAlumno(id: number, data: Alumno): Observable<Alumno> {
    return this.http.put<Alumno>(`${this.API_URL}/alumnos/${id}`, data);
  }

  deleteAlumno(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/alumnos/${id}`);
  }
}
