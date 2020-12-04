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


  /* Using PUT /api/user/check/admin
     Will return a message, with a potential admin flag.
  */
  async checkAdminUser(wtToken : String) {
    try {
      const response = await fetch(this.serverURL + '/api/user/check/admin', {
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


  /* Using PUT /api/user/update/password
     Will return only a message
  */
  async updatePassword(wtToken : String, new_password : String, current_password : String) {
    //If the two passwords are the same
    if(current_password == new_password) return {"message" : "ERR_SAME_PASSWORD"};
    try {
      const response = await fetch(this.serverURL + '/api/user/update/password', {
        method: "PUT",
        headers: this.headersJSON,
        body: JSON.stringify({
          "token": wtToken,
          "new_password": new_password,
          "current_password": current_password
        })
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err); return undefined; }
  }


  /* Using POST /api/user/verify
     Will return only a message
  */
  async verifyUserViaToken(vToken : string) {
    try {
      const response = await fetch(this.serverURL + '/api/user/verify', {
        method: "POST",
        headers: this.headersJSON,
        body: JSON.stringify({
          "token": vToken
        })
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err); return undefined; }
  }


  /* Using PUT /api/user/verify/resend
     Will return only a message
  */
  async resendEmailVerification(email : String) {
    try {
      const response = await fetch(this.serverURL + '/api/user/verify/resend', {
        method: "PUT",
        headers: this.headersJSON,
        body: JSON.stringify({
          "email": email
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


  /* Using PUT /api/common/timetable/mutliple
     Will return a message and optionally array.
  */
  async getEntriesForArray(course_list) {
    //if the course_list is empty, just return empty list (efficient :D )
    if(course_list.length == 0) return [];
    try {
      const response = await fetch(this.serverURL + '/api/common/timetable/multiple', {
        method: "PUT",
        headers: this.headersJSON,
        body: JSON.stringify({
            "course_list": course_list
        })
      });
      let result = await response.json();
      return result;
    } catch(err) { console.log(err); return undefined; }
  }


  /* Using GET /api/common/timetable/:subject/:catalog_nbr
     Will return a message and optionally array.
  */
  async getReviewList(subject : String, catalog_nbr : String) {
    if(subject != "" && subject != undefined && catalog_nbr != "" && catalog_nbr != undefined) {
      try {
        const response = await fetch(this.serverURL + '/api/common/reviews/' + subject + "/" + catalog_nbr, {
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


  /* Using POST /api/secure/schedules
     Will only return a message
  */
  async createNewSchedule(name : String, description : String, course_list) {
    //Disallow empty names
    if(name == "" || name == undefined) {
      return;
    }
    //Allow empty description
    else if (description == "" || description == undefined){
      try {
        const response = await fetch(this.serverURL + '/api/secure/schedules/', {
          method: "POST",
          headers: this.headersJSON,
          body: JSON.stringify({
            "token": localStorage.wtToken,
            "name": name,
            "course_list": course_list
          })
        });
        let result = await response.json();
        return result;
      } catch(err) { console.log(err); return undefined; }
    }
    //If description is given, send that too
    else {
      try {
        const response = await fetch(this.serverURL + '/api/secure/schedules/', {
          method: "POST",
          headers: this.headersJSON,
          body: JSON.stringify({
            "token": localStorage.wtToken,
            "name": name,
            "description": description,
            "course_list": course_list
          })
        });
        let result = await response.json();
        return result;
      } catch(err) { console.log(err); return undefined; }
    }
  }


  /* Using PUT /api/secure/schedules
     Will only return a message
  */
  async editSchedule(name : String, new_name : String, description : String, publicInp : boolean, course_list) {
    //Disallow empty names
    if(name == "" || name == undefined) {
      return;
    }
    else if(new_name == "" || new_name == undefined) {
      return;
    }
    //Allow empty description
    else if (description == "" || description == undefined){
      try {
        const response = await fetch(this.serverURL + '/api/secure/schedules/', {
          method: "PUT",
          headers: this.headersJSON,
          body: JSON.stringify({
            "token": localStorage.wtToken,
            "name": name,
            "course_list": course_list,
            "new_name": new_name,
            "public": publicInp
          })
        });
        let result = await response.json();
        return result;
      } catch(err) { console.log(err); return undefined; }
    }
    //If description is given, send that too
    else {
      try {
        const response = await fetch(this.serverURL + '/api/secure/schedules/', {
          method: "PUT",
          headers: this.headersJSON,
          body: JSON.stringify({
            "token": localStorage.wtToken,
            "name": name,
            "course_list": course_list,
            "new_name": new_name,
            "description": description,
            "public": publicInp
          })
        });
        let result = await response.json();
        return result;
      } catch(err) { console.log(err); return undefined; }
    }
  }


  /* Using DELETE /api/secure/schedules/:name
     Will return a message and optionally an object.
  */
  async deleteScheduleByName(name : String) {
    //Dont allow improper inputs
    if(name == undefined || name == "") return undefined;
    try {
      const response = await fetch(this.serverURL + '/api/secure/schedules/' + name, {
        method: "DELETE",
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


  /* Using PUT /api/secure/reviews/:subject/:catalog_nbr
     Will return a message
  */
  async addReview(subject : String, catalog_nbr : String, review : String) {
    if(subject != "" && subject != undefined && catalog_nbr != "" && catalog_nbr != undefined) {
      try {
        const response = await fetch(this.serverURL + '/api/secure/reviews/' + subject + "/" + catalog_nbr, {
          method: "PUT",
          headers: this.headersJSON,
          body: JSON.stringify({
            "token": localStorage.wtToken,
            "review": review
          })
        });
        let result = await response.json();
        return result;
      } catch(err) { console.log(err); return undefined; }
    }
    else {
      return undefined;
    }
  }


  constructor() { }
}
