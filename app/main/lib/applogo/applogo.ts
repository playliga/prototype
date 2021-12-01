import path from 'path';
import fs from 'fs';
import Application from 'main/constants/application';
import { nativeImage } from 'electron';


const _cache: Record<string, any> = {};


export default class AppLogo {
  private static logopath = path.join( __dirname, 'resources', Application.APP_LOGO_FILENAME );

  static getNativeImage() {
    if( !_cache.native_image ) {
      _cache.native_image = nativeImage.createFromPath( AppLogo.logopath );
    }

    return _cache.native_image;
  }

  static getBase64() {
    if( !_cache.base_64 ) {
      _cache.base_64 = fs.readFileSync( AppLogo.logopath ).toString( 'base64' );
    }

    return `data:image/png;base64,${_cache.base_64}`;
  }

  static getPath() {
    return AppLogo.logopath;
  }
}
