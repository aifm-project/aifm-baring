import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
@Injectable({
    providedIn: 'root',

})
export class FundService {
    constructor(
        private httpClient: HttpClient,
    ) { }

    getFunds(params): Observable<{ errorMessage: '', funds: [], count: 0 }> {
        return this.httpClient.get<{ errorMessage: '', funds: [], count: 0 }>(environment.aifEndPoint + "funds/summary", { params });
    }

    getPerformanceData(params: { fundGuid: string, classGuid: string, asOnDate: string }, type?: any): Observable<any> {
        var url = 'funds/' + params.fundGuid + '/classes/' + params.classGuid + '/performance?asOnDate=' + params.asOnDate;
        if (type) {
            url += '&type=' + type
        }
        return this.httpClient.get<any>(
            environment.aifEndPoint + url
        );
    }

    getDates(fundGuid: string, fundType: string, brand?) {
        let url = "funds/" + fundGuid + "/" + fundType + "/dates";
        if (brand) {
            url += "?brand=" + brand;
        }
        return this.httpClient.get<any>(environment.aifEndPoint + url);
    }


    portfolioData(fundId,queryParams): Observable<any> {
        var url = environment.aifEndPoint + "funds/" + fundId + "/portfolio";
        return this.httpClient.get<any>(url,{params:queryParams});
    }

    getDocuments(fundGuid: string): Observable<any> {
         var url = environment.aifEndPoint + "funds/" + fundGuid + "/dataroom/documents";
        return this.httpClient.get<any>(url);
    }

downloadDocument(documentId, onlyBlob = false): Promise<any> {
    let endPoint = environment.serverEndPoint + "dataroom/" + documentId + "/download/";
    return this.getContent(endPoint, onlyBlob);
}

  public async getContent(url, onlyBlob = false) {
    let options = {
      responseType: 'blob' as 'json'
    }

    if (!onlyBlob && environment.s3Client === true) {
      options = {
        responseType: "json"
      }
    }

    const file = await this.httpClient
      .get<any>(
        url, options
      )
      .toPromise();
    return file;
  }

    public downloadContent(response, fileName) {
    let windowURL = null;
    if (environment.s3Client === true) {
      console.log("response :", response.url);
      var link = document.createElement('a');
      link.href = response.url;
      link.target = "_blank";
      link.click();
      windowURL = response.url;
    } else {
      windowURL = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = windowURL;
      link.download = fileName;
      link.click();
    }
    setTimeout(() => {
      window.URL.revokeObjectURL(windowURL);
    }, 5000);
  }

}