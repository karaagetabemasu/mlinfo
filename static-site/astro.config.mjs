import { defineConfig } from 'astro/config';
import {fileURLToPath} from 'node:url';
const site=process.env.SITE_URL;
if(!site || new URL(site).protocol!=='https:')throw Error('Set SITE_URL to the HTTPS production origin.');
export default defineConfig({site,output:'static',trailingSlash:'never',build:{format:'file',inlineStylesheets:'never'},vite:{resolve:{alias:{'@':fileURLToPath(new URL('../web/',import.meta.url))}}},security:{csp:{directives:["default-src 'self'","object-src 'none'","base-uri 'none'","connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com","img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com","font-src 'self'","form-action 'self'","worker-src 'self' blob:"],scriptDirective:{resources:["'self'","'wasm-unsafe-eval'","https://www.googletagmanager.com"]},styleDirective:{resources:["'self'"]}}}});
