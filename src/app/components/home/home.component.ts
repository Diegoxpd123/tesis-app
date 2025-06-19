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

  cursoNombre: string = '';
  showMostrarBarras: boolean = false;
  showMostrarBarrasPorCurso: boolean = false;

  showTimer: boolean = false;
  showPreguntaSobreGato: boolean = false;
  showChatGpt: boolean = false;
  opcionesHTML: string[] = [];
  private palabrasProhibidas: string[] = [
    'puta', 'mierda', 'estúpido', 'imbécil', 'idiota', 'perra', 'hijo de', 'maldito', 'conchudo', 'csm', 'hdp'
  ];



  timerMinutesr: number = 0;
  timerSecondsr: number = 0;
  tiempototalr: number = 0;
  private timerIntervalr: any;

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
    private cdr: ChangeDetectorRef) { }


  ngOnInit(): void {
    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
      this.usuaoservice.getUsuario(Number(usuarioId)).subscribe(usuario => {
        this.tituloMessage = "¡Bienvenido! " + usuario.usuario;
        this.gradoactual = usuario.grado;
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
  }

  MostrarEvaluaciones(cursoId: number): void {
    this.showCourseButtons = true;
    this.showCourseButtonsb = false;
    this.welcomeMessage = 'Buscando evaluaciones disponibles...';
    this.speakWelcomeMessage(this.welcomeMessage);

    if (cursoId == 1) {
      this.cursoNombre = "Matematicas";
    }
    if (cursoId == 2) {
      this.cursoNombre = "Comunicaciones";
    }
    if (cursoId == 3) {
      this.cursoNombre = "Ciencias y Tecnologia";
    }

    const hoy = new Date();

    this.temaservice.getTemas().subscribe(temas => {
      const temasIds = temas
        .filter(t => t.cursoid === cursoId  )
        .map(t => t.id); // extraemos los IDs de temas que coinciden
      console.clear();
      console.log(temasIds);
      this.evaluacionserice.getEvaluacions().subscribe(evaluaciones => {
        this.evaluacionesDisponibles = evaluaciones.filter(e => {
          const inicio = new Date(e.fechainicio);
          const fin = new Date(e.fechafin);
          return temasIds.includes(e.temaid) &&
            hoy >= inicio && hoy <= fin && e.grado === this.gradoactual;
        });

        if (this.evaluacionesDisponibles.length > 0) {
          this.showCourseOpciones = true; // mostrar el desplegable
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

    // Verificar si contiene palabras prohibidas
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

    this.messages.push({ role: 'user', content: userMsg });
    this.userMessage = '';

    this.http.post('https://moving-firefly-neatly.ngrok-free.app/api/chatgpt', {
      messages: userMsg
    }).subscribe(
      (response: any) => {
        const reply = response.choices[0].message.content;
        this.messages.push({ role: 'assistant', content: reply });
      this.speakWelcomeMessage(reply);
      },
      err => {
        this.messages.push({ role: 'assistant', content: 'Ocurrió un error. Intenta de nuevo más tarde.' });
      }
    );
  }


  sendMessageIndividual(value: string) {
    console.log(value);
    const userMsg = "Le mostre esta pregunta " + value + 'al alumno con esta imagen ' + this.imagenpregunta + 'y el alumno me dio esta esta respuesta' + this.respuestaSeleccionada + 'y yo le di esta explicación' + this.preguntaMessagetemp + 'pero aun asi no me entendio. Necesito una explicación  básica y mas amplia. maximo 50 palabras';
    //this.messages.push({ role: 'user', content: userMsg });
    this.userMessage = '';

    this.http.post('https://moving-firefly-neatly.ngrok-free.app/api/chatgpt', {
      messages: userMsg
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
    this.welcomeMessage = '¡Perfecto! Comenzarás en 3, 2, 1 ....';
    this.showStartButton = false;
    this.showCourseButtons = false;
    this.showCourseButtonsb = false;
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

  showDetalleProgreso() {

    this.tituloMessage = "Mi Progreso";
    this.preguntaMessage = "";
    this.welcomeMessage = "¡Sigue así! Has mejorado un 75%";

    this.speakWelcomeMessage(this.welcomeMessage);
    this.showCourseOpciones = false;
    this.showCourseOpcionesImg = false;
    this.preguntaNumeros = "";
    this.showVerMiProgreso = false;
    this.showDetallesProgreso = true;

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
    this.runPreguntas(this.evaluacionPendiente!.titulo, this.evaluacionPendiente!.id);
  }

  runPreguntas(titulo: string, evaluacioid: number) {
//aca
this.messages=[];
console.clear();
console.log("el resultado", this.resultadopregunta);
console.log("el tiempo", this.timerIntervalr);
if (this.resultadopregunta ) {

  this.resultadopregunta.tiemporeforzamiento = this.tiempototalr;
   clearInterval(this.timerIntervalr);
    this.timerisactiver = false;

  this.resultadopreguntaservice.updateResultadopregunta(this.resultadopregunta.id,this.resultadopregunta)
    .subscribe({
      next: (response) => {
        console.log('Resultado actualizado correctamente:', response);
      },
      error: (error) => {
        console.error('Error al actualizar el resultado:', error);
      }
    });
}


    if (this.timerisactive == false) {

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

      // Que el robot diga el mensaje del modal
      this.speakWelcomeMessage("¿Estás listo para continuar con las siguientes preguntas?");
      return;
    }

    if (this.preguntaActual === this.preguntaTotales) {
      // finalizar evaluación
      this.tituloMessage = "¡Refuerzo Completado! ";
      this.preguntaMessage = "";
      this.welcomeMessage = "¡Felicitaciones! Has logrado completar el tema del día de hoy en " + this.tiempototal + " segundos";
      this.speakWelcomeMessage(this.welcomeMessage);
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
    clearInterval(this.timerInterval); // detener timer
     this.startTimer();
      this.timerisactive = true;
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
    this.opcionesHTML = [this.opcion1, this.opcion2, this.opcion3, this.opcion4];
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
    if (this.respuestaCorrecta == respuesta ||  this.preguntaActual >  4) {
      //PASAMOS A LA SIGUIENTE PREGUNTA

      const alumno_id = localStorage.getItem('usuario_id');
      this.resultadopregunta = {
        id: 0,
        alumnoid: Number(alumno_id),
        preguntaid: this.preguntaid,
        cursoid: 1,
        institucionid: 1,
        temaid: 1,
        tiempo: this.tiempototal,
        respuesta: "correcta",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_actived: 1,
        is_deleted: 0,
        tiemporeforzamiento: 0
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
        tiemporeforzamiento: 0
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


  verMasDetallesPorCurso(curso: string) {
    this.tituloMessage = curso;
    this.welcomeMessage = "";
    this.showMostrarBarras = false;
    this.showDetallesProgreso = false;
    this.showMostrarBarrasPorCurso = true;
    this.showPreguntaSobreGato = false;
  }


  toggleHome() {
    clearInterval(this.timerInterval);
    this.timerisactive = false;
    clearInterval(this.timerIntervalr);
    this.timerisactiver = false;
    this.modalInicioVisible = false;
    this.evaluacionPendiente = null;
    this.opcionesHTML = [];

    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
      this.usuaoservice.getUsuario(Number(usuarioId)).subscribe(usuario => {
        this.tituloMessage = "¡Bienvenido! " + usuario.usuario;
        this.welcomeMessage = "¿Estás listo para comenzar con tu reforzamiento del día?";

        this.preguntaMessage = "";
        this.showStartButton = true;
        this.showCourseButtons = false;
        this.showCourseButtonsb = false;
        this.showCourseOpciones = false;
        this.showCourseOpcionesImg = false;
        this.showYesOrNoOpciones = false;
        this.showYesOrNoOpciones1 = false;
        this.showTerminarChat = false;
        this.showVerMiProgreso = false;
        this.showDetallesProgreso = false;
        this.showPreguntaSobreGato = false;
        this.showCourseOpciones = false;

        this.showMostrarBarras = false;
        this.showMostrarBarrasPorCurso = false;
        this.showCerrarSesion = false;
        this.showTimer = false;
        this.showChatGpt = false;
      });
    }
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





}
