"use strict";
/**
 * Various funcations to work with dates
 * @author alex
 */
window.gtd.Utils.DateUtils = Backbone.Model.extend({
	
	defaults: {
		now: null
	},
	
	getNextWeek: function() {
		var curr = this._getCurrentDate(); // get current date
		var today = curr.getDate();
		var nextWeek =  today + 7; // First day is the day of the month - the day of the week
		curr.setDate(nextWeek);
		return this.dateObjToStr(curr);
	},
	
	getNextMonth: function() {
		var curr = this._getCurrentDate(); // get current date
		var month = curr.getMonth();
		curr.setMonth(month + 1);
		return this.dateObjToStr(curr);
	},
	
	getThisWeekend: function() {
		var curr = this._getCurrentDate(); // get current date
		var today = curr.getDate();
		var weekendStart =  today - curr.getDay() + 5; // First day is the day of the month - the day of the week
		if (weekendStart <= today) {
			return this.getNextWeekend();
		}
		curr.setDate(weekendStart);
		return this.dateObjToStr(curr);
	},
	
	getNextWeekend: function() {
		var curr = this._getCurrentDate(); // get current date
		var weekendStart = curr.getDate() - curr.getDay() + 12; // First day is the day of the month - the day of the week
		curr.setDate(weekendStart);
		return this.dateObjToStr(curr);
	},
	
	getToday: function() {
		var curr = this._getCurrentDate(); // get current date
		return this.dateObjToStr(curr);
	},
	
	getTomorrow: function() {
		var curr = this._getCurrentDate(); // get current date
		curr.setDate(curr.getDate()+1);
		return this.dateObjToStr(curr);
	},
	
	parseDate: function(dateStr) {
		var curr = null;
		var parts = null;
		
		// Moment.JS doesnt parse as expected multiple formats
		// So do it manually
		if (dateStr.indexOf("-") > 0) {
			parts = dateStr.split("-");
			if (parts.length != 3) {
				return null;
			}
		} else if (dateStr.indexOf("/") > 0) {
			parts = dateStr.split("/");
			if (parts.length < 2 || parts.length > 3) {
				return null;
			}
			if (parts.length == 2) {
				curr = this._getCurrentDate();
				parts.push("" + curr.getFullYear());
			}
		}
		
		var day = (parts[0].length == 1) ? "0" + parts[0]: parts[0];
		var month = (parts[1].length == 1) ? "0" + parts[1]: parts[1];
		var year = (parts[2].length != 4) ? "20"+ parts[2] : parts[2];
		
		var m = window.moment(year+"-"+month+"-"+day);
		if (!m.isValid()) {
			return null;
		}
		curr = (curr) ? curr : this._getCurrentDate();
		var now = window.moment(curr); // get current date
		if (m.diff(now) > 0) {
			return m.format("YYYY-MM-DD");
		}
		return null;
	},
	
	dateObjToStr: function(date) {
		var m = window.moment(date);
		return m.format("YYYY-MM-DD");
	},
	
	_getCurrentDate: function() {
		return (this.get('now')) ? new Date(this.get('now')) : new Date();
	}
});