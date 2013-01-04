"use strict";

window.gtd.Analysis.TermExtraction = Backbone.Model.extend({
	STOP_WORDS:
    [
     /*
      "a", "an", "and", "are", "as", "at", "be", "but",
      "by", "for", "if", "in", "into", "is", "it", "no",
      "no", "not", "of", "on", "or", "s", "such", "t",
      "that", "the", "their", "they", "then", "there", 
      "these", "this", "to", "was", "will", "with"
     */
     "a", "about", "above", "above", "across", "after", "afterwards", "again",
     "against", "all", "almost", "alone", "along", "already", "also","although",
     "always","am","among", "amongst", "amoungst", "amount",  "an", "and",
     "another", "any","anyhow","anyone","anything","anyway", "anywhere", "are", "around", "as",  "at",
     "back","be","became", "because","become","becomes", 
     "becoming", "been", "before", "beforehand", "behind", "being", "below", "beside",
     "besides", "between", "beyond", "bill", "both", "bottom","but", "by",
     "call", "can", "cannot", "cant", "co", "con", "could", "couldnt", "cry",
     "de", "describe", "detail", "do", "done", "down", "due", "during",
     "each", "eg", "eight", "either", "eleven","else", "elsewhere", "empty", 
     "enough", "etc", "even", "ever", "every", "everyone", "everything", "everywhere", "except",
     "few", "fifteen", "fify", "fill", "find", "fire", "first", "five", "for", "former",
     "formerly", "forty", "found", "four", "from", "front", "full", "further",
     "get", "give", "go",
     "had", "has", "hasnt", "have", "he", "hence", "her", "here", "hereafter",
     "hereby", "herein", "hereupon", "hers", "herself", "him", "himself", "his", "how", "however", "hundred",
     "ie", "if", "in", "inc", "indeed", "interest", "into", "is", "it", "its", "itself",
     "keep",
     "last", "latter", "latterly", "least", "less", "ltd",
     "made", "many", "may", "me", "meanwhile", "might", "mill", "mine", "more",
     "moreover", "most", "mostly", "move", "much", "must", "my", "myself",
     "name", "namely", "neither", "never", "nevertheless", "next", "nine", "no",
     "nobody", "none", "noone", "nor", "not", "nothing", "now", "nowhere",
     "of", "off", "often", "on", "once", "one", "only", "onto", "or", "other",
     "others", "otherwise", "our", "ours", "ourselves", "out", "over", "own",
     "part", "per", "perhaps", "please", "put",
     "rather", "re", 
     "same", "see", "seem", "seemed", "seeming", "seems", "serious", "several",
     "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so",
     "some", "somehow", "someone", "something", "sometime", "sometimes",
     "somewhere", "still", "such", "system",
     "take", "ten", "than", "that", "the", "their", "them", "themselves", "then",
     "thence", "there", "thereafter", "thereby", "therefore", "therein", "thereupon",
     "these", "they", "thick", "thin", "third", "this", "those", "though", "three",
     "through", "throughout", "thru", "thus", "to", "together", "too", "top", "toward",
     "towards", "twelve", "twenty", "two",
     "un", "under", "until", "up", "upon", "us", 
     "very", "via",
     "was", "we", "well", "were", "what", "whatever", "when", "whence", "whenever",
     "where", "whereafter", "whereas", "whereby", "wherein", "whereupon",
     "wherever", "whether", "which", "while", "whither", "who", "whoever",
     "whole", "whom", "whose", "why", "will", "with", "within", "without", "would",
     "yet", "you", "your", "yours", "yourself", "yourselves",
     "the"
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
		var reg = /[^\w\s']+/g;
		var cache = {};
		var count = {};
		for ( var i = 0; i < words.length; i++) {
			var w = words[i].replace(reg, "");

			if (!cache[w] && !this._filter(w, count)) {
				cache[w] = 1;
				var stem = window.stemmer(w);
				results.push(stem);
			}
		}

		return results;
	},
	
	_filter: function(w, count) {
		if (w.length === 0) {
			return true;
		}
		if (this._stopWords[w]) {
			return true;
		}
		if (w.length < 3) {
			if (!count[w]) {
				count[w] = 1;
				return true;
			} else if (count[w] < 3) {
				count[w]++;
				return true;
			} else {
				return false;
			}
		}
		return false;
	}
});