import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-video-frame',
  imports: [CommonModule],
  standalone:true,
  templateUrl: './video-frame.html',
  styleUrl: './video-frame.scss'
})
export class aifmVideoFrame {
  @ViewChild('skVideoFrame', { static: false })
  skVideoFram!: ElementRef<HTMLIFrameElement>;
  @Input() public videoUrl:any;
  @Input() width:string = '100%'
  @Input() height:string='100%'
  @Input() public skFrameId:string;

  playVideo() {
  const iframe = this.skVideoFram?.nativeElement;
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  const video = doc?.querySelector('video') as HTMLVideoElement | null;
  video?.play();
}
}
