import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { HomeRefactoredComponent } from './components/home/home-refactored.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginComponent } from './components/login/login.component';
import { EstudianteListRefactoredComponent } from './components/estudiante-list/estudiante-list-refactored.component';
import { EstudianteDetailComponent } from './components/estudiante-detail/estudiante-detail.component';
import { RobotComponent } from './components/robot/robot.component';
import { CourseSelectorComponent } from './components/course-selector/course-selector.component';
import { QuestionComponent } from './components/question/question.component';
import { ProgressComponent } from './components/progress/progress.component';
import { ChatGptComponent } from './components/chat-gpt/chat-gpt.component';

import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { NgrokInterceptor } from './interceptors/ngrok.interceptor'; // asegúrate que esta ruta sea correcta

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    LoginComponent,
    EstudianteDetailComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    ZXingScannerModule,
    HomeRefactoredComponent,
    EstudianteListRefactoredComponent,
    RobotComponent,
    CourseSelectorComponent,
    QuestionComponent,
    ProgressComponent,
    ChatGptComponent
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NgrokInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
