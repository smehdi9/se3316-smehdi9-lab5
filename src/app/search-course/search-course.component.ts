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
  regexSpecialChars = /^[^<>:/?#@\\/!$&'()*+,;=]*$/;

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
    let results = await this.httpService.getAllSubjectCodes(); //HTTP request
    let subjectList = results.content;
    let inputSelect = <HTMLInputElement>document.getElementById("subject-input");
    let newOpt = document.createElement("option");
    let newOptText = document.createTextNode("");
    newOpt.appendChild(newOptText);
    inputSelect.appendChild(newOpt);
    for(let i = 0; i < subjectList.length; i++) {
      newOpt = document.createElement("option");
      newOptText = document.createTextNode(subjectList[i]);
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

  //Remove all elements with class todelete
  deleteToDeletes() {
    let td = document.getElementsByClassName("todelete");
    for(let i = 0; i < td.length; i++) {
      td[i].parentNode.removeChild(td[i]);
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

    //Add details
    let courseLabel = document.createElement("h2"); textNode = document.createTextNode(item.subject + " " + item.catalog_nbr); courseLabel.appendChild(textNode);
    let classNameLabel = document.createElement("label"); textNode = document.createTextNode(item.className); classNameLabel.appendChild(textNode);
    let sectionLabel = document.createElement("label"); textNode = document.createTextNode(item.class_section); sectionLabel.appendChild(textNode);
    let componentLabel = document.createElement("label"); textNode = document.createTextNode(item.ssr_component); componentLabel.appendChild(textNode);
    let timesLabel = document.createElement("label"); textNode = document.createTextNode("Class Times: " + item.start_time + " - " + item.end_time); timesLabel.appendChild(textNode);
    let daysLabel = document.createElement("label");
    let daysString = "Days: ";
    for(let x = 0; x < item.days.length; x++) daysString += item.days[x] + " ";
    textNode = document.createTextNode(daysString);
    daysLabel.appendChild(textNode);
    let breakTag = document.createElement("br");

    //Add all the details
    listElement.appendChild(courseLabel);
    listElement.appendChild(classNameLabel);
    listElement.appendChild(sectionLabel);
    listElement.appendChild(componentLabel);
    listElement.appendChild(timesLabel);
    listElement.appendChild(daysLabel);
    listElement.appendChild(breakTag);

    let selfReference = this;
    listElement.onclick = async function() {
      selfReference.deleteToDeletes();
      let result = (await selfReference.getTimetableEntry(item.subject, item.catalog_nbr)).content[0];
      let toDeleteDiv = document.createElement("div");
      toDeleteDiv.setAttribute("class", "todelete");

      //Expand the DOM of the list element
      for(let i = 0; i < result.course_info.length; i++) {
        if(result.course_info[i].ssr_component == item.ssr_component) {
          let descriptionP = document.createElement("p"); textNode = document.createTextNode(result.catalog_description); descriptionP.appendChild(textNode);
          let descP = document.createElement("p"); textNode = document.createTextNode(result.course_info[i].descr); descP.appendChild(textNode);
          let classNumLabel = document.createElement("label"); textNode = document.createTextNode("Class Number: " + result.course_info[i].class_nbr); classNumLabel.appendChild(textNode);
          let campusLabel = document.createElement("label"); textNode = document.createTextNode("Campus: " + result.course_info[i].campus); campusLabel.appendChild(textNode);
          let facilityLabel = document.createElement("label"); textNode = document.createTextNode("Facility: " + result.course_info[i].facility_ID); facilityLabel.appendChild(textNode);
          let instLabel = document.createElement("label");
          let instString = "Instructors: ";
          if(result.course_info[i].instructors.length == 0) instString = "Instructors: Not listed";
          for(let x = 0; x < result.course_info[i].instructors.length; x++) instString += result.course_info[i].instructors[x] + ", ";
          textNode = document.createTextNode(instString);
          instLabel.appendChild(textNode);
          let enrollLabel = document.createElement("label"); textNode = document.createTextNode("STATUS: " + result.course_info[i].enrl_stat); enrollLabel.appendChild(textNode);
          toDeleteDiv.appendChild(classNumLabel);
          toDeleteDiv.appendChild(campusLabel);
          toDeleteDiv.appendChild(facilityLabel);
          toDeleteDiv.appendChild(instLabel);
          toDeleteDiv.appendChild(descriptionP);
          toDeleteDiv.appendChild(descP);
          toDeleteDiv.appendChild(enrollLabel);
          listElement.appendChild(toDeleteDiv);
          listElement.appendChild(breakTag);
          //listElement.onclick = selfReference.deleteToDeletes();

          //Get all reviews
          let resultRev = await selfReference.httpService.getReviewList(item.subject, item.catalog_nbr);
          //If reviews exist, add DOM
          if(resultRev.message == "SUCCESS") {
            let reviewTitle = document.createElement("h3"); textNode = document.createTextNode("All user reviews:"); reviewTitle.appendChild(textNode);
            toDeleteDiv.appendChild(reviewTitle);
            let review_list = resultRev.content;
            //For all reviews, add to the div
            for(let j = 0; j < review_list.length; j++) {
              let reviewDiv = document.createElement("div");
              reviewDiv.setAttribute("class", "review-item");
              let userLabel = document.createElement("p"); textNode = document.createTextNode("Created by: " + review_list[j].username); userLabel.appendChild(textNode);
              let dateLabel = document.createElement("p"); textNode = document.createTextNode("Date created: " + (new Date(review_list[j].created)).toString()); dateLabel.appendChild(textNode);
              let italics = document.createElement("i"); let reviewP = document.createElement("p"); textNode = document.createTextNode("\"" + review_list[j].review + "\""); italics.appendChild(textNode); reviewP.appendChild(italics);
              reviewDiv.appendChild(userLabel);
              reviewDiv.appendChild(dateLabel);
              reviewDiv.appendChild(reviewP);
              toDeleteDiv.appendChild(reviewDiv);
            }
          }
          else {
            let reviewTitle = document.createElement("h3"); textNode = document.createTextNode("No reviews found"); reviewTitle.appendChild(textNode);
            toDeleteDiv.appendChild(reviewTitle);
          }
          return;
        }
      }
    };

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

    ul.appendChild(listElement);
  }

  //Get the specific timetable entry for the given subject/course pair
  async getTimetableEntry(subject : String, catalog_nbr : String) {
    return await this.httpService.getTimetableEntry(subject, catalog_nbr);
  }

}
