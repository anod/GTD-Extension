"use strict";
/**
 * Predefined regular expressions
 * @author alex
 */
window.gtd.Pattern.Regex = {
	/**
	 * dd/MM/YY
	 * dd/MM/YYYY
	 * dd-MM-YY
	 * dd-MM-YYYY
	 * dd/MM
	 * this weekend
	 * next weekend
	 * weekend
	 * today
	 * tomorrow
	 * next week
	 * next month
	 */
	DATE: '(\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\d{1,2}-\\d{1,2}-\\d{2,4}|\\d{1,2}\\/\\d{1,2}|\\bthis\\s+weekend|\\bnext\\s+weekend|\\bweekend|\\btoday|\\btomorrow|\\bnext\\s+week|\\bnext\\s+month)',
	PROJECT_NAME: '(\\bproject\\s+[^\\s]+)',
	ACTION: '(\\bnext\\s+action|\\bproject|\\bwaiting\\s*for|\\bcalendar|\\bsomeday)',
	CONTEXT: '(\\bcontext\\s+[^\\s]+|youtube\\.com)'
};