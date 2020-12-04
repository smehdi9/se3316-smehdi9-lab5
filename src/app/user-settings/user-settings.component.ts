import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.css']
})
export class UserSettingsComponent implements OnInit {

  constructor() { }

  httpService : HttpRequestsService = new HttpRequestsService();

  //Password format
  regexSpecialChars = /^[^<>:/?#@.\\!$&'()*+,;=]*$/;


  async updatePassword() {
    let currentPassValue = (<HTMLInputElement>document.getElementById("current-password")).value.trim();
    let newPassValue = (<HTMLInputElement>document.getElementById("new-password")).value.trim();
    let checkPassValue = (<HTMLInputElement>document.getElementById("new-password-check")).value.trim();

    //Validate inputs
    if(newPassValue != checkPassValue) {
      (<HTMLInputElement>document.getElementById("update-password-errormsg")).innerText = "Reentered password is not correct";
      return;
    }
    if(!newPassValue.match(this.regexSpecialChars) || !currentPassValue.match(this.regexSpecialChars)) {
      (<HTMLInputElement>document.getElementById("update-password-errormsg")).innerText = "Input has invalid characters";
      return;
    }
    if(newPassValue.length > 30 || newPassValue.length < 8 || currentPassValue.length > 30 || currentPassValue.length < 8) {
      (<HTMLInputElement>document.getElementById("update-password-errormsg")).innerText = "Passwords must be 8-30 characters long";
      return;
    }

    //Update the password
    let result = await this.httpService.updatePassword(localStorage.wtToken, newPassValue, currentPassValue);
    if(result.message == "SUCCESS") {
      alert("Password updated");
    }
    else if(result.message == "ERR_SAME_PASSWORD") {
      (<HTMLInputElement>document.getElementById("update-password-errormsg")).innerText = "New and old password must be different";
    }
    else if(result.message == "ERR_INCORRECT_PASSWORD") {
      (<HTMLInputElement>document.getElementById("update-password-errormsg")).innerText = "Current password entered is not correct";
    }
    else {
      (<HTMLInputElement>document.getElementById("update-password-errormsg")).innerText = "Something went wrong";
    }

    //Refresh
    window.location.replace('/user');
  }


  //Simply clear error messages when any of the forms are clicked
  clearErrors() : void {
    (<HTMLInputElement>document.getElementById("update-password-errormsg")).innerText = "";
  }


  async ngOnInit() {
    //Check if the user is allowed to access this page
    //If the locally stored token is invalid/empty/unaccepted then redirect to the login page
    let result = await this.httpService.checkUserVerification(localStorage.wtToken);
    if(result.message != "SUCCESS") {
      alert("You must log in for this functionality");
      localStorage.wtToken = "";
      window.location.replace('/login');   //Redirect to login
    }
  }

}
