//import axios from "axios";
import * as Pixi from "pixi.js";

import { log } from "~shared/log";

//const ASSET_BASE_URL = "http://localhost:3000/assets";
export function makeAssetUrl(url: string): string {
  //const root = document.domain;
  //const str = `${root}/${url}`;
  const str = `/assets/${url}`;
  log.info(`asset url: ${str}`);
  return str;
}

//export async function loadFromManifest(assetBaseUrl: string, manifestUrl: string): void {
//  const manifest = await axios.get(manifestUrl)
//    .then(res => res.data);
//  const loader = Pixi.Loader.shared;
//}
