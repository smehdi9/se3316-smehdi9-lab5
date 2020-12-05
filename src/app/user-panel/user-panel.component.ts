import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.css']
})
export class UserPanelComponent implements OnInit {

  //HTTP service
  httpService : HttpRequestsService = new HttpRequestsService();

  //Display objects
  usernameLabel : string = "";
  dateCreatedLabel : string = "";

  //Admin user or not
  adminUser = false;

  constructor() { }

  //Log out the user -- Simply remove the token and redirect to login page
  logOutUser() {
    localStorage.wtToken = "";
    window.location.replace('/login');   //Redirect to login
  }

  //Update user settings (Password only)
  updateUserSettings() {
    window.location.replace('/user/settings');   //Redirect to settings
  }

  //Redirect to admin reviews panel (Only accessible for admins)
  adminReviewPanel() {
    window.location.replace('/admin/reviews');
  }

  //Redirect to admin users panel (Only accessible for admins)
  adminUsersPanel() {
    window.location.replace('/admin/users');
  }

  //Redirect to admin DMCA panel (Only accessible for admins)
  adminDMCAPanel() {
    window.location.replace('/admin/dmca');
  }


  //On init
  async ngOnInit() {
    //Check if the user is allowed to access this page
    //If the locally stored token is invalid/empty/unaccepted then redirect to the login page
    let result = await this.httpService.checkUserVerification(localStorage.wtToken);
    if(result.message != "SUCCESS") {
      alert("You must log in for this functionality");
      localStorage.wtToken = "";
      window.location.replace('/login');   //Redirect to login
    }
    //Set display values if does exist
    else {
      this.usernameLabel = result.username;
      this.dateCreatedLabel = (new Date(result.created)).toLocaleDateString("en-CA");
      result = await this.httpService.checkAdminUser(localStorage.wtToken);
      if(result.message == "SUCCESS") {
        this.adminUser = true;
      }
    }
  }

}
