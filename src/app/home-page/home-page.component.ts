import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {

  //HTTP service
  httpService : HttpRequestsService = new HttpRequestsService();

  isSignedOut = true;
  title = "Western Timetable";

  constructor() { }

  //Simply redirect to log in page (only available when logged out)
  redirectLogin() {
    window.location.replace('/login');   //Redirect to login
  }


  async ngOnInit() {
    //If the user is already logged in,
    if(localStorage.wtToken != "" || localStorage.wtToken != undefined) {
      let result = await this.httpService.checkUserVerification(localStorage.wtToken);
      if(result.message == "SUCCESS") {
        this.isSignedOut = false;
      }
      else {
        localStorage.wtToken = "";
      }
    }
  }

}
