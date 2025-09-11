import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StateService } from '../../services/state.service';
import { SpeechService } from '../../services/speech.service';
import { EvaluationService } from '../../services/evaluation.service';
import { QuestionService } from '../../services/question.service';
import { ProgressService } from '../../services/progress.service';
import { ChatGptService } from '../../services/chat-gpt.service';
import { UsuarioService } from '../../services/usuario.service';
import { TemaService } from '../../services/tema.service';
import { RobotComponent } from '../robot/robot.component';
import { CourseSelectorComponent } from '../course-selector/course-selector.component';
import { QuestionComponent } from '../question/question.component';
import { ProgressComponent } from '../progress/progress.component';
import { ChatGptComponent } from '../chat-gpt/chat-gpt.component';

@Component({
  selector: 'app-home-refactored',
  templateUrl: './home-refactored.component.html',
  styleUrls: ['./home-refactored.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RobotComponent,
    CourseSelectorComponent,
    QuestionComponent,
    ProgressComponent,
    ChatGptComponent
  ]
})
export class HomeRefactoredComponent implements OnInit, OnDestroy {
  // Estado del componente
  tituloMessage: string = '¡Bienvenido!';
  welcomeMessage: string = '¿Estás listo para comenzar con tu reforzamiento del día?';
  isDarkMode: boolean = false;
  private themeListener?: () => void;
  preguntaMessage: string = '';
  preguntaMessageenviar: string = '';
  preguntaNumeros: string = '';
  cursoNombre: string = '';
  evaluacionesDisponibles: any[] = [];
  preguntasEncontradas: any[] = [];
  preguntaActual: number = 0;
  preguntaTotales: number = 10;
  evaluacionidnumber: number = 0;
  gradoactual: number = 0;
  imagenpregunta: any;
  imagenValida: boolean = true;
  respuestaCorrecta: any;
  respuestaSeleccionada: any;
  preguntaid: number = 0;
  cursoid: number = 0;
  temaid: number = 0;
  isexamen: number = 0;
  resultadopregunta: any;
  messages: { role: string; content: string }[] = [];
  userMessage: string = '';
  isListening: boolean = false;
  modalInicioVisible: boolean = false;
  evaluacionPendiente: { titulo: string, id: number } | null = null;

  // Timers
  private timerInterval: any;
  private timerIntervalr: any;
  timerMinutes: number = 0;
  timerSeconds: number = 0;
  tiempototal: number = 0;
  timerMinutesr: number = 0;
  timerSecondsr: number = 0;
  tiempototalr: number = 0;
  timerisactive: boolean = false;
  timerisactiver: boolean = false;

  // Progreso
  pormate: number = 0;
  porcomu: number = 0;
  porcien: number = 0;
  resultadosPorCurso: any[] = [];

  constructor(
    private router: Router,
    public stateService: StateService,
    private speechService: SpeechService,
    private evaluationService: EvaluationService,
    private questionService: QuestionService,
    private progressService: ProgressService,
    private chatGptService: ChatGptService,
    private usuarioService: UsuarioService,
    private temaService: TemaService
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.subscribeToState();
    this.loadTheme();
    this.setupThemeListener();
  }

