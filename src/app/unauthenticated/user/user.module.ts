import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes), ToastModule, LoginComponent],
})
export class UserModule {}
