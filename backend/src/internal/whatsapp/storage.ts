import { proto } from '@whiskeysockets/baileys';
import { initAuthCreds, BufferJSON, AuthenticationCreds } from '@whiskeysockets/baileys';
import { Storage } from '@google-cloud/storage';
import NodeCache from 'node-cache';

export class WhatsappStorage {
  private storage: Storage;
  private cache: NodeCache;
  private bucketName: string;
  private STATE_FILE = 'whatsapp-state.json';

  constructor(bucketName: string, projectId: string) {
    this.storage = new Storage({ projectId });
    this.bucketName = bucketName;
    this.cache = new NodeCache({ 
      stdTTL: 0,
      checkperiod: 0,
      useClones: false
    });
  }

  async initialize() {
    const state = await this.loadStateFromBucket();
    if (state) {
      this.cache.mset([
        { key: 'creds', val: state.creds as AuthenticationCreds },
        ...Object.entries(state.keys).map(([key, val]) => ({ key, val }))
      ]);
      console.log('🔄 Estado cargado desde el bucket.');
    } else {
      const creds = initAuthCreds();
      this.cache.set('creds', creds);
      console.log('🔄 Estado inicial creado.');
    }
  }

  async useMultiFileAuthState() {
    return {
      state: {
        creds: this.cache.get('creds') as AuthenticationCreds,
        keys: {
          get: async (type: string, ids: string[]) => {
            const data: { [key: string]: any } = {};
            for (const id of ids) {
              const key = `${type}-${id}`;
              let value = this.cache.get(key);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            }
            return data;
          },
          set: async (data: any) => {
            for (const category in data) {
              for (const id in data[category]) {
                const value = data[category][id];
                const key = `${category}-${id}`;
                if (value) {
                  this.cache.set(key, value);
                } else {
                  this.cache.del(key);
                }
              }
            }
          }
        }
      },
      saveCreds: () => {
        const state = this.getState();
        this.cache.set('creds', state.creds);
      }
    };
  }

  private async loadStateFromBucket(): Promise<{ creds: AuthenticationCreds, keys: { [key: string]: any } } | null> {
    try {
      const file = this.storage.bucket(this.bucketName).file(this.STATE_FILE);
      const exists = await file.exists();
      if (exists[0]) {
        const [content] = await file.download();
        const state = JSON.parse(content.toString(), BufferJSON.reviver) as { creds: AuthenticationCreds, keys: { [key: string]: any } };
        return state;
      }
      return null;
    } catch (error) {
      console.error('❌ Error al cargar el estado desde el bucket:', error);
      return null;
    }
  }

  private getState() {
    const keys: { [key: string]: any } = {};
    const allKeys = this.cache.keys().filter(k => k !== 'creds');
    
    for (const key of allKeys) {
      keys[key] = this.cache.get(key);
    }

    return {
      creds: this.cache.get('creds') as AuthenticationCreds,
      keys
    };
  }

  async saveState(): Promise<void> {
    try {
      const state = this.getState();
      const content = JSON.stringify(state, BufferJSON.replacer);
      await this.storage
        .bucket(this.bucketName)
        .file(this.STATE_FILE)
        .save(content);
      console.log('💾 Estado guardado en el bucket.');
    } catch (error) {
      console.error('❌ Error al guardar el estado en el bucket:', error);
      throw error;
    }
  }

  async clearSession(): Promise<void> {
    this.cache.flushAll();
    console.log('🗑️ Cache limpiada.');
  }
}