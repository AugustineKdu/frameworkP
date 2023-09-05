import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private http: HttpClient) { }

  login() {
    this.http.post('http://localhost:3000/api/auth', { email: this.email, password: this.password }).subscribe(
      (response: any) => {
        if (response.valid) {
          sessionStorage.setItem('currentUser', JSON.stringify(response));
          if (response.role === 'super-admin') {
            this.router.navigate(['/super-admin-dashboard']);
          } else if (response.role === 'group-admin') {
            this.router.navigate(['/group-admin-dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.errorMessage = 'Invalid email or password';
        }
      },
      (error) => {
        this.errorMessage = 'An error occurred';
      }
    );
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
