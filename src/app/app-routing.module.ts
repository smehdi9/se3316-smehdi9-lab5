import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomePageComponent } from './home-page/home-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { SearchCourseComponent } from './search-course/search-course.component';
import { UserPanelComponent } from './user-panel/user-panel.component';
import { EditSchedulesComponent } from './edit-schedules/edit-schedules.component';
import { PublicSchedulesComponent } from './public-schedules/public-schedules.component';
import { ReviewPanelComponent } from './review-panel/review-panel.component';
import { UserSettingsComponent } from './user-settings/user-settings.component';
import { VerifiedPageComponent } from './verified-page/verified-page.component';
import { AdminReviewComponent } from './admin-review/admin-review.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminDmcaComponent } from './admin-dmca/admin-dmca.component';

const routes: Routes = [
  { path: 'home' , component: HomePageComponent },
  { path: 'login' , component: LoginPageComponent },
  { path: 'search' , component: SearchCourseComponent },
  { path: 'user' , component: UserPanelComponent },
  { path: 'schedules/edit' , component: EditSchedulesComponent },
  { path: 'schedules/view' , component: PublicSchedulesComponent },
  { path: 'reviews/add' , component: ReviewPanelComponent },
  { path: 'user/settings' , component: UserSettingsComponent },
  { path: 'user/verify' , component: VerifiedPageComponent },
  { path: 'admin/reviews' , component: AdminReviewComponent },
  { path: 'admin/users' , component: AdminUsersComponent },
  { path: 'admin/dmca' , component: AdminDmcaComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
