import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppState {
  currentUser: any;
  currentEvaluation: any;
  currentQuestion: any;
  timer: {
    minutes: number;
    seconds: number;
    isActive: boolean;
  };
  progress: {
    mathematics: number;
    communication: number;
    science: number;
  };
  ui: {
    showStartButton: boolean;
    showCourseButtons: boolean;
    showEvaluations: boolean;
    showQuestion: boolean;
    showProgress: boolean;
    showChat: boolean;
    showBars: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private initialState: AppState = {
    currentUser: null,
    currentEvaluation: null,
    currentQuestion: null,
    timer: {
      minutes: 0,
      seconds: 0,
      isActive: false
    },
    progress: {
      mathematics: 0,
      communication: 0,
      science: 0
    },
    ui: {
      showStartButton: true,
      showCourseButtons: false,
      showEvaluations: false,
      showQuestion: false,
      showProgress: false,
      showChat: false,
      showBars: false
    }
  };

  private stateSubject = new BehaviorSubject<AppState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  constructor() {}

  getCurrentState(): AppState {
    return this.stateSubject.value;
  }

  updateState(partialState: Partial<AppState>): void {
    const currentState = this.getCurrentState();
    const newState = { ...currentState, ...partialState };
    this.stateSubject.next(newState);
  }

  updateUI(uiUpdates: Partial<AppState['ui']>): void {
    const currentState = this.getCurrentState();
    const newUI = { ...currentState.ui, ...uiUpdates };
    this.updateState({ ui: newUI });
  }

  updateTimer(timerUpdates: Partial<AppState['timer']>): void {
    const currentState = this.getCurrentState();
    const newTimer = { ...currentState.timer, ...timerUpdates };
    this.updateState({ timer: newTimer });
  }

  updateProgress(progressUpdates: Partial<AppState['progress']>): void {
    const currentState = this.getCurrentState();
    const newProgress = { ...currentState.progress, ...progressUpdates };
    this.updateState({ progress: newProgress });
  }

  setCurrentUser(user: any): void {
    this.updateState({ currentUser: user });
  }

  setCurrentEvaluation(evaluation: any): void {
    this.updateState({ currentEvaluation: evaluation });
  }

  setCurrentQuestion(question: any): void {
    this.updateState({ currentQuestion: question });
  }

  resetState(): void {
    this.stateSubject.next(this.initialState);
  }

  // Selectores específicos
  getCurrentUser(): any {
    return this.getCurrentState().currentUser;
  }

  getCurrentEvaluation(): any {
    return this.getCurrentState().currentEvaluation;
  }

  getCurrentQuestion(): any {
    return this.getCurrentState().currentQuestion;
  }

  getTimer(): AppState['timer'] {
    return this.getCurrentState().timer;
  }

  getProgress(): AppState['progress'] {
    return this.getCurrentState().progress;
  }

  getUI(): AppState['ui'] {
    return this.getCurrentState().ui;
  }
}
