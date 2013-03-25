"use strict";
/*global assertNull: true, assertEquals: true, assertTrue: true, assertFalse: true */
new TestCase("Utils.DateUtils", {

	testGetNextWeek: function() {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Mon Mar 25 2013'});
		var actual = dateutils.getNextWeek();
		assertEquals('2013-04-01', actual);

		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Mon Dec 30 2013'});
		actual = dateutils.getNextWeek();
		assertEquals('2014-01-06', actual);
	},
	
	testGetNextMonth: function() {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Mon Mar 25 2013'});
		var actual = dateutils.getNextMonth();
		assertEquals('2013-04-25', actual);

		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Mon Dec 30 2013'});
		actual = dateutils.getNextMonth();
		assertEquals('2014-01-30', actual);
	},
	
	testGetThisWeekend: function() {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Tue Feb 26 2013'});
		var actual = dateutils.getThisWeekend();
		assertEquals('2013-03-01', actual);
		
		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Thu Mar 7 2013'});
		actual = dateutils.getThisWeekend();
		assertEquals('2013-03-08', actual);

		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Sat Mar 9 2013'});
		actual = dateutils.getThisWeekend();
		assertEquals('2013-03-15', actual);
		
		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Sun Mar 10 2013'});
		actual = dateutils.getThisWeekend();
		assertEquals('2013-03-15', actual);
	},

	
	testGetNextWeekend: function() {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Tue Feb 26 2013'});
		var actual = dateutils.getNextWeekend();
		assertEquals('2013-03-08', actual);
		
		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Thu Mar 7 2013'});
		actual = dateutils.getNextWeekend();
		assertEquals('2013-03-15', actual);

		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Sat Mar 9 2013'});
		actual = dateutils.getNextWeekend();
		assertEquals('2013-03-15', actual);
		
		dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Sun Mar 10 2013'});
		actual = dateutils.getNextWeekend();
		assertEquals('2013-03-22', actual);
	},
	
	testGetToday: function() {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Thu Mar 7 2013'});
		var actual = dateutils.getToday();
		assertEquals('2013-03-07', actual);
	},
	
	testGetTomorrow: function() {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Thu Mar 7 2013'});
		var actual = dateutils.getTomorrow();
		assertEquals('2013-03-08', actual);
	},
	
	_testParseDate: function(dateStr, expected) {
		var dateutils = new window.gtd.Utils.DateUtils({ 'now' : 'Thu Mar 7 2013'});
		var actual = dateutils.parseDate(dateStr);
		assertEquals(expected,actual);
	},
	
	testParseDate: function() {
		this._testParseDate('20/07/1985', null);
		this._testParseDate('7/10/2013', '2013-10-07');
		this._testParseDate('08/03/2013', '2013-03-08');
		this._testParseDate('15/04/2014', '2014-04-15');
		this._testParseDate('13/06', '2013-06-13');
		this._testParseDate('31/02', null);
		this._testParseDate('08/03/13', '2013-03-08');
		this._testParseDate('08/35/13', null);
	}
	
});