  ngOnDestroy(): void {
    this.clearTimers();
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

  private initializeUser(): void {
    const userId = localStorage.getItem('usuario_id');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuarioService.getUsuario(Number(userId)).subscribe(usuario => {
      this.tituloMessage = "¡Bienvenido! " + usuario.usuario;
      this.gradoactual = usuario.grado;
      this.stateService.setCurrentUser(usuario);
      this.speakWelcomeMessage(this.tituloMessage + this.welcomeMessage);
    });
  }

  private subscribeToState(): void {
    this.stateService.state$.subscribe(state => {
      // Actualizar propiedades del componente basadas en el estado
      this.updateComponentFromState(state);
    });
  }

  private updateComponentFromState(state: any): void {
    // Implementar actualizaciones basadas en el estado
  }

  // Métodos de navegación
  startClicked(): void {
    this.welcomeMessage = '¿Con qué curso deseas empezar?';
    this.stateService.updateUI({
      showStartButton: false,
      showCourseButtons: true,
      showEvaluations: false
    });
    this.speakWelcomeMessage(this.welcomeMessage + 'Selecciona un curso Matemáticas, Comunicación o Ciencias y Tecnologías');
  }

  onCourseSelected(courseId: number): void {
    this.stateService.updateUI({
      showCourseButtons: false,
      showEvaluations: true
    });
    this.MostrarEvaluaciones(courseId);
  }

  onEvaluationSelected(evaluationId: number): void {
    this.startMath({ target: { value: evaluationId } });
  }

  onGoBack(): void {
    this.stateService.updateUI({
      showCourseButtons: true,
      showEvaluations: false
    });
  }

  // Métodos de evaluación
  MostrarEvaluaciones(cursoId: number): void {
    this.welcomeMessage = 'Buscando evaluaciones disponibles...';
    this.speakWelcomeMessage(this.welcomeMessage);

    const cursoNombres = { 1: "Matematicas", 2: "Comunicaciones", 3: "Ciencias y Tecnologia" };
    this.cursoNombre = cursoNombres[cursoId as keyof typeof cursoNombres];
    this.cursoid = cursoId;

    const hoy = new Date();

    // Primero obtener los temas del curso
    this.temaService.getTemas().subscribe(temas => {
      const temasIds = temas
        .filter(t => t.cursoid === cursoId)
        .map(t => t.id);

      console.log('Temas IDs para curso', cursoId, ':', temasIds);

      // Luego obtener las evaluaciones filtradas por temas
      this.evaluationService.getEvaluacions().subscribe((evaluaciones: any[]) => {
        this.evaluacionesDisponibles = evaluaciones.filter((e: any) => {
          const inicio = new Date(e.fechainicio);
          const fin = new Date(e.fechafin);
          return temasIds.includes(e.temaid) &&
                 hoy >= inicio && hoy <= fin &&
                 e.grado === this.gradoactual;
        });

        console.log('Evaluaciones disponibles:', this.evaluacionesDisponibles);

        if (this.evaluacionesDisponibles.length > 0) {
          this.stateService.updateUI({ showEvaluations: true });
        } else {
          this.welcomeMessage = 'No hay evaluaciones disponibles para hoy.';
          this.speakWelcomeMessage(this.welcomeMessage);
        }
      });
    });
  }

  startMath(event: any): void {
    const evaluacionid = +event.target.value;
    this.temaid = evaluacionid;
    this.welcomeMessage = '¡Perfecto! Comenzarás en 3, 2, 1 ....';
    this.stateService.updateUI({
      showStartButton: false,
      showCourseButtons: false,
      showEvaluations: false
    });
    this.speakWelcomeMessage(this.welcomeMessage);

    setTimeout(() => {
      this.evaluationService.getEvaluacion(evaluacionid).subscribe((evaluacion: any) => {
        this.tituloMessage = this.cursoNombre + " - " + evaluacion.nombre;
        this.evaluacionidnumber = evaluacion.id;
        this.stateService.setCurrentEvaluation(evaluacion);
        this.runPreguntas(evaluacion.nombre, evaluacion.id);
      });
    }, 3500);
  }

  // Métodos de preguntas
  runPreguntas(titulo: string, evaluacioid: number): void {
    this.messages = [];

    if (this.resultadopregunta) {
      this.resultadopregunta.tiemporeforzamiento = this.tiempototalr;
      this.clearTimer('refuerzo');
      this.timerisactiver = false;
      // Actualizar resultado en base de datos
    }

    if (!this.timerisactive) {
      this.startTimer();
      this.timerisactive = true;
    }

    this.stateService.updateUI({ showQuestion: false });

    if (this.preguntasEncontradas.length === 0) {
      this.questionService.getPreguntas().subscribe((preguntas: any[]) => {
        this.preguntasEncontradas = preguntas
          .filter((u: any) => u.evaluacionid === evaluacioid)
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);
        this.runPreguntas(titulo, evaluacioid);
      });
      return;
    }

    // Mostrar modal en la pregunta 6
    if (this.preguntaActual === 5 && !this.evaluacionPendiente) {
      this.modalInicioVisible = true;
      this.evaluacionPendiente = { titulo, id: evaluacioid };
      this.clearTimer('principal');
      this.stateService.updateUI({ showQuestion: false });
      this.isexamen = 1;
      this.speakWelcomeMessage("¿Estás listo para continuar con las siguientes preguntas?");
      return;
    }

    if (this.preguntaActual === this.preguntaTotales) {
      this.finalizarEvaluacion();
      return;
    }

    this.mostrarPregunta();
  }

