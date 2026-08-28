import { TestBed } from '@angular/core/testing';
import { SessionNoticeService } from './session-notice.service';
import { NOTICE_TTL_MS, SESSION_NOTICE_KEY, SESSION_RETURN_URL_KEY } from './session.model';

describe('SessionNoticeService', () => {
  let service: SessionNoticeService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionNoticeService);
  });

  afterEach(() => sessionStorage.clear());

  it('hands the reason to the next reader', () => {
    service.write('EXPIRED');
    expect(service.consume()?.reason).toBe('EXPIRED');
  });

  it('is consumed on read, so a page refresh does not replay it forever', () => {
    // The failure this prevents: a user who reloads the login screen an hour later
    // being told again that a session they have long forgotten expired.
    service.write('EXPIRED');
    expect(service.consume()).withContext('first read').not.toBeNull();
    expect(service.consume()).withContext('second read').toBeNull();
    expect(sessionStorage.getItem(SESSION_NOTICE_KEY)).toBeNull();
  });

  it('drops a notice older than its TTL', () => {
    sessionStorage.setItem(
      SESSION_NOTICE_KEY,
      JSON.stringify({ reason: 'EXPIRED', at: Date.now() - NOTICE_TTL_MS - 1 }),
    );
    expect(service.consume()).toBeNull();
  });

  it('drops a notice stamped in the future, which means the clock moved', () => {
    sessionStorage.setItem(
      SESSION_NOTICE_KEY,
      JSON.stringify({ reason: 'EXPIRED', at: Date.now() + 60_000 }),
    );
    expect(service.consume()).toBeNull();
  });

  it('survives a corrupted payload without throwing', () => {
    // Anything on the origin can write here. A parse error must not take the login
    // screen down with it.
    sessionStorage.setItem(SESSION_NOTICE_KEY, '{not json');
    expect(() => service.consume()).not.toThrow();
    expect(service.consume()).toBeNull();

    sessionStorage.setItem(SESSION_NOTICE_KEY, JSON.stringify({ reason: 7 }));
    expect(service.consume()).toBeNull();
  });

  it('stores only a reason and a timestamp - never anything credential-shaped', () => {
    service.write('EXPIRED');
    const raw = sessionStorage.getItem(SESSION_NOTICE_KEY) ?? '';
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(['at', 'reason']);
  });

  describe('return URL', () => {
    it('round-trips a safe internal path once', () => {
      service.writeReturnUrl('/portfolio');
      expect(service.consumeReturnUrl()).toBe('/portfolio');
      expect(service.consumeReturnUrl()).toBeNull();
    });

    it('refuses to store an off-origin destination', () => {
      service.writeReturnUrl('https://evil.example/steal');
      expect(sessionStorage.getItem(SESSION_RETURN_URL_KEY)).toBeNull();
    });

    it('re-validates on read, so a tampered value is not trusted', () => {
      // Writing through the service is not the only way a value gets into
      // sessionStorage; validating only on write would make an XSS an open redirect.
      sessionStorage.setItem(SESSION_RETURN_URL_KEY, '//evil.example');
      expect(service.consumeReturnUrl()).toBeNull();
    });
  });
});
