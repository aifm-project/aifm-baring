import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { readinessContext } from '../loading/readiness.model';

@Injectable({
    providedIn: 'root',

})
export class DocumentService {
    constructor(
        private httpClient: HttpClient,
    ) { }

    getDocumentTypes(fundGuid, taskId?: string):Observable<any> {
        return this.httpClient.get<any>(environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents/types",
            { context: taskId ? readinessContext(taskId) : undefined }).pipe(map(sk=>({...sk,data:sk.data.filter(t=>t.document_type!=='Zip File')})));
    }

    loadDocuments(fundGuid, config, taskId?: string):Observable<{count:number,data:any[]}> {
        return this.httpClient.get<{count:number,data:any[]}>(environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents/data",
            { params: config, context: taskId ? readinessContext(taskId) : undefined })
    }

     loadLatestDocuments(fundGuid, queryParams, taskId?: string):Observable<{data:any[]}> {
        return this.httpClient.get<{data:any[]}>(environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents/latest",
            { params: queryParams, context: taskId ? readinessContext(taskId) : undefined });
    }
}