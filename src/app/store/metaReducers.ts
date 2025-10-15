import { localStorageSync } from 'ngrx-store-localstorage';
import { MetaReducer } from '@ngrx/store';
import { StorageService } from '../core/services/storage-service.service';
// MetaReducers array for StoreModule
export const metaReducers: MetaReducer[] = [
  localStorageSync({
    keys: ['authState', 'fundState','dateState'], // Persist the 'auth' and 'fund' feature states
    rehydrate: true, // Automatically rehydrate the state on refresh
    storage: {
      getItem: (key) => {
        const encrypted = localStorage.getItem(key);
        let isDecriptByDevelper = localStorage.getItem('ENCRYPT') ? (localStorage.getItem('ENCRYPT')=='true' ? false : true) : localStorage.getItem("isSkDeveloper");
        return encrypted ? (isDecriptByDevelper ? encrypted : new StorageService().secureStorage.decrypt(encrypted)) : null;
      },
      setItem: (key, value) => {
        let isDecriptByDevelper = localStorage.getItem('ENCRYPT') ? (localStorage.getItem('ENCRYPT')=='true' ? false : true) : localStorage.getItem("isSkDeveloper");
        const encrypted = isDecriptByDevelper ? value : new StorageService().secureStorage.encrypt(value);
        localStorage.setItem(key, encrypted);
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
      },
      length: 0,
      clear: function (): void {},
      key: function (index: number): string | null { return null; }
    },
  }),
];