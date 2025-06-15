import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tema } from '../models/tema.model';

@Injectable({
  providedIn: 'root'
})
export class TemaService {

   private readonly API_URL = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient
  ) { }

  getTemas(): Observable<Tema[]> {
    return this.http.get<Tema[]>(`${this.API_URL}/temas`);
  }

  getTema(id: number): Observable<Tema> {
    return this.http.get<Tema>(`${this.API_URL}/temas/${id}`);
  }

  createTema(data: Tema): Observable<Tema> {
    return this.http.post<Tema>(`${this.API_URL}/temas`, data);
  }

  updateTema(id: number, data: Tema): Observable<Tema> {
    return this.http.put<Tema>(`${this.API_URL}/temas/${id}`, data);
  }

  deleteTema(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/temas/${id}`);
  }
}
