import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProgressData {
  mathematics: number;
  communication: number;
  science: number;
}

export interface CourseResult {
  id: number;
  name: string;
  percentage: number;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly API_URL = 'https://moving-firefly-neatly.ngrok-free.app/api';

  constructor(private http: HttpClient) { }

  getProgressData(userId: number): Observable<ProgressData> {
    return this.http.get<ProgressData>(`${this.API_URL}/progress/${userId}`);
  }

  getCourseResults(userId: number, courseId: number): Observable<CourseResult[]> {
    return this.http.get<CourseResult[]>(`${this.API_URL}/progress/${userId}/course/${courseId}`);
  }

  updateProgress(userId: number, progressData: Partial<ProgressData>): Observable<ProgressData> {
    return this.http.put<ProgressData>(`${this.API_URL}/progress/${userId}`, progressData);
  }

  getResultsByCourse(userId: number, courseId: number, startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/results-curso`, {
      params: {
        usuarioid: userId.toString(),
        cursoid: courseId.toString(),
        fechainicio: startDate,
        fechafin: endDate
      }
    });
  }
}
