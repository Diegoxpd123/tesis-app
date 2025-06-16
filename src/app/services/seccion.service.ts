import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Seccion } from '../models/seccion.model';

@Injectable({
  providedIn: 'root'
})
export class SeccionService {

   private readonly API_URL = 'https://moving-firefly-neatly.ngrok-free.app/api';

  constructor(
    private http: HttpClient
  ) { }

  getSeccions(): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(`${this.API_URL}/seccions`);
  }

  getSeccion(id: number): Observable<Seccion> {
    return this.http.get<Seccion>(`${this.API_URL}/seccions/${id}`);
  }

  createSeccion(data: Seccion): Observable<Seccion> {
    return this.http.post<Seccion>(`${this.API_URL}/seccions`, data);
  }

  updateSeccion(id: number, data: Seccion): Observable<Seccion> {
    return this.http.put<Seccion>(`${this.API_URL}/seccions/${id}`, data);
  }

  deleteSeccion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/seccions/${id}`);
  }
}
