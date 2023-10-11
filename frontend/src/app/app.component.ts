import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isLoggedIn = false;

  constructor(private router: Router) { }

  ngOnInit() {
    this.checkLoginStatus();
  }

  // Check if the user is logged in and navigate to the respective dashboard
  checkLoginStatus() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    this.isLoggedIn = Boolean(user && user.role);  // Ensuring both user and role exist

    if (this.isLoggedIn) {
      this.navigateToDashboard(user.role);
    }
  }

  // Logout function to clear session and navigate to login
  logout() {
    sessionStorage.clear();
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  // Helper function to navigate to the respective dashboard based on user role
  private navigateToDashboard(role: string) {
    let dashboardRoute = '';

    switch (role) {
      case 'super-admin':
        dashboardRoute = '/super-admin-dashboard';
        break;
      case 'group-admin':
        dashboardRoute = '/group-admin-dashboard';
        break;
      default:
        dashboardRoute = '/dashboard';
    }

    this.router.navigate([dashboardRoute]);
  }
}
