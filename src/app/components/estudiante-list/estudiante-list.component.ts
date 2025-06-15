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
Chart.register(...registerables);
Chart.register(...registerables, ChartDataLabels);


@Component({
  selector: 'app-estudiante-list',
  standalone: false,
  templateUrl: './estudiante-list.component.html',
  styleUrl: './estudiante-list.component.scss'
})
export class EstudianteListComponent implements OnInit {

  grados: string[] = ['1°', '2°', '3°', '4°', '5°'];
  secciones: string[] = ['A', 'B', 'C'];
  gradoSeleccionado: string | null = null;
  seccionSeleccionada: string | null = null;
  estudiantes = [
    { nombre: 'usuario1', porcentaje: 70 },
    { nombre: 'usuario2', porcentaje: 60 },
    { nombre: 'usuario3', porcentaje: 70 },
    { nombre: 'usuario4', porcentaje: 60 },
    { nombre: 'usuario5', porcentaje: 70 },
    { nombre: 'usuario6', porcentaje: 60 },
    { nombre: 'usuario7', porcentaje: 70 },
    { nombre: 'usuario8', porcentaje: 60 },
    { nombre: 'usuario9', porcentaje: 70 },
    { nombre: 'usuario11', porcentaje: 75 }
  ];

  pageSize = 5;
  currentPage = 1;


  tituloMessage: string = '¡Bienvenido! ';


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
    private evaluacionserice: EvaluacionService,
    private resultadopreguntaservice: ResultadopreguntaService) { }



  ngOnInit(): void {

    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
      this.usuaoservice.getUsuario(Number(usuarioId)).subscribe(usuario => {

        if (usuario.usuario == "admin") {
          this.tituloMessage = "¡Bienvenido! Administrador " + usuario.usuario;
          // Llamar a alumnos
          this.alumnoservice.getAlumnos().subscribe(alumnos => {
            // Filtrar alumnos que pertenezcan a alguna de las secciones del docente
            const alumnosFiltrados = alumnos;

            this.estudiantes = alumnosFiltrados.map(alumno => ({
              nombre: alumno.nombre,      // Asegúrate que `nombre` exista en tu modelo Alumno
              porcentaje: 50              // O algún valor por defecto / calculado
            }));

          });

        } else {

          this.tituloMessage = "¡Bienvenido! Docente " + usuario.usuario;
          this.docentesesionservice.getDocentesesions().subscribe(sesiones => {
            const sesionesDocente = sesiones.filter(s => s.docenteid === usuario.aludocenid);

            if (sesionesDocente.length === 0) {
              console.warn("Este docente no tiene secciones asignadas.");
              return;
            }

            // Obtener todos los seccionid asociados al docente
            const seccionesIds = sesionesDocente.map(s => s.seccionid);

            // Llamar a alumnos
            this.alumnoservice.getAlumnos().subscribe(alumnos => {
              // Filtrar alumnos que pertenezcan a alguna de las secciones del docente
              const alumnosFiltrados = alumnos.filter(a => seccionesIds.includes(a.seccionid));

              this.estudiantes = alumnosFiltrados.map(alumno => ({
                nombre: alumno.nombre,      // Asegúrate que `nombre` exista en tu modelo Alumno
                porcentaje: 50              // O algún valor por defecto / calculado
              }));

            });
          });

        }


      });
    }
  }




  get totalPages(): number {
    return Math.ceil(this.estudiantes.length / this.pageSize);
  }

  get estudiantesPaginados() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.estudiantes.slice(start, start + this.pageSize);
  }

  cambiarPagina(delta: number) {
    const nuevaPagina = this.currentPage + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPages) {
      this.currentPage = nuevaPagina;
    }
  }

  filtrarEstudiantes() {

    // this.estudiantesPaginados = this.estudiantes.filter(est => {
    // return (!this.gradoSeleccionado || est.grado === this.gradoSeleccionado) &&
    //       (!this.seccionSeleccionada || est.seccion === this.seccionSeleccionada);
    // });
  }


}
