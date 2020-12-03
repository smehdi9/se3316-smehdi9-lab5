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


  // ----- Account management HTTP requests -----------------------------------------------------------------

  /* Using PUT /api/user/login
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
    } catch(err) { console.log(err); return undefined; }
  }

  /* Using POST /api/user/signup
     Will return a message.
  */
  async serverSignUp(username : String, email : String, password : String) {
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
    } catch(err) { console.log(err); return undefined; }
  }

  /* Using PUT /api/user/check
     Will return a message, with a potential admin flag.
  */
  async checkUserVerification(wtToken : String) {
    try {
      const response = await fetch(this.serverURL + '/api/user/check', {
        method: "PUT",
        headers: this.headersJSON,
        body: JSON.stringify({
          "token": wtToken,
        })
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err); return undefined; }
  }



  // ----- Common HTTP requests -----------------------------------------------------------------

  /* Using GET /api/common/subjects
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
    } catch(err) { console.log(err); return undefined; }
  }


  /* Using GET /api/common/:subject
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
    } catch(err) { console.log(err); return undefined; }
  }


  /* Using GET /api/common/timetable
     Will return a message and optionally array.
  */
  async getResultsFromQuery(subject : String, catalog_nbr : String, component : String) {
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
    } catch(err) { console.log(err); return undefined; }
  }


  /* Using GET /api/common/timetable
     Will return a message and optionally array.
  */
  async getResultsFromKeyword(keywords : String) {
    if(keywords.length < 1 || keywords.length > 50) return;

    try {
      const response = await fetch(this.serverURL + '/api/common/timetable?keywords=' + keywords, {
        method: "GET",
        headers: this.headersJSON
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err); return undefined; }
  }


  /* Using GET /api/common/timetable/:subject/:catalog_nbr
     Will return a message and optionally array.
  */
  async getTimetableEntry(subject : String, catalog_nbr : String) {
    if(subject != "" && subject != undefined && catalog_nbr != "" && catalog_nbr != undefined) {
      try {
        const response = await fetch(this.serverURL + '/api/common/timetable/' + subject + "/" + catalog_nbr, {
          method: "GET",
          headers: this.headersJSON
        });
        let result = await response.json();
        return result;
      } catch(err) { console.log(err); return undefined; }
    }
    else {
      return undefined;
    }
  }


  // ----- Secure HTTP requests -----------------------------------------------------------------

  /* Using GET /api/secure/schedules
     Will return a message and optionally array.
  */
  async getScheduleNamesForUser() {
    try {
      const response = await fetch(this.serverURL + '/api/secure/schedules', {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'authorization': localStorage.wtToken
        }
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err); return undefined; }
  }

  /* Using GET /api/secure/schedules/:name
     Will return a message and optionally an object.
  */
  async getScheduleByName(name : String) {
    //Dont allow improper inputs
    if(name == undefined || name == "") return undefined;
    try {
      const response = await fetch(this.serverURL + '/api/secure/schedules/' + name, {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'authorization': localStorage.wtToken
        }
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err); return undefined; }
  }



  constructor() { }
}
