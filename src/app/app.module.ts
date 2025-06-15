import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';;
import { ReactiveFormsModule } from '@angular/forms'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { LoginComponent } from './components/login/login.component';
import { FormsModule } from '@angular/forms';
import { EstudianteListComponent } from './components/estudiante-list/estudiante-list.component';
import { EstudianteDetailComponent } from './components/estudiante-detail/estudiante-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    LoginComponent,
    EstudianteListComponent,
    EstudianteDetailComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
     FormsModule,
    ReactiveFormsModule,
     ZXingScannerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
