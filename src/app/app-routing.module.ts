import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomePageComponent } from './home-page/home-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { SearchCourseComponent } from './search-course/search-course.component';
import { UserPanelComponent } from './user-panel/user-panel.component';
import { EditSchedulesComponent } from './edit-schedules/edit-schedules.component';
import { ReviewPanelComponent } from './review-panel/review-panel.component';

const routes: Routes = [
  { path: 'home', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'search', component: SearchCourseComponent },
  { path: 'user', component: UserPanelComponent },
  { path: 'schedules/edit', component: EditSchedulesComponent },
  { path: 'reviews/add' , component: ReviewPanelComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
