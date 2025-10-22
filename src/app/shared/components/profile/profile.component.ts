import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

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
  
  userProfile = {
    name: 'Aniruddh Shetty',
    email: 'Aniruddh.shetty@gmail.com',
    mobile: '+91 92981 08121',
    linkedIn: '',
    photo: 'https://api.builder.io/api/v1/image/assets/TEMP/023d8b20aea6edb9e740f361cede5ec3fded98e6?width=392'
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      name: [{ value: this.userProfile.name, disabled: true }],
      email: [{ value: this.userProfile.email, disabled: true }],
      mobile: [{ value: this.userProfile.mobile, disabled: true }],
      linkedIn: [this.userProfile.linkedIn]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const userEmail = this.authService.getUserEmail();
    if (userEmail) {
      this.userProfile.email = userEmail;
      this.profileForm.patchValue({ email: userEmail });
    }
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
}
