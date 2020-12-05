import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MainNavComponent } from './main-nav/main-nav.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { HomePageComponent } from './home-page/home-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { HttpRequestsService } from './http-requests.service';
import { SearchCourseComponent } from './search-course/search-course.component';
import { UserPanelComponent } from './user-panel/user-panel.component';
import { EditSchedulesComponent } from './edit-schedules/edit-schedules.component';
import { ReviewPanelComponent } from './review-panel/review-panel.component';
import { UserSettingsComponent } from './user-settings/user-settings.component';
import { VerifiedPageComponent } from './verified-page/verified-page.component';
import { AdminReviewComponent } from './admin-review/admin-review.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminDmcaComponent } from './admin-dmca/admin-dmca.component';
import { PublicSchedulesComponent } from './public-schedules/public-schedules.component';

@NgModule({
  declarations: [
    AppComponent,
    MainNavComponent,
    HomePageComponent,
    LoginPageComponent,
    SearchCourseComponent,
    UserPanelComponent,
    EditSchedulesComponent,
    ReviewPanelComponent,
    UserSettingsComponent,
    VerifiedPageComponent,
    AdminReviewComponent,
    AdminUsersComponent,
    AdminDmcaComponent,
    PublicSchedulesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NoopAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule
  ],
  providers: [HttpRequestsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
