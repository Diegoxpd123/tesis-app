import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly API_URL = 'https://moving-firefly-neatly.ngrok-free.app/api';

  constructor(private http: HttpClient) { }

  // CRUD de usuarios
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.API_URL}/usuarios`);
  }

  getUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API_URL}/usuarios/${id}`);
  }

  createUsuario(data: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.API_URL}/usuarios`, data);
  }

  createUsuarioWithPassword(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/usuarios/create`, data);
  }

  login(usuario: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/usuarios/login`, {
      usuario,
      password
    });
  }

  updateUsuario(id: number, data: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.API_URL}/usuarios/${id}`, data);
  }

  deleteUsuario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/usuarios/${id}`);
  }

  // ✅ Nueva función: obtener resultados por curso, alumno y fechas
  getResultadosCurso(params: {
    cursoid: number;
    usuarioid: number;
    fechainicio: string;
    fechafin: string;
  }): Observable<any[]> {
    return this.http.post<any[]>(`${this.API_URL}/resultados-curso`, params);
  }

  // ✅ Nueva función: obtener reporte detallado con preguntas y respuestas
  getReporteDetallado(params: {
    cursoid: number;
    usuarioid: number;
    fechainicio: string;
    fechafin: string;
    tipo: 'examen' | 'practica';
  }): Observable<any[]> {
    return this.http.post<any[]>(`${this.API_URL}/reporte-detallado`, params);
  }

  // ✅ Nueva función: obtener reporte de uso por curso para administradores
  getReporteUsoPorCurso(params: {
    usuarioid: number;
    cursoid: number;
  }): Observable<any[]> {
    return this.http.post<any[]>(`${this.API_URL}/reporte-uso-por-curso`, params);
  }

}
