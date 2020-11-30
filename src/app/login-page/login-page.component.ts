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
  signUpUser() : void  {

  }

  //Get log in data, and log the user in
  async logInUser() : void {
    let emailInput = document.getElementById("log-in-email").value;
    let passwordInput = document.getElementById("log-in-password").value;

    //Ensure input is validated
    if(emailInput == '' || emailInput == undefined || passwordInput == '' || passwordInput == undefined) {
      document.getElementById("log-in-errormsg").innerText = "Email and password fields must not be empty";
    }
    else if (!emailInput.match(this.regexEmail)) {
      document.getElementById("log-in-errormsg").innerText = "Improper email format";
    }
    else if (passwordInput.length < 8 || !passwordInput.match(this.regexSpecialChars)) {
      document.getElementById("log-in-errormsg").innerText = "Password must be 8 characters and must only have . _ - as non-alphanumeric characters ";
    }

    //Get the result from server
    let result = await this.httpService.serverLogIn(emailInput, passwordInput);
    if(result.message == "SUCCESS") {
      //Perform log-in logic
      console.log(result.token);
    }
    //Errors if log-in information is incorrect
    else if (result.message == "ERR_RESULT_NOT_FOUND") {
      document.getElementById("log-in-errormsg").innerText = "This user does not exist";
    }
    else if (result.message == "ERR_INCORRECT_PASSWORD") {
      document.getElementById("log-in-errormsg").innerText = "Incorrect password";
    }
    else if (result.message == "ERR_USER_UNVERIFIED") {
      document.getElementById("log-in-errormsg").innerText = "User is not verified, please check your email";
    }
    else if (result.message == "ERR_USER_DISABLED") {
      document.getElementById("log-in-errormsg").innerText = "This user is disabled, please contact an administrator";
    }
  }

  //Simply clear error messages when any of the forms are clicked
  clearErrors() : void {
    document.getElementById("sign-up-errormsg").innerText = "";
    document.getElementById("log-in-errormsg").innerText = "";
  }

  ngOnInit() : void {
  }

}
