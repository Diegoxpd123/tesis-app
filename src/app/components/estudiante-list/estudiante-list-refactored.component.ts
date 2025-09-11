import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import * as XLSX from 'xlsx';

// Servicios
import { UsuarioService } from '../../services/usuario.service';
import { AlumnoService } from '../../services/alumno.service';
import { DocenteService } from '../../services/docente.service';
import { DocentesesionService } from '../../services/docentesesion.service';
import { ComunicacionService } from '../../services/comunicacion.service';
import { PreguntaService } from '../../services/pregunta.service';
import { TemaService } from '../../services/tema.service';
import { EvaluacionService } from '../../services/evaluacion.service';
// Modelos
import { Estudiante, EstudianteFiltro, PaginacionConfig } from '../../models/estudiante.model';
import { Pregunta } from '../../models/pregunta.model';
import { Tema } from '../../models/tema.model';
import { Evaluacion } from '../../models/evaluacion.model';

// Componentes
import { EstudianteFiltersComponent } from '../estudiante-filters/estudiante-filters.component';
import { EstudianteTableComponent } from '../estudiante-table/estudiante-table.component';
import { EstudiantePaginationComponent } from '../estudiante-pagination/estudiante-pagination.component';

@Component({
  selector: 'app-estudiante-list-refactored',
  templateUrl: './estudiante-list-refactored.component.html',
  styleUrls: ['./estudiante-list-refactored.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EstudianteFiltersComponent,
    EstudianteTableComponent,
    EstudiantePaginationComponent
  ]
})
export class EstudianteListRefactoredComponent implements OnInit, OnDestroy {
  // Estado del componente
  tituloMessage: string = '¡Bienvenido!';
  loading: boolean = false;
  showStats: boolean = true;
  searchTerm: string = '';
  isDarkMode: boolean = false;

  // Datos
  estudiantes: Estudiante[] = [];
  estudiantesFiltrados: Estudiante[] = [];
  usuarioid: string = '';
  userType: string = '';
  currentUser: any = null;

  // Configuración
  grados: string[] = ['4', '5', '6'];
  secciones: string[] = ['A', 'B', 'C'];
  filtro: EstudianteFiltro = { grado: null, seccion: null };
  paginacion: PaginacionConfig = {
    pageSize: 10,
    currentPage: 1,
    totalItems: 0
  };

  // Excel upload
  preguntasGuardadas: number = 0;
  totalPreguntas: number = 0;
  isUploadingExcel: boolean = false;
  showExcelResult: boolean = false;
  excelResultMessage: string = '';

