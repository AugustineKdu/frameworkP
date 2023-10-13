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

  constructor(private http: HttpClient, private router: Router) { }

  signup() {
    console.log(this.role);
    this.http.post('http://localhost:3000/api/signup', { username: this.username, email: this.email, password: this.password, role: this.role })
      .subscribe(
        (response: any) => {
          if (response.valid) {
            window.alert('Signup successful!');  // Success popup
            this.router.navigate(['/login']);
          } else {
            window.alert('Signup failed!');  // Failure popup
          }
        },
        (error) => {
          console.log('An error occurred', error);
          window.alert('An error occurred during signup.');  // Error popup
        }
      );
  }

}
