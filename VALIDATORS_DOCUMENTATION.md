# 🔐 Custom Validators Documentation

## Overview

Custom validators have been implemented for the aifm-baring project to provide robust form validation for email/username, PAN, LinkedIn URLs, and more.

---

## 📦 Available Validators

### 1. **emailOrUsername Validator**

**Purpose**: Accept either a valid email address OR an alphanumeric username

**Accepts**:
- ✅ Valid email: `user@domain.com`
- ✅ Alphanumeric username: `username123`
- ✅ Username with special chars: `user_name-123`, `user.name`
- ✅ Complex email: `user.name+tag@domain.co.uk`

**Rejects**:
- ❌ Invalid email (no @): `userexample.com`
- ❌ Too short username (< 3 chars): `ab`
- ❌ Username with spaces: `user name`
- ❌ Invalid characters: `user@name!`

**Usage**:
```typescript
this.form = this.fb.group({
  email: ['', [
    Validators.required,
    CustomValidators.emailOrUsername(),
    CustomValidators.noSpacesValidator()
  ]]
});
```

**Template Error Messages**:
```html
<small *ngIf="form.get('email')?.errors?.['required']">
  Email or username is required.
</small>
<small *ngIf="form.get('email')?.errors?.['emailOrUsername']">
  {{ form.get('email')?.errors?.['emailOrUsername']?.message }}
</small>
```

---

### 2. **panValidator**

**Purpose**: Validate Indian PAN (Permanent Account Number) format

**Format**: AAAAA0000A
- 5 uppercase letters (A-Z)
- 4 digits (0-9)
- 1 uppercase letter (A-Z)

**Examples**:
- ✅ `ABCDE1234F`
- ✅ `XYZNP5678K`
- ❌ `ABC1234F` (too short)
- ❌ `ABCDE@234F` (special character)
- ❌ `abcde1234f` (lowercase - will be converted and validated)

**Accepts Lowercase**: Yes (converts to uppercase internally)

**Usage**:
```typescript
this.form = this.fb.group({
  pan: ['', [CustomValidators.panValidator()]]
});
```

**Dynamic PAN Validation** (only for Investor Role):
```typescript
const panControl = this.form.get('pan');

if (isInvestorRole) {
  panControl?.addValidators([
    Validators.required,
    CustomValidators.panValidator()
  ]);
} else {
  panControl?.removeValidators([
    Validators.required,
    CustomValidators.panValidator()
  ]);
}

panControl?.updateValueAndValidity();
```

**Template Error Messages**:
```html
<small *ngIf="form.get('pan')?.errors?.['required']">
  PAN is required for Investor Role.
</small>
<small *ngIf="form.get('pan')?.errors?.['invalidPan']">
  {{ form.get('pan')?.errors?.['invalidPan']?.message }}
</small>
```

---

### 3. **linkedInUrlValidator**

**Purpose**: Validate LinkedIn profile/company URL format

**Accepts Formats**:
- ✅ `https://www.linkedin.com/in/john-doe`
- ✅ `https://linkedin.com/in/john-doe`
- ✅ `https://www.linkedin.com/company/company-name`
- ✅ `https://www.linkedin.com/in/john-doe/` (with trailing slash)
- ✅ `https://www.linkedin.com/in/john-doe-123` (with numbers)
- ✅ `https://www.linkedin.com/in/john_doe_123` (with underscores)

**Rejects**:
- ��� `http://www.linkedin.com/in/john-doe` (not HTTPS)
- ❌ `https://twitter.com/john-doe` (wrong domain)
- ❌ `https://www.linkedin.com/john-doe` (missing /in/)
- ❌ `https://www.linkedin.com/in/` (no username)
- ❌ `https://www.linkedin.com/in/john@doe` (special characters)

**Case Insensitive**: Yes (converts to lowercase internally)

