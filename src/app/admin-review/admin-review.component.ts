import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-admin-review',
  templateUrl: './admin-review.component.html',
  styleUrls: ['./admin-review.component.css']
})
export class AdminReviewComponent implements OnInit {

  //HTTP service
  httpService : HttpRequestsService = new HttpRequestsService();

  constructor() { }

  async ngOnInit() {
    //Ensure that the user is an admin user.
    let result = await this.httpService.checkAdminUser(localStorage.wtToken);
    if(result.message != "SUCCESS") {
      alert("You must be an admin for this functionality");
      //Redirect to user panel (if not logged in, user panel will automatically relocate to log in)
      window.location.replace('/user');
    }
    //If admin user, then prepare page
    else {
      //Get all reviews
      let resultRev = await this.httpService.getAllReviews();
      let textNode = document.createTextNode("");
      //If reviews exist, add DOM
      if(resultRev.message == "SUCCESS") {
        let reviewTitle = document.createElement("h3"); textNode = document.createTextNode("All user reviews:"); reviewTitle.appendChild(textNode);
        (<HTMLInputElement>document.getElementById("reviews")).appendChild(reviewTitle);
        let review_list = resultRev.content;
        //For all reviews, add to the div
        for(let j = 0; j < review_list.length; j++) {
          let reviewDiv = document.createElement("div");
          reviewDiv.setAttribute("class", "review-item");
          let courseLabel = document.createElement("h2"); textNode = document.createTextNode(review_list[j].subject + " " + review_list[j].catalog_nbr); courseLabel.appendChild(textNode);
          let userLabel = document.createElement("p"); textNode = document.createTextNode("Created by: " + review_list[j].author); userLabel.appendChild(textNode);
          let dateLabel = document.createElement("p"); textNode = document.createTextNode("Date created: " + (new Date(review_list[j].created)).toString()); dateLabel.appendChild(textNode);
          let italics = document.createElement("i"); let reviewP = document.createElement("p"); textNode = document.createTextNode("\"" + review_list[j].review + "\""); italics.appendChild(textNode); reviewP.appendChild(italics);
          let hiddenLabel = document.createElement("p"); textNode = document.createTextNode("Tap to toggle hidden: " + review_list[j].hidden); hiddenLabel.appendChild(textNode);
          reviewDiv.appendChild(courseLabel);
          reviewDiv.appendChild(userLabel);
          reviewDiv.appendChild(dateLabel);
          reviewDiv.appendChild(reviewP);
          reviewDiv.appendChild(hiddenLabel);
          let selfReference = this;
          reviewDiv.onclick = async function() {
            let result = await selfReference.httpService.toggleReviewStatus(review_list[j].subject, review_list[j].catalog_nbr, review_list[j].author);
            if(result.message == "SUCCESS") location.reload();
          }
          let mainDiv = <HTMLInputElement>document.getElementById("reviews");
          mainDiv.appendChild(reviewDiv);
        }
      }
    }
  }

}
