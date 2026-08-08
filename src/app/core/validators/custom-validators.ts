import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom Validators for form controls
 * Provides reusable validation functions for common patterns
 */

export class CustomValidators {
  
  /**
   * Validates email or alphanumeric username
   * Accepts either:
   * 1. Valid email format: user@domain.com
   * 2. Alphanumeric username: username123, user_123, etc.
   * 
   * @returns Validator function
   */
  static emailOrUsername(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Empty values are handled by Validators.required
      }

      const value = control.value.trim();

      // Check if it's a valid email
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
      if (emailRegex.test(value)) {
        return null; // Valid email
      }

      // Check if it's a valid alphanumeric username
      // Allows: letters, numbers, underscores, hyphens, periods
      // Must be at least 3 characters
      const usernameRegex = /^[a-zA-Z0-9_.-]{2,}$/;
      if (usernameRegex.test(value)) {
        return null; // Valid username
      }

      // Not valid email or username
      return {
        emailOrUsername: {
          value: control.value,
          message: 'Must be a valid email (user@domain.com) or username (alphanumeric, 3+ characters)'
        }
      };
    };
  }

  /**
   * Validates PAN (Permanent Account Number) format
   * Indian PAN format: AAAAA0000A
   * - 5 letters (A-Z)
   * - 4 digits (0-9)
   * - 1 letter (A-Z)
   * Example: ABCDE1234F
   * 
   * @returns Validator function
   */
  static panValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Empty values are handled by Validators.required
      }

      const value = control.value.trim().toUpperCase();

      // PAN format: AAAAA0000A (5 letters, 4 digits, 1 letter)
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      
      if (panRegex.test(value)) {
        return null; // Valid PAN
      }

      return {
        invalidPan: {
          value: control.value,
          message: 'PAN must be in format: AAAAA0000A (e.g., ABCDE1234F). 5 letters, 4 digits, 1 letter'
        }
      };
    };
  }

  /**
   * Validates LinkedIn URL format
   * Accepts:
   * - https://www.linkedin.com/in/username
   * - https://linkedin.com/in/username
   * - https://www.linkedin.com/company/company-name
   * - https://linkedin.com/company/company-name
   * 
   * @returns Validator function
   */
  static linkedInUrlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Empty values are handled by Validators.required
      }

      const value = control.value.trim().toLowerCase();

      // Validate LinkedIn URL format
      const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?$/;

      if (linkedInRegex.test(value)) {
        return null; // Valid LinkedIn URL
      }

      return {
        invalidLinkedIn: {
          value: control.value,
          message: 'Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)'
        }
      };
    };
  }

  /**
   * Validates that URL starts with https (secure)
   * 
   * @returns Validator function
   */
  static httpsUrlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.trim().toLowerCase();

      if (value.startsWith('https://')) {
        return null;
      }

      return {
        insecureUrl: {
          value: control.value,
          message: 'URL must use HTTPS (secure connection)'
        }
      };
    };
  }

  /**
   * Validates alphanumeric input only
   * Allows letters, numbers, underscores, hyphens, periods
   * 
   * @param minLength Optional minimum length (default: 3)
   * @returns Validator function
   */
  static alphanumericValidator(minLength: number = 3): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.trim();

      // Check minimum length
      if (value.length < minLength) {
        return {
          minAlphanumeric: {
            requiredLength: minLength,
            actualLength: value.length
          }
        };
      }

      // Check alphanumeric format
      const alphanumericRegex = /^[a-zA-Z0-9_.-]+$/;
      if (!alphanumericRegex.test(value)) {
        return {
          invalidAlphanumeric: {
            value: control.value,
            message: 'Only letters, numbers, underscores, hyphens, and periods are allowed'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates email format
   * Uses standard email validation pattern
   * 
   * @returns Validator function
   */
  static emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.trim();
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

      if (emailRegex.test(value)) {
        return null;
      }

      return {
        invalidEmail: {
          value: control.value,
          message: 'Please enter a valid email address'
        }
      };
    };
  }

  /**
   * Validates username format
   * Allows alphanumeric, underscores, hyphens, periods
   * Minimum 3 characters
   * 
   * @returns Validator function
   */
  static usernameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.trim();

      // Username rules: 3-20 chars, alphanumeric with some special chars
      const usernameRegex = /^[a-zA-Z0-9_.-]{2,20}$/;

      if (usernameRegex.test(value)) {
        return null;
      }

      return {
        invalidUsername: {
          value: control.value,
          message: 'Username must be 3-20 characters (letters, numbers, underscore, hyphen, period)'
        }
      };
    };
  }

  /**
   * Validates phone number format
   * Accepts an optional leading '+' (country code) followed by 7-15 digits
   *
   * @returns Validator function
   */
  static phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Empty values are handled by Validators.required
      }

      const value = control.value.trim();
      const phoneRegex = /^\+?[0-9]{7,15}$/;

      if (phoneRegex.test(value)) {
        return null; // Valid phone number
      }

      return {
        invalidPhone: {
          value: control.value,
          message: 'Please enter a valid phone number (7-15 digits, optional + country code)'
        }
      };
    };
  }

  /**
   * Validates no spaces in input
   *
   * @returns Validator function
   */
  static noSpacesValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      if (/\s/.test(control.value)) {
        return {
          spaces: {
            value: control.value,
            message: 'Spaces are not allowed'
          }
        };
      }

      return null;
    };
  }
}
