import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-review-panel',
  templateUrl: './review-panel.component.html',
  styleUrls: ['./review-panel.component.css']
})
export class ReviewPanelComponent implements OnInit {

  //HTTP service
  httpService : HttpRequestsService = new HttpRequestsService();
  //Input regex
  regexSpecialChars = /^[^<>:/?#@\\/!$&'()*+,;=]*$/;

  constructor() { }


  //Add a review for the given schedule
  async addReview() {
    let subjectValue = (<HTMLInputElement>document.getElementById("subject-input")).value;
    let courseValue = (<HTMLInputElement>document.getElementById("course-input")).value;
    let reviewValue = (<HTMLInputElement>document.getElementById("review-input")).value;

    //If no values are entered
    if((subjectValue == undefined || subjectValue == "") &&
       (courseValue == undefined || courseValue == "")) {
       return;
    }

    //Ensure review is of proper format
    if(reviewValue.length < 2 || reviewValue.length > 150 || !reviewValue.match(this.regexSpecialChars)) {
      (<HTMLInputElement>document.getElementById("review-errormsg")).innerText = "Review must be 2 - 150 characters long. \r\nNo illegal characters.";
      return;
    }

    //Ask for confirmation
    if(!confirm("Your review will be added. Ok to confirm")) {
      return;
    }

    //If the input is valid, add the review
    let result = (await this.httpService.addReview(subjectValue, courseValue, reviewValue)).message;
    if(result == "SUCCESS") {
      alert("Added review!");
    }
    else {
      (<HTMLInputElement>document.getElementById("review-errormsg")).innerText = "Something went wrong";
    }

    //Refresh
    location.reload();
  }


  //Fill the optional drop down for the text input field for the selected subject -- Decorative
  async fillCourselist() {
    let subjectValue = (<HTMLInputElement>document.getElementById("subject-input")).value;
    let courseDatalist = <HTMLInputElement>document.getElementById("course-input");
    //Fill the data list, if the subject doesn't exist, don't do anything
    if(subjectValue == '' || subjectValue == null) this.emptyElement(courseDatalist);
    else {
      this.emptyElement(courseDatalist);
      let courses = (await this.httpService.getAllCourseCodes(subjectValue)).content; //HTTP request
      for(let i = 0; i < courses.length; i++) {
        let newOpt = document.createElement("option");
        let newOptText = document.createTextNode(courses[i]);
        newOpt.appendChild(newOptText);
        courseDatalist.appendChild(newOpt);
      }
      this.getCourseName();
    }
  }


  //Get the name of the course selected
  async getCourseName() {
    let subjectValue = (<HTMLInputElement>document.getElementById("subject-input")).value;
    let courseValue = (<HTMLInputElement>document.getElementById("course-input")).value;

    //If no values are entered
    if((subjectValue == undefined || subjectValue == "") &&
       (courseValue == undefined || courseValue == "")) {
       return;
    }

    let results = await this.httpService.getTimetableEntry(subjectValue, courseValue);
    if(results.message == "SUCCESS") {
      (<HTMLInputElement>document.getElementById("selected-course")).innerText = results.content[0].className;
    }
    else {
      (<HTMLInputElement>document.getElementById("selected-course")).innerText = ""
    }
  }


  //On initialization
  async ngOnInit() {
    //Check if the user is allowed to access this page
    //If the locally stored token is invalid/empty/unaccepted then redirect to the login page
    let result = await this.httpService.checkUserVerification(localStorage.wtToken);
    if(result.message != "SUCCESS") {
      alert("You must log in for this functionality");
      localStorage.wtToken = "";
      window.location.replace('/login');   //Redirect to login
    }
    //Else, load up the details of the page
    else {
      //Fill the select course form
      let results = await this.httpService.getAllSubjectCodes(); //HTTP request
      let subjectList = results.content;
      let inputSelect = <HTMLInputElement>document.getElementById("subject-input");
      for(let i = 0; i < subjectList.length; i++) {
        let newOpt = document.createElement("option");
        let newOptText = document.createTextNode(subjectList[i]);
        newOpt.appendChild(newOptText);
        inputSelect.appendChild(newOpt);
      }
      this.fillCourselist();
    }
  }


  //Helper functions ---------------------------
  //Empty an element
  emptyElement(element) {
    while(element.firstChild){
      element.removeChild(element.firstChild);
    }
  }

  //Simply clear error messages when any of the forms are clicked
  clearErrors() : void {
    (<HTMLInputElement>document.getElementById("review-errormsg")).innerText = "";
  }

}
