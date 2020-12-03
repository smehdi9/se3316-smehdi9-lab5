import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-edit-schedules',
  templateUrl: './edit-schedules.component.html',
  styleUrls: ['./edit-schedules.component.css']
})
export class EditSchedulesComponent implements OnInit {

  //HTTP service
  httpService : HttpRequestsService = new HttpRequestsService();

  constructor() { }


  //When a subject and course code is selected
  async fillTimetable() {
    let subjectValue = (<HTMLInputElement>document.getElementById("subject-input")).value;
    let courseValue = (<HTMLInputElement>document.getElementById("course-input")).value;

    //If no values are entered, don't search (TOO many results :/ ) or if incorrect input is entered
    if((subjectValue == undefined || subjectValue == "") &&
       (courseValue == undefined || courseValue == "")) {
       return;
    }
    //Get array of results
    let results = await this.httpService.getResultsFromQuery(subjectValue, courseValue, undefined);
    //Add to DOM
    if(results.message == "SUCCESS") {
      //Fill the UL with the results
      let resultsUL = <HTMLInputElement>document.getElementById("resultlist");
      this.emptyElement(resultsUL);
      let contentData = results.content;
      for(let i = 0; i < contentData.length; i++) {
        this.addResultULItem(resultsUL, contentData[i]);
      }
    }
    else {
      this.emptyElement(<HTMLInputElement>document.getElementById("resultlist"));
      (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Course not found";
    }
  }


  //Fill the optional drop down for the text input field for the selected subject -- Decorative
  async fillCourselist() {
    let subjectValue = (<HTMLInputElement>document.getElementById("subject-input")).value;
    let courseDatalist = <HTMLInputElement>document.getElementById("course-input");    //The datalist
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
    }
    this.fillTimetable();
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
    //Otherwise, fill the appropriate data (fill subject drop down and user's schedules drop down)
    else {
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
    (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "";
  }

  //Add time table LI to UL
  addResultULItem(ul, item) : void {
    let listElement = document.createElement("li");
    let textNode = document.createTextNode("");
    //Add button
    let buttonElementDet = document.createElement("button");
    buttonElementDet.setAttribute("id", "ADD " + item.subject + " " + item.catalog_nbr);
    textNode = document.createTextNode("ADD"); buttonElementDet.appendChild(textNode);
    buttonElementDet.setAttribute("class", "form-button");
    listElement.appendChild(buttonElementDet);

    //Add details
    let courseLabel = document.createElement("label"); textNode = document.createTextNode(item.subject + " " + item.catalog_nbr); courseLabel.appendChild(textNode);
    let classNameLabel = document.createElement("label"); textNode = document.createTextNode(item.className); classNameLabel.appendChild(textNode);
    let breakTag = document.createElement("br");

    listElement.appendChild(courseLabel);
    listElement.appendChild(classNameLabel);
    listElement.appendChild(breakTag);

    //This will help with color coding :/
    if(item.ssr_component == "LAB") {
      listElement.setAttribute("class", "lab");
    }
    else if(item.ssr_component == "TUT") {
      listElement.setAttribute("class", "tut");
    }
    else {
      listElement.setAttribute("class", "lec");
    }
    //If the course is not full, allow it to be added to course schedule
    // let selfReference = this;
    // if(item.course_info[x].enrl_stat == "Not full") {
    //   buttonElement.onclick = function() {
    //     let idArr = buttonElement.id.split(" ");
    //     let subjectID = idArr[1]; let courseID = idArr[2];
    //     selfReference.addCourseToSchedule(subjectID, courseID);
    //   };
    //   buttonElement.setAttribute("class", "add");
    //   buttonElement.disabled = false;
    // }
    // buttonElementDet.onclick = function() {
    //   let idArr = buttonElement.id.split(" ");
    //   let subjectID = idArr[1]; let courseID = idArr[2];
    //   selfReference.showDetails(subjectID, courseID);
    // };
    ul.appendChild(listElement);
  }
}
