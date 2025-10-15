const windowLocationHost = 'staging-vc.aifmetrics.com';
export const environment = {
  production: true,
  builderApiKey: '563a90ce06cf47e7b58977a93621d124',
  serverBaseEndPoint: "https://"+ windowLocationHost +"/",
  serverEndPoint: "https://"+ windowLocationHost +"/api/v1/",
  serverEndPointv2: "https://"+ windowLocationHost +"/api/v2/",
  serverEndPointv3: "https://"+ windowLocationHost +"/api/v3/",
  aifEndPoint: "https://"+ windowLocationHost +"/api/",
  assetsEndPoint: "../../../../assets/svg-icon/",
  computeEndPoint: "http://localhost:3200/api/v1/compute/",
  socketServer: "http://localhost:3001/chat/",
  mutualFundsEndPoint: "https://mutualfunds.aifmetrics.com/",
  localStorageToken: "aif-token",
  localCurrentStorageToken: "current-aif-token",
  localStorageUser: "user",
  localStorageFund: "currentFund",
  cookieDomain: "aifmetrics.com",
  secureStorage: false,
  windowLocationHost: windowLocationHost,
   genericAlpha: "aifmetrics",
  exploreURL: "https://aiffrontend.s3.ap-south-1.amazonaws.com/icons/",
  s3Client:false
};
