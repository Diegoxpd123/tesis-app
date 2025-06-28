import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatGptService } from '../../services/chat-gpt.service';
import { ComunicacionService } from '../../services/comunicacion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { UsuarioService } from '../../services/usuario.service';
import { AlumnoService } from '../../services/alumno.service';
import { PreguntaService } from '../../services/pregunta.service';
import { ResultadopreguntaService } from '../../services/resultadopregunta.service';
import { DocenteService } from '../../services/docente.service';
import { DocentesesionService } from '../../services/docentesesion.service';
import { EvaluacionService } from '../../services/evaluacion.service';
import { Resultadopregunta } from '../../models/resultadopregunta.model';
import { Tema } from '../../models/tema.model';
import { Pregunta } from '../../models/pregunta.model';
import { Evaluacion } from '../../models/evaluacion.model';
import * as XLSX from 'xlsx';
import { TemaService } from '../../services/tema.service';

Chart.register(...registerables);
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-estudiante-list',
  standalone: false,
  templateUrl: './estudiante-list.component.html',
  styleUrl: './estudiante-list.component.scss'
})
export class EstudianteListComponent implements OnInit {

  tema!: Tema;
  evaluacion!: Evaluacion;
  pregunta!: Pregunta;
  grados: string[] = ['4', '5', '6'];
  secciones: string[] = ['A', 'B', 'C'];
  gradoSeleccionado: string | null = null;
  seccionSeleccionada: string | null = null;
  estudiantes = [
    { nombre: 'usuario1', porcentaje: 70, grado: 4, seccionid: 1 },
  ];

  pageSize = 5;
  currentPage = 1;
  usuarioid: string = '';
  tituloMessage: string = '¡Bienvenido!';
  estudiantesFiltrados = this.estudiantes;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private comunicacionService: ComunicacionService,
    private usuaoservice: UsuarioService,
    private docenteservice: DocenteService,
    private docentesesionservice: DocentesesionService,
    private alumnoservice: AlumnoService,
    private preguntaservice: PreguntaService,
    private temaService: TemaService,
    private evaluacionserice: EvaluacionService,
    private resultadopreguntaservice: ResultadopreguntaService) { }

  ngOnInit(): void {
    const usuarioId = localStorage.getItem('usuario_id');
    this.comunicacionService.toggleCerrarSesion$.subscribe(() => {
      this.toggleCerrarSesion();
    });
    if (usuarioId) {
      this.usuaoservice.getUsuario(Number(usuarioId)).subscribe(usuario => {
        this.usuarioid = usuarioId;
        if (usuario.usuario == "admin") {
          this.tituloMessage = "¡Bienvenido! Administrador " + usuario.usuario;
          this.alumnoservice.getAlumnos().subscribe(alumnos => {
            const alumnosFiltrados = alumnos;

            this.estudiantes = alumnosFiltrados.map(alumno => ({
              nombre: alumno.nombre,
              porcentaje: 50,
              grado: alumno.grado,
              seccionid: alumno.seccionid
            }));

            this.estudiantesFiltrados = [...this.estudiantes];
          });
        } else {
          this.tituloMessage = "¡Bienvenido! Docente " + usuario.usuario;
          this.docentesesionservice.getDocentesesions().subscribe(sesiones => {
            const sesionesDocente = sesiones.filter(s => s.docenteid === usuario.aludocenid);

            if (sesionesDocente.length === 0) {
              console.warn("Este docente no tiene secciones asignadas.");
              return;
            }

            const seccionesIds = sesionesDocente.map(s => s.seccionid);

            this.alumnoservice.getAlumnos().subscribe(alumnos => {
              const alumnosFiltrados = alumnos.filter(a => seccionesIds.includes(a.seccionid));

              this.estudiantes = alumnosFiltrados.map(alumno => ({
                nombre: alumno.nombre,
                porcentaje: 50,
                grado: alumno.grado,
                seccionid: alumno.seccionid
              }));

              this.estudiantesFiltrados = [...this.estudiantes];
            });
          });
        }
      });
    }
  }

  toggleCerrarSesion() {
    localStorage.removeItem('usuario_id');
    this.router.navigate(['/login']);
  }

  get totalPages(): number {
    return Math.ceil(this.estudiantesFiltrados.length / this.pageSize);
  }

  get estudiantesPaginados() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.estudiantesFiltrados.slice(start, start + this.pageSize);
  }

  cambiarPagina(delta: number) {
    const nuevaPagina = this.currentPage + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPages) {
      this.currentPage = nuevaPagina;
    }
  }

  private mapSeccionToNumber(seccion: string | null): number | null {
    switch (seccion) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      default: return null;
    }
  }

  filtrarEstudiantes() {
    const grado = Number(this.gradoSeleccionado);
    const seccionId = this.mapSeccionToNumber(this.seccionSeleccionada);

    this.estudiantesFiltrados = this.estudiantes.filter(est => {
      return (!this.gradoSeleccionado || est.grado === grado) &&
             (!this.seccionSeleccionada || est.seccionid === seccionId);
    });

    this.currentPage = 1;
  }

  async leerArchivoExcel(event: any): Promise<void> {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const nombreHoja = workbook.SheetNames[0];
      const hoja = workbook.Sheets[nombreHoja];
      const filas: any[][] = XLSX.utils.sheet_to_json(hoja, { header: 1 });
      const dataRows = filas.slice(1);

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

          const temas = (await this.temaService.getTemas().toPromise()) ?? [];
          const temaExistente = temas.find(t => t.nombre.trim().toLowerCase() === temaNombre.toLowerCase());

          let temaId: number;
          if (temaExistente) {
            console.log(`⚠️ Tema ya existe: ${temaNombre}`);
            temaId = temaExistente.id;
          } else {
            const tema = {
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

          const nombretotal = temaNombre.toLowerCase() + grado + fechainicio;
          const evaluaciones = (await this.evaluacionserice.getEvaluacions().toPromise()) ?? [];
          const evaluacionExistente = evaluaciones.find(ev => ev.nombre.trim().toLowerCase() === nombretotal.toLowerCase());

          let evaluacionId: number;
          if (evaluacionExistente) {
            console.log(`⚠️ Evaluación ya existe: ${nombretotal}`);
            evaluacionId = evaluacionExistente.id;
          } else {
            const evaluacion = {
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
            const evaluacionCreada = await this.evaluacionserice.createEvaluacion(evaluacion).toPromise();
            if (!evaluacionCreada) continue;
            evaluacionId = evaluacionCreada.id;
            console.log(`✅ Evaluación creada: ${nombretotal}`);
          }

          const pregunta = {
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

          await this.preguntaservice.createPregunta(pregunta).toPromise();
          console.log(`✅ Pregunta creada: ${preguntaTexto}`);

        } catch (error) {
          console.error('❌ Error al procesar fila:', error);
        }
      }
    };

    reader.readAsArrayBuffer(archivo);
  }

}
