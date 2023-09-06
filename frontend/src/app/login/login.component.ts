import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private http: HttpClient) { }

  login() {
    this.http.post('http://localhost:3000/api/auth', { username: this.username, password: this.password })
      .subscribe(
        (response: any) => {
          if (response.valid) {
            sessionStorage.setItem('currentUser', JSON.stringify(response));
            this.router.navigate([this.getDashboardRoute(response.role)]);
          } else {
            this.errorMessage = 'Invalid username or password';
          }
        },
        (error) => {
          this.errorMessage = 'An error occurred';
        }
      );
  }

  getDashboardRoute(role: string): string {
    if (role === 'super-admin') {
      return '/super-admin-dashboard';
    } else if (role === 'group-admin') {
      return '/group-admin-dashboard';
    } else {
      return '/dashboard';
    }
  }
  logout() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
