import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-search-course',
  templateUrl: './search-course.component.html',
  styleUrls: ['./search-course.component.css']
})
export class SearchCourseComponent implements OnInit {

  httpService : HttpRequestsService = new HttpRequestsService();

  constructor() { }

  //When the direct search button is pressed
  fillTimetable() {

  }

  //When the keyword search button is pressed
  fillTimetableByKeyword() {
    
  }


  //Fill the optional drop down for the text input field for the selected subject -- Decorative
  async fillCourseDatalist() {
    let subjectValue = (<HTMLInputElement>document.getElementById("subject-input")).value;
    let courseDatalist = <HTMLInputElement>document.getElementById("coursedatalist");    //The datalist
    //Fill the data list, if the subject doesn't exist, don't do anything
    if(subjectValue == '' || subjectValue == null) this.emptyElement(courseDatalist);
    else {
      this.emptyElement(courseDatalist);
      let courses = (await this.httpService.getAllCourseCodes(subjectValue)).content;
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
    let results = await this.httpService.getAllSubjectCodes();
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


  //Helper function, empty a list
  emptyElement(element) {
    while(element.firstChild){
      element.removeChild(element.firstChild);
    }
  }

}
