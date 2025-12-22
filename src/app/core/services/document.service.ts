import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
    providedIn: 'root',

})
export class DocumentService {
    constructor(
        private httpClient: HttpClient,
    ) { }

    getDocumentTypes(fundGuid):Observable<any> {
        return this.httpClient.get<any>(environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents/types").pipe(map(sk=>({...sk,data:sk.data.filter(t=>t.document_type!=='Zip File')})));
    }

    loadDocuments(fundGuid, config):Observable<{count:number,data:any[]}> {
        return this.httpClient.get<{count:number,data:any[]}>(environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents/data", { params: config }).pipe(map(sk=>({...sk,data:sk.data.filter(t=>t.type!=='Zip File')})));
    }

     loadLatestDocuments(fundGuid):Observable<{data:any[]}> {
        return this.httpClient.get<{data:any[]}>(environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents/latest").pipe(map(sk=>({...sk,data:sk.data.filter(t=>t.type!=='Zip File')})));
    }
}