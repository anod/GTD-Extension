"use strict";
/**
 * Simple logger wrapper above console
 * @author alex
 */
window.simplelogger = {
	info: function(message) {
		console.info(message);
	},
	
	debug: function(message) {
		console.debug(message);
	},
	
	exception: function(err) {
		var stack = this._chrome(err);
		console.error(err.name + ":" + err.message + "\n" + stack.join("\n"));
	},
	

	/**
	 * Given an Error object, return a formatted Array based on Chrome's stack string.
	 *
	 * @param e - Error object to inspect
	 * @return Array<String> of function calls, files and line numbers
	 */
	_chrome : function(e) {
		var stack = (e.stack + '\n').replace(/^\S[^\(]+?[\n$]/gm, '').replace(
				/^\s+(at eval )?at\s+/gm, '').replace(/^([^\(]+?)([\n$])/gm,
				'{anonymous}()@$1$2').replace(
				/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}()@$1')
				.split('\n');
		stack.pop();
		return stack;
	}
};