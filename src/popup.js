

/*
bgPage.oauth.authorize(function(token, secret) {
	document.getElementById("data").innerHTML = token + " : "+secret;
});
*/
var bgPage = chrome.extension.getBackgroundPage();
var $ = bgPage.$;
var Backbone = bgPage.Backbone;
var _ = bgPage._;

$(function(){
	bgPage.oauth.authorize(function(token, secret) {
		console.log("Authorize - Token:"+token+", Secret:"+secret);
	});

});
