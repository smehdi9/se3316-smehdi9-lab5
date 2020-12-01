import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {

  httpService : HttpRequestsService = new HttpRequestsService();

  //Proper email and password format
  regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  regexSpecialChars = /^[^<>:/?#@.!$&'()*+,;=]*$/;

  constructor() { }

  //Get the sign up data, and sign the user up
  async signUpUser()  {
    let emailInput = (<HTMLInputElement>document.getElementById("sign-up-email")).value.trim();
    let usernameInput = (<HTMLInputElement>document.getElementById("sign-up-username")).value.trim();
    let passwordInput = (<HTMLInputElement>document.getElementById("sign-up-password")).value.trim();
    let passwordCheckInput = (<HTMLInputElement>document.getElementById("sign-up-password-check")).value.trim();

    //Ensure input is validated
    if(emailInput == '' || emailInput == undefined || passwordInput == '' || passwordInput == undefined ||
      usernameInput == '' || usernameInput == undefined || passwordCheckInput == '' || passwordCheckInput == undefined) {
      (<HTMLInputElement>document.getElementById("sign-up-errormsg")).innerText = "No field can be left empty";
      return;
    }
    else if (!emailInput.match(this.regexEmail)) {
      (<HTMLInputElement>document.getElementById("sign-up-errormsg")).innerText = "Improper email format";
      return;
    }
    else if (passwordInput.length < 8 || passwordInput.length > 30 || !passwordInput.match(this.regexSpecialChars)) {
      (<HTMLInputElement>document.getElementById("sign-up-errormsg")).innerText = "Password must be 8-30 characters and must only have . _ or - as non-alphanumeric characters";
      return;
    }
    else if (usernameInput.length < 4 || usernameInput.length > 30 || !usernameInput.match(this.regexSpecialChars)) {
      (<HTMLInputElement>document.getElementById("sign-up-errormsg")).innerText = "Username must be 4-30 characters and must only have . _ or - as non-alphanumeric characters";
      return;
    }
    else if (passwordInput != passwordCheckInput) {
      (<HTMLInputElement>document.getElementById("sign-up-errormsg")).innerText = "Passwords do not match!";
      return;
    }

    //Get the result from server
    let result = await this.httpService.serverSignUp(usernameInput, emailInput, passwordInput);
    if(result.message == "SUCCESS") {
      (<HTMLInputElement>document.getElementById("sign-up-errormsg")).innerText = "Please check your email to verify your account!";
    }
    else if (result.message == "ERR_EMAIL_TAKEN") {
      (<HTMLInputElement>document.getElementById("sign-up-errormsg")).innerText = "Email is already taken";
    }
    else if (result.message == "ERR_USER_TAKEN") {
      (<HTMLInputElement>document.getElementById("sign-up-errormsg")).innerText = "Username is already taken";
    }
  }

  //Get log in data, and log the user in
  async logInUser() {
    let emailInput = (<HTMLInputElement>document.getElementById("log-in-email")).value;
    let passwordInput = (<HTMLInputElement>document.getElementById("log-in-password")).value;

    //Ensure input is validated
    if(emailInput == '' || emailInput == undefined || passwordInput == '' || passwordInput == undefined) {
      (<HTMLInputElement>document.getElementById("log-in-errormsg")).innerText = "Email and password fields must not be empty";
      return;
    }
    else if (!emailInput.match(this.regexEmail)) {
      (<HTMLInputElement>document.getElementById("log-in-errormsg")).innerText = "Improper email format";
      return;
    }
    else if (passwordInput.length < 8 || passwordInput.length > 30 || !passwordInput.match(this.regexSpecialChars)) {
      (<HTMLInputElement>document.getElementById("log-in-errormsg")).innerText = "Password must be 8-30 characters and must only have . _ or - as non-alphanumeric characters";
      return;
    }

    //Get the result from server
    let result = await this.httpService.serverLogIn(emailInput, passwordInput);
    if(result.message == "SUCCESS") {
      //Save JWT in local storage
      localStorage.wtToken = result.token;
      window.location.replace('/user');   //Redirect to user
    }
    //Errors if log-in information is incorrect
    else if (result.message == "ERR_RESULT_NOT_FOUND") {
      (<HTMLInputElement>document.getElementById("log-in-errormsg")).innerText = "This user does not exist";
    }
    else if (result.message == "ERR_INCORRECT_PASSWORD") {
      (<HTMLInputElement>document.getElementById("log-in-errormsg")).innerText = "Incorrect password";
    }
    else if (result.message == "ERR_USER_UNVERIFIED") {
      (<HTMLInputElement>document.getElementById("log-in-errormsg")).innerText = "User is not verified, please check your email";
    }
    else if (result.message == "ERR_USER_DISABLED") {
      (<HTMLInputElement>document.getElementById("log-in-errormsg")).innerText = "This user is disabled, please contact an administrator";
    }
  }

  //Simply clear error messages when any of the forms are clicked
  clearErrors() : void {
    (<HTMLInputElement>document.getElementById("sign-up-errormsg")).innerText = "";
    (<HTMLInputElement>document.getElementById("log-in-errormsg")).innerText = "";
  }

  async ngOnInit() {
    //If the user is already logged in, then redirect to user panel
    if(localStorage.wtToken != "" || localStorage.wtToken != undefined) {
      let result = await this.httpService.checkUserVerification(localStorage.wtToken);
      if(result.message == "ACCEPTED") {
        window.location.replace('/user');   //Redirect to user
      }
      else {
        localStorage.wtToken = "";
      }
    }
  }

}
