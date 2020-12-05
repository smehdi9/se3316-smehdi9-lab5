import { Component, OnInit } from '@angular/core';
import { HttpRequestsService } from '../http-requests.service';

@Component({
  selector: 'app-dmca-panel',
  templateUrl: './dmca-panel.component.html',
  styleUrls: ['./dmca-panel.component.css']
})
export class DmcaPanelComponent implements OnInit {

  httpService : HttpRequestsService = new HttpRequestsService();

  constructor() { }

  async submitDMCANotice() {
    let notice = (<HTMLInputElement>document.getElementById("notice-input")).value;
    if(notice.length < 10) return;

    let result = await this.httpService.submitDMCANotice(notice);

    alert(result.message);
    window.location.replace('/home');
  }

  ngOnInit(): void {
  }

}
