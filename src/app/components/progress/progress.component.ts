import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

export interface DetailedResult {
  tema: string;
  evaluacion: string;
  total_tiempo: string;
  respuestas_buenas_sobre_totales: string;
  buenas: number;
  totales: number;
  porcentaje: number;
}

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProgressComponent implements OnInit, OnChanges, OnDestroy {
  @Input() progressData: ProgressData = { mathematics: 0, communication: 0, science: 0 };
  @Input() showBars: boolean = false;
  @Input() showRadar: boolean = false;
  @Input() showDetails: boolean = false;
  @Input() resultsByCourse: any[] = [];

  @Output() viewMoreDetails = new EventEmitter<number>();
  @Output() goHome = new EventEmitter<void>();

  courseResults: CourseResult[] = [];
  hasProgressData: boolean = false;
  isDarkMode: boolean = false;
  private themeListener?: () => void;

  // Propiedades para detalles
  showDetailedResults: boolean = false;
  selectedCourseId: number = 0;
  detailedResults: DetailedResult[] = [];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Si no hay datos de entrada, cargar datos por defecto
    if (this.progressData.mathematics === 0 &&
        this.progressData.communication === 0 &&
        this.progressData.science === 0) {
      this.loadDefaultProgressData();
    }
    this.updateCourseResults();
    this.loadTheme();
    this.setupThemeListener();
  }

  ngOnDestroy(): void {
    if (this.themeListener) {
      window.removeEventListener('storage', this.themeListener);
    }
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
  }

  private setupThemeListener(): void {
    // Escuchar cambios en el localStorage desde otros tabs
    this.themeListener = () => {
      this.loadTheme();
    };
    window.addEventListener('storage', this.themeListener);

    // Escuchar cambios en el mismo tab usando un intervalo
    setInterval(() => {
      const currentTheme = localStorage.getItem('theme');
      const shouldBeDark = currentTheme === 'dark';
      if (this.isDarkMode !== shouldBeDark) {
        this.loadTheme();
      }
    }, 100); // Verificar cada 100ms
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['progressData']) {
      this.updateCourseResults();
    }
  }

  private loadDefaultProgressData(): void {
    // Cargar datos de progreso por defecto (simulados)
    this.progressData = {
      mathematics: 75,
      communication: 60,
      science: 85
    };
    this.showBars = true;
  }

  private updateCourseResults(): void {
    this.courseResults = [
      { id: 1, name: 'Matemáticas', percentage: this.progressData.mathematics, color: 'math' },
      { id: 2, name: 'Comunicación', percentage: this.progressData.communication, color: 'communication' },
      { id: 3, name: 'Ciencias', percentage: this.progressData.science, color: 'science' }
    ];

    // Verificar si hay datos de progreso
    this.hasProgressData = this.progressData.mathematics > 0 ||
                          this.progressData.communication > 0 ||
                          this.progressData.science > 0;
  }

  onViewMoreDetails(courseId: number): void {
    console.log('🔍 onViewMoreDetails llamado con courseId:', courseId);
    console.log('🔍 showDetailedResults antes:', this.showDetailedResults);

    // Obtener usuario actual del localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error('❌ No se encontró usuario en localStorage');
      return;
    }

    const usuarioActual = JSON.parse(userStr);
    console.log('👤 Usuario actual:', usuarioActual);

    // Calcular fechas (último año)
    const hoy = new Date();
    const haceUnAno = new Date();
    haceUnAno.setFullYear(hoy.getFullYear() - 1);

    const fechainicio = haceUnAno.toISOString().split('T')[0];
    const fechafin = hoy.toISOString().split('T')[0];
    const usuarioid = usuarioActual.id;

    const params = {
      cursoid: courseId,
      usuarioid: usuarioid,
      fechainicio: fechainicio,
      fechafin: fechafin
    };

    console.log('Parámetros para obtener resultados:', params);

    // Aquí deberías llamar al servicio para obtener los resultados del curso
    // Por ahora, vamos a simular la funcionalidad
    console.log('🔄 Cambiando showDetailedResults a true...');
    this.showDetailedResults = true;
    this.selectedCourseId = courseId;

    console.log('🔄 showDetailedResults después:', this.showDetailedResults);
    console.log('🔄 selectedCourseId:', this.selectedCourseId);

    // Simular datos detallados
    this.detailedResults = [
      {
        tema: 'Sumas y Restas',
        evaluacion: 'Evaluación Básica',
        total_tiempo: '5:30',
        respuestas_buenas_sobre_totales: '8/10',
        buenas: 8,
        totales: 10,
        porcentaje: 80
      },
      {
        tema: 'Multiplicaciones',
        evaluacion: 'Evaluación Intermedia',
        total_tiempo: '7:15',
        respuestas_buenas_sobre_totales: '6/8',
        buenas: 6,
        totales: 8,
        porcentaje: 75
      }
    ];

    console.log('✅ Datos detallados configurados:', this.detailedResults);
    console.log('✅ Método onViewMoreDetails completado');

    // Forzar detección de cambios
    this.cdr.detectChanges();
    console.log('🔄 ChangeDetectorRef.detectChanges() llamado');
  }

  onGoHome(): void {
    this.goHome.emit();
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  backToProgress(): void {
    this.showDetailedResults = false;
    this.selectedCourseId = 0;
    this.detailedResults = [];
  }

  getProgressBarWidth(percentage: number): string {
    return `${percentage}%`;
  }
}
