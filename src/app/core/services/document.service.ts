import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
    providedIn: 'root',

})
export class DocumentService {
    constructor(
        private httpClient: HttpClient,
    ) { }

    getDocumentTypes(fundGuid):Observable<any> {
        return this.httpClient.get<any>(environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents/types");
    }

    loadDocuments(fundGuid, config):Observable<any> {
        return this.httpClient.get<any>(environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents", { params: config });
    }
}