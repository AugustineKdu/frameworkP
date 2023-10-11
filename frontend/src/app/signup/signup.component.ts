import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  username: string = '';
  email: string = '';
  password: string = '';
  role: string = 'user';
  // API URL is directly defined in the component for this example
  private apiUrl = 'http://localhost:3000';

  // Injecting services into the component
  constructor(private http: HttpClient, private router: Router) { }

  // Function handling the signup process
  signup() {
    console.log(this.role);
    // Making a POST request to create a new user
    this.http.post(`${this.apiUrl}/api/signup`, {
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role
    })
      .subscribe(
        (response: any) => {
          // Checking the response validity
          if (response.valid) {
            window.alert('Signup successful!');  // Alerting user about successful signup
            this.router.navigate(['/login']);  // Redirecting to the login page
          } else {
            window.alert('Signup failed!');  // Alerting user about signup failure
          }
        },
        (error) => {
          console.error('An error occurred', error);  // Logging the error
          window.alert('An error occurred during signup.');  // Informing the user about an error
        }
      );
  }
}
