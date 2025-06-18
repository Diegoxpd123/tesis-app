import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  mensajeLogin: string = '';
colorMensaje: string = '';

  loginForm: FormGroup = new FormGroup({

    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)

  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  private usuarioService: UsuarioService
  ) { }

  login(): void {
  const username = this.loginForm.get('username')?.value;
  const password = this.loginForm.get('password')?.value;

  this.usuarioService.getUsuarios().subscribe(usuarios => {
    const usuarioEncontrado = usuarios.find(u =>
      u.usuario === username && u.contra === password
    );

    if (usuarioEncontrado) {

      localStorage.setItem('usuario_id', usuarioEncontrado.id.toString());
      localStorage.setItem('alumno_id', usuarioEncontrado.aludocenid.toString());
       this.mensajeLogin = 'Bienvenido ' + usuarioEncontrado.usuario;
  this.colorMensaje = 'green';

      if (usuarioEncontrado.tipousuarioid === 1) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/estudiantes']);
      }
    } else {
       this.mensajeLogin = 'Credenciales incorrectas';
  this.colorMensaje = 'red';
    }
  });
}


  ngOnInit(): void {
  }
}
