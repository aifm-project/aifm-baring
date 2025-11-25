import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { IframVideoPipe } from './ifram-video.pipe';

describe('IframVideoPipe', () => {
  let pipe: IframVideoPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IframVideoPipe]
    });
    pipe = TestBed.inject(IframVideoPipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  describe('Valid YouTube URLs', () => {
    it('should handle standard youtube.com watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = pipe.transform(url);
      expect(result).toBeTruthy();
      expect(result).toContain('youtube-nocookie');
      expect(result).toContain('dQw4w9WgXcQ');
    });

    it('should handle youtu.be short format', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const result = pipe.transform(url);
      expect(result).toBeTruthy();
      expect(result).toContain('dQw4w9WgXcQ');
    });

    it('should handle youtube.com/embed format', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const result = pipe.transform(url);
      expect(result).toBeTruthy();
      expect(result).toContain('dQw4w9WgXcQ');
    });

    it('should handle youtube.com/v format', () => {
      const url = 'https://www.youtube.com/v/dQw4w9WgXcQ';
      const result = pipe.transform(url);
      expect(result).toBeTruthy();
      expect(result).toContain('dQw4w9WgXcQ');
    });

    it('should handle URL with multiple parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s&list=PL';
      const result = pipe.transform(url);
      expect(result).toBeTruthy();
      expect(result).toContain('dQw4w9WgXcQ');
    });

    it('should handle URL with ampersand v parameter', () => {
      const url = 'https://www.youtube.com/watch?list=PL&v=dQw4w9WgXcQ';
      const result = pipe.transform(url);
      expect(result).toBeTruthy();
      expect(result).toContain('dQw4w9WgXcQ');
    });

    it('should handle URL with whitespace', () => {
      const url = '  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ';
      const result = pipe.transform(url);
      expect(result).toBeTruthy();
      expect(result).toContain('dQw4w9WgXcQ');
    });

    it('should handle video ID with hyphens and underscores', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXc-';
      const result = pipe.transform(url);
      expect(result).toBeTruthy();
      expect(result).toContain('dQw4w9WgXc-');
    });
  });

  describe('Invalid inputs', () => {
    it('should return null for null input', () => {
      const result = pipe.transform(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = pipe.transform(undefined);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = pipe.transform('');
      expect(result).toBeNull();
    });

    it('should return null for whitespace only', () => {
      const result = pipe.transform('   ');
      expect(result).toBeNull();
    });

    it('should return null for non-string input', () => {
      const result = pipe.transform(12345);
      expect(result).toBeNull();
    });

    it('should return null for object input', () => {
      const result = pipe.transform({ url: 'test' });
      expect(result).toBeNull();
    });

    it('should return null for array input', () => {
      const result = pipe.transform(['https://youtube.com/watch?v=test']);
      expect(result).toBeNull();
    });
  });

  describe('Invalid YouTube IDs', () => {
    it('should return null for URL with invalid ID (too short)', () => {
      const url = 'https://www.youtube.com/watch?v=short';
      const result = pipe.transform(url);
      expect(result).toBeNull();
    });

    it('should return null for URL with invalid ID (too long)', () => {
      const url = 'https://www.youtube.com/watch?v=thisistoolongtohavebeenayoutubeid';
      const result = pipe.transform(url);
      expect(result).toBeNull();
    });

    it('should return null for URL with special characters in ID', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9Wg@cQ';
      const result = pipe.transform(url);
      expect(result).toBeNull();
    });

    it('should return null for URL with space in ID', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9 WgXcQ';
      const result = pipe.transform(url);
      expect(result).toBeNull();
    });

    it('should return null for non-YouTube URL', () => {
      const url = 'https://www.example.com/watch?v=dQw4w9WgXcQ';
      const result = pipe.transform(url);
      expect(result).toBeNull();
    });
  });

  describe('Security checks', () => {
    it('should not trust javascript URLs', () => {
      const url = 'javascript:alert("XSS")';
      const result = pipe.transform(url);
      expect(result).toBeNull();
    });

    it('should not trust data URLs', () => {
      const url = 'data:text/html,<script>alert("XSS")</script>';
      const result = pipe.transform(url);
      expect(result).toBeNull();
    });

    it('should use youtube-nocookie domain for privacy', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = pipe.transform(url);
      expect(result).toContain('youtube-nocookie');
    });

    it('should use HTTPS for embed URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = pipe.transform(url);
      expect(result).toMatch(/^https:\/\//);
    });

    it('should not include query parameters in embed URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s&list=PL&utm_source=test';
      const result = pipe.transform(url);
      expect(result).not.toContain('?');
      expect(result).not.toContain('&');
      expect(result).not.toContain('utm_source');
    });
  });

  describe('URL encoding', () => {
    it('should handle percent-encoded characters in URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ%26t%3D5s';
      const result = pipe.transform(url);
      expect(result).toBeTruthy();
    });

    it('should handle URL fragments', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ#t=5s';
      const result = pipe.transform(url);
      expect(result).toBeTruthy();
      expect(result).toContain('dQw4w9WgXcQ');
    });
  });
});
