"use strict";

window.gtd.Suggestion.SuggestionCollection = Backbone.Collection.extend({
	
	add: function(suggestion) {
		//
		this.trigger('analysis:suggestion:new', suggestion);
	}


});