  // Estadísticas
  stats = {
    totalEstudiantes: 0,
    promedioGeneral: 0,
    estudiantesExcelentes: 0,
    estudiantesBuenos: 0,
    estudiantesRegulares: 0,
    estudiantesNecesitanAyuda: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private alumnoService: AlumnoService,
    private docenteService: DocenteService,
    private docenteSesionService: DocentesesionService,
    private comunicacionService: ComunicacionService,
    private preguntaService: PreguntaService,
    private temaService: TemaService,
    private evaluacionService: EvaluacionService
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.subscribeToLogout();
    this.loadTheme();
    this.setupThemeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeUser(): void {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuarioid = usuarioId;
    this.loadUserData(Number(usuarioId));
  }

  private subscribeToLogout(): void {
    this.comunicacionService.toggleCerrarSesion$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.toggleCerrarSesion();
      });
  }

  private loadUserData(usuarioId: number): void {
    this.loading = true;

    this.usuarioService.getUsuario(usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuario) => {
          this.currentUser = usuario;
          this.userType = usuario.tipousuarioid === 1 ? 'admin' : 'docente';
          this.setUserTitle(this.userType);
          this.loadEstudiantes(usuario);
        },
        error: (error) => {
          console.error('Error al cargar usuario:', error);
          this.loading = false;
        }
      });
  }

  private setUserTitle(usuario: string): void {
    if (usuario === 'admin') {
      this.tituloMessage = `¡Bienvenido! Administrador ${usuario}`;
    } else {
      this.tituloMessage = `¡Bienvenido! Docente ${usuario}`;
    }
  }

  private loadEstudiantes(usuario: any): void {
    if (usuario.usuario === 'admin') {
      this.loadAllEstudiantes();
    } else {
      this.loadEstudiantesByDocente(usuario.aludocenid);
    }
  }

  private loadAllEstudiantes(): void {
    this.alumnoService.getAlumnos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alumnos) => {
          this.estudiantes = this.mapAlumnosToEstudiantes(alumnos);
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar estudiantes:', error);
          this.loading = false;
        }
      });
  }

  private loadEstudiantesByDocente(docenteId: number): void {
    this.docenteSesionService.getDocentesesions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sesiones) => {
          const sesionesDocente = sesiones.filter(s => s.docenteid === docenteId);

          if (sesionesDocente.length === 0) {
            console.warn('Este docente no tiene secciones asignadas.');
            this.loading = false;
            return;
          }

          const seccionesIds = sesionesDocente.map(s => s.seccionid);
          this.loadEstudiantesBySecciones(seccionesIds);
        },
        error: (error) => {
          console.error('Error al cargar secciones del docente:', error);
          this.loading = false;
        }
      });
  }

  private loadEstudiantesBySecciones(seccionesIds: number[]): void {
    this.alumnoService.getAlumnos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alumnos) => {
          const alumnosFiltrados = alumnos.filter(a => seccionesIds.includes(a.seccionid));
          this.estudiantes = this.mapAlumnosToEstudiantes(alumnosFiltrados);
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar estudiantes por secciones:', error);
          this.loading = false;
        }
      });
  }

  private mapAlumnosToEstudiantes(alumnos: any[]): Estudiante[] {
    return alumnos.map(alumno => ({
      id: alumno.id,
      nombre: alumno.nombre,
      porcentaje: 50, // TODO: Calcular porcentaje real basado en evaluaciones
      grado: alumno.grado,
      seccionid: alumno.seccionid
    }));
  }

  // Métodos de filtros
  onFiltroChange(filtro: EstudianteFiltro): void {
    this.filtro = filtro;
    this.applyFilters();
  }

  private applyFilters(): void {
    this.estudiantesFiltrados = this.estudiantes.filter(est => {
      const gradoMatch = !this.filtro.grado || est.grado === Number(this.filtro.grado);
      const seccionMatch = !this.filtro.seccion || est.seccionid === this.mapSeccionToNumber(this.filtro.seccion);
      const searchMatch = !this.searchTerm ||
        est.nombre.toLowerCase().includes(this.searchTerm.toLowerCase());
      return gradoMatch && seccionMatch && searchMatch;
    });

    this.updatePagination();
    this.calculateStats();
  }

  private mapSeccionToNumber(seccion: string | null): number | null {
    switch (seccion) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      default: return null;
    }
  }

  // Métodos de paginación
  onPageChange(page: number): void {
    this.paginacion.currentPage = page;
  }

  private updatePagination(): void {
    this.paginacion.totalItems = this.estudiantesFiltrados.length;
    this.paginacion.currentPage = 1; // Reset to first page when filtering
  }

  get estudiantesPaginados(): Estudiante[] {
    const start = (this.paginacion.currentPage - 1) * this.paginacion.pageSize;
    const end = start + this.paginacion.pageSize;
    return this.estudiantesFiltrados.slice(start, end);
  }


  // Métodos de navegación
  onVerDetalles(estudianteId: number): void {
    this.router.navigate(['/estudiantes/detail', estudianteId]);
  }

  toggleCerrarSesion(): void {
    localStorage.removeItem('usuario_id');
    this.router.navigate(['/login']);
  }


  get emptyMessage(): string {
    if (this.loading) return 'Cargando estudiantes...';
    if (this.estudiantes.length === 0) return 'No hay estudiantes disponibles';
    if (this.estudiantesFiltrados.length === 0) return 'No hay estudiantes que coincidan con los filtros';
    return 'No hay estudiantes disponibles';
  }


  toggleStats(): void {
    this.showStats = !this.showStats;
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  private calculateStats(): void {
    const estudiantes = this.estudiantesFiltrados;
    this.stats.totalEstudiantes = estudiantes.length;

    if (estudiantes.length === 0) {
      this.stats.promedioGeneral = 0;
      this.stats.estudiantesExcelentes = 0;
      this.stats.estudiantesBuenos = 0;
      this.stats.estudiantesRegulares = 0;
      this.stats.estudiantesNecesitanAyuda = 0;
      return;
    }

    const totalPorcentaje = estudiantes.reduce((sum, est) => sum + est.porcentaje, 0);
    this.stats.promedioGeneral = Math.round(totalPorcentaje / estudiantes.length);

    this.stats.estudiantesExcelentes = estudiantes.filter(est => est.porcentaje >= 80).length;
    this.stats.estudiantesBuenos = estudiantes.filter(est => est.porcentaje >= 60 && est.porcentaje < 80).length;
    this.stats.estudiantesRegulares = estudiantes.filter(est => est.porcentaje >= 40 && est.porcentaje < 60).length;
    this.stats.estudiantesNecesitanAyuda = estudiantes.filter(est => est.porcentaje < 40).length;
  }


  refreshData(): void {
    this.loading = true;
    this.loadUserData(Number(this.usuarioid));
  }

  getPageSizeOptions(): number[] {
    return [5, 10, 20, 50];
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.paginacion.pageSize = +target.value;
    this.paginacion.currentPage = 1;
  }

  get isAdmin(): boolean {
    return this.userType === 'admin';
  }

  get isDocente(): boolean {
    return this.userType !== 'admin';
  }

  // Métodos de tema
  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
  }

  private setupThemeListener(): void {
    // Escuchar cambios en el localStorage desde otros tabs
    window.addEventListener('storage', () => {
      this.loadTheme();
    });

    // Escuchar cambios en el mismo tab usando un intervalo
    setInterval(() => {
      const currentTheme = localStorage.getItem('theme');
      const shouldBeDark = currentTheme === 'dark';
      if (this.isDarkMode !== shouldBeDark) {
        this.loadTheme();
      }
    }, 100); // Verificar cada 100ms
  }

  // Método para cargar Excel
  async leerArchivoExcel(event: any): Promise<void> {
    const archivo = event.target.files[0];
    if (!archivo) return;

    this.isUploadingExcel = true;
    this.preguntasGuardadas = 0;
    this.totalPreguntas = 0;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const nombreHoja = workbook.SheetNames[0];
      const hoja = workbook.Sheets[nombreHoja];
      const filas: any[][] = XLSX.utils.sheet_to_json(hoja, { header: 1 });
      const dataRows = filas.slice(1);
      this.totalPreguntas = dataRows.length;

      for (const fila of dataRows) {
        try {
          const curso = fila[0]?.toString().trim();
          const temaNombre = fila[1]?.toString().trim();
          const preguntaTexto = fila[2]?.toString().trim();
          const descripcion = fila[3]?.toString().trim();
          const opcion3 = fila[4]?.toString().trim();
          const opcion2 = fila[5]?.toString().trim();
          const opcion1 = fila[6]?.toString().trim();
          const opcion4 = fila[7]?.toString().trim();
          const imagen = "/assets/img/" + fila[8]?.toString().trim() + ".png";

          const fechaNumeroInicio = fila[9];
          const fechaNumeroFin = fila[10];
          const grado = fila[11]?.toString().trim();

          let fechainicio: string = '';
          let fechafin: string = '';

          if (!isNaN(fechaNumeroInicio)) {
            const fechaObj = XLSX.SSF.parse_date_code(fechaNumeroInicio);
            if (fechaObj) {
              const jsFecha = new Date(fechaObj.y, fechaObj.m - 1, fechaObj.d);
              fechainicio = jsFecha.toISOString().split('T')[0];
            }
          }

          if (!isNaN(fechaNumeroFin)) {
            const fechaObj = XLSX.SSF.parse_date_code(fechaNumeroFin);
            if (fechaObj) {
              const jsFecha = new Date(fechaObj.y, fechaObj.m - 1, fechaObj.d);
              fechafin = jsFecha.toISOString().split('T')[0];
            }
          }

          let cursoId = 3;
          if (curso == 'Matemática') cursoId = 1;
          else if (curso == 'Comunicacion') cursoId = 2;

          if (!temaNombre || !preguntaTexto) continue;

          // Crear o buscar tema
          const temas = (await this.temaService.getTemas().toPromise()) ?? [];
          const temaExistente = temas.find(t => t.nombre.trim().toLowerCase() === temaNombre.toLowerCase());

          let temaId: number;
          if (temaExistente) {
            console.log(`⚠️ Tema ya existe: ${temaNombre}`);
            temaId = temaExistente.id;
          } else {
            const tema: Tema = {
              id: 0,
              nombre: temaNombre,
              cursoid: cursoId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_deleted: 0,
              is_actived: 1
            };
            const temaCreado = await this.temaService.createTema(tema).toPromise();
            if (!temaCreado) continue;
            temaId = temaCreado.id;
            console.log(`✅ Tema creado: ${temaNombre}`);
          }

          // Crear o buscar evaluación
          const nombretotal = temaNombre.toLowerCase();
          const evaluaciones = (await this.evaluacionService.getEvaluacions().toPromise()) ?? [];
          const evaluacionExistente = evaluaciones.find(ev => ev.nombre.trim().toLowerCase() === nombretotal.toLowerCase());

          let evaluacionId: number;
          if (evaluacionExistente) {
            console.log(`⚠️ Evaluación ya existe: ${nombretotal}`);
            evaluacionId = evaluacionExistente.id;
          } else {
            const evaluacion: Evaluacion = {
              id: 0,
              nombre: nombretotal,
              temaid: temaId,
              institucionid: cursoId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_deleted: 0,
              is_actived: 1,
              fechainicio,
              fechafin,
              grado: grado
            };
            const evaluacionCreada = await this.evaluacionService.createEvaluacion(evaluacion).toPromise();
            if (!evaluacionCreada) continue;
            evaluacionId = evaluacionCreada.id;
            console.log(`✅ Evaluación creada: ${nombretotal}`);
          }

          // Crear pregunta
          const pregunta: Pregunta = {
            id: 0,
            descripcion: preguntaTexto,
            evaluacionid: evaluacionId,
            imagen,
            respuesta: descripcion,
            opcion1,
            opcion2,
            opcion3,
            opcion4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_deleted: 0,
            is_actived: 1
          };

          await this.preguntaService.createPregunta(pregunta).toPromise();
          this.preguntasGuardadas++;
          console.log(`✅ Pregunta ${this.preguntasGuardadas}/${this.totalPreguntas} creada: ${preguntaTexto}`);

        } catch (error) {
          console.error('❌ Error al procesar fila:', error);
        }
      }

      // Finalizar loading
      this.isUploadingExcel = false;
      this.showExcelResult = true;
      this.excelResultMessage = `¡Proceso completado! Se guardaron ${this.preguntasGuardadas} preguntas de ${this.totalPreguntas} procesadas.`;
      console.log(`🎉 Proceso completado: ${this.preguntasGuardadas} preguntas guardadas de ${this.totalPreguntas} procesadas`);

      // Ocultar el mensaje después de 5 segundos
      setTimeout(() => {
        this.showExcelResult = false;
      }, 5000);

      // Recargar la lista de estudiantes después de procesar Excel
      this.loadUserData(Number(this.usuarioid));
    };

    reader.readAsArrayBuffer(archivo);
  }
}
