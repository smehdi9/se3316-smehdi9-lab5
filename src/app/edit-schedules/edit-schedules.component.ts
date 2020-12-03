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

  //This list is temporarily stored on the front end. It is used to replace the existing list on the back ends
  coursesToUpdate = [];
  //Input regex
  regexSpecialChars = /^[^<>:/?#@.!$&'()*+,;=]*$/;

  //If an existing schedule is select = true, if the option to add new schedule is selected = false
  selectedSchedule : boolean = false;

  constructor() { }

  //If the selected option on the schedule drop down is changed.
  async changedScheduleSelect() {
    let scheduleDropDownInput = (<HTMLInputElement>document.getElementById("schedule-dropdown")).value;
    if(scheduleDropDownInput == "<") {
      this.selectedSchedule = false;
      this.emptyElement(document.getElementById("display-container"));
      document.getElementById("display-container").setAttribute("class", "");
    }
    else {
      this.selectedSchedule = true;
      let result = await this.httpService.getScheduleByName(scheduleDropDownInput);
      if(result.message == "SUCCESS") {
        let scheduleObj = result.content;
        this.emptyElement(document.getElementById("display-container"));
        //Add the schedule to a DOM
        let scheduleDisplay = document.createElement("div");
        document.getElementById("display-container").setAttribute("class", "schedule-display");
        let textNode = document.createTextNode("");

        //Add details
        let nameLabel = document.createElement("h2"); textNode = document.createTextNode(scheduleObj.name); nameLabel.appendChild(textNode);
        let descriptionP = document.createElement("p"); textNode = document.createTextNode("Description: " + scheduleObj.description); descriptionP.appendChild(textNode);
        let publicityLabel = document.createElement("p");
        if(scheduleObj.public) textNode = document.createTextNode("Public");
        else textNode = document.createTextNode("Private");
        publicityLabel.appendChild(textNode);
        let editedLabel = document.createElement("p"); textNode = document.createTextNode("Last Edited: " + Date(scheduleObj.edited).toString()); editedLabel.appendChild(textNode);
        let numCoursesLabel = document.createElement("p"); textNode = document.createTextNode(scheduleObj.course_list.length + " course(s)"); numCoursesLabel.appendChild(textNode);

        //Set the courses to update array
        this.coursesToUpdate = scheduleObj.course_list;
        this.updateTempList();

        scheduleDisplay.appendChild(nameLabel);
        scheduleDisplay.appendChild(publicityLabel);
        scheduleDisplay.appendChild(editedLabel);
        scheduleDisplay.appendChild(numCoursesLabel);
        scheduleDisplay.appendChild(descriptionP);
        document.getElementById("display-container").appendChild(scheduleDisplay);
      }
      else {
        (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Something went wrong";
        console.log("Something went wrong :(");
      }
    }
  }


  //When a subject and course code is selected
  addCourseToTempList() {
    let subjectValue = (<HTMLInputElement>document.getElementById("subject-input")).value;
    let courseValue = (<HTMLInputElement>document.getElementById("course-input")).value;

    //If no values are entered
    if((subjectValue == undefined || subjectValue == "") &&
       (courseValue == undefined || courseValue == "")) {
       return;
    }
    //Add to DOM - Skip duplicates
    for(let i = 0; i < this.coursesToUpdate.length; i++) {
      if(this.coursesToUpdate[i].subject == subjectValue && this.coursesToUpdate[i].catalog_nbr == courseValue) {
        return;
      }
    }
    this.coursesToUpdate.push({
      "subject": subjectValue,
      "catalog_nbr": courseValue
    });
    this.updateTempList();
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


  //Add a new schedule
  async addNewSchedule() {
    let newNameInput = (<HTMLInputElement>document.getElementById("new-name-input")).value;
    let descInput = (<HTMLInputElement>document.getElementById("description-input")).value;

    //Input validation
    if(newNameInput.length < 2 || newNameInput.length > 20) {
      (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Name must be 2-20 characters";
      return;
    }
    else if(descInput.length > 50) {
      (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Description must be 50 characters max";
      return;
    }
    else if (!newNameInput.match(this.regexSpecialChars) || !descInput.match(this.regexSpecialChars)) {
      (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Input fields may have illegal characters";
      return;
    }

    let result = await this.httpService.createNewSchedule(newNameInput, descInput, this.coursesToUpdate);    //The course list will be gotten directly from coursesToUpdate array

    if(result.message == "SUCCESS") {
      alert("Schedule added");
    }
    else {
      (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Something went wrong";
    }
    //Refresh page
    ngOnInit();
  }


  //Edit an existing schedule
  async addNewSchedule() {
    let nameInput = (<HTMLInputElement>document.getElementById("schedule-dropdown")).value;
    let newNameInput = (<HTMLInputElement>document.getElementById("new-name-input")).value;
    let descInput = (<HTMLInputElement>document.getElementById("description-input")).value;
    let publicInput = (<HTMLInputElement>document.getElementById("public-input")).checked;     //Boolean

    //Input validation
    if(newNameInput.length < 2 || newNameInput.length > 20) {
      (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Name must be 2-20 characters";
      return;
    }
    else if(descInput.length > 50) {
      (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Description must be 50 characters max";
      return;
    }
    else if (!newNameInput.match(this.regexSpecialChars) || !descInput.match(this.regexSpecialChars) || !!nameInput.match(this.regexSpecialChars)) {
      (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Input fields may have illegal characters";
      return;
    }

    //The checkbox will always return either true or false in our code
    let result = await this.httpService.createNewSchedule(nameInput, newNameInput, descInput, publicInput, this.coursesToUpdate);    //The course list will be gotten directly from coursesToUpdate array

    if(result.message == "SUCCESS") {
      alert("Schedule modified");
    }
    else {
      (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Something went wrong";
    }
    //Refresh page
    ngOnInit();
  }


  //Delete a schedule
  async deleteSchedule() {
    let scheduleDropDownInput = (<HTMLInputElement>document.getElementById("schedule-dropdown")).value;
    if(scheduleDropDownInput == "<") {      //This should not happen anyway
      return;
    }
    else {
      //Ask for final confirmation
      if(confirm("Are you sure? Ok to confirm")) {
        let result = (await this.httpService.deleteScheduleByName(scheduleDropDownInput)).message;
        if(result == "SUCCESS") {
          alert(scheduleDropDownInput + " successfully deleted");
        } else {
          (<HTMLInputElement>document.getElementById("schedule-errormsg")).innerText = "Something went wrong";
        }
      }
      //Refresh page
      ngOnInit();
    }
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

      //Fill the schedule drop down
      let schedules = (await this.httpService.getScheduleNamesForUser()).content;
      let scheduleDropDown = <HTMLInputElement>document.getElementById("schedule-dropdown");
      this.emptyElement(scheduleDropDown);
      let newOpt = document.createElement("option");
      let newOptText = document.createTextNode("ADD NEW SCHEDULE");
      newOpt.setAttribute("value", "<");
      newOpt.appendChild(newOptText);
      scheduleDropDown.appendChild(newOpt);
      for(let i = 0; i < schedules.length; i++) {
        newOpt = document.createElement("option");
        newOptText = document.createTextNode(schedules[i]);
        newOpt.appendChild(newOptText);
        scheduleDropDown.appendChild(newOpt);
      }

      //Fill DOMs
      this.updateTempList();
      this.getCourseName()
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
    let buttonElement = document.createElement("button");
    textNode = document.createTextNode("ADD"); buttonElement.appendChild(textNode);
    buttonElement.setAttribute("class", "form-button");
    listElement.appendChild(buttonElement);

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

    //Add the listed course to the temporary list on the front end.
    let selfReference = this;
    buttonElement.onclick = function() {
      //Skip duplicates
      for(let i = 0; i < selfReference.coursesToUpdate.length; i++) {
        if(selfReference.coursesToUpdate[i].subject == item.subject && selfReference.coursesToUpdate[i].catalog_nbr == item.catalog_nbr) {
          return;
        }
      }
      selfReference.coursesToUpdate.push({
        "subject": item.subject,
        "catalog_nbr": item.catalog_nbr
      });
      selfReference.updateTempList();
    };
    ul.appendChild(listElement);
  }

  //Update so that whatever is in the coursesToUpdate array is added to it's DOM list
  updateTempList() {
    let toAddUL = document.getElementById("to-add-list");
    this.emptyElement(toAddUL);
    if(this.coursesToUpdate.length == 0) {
      let newLabel = document.createElement("label");
      let textNode = document.createTextNode("Empty List");
      newLabel.appendChild(textNode);
      toAddUL.appendChild(newLabel);
    }
    else {
      for(let i = 0; i < this.coursesToUpdate.length; i++) {
        let listElement = document.createElement("li");
        let buttonElement = document.createElement("button");
        let textNode = document.createTextNode("REMOVE"); buttonElement.appendChild(textNode);
        buttonElement.setAttribute("class", "remove-button");

        //Add details
        let courseLabel = document.createElement("label"); textNode = document.createTextNode(this.coursesToUpdate[i].subject + " " + this.coursesToUpdate[i].catalog_nbr); courseLabel.appendChild(textNode);
        listElement.appendChild(courseLabel);
        listElement.appendChild(buttonElement);
        let breakTag = document.createElement("br");
        listElement.appendChild(breakTag);
        toAddUL.appendChild(listElement);

        //Remove the listed course from the temporary list on the front end.
        let selfReference = this;
        buttonElement.onclick = function() {
          selfReference.coursesToUpdate.splice(i, 1);
          selfReference.updateTempList();
        };
      }
    }
  }
}
