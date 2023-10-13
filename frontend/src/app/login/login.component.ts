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

  // Injecting Router and HttpClient services
  constructor(private router: Router, private http: HttpClient) { }

  // Handle login functionality
  login() {
    // API endpoint URL
    const apiUrl = 'http://localhost:3000/api/auth';

    // POST request to authenticate the user
    this.http.post(apiUrl, { username: this.username, password: this.password })
      .subscribe(
        (response: any) => {
          // Check if the response is valid
          if (response.valid) {
            // Store user data in session storage and navigate to the dashboard
            sessionStorage.setItem('currentUser', JSON.stringify(response));
            this.router.navigate([this.getDashboardRoute(response.role)]);
          } else {
            // Show an error message if authentication fails
            this.errorMessage = 'Invalid username or password';
          }
        },
        () => {
          // Handle unexpected errors
          this.errorMessage = 'An error occurred';
        }
      );
  }

  // Determine the dashboard route based on user role
  getDashboardRoute(role: string): string {
    switch (role) {
      case 'super-admin':
        return '/super-admin-dashboard';
      case 'group-admin':
        return '/group-admin-dashboard';
      default:
        return '/dashboard';
    }
  }

  // Handle logout functionality
  logout() {
    // Clear user data from session storage and navigate to the login page
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
