import { Injectable } from '@angular/core';
import { compressToBase64, decompressFromBase64, compress, compressToUTF16, compressToUint8Array, compressToEncodedURIComponent } from 'lz-string';
import { Settings } from 'src/app/components/start/start.component';

@Injectable({
  providedIn: 'root'
})
export class CodecService {

  delimiter = ';'

  constructor() { }
  
  public compress(settings: Settings): string {
    const short = settings.phrase + this.delimiter + 
        settings.category + this.delimiter + 
        JSON.stringify(settings.spies) + this.delimiter + 
        settings.starts
    return compressEncode(short);
  }

  public decompress(compressed: string): Settings {
    const settingsString = decodeDecompress(compressed).split(this.delimiter)
    return {
      phrase: settingsString[0],
      category: settingsString[1] == "null" ? null : settingsString[1],
      spies: JSON.parse(settingsString[2]),
      starts: Number(settingsString[3]),
    }
  }
}

function compressEncode(data: any) {
  return encodeURIComponent(compressToBase64(data));
}

function decodeDecompress(data: any) {
  return decompressFromBase64(decodeURIComponent(data));
}