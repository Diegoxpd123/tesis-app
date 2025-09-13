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
import { EvaluacionService } from '../../services/evaluacion.service';
import { Resultadopregunta } from '../../models/resultadopregunta.model';
import { ChangeDetectorRef } from '@angular/core';
import { Tema } from '../../models/tema.model';
import { Pregunta } from '../../models/pregunta.model';
import { Evaluacion } from '../../models/evaluacion.model';
import { TemaService } from '../../services/tema.service';
import { Usuario } from '../../models/usuario.model';
import { TermsPrivacyService } from '../../services/terms-privacy.service';
Chart.register(...registerables);
Chart.register(...registerables, ChartDataLabels);


@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  resultadopregunta!: Resultadopregunta;
  userMessage = '';
  messages: { role: string; content: string }[] = [];
  evaluacionesDisponibles: Evaluacion[] = [];
  preguntasEncontradas: Pregunta[] = [];
  tituloMessage: string = '¡Bienvenido! ';
  preguntaMessagetemp: string = '';
  preguntaMessage: string = '';
  preguntaMessageenviar: string = '';
  preguntaNumeros: string = '';
  welcomeMessage: string = '¿Estás listo para comenzar con tu reforzamiento del día?';
  isDarkMode: boolean = false;
  showStartButton: boolean = true;
  showCourseButtons: boolean = false;
  showCourseButtonsb: boolean = false;
  showCourseOpciones: boolean = false;
  showCourseOpcionesImg: boolean = false;
  showYesOrNoOpciones: boolean = false;
  showYesOrNoOpciones1: boolean = false;
  showTerminarChat: boolean = false;
  showVerMiProgreso: boolean = false;
  showDetallesProgreso: boolean = false;
  showCerrarSesion: boolean = false;
  timerisactive: boolean = false;
  timerisactiver: boolean = false;
  cursoid: number = 0;
  temaid: number = 0;
  isexamen = 0;
  cursoNombre: string = '';
  showMostrarBarras: boolean = false;
  showMostrarBarrasPorCurso: boolean = false;
  resultadosPorCurso: any[] = [];
  showTimer: boolean = false;
  showPreguntaSobreGato: boolean = false;
  showChatGpt: boolean = false;
  opcionesHTML: string[] = [];
  private palabrasProhibidas: string[] = [
    'puta', 'mierda', 'estúpido', 'imbécil', 'idiota', 'perra', 'hijo de', 'maldito', 'conchudo', 'csm', 'hdp'
  ];

  corrector: string = "";

  timerMinutesr: number = 0;
  timerSecondsr: number = 0;
  tiempototalr: number = 0;
  pormate: number = 0;
  porcomu: number = 0;
  porcien: number = 0;
  private timerIntervalr: any;
  usuarioActual!: Usuario;
  timerMinutes: number = 0;
  timerSeconds: number = 0;
  tiempototal: number = 0;
  private timerInterval: any;
  opcion1: any;
  opcion2: any;
  opcion3: any;
  opcion4: any;
  imagenpregunta: any;
  isListening: boolean = false;
  respuestaCorrecta: any;
  respuestaSeleccionada: any;
  preguntaid: number = 0;
  preguntaTotales: number = 10;
  preguntaActual: number = 0;
  evaluacionidnumber: number = 0;
  gradoactual: number = 0;
  modalInicioVisible: boolean = false;
  evaluacionPendiente: { titulo: string, id: number } | null = null;
  imagenValida = true;
  modalEvaluacionIncompletaVisible: boolean = false;
  evaluacionIncompleta: { titulo: string, id: number, preguntaActual: number } | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private comunicacionService: ComunicacionService,
    private usuaoservice: UsuarioService,
    private alumnoservice: AlumnoService,
    private preguntaservice: PreguntaService,
    private evaluacionserice: EvaluacionService,
    private temaservice: TemaService,
    private resultadopreguntaservice: ResultadopreguntaService,
    private termsPrivacyService: TermsPrivacyService,
    private cdr: ChangeDetectorRef) { }


  ngOnInit(): void {
    const userId = localStorage.getItem('usuario_id');
    if (!userId) {
      this.router.navigate(['/login']);
    }

    // Verificar evaluación incompleta ANTES de cargar el usuario
    this.verificarEvaluacionIncompleta();

    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
      this.usuaoservice.getUsuario(Number(usuarioId)).subscribe(usuario => {
        this.tituloMessage = "¡Bienvenido! " + usuario.usuario;
        this.gradoactual = usuario.grado;
        this.usuarioActual = usuario;
        this.comunicacionService.toggleHome$.subscribe(() => {
          this.toggleHome();
        });
        this.comunicacionService.toggleDetalles$.subscribe(() => {
          this.toggleDetalles();
        });
        this.comunicacionService.toggleCerrarSesion$.subscribe(() => {
          this.toggleCerrarSesion();
        });

        this.speakWelcomeMessage(this.tituloMessage + this.welcomeMessage);

      });
    }

    // Cargar tema y configurar listener
    this.loadTheme();
    this.setupThemeListener();

    // Escuchar evento personalizado para mostrar progreso
    this.setupProgressListener();
  }

  verificarEvaluacionIncompleta(): void {
    const preguntasGuardadas = localStorage.getItem('preguntasEvaluacion');
    const evaluacionId = localStorage.getItem('evaluacionId');
    const preguntaActual = localStorage.getItem('preguntaActual');
    const isExamActive = localStorage.getItem('isExamActive');

    if (preguntasGuardadas && evaluacionId && preguntaActual && isExamActive === 'true') {
      // Hay una evaluación incompleta
      this.evaluacionIncompleta = {
        titulo: 'Evaluación Incompleta',
        id: Number(evaluacionId),
        preguntaActual: Number(preguntaActual)
      };
      this.modalEvaluacionIncompletaVisible = true;

      // Ocultar el botón de empezar para evitar bugs
      this.showStartButton = false;

      // Ocultar otros elementos que puedan interferir
      this.showCourseButtons = false;
      this.showCourseButtonsb = false;
    } else {
      // No hay evaluación incompleta, mostrar botón de empezar
      this.showStartButton = true;
    }
  }

  continuarEvaluacionIncompleta(): void {
    this.modalEvaluacionIncompletaVisible = false;

    if (this.evaluacionIncompleta) {
      // Ocultar el botón de empezar para evitar bugs
      this.showStartButton = false;

      // Cargar las preguntas guardadas
      const preguntasGuardadas = localStorage.getItem('preguntasEvaluacion');
      if (preguntasGuardadas) {
        this.preguntasEncontradas = JSON.parse(preguntasGuardadas);
        this.preguntaActual = this.evaluacionIncompleta.preguntaActual;
        this.evaluacionidnumber = this.evaluacionIncompleta.id;

        // Restaurar el tiempo guardado
        const tiempoTotal = localStorage.getItem('tiempoTotal');
        const timerMinutes = localStorage.getItem('timerMinutes');
        const timerSeconds = localStorage.getItem('timerSeconds');

        if (tiempoTotal) {
          this.tiempototal = Number(tiempoTotal);
        }
        if (timerMinutes) {
          this.timerMinutes = Number(timerMinutes);
        }
        if (timerSeconds) {
          this.timerSeconds = Number(timerSeconds);
        }

        // Obtener información de la evaluación
        this.evaluacionserice.getEvaluacion(this.evaluacionIncompleta.id).subscribe(evaluacion => {
          this.tituloMessage = this.cursoNombre + " - " + evaluacion.nombre;
          this.runPreguntas(evaluacion.nombre, evaluacion.id);
        });
      }
    }
  }

  cancelarEvaluacionIncompleta(): void {
    this.modalEvaluacionIncompletaVisible = false;
    // Limpiar datos de evaluación incompleta
    localStorage.removeItem('preguntasEvaluacion');
    localStorage.removeItem('evaluacionId');
    localStorage.removeItem('preguntaActual');
    localStorage.removeItem('isExamActive');
    localStorage.removeItem('isexamen');
    localStorage.removeItem('tiempoTotal');
    localStorage.removeItem('timerMinutes');
    localStorage.removeItem('timerSeconds');

    // Mostrar el botón de empezar para que pueda empezar de nuevo
    this.showStartButton = true;
  }

  MostrarEvaluaciones(cursoId: number): void {
    this.showCourseButtons = true;
    this.showCourseButtonsb = false;
    this.welcomeMessage = 'Buscando evaluaciones disponibles...';
    this.speakWelcomeMessage(this.welcomeMessage);

    if (cursoId == 1) {
      this.cursoNombre = "Matematicas";
      this.cursoid = 1;
    }
    if (cursoId == 2) {
      this.cursoNombre = "Comunicaciones";
      this.cursoid = 2;
    }
    if (cursoId == 3) {
      this.cursoNombre = "Ciencias y Tecnologia";
      this.cursoid = 3;
    }

    const hoy = new Date();

    this.temaservice.getTemas().subscribe(temas => {
      console.log("Todos los temas:", temas);
      const temasIds = temas
        .filter(t => t.cursoid === cursoId)
        .map(t => t.id); // extraemos los IDs de temas que coinciden
      console.clear();
      console.log("Temas filtrados para curso", cursoId, ":", temas.filter(t => t.cursoid === cursoId));
      console.log("IDs de temas para curso", cursoId, ":", temasIds);
      this.evaluacionserice.getEvaluacions().subscribe(evaluaciones => {
        console.log("Todas las evaluaciones:", evaluaciones);
        console.log("Temas IDs para el curso", cursoId, ":", temasIds);
        console.log("Grado actual del usuario:", this.gradoactual);
        console.log("Fecha actual:", hoy);

        this.evaluacionesDisponibles = evaluaciones.filter(e => {
          // Normalizar fechas para comparar solo la parte de fecha (sin hora)
          const inicio = new Date(e.fechainicio + 'T00:00:00');
          const fin = new Date(e.fechafin + 'T23:59:59');
          const hoyNormalizado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
          const inicioNormalizado = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
          const finNormalizado = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());

          const temaMatch = temasIds.includes(e.temaid);
          const fechaMatch = hoyNormalizado >= inicioNormalizado && hoyNormalizado <= finNormalizado;
          const gradoMatch = e.grado === this.gradoactual;

          console.log(`Evaluación ${e.id} (${e.nombre}):`, {
            temaMatch,
            fechaMatch,
            gradoMatch,
            temaId: e.temaid,
            grado: e.grado,
            fechainicio: e.fechainicio,
            fechafin: e.fechafin,
            hoyNormalizado: hoyNormalizado.toISOString().split('T')[0],
            inicioNormalizado: inicioNormalizado.toISOString().split('T')[0],
            finNormalizado: finNormalizado.toISOString().split('T')[0]
          });

          return temaMatch && fechaMatch && gradoMatch;
        });

       // this.evaluacionesDisponibles.forEach(evaluacion => {
         // this.temaservice.getTema(evaluacion.temaid).subscribe(tema => {
          //  evaluacion.nombre = tema.nombre;
         // });
       // });
        console.log("Evaluaciones disponibles encontradas:", this.evaluacionesDisponibles);
        console.log("Número de evaluaciones:", this.evaluacionesDisponibles.length);

        if (this.evaluacionesDisponibles.length > 0) {
          this.showCourseButtons = true; // mostrar el desplegable
        } else {
          this.welcomeMessage = 'No hay evaluaciones disponibles para hoy.';
          this.speakWelcomeMessage(this.welcomeMessage);
        }
      });
    });
  }


  sendMessage() {
    if (!this.userMessage.trim()) return;

    const userMsg = this.userMessage.trim();

    // Verificar palabras ofensivas
    const contieneMalaPalabra = this.palabrasProhibidas.some(palabra =>
      userMsg.toLowerCase().includes(palabra)
    );

    if (contieneMalaPalabra) {
      this.messages.push({
        role: 'assistant',
        content: '⚠️ Por favor, evita el uso de lenguaje ofensivo.'
      });
      this.userMessage = '';
      return;
    }

    // Agregar mensaje del usuario al historial
    this.messages.push({ role: 'user', content: userMsg });
    this.userMessage = '';

    // Enviar TODO el historial de mensajes
    this.http.post('https://moving-firefly-neatly.ngrok-free.app/api/chatgpt', {
      messages: this.messages
    }).subscribe(
      (response: any) => {
        const reply = response.choices[0].message.content;
        this.messages.push({ role: 'assistant', content: reply });
        this.speakWelcomeMessage(reply);
      },
      err => {
        this.messages.push({
          role: 'assistant',
          content: 'Ocurrió un error. Intenta de nuevo más tarde.'
        });
      }
    );
  }



  sendMessageIndividual(value: string) {
    console.log(value);

    const userMsg = "Le mostré esta pregunta: " + value + ', al alumno con esta imagen: ' + this.imagenpregunta +
      ', y el alumno me dio esta respuesta: ' + this.respuestaSeleccionada +
      '. Yo le di esta explicación: ' + this.preguntaMessagetemp +
      '. Pero aún así no me entendió. Necesito una explicación básica y más amplia, máximo 50 palabras y para niños de primaria.';

    // Enviar como array de mensajes
    const mensajes = [
      { role: 'user', content: userMsg }
    ];


    this.http.post('https://moving-firefly-neatly.ngrok-free.app/api/chatgpt', {
      messages: mensajes
    }).subscribe((response: any) => {
      this.preguntaMessage = response.choices[0].message.content;
      this.messages.push({ role: 'assistant', content: this.preguntaMessage });
      this.showYesOrNoOpciones1 = true;

      this.speakWelcomeMessage(this.preguntaMessage);
    });
  }

  startTimer() {
    this.showTimer = true;

    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.tiempototal++;

      if (this.timerSeconds === 60) {
        this.timerSeconds = 0;
        this.timerMinutes++;
      }

      // Guardar el tiempo en localStorage cada segundo
      localStorage.setItem('tiempoTotal', this.tiempototal.toString());
      localStorage.setItem('timerMinutes', this.timerMinutes.toString());
      localStorage.setItem('timerSeconds', this.timerSeconds.toString());
    }, 1000);
  }


  startTimerReforzamiento() {
    if (this.timerIntervalr) {
      clearInterval(this.timerIntervalr); // ✅ Detener si ya había uno activo
    }

    this.timerSecondsr = 0;
    this.timerMinutesr = 0;
    this.tiempototalr = 0;

    this.timerIntervalr = setInterval(() => {
      this.timerSecondsr++;
      this.tiempototalr++;

      if (this.timerSecondsr === 60) {
        this.timerSecondsr = 0;
        this.timerMinutesr++;
      }
    }, 1000);

    this.timerisactiver = true; // ✅ asegurar que solo está activo uno
  }


  speakWelcomeMessage(message: string) {
    const utterance = new SpeechSynthesisUtterance(message);

    const preferredVoices = [
      'Google español de Estados Unidos',
      'Google Spanish',
      'Microsoft Sabina Desktop',
      'Microsoft Helena Desktop',
      'Microsoft Eva Mobile',
      'Alex'
    ];

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();

      if (voices.length === 0) {
        setTimeout(trySpeak, 150);
        return;
      }

      const selectedVoice = voices.find(voice =>
        preferredVoices.some(name => voice.name.includes(name))
      ) || voices.find(v => v.lang.startsWith('es')) || voices[0];

      utterance.voice = selectedVoice;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Animar gato cuando hable
      const gato = document.querySelector('.robot-image');
      if (gato) gato.classList.add('speaking');

      utterance.onend = () => {
        if (gato) gato.classList.remove('speaking');
      };

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        trySpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      trySpeak();
    }
  }

  startClicked() {
    this.welcomeMessage = '¿Con qué curso deseas empezar?';
    this.showStartButton = false;
    this.showCourseButtons = false;
    this.showCourseButtonsb = true;
    this.speakWelcomeMessage(this.welcomeMessage + 'Selecciona un curso Matemáticas, Comunicación o Ciencias y Tecnologías');

  }


  startMath(event: any) {

    const evaluacionid = +event.target.value;
    this.temaid = evaluacionid;
    this.welcomeMessage = '¡Perfecto! Comenzarás en 3, 2, 1 ....';
    this.showStartButton = false;
    this.showCourseButtons = false;
    this.showCourseButtonsb = false;

    // Marcar que está en examen desde que se selecciona la evaluación
    localStorage.setItem('isExamActive', 'true');
    localStorage.setItem('isexamen', this.isexamen.toString());

    this.speakWelcomeMessage(this.welcomeMessage);
    // Espera 3 segundos (3000 milisegundos)
    setTimeout(() => {
      // Aquí va la lógica después de los 3 segundos
      //traemos evaluacione

      this.evaluacionserice.getEvaluacion(evaluacionid).subscribe(evaluacion => {
        console.log(evaluacion.nombre);
        //traemos preguntas
        this.tituloMessage = this.cursoNombre + " - " + evaluacion.nombre;
        this.evaluacionidnumber = evaluacion.id;
        this.runPreguntas(evaluacion.nombre, evaluacion.id);
      });
    }, 3500);

  }

  cargarPuntajes() {
    const hoy = new Date();
    const haceUnAno = new Date();
    haceUnAno.setFullYear(hoy.getFullYear() - 1);

    const fechainicio = haceUnAno.toISOString().split('T')[0];
    const fechafin = hoy.toISOString().split('T')[0];

    const usuarioid = this.usuarioActual.id;

    const cursos = [
      { id: 1, nombre: 'Matemáticas' },
      { id: 2, nombre: 'Comunicación' },
      { id: 3, nombre: 'Ciencia y Tecnología' }
    ];

    cursos.forEach(curso => {
      this.usuaoservice.getResultadosCurso({
        cursoid: curso.id,
        usuarioid: usuarioid,
        fechainicio: fechainicio,
        fechafin: fechafin
      }).subscribe(data => {
        let totalBuenas = 0;
        let totalPreguntas = 0;

        data.forEach(r => {
          const partes = r.respuestas_buenas_sobre_totales.split('/');
          if (partes.length === 2) {
            totalBuenas += parseInt(partes[0], 10);
            totalPreguntas += parseInt(partes[1], 10);
          }
        });

        const porcentaje = totalPreguntas > 0 ? Math.round((totalBuenas / totalPreguntas) * 100) : 0;

        switch (curso.id) {
          case 1: this.pormate = porcentaje; break;
          case 2: this.porcomu = porcentaje; break;
          case 3: this.porcien = porcentaje; break;
        }
      }, err => {
        console.error(`Error cargando resultados de ${curso.nombre}:`, err);
      });
    });
  }



  showDetalleProgreso() {
    this.cargarPuntajes();
    this.tituloMessage = "Mi Progreso";
    this.preguntaMessage = "";
    this.welcomeMessage = "¡Sigue así! Has mejorado un 75%";

    this.speakWelcomeMessage(this.welcomeMessage);

    // Ocultar botón de empezar y opciones de curso
    this.showStartButton = false;
    this.showCourseButtons = false;
    this.showCourseButtonsb = false;
    this.showCourseOpciones = false;
    this.showCourseOpcionesImg = false;
    this.preguntaNumeros = "";

    // Ocultar barras de progreso y mostrar detalles
    this.showVerMiProgreso = false;
    this.showDetallesProgreso = true;
    this.showMostrarBarras = false;
    this.showMostrarBarrasPorCurso = false;

    setTimeout(() => {
      const ctx = document.getElementById('progresoRadar') as HTMLCanvasElement;

      new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Matemática', 'Comunicación', 'Ciencias'],
          datasets: [{
            label: 'Progreso (%)',
            data: [100, 75, 50],
            backgroundColor: 'rgba(255, 215, 0, 0.4)',
            borderColor: '#ffd700',
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#ffd700',
            pointHoverRadius: 6,
            pointRadius: 5,
          }]
        },
        options: {
          responsive: true,
          layout: {
            padding: 30 // 👈 Esto reduce visualmente el tamaño del triángulo
          },
          plugins: {
            legend: {
              labels: { color: 'white' }
            },
            datalabels: {
              color: 'white',
              font: {
                weight: 'bold',
                size: 16,
              },
              formatter: function (value: number) {
                return value + '%';
              },
              anchor: 'end',
              align: 'end',
              offset: 8
            }
          },
          scales: {
            r: {
              suggestedMin: 0,
              suggestedMax: 100,
              pointLabels: {
                font: {
                  size: 14,
                  weight: 'bold',
                  family: "'Comic Sans MS', cursive"
                },
                color: 'white'
              },
              ticks: {
                backdropColor: 'transparent',
                color: 'white',
                stepSize: 20,
                display: false // opcional para ocultar las líneas de porcentaje
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.2)'
              },
              angleLines: {
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });

    }, 100);


  }

  continuarEvaluacionDesdeModal() {
    this.modalInicioVisible = false;
    clearInterval(this.timerInterval);
    this.tiempototal = 0;
    this.timerSeconds = 0;
    this.timerMinutes = 0;
    this.showTimer = false;
    this.timerisactive = false;
    this.runPreguntas(this.evaluacionPendiente!.titulo, this.evaluacionPendiente!.id);
  }

  runPreguntas(titulo: string, evaluacioid: number) {
    //aca
    this.messages = [];
    console.clear();
    console.log("el resultado", this.resultadopregunta);
    console.log("el tiempo", this.timerIntervalr);

    //aca guardamos el tiempo de reforzamiento
    if (this.resultadopregunta) {

      this.resultadopregunta.tiemporeforzamiento = this.tiempototalr;
      clearInterval(this.timerIntervalr);
      this.timerisactiver = false;

      this.resultadopreguntaservice.updateResultadopregunta(this.resultadopregunta.id, this.resultadopregunta)
        .subscribe({
          next: (response) => {
            console.log('Resultado actualizado correctamente:', response);
          },
          error: (error) => {
            console.error('Error al actualizar el resultado:', error);
          }
        });
    }


    if (this.timerisactive === false) {

      this.startTimer();
      this.timerisactive = true;
    }
    this.showPreguntaSobreGato = false;

    if (this.preguntasEncontradas.length === 0) {
      this.preguntaservice.getPreguntas().subscribe(preguntas => {
        this.preguntasEncontradas = preguntas
          .filter(u => u.evaluacionid === evaluacioid)
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);

        // Guardar las preguntas en localStorage
        localStorage.setItem('preguntasEvaluacion', JSON.stringify(this.preguntasEncontradas));
        localStorage.setItem('evaluacionId', evaluacioid.toString());
        localStorage.setItem('preguntaActual', '0'); // Iniciar en pregunta 0
        localStorage.setItem('tiempoTotal', '0'); // Iniciar tiempo en 0
        localStorage.setItem('timerMinutes', '0');
        localStorage.setItem('timerSeconds', '0');

        this.runPreguntas(titulo, evaluacioid);
      });
      return;
    }

    // Mostrar modal en la pregunta 6
    if (this.preguntaActual === 5 && this.evaluacionPendiente == null) { // índice 5 = sexta pregunta
      this.modalInicioVisible = true;
      this.evaluacionPendiente = { titulo, id: evaluacioid };
      clearInterval(this.timerInterval); // detener timer
      this.showTimer = false;

      this.isexamen = 1;

      // Que el robot diga el mensaje del modal
      this.speakWelcomeMessage("¿Estás listo para continuar con las siguientes preguntas?");
      return;
    }

    if (this.preguntaActual === this.preguntaTotales) {
      // finalizar evaluación
      this.tituloMessage = "¡Refuerzo Completado! ";
      this.preguntaMessage = "";
      const minutos = Math.floor(this.tiempototal / 60);
      const segundos = this.tiempototal % 60;
      const tiempoFormateado = `${minutos} minutos y ${segundos < 10 ? '0' : ''}${segundos}`;
      this.welcomeMessage = "¡Felicitaciones! Has logrado completar el tema del día de hoy en " + this.tiempototal + " segundos";
      this.speakWelcomeMessage(this.welcomeMessage);

      // Limpiar estado de examen y preguntas del localStorage
      localStorage.removeItem('isExamActive');
      localStorage.removeItem('isexamen');
      localStorage.removeItem('preguntasEvaluacion');
      localStorage.removeItem('evaluacionId');
      localStorage.removeItem('preguntaActual');
      localStorage.removeItem('tiempoTotal');
      localStorage.removeItem('timerMinutes');
      localStorage.removeItem('timerSeconds');

      this.showCourseOpciones = false;
      this.showCourseOpcionesImg = false;
      this.preguntaNumeros = "";
      this.showVerMiProgreso = true;
      this.preguntaActual = 0;
      this.preguntasEncontradas = [];
      this.showStartButton = false;
      this.showCourseButtons = false;
      this.showCourseButtonsb = false;
      this.showYesOrNoOpciones = false;
      this.showYesOrNoOpciones1 = false;
      this.showTerminarChat = false;
      this.showDetallesProgreso = false;
      this.showChatGpt = false;
      clearInterval(this.timerInterval);
      this.showTimer = false;
      this.timerisactive = false;
      return;
    }

    // Continuar mostrando pregunta
    const pregunta = this.preguntasEncontradas[this.preguntaActual];
    this.respuestaCorrecta = pregunta.opcion1;
    this.preguntaid = pregunta.id;
    this.welcomeMessage = "";
    this.preguntaMessage = pregunta.descripcion;
    this.preguntaMessageenviar = pregunta.descripcion;
    this.imagenpregunta = pregunta.imagen;
    this.opcion1 = pregunta.opcion1;
    this.opcion2 = pregunta.opcion2;
    this.opcion3 = pregunta.opcion3;
    this.opcion4 = pregunta.opcion4;
    this.opcionesHTML = [this.opcion1, this.opcion2, this.opcion3, this.opcion4].sort(() => Math.random() - 0.5);
    this.showCourseOpciones = true;
    this.showCourseOpcionesImg = true;
    this.showYesOrNoOpciones = false;
    this.showStartButton = false;
    this.showCourseButtons = false;
    this.showCourseButtonsb = false;
    this.showYesOrNoOpciones1 = false;
    this.showTerminarChat = false;
    this.showDetallesProgreso = false;
    this.showChatGpt = false;
    this.showTimer = true;

    if (this.preguntaActual < 5) {
      this.preguntaNumeros = "Pregunta " + (this.preguntaActual + 1) + " de 5";
    } else {
      this.preguntaNumeros = "Pregunta " + (this.preguntaActual - 4) + " de 5";
    }
    this.preguntaMessagetemp = pregunta.respuesta;

    this.speakWelcomeMessage(this.preguntaMessage);
  }



  selectRespuesta(respuesta: any) {

    this.respuestaSeleccionada = respuesta;
    if (this.respuestaCorrecta == respuesta || this.preguntaActual > 4) {
      //PASAMOS A LA SIGUIENTE PREGUNTA
      if (this.respuestaCorrecta != respuesta) {
        this.corrector = "incorrecta";
      } else {
        this.corrector = "correcta";
      }
      const alumno_id = localStorage.getItem('usuario_id');
      this.resultadopregunta = {
        id: 0,
        alumnoid: Number(alumno_id),
        preguntaid: this.preguntaid,
        cursoid: this.cursoid,
        institucionid: 1,
        temaid: 1,
        tiempo: this.tiempototal,
        respuesta: this.corrector,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_actived: 1,
        is_deleted: 0,
        tiemporeforzamiento: 0,
        isexamen: this.isexamen,
      };

      this.resultadopreguntaservice.createResultadopregunta(this.resultadopregunta)
        .subscribe({
          next: (res) => {
            console.log('Registro exitoso', res);
            this.resultadopregunta = res;
          },
          error: (err) => {
            console.error('Error al registrar resultado', err);
          }
        });

      this.preguntaActual++;
      // Guardar la pregunta actual en localStorage
      localStorage.setItem('preguntaActual', this.preguntaActual.toString());
      this.runPreguntas("MATEMATICAS - CONJUNTOS", this.evaluacionidnumber);
    } else {

      clearInterval(this.timerInterval);
      this.showTimer = false;
      this.timerisactive = false;

      if (this.timerisactiver == false) {

        this.startTimerReforzamiento();
        this.timerisactiver = true;
      }

      const alumno_id = localStorage.getItem('usuario_id');
      this.resultadopregunta = {
        id: 0,
        alumnoid: Number(alumno_id),
        preguntaid: this.preguntaid,
        cursoid: 1,
        institucionid: 1,
        temaid: 1,
        tiempo: this.tiempototal,
        respuesta: "incorrecta",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_actived: 1,
        is_deleted: 0,
        tiemporeforzamiento: 0,
        isexamen: this.isexamen,
      };

      this.resultadopreguntaservice.createResultadopregunta(this.resultadopregunta)
        .subscribe({
          next: (res) => {
            console.log('Registro exitoso', res);
            this.resultadopregunta = res;
          },
          error: (err) => {
            console.error('Error al registrar resultado', err);
          }
        });
      this.showCourseOpciones = false;
      this.showCourseOpcionesImg = false;
      this.showPreguntaSobreGato = true;
      this.showChatGpt = false;
      this.preguntaMessage = this.preguntaMessagetemp;

      this.speakWelcomeMessage(this.preguntaMessage);
      this.showYesOrNoOpciones = true;

      this.showYesOrNoOpciones1 = false;
      this.preguntaNumeros = "";


    }

  }

  preguntargpt() {
    this.showYesOrNoOpciones = false;
    this.preguntaMessage = "Consultando pregunta con la IA ......."

    this.sendMessageIndividual(this.preguntaMessageenviar);

  }

  iniciarChatGpt() {
    this.preguntaMessage = "Detallame más tu duda o problema:";
    this.showYesOrNoOpciones = false;
    this.showYesOrNoOpciones1 = false;
    this.showTerminarChat = true;
    this.showChatGpt = true;


  }




  generarRespuestaSimulada(mensaje: string): string {
    // Aquí puedes personalizar más respuestas simuladas
    if (mensaje.includes('conjunto')) {
      return 'Un conjunto es una colección de elementos con propiedades similares. ¿Te gustaría un ejemplo visual?';
    } else if (mensaje.includes('no entiendo')) {
      return 'No te preocupes, puedo explicarlo de otra manera. ¿Qué parte no te quedó clara?';
    } else {
      return '¡Gracias por tu pregunta! Estoy aquí para ayudarte con lo que necesites.';
    }
  }

  toggleDetalles() {

    this.cargarPuntajes();
    this.tituloMessage = "Mi Progreso";
    this.welcomeMessage = "";
    this.preguntaMessage = "";
    this.showMostrarBarras = true;
    this.showDetallesProgreso = false;
    this.showMostrarBarrasPorCurso = false;
    this.showStartButton = false;
    this.showCerrarSesion = false;
    this.showCourseOpciones = false;
    this.showCourseOpcionesImg = false;
    this.showStartButton = false;
    this.showCourseButtons = false;
    this.showCourseButtonsb = false;
    this.showYesOrNoOpciones = false;
    this.showYesOrNoOpciones1 = false;
    this.showTerminarChat = false;
    this.preguntaNumeros = "";
    this.showDetallesProgreso = false;
    this.showChatGpt = false;
    this.showPreguntaSobreGato = false;
    //detener el timer
    clearInterval(this.timerInterval);
    this.showTimer = false;
    this.timerisactive = false;

  }


  verMasDetallesPorCurso(curso: number) {
    const hoy = new Date();
    const haceUnAno = new Date();
    haceUnAno.setFullYear(hoy.getFullYear() - 1);

    const fechainicio = haceUnAno.toISOString().split('T')[0];
    const fechafin = hoy.toISOString().split('T')[0];
    const usuarioid = this.usuarioActual.id;

    const params = {
      cursoid: curso,
      usuarioid: usuarioid,
      fechainicio: fechainicio,
      fechafin: fechafin
    };

    this.usuaoservice.getResultadosCurso(params).subscribe((resultados) => {
      this.resultadosPorCurso = resultados.map(r => {
        const partes = r.respuestas_buenas_sobre_totales.split('/');
        const buenas = parseInt(partes[0], 10);
        const totales = parseInt(partes[1], 10);
        const porcentaje = Math.round((buenas / totales) * 100);

        return {
          ...r,          // mantiene tema, evaluacion, total_tiempo
          buenas,
          totales,
          porcentaje
        };
      });

      console.log(this.resultadosPorCurso);

      this.showMostrarBarrasPorCurso = true;
      this.showMostrarBarras = false;
      this.showDetallesProgreso = false;
      this.showPreguntaSobreGato = false;
    });
  }


  toggleHome() {
    // Limpiar estado de examen y preguntas antes de recargar
    localStorage.removeItem('isExamActive');
    localStorage.removeItem('isexamen');
    localStorage.removeItem('preguntasEvaluacion');
    localStorage.removeItem('evaluacionId');
    localStorage.removeItem('preguntaActual');
    localStorage.removeItem('tiempoTotal');
    localStorage.removeItem('timerMinutes');
    localStorage.removeItem('timerSeconds');
    window.location.reload();
  }

  toggleCerrarSesion() {
    this.tituloMessage = "HASTA PRONTO";
    this.welcomeMessage = "Fue un gusto haberte ayudado el día de hoy";

    this.speakWelcomeMessage(this.welcomeMessage);
    this.preguntaMessage = "¿Estás seguro de querer cerrar tu sesión?";

    this.showCerrarSesion = true;
    this.showStartButton = false;
    this.showCourseButtons = false;
    this.showCourseButtonsb = false;
    this.showCourseOpciones = false;
    this.showCourseOpcionesImg = false;
    this.showYesOrNoOpciones = false;
    this.showYesOrNoOpciones1 = false;
    this.showPreguntaSobreGato = false;
    this.showTerminarChat = false;
    this.showVerMiProgreso = false;
    this.showDetallesProgreso = false;

    this.showMostrarBarras = false;
    this.showMostrarBarrasPorCurso = false;
    this.showTimer = false;
    this.showChatGpt = false;


  }



  cerrar() {
    // Aquí puedes validar usuario/contraseña si lo deseas
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('isExamActive');
    localStorage.removeItem('isexamen');
    localStorage.removeItem('preguntasEvaluacion');
    localStorage.removeItem('evaluacionId');
    localStorage.removeItem('preguntaActual');
    localStorage.removeItem('tiempoTotal');
    localStorage.removeItem('timerMinutes');
    localStorage.removeItem('timerSeconds');

    // Limpiar términos y condiciones para el próximo login
    this.termsPrivacyService.clearTermsForNextLogin();

    this.router.navigate(['/login']);
  }


  selectCourse(course: string) {
    alert(`Has seleccionado el curso: ${course}`);
  }

  startListening() {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    this.isListening = true; // 🔒 Desactivar botón

    recognition.onstart = () => {
      console.log('🎙️ Escuchando...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.userMessage = transcript;
      this.cdr.detectChanges(); // 🔁 Forzar que el input se actualice
      console.log('Transcripción:', transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Error en reconocimiento de voz:', event.error);
      alert('Hubo un error al usar el micrófono. Intenta nuevamente.');
      this.isListening = false; // 🔓 Reactivar si hubo error
      this.cdr.detectChanges();
    };

    recognition.onend = () => {
      this.isListening = false; // 🔓 Reactivar al terminar
      this.cdr.detectChanges();
    };

    recognition.start();
  }

  // Métodos de tema
  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
  }

  private setupThemeListener(): void {
    window.addEventListener('storage', () => {
      this.loadTheme();
    });
    setInterval(() => {
      const currentTheme = localStorage.getItem('theme');
      const shouldBeDark = currentTheme === 'dark';
      if (this.isDarkMode !== shouldBeDark) {
        this.loadTheme();
      }
    }, 100);
  }

  private setupProgressListener(): void {
    // Escuchar cambios en el hash para activar progreso
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#progress') {
        console.log('Hash progress detectado, mostrando progreso...');
        setTimeout(() => {
          this.showDetalleProgreso();
        }, 100);
        // Limpiar el hash
        window.location.hash = '';
      }
    });

    // Verificar hash inicial
    if (window.location.hash === '#progress') {
      console.log('Hash progress inicial detectado, mostrando progreso...');
      setTimeout(() => {
        this.showDetalleProgreso();
      }, 100);
      // Limpiar el hash
      window.location.hash = '';
    }
  }

}
