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
      let newOptText = document.createTextNode(subjectList[i].subject);
      newOpt.appendChild(newOptText);
      inputSelect.appendChild(newOpt);
    }
  }

}
