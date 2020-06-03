const request = require("superagent");
var btoa = require("btoa");
var credentials = {
  userid: "09019736366",
  clientid: "96c332c1db0043a6b119effadebfc286",
  secret: process.env.SBANKEN_PW,
};

exports.getAccessToken = () => {
  var identityServerUrl =
    "https://auth.sbanken.no/identityserver/connect/token"; // access token endpoint

  var clientId = credentials.clientid; // application key received from API Beta in the internetbank
  var secret = credentials.secret; // password received from API Beta in the internetbank

  var basicAuth = btoa(
    encodeURIComponent(clientId) + ":" + encodeURIComponent(secret)
  ); // create basicAuth header value according to Oauth 2.0 standard

  var accessToken;

  // request accessToken (the basic auth data is put on the request header prior to sending the request)

  let response;

  var promise = new Promise(function (resolve, reject) {
    request
      .post(identityServerUrl)
      .send("grant_type=client_credentials")
      .set("Authorization", "Basic " + basicAuth)
      .set("Accept", "application/json")
      .set("customerId", credentials.userid)
      .end(function (err, res) {
        if (err || !res.ok) {
          reject();
        } else {
          resolve(res.body);
        }
      });
  });

  return promise;
};

exports.getAccountDetails = (accessToken) => {
  var accountServiceUrl = "https://api.sbanken.no/exec.bank/api/v1/accounts/"; //

  // use accessToken to request accounts (the bearer token (accessToken) is put on the request header prior to sending the request)

  var promise = new Promise(function (resolve, reject) {
    request
      .get(accountServiceUrl)
      .set("Authorization", "Bearer " + accessToken)
      .set("Accept", "application/json")
      .set("customerId", credentials.userid)
      .end(function (err, res) {
        if (err || !res.ok) {
          reject();
        } else {
          resolve(res.body);
        }
      });
  });

  return promise;
};

exports.getAccountNumberDetails = (accountId, accessToken) => {
  var accountNumberDetailsUrl =
    "https://api.sbanken.no/exec.bank/api/v1/accounts/" + accountId; //

  // use accessToken to request accounts (the bearer token (accessToken) is put on the request header prior to sending the request)

  var promise = new Promise(function (resolve, reject) {
    request
      .get(accountNumberDetailsUrl)
      .set("Authorization", "Bearer " + accessToken)
      .set("Accept", "application/json")
      .set("customerId", credentials.userid)
      .end(function (err, res) {
        if (err || !res.ok) {
          reject();
        } else {
          resolve(res.body);
        }
      });
  });

  return promise;
};

exports.getAccountTransactions = (accountId, accessToken) => {
  var requestUrl =
    "https://api.sbanken.no/exec.bank/api/v1/transactions/" + accountId; //

  // use accessToken to request accounts (the bearer token (accessToken) is put on the request header prior to sending the request)

  var promise = new Promise(function (resolve, reject) {
    request
      .get(requestUrl)
      .set("Authorization", "Bearer " + accessToken)
      .set("Accept", "application/json")
      .set("customerId", credentials.userid)
      .end(function (err, res) {
        if (err || !res.ok) {
          reject();
        } else {
          resolve(res.body);
        }
      });
  });

  return promise;
};