  private mostrarPregunta(): void {
    const pregunta = this.preguntasEncontradas[this.preguntaActual];
    this.respuestaCorrecta = pregunta.opcion1;
    this.preguntaid = pregunta.id;
    this.welcomeMessage = "";
    this.preguntaMessage = pregunta.descripcion;
    this.preguntaMessageenviar = pregunta.descripcion;
    this.imagenpregunta = pregunta.imagen;
    this.stateService.setCurrentQuestion(pregunta);

    this.stateService.updateUI({
      showQuestion: true,
      showStartButton: false,
      showCourseButtons: false,
      showEvaluations: false
    });

    if (this.preguntaActual < 5) {
      this.preguntaNumeros = "Pregunta " + (this.preguntaActual + 1) + " de 5";
    } else {
      this.preguntaNumeros = "Pregunta " + (this.preguntaActual - 4) + " de 5";
    }

    this.speakWelcomeMessage(this.preguntaMessage);
  }

  onAnswerSelected(answer: string): void {
    this.respuestaSeleccionada = answer;

    if (this.respuestaCorrecta === answer || this.preguntaActual > 4) {
      this.procesarRespuestaCorrecta();
    } else {
      this.procesarRespuestaIncorrecta();
    }
  }

  private procesarRespuestaCorrecta(): void {
    const corrector = this.respuestaCorrecta === this.respuestaSeleccionada ? "correcta" : "incorrecta";
    this.guardarResultado(corrector);
    this.preguntaActual++;
    this.runPreguntas("MATEMATICAS - CONJUNTOS", this.evaluacionidnumber);
  }

  private procesarRespuestaIncorrecta(): void {
    this.clearTimer('principal');
    this.stateService.updateUI({ showQuestion: false });

    if (!this.timerisactiver) {
      this.startTimerReforzamiento();
      this.timerisactiver = true;
    }

    this.guardarResultado("incorrecta");
    this.stateService.updateUI({ showQuestion: true });
    this.preguntaMessage = this.stateService.getCurrentQuestion()?.respuesta;
    this.speakWelcomeMessage(this.preguntaMessage);
  }

  private guardarResultado(respuesta: string): void {
    const alumno_id = localStorage.getItem('usuario_id');
    this.resultadopregunta = {
      id: 0,
      alumnoid: Number(alumno_id),
      preguntaid: this.preguntaid,
      cursoid: this.cursoid,
      institucionid: 1,
      temaid: 1,
      tiempo: this.tiempototal,
      respuesta: respuesta,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_actived: 1,
      is_deleted: 0,
      tiemporeforzamiento: 0,
      isexamen: this.isexamen,
    };

    // Guardar en base de datos
    // this.resultadopreguntaservice.createResultadopregunta(this.resultadopregunta).subscribe(...)
  }

