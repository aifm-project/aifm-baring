import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'iframVideo',
  standalone:true
})
export class IframVideoPipe implements PipeTransform {
  constructor(public sanitizer: DomSanitizer,){

  }
  transform(url: any): any {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      if (!url) {
        return null;
      }
      const match = url.match(regExp);
      let id = match && match[2].length === 11 ? match[2] : null;
      let playvideo = "//www.youtube.com/embed/" + id;
      return  this.sanitizer.bypassSecurityTrustResourceUrl(playvideo);

      }

}
