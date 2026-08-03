import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Pre-auth payload encryption via ephemeral ECDH key exchange.
 *
 * For each login/OTP request the frontend generates a throwaway P-256 key
 * pair, performs ECDH against the backend's static public key, and derives
 * an AES-256-GCM session key via HKDF-SHA-256. No secret is stored in the
 * bundle; the ephemeral private key exists only in memory for the life of
 * the encrypt() call and is discarded once the AES key is derived.
 *
 * Wire format (same as the per-session scheme):
 *   request body: { ecdhPublicKey: "<spkiBase64>", encryptedMessage: "<iv:ct:tag>" }
 *   response body: "<iv:ciphertext:tag>" (all base64, AES-256-GCM)
 */
@Injectable({ providedIn: 'root' })
export class PreAuthEncryptionService {
  private readonly publicKeyUrl = environment.serverEndPoint + 'pre-auth/public-key';
  private readonly http: HttpClient;

  // Backend's static ECDH public key — cached until reset() is called.
  private backendKeyPromise: Promise<CryptoKey> | null = null;

  private readonly INFO = new TextEncoder().encode('aifm-pre-auth-v1');

  constructor(httpBackend: HttpBackend) {
    // Bypass the interceptor so the bootstrap fetch is never encrypted.
    this.http = new HttpClient(httpBackend);
  }

  reset(): void {
    this.backendKeyPromise = null;
  }

  /**
   * Generate an ephemeral ECDH key pair and derive the AES key without encrypting a body.
   * Used for bodyless GET requests that need an encrypted response via x-ecdh-public-key header.
   */
  async prepareGetKey(): Promise<{ ecdhPublicKey: string; aesKey: CryptoKey }> {
    const backendPublicKey = await this.getBackendPublicKey();
    const { publicKey: frontendPublicKey, privateKey: frontendPrivateKey } =
      await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
    const aesKey = await this.deriveAesKey(frontendPrivateKey, backendPublicKey);
    const spki = await crypto.subtle.exportKey('spki', frontendPublicKey);
    const ecdhPublicKey = this.toBase64(new Uint8Array(spki));
    return { ecdhPublicKey, aesKey };
  }

  /**
   * Encrypt a request body. Returns the ECDH public key to include in the
   * request alongside the ciphertext, plus the AES key needed to decrypt
   * the corresponding response.
   */
  async encrypt(body: any): Promise<{ ecdhPublicKey: string; encryptedMessage: string; aesKey: CryptoKey }> {
    const backendPublicKey = await this.getBackendPublicKey();

    const { publicKey: frontendPublicKey, privateKey: frontendPrivateKey } =
      await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);

    const aesKey = await this.deriveAesKey(frontendPrivateKey, backendPublicKey);

    const spki = await crypto.subtle.exportKey('spki', frontendPublicKey);
    const ecdhPublicKey = this.toBase64(new Uint8Array(spki));

    const encryptedMessage = await this.aesGcmEncrypt(aesKey, body);
    return { ecdhPublicKey, encryptedMessage, aesKey };
  }

  /** Decrypt a response ciphertext using the AES key returned by encrypt(). */
  async decrypt(ciphertext: string, aesKey: CryptoKey): Promise<any> {
    const [ivB64, dataB64, tagB64] = ciphertext.split(':');
    const iv = this.fromBase64(ivB64);
    const data = this.fromBase64(dataB64);
    const tag = this.fromBase64(tagB64);
    const sealed = new Uint8Array(data.length + tag.length);
    sealed.set(data);
    sealed.set(tag, data.length);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: 128 }, aesKey, sealed.buffer as ArrayBuffer);
    const text = new TextDecoder().decode(plain);
    return text ? JSON.parse(text) : text;
  }

  private getBackendPublicKey(): Promise<CryptoKey> {
    if (!this.backendKeyPromise) {
      this.backendKeyPromise = this.fetchAndImportBackendKey().catch(err => {
        this.backendKeyPromise = null;
        throw err;
      });
    }
    return this.backendKeyPromise;
  }

  private async fetchAndImportBackendKey(): Promise<CryptoKey> {
    const { publicKey } = await firstValueFrom(
      this.http.get<{ publicKey: string }>(this.publicKeyUrl)
    );
    const der = this.fromBase64(publicKey);
    return crypto.subtle.importKey(
      'spki', der.buffer as ArrayBuffer, { name: 'ECDH', namedCurve: 'P-256' }, false, []
    );
  }

  private async deriveAesKey(privateKey: CryptoKey, backendPublicKey: CryptoKey): Promise<CryptoKey> {
    const sharedBits = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: backendPublicKey }, privateKey, 256
    );
    const hkdfKey = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0).buffer as ArrayBuffer, info: this.INFO.buffer as ArrayBuffer },
      hkdfKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async aesGcmEncrypt(key: CryptoKey, body: any): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(body ?? null));
    const sealed = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: 128 }, key, encoded.buffer as ArrayBuffer)
    );
    const tagStart = sealed.length - 16;
    return `${this.toBase64(iv)}:${this.toBase64(sealed.subarray(0, tagStart))}:${this.toBase64(sealed.subarray(tagStart))}`;
  }

  private toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  private fromBase64(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
}
