import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExploreService } from '../core/services/explore.service';
import { environment } from '../../environments/environment';
import { IframVideoPipe } from '../shared/pipe/ifram-video.pipe';
@Component({
  selector: 'app-news-and-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers:[IframVideoPipe],
  templateUrl: './news-and-insights.component.html',
  styleUrls: ['./news-and-insights.component.scss']
})
export class NewsAndInsightsComponent {
  selectedTopic = '';
  selectedSort = '';
  searchQuery = '';

  newsItems = [
    {
      id: 1,
      category: 'MACROECONOMICS',
      title: 'Future of Digital Transformation in Enterprise',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/9c20b86987460e8b8058daf80661f02810665486?width=1720',
      isFeatured: true,
      hasVideo: true
    },
    {
      id: 2,
      category: 'MACROECONOMICS',
      title: 'Covid-19 lockdown and the strange investment conundrum',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/034c892bfc7c29406cc130cb54307fd822277c5e?width=840',
      hasVideo: false
    },
    {
      id: 3,
      category: 'MACROECONOMICS',
      title: 'Achieving sustainable growth: Make sustainability the focus',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/41a0b697b32c347e388fec71acc61dfe0562cfc0?width=342',
      hasVideo: false
    },
    {
      id: 4,
      category: 'FUND NEWS',
      title: 'Rahul Bhasin on where to look for big returns over the next 5-10 years',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b72feb79b0bbd2a3a375500e2810ef82ce50ee8f?width=840',
      hasVideo: false
    },
    {
      id: 5,
      category: 'MACROECONOMICS',
      title: 'Key is to deliver returns over a 20-year period',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b72feb79b0bbd2a3a375500e2810ef82ce50ee8f?width=840',
      hasVideo: false
    },
    {
      id: 6,
      category: 'PORTFOLIO HIGHLIGHTS',
      title: 'Baring PE exits Muthoot Finance, it\'s third in 3 weeks',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/316040d49001e99cbac017f480e653867a23b394?width=839',
      hasVideo: false
    },
    {
      id: 7,
      category: 'MACROECONOMICS',
      title: 'Achieving sustainable growth: Make sustainability the focus',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/2b9e276c328c51fe93269e5ba5c55ca2a8fd66f8?width=840',
      hasVideo: true
    },
    {
      id: 8,
      category: 'MACROECONOMICS',
      title: 'An attractive time to get more aggressive: Baring India',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b72feb79b0bbd2a3a375500e2810ef82ce50ee8f?width=840',
      hasVideo: false
    },
    {
      id: 9,
      category: 'PORTFOLIO HIGHLIGHTS',
      title: 'Covid-19 lockdown and the strange investment conundrum',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/73baddb2931b101facd12fece6ee8aefa9301bc5?width=840',
      hasVideo: false
    },
    {
      id: 10,
      category: 'MACROECONOMICS',
      title: 'Baring\'s Rahul Bhasin remains a big bull in long-term India story',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/034c892bfc7c29406cc130cb54307fd822277c5e?width=840',
      hasVideo: false
    },
    {
      id: 11,
      category: 'FUND NEWS',
      title: 'Baring Scores 4th Exit in a month with Vardhman',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/c64f830994f2e307ef25f8131031f179628322f9?width=840',
      hasVideo: false
    },
    {
      id: 12,
      category: 'MACROECONOMICS',
      title: 'Baring Private Equity India invests $12 mn in Aditya Auto',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/8fc252200e24de9f202cd53701d8fa04dccef17b?width=840',
      hasVideo: false
    },
    {
      id: 13,
      category: 'MACROECONOMICS',
      title: 'Baring Scores 4th Exit in a month with Vardhman',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/8a20946b1089d22ab8219c582f732eab20f6aabb?width=840',
      hasVideo: true
    }
  ];

  spotlightArticle = {
    category: 'INDUSTRY SPOTLIGHT',
    title: 'Electric Vehicles and the Future of Transportation',
    description: 'Once a niche bet, electric vehicles now stand at the crossroads of policy, innovation, and consumer demand. This moment offers a lens into how industries and investments  evolve.',
    relatedNews: [
      {
        category: 'PORTFOLIO HIGHLIGHTS',
        title: 'Baring Private Equity India invests $12 mn in Aditya Auto',
        date: 'Jul 6, 2025',
        readTime: '7 mins',
        image: 'https://api.builder.io/api/v1/image/assets/TEMP/f099eb391b416577aefcbd57cb7b4216f56e845a?width=342',
        hasVideo: false
      },
      {
        category: 'MACROECONOMICS',
        title: 'The Rise and Fall of Electric Vehicle Industry in India',
        date: 'Jul 6, 2025',
        readTime: '7 mins',
        image: 'https://api.builder.io/api/v1/image/assets/TEMP/ec75522bb34c70fe47a4b505a9fbab9ce906e404?width=342',
        hasVideo: true
      },
      {
        category: 'FUND NEWS',
        title: 'Rahul Bhasin on where to look for big returns over the next 5-10 years',
        date: 'Jul 6, 2025',
        readTime: '7 mins',
        image: 'https://api.builder.io/api/v1/image/assets/TEMP/41a0b697b32c347e388fec71acc61dfe0562cfc0?width=342',
        hasVideo: false
      }
    ]
  };
  public staticSanctions = ['MACROECONOMICS','PORTFOLIO HIGHLIGHTS','FUNDNEWS']
  newsletterEmail = '';
  typeOfExploreList: any[] = [];
  explorData: any[];
  public firstRowInfo: any = {};
   constructor(
      public explorService:ExploreService,
       public IframVideo: IframVideoPipe,
    ) { }

   ngOnInit(): void {
    this.getExplorTypes()
  }
  onTopicChange() {
    // console.log('Topic changed:', this.selectedTopic);
    this.getExplorDetails()
  }

  onSortChange() {
    console.log('Sort changed:', this.selectedSort);
  }

  onSearch() {
    console.log('Search:', this.searchQuery);
  }

  onSubscribeNewsletter() {
    if (this.newsletterEmail) {
      console.log('Subscribe:', this.newsletterEmail);
      this.newsletterEmail = '';
    }
  }

  getExplorTypes(){
    this.explorService.getExplorTypes().subscribe(sk=>{
      this.typeOfExploreList = sk.exploreKeys.filter(sk=>this.staticSanctions.includes(sk.section_name));
      if(this.typeOfExploreList && this.typeOfExploreList.length){
        this.selectedTopic = this.typeOfExploreList[0].tab_id
        this.getExplorDetails()
      }
    })
  }

  getExplorDetails(){
    let query = {
      row:0,
      offset:1000,
      type:'fund_updates',
      tabId:this.selectedTopic
    }
     let skInfo = []
      let isFirstRow = true
      this.firstRowInfo = {}
    this.explorService.getExploreDetails(query).subscribe(sk=>{
      console.log("sk",sk.exploreData)
     
      for (const sk1 of sk.exploreData) {
        sk1.content = JSON.parse(sk1.content);
        if(this.staticSanctions.includes(sk1.section_name)){
        if (sk1.content.isImage == true || sk1.content.isImage == 'true') {
            sk1.content.images = environment.exploreURL + sk1?.content?.images
          } else {
            sk1.content.video = this.IframVideo.transform(sk1?.content?.video);
          }
          if(isFirstRow){
            let {content,...rest} = sk1
            this.firstRowInfo = {
              rest,
              ...content
            }
            isFirstRow = false
          }
          skInfo.push(sk1)
        }
      }
      this.explorData = skInfo
    })
  }
}
