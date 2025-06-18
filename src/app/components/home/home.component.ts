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

  tituloMessage: string = '¡Bienvenido! ';
  preguntaMessagetemp: string = '';
  preguntaMessage: string = '';
  preguntaMessageenviar: string = '';
  preguntaNumeros: string = '';
  welcomeMessage: string = '¿Estás listo para comenzar con tu reforzamiento del día?';
  showStartButton: boolean = true;
  showCourseButtons: boolean = false;
  showCourseOpciones: boolean = false;
  showCourseOpcionesImg: boolean = false;
  showYesOrNoOpciones: boolean = false;
  showYesOrNoOpciones1: boolean = false;
  showTerminarChat: boolean = false;
  showVerMiProgreso: boolean = false;
  showDetallesProgreso: boolean = false;
  showCerrarSesion: boolean = false;


  showMostrarBarras: boolean = false;
  showMostrarBarrasPorCurso: boolean = false;

  showTimer: boolean = false;
  showPreguntaSobreGato: boolean = false;
  showChatGpt: boolean = false;
  opcionesHTML: string[] = [];
  private palabrasProhibidas: string[] = [
    'puta', 'mierda', 'estúpido', 'imbécil', 'idiota', 'perra', 'hijo de', 'maldito', 'conchudo', 'csm', 'hdp'
  ];




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
  preguntaTotales: number = 5;
  preguntaActual: number = 0;
  evaluacionidnumber: number = 0;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private comunicacionService: ComunicacionService,
    private usuaoservice: UsuarioService,
    private alumnoservice: AlumnoService,
    private preguntaservice: PreguntaService,
    private evaluacionserice: EvaluacionService,
    private resultadopreguntaservice: ResultadopreguntaService,
    private cdr: ChangeDetectorRef) { }


  ngOnInit(): void {
    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
      this.usuaoservice.getUsuario(Number(usuarioId)).subscribe(usuario => {
        this.tituloMessage = "¡Bienvenido! " + usuario.usuario;
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
    this.showCourseButtons = true;
    this.speakWelcomeMessage(this.welcomeMessage + 'Selecciona un curso Matemáticas, Comunicación o Ciencias y Tecnologías');

  }


  startMath(evaluacionid: number) {
    this.welcomeMessage = '¡Perfecto! Comenzarás en 3, 2, 1 ....';
    this.showStartButton = false;
    this.showCourseButtons = false;
    this.speakWelcomeMessage(this.welcomeMessage);
    // Espera 3 segundos (3000 milisegundos)
    setTimeout(() => {
      // Aquí va la lógica después de los 3 segundos
      //traemos evaluacione

      this.evaluacionserice.getEvaluacion(evaluacionid).subscribe(evaluacion => {
        console.log(evaluacion.nombre);
        //traemos preguntas
        this.welcomeMessage = '¡LISTO!';
        this.speakWelcomeMessage(this.welcomeMessage);
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



  runPreguntas(titulo: string, evaluacioid: number) {
    this.showPreguntaSobreGato = false;

    this.preguntaservice.getPreguntas().subscribe(preguntas => {
      const preguntasencontradas = preguntas
        .filter(u => u.evaluacionid === evaluacioid)
        .sort(() => Math.random() - 0.5);

      if (this.preguntaActual == this.preguntaTotales) {


        this.tituloMessage = "¡Refuerzo Completado! ";
        this.preguntaMessage = "";
        this.welcomeMessage = "¡Felicitaciones! Has logrado completar el tema del día de hoy en " + this.tiempototal + " segundos";

        this.speakWelcomeMessage(this.welcomeMessage);
        this.showCourseOpciones = false;
        this.showCourseOpcionesImg = false;
        this.preguntaNumeros = "";
        this.showVerMiProgreso = true;
        this.preguntaActual = 0;
        // eliminamos lo que no deberia verse
        this.showStartButton = false;
        this.showCourseButtons = false;
        this.showYesOrNoOpciones = false;
        this.showYesOrNoOpciones1 = false;
        this.showTerminarChat = false;
        this.showDetallesProgreso = false;
        this.showChatGpt = false;
        //detener el timer
        clearInterval(this.timerInterval);
        this.showTimer = false;


      } else {
        // colocamos la respuesta correcta de la pregunta a la variable
        this.respuestaCorrecta = preguntasencontradas[this.preguntaActual].opcion1;

        this.preguntaid = preguntasencontradas[this.preguntaActual].id;
        //this.tituloMessage = titulo;
        this.welcomeMessage = "";
        this.preguntaMessage = preguntasencontradas[this.preguntaActual].descripcion;
        this.preguntaMessageenviar = preguntasencontradas[this.preguntaActual].descripcion;
        this.showCourseOpciones = true;
        this.showCourseOpcionesImg = true;
        this.showYesOrNoOpciones = false;
        this.imagenpregunta = preguntasencontradas[this.preguntaActual].imagen;
        console.log(preguntasencontradas[this.preguntaActual].imagen);
        this.opcion1 = preguntasencontradas[this.preguntaActual].opcion1;
        this.opcion2 = preguntasencontradas[this.preguntaActual].opcion2;
        this.opcion3 = preguntasencontradas[this.preguntaActual].opcion3;
        this.opcion4 = preguntasencontradas[this.preguntaActual].opcion4;
        this.opcionesHTML = [
          this.opcion1,
          this.opcion2,
          this.opcion3,
          this.opcion4
        ]
        this.showStartButton = false;
        this.showCourseButtons = false;
        this.showYesOrNoOpciones1 = false;
        this.showTerminarChat = false;
        this.showDetallesProgreso = false;
        this.showChatGpt = false;

        this.preguntaNumeros = "Pregunta " + (this.preguntaActual + 1) + " de 5";
        this.preguntaMessagetemp = preguntasencontradas[this.preguntaActual].respuesta;
        this.speakWelcomeMessage(this.preguntaMessage);
        this.startTimer(); // ⏱️ Iniciar temporizador aquí
      }
    });
  }

  selectRespuesta(respuesta: any) {
    this.respuestaSeleccionada = respuesta;
    if (this.respuestaCorrecta == respuesta) {
      //PASAMOS A LA SIGUIENTE PREGUNTA

      const alumno_id = localStorage.getItem('usuario_id');
      this.resultadopregunta = {
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
        is_deleted: 0
      };

      this.resultadopreguntaservice.createResultadopregunta(this.resultadopregunta)
        .subscribe({
          next: (res) => {
            console.log('Registro exitoso', res);
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

      const alumno_id = localStorage.getItem('usuario_id');
      this.resultadopregunta = {
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
        is_deleted: 0
      };

      this.resultadopreguntaservice.createResultadopregunta(this.resultadopregunta)
        .subscribe({
          next: (res) => {
            console.log('Registro exitoso', res);
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
    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
      this.usuaoservice.getUsuario(Number(usuarioId)).subscribe(usuario => {
        this.tituloMessage = "¡Bienvenido! " + usuario.usuario;
        this.welcomeMessage = "¿Estás listo para comenzar con tu reforzamiento del día?";

        this.preguntaMessage = "";
        this.showStartButton = true;
        this.showCourseButtons = false;
        this.showCourseOpciones = false;
        this.showCourseOpcionesImg = false;
        this.showYesOrNoOpciones = false;
        this.showYesOrNoOpciones1 = false;
        this.showTerminarChat = false;
        this.showVerMiProgreso = false;
        this.showDetallesProgreso = false;
        this.showPreguntaSobreGato = false;

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
