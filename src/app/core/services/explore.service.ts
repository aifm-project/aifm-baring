import { HttpClient } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ExploreService {
     constructor(
        private httpClient: HttpClient,
    ) { }

    getExplorTypes():Observable<{ errorMessage:string, exploreKeys:any[]}> {
        return this.httpClient.get<{ errorMessage:string, exploreKeys:any[]}>(environment.serverEndPoint + "explore/typesExplore", { params:{domain:environment.windowLocationHost} });
    }

    getExploreDetails(params,body):Observable<{ errorMessage:string, exploreData:any[],totalRecords:number}> {
        if(params){
          params['domain'] = environment.windowLocationHost
        }
        return this.httpClient.post<{ errorMessage:string, exploreData:any[],totalRecords:number}>(environment.serverEndPoint + "explore/baring/group/data",body, { params:params, });
    }


}
