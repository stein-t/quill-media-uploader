import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import Quill from 'quill';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import MediaUploader from './utils/MediaUploader';

Quill.register('modules/mediaUploader', MediaUploader);

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
