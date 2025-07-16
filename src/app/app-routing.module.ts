import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { EstudianteListComponent } from './components/estudiante-list/estudiante-list.component';
import { EstudianteDetailComponent } from './components/estudiante-detail/estudiante-detail.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
{ path: 'home', component: HomeComponent },
{ path: 'estudiantes', component: EstudianteListComponent },
{ path: 'estudiantes/detail/:usuarioid', component: EstudianteDetailComponent },
 { path: '', redirectTo: 'login',pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
