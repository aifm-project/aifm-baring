import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExploreService } from '../core/services/explore.service';
import { environment } from '../../environments/environment';
import { IframVideoPipe } from '../shared/pipe/ifram-video.pipe';
import { aifmVideoFrame } from '../shared/components/video-frame/video-frame';

@Component({
  selector: 'app-news-and-insights',
  standalone: true,
  imports: [CommonModule, FormsModule,aifmVideoFrame],
  providers:[IframVideoPipe],
  templateUrl: './news-and-insights.component.html',
  styleUrls: ['./news-and-insights.component.scss']
})
export class NewsAndInsightsComponent {
  @ViewChildren(aifmVideoFrame) videoFrames!: QueryList<aifmVideoFrame>;
  selectedTopic = '';
  selectedSort = '';
  searchQuery = '';
  filteredAllData: any[] = [];
  filteredExploreData: any[] = [];
  filteredIndustryData: any[] = [];
  displayFeaturedArticle: any = {};

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
  explorData: any[] = [];
  public firstRowInfo: any = {};
  explorAllData: any[] = [];
  getIndustryData: any[] = [];
  firstIndustory: any;
   constructor(
      public explorService:ExploreService,
       public IframVideo: IframVideoPipe,
    ) { }

   ngOnInit(): void {
    this.displayFeaturedArticle = this.firstRowInfo;
    this.getAllExplorDetails()
    this.getExplorTypes();
    this.getIndustrySplit()
  }
  onTopicChange() {
    this.getExplorDetails();
    this.applyFiltersAndSort();
  }

  onSortChange() {
    this.applyFiltersAndSort();
  }

  onSearch() {
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort() {
    let allFiltered = [...this.explorAllData];

    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      allFiltered = allFiltered.filter(item => {
        const sectionName = (item.section_name || '').toLowerCase();
        const header = (item.header || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const createdDate = item.created_at ? new Date(item.created_at).toLocaleDateString().toLowerCase() : '';

        return (
          sectionName.includes(query) ||
          header.includes(query) ||
          description.includes(query) ||
          createdDate.includes(query)
        );
      });
    }

    const sortBy = this.selectedSort || 'latest';
    allFiltered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      if (sortBy === 'latest') {
        return dateB - dateA;
      } else if (sortBy === 'oldest') {
        return dateA - dateB;
      } else if (sortBy === 'popular') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      return 0;
    });

    this.filteredAllData = allFiltered;
    this.applySearchToAllSections();
  }

  private applySearchToAllSections() {
    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();

      this.filteredExploreData = this.explorData.filter(item => {
        const sectionName = (item.section_name || '').toLowerCase();
        const header = (item.header || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const createdDate = item.created_at ? new Date(item.created_at).toLocaleDateString().toLowerCase() : '';

        return (
          sectionName.includes(query) ||
          header.includes(query) ||
          description.includes(query) ||
          createdDate.includes(query)
        );
      });

      this.filteredIndustryData = this.getIndustryData.filter(item => {
        const sectionName = (item.section_name || '').toLowerCase();
        const header = (item.header || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const createdDate = item.created_at ? new Date(item.created_at).toLocaleDateString().toLowerCase() : '';

        return (
          sectionName.includes(query) ||
          header.includes(query) ||
          description.includes(query) ||
          createdDate.includes(query)
        );
      });

      this.displayFeaturedArticle = this.filteredExploreData.length > 0 ? this.filteredExploreData[0] : {};
    } else {
      this.filteredExploreData = this.explorData;
      this.filteredIndustryData = this.getIndustryData;
      this.displayFeaturedArticle = this.firstRowInfo;
    }
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
      this.typeOfExploreList.unshift({tab_id:'ALL',section_name:'All'})
      if(this.typeOfExploreList && this.typeOfExploreList.length){
        this.selectedTopic = this.typeOfExploreList[0].tab_id
        this.getExplorDetails()
      }
    })
  }

  getExplorDetails(){
    let query = {
      first:0,
      rows:1000
    }
     let skInfo = []
      let isFirstRow = true
      this.firstRowInfo = {}
    this.explorService.getExploreDetails(query,{tabId:this.selectedTopic,isLatest:true}).subscribe(sk=>{
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
            this.firstRowInfo = {
              ...rest,
              ...content
            }
            isFirstRow = false
          }
          skInfo.push({
             ...rest,
             ...content
          })
        }
      }
      this.explorData = skInfo;
      this.explorAllData = skInfo;
      this.applySearchToAllSections();
      this.applyFiltersAndSort();
    })
  }

  playVideo(skFrameId:string){
    const frame = this.videoFrames.find((vf:any) => vf.skFrameId === skFrameId);
    frame?.playVideo();
  }

  getAllExplorDetails(){
     let query = { }
     let skInfo = []
      let isFirstRow = true
      this.firstRowInfo = {}
    this.explorService.getExploreDetails(query,{isLatest:true}).subscribe(sk=>{
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
            this.firstRowInfo = {
              ...rest,
              ...content
            }
            isFirstRow = false
          }
          skInfo.push({
             ...rest,
             ...content
          })
        }
      }
      this.explorAllData = skInfo;
      this.applySearchToAllSections();
      this.applyFiltersAndSort();
    })
  }

   getIndustrySplit(){
      let query = {
        first: 0,
        rows: 4,
      };
     let skInfo = []
      let isFirstRow = true
      this.firstIndustory = {}
    this.explorService.getExploreDetails(query,{isLatest:true,isGroupBy:true,sectionName:this.staticSanctions.join(',')}).subscribe(sk=>{
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
            this.firstIndustory = {
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
      this.getIndustryData = skInfo;
      this.applySearchToAllSections();
    })
  }
}
