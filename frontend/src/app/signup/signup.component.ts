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
  role: string = 'user';  // Default role

  constructor(private http: HttpClient, private router: Router) { }

  registerUser() {
    this.http.post('http://localhost:3000/api/signup', {
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role  // Include role in the POST request
    })
      .subscribe(
        (response: any) => {
          if (response.valid) {
            this.router.navigate(['/login']);
          }
        },
        (error) => {
          console.log('An error occurred', error);
        }
      );
  }
}