**Usage**:
```typescript
this.form = this.fb.group({
  linkedIn: ['', [
    CustomValidators.linkedInUrlValidator(),
    CustomValidators.httpsUrlValidator()
  ]]
});
```

**Template Error Messages**:
```html
<small *ngIf="form.get('linkedIn')?.errors?.['invalidLinkedIn']">
  {{ form.get('linkedIn')?.errors?.['invalidLinkedIn']?.message }}
</small>
<small *ngIf="form.get('linkedIn')?.errors?.['insecureUrl']">
  {{ form.get('linkedIn')?.errors?.['insecureUrl']?.message }}
</small>
```

---

### 4. **httpsUrlValidator**

**Purpose**: Ensure URL uses HTTPS (secure protocol)

**Accepts**:
- ✅ `https://www.example.com`
- ✅ `HTTPS://www.example.com` (case insensitive)

**Rejects**:
- ❌ `http://www.example.com`
- ❌ `www.example.com` (no protocol)
- ❌ `ftp://example.com`

**Usage**:
```typescript
linkedIn: ['', [
  CustomValidators.httpsUrlValidator()
]]
```

---

### 5. **alphanumericValidator**

**Purpose**: Allow only alphanumeric characters with optional special chars (underscore, hyphen, period)

**Parameters**:
- `minLength` (default: 3) - Minimum allowed length

**Accepts**:
- ✅ `abc123`
- ✅ `user_name-123`
- ✅ `john.doe.2024`

**Rejects**:
- ❌ `abc@123` (special characters)
- ❌ `ab` (less than minLength)
- ❌ `abc 123` (spaces)

**Usage**:
```typescript
username: ['', [
  CustomValidators.alphanumericValidator(3)
]]
```

---

### 6. **emailValidator**

**Purpose**: Validate standard email format

**Accepts**:
- ✅ `user@example.com`
- ✅ `user.name+tag@example.com`
- ✅ `user@mail.example.co.uk`

**Rejects**:
- ❌ `userexample.com` (no @)
- ❌ `user@` (no domain)
- ❌ `@example.com` (no local part)

**Usage**:
```typescript
email: ['', [
  Validators.required,
  CustomValidators.emailValidator()
]]
```

---

### 7. **usernameValidator**

**Purpose**: Validate username with length and character restrictions

**Rules**:
- Length: 3-20 characters
- Allowed: letters, numbers, underscore, hyphen, period

**Accepts**:
- ✅ `username` (3-20 chars)
- ✅ `user_name_123`
- ✅ `john-doe.2024`

**Rejects**:
- ❌ `ab` (too short)
- ❌ `a`.repeat(21) (too long)
- ❌ `user@name` (special characters)

**Usage**:
```typescript
username: ['', [
  Validators.required,
  CustomValidators.usernameValidator()
]]
```

---

### 8. **noSpacesValidator**

**Purpose**: Ensure input doesn't contain any spaces

**Accepts**:
- ✅ `helloworld`
- ✅ `hello_world`
- ✅ `hello-world`

**Rejects**:
- ❌ `hello world` (space)
- ❌ ` hello` (leading space)
- ❌ `hello ` (trailing space)

**Usage**:
```typescript
username: ['', [
  Validators.required,
  CustomValidators.noSpacesValidator()
]]
```

---

## 🔧 Complete Form Examples

### Login Form Example

```typescript
ngOnInit(): void {
  this.loginForm = this.fb.group({
    // Email or Username: accepts both email and username formats
    email: ['', [
      Validators.required,
      CustomValidators.emailOrUsername(),
      CustomValidators.noSpacesValidator()
    ]],
    
    // Password: standard required validation
    password: ['', [Validators.required]],
    
    // User Role: optional, but required when multi-user role exists
    userRole: [''],
    
    // PAN: required only for Investor Role
    pan: ['', [CustomValidators.panValidator()]]
  });
}
```

### Profile Form Example

