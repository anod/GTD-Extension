"use strict";

window.gtd.Gmail.NewList = Backbone.Collection.extend({
	model: window.gtd.Gmail.Entry,

	oauth: null,
	feedUrl : 'https://mail.google.com/mail/feed/atom',
	instanceId : 'gmc' + parseInt(Date.now() * Math.random(), 10),

	initialize: function(models, options) {
		this.oauth = options.oauth;
		_.bind(this.feedResponse, this);
	},
	
	loadNewEmails: function() {
		var request = {
			'method' : 'GET',
			'parameters' : {
				'zx' : this.instanceId
			}
		};
		var self = this;
		this.oauth.sendSignedRequest(this.feedUrl, function(resp, xhr) {
			self.feedResponse(resp,xhr);
		}, request);
	},
	
	feedResponse: function(resp, xhr) {
		var xmlDoc = $.parseXML(resp);
		var $xml = $(xmlDoc);
		var $entries = $xml.find("entry");
		var models = [];
		$.each($entries, function(key, value) {
			var $entry = $(this);
			var $author = $entry.find("author");
			models.push({
				title:  $entry.find("title").text(),
				summary: $entry.find("summary").text(),
				author_name: $author.find("name").text(),
				author_email: $author.find("email").text()
			});
		});
		this.reset(models, {silent: true});
		this.trigger("gmail:newlist",this);
	}


});
