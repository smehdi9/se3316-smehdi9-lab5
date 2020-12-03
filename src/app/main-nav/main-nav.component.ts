import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.css']
})
export class MainNavComponent implements OnInit {

  loggedIn = false;

  //HTTP service
  httpService : HttpRequestsService = new HttpRequestsService();

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver) {

  }

  //Remove User tab if not logged in
  async ngOnInit() {
    //If the user is already logged in,
    if(localStorage.wtToken != "" || localStorage.wtToken != undefined) {
      let result = await this.httpService.checkUserVerification(localStorage.wtToken);
      if(result.message == "SUCCESS") {
        this.loggedIn = true;
      }
      else {
        this.loggedIn = false;
        localStorage.wtToken = "";
      }
    }
    else {
      this.loggedIn = false;
    }
  }

}
