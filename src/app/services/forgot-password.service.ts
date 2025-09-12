import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordService {
  private readonly API_URL = 'https://moving-firefly-neatly.ngrok-free.app/api';

  constructor(private http: HttpClient) { }

  /**
   * Verificar si el usuario existe
   */
  verifyUser(usuario: string): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios/verify`, {
      usuario: usuario
    });
  }

  /**
   * Verificar los últimos 4 dígitos del DNI
   */
  verifyDNI(userId: number, dni: string): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios/verify-dni`, {
      user_id: userId,
      dni: dni
    });
  }

  /**
   * Cambiar la contraseña del usuario
   */
  changePassword(userId: number, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios/change-password`, {
      user_id: userId,
      new_password: newPassword
    });
  }
}
