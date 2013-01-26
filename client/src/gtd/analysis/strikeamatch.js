"use strict";

window.gtd.Analysis.StrikeAMatch = Backbone.Model.extend({
	
	compare: function(tags1, tags2) {
		var intersection = 0;
		var tags2cp = tags2.slice(0);
		var union = tags1.length + tags2cp.length;
		
		for (var i=0; i<tags1.length; i++) {
			var pair1=tags1[i];
			for(var j=0; j<tags2cp.length; j++) {
				var pair2=tags2cp[j];
				if (pair1 == pair2) {
					intersection++;
					tags2cp.splice(j,1);
					break;
				}
			}
		}
		
		return (2.0*intersection)/union;
	}

});