  private finalizarEvaluacion(): void {
    this.tituloMessage = "¡Refuerzo Completado! ";
    this.preguntaMessage = "";
    const minutos = Math.floor(this.tiempototal / 60);
    const segundos = this.tiempototal % 60;
    this.welcomeMessage = "¡Felicitaciones! Has logrado completar el tema del día de hoy en " + this.tiempototal + " segundos";
    this.speakWelcomeMessage(this.welcomeMessage);

    this.stateService.updateUI({
      showQuestion: false,
      showStartButton: false,
      showCourseButtons: false,
      showEvaluations: false,
      showProgress: true
    });

    this.preguntaActual = 0;
    this.preguntasEncontradas = [];
    this.clearTimer('principal');
    this.timerisactive = false;
  }

  // Métodos de timer
  startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.tiempototal++;

      if (this.timerSeconds === 60) {
        this.timerSeconds = 0;
        this.timerMinutes++;
      }
    }, 1000);
  }

  startTimerReforzamiento(): void {
    if (this.timerIntervalr) {
      clearInterval(this.timerIntervalr);
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

    this.timerisactiver = true;
  }

  private clearTimer(type: 'principal' | 'refuerzo'): void {
    if (type === 'principal' && this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (type === 'refuerzo' && this.timerIntervalr) {
      clearInterval(this.timerIntervalr);
      this.timerIntervalr = null;
    }
  }

  private clearTimers(): void {
    this.clearTimer('principal');
    this.clearTimer('refuerzo');
  }

  // Métodos de ChatGPT
  onMessageSent(message: string): void {
    this.messages.push({ role: 'user', content: message });
    this.userMessage = '';

    this.chatGptService.sendMessage(this.messages).subscribe(
      (response: any) => {
        const reply = response.choices[0].message.content;
        this.messages.push({ role: 'assistant', content: reply });
        this.speakWelcomeMessage(reply);
      },
      (err: any) => {
        this.messages.push({
          role: 'assistant',
          content: 'Ocurrió un error. Intenta de nuevo más tarde.'
        });
      }
    );
  }

  onStartListening(): void {
    this.isListening = true;
    this.speechService.startListening().then(transcript => {
      this.userMessage = transcript;
      this.isListening = false;
    }).catch(error => {
      console.error('Error en reconocimiento de voz:', error);
      this.isListening = false;
    });
  }

  onCloseChat(): void {
    this.stateService.updateUI({ showChat: false });
  }

  // Métodos de progreso
  onViewMoreDetails(courseId: number): void {
    // Implementar lógica de detalles por curso
  }

  onGoHome(): void {
    window.location.reload();
  }

  // Métodos de utilidad
  speakWelcomeMessage(message: string): void {
    this.speechService.speak(message);
  }

  onImageError(): void {
    this.imagenValida = false;
  }

  continuarEvaluacionDesdeModal(): void {
    this.modalInicioVisible = false;
    this.clearTimer('principal');
    this.tiempototal = 0;
    this.timerSeconds = 0;
    this.timerMinutes = 0;
    this.timerisactive = false;
    this.runPreguntas(this.evaluacionPendiente!.titulo, this.evaluacionPendiente!.id);
  }

  // Métodos adicionales necesarios
  preguntargpt(): void {
    this.stateService.updateUI({ showChat: true });
  }

  showDetalleProgreso(): void {
    this.stateService.updateUI({
      showProgress: true,
      showBars: true
    });
  }

  toggleHome(): void {
    window.location.reload();
  }

  onSpeakComplete(): void {
    // Manejar cuando termina de hablar el robot
  }

  // Métodos para manejar eventos del template
  onStartMath(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.startMath({ target: { value: target.value } });
  }

  onSelectAnswer(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectRespuesta(target.value);
  }

  selectRespuesta(respuesta: string): void {
    // Implementar lógica de selección de respuesta
    console.log('Respuesta seleccionada:', respuesta);
  }

  onEvaluationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.startMath({ target: { value: target.value } });
  }

  onQuestionImageError(): void {
    this.onImageError();
  }
}
