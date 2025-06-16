import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Institucion } from '../models/institucion.model';

@Injectable({
  providedIn: 'root'
})
export class InstitucionService {

   private readonly API_URL = 'https://moving-firefly-neatly.ngrok-free.app/api';

  constructor(
    private http: HttpClient
  ) { }

  getInstitucions(): Observable<Institucion[]> {
    return this.http.get<Institucion[]>(`${this.API_URL}/institucions`);
  }

  getInstitucion(id: number): Observable<Institucion> {
    return this.http.get<Institucion>(`${this.API_URL}/institucions/${id}`);
  }

  createInstitucion(data: Institucion): Observable<Institucion> {
    return this.http.post<Institucion>(`${this.API_URL}/institucions`, data);
  }

  updateInstitucion(id: number, data: Institucion): Observable<Institucion> {
    return this.http.put<Institucion>(`${this.API_URL}/institucions/${id}`, data);
  }

  deleteInstitucion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/institucions/${id}`);
  }
}
