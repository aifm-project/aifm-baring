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

    loadDocuments(fundGuid, config):Observable<any> {
        return this.httpClient.get<any>(environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents", { params: config }).pipe(map(sk=>({...sk,documents:sk.documents.filter(t=>t.type!=='Zip File')})));
    }

     loadLatestDocuments(fundGuid):Observable<any> {
        return this.httpClient.get<any>(environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents/latest");
    }
}