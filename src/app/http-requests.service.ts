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


  // ----- Account management HTTP requests -----

  /* Using /api/user/login
     Will return a message and optionally a token value.
  */
  async serverLogIn(email : String, password : String) {
    try {
      const response = await fetch(this.serverURL + '/api/user/login', {
        method: "PUT",
        headers: this.headersJSON,
        body: JSON.stringify({
          "email": email,
          "password": password
        })
      });
      let result = await response.json();
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
        headers: this.headersJSON,
        body: JSON.stringify({
          "email": email,
          "username": username,
          "password": password
        })
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err) }
  }


  // ----- Common HTTP requests -----

  /* Using /api/common/subjects
     Will return a message and array.
  */
  async getAllSubjectCodes() {
    try {
      const response = await fetch(this.serverURL + '/api/common/subjects', {
        method: "GET",
        headers: this.headersJSON
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err) }
  }


  /* Using /api/common/:subject
     Will return a message and array of strings.
  */
  async getAllCourseCodes(subject) {
    try {
      const response = await fetch(this.serverURL + '/api/common/timetable/' + subject, {
        method: "GET",
        headers: this.headersJSON
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err) }
  }


  /* Using /api/common/timetable
     Will return a message and optionally array.
  */
  async getResultsFromQuery(subject: String, catalog_nbr : String, component : String) {
    let subjectQuery = "";
    let courseQuery = "";
    let componentQuery = "";

    //Add queries where needed
    if(subject != undefined && subject != "") {
      subjectQuery = "subject=" + subject + "&";
    }
    if(catalog_nbr != undefined && catalog_nbr != "") {
      courseQuery = "catalog_nbr=" + catalog_nbr + "&";
    }
    if(component != undefined && component != "NULL") {
      componentQuery = "component=" + component;
    }

    try {
      const response = await fetch(this.serverURL + '/api/common/timetable?' + subjectQuery + courseQuery + componentQuery, {
        method: "GET",
        headers: this.headersJSON
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err) }
  }


  /* Using /api/common/timetable
     Will return a message and optionally array.
  */
  async getResultsFromKeyword(keywords: String) {
    if(keywords.length < 1 || keywords.length > 50) return;

    try {
      const response = await fetch(this.serverURL + '/api/common/timetable?keywords=' + keywords, {
        method: "GET",
        headers: this.headersJSON
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err) }
  }

  constructor() { }
}
