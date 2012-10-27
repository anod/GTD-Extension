"use strict";

window.oauth = ChromeExOAuth.initBackgroundPage({
	'request_url': 'https://www.google.com/accounts/OAuthGetRequestToken',
	'authorize_url': 'https://www.google.com/accounts/OAuthAuthorizeToken',
	'access_url': 'https://www.google.com/accounts/OAuthGetAccessToken',
	'consumer_key': 'anonymous',
	'consumer_secret': 'anonymous',
	'scope': 'https://mail.google.com/',
	'app_name': 'GTD GMail Extension',
	'callback_page': '../vendors/oauth/chrome_ex_oauth.html'
});
