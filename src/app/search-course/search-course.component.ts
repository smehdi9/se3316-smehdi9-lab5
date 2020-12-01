import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-search-course',
  templateUrl: './search-course.component.html',
  styleUrls: ['./search-course.component.css']
})
export class SearchCourseComponent implements OnInit {

  //HTTP service
  httpService : HttpRequestsService = new HttpRequestsService();
  //Proper input format
  regexSpecialChars = /^[^<>:/?#@.!$&'()*+,;=]*$/;

  constructor() { }

  //When the direct search button is pressed
  async fillTimetable() {
    let subjectValue = (<HTMLInputElement>document.getElementById("subject-input")).value;
    let courseValue = (<HTMLInputElement>document.getElementById("course-input")).value;
    let componentValue = (<HTMLInputElement>document.getElementById("component-input")).value;

    //If no values are entered, don't search (TOO many results :/ ) or if incorrect input is entered
    if((subjectValue == undefined || subjectValue == "") &&
       (courseValue == undefined || courseValue == "" || !courseValue.match(this.regexSpecialChars)) &&
       (componentValue == undefined || componentValue == "NULL")) {
       return;
    }
    //Get array of results
    let results = await this.httpService.getResultsFromQuery(subjectValue, courseValue, componentValue);
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
      (<HTMLInputElement>document.getElementById("query-errormsg")).innerText = "Course not found";
    }
  }


  //When the keyword search button is pressed
  async fillTimetableByKeyword() {
    let keywordsVal = (<HTMLInputElement>document.getElementById("keyword-input")).value;

    //Ensure valid input
    if(keywordsVal.length < 1 || keywordsVal.length > 50 || !keywordsVal.match(this.regexSpecialChars)) {
      (<HTMLInputElement>document.getElementById("keyword-errormsg")).innerText = "Improper input";
    }
    else {
      //Get array of results
      let results = await this.httpService.getResultsFromKeyword(keywordsVal);
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
        (<HTMLInputElement>document.getElementById("keyword-errormsg")).innerText = "Course not found";
      }
    }
  }


  //Fill the optional drop down for the text input field for the selected subject -- Decorative
  async fillCourseDatalist() {
    let subjectValue = (<HTMLInputElement>document.getElementById("subject-input")).value;
    let courseDatalist = <HTMLInputElement>document.getElementById("coursedatalist");    //The datalist
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
  }

  //On init: Fill the subject codes drop down
  async ngOnInit() {
    //window.location.replace('/home');
    let results = await this.httpService.getAllSubjectCodes(); //HTTP request
    let subjectList = results.content;
    let inputSelect = <HTMLInputElement>document.getElementById("subject-input");
    let newOpt = document.createElement("option");
    let newOptText = document.createTextNode("");
    newOpt.appendChild(newOptText);
    inputSelect.appendChild(newOpt);
    for(let i = 0; i < subjectList.length; i++) {
      let newOpt = document.createElement("option");
      let newOptText = document.createTextNode(subjectList[i]);
      newOpt.appendChild(newOptText);
      inputSelect.appendChild(newOpt);
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
    (<HTMLInputElement>document.getElementById("query-errormsg")).innerText = "";
    (<HTMLInputElement>document.getElementById("keyword-errormsg")).innerText = "";
  }

  //Add time table LI to UL
  addResultULItem(ul, item) : void {
    let listElement = document.createElement("li");
    let textNode = document.createTextNode("");
    //Add button
    let buttonElementDet = document.createElement("button");
    buttonElementDet.setAttribute("id", "DETAILS " + item.subject + " " + item.catalog_nbr);
    textNode = document.createTextNode("DETAILS"); buttonElementDet.appendChild(textNode);
    buttonElementDet.setAttribute("class", "form-button");
    listElement.appendChild(buttonElementDet);

    //Add details
    let subjectLabel = document.createElement("label"); textNode = document.createTextNode(item.subject); subjectLabel.appendChild(textNode);
    let courseLabel = document.createElement("label"); textNode = document.createTextNode(item.catalog_nbr); courseLabel.appendChild(textNode);
    let classNameLabel = document.createElement("label"); textNode = document.createTextNode(item.className); classNameLabel.appendChild(textNode);
    let sectionLabel = document.createElement("label"); textNode = document.createTextNode(item.class_section); sectionLabel.appendChild(textNode);
    let componentLabel = document.createElement("label"); textNode = document.createTextNode(item.ssr_component); componentLabel.appendChild(textNode);
    let startLabel = document.createElement("label"); textNode = document.createTextNode(item.start_time); startLabel.appendChild(textNode);
    let endLabel = document.createElement("label"); textNode = document.createTextNode(item.end_time); endLabel.appendChild(textNode);
    let daysLabel = document.createElement("label");
    let daysString = "";
    for(let x = 0; x < item.days.length; x++) daysString += item.days[x] + " ";
    textNode = document.createTextNode(daysString);
    daysLabel.appendChild(textNode);

    listElement.appendChild(subjectLabel);
    listElement.appendChild(courseLabel);
    listElement.appendChild(classNameLabel);
    listElement.appendChild(sectionLabel);
    listElement.appendChild(componentLabel);
    listElement.appendChild(startLabel);
    listElement.appendChild(endLabel);
    listElement.appendChild(daysLabel);

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
