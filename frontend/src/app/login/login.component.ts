import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  users = [
    { email: 'super', password: '123', role: 'super-admin' },
    { email: 'group', password: '123', role: 'group-admin' },
    { email: 'user', password: '123', role: 'user' }
  ];

  constructor(private router: Router) { }

  login() {
    const user = this.users.find(u => u.email === this.email && u.password === this.password);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (user.role === 'super-admin') {
        this.router.navigate(['/super-admin-dashboard']);
      } else if (user.role === 'group-admin') {
        this.router.navigate(['/group-admin-dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.errorMessage = 'Invalid email or password';
    }
  }
}
