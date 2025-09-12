import { Component, OnInit, OnDestroy } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { AlumnoService } from '../../services/alumno.service';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as XLSX from 'xlsx';
import { ActivatedRoute, Router } from '@angular/router';
import { Estudiante } from '../../models/estudiante.model';
import { Alumno } from '../../models/alumno.model';

Chart.register(...registerables);
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-estudiante-detail',
  standalone: false,
  templateUrl: './estudiante-detail.component.html',
  styleUrl: './estudiante-detail.component.scss'
})
export class EstudianteDetailComponent implements OnInit, OnDestroy {
  resultados: { [cursoid: number]: any[] } = {};
  reporteDetallado: { [cursoid: number]: any[] } = {};
  usuarioid: number = 5;
  hasData: { [cursoid: number]: boolean } = {};
  hasDetailedData: { [cursoid: number]: boolean } = {};
  loading: boolean = false;
  isDarkMode: boolean = false;
  tipoReporte: 'examen' | 'practica' = 'examen';
  private themeListener?: () => void;

  fechainicio: string = '';
  fechafin: string = '';

  // Información del usuario
  usuarioNombre: string = '';
  usuarioApellido: string = '';
  usuarioEmail: string = '';
  usuarioGrado: string = '';
  usuarioSeccion: string = '';

  // Loading y progreso
  isLoadingData: boolean = false;
  loadedQuestions: number = 0;
  totalQuestions: number = 0;
  loadingMessage: string = '';

  // Porcentajes para el gráfico radar
  porcentajesRadar: { [cursoid: number]: number } = {
    1: 0, // Matemáticas
    2: 0, // Comunicación
    3: 0  // Ciencias y Tecnología
  };

  constructor(
    private usuarioService: UsuarioService,
    private alumnoService: AlumnoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
  this.setSemanaActual();
  this.loadTheme();
  this.setupThemeListener();

  this.usuarioid = Number(this.route.snapshot.paramMap.get('usuarioid') || 0);

  // Cargar información del usuario
  this.loadUserInfo();

  // No cargar datos automáticamente, esperar a que el usuario haga clic en "Buscar"
  // this.loadAllCourseData();
}

  // Método para cargar datos de todos los cursos automáticamente
  loadAllCourseData(): void {
    const cursos = [1, 2, 3]; // Matemáticas, Comunicación, Ciencias y Tecnología

    cursos.forEach(cursoId => {
      this.mostrarResultados(cursoId);
    });

    // También cargar reporte detallado
    this.cargarReporteDetallado();
  }

