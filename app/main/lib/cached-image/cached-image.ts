import fs from 'fs';
import path from 'path';
import Application from 'main/constants/application';
import { nativeImage } from 'electron';


const _cache: Record<string, any> = {};


class BaseCachedImage {
  private logopath: string;

  constructor( logopath: string ) {
    this.logopath = logopath;
  }

  private initCacheEntry() {
    if( !_cache[ this.logopath ] ) {
      _cache[ this.logopath ] = {};
    }
  }

  public getNativeImage() {
    this.initCacheEntry();

    if( !_cache[ this.logopath ].native_image ) {
      _cache[ this.logopath ].native_image = nativeImage.createFromPath( this.logopath );
    }

    return _cache[ this.logopath ].native_image;
  }

  public getBase64() {
    this.initCacheEntry();

    if( !_cache[ this.logopath ].base_64 ) {
      _cache[ this.logopath ].base_64 = fs.readFileSync( this.logopath ).toString( 'base64' );
    }

    return `data:image/png;base64,${_cache[ this.logopath ].base_64}`;
  }

  public getPath() {
    return this.logopath;
  }
}


export class AppLogo extends BaseCachedImage {
  private static logopath = path.join( __dirname, 'resources', Application.APP_LOGO_FILENAME );

  constructor() {
    super( AppLogo.logopath );
  }
}


export class TeamLogo extends BaseCachedImage {
  private static basepath = path.join( __dirname, 'resources/teamlogos' );

  constructor( name: string ) {
    const logo_filename = `${name}.png`;
    const logopath = path.join( TeamLogo.basepath, logo_filename );
    super( logopath );
  }
}
