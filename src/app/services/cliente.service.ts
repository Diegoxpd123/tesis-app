import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

   private readonly API_URL = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient
  ) { }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.API_URL}/clientes`);
  }

  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.API_URL}/clientes/${id}`);
  }

  createCliente(data: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.API_URL}/clientes`, data);
  }

  updateCliente(id: number, data: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.API_URL}/clientes/${id}`, data);
  }

  deleteCliente(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/clientes/${id}`);
  }
}
