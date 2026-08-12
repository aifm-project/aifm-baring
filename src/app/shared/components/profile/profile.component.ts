import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { Store } from '@ngrx/store';
import { selectAuthState } from '../../../store/auth';
import { AccountDetailsSummary, User } from '../../../model/models';
import { CustomValidators } from '../../../core/validators/custom-validators';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  activeTab: 'personal' | 'survey' | 'account' = 'personal';

  profileForm: FormGroup;
  // Password change temporarily disabled per product decision — see profile.component.html for the matching commented-out form.
  // passwordForm: FormGroup;
  // showCurrentPassword = false;
  // showNewPassword = false;
  // showConfirmPassword = false;
  isEditingLinkedIn = false;

  // Voluntary investor survey (Industry + Phone Number) — temporarily disabled per product decision.
  // Commented out, not deleted. Uncomment this block, the matching tab-survey button and
  // survey-content panel in profile.component.html, and the survey methods below to re-enable.
  // surveyForm: FormGroup;
  // surveySubmitted = false;
  // readonly industryOptions: string[] = [
  //   // First-pass list pending business sign-off.
  //   'Banking & Financial Services', 'Technology', 'Healthcare & Pharmaceuticals',
  //   'Manufacturing', 'Real Estate', 'Consulting & Professional Services',
  //   'Retail & Consumer Goods', 'Energy & Utilities', 'Media & Entertainment',
  //   'Legal', 'Government & Public Sector', 'Education', 'Other'
  // ];

  // Account Details panel (Bank / Demat / RM / Tax Residency) — mock data pending backend contract.
  accountDetails: AccountDetailsSummary | null = null;

  // Inline section editing — each section is edited (and saved) as a whole via an edit icon.
  editingSection: 'bank' | 'demat' | 'rm' | 'tax' | null = null;
  editDraft: any = null;
  sectionUpdated: Record<string, boolean> = {};

  readonly bankAccountTypeOptions: string[] = ['Savings', 'Current', 'NRE', 'NRO'];
  readonly depositoryOptions: string[] = ['NSDL', 'CDSL'];
  readonly fatcaCrsStatusOptions: string[] = ['Reportable', 'Non-Reportable'];
  readonly countryOptions: string[] = [
    'India', 'United States', 'United Kingdom', 'Singapore', 'United Arab Emirates',
    'Mauritius', 'Hong Kong', 'Canada', 'Australia', 'Other'
  ];

  userProfile:User;
  userPhoto:string="https://www.w3schools.com/howto/img_avatar.png";
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
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

    // this.passwordForm = this.fb.group({
    //   currentPassword: ['', Validators.required],
    //   newPassword: ['', [Validators.required, Validators.minLength(8)]],
    //   confirmPassword: ['', Validators.required]
    // }, { validators: this.passwordMatchValidator });

    // this.surveyForm = this.fb.group({
    //   industry: [''],
    //   phoneNumber: ['', [CustomValidators.phoneValidator()]]
    // });

    this.getStoreData();
  }

  // passwordMatchValidator(group: FormGroup) {
  //   const newPassword = group.get('newPassword')?.value;
  //   const confirmPassword = group.get('confirmPassword')?.value;
  //   return newPassword === confirmPassword ? null : { passwordMismatch: true };
  // }

  // togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
  //   if (field === 'current') {
  //     this.showCurrentPassword = !this.showCurrentPassword;
  //   } else if (field === 'new') {
  //     this.showNewPassword = !this.showNewPassword;
  //   } else {
  //     this.showConfirmPassword = !this.showConfirmPassword;
  //   }
  // }

  setActiveTab(tab: 'personal' | 'survey' | 'account'): void {
    this.activeTab = tab;
    if (tab === 'account' && !this.accountDetails) {
      this.loadAccountDetails();
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
    // this.passwordForm.reset();
    this.isEditingLinkedIn = false;
    this.profileForm.get('linkedIn')?.disable();
  }

  onSaveChanges(): void {
    if (this.profileForm.get('linkedIn')?.valid) {
      console.log('Saving changes:', {
        linkedIn: this.profileForm.value.linkedIn
      });
      // Implement save logic
      this.isEditingLinkedIn = false;
      this.profileForm.get('linkedIn')?.disable();
    }
  }

  // onSurveySubmit(): void {
  //   if (this.surveyForm.invalid) {
  //     return;
  //   }
  //   this.userService.submitSurvey(this.surveyForm.value).subscribe(() => {
  //     this.surveySubmitted = true;
  //   });
  // }

  // onSurveySkip(): void {
  //   this.surveyForm.reset({ industry: '', phoneNumber: '' });
  // }

  loadAccountDetails(): void {
    this.userService.getAccountDetails().subscribe(details => {
      this.accountDetails = details;
    });
  }

  onEditSection(section: 'bank' | 'demat' | 'rm' | 'tax'): void {
    if (!this.accountDetails) {
      return;
    }
    const sectionData: Record<string, any> = {
      bank: this.accountDetails.bankAccount,
      demat: this.accountDetails.dematAccount,
      rm: this.accountDetails.relationshipManager,
      tax: this.accountDetails.taxResidency,
    };
    this.editingSection = section;
    this.sectionUpdated[section] = false;
    this.editDraft = { ...sectionData[section] };
  }

  onCancelEditSection(): void {
    this.editingSection = null;
    this.editDraft = null;
  }

  isDraftValid(): boolean {
    if (!this.editDraft) {
      return false;
    }
    return Object.values<string>(this.editDraft).every(value => (value ?? '').trim().length > 0);
  }

  onSaveSection(section: 'bank' | 'demat' | 'rm' | 'tax'): void {
    if (!this.accountDetails || !this.editDraft || !this.isDraftValid()) {
      return;
    }
    this.userService.updateAccountDetail({ section, data: this.editDraft }).subscribe(() => {
      if (!this.accountDetails || !this.editDraft) {
        return;
      }
      switch (section) {
        case 'bank':
          this.accountDetails.bankAccount = { ...this.editDraft } as any;
          break;
        case 'demat':
          this.accountDetails.dematAccount = { ...this.editDraft } as any;
          break;
        case 'rm':
          this.accountDetails.relationshipManager = { ...this.editDraft } as any;
          break;
        case 'tax':
          this.accountDetails.taxResidency = { ...this.editDraft } as any;
          break;
      }
      this.editingSection = null;
      this.editDraft = null;
      this.sectionUpdated[section] = true;
    });
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
