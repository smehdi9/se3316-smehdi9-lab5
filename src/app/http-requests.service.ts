import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpRequestsService {
  /*
  This service file will simply access all of the back-end functionalities that our code uses.
  It was efficient to put it in one single file since we use the same serverURL repeatedly
  It's best to only instantiate one variable to describe serverURl
  */

  //The back end server URL
  serverURL = "http://localhost:3000";
  //This headers JSON is used repeatedly in every HTTP request
  headersJSON = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  /* Using /api/user/login
     Will return a message and optionally a token value.
  */
  async serverLogIn(email : String, password : String) {
    try {
      const response = await fetch(this.serverURL + '/api/user/login', {
        method: "PUT",
        headers: headersJSON,
        body: {
          "email": email,
          "password": password
        }
      });
      result = await response.json();
      return result;
    } catch(err) { console.log(err) }
  }

  /* Using /api/user/signup
     Will return a message.
  */
  async serverSignUp(username: String, email : String, password : String) {
    try {
      const response = await fetch(this.serverURL + '/api/user/signup', {
        method: "POST",
        headers: headersJSON,
        body: {
          "email": email,
          "username": username,
          "password": password
        }
      });
      result = await response.json();
      return result;
    } catch(err) { console.log(err) }
  }

  constructor() { }
}
