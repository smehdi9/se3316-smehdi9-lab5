import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-admin-dmca',
  templateUrl: './admin-dmca.component.html',
  styleUrls: ['./admin-dmca.component.css']
})
export class AdminDmcaComponent implements OnInit {

  //HTTP service
  httpService : HttpRequestsService = new HttpRequestsService();
  //Regex for DMCA
  regexDMCA = /^[^<>/?#@\\/!$&'*+;=]*$/;

  constructor() { }

  async updateDMCA() {
    let dmcaVal = (<HTMLInputElement>document.getElementById("dmca-policy-input")).value;
    let aupVal = (<HTMLInputElement>document.getElementById("aup-policy-input")).value;
    let takedownVal = (<HTMLInputElement>document.getElementById("takedown-policy-input")).value;

    if(dmcaVal == "" || dmcaVal == undefined || !dmcaVal.match(this.regexDMCA) ||
       aupVal == "" || aupVal == undefined || !aupVal.match(this.regexDMCA) ||
       takedownVal == "" || takedownVal == undefined || !takedownVal.match(this.regexDMCA)) {
      alert("Improper input! DMCA Policies must not have invalid characters");
      return;
    }

    //Pass the DMCA policies to the back-end.
    let result = await this.httpService.updateDMCA(dmcaVal, aupVal, takedownVal);
    if(result.message == "SUCCESS") {
      alert("DMCA Policies were updated");
    } else {
      alert("DMCA Policies were NOT updated. Error occurred");
    }
  }

  //Initialize the forms with the existing DMCA fields
  async ngOnInit() {
    //Ensure that the user is an admin user.
    let result = await this.httpService.checkAdminUser(localStorage.wtToken);
    if(result.message != "SUCCESS") {
      alert("You must be an admin for this functionality");
      //Redirect to user panel (if not logged in, user panel will automatically relocate to log in)
      window.location.replace('/user');
    }
    //Fill DMCA forms with existing DMCA data to be updated
    else {
      let result = await this.httpService.getDMCA();
      if(result.message == "SUCCESS") {
        (<HTMLInputElement>document.getElementById("dmca-policy-input")).innerText = result.dmca_policy;
        (<HTMLInputElement>document.getElementById("aup-policy-input")).innerText = result.aup_policy;
        (<HTMLInputElement>document.getElementById("takedown-policy-input")).innerText = result.takedown_policy;
      }
    }
  }

}
