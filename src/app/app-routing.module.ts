import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HomeRefactoredComponent } from './components/home/home-refactored.component';
import { EstudianteListRefactoredComponent } from './components/estudiante-list/estudiante-list-refactored.component';
import { LoginComponent } from './components/login/login.component';
import { EstudianteDetailComponent } from './components/estudiante-detail/estudiante-detail.component';
import { AdminStudentDetailComponent } from './components/admin-student-detail/admin-student-detail.component';
import { ProgressComponent } from './components/progress/progress.component';
import { CargaComponent } from './components/carga/carga.component';
import { RegisterUserComponent } from './components/register-user/register-user.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'home', component: HomeComponent },
  { path: 'home-refactored', component: HomeRefactoredComponent },
  { path: 'progress', component: ProgressComponent },
  { path: 'estudiantes', component: EstudianteListRefactoredComponent },
  { path: 'estudiantes-refactored', component: EstudianteListRefactoredComponent },
  { path: 'estudiantes/detail/:usuarioid', component: EstudianteDetailComponent },
  { path: 'admin/estudiantes/detail/:usuarioid', component: AdminStudentDetailComponent },
  { path: 'admin/registrar-usuario', component: RegisterUserComponent },
  { path: 'carga', component: CargaComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
