import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardNavigationButton } from '../../../shared/components/dashboard-navigation-button/dashboard-navigation-button';
import { ExploreService } from '../../../core/services/explore.service';
import { environment } from '../../../../environments/environment';
import { IframVideoPipe } from '../../../shared/pipe/ifram-video.pipe';
import { aifmVideoFrame } from '../../../shared/components/video-frame/video-frame';
import { Tooltip } from 'bootstrap';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule,DashboardNavigationButton,aifmVideoFrame],
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss'],
  providers:[IframVideoPipe]
})
export class InsightsComponent implements OnInit, AfterViewInit {
  // Dynamic tooltip properties
  infoIconAlt: string = 'Latest Insights Information';
  infoIconTitle: string = 'Commentary or analysis on markets, sectors, or portfolio companies';

  @ViewChildren('infoIcon') infoIconElements!: QueryList<ElementRef>;
  featuredInsight = {
    id: 1,
    title: 'Future of Digital Transformation in Enterprise',
    category: 'MACROECONOMICS',
    date: 'Jun 5, 2025',
    readTime: '12 mins',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/c516dc706e2479c075f2791958eb9ffb50443b4a?width=1280',
    hasVideo: true
  };

  sideInsights = [
    {
      id: 2,
      title: 'Achieving sustainable growth: Make sustainability the focus',
      category: 'MACROECONOMICS',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/ef25e34670c93b59e26fb25d6ee458d399d14b10?width=620',
      hasVideo: false
    },
    {
      id: 3,
      title: 'Baring Private Equity India invests $12 mn in Aditya Auto',
      category: 'PORTFOLIO HIGHLIGHTS',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/4fa27752bfbd803b8391d32f6c9a70b1a46f6cac?width=620',
      hasVideo: true
    }
  ];
  public staticSanctions = ['MACROECONOMICS','PORTFOLIO HIGHLIGHTS','FUNDNEWS']
  explorAllData: any[] = [];
  firstExplore: any = {};
  constructor(private router: Router, public explorService:ExploreService,public IframVideo: IframVideoPipe,) {}
  ngOnInit(): void {
    this.getAllExplorDetails()
  }

  ngAfterViewInit() {
    this.initializeTooltips();
  }

  private initializeTooltips() {
    // Initialize Bootstrap tooltips with responsive placement
    this.infoIconElements.forEach((element: ElementRef) => {
      const tooltipElement = element.nativeElement;
      new Tooltip(tooltipElement, {
        placement: 'auto',
        trigger: 'hover focus',
        html: false,
        delay: { show: 100, hide: 100 }
      });
    });
  }

  onViewAllInsights() {
    this.router.navigate(['/insights']);
  }

  onSummarizeInsights() {
    console.log('Summarize insights');
  }

  onReadInsight(type: string) {
    console.log('Read insight:', type);
  }

  getExploreKeys(){
    
  }

    getAllExplorDetails(){
       let query = {
        first:0,
        rows:3
        }
       let skInfo = []
        let isFirstRow = true
      this.explorService.getExploreDetails(query,{isLatest:true,sectionName:this.staticSanctions.join(',')}).subscribe(sk=>{
        console.log("sk",sk.exploreData)
       
        for (const sk1 of sk.exploreData) {
          sk1.content = JSON.parse(sk1.content);
          if(this.staticSanctions.includes(sk1.section_name)){
          if (sk1.content.isImage == true || sk1.content.isImage == 'true') {
              sk1.content.images = environment.exploreURL + sk1?.content?.images
            } else {
              sk1.content.video = this.IframVideo.transform(sk1?.content?.video);
            }
            let {content,...rest} = sk1
            if(isFirstRow){
                this.firstExplore = {
               ...rest,
               ...content
            }
            isFirstRow = false
            }else {
               skInfo.push({
               ...rest,
               ...content
            })
            }
           
          }
        }
        this.explorAllData = skInfo
      })
    }
}