```typescript
ngOnInit(): void {
  this.profileForm = this.fb.group({
    name: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    mobile: [{ value: '', disabled: true }],
    
    // LinkedIn: must be valid LinkedIn URL with HTTPS
    linkedIn: ['', [
      CustomValidators.linkedInUrlValidator(),
      CustomValidators.httpsUrlValidator()
    ]]
  });
}
```

---

## 📋 Validation Rules Summary

| Validator | Input Type | Min Length | Special Chars | HTTPS | Notes |
|-----------|-----------|-----------|--------------|-------|-------|
| emailOrUsername | Email or User | 3 (user) | Some | - | Case insensitive |
| panValidator | PAN | 11 chars exact | - | - | AAAAA0000A format |
| linkedInUrlValidator | URL | - | Yes | Required | Domain-specific |
| httpsUrlValidator | URL | - | - | Required | Protocol check |
| alphanumericValidator | Text | Custom | Limited | - | ._- allowed |
| emailValidator | Email | - | Some | - | Standard email |
| usernameValidator | Text | 3 | Limited | - | 3-20 chars |
| noSpacesValidator | Text | - | - | - | No spaces allowed |

---

## 🧪 Testing

Run the validator tests:

```bash
ng test --include='**/custom-validators.spec.ts'
```

**Test Coverage**:
- 40+ test cases
- Valid and invalid inputs
- Edge cases
- Case sensitivity
- Whitespace handling

---

## 🚀 Implementation Status

### Implemented In
- **Login Component**: email/username, PAN validators
- **Profile Component**: LinkedIn URL validator
- **Services**: Reusable validators for any form

### Files
- `src/app/core/validators/custom-validators.ts` - Validator implementations
- `src/app/core/validators/custom-validators.spec.ts` - Unit tests (40+ cases)
- `src/app/unauthenticated/user/login/login.component.ts` - Login form usage
- `src/app/shared/components/profile/profile.component.ts` - Profile form usage

---

## 💡 Best Practices

### Do's ✅
1. Always combine validators: `Validators.required` + custom validator
2. Call `updateValueAndValidity()` when dynamically adding/removing validators
3. Show specific error messages for each validation error
4. Trim whitespace before validation
5. Test all validators with unit tests

### Don'ts ❌
1. Don't use only custom validators without `Validators.required`
2. Don't trust client-side validation alone (validate on server too)
3. Don't show confusing error messages
4. Don't forget to handle null/empty values
5. Don't modify user input silently (convert case but keep original)

---

## 🔄 Migration Guide

### If You Were Using Weak Validators

**Before**:
```typescript
email: ['', [Validators.required, Validators.pattern(emailPattern)]],
linkedIn: ['', Validators.pattern('https?://.+')]
```

**After**:
```typescript
email: ['', [
  Validators.required,
  CustomValidators.emailOrUsername(),
  CustomValidators.noSpacesValidator()
]],
linkedIn: ['', [
  CustomValidators.linkedInUrlValidator(),
  CustomValidators.httpsUrlValidator()
]]
```

---

## 📞 Support

For questions about validators:
1. Check test cases in `custom-validators.spec.ts`
2. Review implementation in `custom-validators.ts`
3. See usage examples in components
4. Check error messages in HTML templates

---

## ✅ Checklist for New Forms

When adding validation to a new form:

- [ ] Import `CustomValidators` from `src/app/core/validators/custom-validators`
- [ ] Choose appropriate validators for each field
- [ ] Add `Validators.required` for required fields
- [ ] Combine multiple validators when needed
- [ ] Add error message display in template
- [ ] Test with valid and invalid inputs
- [ ] Test with edge cases (whitespace, special chars, etc.)
- [ ] Show user-friendly error messages
- [ ] Validate on server side as well

---

**Last Updated**: 2024  
**Status**: Production Ready  
**Test Coverage**: 40+ test cases  
**All Validators**: Fully Functional ✅
