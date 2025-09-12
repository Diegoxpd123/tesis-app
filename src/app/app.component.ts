import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'trabajofronto-app';
  isLoginPage: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Detectar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isLoginPage = event.url === '/login' || event.url === '/' || event.url === '/forgot-password';
      });

    // Verificar la ruta inicial
    this.checkCurrentRoute();
  }

  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

  private checkCurrentRoute(): void {
    this.isLoginPage = this.router.url === '/login' || this.router.url === '/' || this.router.url === '/forgot-password';
  }
}
