import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-verified-page',
  templateUrl: './verified-page.component.html',
  styleUrls: ['./verified-page.component.css']
})
export class VerifiedPageComponent implements OnInit {

  httpService : HttpRequestsService = new HttpRequestsService();

  verification_msg = "being verified...";
  isVerified = false;

  constructor() { }

  //Simply redirect to log in page (only available when logged out)
  redirectLogin() {
    window.location.replace('/login');   //Redirect to login
  }

  async ngOnInit() {
    localStorage.wtToken = "";  //Empty the token to keep the site stable
    //Send the verification message
    let verification_token = window.location.search.substring(7); //Trim the ?verify= part of the URL
    let result = (await this.httpService.verifyUserViaToken(verification_token)).message;
    if(result == "SUCCESS") {
      this.isVerified = true;
      this.verification_msg = "verified!";
    }
    else if (result == "ERR_ALREADY_VERIFIED"){
      this.isVerified = true;
      this.verification_msg = "already verified!";
    }
    else {
      this.verification_msg = "not yet verified...";
    }

  }

}
