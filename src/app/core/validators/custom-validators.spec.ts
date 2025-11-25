import { FormControl } from '@angular/forms';
import { CustomValidators } from './custom-validators';

describe('CustomValidators', () => {

  describe('emailOrUsername Validator', () => {
    let validator = CustomValidators.emailOrUsername();

    it('should allow valid emails', () => {
      const control = new FormControl('user@example.com');
      expect(validator(control)).toBeNull();
    });

    it('should allow valid emails with special characters', () => {
      const control = new FormControl('user.name+tag@example.co.uk');
      expect(validator(control)).toBeNull();
    });

    it('should allow valid alphanumeric usernames', () => {
      const control = new FormControl('username123');
      expect(validator(control)).toBeNull();
    });

    it('should allow usernames with underscores and hyphens', () => {
      const control = new FormControl('user_name-123');
      expect(validator(control)).toBeNull();
    });

    it('should allow usernames with periods', () => {
      const control = new FormControl('user.name.123');
      expect(validator(control)).toBeNull();
    });

    it('should reject too short username (less than 3 chars)', () => {
      const control = new FormControl('ab');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['emailOrUsername']).toBeDefined();
    });

    it('should reject invalid email', () => {
      const control = new FormControl('notanemail');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['emailOrUsername']).toBeDefined();
    });

    it('should reject email without domain', () => {
      const control = new FormControl('user@');
      expect(validator(control)).not.toBeNull();
    });

    it('should allow empty value (handled by Validators.required)', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should allow null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should reject username with special characters', () => {
      const control = new FormControl('user@name!');
      expect(validator(control)).not.toBeNull();
    });

    it('should reject username with spaces', () => {
      const control = new FormControl('user name');
      expect(validator(control)).not.toBeNull();
    });
  });

  describe('panValidator', () => {
    let validator = CustomValidators.panValidator();

    it('should allow valid PAN format', () => {
      const control = new FormControl('ABCDE1234F');
      expect(validator(control)).toBeNull();
    });

    it('should allow valid PAN in lowercase (converts to uppercase)', () => {
      const control = new FormControl('abcde1234f');
      expect(validator(control)).toBeNull();
    });

    it('should allow valid PAN with leading/trailing spaces', () => {
      const control = new FormControl('  ABCDE1234F  ');
      expect(validator(control)).toBeNull();
    });

    it('should reject PAN with wrong first letter count', () => {
      const control = new FormControl('ABC1234F');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['invalidPan']).toBeDefined();
    });

    it('should reject PAN with wrong digit count', () => {
      const control = new FormControl('ABCDE123F');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['invalidPan']).toBeDefined();
    });

    it('should reject PAN with wrong last character count', () => {
      const control = new FormControl('ABCDE1234FG');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['invalidPan']).toBeDefined();
    });

    it('should reject PAN with special characters', () => {
      const control = new FormControl('ABCDE@234F');
      expect(validator(control)).not.toBeNull();
    });

    it('should reject PAN with all digits', () => {
      const control = new FormControl('12345678901');
      expect(validator(control)).not.toBeNull();
    });

    it('should reject PAN with spaces in middle', () => {
      const control = new FormControl('ABCDE 1234F');
      expect(validator(control)).not.toBeNull();
    });

    it('should allow empty value (handled by Validators.required)', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should allow null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });
  });

  describe('linkedInUrlValidator', () => {
    let validator = CustomValidators.linkedInUrlValidator();

    it('should allow valid LinkedIn profile URL', () => {
      const control = new FormControl('https://www.linkedin.com/in/john-doe');
      expect(validator(control)).toBeNull();
    });

    it('should allow LinkedIn profile URL without www', () => {
      const control = new FormControl('https://linkedin.com/in/john-doe');
      expect(validator(control)).toBeNull();
    });

    it('should allow LinkedIn company URL', () => {
      const control = new FormControl('https://www.linkedin.com/company/example-company');
      expect(validator(control)).toBeNull();
    });

    it('should allow LinkedIn URL with trailing slash', () => {
      const control = new FormControl('https://www.linkedin.com/in/john-doe/');
      expect(validator(control)).toBeNull();
    });

    it('should allow LinkedIn URL with hyphens in profile name', () => {
      const control = new FormControl('https://www.linkedin.com/in/john-doe-smith-123');
      expect(validator(control)).toBeNull();
    });

    it('should allow LinkedIn URL with underscores', () => {
      const control = new FormControl('https://www.linkedin.com/in/john_doe_123');
      expect(validator(control)).toBeNull();
    });

    it('should allow LinkedIn URL in uppercase domain', () => {
      const control = new FormControl('HTTPS://WWW.LINKEDIN.COM/IN/JOHN-DOE');
      expect(validator(control)).toBeNull();
    });

    it('should reject non-LinkedIn URL', () => {
      const control = new FormControl('https://www.twitter.com/john-doe');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['invalidLinkedIn']).toBeDefined();
    });

    it('should reject LinkedIn URL with http instead of https', () => {
      const control = new FormControl('http://www.linkedin.com/in/john-doe');
      expect(validator(control)).not.toBeNull();
    });

    it('should reject invalid LinkedIn profile (missing type)', () => {
      const control = new FormControl('https://www.linkedin.com/john-doe');
      expect(validator(control)).not.toBeNull();
    });

    it('should reject invalid LinkedIn profile (no username)', () => {
      const control = new FormControl('https://www.linkedin.com/in/');
      expect(validator(control)).not.toBeNull();
    });

    it('should reject empty value (let required validator handle it)', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should reject null value (let required validator handle it)', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should reject URL with special characters in username', () => {
      const control = new FormControl('https://www.linkedin.com/in/john@doe');
      expect(validator(control)).not.toBeNull();
    });
  });

  describe('httpsUrlValidator', () => {
    let validator = CustomValidators.httpsUrlValidator();

    it('should allow HTTPS URLs', () => {
      const control = new FormControl('https://www.example.com');
      expect(validator(control)).toBeNull();
    });

    it('should allow HTTPS URLs with uppercase', () => {
      const control = new FormControl('HTTPS://www.example.com');
      expect(validator(control)).toBeNull();
    });

    it('should reject HTTP URLs', () => {
      const control = new FormControl('http://www.example.com');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['insecureUrl']).toBeDefined();
    });

    it('should reject URLs without protocol', () => {
      const control = new FormControl('www.example.com');
      expect(validator(control)).not.toBeNull();
    });

    it('should allow empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should allow null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });
  });

  describe('alphanumericValidator', () => {
    let validator = CustomValidators.alphanumericValidator(3);

    it('should allow valid alphanumeric text', () => {
      const control = new FormControl('abc123');
      expect(validator(control)).toBeNull();
    });

    it('should allow text with underscores', () => {
      const control = new FormControl('abc_123');
      expect(validator(control)).toBeNull();
    });

    it('should allow text with hyphens', () => {
      const control = new FormControl('abc-123');
      expect(validator(control)).toBeNull();
    });

    it('should allow text with periods', () => {
      const control = new FormControl('abc.123');
      expect(validator(control)).toBeNull();
    });

    it('should reject text below minimum length', () => {
      const control = new FormControl('ab');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['minAlphanumeric']).toBeDefined();
    });

    it('should reject text with special characters', () => {
      const control = new FormControl('abc@123');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['invalidAlphanumeric']).toBeDefined();
    });

    it('should reject text with spaces', () => {
      const control = new FormControl('abc 123');
      expect(validator(control)).not.toBeNull();
    });

    it('should allow empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });
  });

  describe('emailValidator', () => {
    let validator = CustomValidators.emailValidator();

    it('should allow valid email', () => {
      const control = new FormControl('user@example.com');
      expect(validator(control)).toBeNull();
    });

    it('should allow email with subdomain', () => {
      const control = new FormControl('user@mail.example.com');
      expect(validator(control)).toBeNull();
    });

    it('should allow email with special characters', () => {
      const control = new FormControl('user+tag@example.com');
      expect(validator(control)).toBeNull();
    });

    it('should reject invalid email (no @)', () => {
      const control = new FormControl('userexample.com');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['invalidEmail']).toBeDefined();
    });

    it('should reject invalid email (no domain)', () => {
      const control = new FormControl('user@');
      expect(validator(control)).not.toBeNull();
    });

    it('should allow empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });
  });

  describe('usernameValidator', () => {
    let validator = CustomValidators.usernameValidator();

    it('should allow valid username', () => {
      const control = new FormControl('username123');
      expect(validator(control)).toBeNull();
    });

    it('should allow username with underscores', () => {
      const control = new FormControl('user_name');
      expect(validator(control)).toBeNull();
    });

    it('should allow username with hyphens', () => {
      const control = new FormControl('user-name');
      expect(validator(control)).toBeNull();
    });

    it('should allow username with periods', () => {
      const control = new FormControl('user.name');
      expect(validator(control)).toBeNull();
    });

    it('should reject username too short', () => {
      const control = new FormControl('ab');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['invalidUsername']).toBeDefined();
    });

    it('should reject username too long', () => {
      const control = new FormControl('a'.repeat(21));
      expect(validator(control)).not.toBeNull();
    });

    it('should reject username with special characters', () => {
      const control = new FormControl('user@name');
      expect(validator(control)).not.toBeNull();
    });

    it('should allow empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });
  });

  describe('noSpacesValidator', () => {
    let validator = CustomValidators.noSpacesValidator();

    it('should reject text with spaces', () => {
      const control = new FormControl('hello world');
      expect(validator(control)).not.toBeNull();
      expect(validator(control)?.['spaces']).toBeDefined();
    });

    it('should reject text with leading space', () => {
      const control = new FormControl(' hello');
      expect(validator(control)).not.toBeNull();
    });

    it('should reject text with trailing space', () => {
      const control = new FormControl('hello ');
      expect(validator(control)).not.toBeNull();
    });

    it('should allow text without spaces', () => {
      const control = new FormControl('helloworld');
      expect(validator(control)).toBeNull();
    });

    it('should allow empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should allow null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });
  });
});
