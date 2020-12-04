import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {

  //HTTP service
  httpService : HttpRequestsService = new HttpRequestsService();

  users = [];

  //Dont show (set admin) button if already admin
  notAdminUser = true;
  //Toggle between activate and deactivate
  disabledUser = false;

  //Modify the user using the back-end http requests -----

  async setUserAdmin() {
    let userVal = (<HTMLInputElement>document.getElementById("user-input")).value;
    let result = await this.httpService.promoteUser(userVal);
    if(result.message == "SUCCESS") {
      alert("Promoted user to admin");
      return;
    }
    else if (result.message == "ERR_ALREADY_ADMIN"){
      (<HTMLInputElement>document.getElementById("user-errormsg")).innerText = "User is already admin.";
    }
    else {
      (<HTMLInputElement>document.getElementById("user-errormsg")).innerText = "Something went wrong";
    }
  }

  async activateUser() {
    let userVal = (<HTMLInputElement>document.getElementById("user-input")).value;
    let result = await this.httpService.activateUser(userVal);
    if(result.message == "SUCCESS") {
      alert("Activated user");
      return;
    }
    else {
      (<HTMLInputElement>document.getElementById("user-errormsg")).innerText = "Something went wrong";
    }
  }

  async deactivateUser() {
    let userVal = (<HTMLInputElement>document.getElementById("user-input")).value;
    console.log(userVal);
    let result = await this.httpService.deactivateUser(userVal);
    if(result.message == "SUCCESS") {
      alert("Deactivated user");
      return;
    }
    else if(result.message == "ERR_DENIED") {
      (<HTMLInputElement>document.getElementById("user-errormsg")).innerText = "Cannot deactivate this user";
    }
    else {
      (<HTMLInputElement>document.getElementById("user-errormsg")).innerText = "Something went wrong";
    }
  }
  //----------------------------------------------------------

  constructor() { }

  //Reset the local values given the array of users (no HTTP access)
  setLocalVals() {
    let userVal = (<HTMLInputElement>document.getElementById("user-input")).value;
    for(let i = 0; i < this.users.length; i++) {
      if(this.users[i].email == userVal) {
        this.notAdminUser = !this.users[i].admin;
        this.disabledUser = this.users[i].disabled;
      }
    }
  }

  //Simply clear error messages when any of the forms are clicked
  clearErrors() : void {
    (<HTMLInputElement>document.getElementById("user-errormsg")).innerText = "";
  }

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
      let resultUser = await this.httpService.getListUsers();
      if(resultUser.message != "SUCCESS") {
        alert("There was an error!");
        //Redirect to user panel (if not logged in, user panel will automatically relocate to log in)
        window.location.replace('/user');
      }
      else {
        let user_list = resultUser.content;
        this.users = user_list;
        let usersDropDown = <HTMLInputElement>document.getElementById("user-input");
        let textNode = document.createTextNode("");
        for(let i = 0; i < user_list.length; i++) {
          let userOpt = document.createElement("option"); textNode = document.createTextNode(user_list[i].username); userOpt.appendChild(textNode);
          userOpt.setAttribute("value", user_list[i].email);
          console.log(userOpt.value);
          usersDropDown.appendChild(userOpt);
        }
        this.setLocalVals();
      }
    }
  }

}
