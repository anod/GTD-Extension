"use strict";

window.gtd.Analysis.TermExtraction = Backbone.Model.extend({
	STOP_WORDS:
    [
      "a", "an", "and", "are", "as", "at", "be", "but",
      "by", "for", "if", "in", "into", "is", "it", "no",
      "no", "not", "of", "on", "or", "s", "such", "t",
      "that", "the", "their", "they", "then", "there", 
      "these", "this", "to", "was", "will", "with"
    ],

    _stopWords : null,

	initialize : function() {
		this._stopWords = this._createStopWords();
	},

	extract : function(text) {
		return this._tokenize(text);
	},

	_createStopWords : function() {
		var result = {};
		for ( var i = 0; i < this.STOP_WORDS.length; i++) {
			result[this.STOP_WORDS[i]] = 1;
		}
		return result;
	},
	
	/**
	 * Converts a string into an array of tokens, removing stopwords and punctuation.
	 */
	_tokenize : function(s) {
		var results = [];

		var words = s.toLowerCase().replace(/-/g, " ").split(/\s+/);

		// TODO check with Unit test
		var reg = /[,\.'"-]+/g;
		for ( var i = 0; i < words.length; i++) {
			var w = words[i].replace(reg, "");

			if (w.length > 0 && (!this._stopWords[w])) {
				var stem = window.stemmer(w);
				results[results.length] = stem;
			}
		}

		return results;
	}
});