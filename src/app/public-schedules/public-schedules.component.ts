import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-public-schedules',
  templateUrl: './public-schedules.component.html',
  styleUrls: ['./public-schedules.component.css']
})
export class PublicSchedulesComponent implements OnInit {

  //HTTP service
  httpService : HttpRequestsService = new HttpRequestsService();

  constructor() { }

  //Refresh page
  resetPage() {
    location.reload();
  }

  //The user will not directly interract with this menu, hence, not much input is needed.
  async ngOnInit() {
    /*Race conditions do not matter as changes in schedule publicity will only affect once this page is reloaded.
      The expansion to show internal course data for a given schedule does NOT depend on the current status of the schedule's publicity*/
    let result = await this.httpService.getPublicSchedules();
    if(result.message == "SUCCESS") {
      let scheduleObj = result.content;
      for(let j = 0; j < scheduleObj.length; j++) {
        //this.emptyElement(document.getElementById("display-container"));
        //Add the schedule to a DOM
        let containerDiv = document.createElement("div");
        let scheduleDisplay = document.createElement("div");
        containerDiv.setAttribute("class", "schedule-display");
        let textNode = document.createTextNode("");

        //Add details
        let nameLabel = document.createElement("h2"); textNode = document.createTextNode(scheduleObj[j].name); nameLabel.appendChild(textNode);
        let descriptionP = document.createElement("p"); textNode = document.createTextNode("Description: " + scheduleObj[j].description); descriptionP.appendChild(textNode);
        let authorLabel = document.createElement("p");
        //if(scheduleObj[j].public) textNode = document.createTextNode("Public");
        textNode = document.createTextNode(scheduleObj[j].author);
        authorLabel.appendChild(textNode);
        let editedLabel = document.createElement("p"); textNode = document.createTextNode("Last Edited: " + (new Date(scheduleObj[j].edited)).toString()); editedLabel.appendChild(textNode);
        let numCoursesLabel = document.createElement("p"); textNode = document.createTextNode(scheduleObj[j].course_list.length + " course(s)"); numCoursesLabel.appendChild(textNode);

        scheduleDisplay.appendChild(nameLabel);
        //scheduleDisplay.appendChild(publicityLabel);
        scheduleDisplay.appendChild(editedLabel);
        scheduleDisplay.appendChild(numCoursesLabel);
        scheduleDisplay.appendChild(descriptionP);
        scheduleDisplay.appendChild(authorLabel);
        let instructionP = document.createElement("h4"); textNode = document.createTextNode("Click on this panel to expand"); instructionP.appendChild(textNode);
        scheduleDisplay.appendChild(instructionP);

        containerDiv.appendChild(scheduleDisplay)
        document.getElementById("display-container").appendChild(containerDiv);

        //If the panel is clicked, show all time table data
        let selfReference = this;
        containerDiv.onclick = async function() {
          //Delete existing DOM
          let containersArray = document.getElementById("display-container").getElementsByClassName("schedule-display");
          for(let m = 0; m < containersArray.length; m++) {
            let elementsArray = containersArray[m].getElementsByClassName("blocks");
            for(let o = 0; o < elementsArray.length; o++) {
              containersArray[m].removeChild(elementsArray[o]);
            }
          }


          let list_pairs = scheduleObj[j].course_list;
          let result_search = await selfReference.httpService.getEntriesForArray(list_pairs);
          if(result_search.message != "SUCCESS") {
            return;
          }
          let course_list = result_search.content;
          let resultsUL = document.createElement("ul");
          let resultsDiv = document.createElement("div");
          resultsDiv.setAttribute("class", "blocks");
          resultsDiv.appendChild(resultsUL);
          containerDiv.appendChild(resultsDiv);
          for(let i = 0; i < course_list.length; i++) {
            let listElement = document.createElement("li");
            let textNode = document.createTextNode("");

            //Add details
            let courseLabel = document.createElement("h2"); textNode = document.createTextNode(course_list[i].subject + " " + course_list[i].catalog_nbr); courseLabel.appendChild(textNode);
            let classNameLabel = document.createElement("label"); textNode = document.createTextNode(course_list[i].className); classNameLabel.appendChild(textNode);
            let sectionLabel = document.createElement("label"); textNode = document.createTextNode(course_list[i].class_section); sectionLabel.appendChild(textNode);
            let componentLabel = document.createElement("label"); textNode = document.createTextNode(course_list[i].ssr_component); componentLabel.appendChild(textNode);
            let timesLabel = document.createElement("label"); textNode = document.createTextNode("Class Times: " + course_list[i].start_time + " - " + course_list[i].end_time); timesLabel.appendChild(textNode);
            let daysLabel = document.createElement("label");
            let daysString = "Days: ";
            for(let x = 0; x < course_list[i].days.length; x++) daysString += course_list[i].days[x] + " ";
            textNode = document.createTextNode(daysString);
            daysLabel.appendChild(textNode);
            let italics = document.createElement("i"); let descLabel = document.createElement("p"); textNode = document.createTextNode(course_list[i].description); italics.appendChild(textNode); descLabel.appendChild(italics);
            let breakTag = document.createElement("br");

            //Add all the details
            listElement.appendChild(courseLabel);
            listElement.appendChild(classNameLabel);
            listElement.appendChild(sectionLabel);
            listElement.appendChild(componentLabel);
            listElement.appendChild(timesLabel);
            listElement.appendChild(daysLabel);
            listElement.appendChild(descLabel);
            listElement.appendChild(breakTag);

            //This will help with color coding :/
            if(course_list[i].ssr_component == "LAB") {
              listElement.setAttribute("class", "lab");
            }
            else if(course_list[i].ssr_component == "TUT") {
              listElement.setAttribute("class", "tut");
            }
            else {
              listElement.setAttribute("class", "lec");
            }

            resultsUL.appendChild(listElement);
          }
        }
      }
    }
  }

}
