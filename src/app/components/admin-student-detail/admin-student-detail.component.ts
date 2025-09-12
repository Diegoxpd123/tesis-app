import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-student-detail',
  templateUrl: './admin-student-detail.component.html',
  styleUrls: ['./admin-student-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminStudentDetailComponent implements OnInit, OnDestroy {
  usuarioid: number = 0;
  estudianteInfo: any = null;
  cursos: any[] = [];
  cursoSeleccionado: number = 1;
  reporteExamenes: any[] = [];
  reportePracticas: any[] = [];
  loading: boolean = false;
  isDarkMode: boolean = false;
  tipoReporte: 'examen' | 'practica' = 'examen';
  private themeListener?: () => void;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.setupThemeListener();
    this.usuarioid = Number(this.route.snapshot.paramMap.get('usuarioid') || 0);

    if (this.usuarioid) {
      this.loadStudentInfo();
      this.loadCursos();
      this.loadReportePorCurso();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Limpiar el listener de tema
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

  private loadStudentInfo(): void {
    this.usuarioService.getUsuario(this.usuarioid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuario) => {
          this.estudianteInfo = usuario;
          console.log('Información del estudiante:', usuario);
        },
        error: (error) => {
          console.error('Error al cargar información del estudiante:', error);
        }
      });
  }

  private loadCursos(): void {
    this.cursos = [
      { id: 1, nombre: 'Matemáticas', icono: '🔢' },
      { id: 2, nombre: 'Comunicación', icono: '📚' },
      { id: 3, nombre: 'Ciencias y Tecnología', icono: '🔬' }
    ];
  }

  onCursoChange(): void {
    this.loadReportePorCurso();
  }

  private loadReportePorCurso(): void {
    this.loading = true;

    this.usuarioService.getReporteUsoPorCurso({
      usuarioid: this.usuarioid,
      cursoid: this.cursoSeleccionado
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        // Procesar exámenes agrupados de 5 en 5
        this.reporteExamenes = this.procesarDatosAgrupados(data.examenes || [], 'examen');

        // Procesar prácticas agrupadas de 5 en 5
        this.reportePracticas = this.procesarDatosAgrupados(data.practicas || [], 'practica');

        this.loading = false;
        console.log('Reporte de exámenes cargado:', this.reporteExamenes);
        console.log('Reporte de prácticas cargado:', this.reportePracticas);
      },
      error: (error) => {
        console.error('Error al cargar reporte de uso:', error);
        this.loading = false;
        // Fallback a datos mock si hay error
        this.reporteExamenes = this.generateMockData('examen');
        this.reportePracticas = this.generateMockData('practica');
      }
    });
  }

  private procesarDatosAgrupados(datos: any[], tipo: 'examen' | 'practica'): any[] {
    const grupos: { [key: number]: any[] } = {};

    // Agrupar por el campo grupo_examen o grupo_practica
    datos.forEach(item => {
      const grupoKey = tipo === 'examen' ? item.grupo_examen : item.grupo_practica;
      if (!grupos[grupoKey]) {
        grupos[grupoKey] = [];
      }
      grupos[grupoKey].push(item);
    });

    // Convertir grupos a formato de reporte
    return Object.keys(grupos).map(grupoKey => {
      const grupo = grupos[parseInt(grupoKey)];
      const primerItem = grupo[0];
      const ultimoItem = grupo[grupo.length - 1];

      // Calcular tiempo total del grupo
      const tiempoTotal = grupo.reduce((total, item) => total + (item.tiempo_respuesta || 0), 0);
      const tiempoReforzamiento = grupo.reduce((total, item) => total + (item.tiemporeforzamiento || 0), 0);

      // Para prácticas: contar preguntas únicas y respuestas correctas por pregunta única
      let respuestasCorrectas: number;
      let totalPreguntas: number;
      let totalIntentos: number;

      if (tipo === 'practica') {
        // Agrupar por pregunta_id para contar preguntas únicas
        const preguntasUnicas = new Map();
        grupo.forEach(item => {
          const preguntaId = item.pregunta_id;
          if (!preguntasUnicas.has(preguntaId)) {
            preguntasUnicas.set(preguntaId, {
              pregunta: item.pregunta,
              respuestas: []
            });
          }
          preguntasUnicas.get(preguntaId).respuestas.push(item);
        });

        // Contar respuestas correctas por pregunta única y total de intentos
        respuestasCorrectas = 0;
        totalIntentos = grupo.length; // Total de intentos (todas las respuestas)
        preguntasUnicas.forEach((preguntaData, preguntaId) => {
          // Verificar si alguna respuesta de esta pregunta es correcta
          const tieneCorrecta = preguntaData.respuestas.some((resp: any) => resp.estado_respuesta === 'Correcta');
          if (tieneCorrecta) {
            respuestasCorrectas++;
          }
        });
        totalPreguntas = preguntasUnicas.size;
      } else {
        // Para exámenes: contar todas las respuestas
        respuestasCorrectas = grupo.filter(item => item.estado_respuesta === 'Correcta').length;
        totalPreguntas = grupo.length;
        totalIntentos = grupo.length; // En exámenes, intentos = preguntas
      }

      return {
        grupo: parseInt(grupoKey),
        tipo: tipo,
        evaluacion: primerItem.evaluacion,
        tema: primerItem.tema,
        fecha: this.formatDate(primerItem.fecha_respuesta),
        inicio: this.formatTime(primerItem.fecha_respuesta),
        fin: this.formatTime(ultimoItem.fecha_respuesta),
        tiempoExamen: this.formatDuration(tiempoTotal),
        tiempoReforzamiento: this.formatDuration(tiempoReforzamiento),
        respuestasCorrectas: respuestasCorrectas,
        totalPreguntas: totalPreguntas,
        totalIntentos: totalIntentos,
        porcentaje: totalPreguntas > 0 ? Math.round((respuestasCorrectas / totalPreguntas) * 100) : 0,
        preguntas: grupo.map(item => ({
          pregunta: item.pregunta,
          respuestaCorrecta: item.respuesta_correcta,
          respuestaSeleccionada: item.respuesta_seleccionada,
          estado: item.estado_respuesta,
          tiempo: item.tiempo_respuesta
        }))
      };
    });
  }

  private generateMockData(tipo: 'examen' | 'practica'): any[] {
    const temas = {
      1: ['Conjuntos', 'Resta', 'Patrones', 'Suma', 'Multiplicación'],
      2: ['Lectura', 'Escritura', 'Gramática', 'Vocabulario', 'Comprensión'],
      3: ['Experimentos', 'Observación', 'Análisis', 'Hipótesis', 'Conclusión']
    };

    const temasCurso = temas[this.cursoSeleccionado as keyof typeof temas] || [];
    const grupos = Math.ceil(temasCurso.length / 5); // Crear grupos de 5

    return Array.from({ length: grupos }, (_, grupoIndex) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - grupoIndex * 2);

      const inicio = new Date();
      inicio.setHours(15 + grupoIndex, 10 + (grupoIndex * 5), 0, 0);

      const fin = new Date();
      fin.setHours(15 + grupoIndex, 25 + (grupoIndex * 5), 0, 0);

      const tiempoExamen = Math.floor(Math.random() * 300) + 120; // 2-7 minutos
      const tiempoReforzamiento = Math.floor(Math.random() * 180) + 60; // 1-4 minutos
      const respuestasCorrectas = Math.floor(Math.random() * 5) + 1; // 1-5 correctas

      return {
        grupo: grupoIndex + 1,
        tipo: tipo,
        evaluacion: `${tipo === 'examen' ? 'Examen' : 'Práctica'} ${grupoIndex + 1}`,
        tema: temasCurso[grupoIndex] || 'Tema General',
        fecha: fecha.toLocaleDateString('es-ES'),
        inicio: inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        fin: fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        tiempoExamen: this.formatDuration(tiempoExamen),
        tiempoReforzamiento: this.formatDuration(tiempoReforzamiento),
        respuestasCorrectas: respuestasCorrectas,
        totalPreguntas: 5,
        porcentaje: Math.round((respuestasCorrectas / 5) * 100),
        preguntas: Array.from({ length: 5 }, (_, i) => ({
          pregunta: `Pregunta ${i + 1} del grupo ${grupoIndex + 1}`,
          respuestaCorrecta: 'A',
          respuestaSeleccionada: Math.random() > 0.5 ? 'A' : 'B',
          estado: Math.random() > 0.3 ? 'Correcta' : 'Incorrecta',
          tiempo: Math.floor(Math.random() * 60) + 30
        }))
      };
    });
  }

  goBack(): void {
    this.router.navigate(['/estudiantes']);
  }

  getCursoNombre(): string {
    const curso = this.cursos.find(c => c.id === this.cursoSeleccionado);
    return curso ? curso.nombre : 'Curso';
  }

  getCursoIcono(): string {
    const curso = this.cursos.find(c => c.id === this.cursoSeleccionado);
    return curso ? curso.icono : '📚';
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  private formatTime(timeString: string): string {
    // El tiempo viene en formato HH:MM:SS, solo necesitamos HH:MM
    return timeString.substring(0, 5);
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} min.`;
  }

  onTipoReporteChange(): void {
    // Método para cambiar entre exámenes y prácticas
  }

  getReporteActual(): any[] {
    return this.tipoReporte === 'examen' ? this.reporteExamenes : this.reportePracticas;
  }

  hasData(): boolean {
    const reporte = this.getReporteActual();
    return reporte && reporte.length > 0;
  }
}
