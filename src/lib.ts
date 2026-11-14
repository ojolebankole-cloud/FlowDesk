export function readStore<T>(key:string,fallback:T):T { try { const v=localStorage.getItem('flowdesk:'+key); return v?JSON.parse(v):fallback; } catch { return fallback; } }
export function writeStore(key:string,value:unknown){localStorage.setItem('flowdesk:'+key,JSON.stringify(value));}
export const money=(n:number,currency='USD')=>new Intl.NumberFormat(undefined,{style:'currency',currency,maximumFractionDigits:2}).format(n||0);

/** Remaining browser-preview datasets are namespaced by authenticated account and active workspace until their dedicated APIs are delivered. */
export function readScopedStore<T>(scope:string,key:string,fallback:T):T {
 try { const value=localStorage.getItem(`flowdesk:${scope}:${key}`);return value?JSON.parse(value) as T:fallback; }
 catch { return fallback; }
}
export function writeScopedStore(scope:string,key:string,value:unknown){localStorage.setItem(`flowdesk:${scope}:${key}`,JSON.stringify(value));}
