import { Injectable } from '@angular/core';
import {
  NOTICE_TTL_MS,
  SESSION_NOTICE_KEY,
  SESSION_RETURN_URL_KEY,
  SessionEndReason,
  SessionNotice,
  isSafeReturnUrl,
} from './session.model';

/**
 * Carries one fact - "the last session ended, and why" - from the moment the session
 * ends to the login screen that has to explain it.
 *
 * Why sessionStorage rather than a service field: the handover has to survive a full
 * document load. Manual logout still uses `window.location.href`, a user can refresh
 * the login page before reading the message, and a tab following another tab's logout
 * may reload. An in-memory field is gone in all three cases, which is precisely the
 * "why am I suddenly on the login page?" experience this work exists to remove.
 *
 * Three properties make it safe:
 *  - It holds a reason enum and a timestamp. No token, no user id, no email.
 *  - It is consumed on read. Reading it deletes it, so a refresh of the login page
 *    shows the message once and then stops - not forever, which is how a stale
 *    "session expired" banner ends up greeting a user who never expired.
 *  - It expires. A notice older than NOTICE_TTL_MS is dropped unread.
 *
 * sessionStorage (not localStorage) also scopes it to the tab that actually lost the
 * session, so an unrelated tab does not inherit someone else's explanation.
 */
@Injectable({ providedIn: 'root' })
export class SessionNoticeService {
  /**
   * Record why the session ended, for the login screen to pick up.
   *
   * Call AFTER storage has been cleared - the clear would otherwise erase it, which
   * is the single most likely way for this whole mechanism to silently do nothing.
   */
  write(reason: SessionEndReason): void {
    const payload: SessionNotice = { reason, at: Date.now() };
    try {
      sessionStorage.setItem(SESSION_NOTICE_KEY, JSON.stringify(payload));
    } catch {
      // Private-mode quota failures must never break sign-out. Losing the
      // explanation is a degraded experience; a thrown exception mid-logout would
      // abandon the cleanup half-done, which is a security problem.
    }
  }

  /** Read and delete in one step. A notice is shown exactly once, ever. */
  consume(): SessionNotice | null {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(SESSION_NOTICE_KEY);
      sessionStorage.removeItem(SESSION_NOTICE_KEY);
    } catch {
      return null;
    }
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<SessionNotice>;
      if (!parsed || typeof parsed.reason !== 'string' || typeof parsed.at !== 'number') {
        return null;
      }
      // A clock change can make `at` appear to be in the future; treat any
      // out-of-window value as stale rather than trusting it.
      const age = Date.now() - parsed.at;
      if (age < 0 || age > NOTICE_TTL_MS) return null;
      return { reason: parsed.reason as SessionEndReason, at: parsed.at };
    } catch {
      return null;
    }
  }

  /** Remember where the user was, so sign-in can put them back. */
  writeReturnUrl(url: string): void {
    // Validated on the way in AND on the way out. The store is sessionStorage, which
    // any script on the origin can write; trusting it on read alone would turn an
    // XSS into an open redirect.
    if (!isSafeReturnUrl(url)) return;
    try {
      sessionStorage.setItem(SESSION_RETURN_URL_KEY, url);
    } catch {
      /* see write() */
    }
  }

  /** Read and delete the return path, re-validating before handing it to the router. */
  consumeReturnUrl(): string | null {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(SESSION_RETURN_URL_KEY);
      sessionStorage.removeItem(SESSION_RETURN_URL_KEY);
    } catch {
      return null;
    }
    return isSafeReturnUrl(raw) ? raw : null;
  }
}
