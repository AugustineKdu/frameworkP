import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = ''; // To store the username entered by the user
  password: string = ''; // To store the password entered by the user
  errorMessage: string = ''; // To display error messages

  constructor(private router: Router, private http: HttpClient) { }

  // Function to handle user login
  login() {
    // Make a POST request to authenticate the user
    this.http.post('http://localhost:3000/api/auth', { username: this.username, password: this.password })
      .subscribe(
        (response: any) => {
          // Check if the authentication was successful
          if (response.valid) {
            // Store the user's information in session storage
            sessionStorage.setItem('currentUser', JSON.stringify(response));
            // Navigate to the appropriate dashboard based on the user's role
            this.router.navigate([this.getDashboardRoute(response.role)]);
          } else {
            // Display an error message for invalid credentials
            this.errorMessage = 'Invalid username or password';
          }
        },
        (error) => {
          // Display a generic error message
          this.errorMessage = 'An error occurred';
        }
      );
  }

  // Function to determine the appropriate dashboard route based on the user's role
  getDashboardRoute(role: string): string {
    if (role === 'super-admin') {
      return '/super-admin-dashboard';
    } else if (role === 'group-admin') {
      return '/group-admin-dashboard';
    } else {
      return '/dashboard';
    }
  }

  // Function to handle user logout
  logout() {
    // Clear session storage
    sessionStorage.clear();
    // Navigate back to the login page
    this.router.navigate(['/login']);
  }
}
