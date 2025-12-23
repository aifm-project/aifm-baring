import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Store } from '@ngrx/store';
import { selectAuthState } from '../../../store/auth';
import { User } from '../../../model/models';
import { CustomValidators } from '../../../core/validators/custom-validators';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isEditingLinkedIn = false;
  
  userProfile:User;
  userPhoto:string="https://www.w3schools.com/howto/img_avatar.png";
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private store: Store
  ) {
   
  }

  ngOnInit(): void {
    this.getUserProfileUrl()
     this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      mobile: [{ value: '', disabled: true }],
      // LinkedIn URL validator: must be valid LinkedIn profile URL
      linkedIn: ['', [
        CustomValidators.linkedInUrlValidator(),
        CustomValidators.httpsUrlValidator()
      ]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
    this.getStoreData();
  }

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') {
      this.showCurrentPassword = !this.showCurrentPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onEditLinkedIn(): void {
    this.isEditingLinkedIn = true;
    this.profileForm.get('linkedIn')?.enable();
  }

  onUpdatePhoto(): void {
    console.log('Update photo clicked');
    // Implement photo upload logic
  }

  onCancel(): void {
    this.passwordForm.reset();
    this.isEditingLinkedIn = false;
    this.profileForm.get('linkedIn')?.disable();
  }

  onSaveChanges(): void {
    if (this.passwordForm.valid) {
      console.log('Saving changes:', {
        linkedIn: this.profileForm.value.linkedIn,
        password: this.passwordForm.value
      });
      // Implement save logic
      this.passwordForm.reset();
    }
  }
  getStoreData(){
    this.store.select(selectAuthState).subscribe(data=>{
      console.log(data);
      this.userProfile=data.userData;
      this.profileForm.patchValue({
        name: this.userProfile.first_name,
        email: this.userProfile.email,
        mobile: this.userProfile.phone_number,
        linkedIn: this.userProfile.profile
      });
    });
  }

     getUserProfileUrl() {
      this.authService.getUserPic().subscribe(sk=>{
        this.userPhoto = sk || "https://www.w3schools.com/howto/img_avatar.png"
      })
  }
}
