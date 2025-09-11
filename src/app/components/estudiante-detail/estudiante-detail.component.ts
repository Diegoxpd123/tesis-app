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
  usuarioid: number = 5;
  hasData: { [cursoid: number]: boolean } = {};
  showModal: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  modalCourseId: number = 0;
  loading: boolean = false;
  isDarkMode: boolean = false;
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

  // No cargar datos automáticamente, solo cuando el usuario haga clic
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

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Matemáticas', 'Comunicación', 'Ciencias y Tecnología'],
        datasets: [{
          label: 'Progreso',
          data: [8, 10, 8],
          backgroundColor: 'rgba(25, 118, 210, 0.2)',
          borderColor: '#1976d2',
          pointBackgroundColor: '#1976d2',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#1976d2',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          datalabels: {
            color: 'white',
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value: number) => `${value}`,
            anchor: 'center',
            align: 'center'
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            suggestedMax: 15,
            min: 0,
            max: 15,
            grid: {
              color: 'rgba(255, 255, 255, 0.3)',
              lineWidth: 1
            },
            pointLabels: {
              color: 'white',
              font: {
                size: 12,
                family: 'Arial, sans-serif',
                weight: 'bold'
              }
            },
            angleLines: {
              color: 'rgba(255, 255, 255, 0.3)',
              lineWidth: 1
            },
            ticks: {
              display: false
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

  mostrarResultados(cursoid: number) {
    if (!this.fechainicio || !this.fechafin) {
      alert('Selecciona fechas válidas');
      return;
    }

    // Mostrar loading
    this.loading = true;
    this.isLoadingData = true;
    this.loadedQuestions = 0;
    this.totalQuestions = 0;
    this.loadingMessage = `Cargando datos de ${this.getCursoNombre(cursoid)}...`;
    this.showModal = true;
    this.modalTitle = 'Buscando datos...';
    this.modalMessage = '';
    this.modalCourseId = cursoid;

    this.usuarioService.getResultadosCurso({
      cursoid: cursoid,
      usuarioid: this.usuarioid,
      fechainicio: this.fechainicio,
      fechafin: this.fechafin
    }).subscribe({
      next: (data) => {
        this.resultados[cursoid] = data;
        this.checkHasData(cursoid);
        this.loading = false;
        this.isLoadingData = false;

        // Actualizar contadores
        if (data && data.length > 0) {
          this.loadedQuestions = data.length;
          this.totalQuestions = data.length;
          this.loadingMessage = `Datos cargados: ${data.length} preguntas encontradas`;
        } else {
          this.loadingMessage = 'No se encontraron datos';
        }

        // Si hay datos, mostrar el reporte en el modal
        if (this.hasData[cursoid]) {
          this.showReportModal(cursoid);
        } else {
          // Si no hay datos, mostrar el modal de "no hay datos"
          this.showNoDataModal(cursoid);
        }
      },
      error: (error) => {
        this.loading = false;
        this.isLoadingData = false;
        this.loadingMessage = 'Error al cargar los datos';
        this.showNoDataModal(cursoid);
        console.error('Error al obtener datos:', error);
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

  private showReportModal(cursoid: number): void {
    const courseNames = {
      1: 'Matemáticas',
      2: 'Comunicación',
      3: 'Ciencias y Tecnología'
    };

    this.modalTitle = `Reporte de ${courseNames[cursoid as keyof typeof courseNames]}`;
    this.modalMessage = '';
    this.modalCourseId = cursoid;
    this.showModal = true;
  }

  private showNoDataModal(cursoid: number): void {
    const courseNames = {
      1: 'Matemáticas',
      2: 'Comunicación',
      3: 'Ciencias y Tecnología'
    };

    this.modalTitle = `No hay datos de ${courseNames[cursoid as keyof typeof courseNames]}`;
    this.modalMessage = `El estudiante no ha completado evaluaciones de ${courseNames[cursoid as keyof typeof courseNames]} en las fechas seleccionadas.`;
    this.modalCourseId = cursoid;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalTitle = '';
    this.modalMessage = '';
    this.modalCourseId = 0;
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
    setTimeout(() => {
      this.createRadarChart();
    }, 50);
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
    const data = this.resultados[cursoid];
    if (!data || data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { [`Curso_${cursoid}`]: worksheet },
      SheetNames: [`Curso_${cursoid}`]
    };
    XLSX.writeFile(workbook, `resultados_curso_${cursoid}.xlsx`);
  }
}
