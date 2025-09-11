import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HomeRefactoredComponent } from './components/home/home-refactored.component';
import { EstudianteListRefactoredComponent } from './components/estudiante-list/estudiante-list-refactored.component';
import { LoginComponent } from './components/login/login.component';
import { EstudianteDetailComponent } from './components/estudiante-detail/estudiante-detail.component';
import { ProgressComponent } from './components/progress/progress.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'home-refactored', component: HomeRefactoredComponent },
  { path: 'progress', component: ProgressComponent },
  { path: 'estudiantes', component: EstudianteListRefactoredComponent },
  { path: 'estudiantes-refactored', component: EstudianteListRefactoredComponent },
  { path: 'estudiantes/detail/:usuarioid', component: EstudianteDetailComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