  ngAfterViewInit(): void {
    // Esperar un poco para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      this.createRadarChart();
    }, 100);
  }

  ngAfterViewChecked(): void {
    // Recrear el gráfico si no está visible
    const canvas = document.getElementById('radarChart') as HTMLCanvasElement;
    if (canvas && !Chart.getChart(canvas)) {
      this.createRadarChart();
    }
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

   setSemanaActual() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0 (Domingo) - 6 (Sábado)

    // Calcular lunes
    const diffLunes = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diffLunes));
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    this.fechainicio = lunes.toISOString().substring(0, 10);
    this.fechafin = domingo.toISOString().substring(0, 10);
  }

  private createRadarChart(): void {
    const ctx = document.getElementById('radarChart') as HTMLCanvasElement;

    if (!ctx) {
      console.error('Canvas element not found');
      return;
    }

    // Destruir gráfico existente si existe
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    const dataValues = [
      this.porcentajesRadar[1] || 0, // Matemáticas
      this.porcentajesRadar[2] || 0, // Comunicación
      this.porcentajesRadar[3] || 0  // Ciencias y Tecnología
    ];

    console.log('=== CREANDO GRÁFICO RADAR ===');
    console.log('Datos para el gráfico:', dataValues);
    console.log('Matemáticas:', dataValues[0]);
    console.log('Comunicación:', dataValues[1]);
    console.log('Ciencias y Tecnología:', dataValues[2]);

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Matemáticas', 'Comunicación', 'Ciencias y Tecnología'],
        datasets: [{
          label: 'Progreso (%)',
          data: dataValues,
          backgroundColor: 'rgba(255, 215, 0, 0.4)',
          borderColor: '#ffd700',
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#ffd700',
          pointHoverRadius: 8,
          pointRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        layout: {
          padding: {
            top: 60,
            right: 60,
            bottom: 60,
            left: 60
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            labels: {
              color: 'white',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          },
          datalabels: {
            color: 'white',
            font: {
              weight: 'bold',
              size: 14,
            },
            formatter: function (value: number) {
              return value + '%';
            },
            anchor: 'center',
            align: 'center',
            offset: 0
          }
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            pointLabels: {
              font: {
                size: 16,
                weight: 'bold',
                family: "'Comic Sans MS', cursive"
              },
              color: 'white',
              padding: 20,
              callback: function(label: string) {
                return label;
              }
            },
            ticks: {
              backdropColor: 'transparent',
              color: 'white',
              stepSize: 20,
              display: false
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.2)',
              lineWidth: 1
            },
            angleLines: {
              color: 'rgba(255, 255, 255, 0.3)',
              lineWidth: 1
            }
          }
        },
        elements: {
          line: {
            tension: 0.1
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  private calcularPorcentajesRadar(): void {
    console.log('=== CALCULANDO PORCENTAJES DEL RADAR ===');
    console.log('Datos de reporte detallado:', this.reporteDetallado);
    console.log('Datos de resultados:', this.resultados);

    // Inicializar porcentajes
    this.porcentajesRadar = { 1: 0, 2: 0, 3: 0 };

    // Calcular porcentaje para cada curso
    for (let cursoid = 1; cursoid <= 3; cursoid++) {
      let porcentaje = 0;
      let fuenteDatos = 'ninguna';

      // Intentar con reporte detallado primero
      if (this.reporteDetallado[cursoid] && this.reporteDetallado[cursoid].length > 0) {
        const datos = this.reporteDetallado[cursoid];
        const totalPreguntas = datos.length;
        const respuestasCorrectas = datos.filter(r => r.estado_respuesta === 'Correcta').length;

        console.log(`Curso ${cursoid} (detallado): ${respuestasCorrectas}/${totalPreguntas} correctas`);

        if (totalPreguntas > 0) {
          porcentaje = Math.round((respuestasCorrectas / totalPreguntas) * 100);
          fuenteDatos = 'detallado';
        }
      }
      // Si no hay datos detallados, usar resultados
      else if (this.resultados[cursoid] && this.resultados[cursoid].length > 0) {
        const datos = this.resultados[cursoid];
        let totalBuenas = 0;
        let totalPreguntas = 0;

        datos.forEach((r) => {
          totalPreguntas++;
          if (r.respuesta === 'correcta') {
            totalBuenas++;
          }
        });

        console.log(`Curso ${cursoid} (resultados): ${totalBuenas}/${totalPreguntas} correctas`);

        if (totalPreguntas > 0) {
          porcentaje = Math.round((totalBuenas / totalPreguntas) * 100);
          fuenteDatos = 'resultados';
        }
      } else {
        console.log(`Curso ${cursoid}: Sin datos en ninguna fuente`);
      }

      this.porcentajesRadar[cursoid] = porcentaje;
      console.log(`Curso ${cursoid}: ${porcentaje}% (fuente: ${fuenteDatos})`);
    }

    console.log('=== PORCENTAJES FINALES ===');
    console.log('Matemáticas (1):', this.porcentajesRadar[1] + '%');
    console.log('Comunicación (2):', this.porcentajesRadar[2] + '%');
    console.log('Ciencias y Tecnología (3):', this.porcentajesRadar[3] + '%');
    console.log('=====================================');
  }

  mostrarResultados(cursoid: number) {
    if (!this.fechainicio || !this.fechafin) {
      console.warn('Fechas no seleccionadas');
      return;
    }

    this.usuarioService.getResultadosCurso({
      cursoid: cursoid,
      usuarioid: this.usuarioid,
      fechainicio: this.fechainicio,
      fechafin: this.fechafin
    }).subscribe({
      next: (data) => {
        this.resultados[cursoid] = data;
        this.checkHasData(cursoid);
        console.log(`Datos cargados para curso ${cursoid}:`, data);
      },
      error: (error) => {
        console.error('Error al obtener datos:', error);
        this.resultados[cursoid] = [];
        this.hasData[cursoid] = false;
      }
    });
  }

  private checkHasData(cursoid: number): void {
    // Verificar si hay datos para el curso específico
    this.hasData[cursoid] = this.resultados[cursoid] && this.resultados[cursoid].length > 0;
  }

  cargarDatos(): void {
    // Recargar datos para todos los cursos
    [1, 2, 3].forEach(cursoid => this.mostrarResultados(cursoid));
  }

  cargarReporteDetallado(): void {
    console.log('Cargando reporte detallado...');
    // Cargar reporte detallado para todos los cursos
    [1, 2, 3].forEach(cursoid => this.mostrarReporteDetallado(cursoid));

    // Calcular porcentajes y actualizar gráfico después de cargar todos los datos
    setTimeout(() => {
      console.log('Actualizando gráfico desde cargarReporteDetallado...');
      this.calcularPorcentajesRadar();
      this.refreshRadarChart();
    }, 1000);
  }

  mostrarReporteDetallado(cursoid: number) {
    if (!this.fechainicio || !this.fechafin) {
      console.warn('Fechas no seleccionadas');
      return;
    }

    this.usuarioService.getReporteDetallado({
      cursoid: cursoid,
      usuarioid: this.usuarioid,
      fechainicio: this.fechainicio,
      fechafin: this.fechafin,
      tipo: this.tipoReporte
    }).subscribe({
      next: (data) => {
        this.reporteDetallado[cursoid] = data;
        this.hasDetailedData[cursoid] = data && data.length > 0;
        console.log(`Reporte detallado cargado para curso ${cursoid}:`, data);
      },
      error: (error) => {
        console.error('Error al obtener reporte detallado:', error);
        this.reporteDetallado[cursoid] = [];
        this.hasDetailedData[cursoid] = false;
      }
    });
  }

  onTipoReporteChange(): void {
    this.cargarReporteDetallado();
  }

  onFechasChange(): void {
    // Recargar tanto el reporte resumido como el detallado cuando cambien las fechas
    this.cargarDatos();
    this.cargarReporteDetallado();
  }

  buscarReportes(): void {
    if (!this.fechainicio || !this.fechafin) {
      alert('Por favor selecciona ambas fechas');
      return;
    }

    console.log('Iniciando búsqueda de reportes...');

    // Activar loading
    this.isLoadingData = true;
    this.loadingMessage = 'Buscando reportes...';
    this.loadedQuestions = 0;
    this.totalQuestions = 0;

    // Limpiar datos anteriores
    this.resultados = {};
    this.reporteDetallado = {};
    this.hasData = {};
    this.hasDetailedData = {};
    this.porcentajesRadar = { 1: 0, 2: 0, 3: 0 };

    // Cargar datos con loading
    this.cargarDatos();
    this.cargarReporteDetallado();

    // Actualizar gráfico múltiples veces para asegurar que se actualice
    setTimeout(() => {
      console.log('Primera actualización del gráfico...');
      this.calcularPorcentajesRadar();
      this.refreshRadarChart();
    }, 1000);

    setTimeout(() => {
      console.log('Segunda actualización del gráfico...');
      this.calcularPorcentajesRadar();
      this.refreshRadarChart();
    }, 2000);

    setTimeout(() => {
      console.log('Tercera actualización del gráfico...');
      this.calcularPorcentajesRadar();
      this.refreshRadarChart();
    }, 3000);

    // Finalizar loading
    setTimeout(() => {
      this.isLoadingData = false;
      console.log('Datos cargados completamente, actualización final del gráfico...');
      this.calcularPorcentajesRadar();
      this.refreshRadarChart();
    }, 4000);
  }

  goBack(): void {
    console.log('goBack() called - navigating to /estudiantes');
    this.router.navigate(['/estudiantes']);
  }

  private loadUserInfo(): void {
    if (this.usuarioid && this.usuarioid > 0) {
      // Obtener la lista de alumnos y buscar el que coincida con el usuarioid
      this.alumnoService.getAlumnos().subscribe({
        next: (alumnos: Alumno[]) => {
          console.log('Alumnos cargados:', alumnos);
          const alumno = alumnos.find(a => a.id === this.usuarioid);
          if (alumno) {
            console.log('Alumno encontrado:', alumno);
            this.usuarioNombre = alumno.nombre || 'Estudiante';
            this.usuarioApellido = ''; // El modelo Alumno no tiene apellido
            this.usuarioEmail = alumno.correo || '';
            this.usuarioGrado = alumno.grado ? `Grado ${alumno.grado}` : '';
            this.usuarioSeccion = alumno.seccionid ? `Sección ${alumno.seccionid}` : '';
          } else {
            console.log('Alumno no encontrado, usando valores por defecto');
            this.setDefaultUserInfo();
          }
        },
        error: (error) => {
          console.error('Error cargando alumnos:', error);
          this.setDefaultUserInfo();
        }
      });
    } else {
      this.setDefaultUserInfo();
    }
  }

  private setDefaultUserInfo(): void {
    this.usuarioNombre = 'Estudiante';
    this.usuarioApellido = '';
    this.usuarioEmail = '';
    this.usuarioGrado = '';
    this.usuarioSeccion = '';
  }

  public refreshRadarChart(): void {
    console.log('=== REFRESCANDO GRÁFICO RADAR ===');
    console.log('Porcentajes actuales:', this.porcentajesRadar);

    // Destruir gráfico existente si existe
    const canvas = document.getElementById('radarChart') as HTMLCanvasElement;
    if (canvas) {
      const existingChart = Chart.getChart(canvas);
      if (existingChart) {
        console.log('Destruyendo gráfico anterior...');
        existingChart.destroy();
      }
    } else {
      console.error('Canvas no encontrado!');
      return;
    }

    // Crear nuevo gráfico con los datos actualizados
    setTimeout(() => {
      console.log('Creando nuevo gráfico con datos:', this.porcentajesRadar);
      console.log('Matemáticas:', this.porcentajesRadar[1]);
      console.log('Comunicación:', this.porcentajesRadar[2]);
      console.log('Ciencias y Tecnología:', this.porcentajesRadar[3]);
      this.createRadarChart();
    }, 200);
  }

  private getCursoNombre(cursoid: number): string {
    const courseNames = {
      1: 'Matemáticas',
      2: 'Comunicación',
      3: 'Ciencias y Tecnología'
    };
    return courseNames[cursoid as keyof typeof courseNames] || 'Curso';
  }

  calcularPuntaje(cursoid: number): string {
  const datos = this.resultados[cursoid];
  if (!datos || datos.length === 0) return '0%';

  let totalBuenas = 0;
  let totalPreguntas = 0;


  datos.forEach((r) => {
    const partes = r.respuestas_buenas_sobre_totales.split('/');
    if (partes.length === 2) {
      totalBuenas += parseInt(partes[0], 10);
      totalPreguntas += parseInt(partes[1], 10);
    }
  });

  if (totalPreguntas === 0) return '0%';

  const porcentaje = (totalBuenas / totalPreguntas) * 100;
  return `${porcentaje.toFixed(1)}%`;
}


  exportarExcel(cursoid: number) {
    const cursoNombre = this.getCursoNombre(cursoid);
    const datosDetallados = this.reporteDetallado[cursoid] || [];

    if (datosDetallados.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Crear datos para Excel
    const datosExcel = datosDetallados.map(item => ({
      'Usuario ID': item.usuario_id,
      'Nombre Usuario': item.nombre_usuario,
      'Alumno ID': item.alumno_id,
      'Nombre Alumno': item.nombre_alumno,
      'Grado': item.grado,
      'Evaluación': item.evaluacion,
      'Pregunta': item.pregunta,
      'Respuesta Correcta': item.respuesta_correcta,
      'Estado': item.estado_respuesta,
      'Tiempo Respuesta (s)': item.tiempo_respuesta,
      'Tiempo Reforzamiento (s)': item.tiemporeforzamiento,
      'Fecha Respuesta': item.fecha_respuesta
    }));

    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${cursoNombre} - ${this.tipoReporte === 'examen' ? 'Exámenes' : 'Prácticas'}`);

    // Descargar archivo
    const fecha = new Date().toISOString().split('T')[0];
    const tipoReporte = this.tipoReporte === 'examen' ? 'Examenes' : 'Practicas';
    XLSX.writeFile(wb, `reporte_${cursoNombre.toLowerCase().replace(/\s+/g, '_')}_${tipoReporte}_${fecha}.xlsx`);
  }
}
