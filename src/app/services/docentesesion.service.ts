import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Docentesesion } from '../models/docentesesion.model';

@Injectable({
  providedIn: 'root'
})
export class DocentesesionService {

   private readonly API_URL = 'https://moving-firefly-neatly.ngrok-free.app/api';

  constructor(
    private http: HttpClient
  ) { }

  getDocentesesions(): Observable<Docentesesion[]> {
    return this.http.get<Docentesesion[]>(`${this.API_URL}/docentesesions`);
  }

  getDocentesesion(id: number): Observable<Docentesesion> {
    return this.http.get<Docentesesion>(`${this.API_URL}/docentesesions/${id}`);
  }

  createDocentesesion(data: Docentesesion): Observable<Docentesesion> {
    return this.http.post<Docentesesion>(`${this.API_URL}/docentesesions`, data);
  }

  updateDocentesesion(id: number, data: Docentesesion): Observable<Docentesesion> {
    return this.http.put<Docentesesion>(`${this.API_URL}/docentesesions/${id}`, data);
  }

  deleteDocentesesion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/docentesesions/${id}`);
  }
}
