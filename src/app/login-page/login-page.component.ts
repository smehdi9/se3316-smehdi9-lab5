import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {

  constructor() { }

  //Get the sign up data, and sign the user up
  signUpUser() : void  {
    alert("SIGN UP");
  }

  //Get log in data, and log the user in
  logInUser() : void {
    alert("LOG UP");

  }

  ngOnInit() : void {
  }

}
