var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      if(doc.readyState == "complete") {
        var isDeps = /\bdeps.js$/.test(src);
        if(isDeps) {
          return false
        }else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.ASSUME_ANY_VERSION = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && !!document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.userAgent.product");
goog.require("goog.userAgent");
goog.userAgent.product.ASSUME_FIREFOX = false;
goog.userAgent.product.ASSUME_CAMINO = false;
goog.userAgent.product.ASSUME_IPHONE = false;
goog.userAgent.product.ASSUME_IPAD = false;
goog.userAgent.product.ASSUME_ANDROID = false;
goog.userAgent.product.ASSUME_CHROME = false;
goog.userAgent.product.ASSUME_SAFARI = false;
goog.userAgent.product.PRODUCT_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_OPERA || goog.userAgent.product.ASSUME_FIREFOX || goog.userAgent.product.ASSUME_CAMINO || goog.userAgent.product.ASSUME_IPHONE || goog.userAgent.product.ASSUME_IPAD || goog.userAgent.product.ASSUME_ANDROID || goog.userAgent.product.ASSUME_CHROME || goog.userAgent.product.ASSUME_SAFARI;
goog.userAgent.product.init_ = function() {
  goog.userAgent.product.detectedFirefox_ = false;
  goog.userAgent.product.detectedCamino_ = false;
  goog.userAgent.product.detectedIphone_ = false;
  goog.userAgent.product.detectedIpad_ = false;
  goog.userAgent.product.detectedAndroid_ = false;
  goog.userAgent.product.detectedChrome_ = false;
  goog.userAgent.product.detectedSafari_ = false;
  var ua = goog.userAgent.getUserAgentString();
  if(!ua) {
    return
  }
  if(ua.indexOf("Firefox") != -1) {
    goog.userAgent.product.detectedFirefox_ = true
  }else {
    if(ua.indexOf("Camino") != -1) {
      goog.userAgent.product.detectedCamino_ = true
    }else {
      if(ua.indexOf("iPhone") != -1 || ua.indexOf("iPod") != -1) {
        goog.userAgent.product.detectedIphone_ = true
      }else {
        if(ua.indexOf("iPad") != -1) {
          goog.userAgent.product.detectedIpad_ = true
        }else {
          if(ua.indexOf("Android") != -1) {
            goog.userAgent.product.detectedAndroid_ = true
          }else {
            if(ua.indexOf("Chrome") != -1) {
              goog.userAgent.product.detectedChrome_ = true
            }else {
              if(ua.indexOf("Safari") != -1) {
                goog.userAgent.product.detectedSafari_ = true
              }
            }
          }
        }
      }
    }
  }
};
if(!goog.userAgent.product.PRODUCT_KNOWN_) {
  goog.userAgent.product.init_()
}
goog.userAgent.product.OPERA = goog.userAgent.OPERA;
goog.userAgent.product.IE = goog.userAgent.IE;
goog.userAgent.product.FIREFOX = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_FIREFOX : goog.userAgent.product.detectedFirefox_;
goog.userAgent.product.CAMINO = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_CAMINO : goog.userAgent.product.detectedCamino_;
goog.userAgent.product.IPHONE = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPHONE : goog.userAgent.product.detectedIphone_;
goog.userAgent.product.IPAD = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPAD : goog.userAgent.product.detectedIpad_;
goog.userAgent.product.ANDROID = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_ANDROID : goog.userAgent.product.detectedAndroid_;
goog.userAgent.product.CHROME = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_CHROME : goog.userAgent.product.detectedChrome_;
goog.userAgent.product.SAFARI = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_SAFARI : goog.userAgent.product.detectedSafari_;
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return value
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element
  });
  return ret
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
/*
 Portions of this code are from MochiKit, received by
 The Closure Authors under the MIT license. All other code is Copyright
 2005-2009 The Closure Authors. All Rights Reserved.
*/
goog.provide("goog.async.Deferred");
goog.provide("goog.async.Deferred.AlreadyCalledError");
goog.provide("goog.async.Deferred.CancelledError");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug.Error");
goog.async.Deferred = function(opt_canceller, opt_defaultScope) {
  this.chain_ = [];
  this.canceller_ = opt_canceller;
  this.defaultScope_ = opt_defaultScope || null
};
goog.async.Deferred.prototype.fired_ = false;
goog.async.Deferred.prototype.hadError_ = false;
goog.async.Deferred.prototype.result_;
goog.async.Deferred.prototype.paused_ = 0;
goog.async.Deferred.prototype.silentlyCancelled_ = false;
goog.async.Deferred.prototype.chained_ = false;
goog.async.Deferred.prototype.unhandledExceptionTimeoutId_;
goog.async.Deferred.prototype.parent_;
goog.async.Deferred.prototype.branches_ = 0;
goog.async.Deferred.prototype.cancel = function(opt_deepCancel) {
  if(!this.hasFired()) {
    if(this.parent_) {
      var parent = this.parent_;
      delete this.parent_;
      if(opt_deepCancel) {
        parent.cancel(opt_deepCancel)
      }else {
        parent.branchCancel_()
      }
    }
    if(this.canceller_) {
      this.canceller_.call(this.defaultScope_, this)
    }else {
      this.silentlyCancelled_ = true
    }
    if(!this.hasFired()) {
      this.errback(new goog.async.Deferred.CancelledError(this))
    }
  }else {
    if(this.result_ instanceof goog.async.Deferred) {
      this.result_.cancel()
    }
  }
};
goog.async.Deferred.prototype.branchCancel_ = function() {
  this.branches_--;
  if(this.branches_ <= 0) {
    this.cancel()
  }
};
goog.async.Deferred.prototype.pause_ = function() {
  this.paused_++
};
goog.async.Deferred.prototype.unpause_ = function() {
  this.paused_--;
  if(this.paused_ == 0 && this.hasFired()) {
    this.fire_()
  }
};
goog.async.Deferred.prototype.continue_ = function(isSuccess, res) {
  this.resback_(isSuccess, res);
  this.unpause_()
};
goog.async.Deferred.prototype.resback_ = function(isSuccess, res) {
  this.fired_ = true;
  this.result_ = res;
  this.hadError_ = !isSuccess;
  this.fire_()
};
goog.async.Deferred.prototype.check_ = function() {
  if(this.hasFired()) {
    if(!this.silentlyCancelled_) {
      throw new goog.async.Deferred.AlreadyCalledError(this);
    }
    this.silentlyCancelled_ = false
  }
};
goog.async.Deferred.prototype.callback = function(opt_result) {
  this.check_();
  this.assertNotDeferred_(opt_result);
  this.resback_(true, opt_result)
};
goog.async.Deferred.prototype.errback = function(opt_result) {
  this.check_();
  this.assertNotDeferred_(opt_result);
  this.resback_(false, opt_result)
};
goog.async.Deferred.prototype.assertNotDeferred_ = function(obj) {
  goog.asserts.assert(!(obj instanceof goog.async.Deferred), "Deferred instances can only be chained if they are the result of a " + "callback")
};
goog.async.Deferred.prototype.addCallback = function(cb, opt_scope) {
  return this.addCallbacks(cb, null, opt_scope)
};
goog.async.Deferred.prototype.addErrback = function(eb, opt_scope) {
  return this.addCallbacks(null, eb, opt_scope)
};
goog.async.Deferred.prototype.addCallbacks = function(cb, eb, opt_scope) {
  goog.asserts.assert(!this.chained_, "Chained Deferreds can not be re-used");
  this.chain_.push([cb, eb, opt_scope]);
  if(this.hasFired()) {
    this.fire_()
  }
  return this
};
goog.async.Deferred.prototype.chainDeferred = function(otherDeferred) {
  this.addCallbacks(otherDeferred.callback, otherDeferred.errback, otherDeferred);
  return this
};
goog.async.Deferred.prototype.awaitDeferred = function(otherDeferred) {
  return this.addCallback(goog.bind(otherDeferred.branch, otherDeferred))
};
goog.async.Deferred.prototype.branch = function(opt_propagateCancel) {
  var d = new goog.async.Deferred;
  this.chainDeferred(d);
  if(opt_propagateCancel) {
    d.parent_ = this;
    this.branches_++
  }
  return d
};
goog.async.Deferred.prototype.addBoth = function(f, opt_scope) {
  return this.addCallbacks(f, f, opt_scope)
};
goog.async.Deferred.prototype.hasFired = function() {
  return this.fired_
};
goog.async.Deferred.prototype.isError = function(res) {
  return res instanceof Error
};
goog.async.Deferred.prototype.hasErrback_ = function() {
  return goog.array.some(this.chain_, function(chainRow) {
    return goog.isFunction(chainRow[1])
  })
};
goog.async.Deferred.prototype.fire_ = function() {
  if(this.unhandledExceptionTimeoutId_ && this.hasFired() && this.hasErrback_()) {
    goog.global.clearTimeout(this.unhandledExceptionTimeoutId_);
    delete this.unhandledExceptionTimeoutId_
  }
  if(this.parent_) {
    this.parent_.branches_--;
    delete this.parent_
  }
  var res = this.result_;
  var unhandledException = false;
  var isChained = false;
  while(this.chain_.length && this.paused_ == 0) {
    var chainEntry = this.chain_.shift();
    var callback = chainEntry[0];
    var errback = chainEntry[1];
    var scope = chainEntry[2];
    var f = this.hadError_ ? errback : callback;
    if(f) {
      try {
        var ret = f.call(scope || this.defaultScope_, res);
        if(goog.isDef(ret)) {
          this.hadError_ = this.hadError_ && (ret == res || this.isError(ret));
          this.result_ = res = ret
        }
        if(res instanceof goog.async.Deferred) {
          isChained = true;
          this.pause_()
        }
      }catch(ex) {
        res = ex;
        this.hadError_ = true;
        if(!this.hasErrback_()) {
          unhandledException = true
        }
      }
    }
  }
  this.result_ = res;
  if(isChained && this.paused_) {
    res.addCallbacks(goog.bind(this.continue_, this, true), goog.bind(this.continue_, this, false));
    res.chained_ = true
  }
  if(unhandledException) {
    this.unhandledExceptionTimeoutId_ = goog.global.setTimeout(function() {
      throw res;
    }, 0)
  }
};
goog.async.Deferred.succeed = function(res) {
  var d = new goog.async.Deferred;
  d.callback(res);
  return d
};
goog.async.Deferred.fail = function(res) {
  var d = new goog.async.Deferred;
  d.errback(res);
  return d
};
goog.async.Deferred.cancelled = function() {
  var d = new goog.async.Deferred;
  d.cancel();
  return d
};
goog.async.Deferred.when = function(value, callback, opt_scope) {
  if(value instanceof goog.async.Deferred) {
    return value.branch(true).addCallback(callback, opt_scope)
  }else {
    return goog.async.Deferred.succeed(value).addCallback(callback, opt_scope)
  }
};
goog.async.Deferred.AlreadyCalledError = function(deferred) {
  goog.debug.Error.call(this);
  this.deferred = deferred
};
goog.inherits(goog.async.Deferred.AlreadyCalledError, goog.debug.Error);
goog.async.Deferred.AlreadyCalledError.prototype.message = "Deferred has already fired";
goog.async.Deferred.AlreadyCalledError.prototype.name = "AlreadyCalledError";
goog.async.Deferred.CancelledError = function(deferred) {
  goog.debug.Error.call(this);
  this.deferred = deferred
};
goog.inherits(goog.async.Deferred.CancelledError, goog.debug.Error);
goog.async.Deferred.CancelledError.prototype.message = "Deferred was cancelled";
goog.async.Deferred.CancelledError.prototype.name = "CancelledError";
goog.provide("goog.async.DeferredList");
goog.require("goog.array");
goog.require("goog.async.Deferred");
goog.async.DeferredList = function(list, opt_fireOnOneCallback, opt_fireOnOneErrback, opt_consumeErrors, opt_canceller, opt_defaultScope) {
  goog.async.Deferred.call(this, opt_canceller, opt_defaultScope);
  this.list_ = list;
  this.deferredResults_ = [];
  this.fireOnOneCallback_ = !!opt_fireOnOneCallback;
  this.fireOnOneErrback_ = !!opt_fireOnOneErrback;
  this.consumeErrors_ = !!opt_consumeErrors;
  for(var i = 0;i < list.length;i++) {
    var d = list[i];
    d.addCallbacks(goog.bind(this.handleCallback_, this, i, true), goog.bind(this.handleCallback_, this, i, false))
  }
  if(list.length == 0 && !this.fireOnOneCallback_) {
    this.callback(this.deferredResults_)
  }
};
goog.inherits(goog.async.DeferredList, goog.async.Deferred);
goog.async.DeferredList.prototype.numFinished_ = 0;
goog.async.DeferredList.prototype.handleCallback_ = function(index, success, result) {
  this.numFinished_++;
  this.deferredResults_[index] = [success, result];
  if(!this.hasFired()) {
    if(this.fireOnOneCallback_ && success) {
      this.callback([index, result])
    }else {
      if(this.fireOnOneErrback_ && !success) {
        this.errback(result)
      }else {
        if(this.numFinished_ == this.list_.length) {
          this.callback(this.deferredResults_)
        }
      }
    }
  }
  if(this.consumeErrors_ && !success) {
    result = null
  }
  return result
};
goog.async.DeferredList.prototype.errback = function(res) {
  goog.async.DeferredList.superClass_.errback.call(this, res);
  goog.array.forEach(this.list_, function(item) {
    item.cancel()
  })
};
goog.async.DeferredList.gatherResults = function(list) {
  var d = new goog.async.DeferredList(list, false, true);
  d.addCallback(function(results) {
    return goog.array.map(results, function(res) {
      return res[1]
    })
  });
  return d
};
goog.provide("ydn.async");
goog.require("goog.async.Deferred");
goog.require("goog.async.DeferredList");
ydn.async.reduceAllTrue = function(dfl) {
  var df = new goog.async.Deferred;
  dfl.addCallback(function(list) {
    var all_ok = list.every(function(x) {
      return!!x
    });
    if(all_ok) {
      df.callback(true)
    }else {
      df.errback(undefined)
    }
  });
  dfl.addErrback(function(x) {
    df.errback(x)
  });
  return df
};
ydn.async.all = function(df_arr) {
  var df_list = [];
  for(var idf, i = 0;idf = df_arr[i];i++) {
    var df = new goog.async.Deferred;
    idf["success"](goog.partial(function(df, x) {
      df.callback(x)
    }, df));
    idf["error"](goog.partial(function(df, x) {
      df.errback(x)
    }, df));
    df_list[i] = df
  }
  return new goog.async.DeferredList(df_list)
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if(Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result)
  }
  return result
};
goog.object.isImmutableView = function(obj) {
  return!!Object.isFrozen && Object.isFrozen(obj)
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Collection");
goog.structs.Collection = function() {
};
goog.structs.Collection.prototype.add;
goog.structs.Collection.prototype.remove;
goog.structs.Collection.prototype.contains;
goog.structs.Collection.prototype.getCount;
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(f.call(opt_obj, val, undefined, iterator)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      return f.call(opt_obj, val, undefined, iterator)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(dropping && f.call(opt_obj, val, undefined, iterator)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterator.next();
        if(f.call(opt_obj, val, undefined, iterator)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable);
  var cache = [];
  var cacheIndex = 0;
  var iter = new goog.iter.Iterator;
  var useCache = false;
  iter.next = function() {
    var returnElement = null;
    if(!useCache) {
      try {
        returnElement = baseIterator.next();
        cache.push(returnElement);
        return returnElement
      }catch(e) {
        if(e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = true
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Collection");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.difference = function(col) {
  var result = this.clone();
  result.removeAll(col);
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.require("goog.userAgent");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  var retVal = !!opt_cancel;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("535.3")) {
    retVal = !retVal
  }
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return retVal
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver
};
goog.debug.getFunctionName = function(fn) {
  if(goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn]
  }
  if(goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if(name) {
      goog.debug.fnNameCache_[fn] = name;
      return name
    }
  }
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.debug.fnNameResolver_;
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.logToProfilers = function(msg) {
  if(goog.global["console"]) {
    if(goog.global["console"]["timeStamp"]) {
      goog.global["console"]["timeStamp"](msg)
    }else {
      if(goog.global["console"]["markTimeline"]) {
        goog.global["console"]["markTimeline"](msg)
      }
    }
  }
  if(goog.global["msWriteProfilerMark"]) {
    goog.global["msWriteProfilerMark"](msg)
  }
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("ydn.json");
goog.require("goog.debug.Logger");
ydn.json.DEBUG = false;
ydn.json.logger = goog.debug.Logger.getLogger("ydn");
ydn.json.parse = function(json_str) {
  if(!goog.isString(json_str) || goog.string.isEmpty(json_str)) {
    return{}
  }
  try {
    return JSON.parse(json_str)
  }catch(e) {
    if(ydn.json.DEBUG) {
      window.console.log(json_str)
    }
    throw e;
  }
};
ydn.json.stringify = function(json) {
  return JSON.stringify(json)
};
goog.provide("ydn.object");
goog.require("ydn.json");
ydn.object.clone = function(obj) {
  return ydn.json.parse(ydn.json.stringify(obj))
};
ydn.object.equals = function(obj1, obj2, opt_ignore_fields) {
  opt_ignore_fields = opt_ignore_fields || {};
  if(!goog.isDefAndNotNull(obj1) || !goog.isDefAndNotNull(obj2)) {
    return false
  }else {
    if(goog.isArray(obj1) && goog.isArray(obj2)) {
      if(obj1.length != obj2.length) {
        return false
      }
      for(var i = 0;i < obj1.length;i++) {
        var idx = goog.array.find(obj2, function(ele) {
          return ydn.object.equals(ele, obj1[i])
        });
        if(idx == -1) {
          return false
        }
      }
      return true
    }else {
      if(goog.isArray(obj1)) {
        return obj1.length == 1 && ydn.object.equals(obj1[0], obj2)
      }else {
        if(goog.isArray(obj2)) {
          return obj2.length == 1 && ydn.object.equals(obj2[0], obj1)
        }else {
          if(goog.isObject(obj1) && goog.isObject(obj1)) {
            for(var key in obj1) {
              if(obj1.hasOwnProperty(key) && !opt_ignore_fields[key]) {
                var same = ydn.object.equals(obj1[key], obj2[key]);
                if(!same) {
                  return false
                }
              }
            }
            for(var key in obj2) {
              if(obj2.hasOwnProperty(key) && !opt_ignore_fields[key]) {
                var same = ydn.object.equals(obj1[key], obj2[key]);
                if(!same) {
                  return false
                }
              }
            }
            return true
          }else {
            return obj1 === obj2
          }
        }
      }
    }
  }
};
ydn.object.length = function(obj) {
  if(obj && obj["length"] && goog.isNumber(obj["length"])) {
    return obj.length
  }
  var count = 0;
  for(var id in obj) {
    if(obj.hasOwnProperty(id)) {
      count++
    }
  }
  return count
};
ydn.object.extend = function(target, var_args) {
  var out = ydn.object.clone(target);
  for(var key in var_args) {
    if(var_args.hasOwnProperty(key)) {
      out[key] = var_args[key]
    }
  }
  return out
};
ydn.object.reparr = function(v, n) {
  var arr = [];
  for(var i = 0;i < n;i++) {
    arr[i] = v
  }
  return arr
};
ydn.object.takeFirst = function(row) {
  for(var key in row) {
    if(row.hasOwnProperty(key)) {
      return row[key]
    }
  }
  return undefined
};
goog.provide("goog.crypt");
goog.require("goog.array");
goog.crypt.stringToByteArray = function(str) {
  var output = [], p = 0;
  for(var i = 0;i < str.length;i++) {
    var c = str.charCodeAt(i);
    while(c > 255) {
      output[p++] = c & 255;
      c >>= 8
    }
    output[p++] = c
  }
  return output
};
goog.crypt.byteArrayToString = function(array) {
  return String.fromCharCode.apply(null, array)
};
goog.crypt.byteArrayToHex = function(array) {
  return goog.array.map(array, function(numByte) {
    var hexByte = numByte.toString(16);
    return hexByte.length > 1 ? hexByte : "0" + hexByte
  }).join("")
};
goog.crypt.hexToByteArray = function(hexString) {
  goog.asserts.assert(hexString.length % 2 == 0, "Key string length must be multiple of 2");
  var arr = [];
  for(var i = 0;i < hexString.length;i += 2) {
    arr.push(parseInt(hexString.substring(i, i + 2), 16))
  }
  return arr
};
goog.crypt.stringToUtf8ByteArray = function(str) {
  str = str.replace(/\r\n/g, "\n");
  var out = [], p = 0;
  for(var i = 0;i < str.length;i++) {
    var c = str.charCodeAt(i);
    if(c < 128) {
      out[p++] = c
    }else {
      if(c < 2048) {
        out[p++] = c >> 6 | 192;
        out[p++] = c & 63 | 128
      }else {
        out[p++] = c >> 12 | 224;
        out[p++] = c >> 6 & 63 | 128;
        out[p++] = c & 63 | 128
      }
    }
  }
  return out
};
goog.crypt.utf8ByteArrayToString = function(bytes) {
  var out = [], pos = 0, c = 0;
  while(pos < bytes.length) {
    var c1 = bytes[pos++];
    if(c1 < 128) {
      out[c++] = String.fromCharCode(c1)
    }else {
      if(c1 > 191 && c1 < 224) {
        var c2 = bytes[pos++];
        out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63)
      }else {
        var c2 = bytes[pos++];
        var c3 = bytes[pos++];
        out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63)
      }
    }
  }
  return out.join("")
};
goog.provide("goog.crypt.Arc4");
goog.require("goog.asserts");
goog.crypt.Arc4 = function() {
  this.state_ = [];
  this.index1_ = 0;
  this.index2_ = 0
};
goog.crypt.Arc4.prototype.setKey = function(key, opt_length) {
  goog.asserts.assertArray(key, "Key parameter must be a byte array");
  if(!opt_length) {
    opt_length = key.length
  }
  var state = this.state_;
  for(var i = 0;i < 256;++i) {
    state[i] = i
  }
  var j = 0;
  for(var i = 0;i < 256;++i) {
    j = j + state[i] + key[i % opt_length] & 255;
    var tmp = state[i];
    state[i] = state[j];
    state[j] = tmp
  }
  this.index1_ = 0;
  this.index2_ = 0
};
goog.crypt.Arc4.prototype.discard = function(length) {
  var i = this.index1_;
  var j = this.index2_;
  var state = this.state_;
  for(var n = 0;n < length;++n) {
    i = i + 1 & 255;
    j = j + state[i] & 255;
    var tmp = state[i];
    state[i] = state[j];
    state[j] = tmp
  }
  this.index1_ = i;
  this.index2_ = j
};
goog.crypt.Arc4.prototype.crypt = function(data, opt_length) {
  if(!opt_length) {
    opt_length = data.length
  }
  var i = this.index1_;
  var j = this.index2_;
  var state = this.state_;
  for(var n = 0;n < opt_length;++n) {
    i = i + 1 & 255;
    j = j + state[i] & 255;
    var tmp = state[i];
    state[i] = state[j];
    state[j] = tmp;
    data[n] ^= state[state[i] + state[j] & 255]
  }
  this.index1_ = i;
  this.index2_ = j
};
goog.provide("goog.crypt.Hash");
goog.crypt.Hash = function() {
};
goog.crypt.Hash.prototype.reset = goog.abstractMethod;
goog.crypt.Hash.prototype.update = goog.abstractMethod;
goog.crypt.Hash.prototype.digest = goog.abstractMethod;
goog.provide("goog.crypt.Sha1");
goog.require("goog.crypt.Hash");
goog.crypt.Sha1 = function() {
  goog.base(this);
  this.chain_ = [];
  this.buf_ = [];
  this.W_ = [];
  this.pad_ = [];
  this.pad_[0] = 128;
  for(var i = 1;i < 64;++i) {
    this.pad_[i] = 0
  }
  this.reset()
};
goog.inherits(goog.crypt.Sha1, goog.crypt.Hash);
goog.crypt.Sha1.prototype.reset = function() {
  this.chain_[0] = 1732584193;
  this.chain_[1] = 4023233417;
  this.chain_[2] = 2562383102;
  this.chain_[3] = 271733878;
  this.chain_[4] = 3285377520;
  this.inbuf_ = 0;
  this.total_ = 0
};
goog.crypt.Sha1.prototype.compress_ = function(buf, opt_offset) {
  if(!opt_offset) {
    opt_offset = 0
  }
  var W = this.W_;
  for(var i = opt_offset;i < opt_offset + 64;i += 4) {
    var w = buf[i] << 24 | buf[i + 1] << 16 | buf[i + 2] << 8 | buf[i + 3];
    W[i / 4] = w
  }
  for(var i = 16;i < 80;i++) {
    var t = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
    W[i] = (t << 1 | t >>> 31) & 4294967295
  }
  var a = this.chain_[0];
  var b = this.chain_[1];
  var c = this.chain_[2];
  var d = this.chain_[3];
  var e = this.chain_[4];
  var f, k;
  for(var i = 0;i < 80;i++) {
    if(i < 40) {
      if(i < 20) {
        f = d ^ b & (c ^ d);
        k = 1518500249
      }else {
        f = b ^ c ^ d;
        k = 1859775393
      }
    }else {
      if(i < 60) {
        f = b & c | d & (b | c);
        k = 2400959708
      }else {
        f = b ^ c ^ d;
        k = 3395469782
      }
    }
    var t = (a << 5 | a >>> 27) + f + e + k + W[i] & 4294967295;
    e = d;
    d = c;
    c = (b << 30 | b >>> 2) & 4294967295;
    b = a;
    a = t
  }
  this.chain_[0] = this.chain_[0] + a & 4294967295;
  this.chain_[1] = this.chain_[1] + b & 4294967295;
  this.chain_[2] = this.chain_[2] + c & 4294967295;
  this.chain_[3] = this.chain_[3] + d & 4294967295;
  this.chain_[4] = this.chain_[4] + e & 4294967295
};
goog.crypt.Sha1.prototype.update = function(bytes, opt_length) {
  if(!goog.isDef(opt_length)) {
    opt_length = bytes.length
  }
  var buf = this.buf_;
  var inbuf = this.inbuf_;
  var n = 0;
  if(goog.isString(bytes)) {
    while(n < opt_length) {
      buf[inbuf++] = bytes.charCodeAt(n++);
      if(inbuf == 64) {
        this.compress_(buf);
        inbuf = 0
      }
    }
  }else {
    while(n < opt_length) {
      buf[inbuf++] = bytes[n++];
      if(inbuf == 64) {
        this.compress_(buf);
        inbuf = 0
      }
    }
  }
  this.inbuf_ = inbuf;
  this.total_ += opt_length
};
goog.crypt.Sha1.prototype.digest = function() {
  var digest = [];
  var totalBits = this.total_ * 8;
  if(this.inbuf_ < 56) {
    this.update(this.pad_, 56 - this.inbuf_)
  }else {
    this.update(this.pad_, 64 - (this.inbuf_ - 56))
  }
  for(var i = 63;i >= 56;i--) {
    this.buf_[i] = totalBits & 255;
    totalBits /= 256
  }
  this.compress_(this.buf_);
  var n = 0;
  for(var i = 0;i < 5;i++) {
    for(var j = 24;j >= 0;j -= 8) {
      digest[n++] = this.chain_[i] >> j & 255
    }
  }
  return digest
};
goog.provide("goog.crypt.base64");
goog.require("goog.crypt");
goog.require("goog.userAgent");
goog.crypt.base64.byteToCharMap_ = null;
goog.crypt.base64.charToByteMap_ = null;
goog.crypt.base64.byteToCharMapWebSafe_ = null;
goog.crypt.base64.charToByteMapWebSafe_ = null;
goog.crypt.base64.ENCODED_VALS_BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" + "0123456789";
goog.crypt.base64.ENCODED_VALS = goog.crypt.base64.ENCODED_VALS_BASE + "+/=";
goog.crypt.base64.ENCODED_VALS_WEBSAFE = goog.crypt.base64.ENCODED_VALS_BASE + "-_.";
goog.crypt.base64.HAS_NATIVE_SUPPORT = goog.userAgent.GECKO || goog.userAgent.WEBKIT || goog.userAgent.OPERA || typeof goog.global.atob == "function";
goog.crypt.base64.encodeByteArray = function(input, opt_webSafe) {
  if(!goog.isArrayLike(input)) {
    throw Error("encodeByteArray takes an array as a parameter");
  }
  goog.crypt.base64.init_();
  var byteToCharMap = opt_webSafe ? goog.crypt.base64.byteToCharMapWebSafe_ : goog.crypt.base64.byteToCharMap_;
  var output = [];
  for(var i = 0;i < input.length;i += 3) {
    var byte1 = input[i];
    var haveByte2 = i + 1 < input.length;
    var byte2 = haveByte2 ? input[i + 1] : 0;
    var haveByte3 = i + 2 < input.length;
    var byte3 = haveByte3 ? input[i + 2] : 0;
    var outByte1 = byte1 >> 2;
    var outByte2 = (byte1 & 3) << 4 | byte2 >> 4;
    var outByte3 = (byte2 & 15) << 2 | byte3 >> 6;
    var outByte4 = byte3 & 63;
    if(!haveByte3) {
      outByte4 = 64;
      if(!haveByte2) {
        outByte3 = 64
      }
    }
    output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4])
  }
  return output.join("")
};
goog.crypt.base64.encodeString = function(input, opt_webSafe) {
  if(goog.crypt.base64.HAS_NATIVE_SUPPORT && !opt_webSafe) {
    return goog.global.btoa(input)
  }
  return goog.crypt.base64.encodeByteArray(goog.crypt.stringToByteArray(input), opt_webSafe)
};
goog.crypt.base64.decodeString = function(input, opt_webSafe) {
  if(goog.crypt.base64.HAS_NATIVE_SUPPORT && !opt_webSafe) {
    return goog.global.atob(input)
  }
  return goog.crypt.byteArrayToString(goog.crypt.base64.decodeStringToByteArray(input, opt_webSafe))
};
goog.crypt.base64.decodeStringToByteArray = function(input, opt_webSafe) {
  goog.crypt.base64.init_();
  var charToByteMap = opt_webSafe ? goog.crypt.base64.charToByteMapWebSafe_ : goog.crypt.base64.charToByteMap_;
  var output = [];
  for(var i = 0;i < input.length;) {
    var byte1 = charToByteMap[input.charAt(i++)];
    var haveByte2 = i < input.length;
    var byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
    ++i;
    var haveByte3 = i < input.length;
    var byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 0;
    ++i;
    var haveByte4 = i < input.length;
    var byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 0;
    ++i;
    if(byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
      throw Error();
    }
    var outByte1 = byte1 << 2 | byte2 >> 4;
    output.push(outByte1);
    if(byte3 != 64) {
      var outByte2 = byte2 << 4 & 240 | byte3 >> 2;
      output.push(outByte2);
      if(byte4 != 64) {
        var outByte3 = byte3 << 6 & 192 | byte4;
        output.push(outByte3)
      }
    }
  }
  return output
};
goog.crypt.base64.init_ = function() {
  if(!goog.crypt.base64.byteToCharMap_) {
    goog.crypt.base64.byteToCharMap_ = {};
    goog.crypt.base64.charToByteMap_ = {};
    goog.crypt.base64.byteToCharMapWebSafe_ = {};
    goog.crypt.base64.charToByteMapWebSafe_ = {};
    for(var i = 0;i < goog.crypt.base64.ENCODED_VALS.length;i++) {
      goog.crypt.base64.byteToCharMap_[i] = goog.crypt.base64.ENCODED_VALS.charAt(i);
      goog.crypt.base64.charToByteMap_[goog.crypt.base64.byteToCharMap_[i]] = i;
      goog.crypt.base64.byteToCharMapWebSafe_[i] = goog.crypt.base64.ENCODED_VALS_WEBSAFE.charAt(i);
      goog.crypt.base64.charToByteMapWebSafe_[goog.crypt.base64.byteToCharMapWebSafe_[i]] = i
    }
  }
};
goog.provide("goog.json");
goog.provide("goog.json.Serializer");
goog.json.isValid_ = function(s) {
  if(/^\s*$/.test(s)) {
    return false
  }
  var backslashesRe = /\\["\\\/bfnrtu]/g;
  var simpleValuesRe = /"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
  var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;
  return remainderRe.test(s.replace(backslashesRe, "@").replace(simpleValuesRe, "]").replace(openBracketsRe, ""))
};
goog.json.parse = function(s) {
  var o = String(s);
  if(goog.json.isValid_(o)) {
    try {
      return eval("(" + o + ")")
    }catch(ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = function(s) {
  return eval("(" + s + ")")
};
goog.json.Replacer;
goog.json.Reviver;
goog.json.serialize = function(object, opt_replacer) {
  return(new goog.json.Serializer(opt_replacer)).serialize(object)
};
goog.json.Serializer = function(opt_replacer) {
  this.replacer_ = opt_replacer
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serialize_(object, sb);
  return sb.join("")
};
goog.json.Serializer.prototype.serialize_ = function(object, sb) {
  switch(typeof object) {
    case "string":
      this.serializeString_(object, sb);
      break;
    case "number":
      this.serializeNumber_(object, sb);
      break;
    case "boolean":
      sb.push(object);
      break;
    case "undefined":
      sb.push("null");
      break;
    case "object":
      if(object == null) {
        sb.push("null");
        break
      }
      if(goog.isArray(object)) {
        this.serializeArray(object, sb);
        break
      }
      this.serializeObject_(object, sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if(c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c]
    }
    var cc = c.charCodeAt(0);
    var rv = "\\u";
    if(cc < 16) {
      rv += "000"
    }else {
      if(cc < 256) {
        rv += "00"
      }else {
        if(cc < 4096) {
          rv += "0"
        }
      }
    }
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16)
  }), '"')
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null")
};
goog.json.Serializer.prototype.serializeArray = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  var sep = "";
  for(var i = 0;i < l;i++) {
    sb.push(sep);
    var value = arr[i];
    this.serialize_(this.replacer_ ? this.replacer_.call(arr, String(i), value) : value, sb);
    sep = ","
  }
  sb.push("]")
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "";
  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      if(typeof value != "function") {
        sb.push(sep);
        this.serializeString_(key, sb);
        sb.push(":");
        this.serialize_(this.replacer_ ? this.replacer_.call(obj, key, value) : value, sb);
        sep = ","
      }
    }
  }
  sb.push("}")
};
goog.provide("goog.storage.ErrorCode");
goog.storage.ErrorCode = {INVALID_VALUE:"Storage: Invalid value was encountered", DECRYPTION_ERROR:"Storage: The value could not be decrypted"};
goog.provide("goog.storage.mechanism.Mechanism");
goog.storage.mechanism.Mechanism = function() {
};
goog.storage.mechanism.Mechanism.prototype.set = goog.abstractMethod;
goog.storage.mechanism.Mechanism.prototype.get = goog.abstractMethod;
goog.storage.mechanism.Mechanism.prototype.remove = goog.abstractMethod;
goog.provide("goog.storage.Storage");
goog.require("goog.json");
goog.require("goog.json.Serializer");
goog.require("goog.storage.ErrorCode");
goog.require("goog.storage.mechanism.Mechanism");
goog.storage.Storage = function(mechanism) {
  this.mechanism = mechanism;
  this.serializer_ = new goog.json.Serializer
};
goog.storage.Storage.prototype.mechanism = null;
goog.storage.Storage.prototype.serializer_ = null;
goog.storage.Storage.prototype.set = function(key, value) {
  if(!goog.isDef(value)) {
    this.mechanism.remove(key);
    return
  }
  this.mechanism.set(key, this.serializer_.serialize(value))
};
goog.storage.Storage.prototype.get = function(key) {
  var json = this.mechanism.get(key);
  if(goog.isNull(json)) {
    return undefined
  }
  try {
    return goog.json.parse(json)
  }catch(e) {
    throw goog.storage.ErrorCode.INVALID_VALUE;
  }
};
goog.storage.Storage.prototype.remove = function(key) {
  this.mechanism.remove(key)
};
goog.provide("goog.storage.RichStorage");
goog.provide("goog.storage.RichStorage.Wrapper");
goog.require("goog.storage.ErrorCode");
goog.require("goog.storage.Storage");
goog.require("goog.storage.mechanism.Mechanism");
goog.storage.RichStorage = function(mechanism) {
  goog.base(this, mechanism)
};
goog.inherits(goog.storage.RichStorage, goog.storage.Storage);
goog.storage.RichStorage.DATA_KEY = "data";
goog.storage.RichStorage.Wrapper = function(value) {
  this[goog.storage.RichStorage.DATA_KEY] = value
};
goog.storage.RichStorage.Wrapper.wrapIfNecessary = function(value) {
  if(!goog.isDef(value) || value instanceof goog.storage.RichStorage.Wrapper) {
    return value
  }
  return new goog.storage.RichStorage.Wrapper(value)
};
goog.storage.RichStorage.Wrapper.unwrap = function(wrapper) {
  var value = wrapper[goog.storage.RichStorage.DATA_KEY];
  if(!goog.isDef(value)) {
    throw goog.storage.ErrorCode.INVALID_VALUE;
  }
  return value
};
goog.storage.RichStorage.Wrapper.unwrapIfPossible = function(wrapper) {
  if(!wrapper) {
    return undefined
  }
  return goog.storage.RichStorage.Wrapper.unwrap(wrapper)
};
goog.storage.RichStorage.prototype.set = function(key, value) {
  goog.base(this, "set", key, goog.storage.RichStorage.Wrapper.wrapIfNecessary(value))
};
goog.storage.RichStorage.prototype.getWrapper = function(key) {
  var wrapper = goog.storage.RichStorage.superClass_.get.call(this, key);
  if(!goog.isDef(wrapper) || wrapper instanceof Object) {
    return wrapper
  }
  throw goog.storage.ErrorCode.INVALID_VALUE;
};
goog.storage.RichStorage.prototype.get = function(key) {
  return goog.storage.RichStorage.Wrapper.unwrapIfPossible(this.getWrapper(key))
};
goog.provide("goog.storage.ExpiringStorage");
goog.require("goog.storage.RichStorage");
goog.require("goog.storage.RichStorage.Wrapper");
goog.require("goog.storage.mechanism.Mechanism");
goog.storage.ExpiringStorage = function(mechanism) {
  goog.base(this, mechanism)
};
goog.inherits(goog.storage.ExpiringStorage, goog.storage.RichStorage);
goog.storage.ExpiringStorage.EXPIRATION_TIME_KEY = "expiration";
goog.storage.ExpiringStorage.CREATION_TIME_KEY = "creation";
goog.storage.ExpiringStorage.getCreationTime = function(wrapper) {
  return wrapper[goog.storage.ExpiringStorage.CREATION_TIME_KEY]
};
goog.storage.ExpiringStorage.getExpirationTime = function(wrapper) {
  return wrapper[goog.storage.ExpiringStorage.EXPIRATION_TIME_KEY]
};
goog.storage.ExpiringStorage.isExpired = function(wrapper) {
  var creation = goog.storage.ExpiringStorage.getCreationTime(wrapper);
  var expiration = goog.storage.ExpiringStorage.getExpirationTime(wrapper);
  return!!expiration && expiration < goog.now() || !!creation && creation > goog.now()
};
goog.storage.ExpiringStorage.prototype.set = function(key, value, opt_expiration) {
  var wrapper = goog.storage.RichStorage.Wrapper.wrapIfNecessary(value);
  if(wrapper) {
    if(opt_expiration) {
      if(opt_expiration < goog.now()) {
        goog.storage.ExpiringStorage.prototype.remove.call(this, key);
        return
      }
      wrapper[goog.storage.ExpiringStorage.EXPIRATION_TIME_KEY] = opt_expiration
    }
    wrapper[goog.storage.ExpiringStorage.CREATION_TIME_KEY] = goog.now()
  }
  goog.base(this, "set", key, wrapper)
};
goog.storage.ExpiringStorage.prototype.getWrapper = function(key, opt_expired) {
  var wrapper = goog.base(this, "getWrapper", key);
  if(!wrapper) {
    return undefined
  }
  if(!opt_expired && goog.storage.ExpiringStorage.isExpired(wrapper)) {
    goog.storage.ExpiringStorage.prototype.remove.call(this, key);
    return undefined
  }
  return wrapper
};
goog.provide("goog.storage.mechanism.IterableMechanism");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.iter");
goog.require("goog.iter.Iterator");
goog.require("goog.storage.mechanism.Mechanism");
goog.storage.mechanism.IterableMechanism = function() {
  goog.base(this)
};
goog.inherits(goog.storage.mechanism.IterableMechanism, goog.storage.mechanism.Mechanism);
goog.storage.mechanism.IterableMechanism.prototype.getCount = function() {
  var count = 0;
  goog.iter.forEach(this.__iterator__(true), function(key) {
    goog.asserts.assertString(key);
    count++
  });
  return count
};
goog.storage.mechanism.IterableMechanism.prototype.__iterator__ = goog.abstractMethod;
goog.storage.mechanism.IterableMechanism.prototype.clear = function() {
  var keys = goog.iter.toArray(this.__iterator__(true));
  var selfObj = this;
  goog.array.forEach(keys, function(key) {
    selfObj.remove(key)
  })
};
goog.provide("goog.storage.CollectableStorage");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.iter");
goog.require("goog.storage.ErrorCode");
goog.require("goog.storage.ExpiringStorage");
goog.require("goog.storage.RichStorage.Wrapper");
goog.require("goog.storage.mechanism.IterableMechanism");
goog.storage.CollectableStorage = function(mechanism) {
  goog.base(this, mechanism)
};
goog.inherits(goog.storage.CollectableStorage, goog.storage.ExpiringStorage);
goog.storage.CollectableStorage.prototype.collect = function(opt_strict) {
  var selfObj = this;
  var keysToRemove = [];
  goog.iter.forEach(this.mechanism.__iterator__(true), function(key) {
    var wrapper;
    try {
      wrapper = goog.storage.CollectableStorage.prototype.getWrapper.call(selfObj, key, true)
    }catch(ex) {
      if(ex == goog.storage.ErrorCode.INVALID_VALUE) {
        if(opt_strict) {
          keysToRemove.push(key)
        }
        return
      }
      throw ex;
    }
    goog.asserts.assert(wrapper);
    if(goog.storage.ExpiringStorage.isExpired(wrapper)) {
      keysToRemove.push(key);
      return
    }
    if(opt_strict) {
      try {
        goog.storage.RichStorage.Wrapper.unwrap(wrapper)
      }catch(ex) {
        if(ex == goog.storage.ErrorCode.INVALID_VALUE) {
          keysToRemove.push(key);
          return
        }
        throw ex;
      }
    }
  });
  goog.array.forEach(keysToRemove, function(key) {
    goog.storage.CollectableStorage.prototype.remove.call(selfObj, key)
  })
};
goog.provide("goog.storage.EncryptedStorage");
goog.require("goog.crypt");
goog.require("goog.crypt.Arc4");
goog.require("goog.crypt.Sha1");
goog.require("goog.crypt.base64");
goog.require("goog.json");
goog.require("goog.json.Serializer");
goog.require("goog.storage.CollectableStorage");
goog.require("goog.storage.ErrorCode");
goog.require("goog.storage.RichStorage");
goog.require("goog.storage.RichStorage.Wrapper");
goog.require("goog.storage.mechanism.IterableMechanism");
goog.storage.EncryptedStorage = function(mechanism, secret) {
  goog.base(this, mechanism);
  this.secret_ = goog.crypt.stringToByteArray(secret);
  this.cleartextSerializer_ = new goog.json.Serializer
};
goog.inherits(goog.storage.EncryptedStorage, goog.storage.CollectableStorage);
goog.storage.EncryptedStorage.SALT_KEY = "salt";
goog.storage.EncryptedStorage.prototype.secret_ = null;
goog.storage.EncryptedStorage.prototype.cleartextSerializer_ = null;
goog.storage.EncryptedStorage.prototype.hashKeyWithSecret_ = function(key) {
  var sha1 = new goog.crypt.Sha1;
  sha1.update(goog.crypt.stringToByteArray(key));
  sha1.update(this.secret_);
  return goog.crypt.base64.encodeByteArray(sha1.digest(), true)
};
goog.storage.EncryptedStorage.prototype.encryptValue_ = function(salt, key, value) {
  if(!(salt.length > 0)) {
    throw Error("Non-empty salt must be provided");
  }
  var sha1 = new goog.crypt.Sha1;
  sha1.update(goog.crypt.stringToByteArray(key));
  sha1.update(salt);
  sha1.update(this.secret_);
  var arc4 = new goog.crypt.Arc4;
  arc4.setKey(sha1.digest());
  arc4.discard(1536);
  var bytes = goog.crypt.stringToByteArray(value);
  arc4.crypt(bytes);
  return goog.crypt.byteArrayToString(bytes)
};
goog.storage.EncryptedStorage.prototype.decryptValue_ = function(salt, key, value) {
  return this.encryptValue_(salt, key, value)
};
goog.storage.EncryptedStorage.prototype.set = function(key, value, opt_expiration) {
  if(!goog.isDef(value)) {
    goog.storage.EncryptedStorage.prototype.remove.call(this, key);
    return
  }
  var salt = [];
  for(var i = 0;i < 8;++i) {
    salt[i] = Math.floor(Math.random() * 256)
  }
  var wrapper = new goog.storage.RichStorage.Wrapper(this.encryptValue_(salt, key, this.cleartextSerializer_.serialize(value)));
  wrapper[goog.storage.EncryptedStorage.SALT_KEY] = salt;
  goog.base(this, "set", this.hashKeyWithSecret_(key), wrapper, opt_expiration)
};
goog.storage.EncryptedStorage.prototype.getWrapper = function(key, opt_expired) {
  var wrapper = goog.base(this, "getWrapper", this.hashKeyWithSecret_(key), opt_expired);
  if(!wrapper) {
    return undefined
  }
  var value = goog.storage.RichStorage.Wrapper.unwrap(wrapper);
  var salt = wrapper[goog.storage.EncryptedStorage.SALT_KEY];
  if(!goog.isString(value) || !goog.isArray(salt) || !salt.length) {
    throw goog.storage.ErrorCode.INVALID_VALUE;
  }
  var json = this.decryptValue_(salt, key, value);
  try {
    wrapper[goog.storage.RichStorage.DATA_KEY] = goog.json.parse(json)
  }catch(e) {
    throw goog.storage.ErrorCode.DECRYPTION_ERROR;
  }
  return wrapper
};
goog.storage.EncryptedStorage.prototype.remove = function(key) {
  goog.base(this, "remove", this.hashKeyWithSecret_(key))
};
goog.provide("ydn.db.RichStorage_");
goog.require("goog.storage.EncryptedStorage");
goog.require("goog.storage.ExpiringStorage");
ydn.db.RichStorage = function(parent, secret, opt_default_expiration) {
  this.cleartextSerializer_ = new goog.json.Serializer;
  this.parent = parent;
  this.secret_ = goog.crypt.stringToByteArray(secret);
  this.default_expiration = opt_default_expiration
};
ydn.db.RichStorage.isExpired = goog.storage.ExpiringStorage.isExpired;
ydn.db.RichStorage.EXPIRATION_TIME_KEY = goog.storage.ExpiringStorage.EXPIRATION_TIME_KEY;
ydn.db.RichStorage.CREATION_TIME_KEY = goog.storage.ExpiringStorage.CREATION_TIME_KEY;
ydn.db.RichStorage.DATA_KEY = goog.storage.RichStorage.DATA_KEY;
ydn.db.RichStorage.prototype.hashKeyWithSecret_ = goog.storage.EncryptedStorage.prototype.hashKeyWithSecret_;
ydn.db.RichStorage.prototype.encryptValue_ = goog.storage.EncryptedStorage.prototype.encryptValue_;
ydn.db.RichStorage.prototype.decryptValue_ = goog.storage.EncryptedStorage.prototype.decryptValue_;
ydn.db.RichStorage.prototype.unwrapValue = function(key, value) {
  var wrapper = JSON.parse(value);
  goog.asserts.assertObject(wrapper, key + " corrupted: " + value);
  var salt = wrapper[goog.storage.EncryptedStorage.SALT_KEY];
  if(!goog.isString(value) || !goog.isArray(salt) || !salt.length) {
    throw goog.storage.ErrorCode.INVALID_VALUE;
  }
  var json = this.decryptValue_(salt, key, value);
  try {
    wrapper[goog.storage.RichStorage.DATA_KEY] = goog.json.parse(json)
  }catch(e) {
    throw goog.storage.ErrorCode.DECRYPTION_ERROR;
  }
  if(goog.storage.ExpiringStorage.isExpired(wrapper)) {
    this.parent.removeItem(key);
    return undefined
  }
  var data = wrapper[ydn.db.RichStorage.DATA_KEY];
  goog.asserts.assertString(data);
  return data
};
ydn.db.RichStorage.prototype.wrapValue = function(key, value, opt_expiration) {
  key = this.hashKeyWithSecret_(key);
  var salt = [];
  for(var i = 0;i < 8;++i) {
    salt[i] = Math.floor(Math.random() * 256)
  }
  value = this.encryptValue_(salt, key, this.cleartextSerializer_.serialize(value));
  var wrapper = {};
  wrapper[ydn.db.RichStorage.DATA_KEY] = value;
  if(goog.isDef(opt_expiration)) {
    goog.asserts.assert(opt_expiration > 0, "expiration time must be a number " + " but " + opt_expiration + " found.")
  }else {
    opt_expiration = this.default_expiration
  }
  if(opt_expiration) {
    wrapper[ydn.db.RichStorage.EXPIRATION_TIME_KEY] = opt_expiration
  }
  wrapper[ydn.db.RichStorage.CREATION_TIME_KEY] = goog.now();
  return ydn.json.stringify(wrapper)
};
goog.provide("goog.functions");
goog.functions.constant = function(retValue) {
  return function() {
    return retValue
  }
};
goog.functions.FALSE = goog.functions.constant(false);
goog.functions.TRUE = goog.functions.constant(true);
goog.functions.NULL = goog.functions.constant(null);
goog.functions.identity = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.functions.error = function(message) {
  return function() {
    throw Error(message);
  }
};
goog.functions.lock = function(f, opt_numArgs) {
  opt_numArgs = opt_numArgs || 0;
  return function() {
    return f.apply(this, Array.prototype.slice.call(arguments, 0, opt_numArgs))
  }
};
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue))
};
goog.functions.compose = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    if(length) {
      result = functions[length - 1].apply(this, arguments)
    }
    for(var i = length - 2;i >= 0;i--) {
      result = functions[i].call(this, result)
    }
    return result
  }
};
goog.functions.sequence = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    for(var i = 0;i < length;i++) {
      result = functions[i].apply(this, arguments)
    }
    return result
  }
};
goog.functions.and = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(!functions[i].apply(this, arguments)) {
        return false
      }
    }
    return true
  }
};
goog.functions.or = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(functions[i].apply(this, arguments)) {
        return true
      }
    }
    return false
  }
};
goog.functions.not = function(f) {
  return function() {
    return!f.apply(this, arguments)
  }
};
goog.functions.create = function(constructor, var_args) {
  var temp = function() {
  };
  temp.prototype = constructor.prototype;
  var obj = new temp;
  constructor.apply(obj, Array.prototype.slice.call(arguments, 1));
  return obj
};
goog.provide("ydn.db.IDBKeyRange");
goog.provide("ydn.db.KeyRange");
ydn.db.KeyRange = function(lower, upper, lowerOpen, upperOpen) {
  this["lower"] = lower;
  this["upper"] = upper;
  this["lowerOpen"] = !!lowerOpen;
  this["upperOpen"] = !!upperOpen
};
ydn.db.KeyRange.prototype.lower = undefined;
ydn.db.KeyRange.prototype.upper = undefined;
ydn.db.KeyRange.prototype.lowerOpen = false;
ydn.db.KeyRange.prototype.upperOpen = false;
ydn.db.KeyRange.prototype.toJSON = function() {
  return ydn.db.KeyRange.toJSON(this)
};
ydn.db.KeyRange.clone = function(kr) {
  if(goog.isDefAndNotNull(kr)) {
    return new ydn.db.KeyRange(kr.lower, kr.upper, !!kr.lowerOpen, !!kr.upperOpen)
  }else {
    return undefined
  }
};
ydn.db.KeyRange.only = function(value) {
  return new ydn.db.KeyRange(value, value, false, false)
};
ydn.db.KeyRange.bound = function(lower, upper, opt_lowerOpen, opt_upperOpen) {
  return new ydn.db.KeyRange(lower, upper, opt_lowerOpen, opt_upperOpen)
};
ydn.db.KeyRange.upperBound = function(upper, opt_upperOpen) {
  return new ydn.db.KeyRange(undefined, upper, undefined, opt_upperOpen)
};
ydn.db.KeyRange.lowerBound = function(lower, opt_lowerOpen) {
  return new ydn.db.KeyRange(lower, undefined, opt_lowerOpen, undefined)
};
ydn.db.KeyRange.starts = function(value) {
  var value_upper;
  if(goog.isArray(value)) {
    value_upper = ydn.object.clone(value);
    value_upper.push("\uffff")
  }else {
    if(goog.isString(value)) {
      value_upper = value + "\uffff"
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
  return ydn.db.KeyRange.bound(value, value_upper, false, true)
};
ydn.db.KeyRange.toJSON = function(keyRange) {
  keyRange = keyRange || {};
  var out = {"lower":keyRange["lower"], "upper":keyRange["upper"], "lowerOpen":keyRange["lowerOpen"], "upperOpen":keyRange["upperOpen"]};
  return out
};
ydn.db.KeyRange.parseKeyRange = function(keyRange) {
  if(!goog.isDefAndNotNull(keyRange)) {
    return null
  }
  if(goog.isDef(keyRange["upper"]) && goog.isDef(keyRange["lower"])) {
    return ydn.db.IDBKeyRange.bound(keyRange.lower, keyRange.upper, !!keyRange["lowerOpen"], !!keyRange["upperOpen"])
  }else {
    if(goog.isDef(keyRange.upper)) {
      return ydn.db.IDBKeyRange.upperBound(keyRange.upper, keyRange.upperOpen)
    }else {
      if(goog.isDef(keyRange.lower)) {
        return ydn.db.IDBKeyRange.lowerBound(keyRange.lower, keyRange.lowerOpen)
      }else {
        return null
      }
    }
  }
};
ydn.db.KeyRange.parseIDBKeyRange = function(key_range) {
  return ydn.db.KeyRange.parseKeyRange(key_range)
};
ydn.db.KeyRange.validate = function(keyRange) {
  if(keyRange instanceof ydn.db.KeyRange) {
    return""
  }else {
    if(goog.isDefAndNotNull(keyRange)) {
      if(goog.isObject(keyRange)) {
        for(var key in keyRange) {
          if(keyRange.hasOwnProperty(key)) {
            if(!goog.array.contains(["lower", "upper", "lowerOpen", "upperOpen"], key)) {
              return'invalid attribute "' + key + '" in key range object'
            }
          }
        }
        return""
      }else {
        return"key range must be an object"
      }
    }else {
      return""
    }
  }
};
ydn.db.IDBKeyRange = goog.global.IDBKeyRange || goog.global.webkitIDBKeyRange || ydn.db.KeyRange;
goog.provide("ydn.db.Where");
goog.require("ydn.db.KeyRange");
goog.require("goog.string");
ydn.db.Where = function(field, op, value, op2, value2) {
  var upper, lower, upperOpen, lowerOpen;
  if(goog.isObject(op)) {
    lower = op["lower"];
    upper = op["upper"];
    lowerOpen = op["lowerOpen"];
    upperOpen = op["upperOpen"]
  }else {
    if(op == "<" || op == "<=") {
      upper = value;
      upperOpen = op == "<"
    }else {
      if(op == ">" || op == ">=") {
        lower = value;
        lowerOpen = op == ">"
      }else {
        if(op == "=" || op == "==") {
          lower = value;
          upper = value
        }
      }
    }
    if(op2 == "<" || op2 == "<=") {
      upper = value2;
      upperOpen = op2 == "<"
    }else {
      if(op2 == ">" || op2 == ">=") {
        lower = value2;
        lowerOpen = op2 == ">"
      }else {
        if(goog.isDef(op2)) {
          throw new ydn.error.ArgumentException(op2);
        }
      }
    }
  }
  goog.base(this, lower, upper, lowerOpen, upperOpen);
  this.field = field
};
goog.inherits(ydn.db.Where, ydn.db.KeyRange);
ydn.db.Where.prototype.field = "";
ydn.db.Where.prototype.getField = function() {
  return this.field
};
ydn.db.Where.toWhereClause = function(field, key_range) {
  var sql = "";
  var params = [];
  goog.asserts.assert(!goog.string.startsWith(field, '"'));
  if(key_range) {
    var column = goog.string.quote(field);
    if(ydn.db.Where.resolvedStartsWith(key_range)) {
      sql = column + " LIKE ?";
      params.push(key_range.lower + "%")
    }else {
      if(key_range.lower == key_range.upper) {
        sql = column + " = ?";
        params.push(key_range.lower)
      }else {
        if(goog.isDef(key_range.lower)) {
          var lowerOp = key_range.lowerOpen ? " > " : " >= ";
          sql += " " + column + lowerOp + "?";
          params.push(key_range.lower)
        }
        if(goog.isDef(key_range.upper)) {
          var upperOp = key_range.upperOpen ? " < " : " <= ";
          var and = sql.length > 0 ? " AND " : " ";
          sql += and + column + upperOp + "?";
          params.push(key_range.upper)
        }
      }
    }
  }
  return{sql:sql, params:params}
};
ydn.db.Where.prototype.toWhereClause = function() {
  return ydn.db.Where.toWhereClause(this.field, this)
};
ydn.db.Where.resolvedStartsWith = function(keyRange) {
  if(!goog.isDefAndNotNull(keyRange)) {
    return false
  }
  return goog.isDef(keyRange.lower) && goog.isDef(keyRange.upper) && !keyRange.lowerOpen && !keyRange.upperOpen && keyRange.lower.length == keyRange.upper.length + 1 && keyRange.upper[keyRange.lower.length - 1] == "\uffff"
};
ydn.db.Where.prototype.and = function(where) {
  if(this.field != where.field) {
    return null
  }
  var lower, upper, lowerOpen, upperOpen;
  if(goog.isDefAndNotNull(this.lower) && goog.isDefAndNotNull(where.lower)) {
    if(this.lower > where.lower) {
      lower = this.lower;
      lowerOpen = this.lowerOpen
    }else {
      if(this.lower == where.lower) {
        lower = this.lower;
        lowerOpen = this.lowerOpen || where.lowerOpen
      }else {
        lower = where.lower;
        lowerOpen = where.lowerOpen
      }
    }
  }else {
    if(goog.isDefAndNotNull(this.lower)) {
      lower = this.lower;
      lowerOpen = this.lowerOpen
    }else {
      if(goog.isDefAndNotNull(where.lower)) {
        lower = where.lower;
        lowerOpen = where.lowerOpen
      }
    }
  }
  if(goog.isDefAndNotNull(this.upper) && goog.isDefAndNotNull(where.upper)) {
    if(this.lower > where.upper) {
      upper = this.upper;
      upperOpen = this.upperOpen
    }else {
      if(this.lower == where.lower) {
        upper = this.upper;
        upperOpen = this.upperOpen || where.upperOpen
      }else {
        upper = where.upper;
        upperOpen = where.upperOpen
      }
    }
  }else {
    if(goog.isDefAndNotNull(this.upper)) {
      upper = this.upper;
      upperOpen = this.upperOpen
    }else {
      if(goog.isDefAndNotNull(where.upper)) {
        upper = where.upper;
        upperOpen = where.upperOpen
      }
    }
  }
  return new ydn.db.Where(this.field, {"lower":lower, "upper":upper, "lowerOpen":lowerOpen, "upperOpen":upperOpen})
};
goog.provide("ydn.db.base");
goog.require("goog.async.Deferred");
ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME = "_ROWID_";
ydn.db.base.DEFAULT_BLOB_COLUMN = "_default_";
ydn.db.base.JQUERY = false;
ydn.db.base.DEFAULT_RESULT_LIMIT = 1E6;
ydn.db.base.createDeferred = function() {
  if(ydn.db.base.JQUERY) {
    return new goog.async.Deferred
  }else {
    return new goog.async.Deferred
  }
};
ydn.db.base.TransactionEventTypes = {COMPLETE:"complete", ABORT:"abort", ERROR:"error"};
ydn.db.base.DefaultTransactionMode = {"READ_ONLY":"readonly", "READ_WRITE":"readwrite", "VERSION_CHANGE":"versionchange"};
ydn.db.base.IDBTransaction = goog.global.webkitIDBRequest && "LOADING" in goog.global.webkitIDBRequest ? goog.global.webkitIDBTransaction || goog.global.IDBTransaction : ydn.db.base.DefaultTransactionMode;
ydn.db.base.TransactionMode = {READ_ONLY:ydn.db.base.IDBTransaction.READ_ONLY, READ_WRITE:ydn.db.base.IDBTransaction.READ_WRITE, VERSION_CHANGE:ydn.db.base.IDBTransaction.VERSION_CHANGE};
ydn.db.base.CursorMode = {READ_ONLY:ydn.db.base.TransactionMode.READ_ONLY, READ_WRITE:ydn.db.base.TransactionMode.READ_WRITE, KEY_ONLY:"keyonly"};
ydn.db.base.ENABLE_DEFAULT_TEXT_STORE = false;
ydn.db.base.ENABLE_ENCRYPTION = false;
ydn.db.base.Direction = {NEXT:"next", NEXT_UNIQUE:"nextunique", PREV:"prev", PREV_UNIQUE:"prevunique"};
ydn.db.base.DIRECTIONS = [ydn.db.base.Direction.NEXT, ydn.db.base.Direction.NEXT_UNIQUE, ydn.db.base.Direction.PREV, ydn.db.base.Direction.PREV_UNIQUE];
ydn.db.base.getDirection = function(reverse, unique) {
  if(reverse) {
    return unique ? ydn.db.base.Direction.PREV_UNIQUE : ydn.db.base.Direction.PREV
  }else {
    return unique ? ydn.db.base.Direction.NEXT_UNIQUE : ydn.db.base.Direction.NEXT
  }
};
goog.provide("ydn.db.index.req.ICursor");
ydn.db.index.req.ICursor = function() {
};
ydn.db.index.req.ICursor.prototype.onNext = goog.abstractMethod;
ydn.db.index.req.ICursor.prototype.onError = goog.abstractMethod;
ydn.db.index.req.ICursor.prototype.onSuccess = goog.abstractMethod;
ydn.db.index.req.ICursor.prototype.forward = goog.abstractMethod;
ydn.db.index.req.ICursor.prototype.seek = goog.abstractMethod;
goog.provide("ydn.error");
goog.provide("ydn.error.ArgumentException");
goog.provide("ydn.error.NotImplementedException");
goog.provide("ydn.error.ConstrainError");
goog.provide("ydn.error.NotSupportedException");
goog.provide("ydn.error.InternalError");
goog.provide("ydn.error.InvalidOperationException");
goog.provide("ydn.error.InvalidOperationError");
ydn.error.ArgumentException = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.error.ArgumentException)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "ydn.ArgumentException"
};
goog.inherits(ydn.error.ArgumentException, Error);
ydn.error.NotSupportedException = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.error.NotSupportedException)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(ydn.error.ArgumentException, Error);
ydn.error.NotSupportedException.prototype.name = "ydn.NotSupportedException";
ydn.error.NotImplementedException = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.error.NotImplementedException)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "ydn.NotImplementedException"
};
goog.inherits(ydn.error.NotImplementedException, Error);
ydn.error.InternalError = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.error.InternalError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(ydn.error.InternalError, Error);
ydn.error.InternalError.prototype.name = "ydn.InternalError";
ydn.error.ConstrainError = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.error.ConstrainError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "ydn.ConstrainError"
};
goog.inherits(ydn.error.ConstrainError, Error);
ydn.error.InvalidOperationException = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.error.InvalidOperationException)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "ydn.InvalidOperationException"
};
goog.inherits(ydn.error.ArgumentException, Error);
ydn.error.InvalidOperationError = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.error.InvalidOperationError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "ydn.InvalidOperationError"
};
goog.inherits(ydn.error.InvalidOperationError, Error);
goog.provide("ydn.db.Iterator");
goog.provide("ydn.db.KeyIterator");
goog.provide("ydn.db.ValueIterator");
goog.provide("ydn.db.Iterator.State");
goog.require("goog.functions");
goog.require("ydn.db.KeyRange");
goog.require("ydn.db.Where");
goog.require("ydn.db.base");
goog.require("ydn.db.index.req.ICursor");
goog.require("ydn.error.ArgumentException");
ydn.db.Iterator = function(store, index, keyRange, reverse, unique, key_only) {
  if(!goog.isString(store)) {
    throw new ydn.error.ArgumentException("store");
  }
  var idx;
  if(goog.isArray(index)) {
    idx = index.join(", ")
  }else {
    if(goog.isString(index)) {
      idx = index
    }else {
      if(!goog.isDef(index)) {
        idx = undefined
      }else {
        throw new ydn.error.ArgumentException("index");
      }
    }
  }
  if(arguments.length > 6) {
    throw new ydn.error.ArgumentException("too many input arguments.");
  }
  this.store_name = store;
  this.index = idx;
  this.key_only_ = goog.isDef(key_only) ? key_only : !!goog.isString(this.index);
  if(!goog.isBoolean(this.key_only_)) {
    throw new ydn.error.ArgumentException("key_only");
  }
  if(goog.isDef(reverse) && !goog.isBoolean(reverse)) {
    throw new ydn.error.ArgumentException("reverse");
  }
  if(goog.isDef(unique) && !goog.isBoolean(unique)) {
    throw new ydn.error.ArgumentException("unique");
  }
  var direction = ydn.db.base.Direction.NEXT;
  if(reverse && unique) {
    direction = ydn.db.base.Direction.PREV_UNIQUE
  }else {
    if(reverse) {
      direction = ydn.db.base.Direction.PREV
    }else {
      if(unique) {
        direction = ydn.db.base.Direction.NEXT_UNIQUE
      }
    }
  }
  this.direction = direction;
  if(goog.DEBUG) {
    var msg = ydn.db.KeyRange.validate(keyRange);
    if(msg) {
      throw new ydn.error.ArgumentException(msg);
    }
  }
  this.key_range_ = ydn.db.KeyRange.parseKeyRange(keyRange);
  this.filter_index_names_ = [];
  this.filter_key_ranges_ = [];
  this.filter_store_names_ = [];
  this.filter_ini_keys_ = [];
  this.filter_ini_index_keys_ = [];
  this.counter = 0;
  this.store_key = undefined;
  this.index_key = undefined;
  this.has_done = undefined;
  this.iterating_ = false
};
ydn.db.Iterator.DEBUG = false;
ydn.db.KeyIterator = function(store, index, keyRange, reverse, unique) {
  var key_range;
  var idx;
  if(goog.isObject(index) && !goog.isArray(index)) {
    goog.asserts.assert(!goog.isDef(unique), "too many input argument");
    unique = reverse;
    if(goog.isDef(keyRange)) {
      goog.asserts.assertBoolean(keyRange, "reverse must be boolean");
      reverse = keyRange
    }else {
      reverse = undefined
    }
    key_range = index;
    idx = undefined
  }else {
    key_range = keyRange;
    idx = index
  }
  goog.base(this, store, idx, key_range, reverse, unique, true)
};
goog.inherits(ydn.db.KeyIterator, ydn.db.Iterator);
ydn.db.ValueIterator = function(store, index, keyRange, reverse, unique) {
  var key_range;
  var idx;
  if(goog.isObject(index) && !goog.isArray(index)) {
    goog.asserts.assert(!goog.isDef(unique), "too many input argument");
    unique = reverse;
    if(goog.isDef(keyRange)) {
      goog.asserts.assertBoolean(keyRange, "reverse must be boolean");
      reverse = keyRange
    }else {
      reverse = undefined
    }
    key_range = index;
    idx = undefined
  }else {
    key_range = keyRange;
    idx = index
  }
  goog.base(this, store, idx, key_range, reverse, unique, false)
};
goog.inherits(ydn.db.ValueIterator, ydn.db.Iterator);
ydn.db.Iterator.State = {INITIAL:"initial", WORKING:"working", RESTING:"resting", COMPLETED:"completed"};
ydn.db.Iterator.prototype.getState = function() {
  if(!goog.isDef(this.has_done)) {
    return ydn.db.Iterator.State.INITIAL
  }else {
    if(this.has_done === false) {
      goog.asserts.assert(goog.isDef(this.store_key));
      if(this.iterating_) {
        return ydn.db.Iterator.State.WORKING
      }else {
        return ydn.db.Iterator.State.RESTING
      }
    }else {
      goog.asserts.assert(goog.isDef(this.store_key));
      return ydn.db.Iterator.State.COMPLETED
    }
  }
};
ydn.db.Iterator.prototype.logger = goog.debug.Logger.getLogger("ydn.db.Iterator");
ydn.db.Iterator.prototype.getStoreName = function() {
  return this.store_name
};
ydn.db.Iterator.prototype.getIndexName = function() {
  return this.index
};
ydn.db.Iterator.prototype.getDirection = function() {
  return this.direction
};
ydn.db.Iterator.prototype.store_name;
ydn.db.Iterator.prototype.index;
ydn.db.Iterator.prototype.store_key;
ydn.db.Iterator.prototype.index_key;
ydn.db.Iterator.prototype.has_done = undefined;
ydn.db.Iterator.prototype.iterating_ = false;
ydn.db.Iterator.prototype.getPrimaryKey = function() {
  return this.store_key
};
ydn.db.Iterator.prototype.getIndexKey = function() {
  return this.index_key
};
ydn.db.Iterator.prototype.keyRange = function() {
  return this.key_range_
};
ydn.db.Iterator.prototype.getKeyRange = function() {
  return ydn.db.KeyRange.parseIDBKeyRange(this.key_range_)
};
ydn.db.Iterator.prototype.key_range_;
ydn.db.Iterator.prototype.key_only_ = true;
ydn.db.Iterator.prototype.isKeyOnly = function() {
  return this.key_only_
};
ydn.db.Iterator.prototype.isIndexIterator = function() {
  return goog.isString(this.index)
};
ydn.db.Iterator.prototype.toJSON = function() {
  return{"store":this.store_name, "index":this.index, "key_range":this.key_range_ ? ydn.db.KeyRange.toJSON(this.key_range_) : null, "direction":this.direction}
};
ydn.db.Iterator.prototype.direction;
ydn.db.Iterator.prototype.toString = function() {
  var idx = goog.isDef(this.index) ? ":" + this.index : "";
  if(goog.DEBUG) {
    if(goog.isDefAndNotNull(this.store_key)) {
      var close = "]";
      var start = "[";
      var state = this.getState();
      if(state == ydn.db.Iterator.State.WORKING) {
        start = "{";
        close = "}"
      }else {
        if(state == ydn.db.Iterator.State.RESTING) {
          start = "(";
          close = ")"
        }
      }
      idx += " " + start + this.store_key + ", " + this.index_key + close
    }
  }
  return"Iterator:" + this.store_name + idx
};
ydn.db.Iterator.prototype.key = function() {
  return this.store_key
};
ydn.db.Iterator.prototype.indexKey = function() {
  return this.index_key
};
ydn.db.Iterator.prototype.resume = function(key, index_key) {
  this.store_key = key;
  this.index_key = index_key
};
ydn.db.Iterator.prototype.count = function() {
  return this.counter
};
ydn.db.Iterator.prototype.done = function() {
  return this.has_done
};
ydn.db.Iterator.prototype.stores = function() {
  return[this.store_name].concat(this.peer_store_names_)
};
ydn.db.Iterator.where = function(store_name, field, op, value, op2, value2) {
  var key_range = new ydn.db.Where(field, op, value, op2, value2);
  return new ydn.db.Iterator(store_name, field, key_range)
};
ydn.db.Iterator.prototype.peer_store_names_ = [];
ydn.db.Iterator.prototype.peer_index_names_ = [];
ydn.db.Iterator.prototype.base_index_names_ = [];
ydn.db.Iterator.prototype.join = function(peer_store_name, base_index_name, peer_index_name) {
  if(!goog.isString(peer_store_name)) {
    throw new ydn.error.ArgumentException;
  }
  if(!goog.isString(base_index_name) || !goog.isDef(base_index_name)) {
    throw new ydn.error.ArgumentException;
  }
  if(!goog.isString(peer_index_name) || !goog.isDef(peer_index_name)) {
    throw new ydn.error.ArgumentException;
  }
  this.peer_store_names_.push(peer_store_name);
  this.peer_index_names_.push(peer_index_name);
  this.base_index_names_.push(base_index_name)
};
ydn.db.Iterator.prototype.getPeerStoreName = function(i) {
  goog.asserts.assert(i >= 0 && i < this.peer_store_names_.length);
  return this.peer_store_names_[i]
};
ydn.db.Iterator.prototype.getPeerIndexName = function(i) {
  goog.asserts.assert(i >= 0 && i < this.peer_index_names_.length);
  return this.peer_index_names_[i]
};
ydn.db.Iterator.prototype.getBaseIndexName = function(i) {
  goog.asserts.assert(i >= 0 && i < this.base_index_names_.length);
  return this.base_index_names_[i]
};
ydn.db.Iterator.prototype.degree = function() {
  return this.peer_store_names_.length + 1
};
ydn.db.Iterator.prototype.isReversed = function() {
  return this.direction === ydn.db.base.Direction.PREV || this.direction === ydn.db.base.Direction.PREV_UNIQUE
};
ydn.db.Iterator.prototype.isUnique = function() {
  return this.direction === ydn.db.base.Direction.NEXT_UNIQUE || this.direction === ydn.db.base.Direction.PREV_UNIQUE
};
ydn.db.Iterator.prototype.filter_index_names_ = [];
ydn.db.Iterator.prototype.filter_key_ranges_ = [];
ydn.db.Iterator.prototype.filter_store_names_ = [];
ydn.db.Iterator.prototype.filter_ini_keys_ = [];
ydn.db.Iterator.prototype.filter_ini_index_keys_ = [];
ydn.db.Iterator.prototype.filter = function(index_name, key_range, store_name) {
  if(arguments.length > 3) {
    throw new ydn.error.ArgumentException("too many input arguments.");
  }
  if(!goog.isString(index_name)) {
    throw new ydn.error.ArgumentException("index name");
  }
  this.filter_index_names_.push(index_name);
  var kr;
  if(key_range instanceof ydn.db.KeyRange) {
    kr = ydn.db.KeyRange.parseIDBKeyRange(key_range)
  }else {
    if(goog.isDef(key_range)) {
      kr = ydn.db.IDBKeyRange.only(key_range)
    }else {
      throw new ydn.error.ArgumentException("key range");
    }
  }
  this.filter_key_ranges_.push(kr);
  if(goog.isDef(store_name)) {
    if(goog.isString(store_name)) {
      this.filter_store_names_.push(store_name)
    }else {
      throw new ydn.error.ArgumentException("store name");
    }
  }else {
    this.filter_store_names_.push(undefined)
  }
};
ydn.db.Iterator.prototype.countFilter = function() {
  return this.filter_index_names_.length
};
ydn.db.Iterator.prototype.getFilterIndexName = function(idx) {
  return this.filter_index_names_[idx]
};
ydn.db.Iterator.prototype.getFilterStoreName = function(idx) {
  return this.filter_store_names_[idx]
};
ydn.db.Iterator.prototype.getFilterKeyRange = function(idx) {
  return this.filter_key_ranges_[idx]
};
ydn.db.Iterator.prototype.exit = function() {
  this.store_key = goog.isArray(this.store_key) ? goog.array.clone(this.store_key) : this.store_key;
  this.index_key = goog.isArray(this.index_key) ? goog.array.clone(this.index_key) : this.index_key;
  this.iterating_ = false;
  this.has_done = false;
  this.logger.finest(this + ": exited")
};
ydn.db.Iterator.prototype.iterate_ = function(executor) {
  var ini_key, ini_index_key;
  var resume = this.has_done === false;
  if(resume) {
    goog.asserts.assert(this.store_key);
    ini_key = this.store_key;
    ini_index_key = this.index_key
  }else {
    this.counter = 0
  }
  this.has_done = undefined;
  var cursor = executor.getCursor(this.store_name, this.index, this.key_range_, this.direction, this.key_only_, ini_key, ini_index_key);
  this.logger.finest(this + " created " + cursor);
  var me = this;
  cursor.onSuccess = function(primary_key, key, value) {
    if(goog.isDef(primary_key)) {
      me.store_key = primary_key;
      me.index_key = key;
      me.counter++;
      cursor.onNext(primary_key, key, value)
    }else {
      me.has_done = true;
      cursor.onNext(undefined, undefined, undefined)
    }
  };
  cursor.open_request(ini_key, ini_index_key, resume);
  return cursor
};
ydn.db.Iterator.prototype.iterateWithFilters_ = function(executor) {
  var me = this;
  var ini_key, ini_index_key;
  var resume = this.has_done === false;
  if(resume) {
    goog.asserts.assert(this.store_key);
    ini_key = this.store_key;
    ini_index_key = this.index_key
  }else {
    this.counter = 0
  }
  this.iterating_ = true;
  var cursors = [];
  var primary_cursor = executor.getCursor(this.store_name, this.index, this.key_range_, this.direction, this.key_only_, ini_key, ini_index_key);
  primary_cursor.onSuccess = function(primary_key, key, value) {
    if(goog.isDef(primary_key)) {
      me.has_done = false;
      me.store_key = primary_key;
      me.index_key = key;
      if(isAllRequestDone()) {
        processNext(0)
      }
    }else {
      me.has_done = true;
      me.iterating_ = false
    }
  };
  var filterCursorOnSuccess = function(i, primary_key, key, value) {
    var all_done = isAllRequestDone();
    if(goog.isDef(primary_key)) {
      me.filter_ini_keys_[i] = primary_key;
      me.filter_ini_index_keys_[i] = key
    }
    if(isAllRequestDone()) {
      processNext(i + 1)
    }
  };
  for(var i = 0;i < this.filter_index_names_.length;i++) {
    var store_name = this.filter_store_names_[i] || this.store_name;
    var cursor = executor.getCursor(store_name, this.filter_index_names_[i], this.filter_key_ranges_[i], this.direction, true, this.filter_ini_keys_[i], this.filter_ini_index_keys_[i]);
    cursors.push(cursor);
    cursor.onSuccess = goog.partial(filterCursorOnSuccess, i)
  }
  if(ydn.db.Iterator.DEBUG) {
    var msg = [];
    msg.push(primary_cursor.toString());
    for(var i = 0;i < cursors.length;i++) {
      msg.push(cursors[i].toString())
    }
    window.console.log("iterating " + msg.join(", "))
  }
  var isAllRequestDone = function() {
    var some_req_not_finished = cursors.some(function(req) {
      return req.isRequestPending()
    });
    return!some_req_not_finished
  };
  var processNext = function(idx) {
    var pass = false;
    var match = true;
    var cmps = [];
    var highest_key = me.store_key;
    for(var i = 0;i < cursors.length;i++) {
      var cursor = cursors[i];
      if(cursor.hasCursor()) {
        var cmp = ydn.db.cmp(me.store_key, cursor.getPrimaryKey());
        cmps[i] = cmp;
        if(cmp === 1) {
          match = false
        }else {
          if(cmp === -1) {
            match = false;
            pass = true;
            if(ydn.db.cmp(cursor.getPrimaryKey(), highest_key) === 1) {
              highest_key = cursor.getPrimaryKey()
            }
          }
        }
      }else {
        match = false
      }
    }
    if(ydn.db.Iterator.DEBUG) {
      window.console.log(["processNext", match, pass, highest_key, JSON.stringify(cmps)])
    }
    if(match) {
      primary_cursor.onNext(primary_cursor.getPrimaryKey(), primary_cursor.getIndexKey(), primary_cursor.getValue());
      for(var i = 0;i < cursors.length;i++) {
        cursors[i].forward(true)
      }
    }else {
      if(pass) {
        if(highest_key != me.store_key) {
          primary_cursor.seek(highest_key, undefined, true)
        }
        for(var i = 0;i < cursors.length;i++) {
          if(cmps[i] == 0) {
            cursors[i].seek(highest_key)
          }else {
            if(cmps[i] == -1) {
              cursors[i].seek(highest_key)
            }else {
              if(!cursors[i].hasCursor()) {
                cursors[i].seek(highest_key)
              }else {
                if(highest_key != cursors[i].getPrimaryKey()) {
                  cursors[i].seek(highest_key)
                }
              }
            }
          }
        }
      }else {
        if(me.store_key != highest_key) {
          primary_cursor.seek(highest_key)
        }
        for(var i = 0;i < cursors.length;i++) {
          if(!cursors[i].hasCursor() || ydn.db.cmp(cursors[i].getPrimaryKey(), highest_key) !== 0) {
            cursors[i].seek(highest_key)
          }
        }
      }
    }
  };
  return primary_cursor
};
ydn.db.Iterator.prototype.iterate = function(executor) {
  if(this.filter_index_names_.length > 0) {
    return this.iterateWithFilters_(executor)
  }else {
    return this.iterate_(executor)
  }
};
ydn.db.Iterator.prototype.reset = function() {
  if(this.getState() == ydn.db.Iterator.State.WORKING) {
    throw new ydn.error.InvalidOperationError(ydn.db.Iterator.State.WORKING);
  }
  this.counter = 0;
  this.store_key = undefined;
  this.index_key = undefined;
  this.has_done = undefined
};
goog.provide("ydn.db.core.req.IRequestExecutor");
ydn.db.core.req.IRequestExecutor = function() {
};
ydn.db.core.req.IRequestExecutor.prototype.setTx = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.clearById = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.clearByStore = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.countStores = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.countKeyRange = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.getById = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.keysByStore = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.keysByKeyRange = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.keysByIndexKeyRange = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.keysByIndexKeys = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.listByIds = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.listByKeys = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.listByKeyRange = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.listByIndexKeyRange = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.listByStore = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.listByStores = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.putObject = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.putObjects = goog.abstractMethod;
ydn.db.core.req.IRequestExecutor.prototype.putByKeys = goog.abstractMethod;
goog.provide("ydn.db.InternalError");
goog.provide("ydn.db.InvalidKeyException");
goog.provide("ydn.db.InvalidStateError");
goog.provide("ydn.db.NotFoundError");
goog.provide("ydn.db.ScopeError");
goog.provide("ydn.db.SecurityError");
ydn.db.InvalidKeyException = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.db.InvalidKeyException)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "ydn.db.InvalidKeyException"
};
goog.inherits(ydn.db.InvalidKeyException, Error);
ydn.db.InternalError = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.db.InternalError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(ydn.db.InternalError, Error);
ydn.db.InternalError.prototype.name = "ydn.db.InternalError";
ydn.db.ScopeError = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.db.ScopeError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "ydn.db.ScopeError"
};
goog.inherits(ydn.db.ScopeError, Error);
ydn.db.InvalidStateError = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.db.InvalidStateError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "InvalidStateError"
};
goog.inherits(ydn.db.InvalidStateError, Error);
ydn.db.InvalidAccessError = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.db.InvalidAccessError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "InvalidAccessError"
};
goog.inherits(ydn.db.InvalidAccessError, Error);
ydn.db.NotFoundError = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.db.NotFoundError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "NotFoundError"
};
goog.inherits(ydn.db.NotFoundError, Error);
ydn.db.NotFoundError.prototype.name = "NotFoundError";
ydn.db.DataCloneError = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.db.DataCloneError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "DataCloneError"
};
goog.inherits(ydn.db.DataCloneError, Error);
ydn.db.SQLError = function(e, opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.db.SQLError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.message += " :" + e.message + " [" + e.code + "]";
  this.name = "SQLError"
};
goog.inherits(ydn.db.SQLError, Error);
ydn.db.SecurityError = function(e, opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.db.SecurityError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.message += " :" + e.message;
  this.name = "SecurityError"
};
goog.inherits(ydn.db.SecurityError, Error);
ydn.db.SqlParseError = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, ydn.db.SqlParseError)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
  this.name = "ydn.db.SqlParseError"
};
goog.inherits(ydn.db.SqlParseError, Error);
goog.provide("ydn.db.Key");
ydn.db.Key = function(store_or_json_or_value, id, opt_parent) {
  var store_name;
  if(goog.isObject(store_or_json_or_value)) {
    store_name = store_or_json_or_value["store"];
    id = store_or_json_or_value["id"];
    if(goog.isDefAndNotNull(store_or_json_or_value["parent"])) {
      opt_parent = new ydn.db.Key(store_or_json_or_value["parent"])
    }
  }else {
    goog.asserts.assertString(store_or_json_or_value);
    if(!goog.isDef(id)) {
      var idx = store_or_json_or_value.lastIndexOf(ydn.db.Key.SEP_PARENT);
      var store_and_id = store_or_json_or_value;
      if(idx > 0) {
        store_and_id = store_or_json_or_value.substr(idx);
        opt_parent = new ydn.db.Key(store_or_json_or_value.substring(0, idx))
      }
      var parts = store_and_id.split(ydn.db.Key.SEP_STORE);
      store_name = parts[0];
      id = parts[1];
      if(!goog.isDef(id)) {
        throw Error("Invalid key value: " + store_or_json_or_value);
      }
    }else {
      store_name = store_or_json_or_value
    }
  }
  this.store_name = store_name;
  this.id = id;
  this.parent = opt_parent || null
};
ydn.db.Key.Json;
ydn.db.Key.prototype.toJSON = function() {
  var obj = {"store":this.store_name, "id":this.id};
  if(this.parent) {
    obj["parent"] = this.parent.toJSON()
  }
  return obj
};
ydn.db.Key.SEP_PARENT = "^|";
ydn.db.Key.SEP_STORE = "^:";
ydn.db.Key.prototype.valueOf = function() {
  var parent_value = this.parent ? this.parent.valueOf() + ydn.db.Key.SEP_PARENT : "";
  return parent_value + this.store_name + ydn.db.Key.SEP_STORE + this.id
};
ydn.db.Key.prototype.toString = function() {
  return this.valueOf().replace("^|", "|").replace("^:", ":")
};
ydn.db.Key.prototype.getStoreName = function() {
  return this.store_name
};
ydn.db.Key.prototype.getId = function() {
  return this.id
};
ydn.db.Key.prototype.getNormalizedId = function() {
  if(goog.isArray(this.id)) {
    return this.id.join(ydn.db.Key.SEP_PARENT)
  }else {
    return this.id
  }
};
ydn.db.Key.prototype.getParent = function() {
  return this.parent
};
goog.provide("ydn.db.req.RequestExecutor");
goog.require("goog.async.Deferred");
goog.require("goog.debug.Logger");
goog.require("ydn.db.InternalError");
goog.require("ydn.db.Key");
ydn.db.req.RequestExecutor = function(dbname, schema) {
  this.dbname = dbname;
  this.schema = schema
};
ydn.db.req.RequestExecutor.prototype.logger = goog.debug.Logger.getLogger("ydn.db.req.RequestExecutor");
ydn.db.req.RequestExecutor.prototype.tx = null;
ydn.db.req.RequestExecutor.prototype.scope = "?";
ydn.db.req.RequestExecutor.prototype.setTx = function(tx, scope) {
  this.tx = tx;
  this.scope_ = scope
};
goog.provide("ydn.db.core.req.IndexedDb");
goog.require("goog.async.DeferredList");
goog.require("ydn.db.core.req.IRequestExecutor");
goog.require("ydn.db.req.RequestExecutor");
goog.require("ydn.error");
goog.require("ydn.json");
ydn.db.core.req.IndexedDb = function(dbname, schema) {
  goog.base(this, dbname, schema)
};
goog.inherits(ydn.db.core.req.IndexedDb, ydn.db.req.RequestExecutor);
ydn.db.core.req.IndexedDb.DEBUG = false;
ydn.db.core.req.IndexedDb.REQ_PER_TX = 10;
ydn.db.core.req.IndexedDb.prototype.logger = goog.debug.Logger.getLogger("ydn.db.core.req.IndexedDb");
ydn.db.core.req.IndexedDb.prototype.getTx = function() {
  return this.tx
};
ydn.db.core.req.IndexedDb.prototype.countStores = function(df, stores) {
  var me = this;
  var out = [];
  var count_store = function(i) {
    var table = stores[i];
    var store = me.tx.objectStore(table);
    var request = store.count();
    request.onsuccess = function(event) {
      if(ydn.db.core.req.IndexedDb.DEBUG) {
        window.console.log(event)
      }
      out[i] = event.target.result;
      i++;
      if(i == stores.length) {
        df.callback(out)
      }else {
        count_store(i)
      }
    };
    request.onerror = function(event) {
      if(ydn.db.core.req.IndexedDb.DEBUG) {
        window.console.log(event)
      }
      df.errback(event)
    }
  };
  if(stores.length == 0) {
    df.callback([])
  }else {
    count_store(0)
  }
};
ydn.db.core.req.IndexedDb.prototype.putByKeys = goog.abstractMethod;
ydn.db.core.req.IndexedDb.prototype.putObject = function(df, table, value, opt_key) {
  var store = this.tx.objectStore(table);
  var request;
  try {
    if(goog.isDef(opt_key)) {
      request = store.put(value, opt_key)
    }else {
      request = store.put(value)
    }
  }catch(e) {
    if(goog.DEBUG && e.name == "DataError") {
      var str = ydn.json.stringify(value);
      throw new ydn.db.InvalidKeyException(table + ": " + str.substring(0, 50));
    }else {
      throw e;
    }
  }
  request.onsuccess = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log([event, table, value])
    }
    df.callback(event.target.result)
  };
  request.onerror = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log([event, table, value])
    }
    df.errback(event)
  }
};
ydn.db.core.req.IndexedDb.prototype.putObjects = function(df, store_name, objs, opt_keys) {
  var results = [];
  var result_count = 0;
  var store = this.tx.objectStore(store_name);
  var put = function(i) {
    var request;
    try {
      if(goog.isDef(opt_keys)) {
        request = store.put(objs[i], opt_keys[i])
      }else {
        request = store.put(objs[i])
      }
    }catch(e) {
      if(goog.DEBUG && e.name == "DataError") {
        throw new ydn.db.InvalidKeyException('put to "' + store_name + '": ' + i + " of " + objs.length);
      }
      if(goog.DEBUG && e.name == "DataCloneError") {
        throw new ydn.db.DataCloneError('put to "' + store_name + '": ' + i + " of " + objs.length);
      }else {
        throw e;
      }
    }
    request.onsuccess = function(event) {
      result_count++;
      results[i] = event.target.result;
      if(result_count == objs.length) {
        df.callback(results)
      }else {
        var next = i + ydn.db.core.req.IndexedDb.REQ_PER_TX;
        if(next < objs.length) {
          put(next)
        }
      }
    };
    request.onerror = function(event) {
      result_count++;
      if(ydn.db.core.req.IndexedDb.DEBUG) {
        window.console.log([store_name, event])
      }
      df.errback(event)
    }
  };
  if(objs.length > 0) {
    for(var i = 0;i < ydn.db.core.req.IndexedDb.REQ_PER_TX && i < objs.length;i++) {
      put(i)
    }
  }else {
    df.callback([])
  }
};
ydn.db.core.req.IndexedDb.prototype.clearById = function(df, store_name, key) {
  var store = this.tx.objectStore(store_name);
  var request = store.openCursor(key);
  request.onsuccess = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log([store_name, key, event])
    }
    var cursor = event.target.result;
    if(cursor) {
      var req = cursor["delete"]();
      req.onsuccess = function(e) {
        df.callback(true)
      };
      req.onerror = function(e) {
        df.errback(event)
      }
    }else {
      df.callback(false)
    }
  };
  request.onerror = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log([store_name, key, event])
    }
    df.errback(event)
  }
};
ydn.db.core.req.IndexedDb.prototype.clearByStore = function(df, opt_store_name) {
  var store_names_to_clear = goog.isArray(opt_store_name) && opt_store_name.length > 0 ? opt_store_name : goog.isString(opt_store_name) ? [opt_store_name] : this.schema.getStoreNames();
  var n_todo = store_names_to_clear.length;
  var n_done = 0;
  for(var i = 0;i < n_todo;i++) {
    var store_name = store_names_to_clear[i];
    var store = this.tx.objectStore(store_name);
    var request = store.clear();
    request.onsuccess = function(event) {
      n_done++;
      if(ydn.db.core.req.IndexedDb.DEBUG) {
        window.console.log([n_done, event])
      }
      if(n_done == n_todo) {
        df.callback(true)
      }
    };
    request.onerror = function(event) {
      n_done++;
      if(ydn.db.core.req.IndexedDb.DEBUG) {
        window.console.log([n_done, event])
      }
      if(n_done == n_todo) {
        df.errback(event)
      }
    }
  }
};
ydn.db.core.req.IndexedDb.prototype.listByStore = function(df, store_name, reverse, limit, offset) {
  this.listByKeyRange(df, store_name, null, reverse, limit, offset)
};
ydn.db.core.req.IndexedDb.prototype.listByKeyRange_ = function(df, store_name, index, key_range, reverse, limit, offset, unique) {
  var results = [];
  var store = this.tx.objectStore(store_name);
  var dir = ydn.db.base.getDirection(reverse, unique);
  var request;
  if(index) {
    request = store.index(index).openCursor(key_range, dir)
  }else {
    request = store.openCursor(key_range, dir)
  }
  var cued = false;
  request.onsuccess = function(event) {
    var cursor = event.target.result;
    if(cursor) {
      if(!cued && offset > 0) {
        cued = true;
        cursor.advance(offset);
        return
      }
      results.push(cursor.value);
      if(results.length < limit) {
        cursor.advance(1)
      }else {
        df.callback(results)
      }
    }else {
      df.callback(results)
    }
  };
  request.onerror = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log([store_name, event])
    }
    df.errback(event)
  }
};
ydn.db.core.req.IndexedDb.prototype.listByKeyRange = function(df, store_name, key_range, reverse, limit, offset) {
  this.listByKeyRange_(df, store_name, null, key_range, reverse, limit, offset)
};
ydn.db.core.req.IndexedDb.prototype.listByIndexKeyRange = function(df, store_name, index, key_range, reverse, limit, offset, unique) {
  this.listByKeyRange_(df, store_name, index, key_range, reverse, limit, offset, unique)
};
ydn.db.core.req.IndexedDb.prototype.keysByKeyRange = function(df, store_name, key_range, reverse, limit, offset) {
  var results = [];
  var store = this.tx.objectStore(store_name);
  var dir = ydn.db.base.getDirection(reverse);
  var request = store.openCursor(key_range, dir);
  var cued = false;
  request.onsuccess = function(event) {
    var cursor = event.target.result;
    if(cursor) {
      if(!cued && offset > 0) {
        cued = true;
        cursor.advance(offset);
        return
      }
      results.push(cursor.key);
      if(results.length < limit) {
        cursor.advance(1)
      }else {
        df.callback(results)
      }
    }else {
      df.callback(results)
    }
  };
  request.onerror = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log([store_name, event])
    }
    df.errback(event)
  }
};
ydn.db.core.req.IndexedDb.prototype.keysByStore = function(df, store_name, reverse, limit, offset) {
  var results = [];
  var store = this.tx.objectStore(store_name);
  var dir = ydn.db.base.getDirection(reverse);
  var request = store.openCursor(null, dir);
  var cued = false;
  request.onsuccess = function(event) {
    var cursor = event.target.result;
    if(cursor) {
      if(!cued && offset > 0) {
        cued = true;
        cursor.advance(offset);
        return
      }
      results.push(cursor.primaryKey);
      if(results.length < limit) {
        cursor.advance(1)
      }else {
        df.callback(results)
      }
    }else {
      df.callback(results)
    }
  };
  request.onerror = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log([store_name, event])
    }
    df.errback(event)
  }
};
ydn.db.core.req.IndexedDb.prototype.keysByIndexKeyRange = function(df, store_name, index_name, key_range, reverse, limit, offset, unique) {
  var results = [];
  var store = this.tx.objectStore(store_name);
  var index = store.index(index_name);
  var dir = ydn.db.base.getDirection(reverse, unique);
  var request = index.openKeyCursor(key_range, dir);
  var cued = false;
  request.onsuccess = function(event) {
    var cursor = event.target.result;
    if(cursor) {
      if(!cued && offset > 0) {
        cued = true;
        cursor.advance(offset);
        return
      }
      results.push(cursor.primaryKey);
      if(results.length < limit) {
        cursor.advance(1)
      }
    }else {
      df.callback(results)
    }
  };
  request.onerror = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log([store_name, event])
    }
    df.errback(event)
  }
};
ydn.db.core.req.IndexedDb.prototype.keysByIndexKeys = goog.abstractMethod;
ydn.db.core.req.IndexedDb.prototype.listByStores = function(df, store_names) {
  var me = this;
  var results = [];
  var getAll = function(i) {
    var store_name = store_names[i];
    var store = me.tx.objectStore(store_name);
    var request = store.openCursor();
    request.onsuccess = function(event) {
      var cursor = event.target.result;
      if(cursor) {
        results.push(cursor["value"]);
        cursor["continue"]()
      }else {
        i++;
        if(i == store_names.length) {
          df.callback(results)
        }else {
          getAll(i)
        }
      }
    };
    request.onerror = function(event) {
      if(ydn.db.core.req.IndexedDb.DEBUG) {
        window.console.log([store_name, event])
      }
      df.errback(event)
    }
  };
  if(store_names.length > 0) {
    getAll(0)
  }else {
    df.callback([])
  }
};
ydn.db.core.req.IndexedDb.prototype.getById = function(df, store_name, id) {
  var me = this;
  var store;
  try {
    store = this.tx.objectStore(store_name)
  }catch(e) {
    if(e.name == "NotFoundError") {
      throw new ydn.db.NotFoundError(store_name + " not in Tx scope: " + this.scope);
    }else {
      throw e;
    }
  }
  var request = store.get(id);
  request.onsuccess = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log([store_name, id, event])
    }
    df.callback(event.target.result)
  };
  request.onerror = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log([store_name, id, event])
    }
    df.errback(event)
  }
};
ydn.db.core.req.IndexedDb.prototype.listByIds = function(df, store_name, ids) {
  var me = this;
  var results = [];
  var result_count = 0;
  var store = this.tx.objectStore(store_name);
  var n = ids.length;
  var get = function(i) {
    if(!goog.isDefAndNotNull(ids[i])) {
      result_count++;
      results[i] = undefined;
      if(result_count == n) {
        df.callback(results)
      }else {
        var next = i + ydn.db.core.req.IndexedDb.REQ_PER_TX;
        if(next < n) {
          get(next)
        }
      }
    }
    var request;
    try {
      request = store.get(ids[i])
    }catch(e) {
      if(e.name == "DataError") {
        if(ydn.db.core.req.IndexedDb.DEBUG) {
          window.console.log([store_name, i, ids[i], e])
        }
        throw new ydn.db.InvalidKeyException(ids[i]);
      }else {
        throw e;
      }
    }
    request.onsuccess = function(event) {
      result_count++;
      if(ydn.db.core.req.IndexedDb.DEBUG) {
        window.console.log([store_name, ids, i, event])
      }
      results[i] = event.target.result;
      if(result_count == n) {
        df.callback(results)
      }else {
        var next = i + ydn.db.core.req.IndexedDb.REQ_PER_TX;
        if(next < n) {
          get(next)
        }
      }
    };
    request.onerror = function(event) {
      result_count++;
      if(ydn.db.core.req.IndexedDb.DEBUG) {
        window.console.log([store_name, ids, i, event])
      }
      df.errback(event)
    }
  };
  if(n > 0) {
    for(var i = 0;i < ydn.db.core.req.IndexedDb.REQ_PER_TX && i < n;i++) {
      get(i)
    }
  }else {
    df.callback([])
  }
};
ydn.db.core.req.IndexedDb.prototype.listByKeys = function(df, keys) {
  var me = this;
  var results = [];
  var result_count = 0;
  var getKey = function(i) {
    var key = keys[i];
    var store = me.tx.objectStore(key.getStoreName());
    var request;
    try {
      request = store.get(key.getId())
    }catch(e) {
      if(e.name == "DataError") {
        throw new ydn.db.InvalidKeyException(key + " at " + i);
      }else {
        throw e;
      }
    }
    request.onsuccess = function(event) {
      result_count++;
      if(ydn.db.core.req.IndexedDb.DEBUG) {
        window.console.log(event)
      }
      results[i] = event.target.result;
      if(result_count == keys.length) {
        df.callback(results)
      }else {
        var next = i + ydn.db.core.req.IndexedDb.REQ_PER_TX;
        if(next < keys.length) {
          getKey(next)
        }
      }
    };
    request.onerror = function(event) {
      result_count++;
      if(ydn.db.core.req.IndexedDb.DEBUG) {
        window.console.log([keys, event])
      }
      df.errback(event)
    }
  };
  if(keys.length > 0) {
    for(var i = 0;i < ydn.db.core.req.IndexedDb.REQ_PER_TX && i < keys.length;i++) {
      getKey(i)
    }
  }else {
    df.callback([])
  }
};
ydn.db.core.req.IndexedDb.prototype.countKeyRange = function(df, table, keyRange, index_name) {
  var store = this.tx.objectStore(table);
  var request;
  if(goog.isDef(index_name)) {
    var index = store.index(index_name);
    if(goog.isNull(keyRange)) {
      request = index.count()
    }else {
      request = index.count(keyRange)
    }
  }else {
    if(goog.isNull(keyRange)) {
      request = store.count()
    }else {
      request = store.count(keyRange)
    }
  }
  request.onsuccess = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log(event)
    }
    df.callback(event.target.result)
  };
  request.onerror = function(event) {
    if(ydn.db.core.req.IndexedDb.DEBUG) {
      window.console.log(event)
    }
    df.errback(event)
  }
};
ydn.db.core.req.IndexedDb.prototype.getKeysByIndexKeyRange = function(df, store_name, key_range, key_range_index, offset, limit) {
  var store = this.tx.objectStore(store_name);
  var index = store.index(key_range_index);
  var req = index.openKeyCursor(key_range);
  var keys = [];
  var cue = false;
  req.onsuccess = function(event) {
    var cur = event.target.result;
    if(cur) {
      if(goog.isDef(offset) && !cue) {
        cue = true;
        cur.advance(offset)
      }
      keys.push(cur.primaryKey);
      if(goog.isDef(limit) && keys.length >= limit) {
        df.callback(keys)
      }else {
        cur.advance(1)
      }
    }else {
      df.callback(keys)
    }
  };
  req.onerror = function(ev) {
    df.errback(ev)
  }
};
ydn.db.core.req.IndexedDb.prototype.getIndexKeysByKeys = function(df, store_name, index_name, keys, offset, limit) {
  var store = this.tx.objectStore(store_name);
  var index = store.index(index_name);
  var results = [];
  var result_count = 0;
  limit = goog.isDef(limit) ? limit : keys.length;
  var getKey = function(i) {
    var key = keys[i];
    var req = index.get(key);
    req.onsuccess = function(event) {
      result_count++;
      var cur = event.target.result;
      if(cur) {
        results[i] = cur.key
      }else {
        results[i] = undefined
      }
      if(result_count === limit) {
        df.callback(results)
      }else {
        var next = i + ydn.db.core.req.IndexedDb.REQ_PER_TX;
        if(next < limit) {
          getKey(next)
        }
      }
    };
    req.onerror = function(ev) {
      df.errback(ev)
    }
  };
  if(keys.length > 0) {
    for(var i = 0;i < ydn.db.core.req.IndexedDb.REQ_PER_TX && i < keys.length;i++) {
      getKey(i)
    }
  }else {
    df.callback([])
  }
};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
    this.creationStack = (new Error).stack;
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.MonitoringMode = {OFF:0, PERMANENT:1, INTERACTIVE:2};
goog.Disposable.MONITORING_MODE = 0;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.onDisposeCallbacks_;
goog.Disposable.prototype.creationStack;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
      var uid = goog.getUid(this);
      if(goog.Disposable.MONITORING_MODE == goog.Disposable.MonitoringMode.PERMANENT && !goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.addOnDisposeCallback = function(callback, opt_scope) {
  if(!this.onDisposeCallbacks_) {
    this.onDisposeCallbacks_ = []
  }
  this.onDisposeCallbacks_.push(goog.bind(callback, opt_scope))
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
  if(this.onDisposeCallbacks_) {
    while(this.onDisposeCallbacks_.length) {
      this.onDisposeCallbacks_.shift()()
    }
  }
};
goog.Disposable.isDisposed = function(obj) {
  if(obj && typeof obj.isDisposed == "function") {
    return obj.isDisposed()
  }
  return false
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersion("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersion("1.9b") || goog.userAgent.IE && goog.userAgent.isVersion("8") || goog.userAgent.OPERA && 
goog.userAgent.isVersion("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersion("528"), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersion("8") || goog.userAgent.IE && !goog.userAgent.isVersion("9")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.events.Event.prototype.disposeInternal = function() {
};
goog.events.Event.prototype.dispose = function() {
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.defaultPrevented = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = true;
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAG:"drag", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", DRAGEND:"dragend", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", BEFOREUNLOAD:"beforeunload", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", 
POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend", MSGESTURECHANGE:"MsGestureChange", MSGESTUREEND:"MsGestureEnd", MSGESTUREHOLD:"MsGestureHold", MSGESTURESTART:"MsGestureStart", MSGESTURETAP:"MsGestureTap", MSINERTIASTART:"MsInertiaStart", 
MSPOINTERCANCEL:"MsPointerCancel", MSPOINTERDOWN:"MsPointerDown", MSPOINTERMOVE:"MsPointerDown", MSPOINTEROVER:"MsPointerOver", MSPOINTEROUT:"MsPointerOut", MSPOINTERUP:"MsPointerUp"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = goog.userAgent.WEBKIT || e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = goog.userAgent.WEBKIT || e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  if(e.defaultPrevented) {
    this.preventDefault()
  }
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
  if(goog.events.Listener.ENABLE_MONITORING) {
    this.creationStack = (new Error).stack
  }
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.ENABLE_MONITORING = false;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.creationStack;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(listenerArray) {
    listenerArray.needsCleanup_ = true;
    goog.events.cleanUp_(type, capture, srcUid, listenerArray)
  }
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return listener.handleEvent(eventObject)
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  retval = goog.events.fireListener(listener, be);
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"] || goog.global["self"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("ydn.db.core.req.SimpleStore");
goog.require("goog.Timer");
goog.require("goog.asserts");
goog.require("goog.async.Deferred");
goog.require("ydn.db.req.RequestExecutor");
goog.require("ydn.db.core.req.IRequestExecutor");
ydn.db.core.req.SimpleStore = function(dbname, schema) {
  goog.base(this, dbname, schema)
};
goog.inherits(ydn.db.core.req.SimpleStore, ydn.db.req.RequestExecutor);
ydn.db.core.req.SimpleStore.SYNC = true;
ydn.db.core.req.SimpleStore.DEBUG = false;
ydn.db.core.req.SimpleStore.succeed = function(value) {
  var df = new goog.async.Deferred;
  if(ydn.db.core.req.SimpleStore.SYNC) {
    df.callback(value)
  }else {
    goog.Timer.callOnce(function() {
      df.callback(value)
    }, 0)
  }
  return df
};
ydn.db.core.req.SimpleStore.prototype.getTx = function() {
  return this.tx
};
ydn.db.core.req.SimpleStore.prototype.keysByIndexKeyRange = goog.abstractMethod;
ydn.db.core.req.SimpleStore.prototype.keysByIndexKeys = goog.abstractMethod;
ydn.db.core.req.SimpleStore.prototype.keysByKeyRange = goog.abstractMethod;
ydn.db.core.req.SimpleStore.prototype.keysByIndexKeyRange = goog.abstractMethod;
ydn.db.core.req.SimpleStore.prototype.keysByIndexKeys = goog.abstractMethod;
ydn.db.core.req.SimpleStore.prototype.keysByStore = goog.abstractMethod;
ydn.db.core.req.SimpleStore.prototype.keysByStore = goog.abstractMethod;
ydn.db.core.req.SimpleStore.prototype.putByKeys = goog.abstractMethod;
ydn.db.core.req.SimpleStore.prototype.putObject = function(df, table, value, opt_key) {
  var key = this.getTx().setItemInternal(value, table, opt_key);
  df.callback(key)
};
ydn.db.core.req.SimpleStore.prototype.putObjects = function(df, table, value, opt_key) {
  var result = [];
  for(var i = 0;i < value.length;i++) {
    var key = goog.isDef(opt_key) ? opt_key[i] : undefined;
    result[i] = this.getTx().setItemInternal(value[i], table, key)
  }
  df.callback(result)
};
ydn.db.core.req.SimpleStore.prototype.getById = function(df, store_name, id) {
  df.callback(this.getTx().getItemInternal(store_name, id))
};
ydn.db.core.req.SimpleStore.prototype.listByStore = goog.abstractMethod;
ydn.db.core.req.SimpleStore.prototype.listByStores = function(df, store_names) {
  goog.Timer.callOnce(function() {
    var arr = [];
    for(var i = 0;i < store_names.length;i++) {
      arr = arr.concat(this.tx.getKeys(store_names[i]))
    }
    df.callback(arr)
  }, 0, this)
};
ydn.db.core.req.SimpleStore.prototype.listByIds = function(df, store_name, ids) {
  var arr = [];
  for(var i = 0;i < ids.length;i++) {
    var value = this.getTx().getItemInternal(store_name, ids[i]);
    arr.push(value)
  }
  df.callback(arr)
};
ydn.db.core.req.SimpleStore.prototype.listByKeyRange = goog.abstractMethod;
ydn.db.core.req.SimpleStore.prototype.listByKeys = function(df, keys) {
  var arr = [];
  for(var i = 0;i < keys.length;i++) {
    var value = this.getTx().getItemInternal(keys[i].getStoreName(), keys[i].getId());
    arr.push(value)
  }
  df.callback(arr)
};
ydn.db.core.req.SimpleStore.prototype.listByIndexKeyRange = function(df, store_name, index, key_range, reverse, limit, offset) {
};
ydn.db.core.req.SimpleStore.prototype.clearById = function(df, table, id) {
  this.getTx().removeItemInternal(table, id);
  df.callback(true)
};
ydn.db.core.req.SimpleStore.prototype.clearByStore = function(df, stores) {
  var store_names = goog.isString(stores) ? [stores] : stores;
  for(var i = 0;i < store_names.length;i++) {
    this.tx.removeItemInternal(store_names[i])
  }
  df.callback(true)
};
ydn.db.core.req.SimpleStore.prototype.countStores = function(df, store_names) {
  goog.Timer.callOnce(function() {
    var out = [];
    for(var i = 0;i < store_names.length;i++) {
      var arr = this.tx.getKeys(store_names[i]);
      out[i] = arr.length
    }
    df.callback(out)
  }, 0, this)
};
ydn.db.core.req.SimpleStore.prototype.countKeyRange = function(df, opt_table, keyRange, index_name) {
  var pre_fix = "_database_" + this.dbname;
  if(goog.isDef(opt_table)) {
    pre_fix += "-" + opt_table
  }
  var n = 0;
  for(var key in this.tx) {
    if(this.tx.hasOwnProperty(key)) {
      if(goog.string.startsWith(key, pre_fix)) {
        n++
      }
    }
  }
  df.callback(n)
};
goog.provide("ydn.db.core.req.WebSql");
goog.require("goog.async.Deferred");
goog.require("goog.debug.Logger");
goog.require("goog.events");
goog.require("ydn.async");
goog.require("ydn.db.req.RequestExecutor");
goog.require("ydn.json");
goog.require("ydn.db.Where");
goog.require("ydn.db.core.req.IRequestExecutor");
ydn.db.core.req.WebSql = function(dbname, schema) {
  goog.base(this, dbname, schema)
};
goog.inherits(ydn.db.core.req.WebSql, ydn.db.req.RequestExecutor);
ydn.db.core.req.WebSql.DEBUG = false;
ydn.db.core.req.WebSql.REQ_PER_TX = 10;
ydn.db.core.req.WebSql.RW_REQ_PER_TX = 2;
ydn.db.core.req.WebSql.prototype.logger = goog.debug.Logger.getLogger("ydn.db.core.req.WebSql");
ydn.db.core.req.WebSql.parseRow = function(row, store) {
  var value = ydn.json.parse(row[ydn.db.base.DEFAULT_BLOB_COLUMN]);
  if(goog.isDefAndNotNull(store.keyPath)) {
    var key = ydn.db.schema.Index.sql2js(row[store.keyPath], store.type);
    store.setKeyValue(value, key)
  }
  for(var j = 0;j < store.indexes.length;j++) {
    var index = store.indexes[j];
    if(index.name == ydn.db.base.DEFAULT_BLOB_COLUMN) {
      continue
    }
    var x = row[index.name];
    value[index.name] = ydn.db.schema.Index.sql2js(x, index.type)
  }
  return value
};
ydn.db.core.req.WebSql.prototype.getTx = function() {
  return this.tx
};
ydn.db.core.req.WebSql.prototype.getKeyFromRow = function(table, row) {
  return row[table.keyPath || ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME]
};
ydn.db.core.req.WebSql.prototype.keysByIndexKeys = goog.abstractMethod;
ydn.db.core.req.WebSql.prototype.keysByKeyRange = function(df, store_name, key_range, reverse, limit, offset) {
  this.list_by_key_range_(df, true, store_name, undefined, key_range, reverse, limit, offset)
};
ydn.db.core.req.WebSql.prototype.keysByIndexKeyRange = function(df, store_name, index_name, key_range, reverse, limit, offset, unique) {
  this.list_by_key_range_(df, true, store_name, index_name, key_range, reverse, limit, offset)
};
ydn.db.core.req.WebSql.prototype.keysByIndexKeys = goog.abstractMethod;
ydn.db.core.req.WebSql.prototype.list_by_key_range_ = function(df, key_only, store_name, column, key_range, reverse, limit, offset) {
  var me = this;
  var arr = [];
  var store = this.schema.getStore(store_name);
  column = goog.isDef(column) ? column : store.getColumnName();
  var qcolumn = goog.string.quote(column);
  var key_column = store.getColumnName();
  var fields = key_only ? goog.string.quote(key_column) : "*";
  var sql = "SELECT " + fields + " FROM " + store.getQuotedName();
  var params = [];
  if(!goog.isNull(key_range)) {
    var where_clause = ydn.db.Where.toWhereClause(column, key_range);
    sql += " WHERE " + where_clause.sql;
    for(var i = 0;i < where_clause.params.length;i++) {
      params[i] = ydn.db.schema.Index.js2sql(where_clause.params[i], store.getType())
    }
  }
  var order = reverse ? "DESC" : "ASC";
  sql += " ORDER BY " + qcolumn + " " + order;
  if(goog.isNumber(limit)) {
    sql += " LIMIT " + limit
  }
  if(goog.isNumber(offset)) {
    sql += " OFFSET " + offset
  }
  var callback = function(transaction, results) {
    for(var i = 0, n = results.rows.length;i < n;i++) {
      var row = results.rows.item(i);
      if(key_only) {
        arr[i] = ydn.db.schema.Index.sql2js(row[key_column], store.getType())
      }else {
        if(goog.isDefAndNotNull(row)) {
          arr[i] = ydn.db.core.req.WebSql.parseRow(row, store)
        }
      }
    }
    df.callback(arr)
  };
  var error_callback = function(tr, error) {
    if(ydn.db.core.req.WebSql.DEBUG) {
      window.console.log([tr, error])
    }
    me.logger.warning("get error: " + error.message);
    df.errback(error);
    return true
  };
  this.tx.executeSql(sql, params, callback, error_callback)
};
ydn.db.core.req.WebSql.prototype.keysByStore = function(df, store_name, reverse, limit, offset) {
  this.list_by_key_range_(df, true, store_name, undefined, null, reverse, limit, offset)
};
ydn.db.core.req.WebSql.prototype.putByKeys = goog.abstractMethod;
ydn.db.core.req.WebSql.prototype.putObject = function(df, store_name, obj, opt_key) {
  var table = this.schema.getStore(store_name);
  if(!table) {
    throw new ydn.db.NotFoundError(store_name);
  }
  var me = this;
  var out = table.getIndexedValues(obj, opt_key);
  var sql = "INSERT OR REPLACE INTO " + table.getQuotedName() + " (" + out.columns.join(", ") + ") " + "VALUES (" + out.slots.join(", ") + ");";
  var success_callback = function(transaction, results) {
    if(ydn.db.core.req.WebSql.DEBUG) {
      window.console.log(["success", sql, out, transaction, results])
    }
    var key = goog.isDef(out.key) ? out.key : results.insertId;
    df.callback(key)
  };
  var error_callback = function(tr, error) {
    if(ydn.db.core.req.WebSql.DEBUG) {
      window.console.log([sql, out, tr, error])
    }
    me.logger.warning("put error: " + error.message);
    df.errback(error);
    return true
  };
  this.tx.executeSql(sql, out.values, success_callback, error_callback)
};
ydn.db.core.req.WebSql.prototype.putObjects = function(df, store_name, objects, opt_keys) {
  var table = this.schema.getStore(store_name);
  if(!table) {
    throw new ydn.db.NotFoundError(store_name);
  }
  var me = this;
  var result_keys = [];
  var result_count = 0;
  var put = function(i, tx) {
    var out;
    if(goog.isDef(opt_keys)) {
      out = table.getIndexedValues(objects[i], opt_keys[i])
    }else {
      out = table.getIndexedValues(objects[i])
    }
    var sql = "INSERT OR REPLACE INTO " + table.getQuotedName() + " (" + out.columns.join(", ") + ") " + "VALUES (" + out.slots.join(", ") + ");";
    var success_callback = function(transaction, results) {
      result_count++;
      result_keys[i] = goog.isDef(out.key) ? out.key : results.insertId;
      if(result_count == objects.length) {
        df.callback(result_keys)
      }else {
        var next = i + ydn.db.core.req.WebSql.RW_REQ_PER_TX;
        if(next < objects.length) {
          put(next, transaction)
        }
      }
    };
    var error_callback = function(tr, error) {
      if(ydn.db.core.req.WebSql.DEBUG) {
        window.console.log([sql, out, tr, error])
      }
      df.errback(error);
      return true
    };
    tx.executeSql(sql, out.values, success_callback, error_callback)
  };
  if(objects.length > 0) {
    for(var i = 0;i < ydn.db.core.req.WebSql.RW_REQ_PER_TX && i < objects.length;i++) {
      put(i, this.getTx())
    }
  }else {
    df.callback([])
  }
};
ydn.db.core.req.WebSql.prototype.getById = function(d, table_name, id) {
  var table = this.schema.getStore(table_name);
  goog.asserts.assertInstanceof(table, ydn.db.schema.Store, table_name + " not found.");
  var me = this;
  var column_name = table.getSQLKeyColumnName();
  var params = [ydn.db.schema.Index.js2sql(id, table.type)];
  var sql = "SELECT * FROM " + table.getQuotedName() + " WHERE " + column_name + " = ?";
  var callback = function(transaction, results) {
    if(results.rows.length > 0) {
      var row = results.rows.item(0);
      if(goog.isDefAndNotNull(row)) {
        d.callback(ydn.db.core.req.WebSql.parseRow(row, table))
      }else {
        d.callback(undefined)
      }
    }else {
      d.callback(undefined)
    }
  };
  var error_callback = function(tr, error) {
    if(ydn.db.core.req.WebSql.DEBUG) {
      window.console.log([tr, error])
    }
    me.logger.warning("get error: " + error.message);
    d.errback(error);
    return true
  };
  this.tx.executeSql(sql, params, callback, error_callback)
};
ydn.db.core.req.WebSql.prototype.listByIds = function(df, table_name, ids) {
  var me = this;
  var objects = [];
  var result_count = 0;
  var table = this.schema.getStore(table_name);
  goog.asserts.assertInstanceof(table, ydn.db.schema.Store, table_name + " not found.");
  var get = function(i, tx) {
    var callback = function(transaction, results) {
      result_count++;
      if(results.rows.length > 0) {
        var row = results.rows.item(0);
        if(goog.isDefAndNotNull(row)) {
          objects[i] = ydn.db.core.req.WebSql.parseRow(row, table)
        }
      }else {
        objects[i] = undefined
      }
      if(result_count == ids.length) {
        df.callback(objects)
      }else {
        var next = i + ydn.db.core.req.WebSql.REQ_PER_TX;
        if(next < ids.length) {
          get(next, transaction)
        }
      }
    };
    var error_callback = function(tr, error) {
      if(ydn.db.core.req.WebSql.DEBUG) {
        window.console.log([tr, error])
      }
      me.logger.warning("get error: " + error.message);
      df.errback(error);
      return true
    };
    var id = ids[i];
    var column_name = table.getSQLKeyColumnName();
    var params = [ydn.db.schema.Index.js2sql(id, table.type)];
    var sql = "SELECT * FROM " + table.getQuotedName() + " WHERE " + column_name + " = ?";
    tx.executeSql(sql, params, callback, error_callback)
  };
  if(ids.length > 0) {
    for(var i = 0;i < ydn.db.core.req.WebSql.REQ_PER_TX && i < ids.length;i++) {
      get(i, this.getTx())
    }
  }else {
    df.callback([])
  }
};
ydn.db.core.req.WebSql.prototype.listByKeyRange = function(df, store_name, key_range, reverse, limit, offset) {
  this.list_by_key_range_(df, false, store_name, undefined, key_range, reverse, limit, offset)
};
ydn.db.core.req.WebSql.prototype.listByIndexKeyRange = function(df, store_name, index, key_range, reverse, limit, offset) {
};
ydn.db.core.req.WebSql.prototype.listByStore = function(df, store_name, reverse, limit, offset) {
  this.list_by_key_range_(df, false, store_name, undefined, null, reverse, limit, offset)
};
ydn.db.core.req.WebSql.prototype.listByStores = function(df, table_names) {
  var me = this;
  var arr = [];
  var n_todo = table_names.length;
  var getAll = function(idx, tx) {
    var table_name = table_names[idx];
    var table = me.schema.getStore(table_name);
    goog.asserts.assertInstanceof(table, ydn.db.schema.Store, table_name + " not found.");
    var sql = "SELECT * FROM " + table.getQuotedName();
    var callback = function(transaction, results) {
      for(var i = 0, n = results.rows.length;i < n;i++) {
        var row = results.rows.item(i);
        if(goog.isDefAndNotNull(row)) {
          arr.push(ydn.db.core.req.WebSql.parseRow(row, table))
        }
      }
      if(idx == n_todo - 1) {
        df.callback(arr)
      }else {
        getAll(idx + 1, transaction)
      }
    };
    var error_callback = function(tr, error) {
      if(ydn.db.core.req.WebSql.DEBUG) {
        window.console.log([tr, error])
      }
      me.logger.warning("get error: " + error.message);
      df.errback(error);
      return true
    };
    tx.executeSql(sql, [], callback, error_callback)
  };
  if(n_todo == 0) {
    df.callback([])
  }else {
    getAll(0, this.getTx())
  }
};
ydn.db.core.req.WebSql.prototype.listByKeys = function(df, keys) {
  var me = this;
  var objects = [];
  var result_count = 0;
  var get = function(i, tx) {
    var key = keys[i];
    var table_name = key.getStoreName();
    var table = me.schema.getStore(table_name);
    goog.asserts.assertInstanceof(table, ydn.db.schema.Store, table_name + " not found.");
    var callback = function(transaction, results) {
      result_count++;
      if(results.rows.length > 0) {
        var row = results.rows.item(0);
        if(goog.isDefAndNotNull(row)) {
          objects[i] = ydn.db.core.req.WebSql.parseRow(row, table)
        }
      }else {
        objects[i] = undefined
      }
      if(result_count == keys.length) {
        df.callback(objects)
      }else {
        var next = i + ydn.db.core.req.WebSql.REQ_PER_TX;
        if(next < keys.length) {
          get(next, transaction)
        }
      }
    };
    var error_callback = function(tr, error) {
      if(ydn.db.core.req.WebSql.DEBUG) {
        window.console.log([tr, error])
      }
      me.logger.warning("get error: " + error.message);
      df.errback(error);
      return true
    };
    var id = key.getNormalizedId();
    var column_name = table.getSQLKeyColumnName();
    var params = [id];
    var sql = "SELECT * FROM " + table.getQuotedName() + " WHERE " + table.getQuotedKeyPath() + " = ?";
    tx.executeSql(sql, params, callback, error_callback)
  };
  if(keys.length > 0) {
    for(var i = 0;i < ydn.db.core.req.WebSql.REQ_PER_TX && i < keys.length;i++) {
      get(i, this.getTx())
    }
  }else {
    df.callback([])
  }
};
ydn.db.core.req.WebSql.prototype.clearByStore = function(d, table_name) {
  var me = this;
  var store_names = goog.isArray(table_name) && table_name.length > 0 ? table_name : goog.isString(table_name) ? [table_name] : this.schema.getStoreNames();
  var deleteStore = function(i, tx) {
    var store = me.schema.getStore(store_names[i]);
    if(!store) {
      throw new ydn.db.NotFoundError(store_names[i]);
    }
    var sql = "DELETE FROM  " + store.getQuotedName();
    var callback = function(transaction, results) {
      if(i == store_names.length - 1) {
        d.callback(true)
      }else {
        deleteStore(i + 1, transaction)
      }
    };
    var error_callback = function(tr, error) {
      if(ydn.db.core.req.WebSql.DEBUG) {
        window.console.log([tr, error])
      }
      me.logger.warning("Sqlite error: " + error.message);
      d.errback(error);
      return true
    };
    tx.executeSql(sql, [], callback, error_callback);
    return d
  };
  if(store_names.length > 0) {
    deleteStore(0, this.tx)
  }else {
    d.callback([])
  }
};
ydn.db.core.req.WebSql.prototype.removeById = function(d, table_name, key) {
  var me = this;
  var store = this.schema.getStore(table_name);
  var key_column = store.getSQLKeyColumnName();
  var sql = "DELETE FROM  " + store.getQuotedName() + " WHERE " + key_column + " = ?";
  var callback = function(transaction, results) {
    d.callback(true)
  };
  var error_callback = function(tr, error) {
    if(ydn.db.core.req.WebSql.DEBUG) {
      window.console.log([tr, error])
    }
    me.logger.warning("Sqlite error: " + error.message);
    d.errback(error);
    return true
  };
  this.tx.executeSql(sql, [key], callback, error_callback)
};
ydn.db.core.req.WebSql.prototype.clearById = function(d, table, id) {
  var store = this.schema.getStore(table);
  if(!store) {
    throw new ydn.db.NotFoundError(table);
  }
  var me = this;
  var success_callback = function(transaction, results) {
    if(ydn.db.core.req.WebSql.DEBUG) {
      window.console.log(results)
    }
    d.callback(true)
  };
  var error_callback = function(tr, error) {
    if(ydn.db.core.req.WebSql.DEBUG) {
      window.console.log([tr, error])
    }
    me.logger.warning("put error: " + error.message);
    d.errback(error);
    return true
  };
  var sql = "DELETE FROM " + store.getQuotedName() + " WHERE " + store.getQuotedKeyPath() + " = ?";
  this.tx.executeSql(sql, [id], success_callback, error_callback)
};
ydn.db.core.req.WebSql.prototype.countStores = function(d, tables) {
  var me = this;
  var out = [];
  var count = function(i) {
    var table = tables[i];
    var sql = "SELECT COUNT(*) FROM " + goog.string.quote(table);
    var callback = function(transaction, results) {
      var row = results.rows.item(0);
      out[i] = parseInt(row["COUNT(*)"], 10);
      i++;
      if(i == tables.length) {
        d.callback(out)
      }else {
        count(i)
      }
    };
    var error_callback = function(tr, error) {
      if(ydn.db.core.req.WebSql.DEBUG) {
        window.console.log([tr, error])
      }
      me.logger.warning("count error: " + error.message);
      d.errback(error);
      return true
    };
    me.tx.executeSql(sql, [], callback, error_callback)
  };
  if(tables.length == 0) {
    d.callback(0)
  }else {
    count(0)
  }
  return d
};
ydn.db.core.req.WebSql.prototype.countKeyRange = function(d, table, keyRange, index_name) {
  var me = this;
  var sql = "SELECT COUNT(*) FROM " + goog.string.quote(table);
  var callback = function(transaction, results) {
    var row = results.rows.item(0);
    d.callback(row["COUNT(*)"])
  };
  var error_callback = function(tr, error) {
    if(ydn.db.core.req.WebSql.DEBUG) {
      window.console.log([tr, error])
    }
    me.logger.warning("count error: " + error.message);
    d.errback(error);
    return true
  };
  this.tx.executeSql(sql, [], callback, error_callback);
  return d
};
ydn.db.core.req.WebSql.prototype.removeByStore = function(d, opt_table) {
  var me = this;
  var sql = "";
  if(goog.isDef(opt_table)) {
    var store = this.schema.getStore(opt_table);
    if(!store) {
      throw Error("Table " + opt_table + " not found.");
    }
    sql = sql + "DROP TABLE " + store.getQuotedName() + ";"
  }else {
    for(var i = 0;i < me.schema.stores.length;i++) {
      sql = sql + "DROP TABLE " + me.schema.stores[i].getQuotedName() + ";"
    }
  }
  var callback = function(transaction, results) {
    d.callback(true)
  };
  var error_callback = function(tr, error) {
    if(ydn.db.core.req.WebSql.DEBUG) {
      window.console.log([tr, error])
    }
    me.logger.warning("Delete TABLE: " + error.message);
    d.errback(error);
    return true
  };
  this.tx.executeSql(sql, [], callback, error_callback)
};
ydn.db.core.req.WebSql.prototype.toString = function() {
  return"WebSqlEx:" + (this.dbname || "")
};
goog.provide("ydn.db.con.IStorage");
goog.require("goog.async.Deferred");
ydn.db.con.IStorage = function() {
};
ydn.db.con.IStorage.prototype.close = goog.abstractMethod;
ydn.db.con.IStorage.prototype.type = goog.abstractMethod;
ydn.db.con.IStorage.prototype.transaction = goog.abstractMethod;
/*
 _try.
*/
goog.provide("ydn.db.tr.TxStorage");
goog.require("ydn.db.con.IStorage");
goog.require("ydn.error.NotSupportedException");
ydn.db.tr.TxStorage = function(storage, ptx_no, scope_name) {
  this.storage_ = storage;
  this.q_no_ = ptx_no;
  this.trQueue_ = [];
  this.mu_tx_ = new ydn.db.tr.Mutex(ptx_no);
  this.scope = scope_name
};
ydn.db.tr.TxStorage.DEBUG = false;
ydn.db.tr.TxStorage.prototype.logger = goog.debug.Logger.getLogger("ydn.db.tr.TxStorage");
ydn.db.tr.TxStorage.prototype.close = function() {
  return this.storage_.close()
};
ydn.db.tr.TxStorage.prototype.addStoreSchema = function(store) {
  return this.storage_.addStoreSchema(store)
};
ydn.db.tr.TxStorage.prototype.transaction = function(trFn, store_names, opt_mode, completed_event_handler) {
  this.storage_.transaction(trFn, store_names, opt_mode, completed_event_handler)
};
ydn.db.tr.TxStorage.prototype.getScope = function() {
  return this.scope
};
ydn.db.tr.TxStorage.prototype.mu_tx_ = null;
ydn.db.tr.TxStorage.prototype.getMuTx = function() {
  return this.mu_tx_
};
ydn.db.tr.TxStorage.prototype.getTxNo = function() {
  return this.mu_tx_.getTxCount()
};
ydn.db.tr.TxStorage.prototype.getQueueNo = function() {
  return this.q_no_
};
ydn.db.tr.TxStorage.prototype.getActiveTx = function() {
  return this.mu_tx_.isActiveAndAvailable() ? this.mu_tx_ : null
};
ydn.db.tr.TxStorage.prototype.isActive = function() {
  return this.mu_tx_.isActiveAndAvailable()
};
ydn.db.tr.TxStorage.prototype.getStorage = function() {
  return this.storage_
};
ydn.db.tr.TxStorage.prototype.getTx = function() {
  return this.mu_tx_.isActiveAndAvailable() ? this.mu_tx_.getTx() : null
};
ydn.db.tr.TxStorage.prototype.lock = function() {
  this.mu_tx_.lock()
};
ydn.db.tr.TxStorage.prototype.type = function() {
  return this.storage_.type()
};
ydn.db.tr.TxStorage.prototype.last_queue_checkin_ = NaN;
ydn.db.tr.TxStorage.MAX_QUEUE = 1E3;
ydn.db.tr.TxStorage.prototype.popTxQueue_ = function() {
  var task = this.trQueue_.shift();
  if(task) {
    this.run(task.fnc, task.store_names, task.mode, task.oncompleted)
  }
  this.last_queue_checkin_ = goog.now()
};
ydn.db.tr.TxStorage.prototype.pushTxQueue = function(trFn, store_names, opt_mode, completed_event_handler) {
  this.trQueue_.push({fnc:trFn, store_names:store_names, mode:opt_mode, oncompleted:completed_event_handler})
};
ydn.db.tr.TxStorage.prototype.run = function(trFn, store_names, opt_mode, oncompleted, opt_args) {
  var scope_name = trFn.name || "";
  var names = store_names;
  if(goog.isString(store_names)) {
    names = [store_names]
  }else {
    if(!goog.isArray(store_names) || store_names.length > 0 && !goog.isString(store_names[0])) {
      throw new ydn.error.ArgumentException("storeNames");
    }
  }
  var mode = goog.isDef(opt_mode) ? opt_mode : ydn.db.base.TransactionMode.READ_ONLY;
  var outFn = trFn;
  if(arguments.length > 4) {
    var args = Array.prototype.slice.call(arguments, 4);
    outFn = function() {
      var newArgs = Array.prototype.slice.call(arguments);
      newArgs = newArgs.concat(args);
      return trFn.apply(this, newArgs)
    };
    outFn.name = scope_name
  }
  var me = this;
  if(this.mu_tx_.isActive()) {
    this.pushTxQueue(arguments.length > 4 ? outFn : trFn, store_names, mode, oncompleted)
  }else {
    var transaction_process = function(tx) {
      me.running_transaction_process_ = true;
      me.mu_tx_.up(tx, scope_name);
      outFn(me);
      me.mu_tx_.out()
    };
    var completed_handler = function(type, event) {
      try {
        if(goog.isFunction(oncompleted)) {
          oncompleted(type, event)
        }
      }catch(e) {
        if(goog.DEBUG) {
          throw e;
        }
      }finally {
        me.mu_tx_.down(type, event);
        me.running_transaction_process_ = false;
        me.popTxQueue_()
      }
    };
    if(ydn.db.tr.TxStorage.DEBUG) {
      window.console.log(this + " transaction " + mode + " open for " + JSON.stringify(names) + " in " + scope_name)
    }
    this.storage_.transaction(transaction_process, names, mode, completed_handler)
  }
};
ydn.db.tr.TxStorage.prototype.toString = function() {
  var s = "ydn.db.tr.TxStorage:" + this.storage_.getName();
  if(goog.DEBUG) {
    var scope = this.mu_tx_.getScope();
    scope = scope ? " [" + scope + "]" : "";
    return s + ":" + this.q_no_ + ":" + this.getTxNo() + scope
  }
  return s
};
goog.provide("ydn.db.core.IStorage");
goog.require("ydn.db.req.RequestExecutor");
goog.require("ydn.db.KeyRange");
ydn.db.core.IStorage = function() {
};
ydn.db.core.IStorage.prototype.count = goog.abstractMethod;
ydn.db.core.IStorage.prototype.get = goog.abstractMethod;
ydn.db.core.IStorage.prototype.list = goog.abstractMethod;
ydn.db.core.IStorage.prototype.keys = goog.abstractMethod;
ydn.db.core.IStorage.prototype.put = goog.abstractMethod;
ydn.db.core.IStorage.prototype.clear = goog.abstractMethod;
goog.provide("ydn.db.core.TxStorage");
goog.require("ydn.db.core.req.IndexedDb");
goog.require("ydn.db.core.req.SimpleStore");
goog.require("ydn.db.core.req.WebSql");
goog.require("ydn.db.tr.TxStorage");
goog.require("ydn.db.core.IStorage");
goog.require("ydn.error.NotSupportedException");
ydn.db.core.TxStorage = function(storage, ptx_no, scope_name, schema) {
  goog.base(this, storage, ptx_no, scope_name);
  this.schema = schema
};
goog.inherits(ydn.db.core.TxStorage, ydn.db.tr.TxStorage);
ydn.db.core.TxStorage.prototype.getStorage = function() {
  return goog.base(this, "getStorage")
};
ydn.db.core.TxStorage.prototype.getName = function() {
  this.db_name = this.db_name || this.getStorage().getName();
  return this.db_name
};
ydn.db.core.TxStorage.prototype.executor = null;
ydn.db.core.TxStorage.prototype.getExecutor = function() {
  if(this.executor) {
    return this.executor
  }else {
    var type = this.type();
    if(type == ydn.db.con.IndexedDb.TYPE) {
      this.executor = new ydn.db.core.req.IndexedDb(this.getName(), this.schema)
    }else {
      if(type == ydn.db.con.WebSql.TYPE) {
        this.executor = new ydn.db.core.req.WebSql(this.db_name, this.schema)
      }else {
        if(type == ydn.db.con.SimpleStorage.TYPE || type == ydn.db.con.LocalStorage.TYPE || type == ydn.db.con.SessionStorage.TYPE) {
          this.executor = new ydn.db.core.req.SimpleStore(this.db_name, this.schema)
        }else {
          throw new ydn.db.InternalError("No executor for " + type);
        }
      }
    }
    return this.executor
  }
};
ydn.db.core.TxStorage.prototype.exec = function(callback, store_names, mode, scope) {
  var me = this;
  var mu_tx = this.getMuTx();
  if(mu_tx.isActiveAndAvailable()) {
    me.getExecutor().setTx(mu_tx.getTx(), scope);
    callback(me.getExecutor())
  }else {
    var on_complete = function() {
    };
    var tx_callback = function(idb) {
      me.not_ready_ = true;
      if(!mu_tx.isActive()) {
        throw new ydn.db.InternalError("Tx not active for scope: " + scope);
      }
      if(!mu_tx.isAvailable()) {
        throw new ydn.db.InternalError("Tx not available for scope: " + scope);
      }
      me.getExecutor().setTx(mu_tx.getTx(), scope);
      callback(me.getExecutor());
      mu_tx.lock()
    };
    tx_callback.name = scope;
    me.run(tx_callback, store_names, mode, on_complete)
  }
};
ydn.db.core.TxStorage.prototype.count = function(store_name, index_or_keyrange, index_key_range) {
  var df = ydn.db.base.createDeferred();
  var store_names;
  var index_name;
  var key_range;
  if(!goog.isDef(store_name)) {
    if(goog.isDef(index_key_range) || goog.isDef(index_or_keyrange)) {
      throw new ydn.error.ArgumentException("too many arguments.");
    }
    store_names = this.schema.getStoreNames();
    var dfl = new goog.async.Deferred;
    this.exec(function(executor) {
      executor.countStores(df, store_names)
    }, store_names, ydn.db.base.TransactionMode.READ_ONLY, "countStores");
    df.addCallbacks(function(count) {
      var total = count.reduce(function(p, x) {
        return x + p
      }, 0);
      dfl.callback(total)
    }, function(e) {
      dfl.errback(e)
    });
    return dfl
  }else {
    if(goog.isArray(store_name)) {
      if(goog.isDef(index_key_range) || goog.isDef(index_or_keyrange)) {
        throw new ydn.error.ArgumentException("too many arguments.");
      }
      store_names = store_name;
      for(var i = 0;i < store_names.length;i++) {
        if(!this.schema.hasStore(store_names[i])) {
          throw new ydn.db.NotFoundError(store_names[i]);
        }
      }
      this.exec(function(executor) {
        executor.countStores(df, store_names)
      }, store_names, ydn.db.base.TransactionMode.READ_ONLY, "countStores")
    }else {
      if(goog.isString(store_name)) {
        if(!this.schema.hasStore(store_name)) {
          throw new ydn.db.NotFoundError(store_name);
        }
        store_names = [store_name];
        if(goog.isString(index_or_keyrange)) {
          index_name = index_or_keyrange;
          key_range = ydn.db.KeyRange.parseIDBKeyRange(index_key_range)
        }else {
          if(goog.isObject(index_or_keyrange) || !goog.isDef(index_or_keyrange)) {
            if(goog.isDef(index_key_range)) {
              throw new ydn.error.ArgumentException;
            }
            key_range = ydn.db.KeyRange.parseIDBKeyRange(index_or_keyrange)
          }else {
            throw new ydn.error.ArgumentException("key range");
          }
        }
        this.exec(function(executor) {
          executor.countKeyRange(df, store_names[0], key_range, index_name)
        }, store_names, ydn.db.base.TransactionMode.READ_ONLY, "countKeyRange")
      }else {
        throw new ydn.error.ArgumentException;
      }
    }
  }
  return df
};
ydn.db.core.TxStorage.prototype.get = function(arg1, arg2) {
  var df = ydn.db.base.createDeferred();
  if(arg1 instanceof ydn.db.Key) {
    var k = arg1;
    var k_store_name = k.getStoreName();
    if(!this.schema.hasStore(k_store_name)) {
      if(this.schema.isAutoSchema()) {
        return goog.async.Deferred.succeed(undefined)
      }else {
        throw new ydn.error.ArgumentException("Store: " + k_store_name + " not found.");
      }
    }
    var kid = k.getId();
    this.exec(function(executor) {
      executor.getById(df, k_store_name, kid)
    }, [k_store_name], ydn.db.base.TransactionMode.READ_ONLY, "getById")
  }else {
    if(goog.isString(arg1) && goog.isDef(arg2)) {
      var store_name = arg1;
      var store = this.schema.getStore(store_name);
      if(!store) {
        if(this.schema.isAutoSchema()) {
          return goog.async.Deferred.succeed(undefined)
        }else {
          throw new ydn.error.ArgumentException("Store: " + store_name + " not found.");
        }
      }
      var id = arg2;
      this.exec(function(executor) {
        executor.getById(df, store_name, id)
      }, [store_name], ydn.db.base.TransactionMode.READ_ONLY, "getById")
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
  return df
};
ydn.db.core.TxStorage.prototype.keys = function(arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  var key_range;
  var index_name;
  var limit;
  var offset;
  var reverse;
  var unique;
  var distinct;
  goog.asserts.assertString(arg1, "store_name must be a string");
  var store_name = arg1;
  var store;
  if(goog.DEBUG) {
    store = this.schema.getStore(store_name);
    if(!store) {
      throw new ydn.db.NotFoundError(store_name);
    }
  }
  var df = new goog.async.Deferred;
  if(!goog.isDef(arg2) || goog.isBoolean(arg2)) {
    reverse = !!arg2;
    if(goog.isNumber(arg3)) {
      limit = arg3
    }else {
      if(!goog.isDef(arg3)) {
        limit = ydn.db.base.DEFAULT_RESULT_LIMIT
      }else {
        throw new TypeError("arg3");
      }
    }
    if(goog.isNumber(arg4)) {
      offset = arg4
    }else {
      if(!goog.isDef(arg4)) {
        offset = 0
      }else {
        throw new TypeError("arg4");
      }
    }
    this.exec(function(executor) {
      executor.keysByStore(df, store_name, reverse, limit, offset)
    }, [store_name], ydn.db.base.TransactionMode.READ_ONLY, "keysByStore")
  }else {
    if(goog.isObject(arg2) || goog.isNull(arg2)) {
      if(goog.isObject(arg2)) {
        key_range = ydn.db.KeyRange.parseIDBKeyRange(arg2);
        if(goog.DEBUG && goog.isNull(key_range)) {
          throw new ydn.error.ArgumentException("key range");
        }
      }
      if(goog.isBoolean(arg3) || !goog.isDef(arg3)) {
        reverse = !!arg3;
        if(goog.isNumber(arg4)) {
          limit = arg4
        }else {
          if(!goog.isDef(arg4)) {
            limit = ydn.db.base.DEFAULT_RESULT_LIMIT
          }else {
            throw new ydn.error.ArgumentException("arg4 must be number|undefined.");
          }
        }
        if(goog.isNumber(arg5)) {
          offset = arg5
        }else {
          if(!goog.isDef(arg5)) {
            offset = 0
          }else {
            throw new ydn.error.ArgumentException("arg5 must be number|undefined.");
          }
        }
        if(goog.isDef(arg6) || goog.isDef(arg7)) {
          throw new ydn.error.ArgumentException("too many arguments");
        }
        this.exec(function(executor) {
          executor.keysByKeyRange(df, store_name, key_range, reverse, limit, offset)
        }, [store_name], ydn.db.base.TransactionMode.READ_ONLY, "keysByKeyRange")
      }else {
        throw new ydn.error.ArgumentException("arg3 must be boolean|string|undefined.");
      }
    }else {
      if(goog.isString(arg2)) {
        index_name = arg2;
        if(goog.DEBUG && !store.hasIndex(index_name)) {
          throw new ydn.db.NotFoundError(index_name + " in " + store_name);
        }
        if(!goog.isDef(arg3) || goog.isNull(arg3) || goog.isObject(arg3)) {
          key_range = ydn.db.KeyRange.parseIDBKeyRange(arg3)
        }else {
          throw new ydn.error.ArgumentException("arg3 must be IDBKeyRange|null|undefined.");
        }
        if(goog.isDef(arg4) && !goog.isBoolean(arg4)) {
          throw new ydn.error.ArgumentException("arg4 must be boolean|undefined.");
        }
        reverse = !!arg4;
        if(goog.isNumber(arg5)) {
          limit = arg5
        }else {
          if(!goog.isDef(arg5)) {
            limit = ydn.db.base.DEFAULT_RESULT_LIMIT
          }else {
            throw new ydn.error.ArgumentException("arg5 must be number|undefined.");
          }
        }
        if(goog.isNumber(arg6)) {
          offset = arg6
        }else {
          if(!goog.isDef(arg6)) {
            offset = 0
          }else {
            throw new ydn.error.ArgumentException("arg6 must be number|undefined.");
          }
        }
        if(goog.isDef(arg7) && !goog.isBoolean(arg7)) {
          throw new ydn.error.ArgumentException("arg7 must be boolean|undefined.");
        }
        unique = !!arg7;
        this.exec(function(executor) {
          executor.keysByIndexKeyRange(df, store_name, index_name, key_range, reverse, limit, offset, unique)
        }, [store_name], ydn.db.base.TransactionMode.READ_ONLY, "keysByIndexKeyRange")
      }else {
        throw new ydn.error.ArgumentException;
      }
    }
  }
  return df
};
ydn.db.core.TxStorage.prototype.list = function(arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  var df = ydn.db.base.createDeferred();
  var reverse;
  var limit;
  var offset;
  var unique;
  if(goog.isString(arg1)) {
    var store_name = arg1;
    var store = this.schema.getStore(store_name);
    if(!store) {
      if(this.schema.isAutoSchema()) {
        return goog.async.Deferred.succeed(undefined)
      }else {
        throw new ydn.error.ArgumentException("Store: " + store_name + " not found.");
      }
    }
    if(goog.isArray(arg2)) {
      var ids = arg2;
      this.exec(function(executor) {
        executor.listByIds(df, store_name, ids)
      }, [store_name], ydn.db.base.TransactionMode.READ_ONLY, "listByIds")
    }else {
      if(!goog.isDef(arg2) || goog.isBoolean(arg2)) {
        reverse = !!arg2;
        if(!goog.isDef(arg3)) {
          limit = ydn.db.base.DEFAULT_RESULT_LIMIT
        }else {
          if(goog.isNumber(arg3)) {
            limit = arg3
          }else {
            throw new ydn.error.ArgumentException("arg3 must be number|undefined.");
          }
        }
        if(!goog.isDef(arg4)) {
          offset = 0
        }else {
          if(goog.isNumber(arg4)) {
            offset = arg4
          }else {
            throw new ydn.error.ArgumentException("arg4 must be number|undefined.");
          }
        }
        if(goog.isDef(arg5)) {
          throw new ydn.error.ArgumentException("too many input arguments");
        }
        this.exec(function(executor) {
          executor.listByKeyRange(df, store_name, null, reverse, limit, offset)
        }, [store_name], ydn.db.base.TransactionMode.READ_ONLY, "listByKeyRange")
      }else {
        if(goog.isObject(arg2) || goog.isNull(arg2) || !goog.isDef(arg2)) {
          var key_range = ydn.db.KeyRange.parseIDBKeyRange(arg2);
          if(goog.isDef(arg3) && !goog.isBoolean(arg3)) {
            throw new ydn.error.ArgumentException("arg3 must be boolean|undefined.");
          }
          reverse = !!arg3;
          if(!goog.isDef(arg4)) {
            limit = ydn.db.base.DEFAULT_RESULT_LIMIT
          }else {
            if(goog.isNumber(arg4)) {
              limit = arg4
            }else {
              throw new ydn.error.ArgumentException("arg4 must be number|undefined.");
            }
          }
          if(!goog.isDef(arg5)) {
            offset = 0
          }else {
            if(goog.isNumber(arg5)) {
              offset = arg5
            }else {
              throw new ydn.error.ArgumentException("arg5 must be number|undefined.");
            }
          }
          var kr = key_range;
          this.exec(function(executor) {
            executor.listByKeyRange(df, store_name, kr, reverse, limit, offset)
          }, [store_name], ydn.db.base.TransactionMode.READ_ONLY, "listByKeyRange")
        }else {
          if(goog.isString(arg2)) {
            var index = arg2;
            var key_range = ydn.db.KeyRange.parseIDBKeyRange(arg3);
            if(goog.isDef(arg4) && !goog.isBoolean(arg4)) {
              throw new ydn.error.ArgumentException("arg4 must be boolean|undefined.");
            }
            reverse = !!arg4;
            if(!goog.isDef(arg5)) {
              limit = ydn.db.base.DEFAULT_RESULT_LIMIT
            }else {
              if(goog.isNumber(arg5)) {
                limit = arg5
              }else {
                throw new ydn.error.ArgumentException("arg5 must be number|undefined.");
              }
            }
            if(!goog.isDef(arg6)) {
              offset = 0
            }else {
              if(goog.isNumber(arg6)) {
                offset = arg6
              }else {
                throw new ydn.error.ArgumentException("arg6 must be number|undefined.");
              }
            }
            unique = !!arg7;
            if(goog.isDef(arg7) && !goog.isBoolean(arg7)) {
              throw new ydn.error.ArgumentException("arg7 must be boolean|undefined.");
            }
            this.exec(function(executor) {
              executor.listByIndexKeyRange(df, store_name, index, key_range, reverse, limit, offset, unique)
            }, [store_name], ydn.db.base.TransactionMode.READ_ONLY, "listByKeyRange")
          }else {
            throw new ydn.error.ArgumentException("arg2");
          }
        }
      }
    }
  }else {
    if(goog.isArray(arg1)) {
      if(arg1[0] instanceof ydn.db.Key) {
        var store_names = [];
        var keys = arg1;
        for(var i = 0;i < keys.length;i++) {
          var key = keys[i];
          var i_store_name = key.getStoreName();
          if(!this.schema.hasStore(i_store_name)) {
            if(this.schema.isAutoSchema()) {
              var fail_array = [];
              fail_array[keys.length - 1] = undefined;
              return goog.async.Deferred.succeed(fail_array)
            }else {
              throw new ydn.error.ArgumentException("Store: " + i_store_name + " not found.");
            }
          }
          if(!goog.array.contains(store_names, i_store_name)) {
            store_names.push(i_store_name)
          }
        }
        this.exec(function(executor) {
          executor.listByKeys(df, keys)
        }, store_names, ydn.db.base.TransactionMode.READ_ONLY, "listByKeys")
      }else {
        throw new ydn.error.ArgumentException("must be array of ydn.db.Key");
      }
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
  return df
};
ydn.db.core.TxStorage.prototype.put = function(store_name_or_schema, value, opt_keys) {
  var store_name = goog.isString(store_name_or_schema) ? store_name_or_schema : goog.isObject(store_name_or_schema) ? store_name_or_schema["name"] : undefined;
  if(!goog.isString(store_name)) {
    throw new ydn.error.ArgumentException("store name");
  }
  var store = this.schema.getStore(store_name);
  if(!store) {
    if(!this.schema.isAutoSchema()) {
      throw new ydn.error.ArgumentException("Not found: " + store_name);
    }
    var schema = goog.isObject(store_name_or_schema) ? store_name_or_schema : {"name":store_name};
    store = ydn.db.schema.Store.fromJSON(schema);
    this.logger.finest("Adding object store: " + store_name);
    this.addStoreSchema(store)
  }else {
    if(this.schema.isAutoSchema() && goog.isObject(store_name_or_schema)) {
      var new_schema = ydn.db.schema.Store.fromJSON(store_name_or_schema);
      var diff = store.difference(new_schema);
      if(diff) {
        throw new ydn.error.NotSupportedException("schema change: " + diff);
      }
    }
  }
  var df = ydn.db.base.createDeferred();
  var me = this;
  if(!store) {
    throw new ydn.error.ArgumentException("Store: " + store_name + " not exists.");
  }
  if(goog.isString(store.keyPath) && goog.isDef(opt_keys)) {
    throw new ydn.error.ArgumentException("key cannot provide while in-line key " + "is in used.");
  }else {
    if(store.autoIncrement && goog.isDef(opt_keys)) {
      throw new ydn.error.ArgumentException("key cannot provide while " + "autoIncrement is true.");
    }else {
      if(!goog.isString(store.keyPath) && !store.autoIncrement && !goog.isDef(opt_keys)) {
        throw new ydn.error.ArgumentException("out-of-line key must be provided.");
      }
    }
  }
  if(goog.isArray(value)) {
    var objs = value;
    var keys = opt_keys;
    this.exec(function(executor) {
      executor.putObjects(df, store_name, objs, keys)
    }, [store_name], ydn.db.base.TransactionMode.READ_WRITE, "putObjects")
  }else {
    if(goog.isObject(value)) {
      var obj = value;
      var key = opt_keys;
      this.exec(function(executor) {
        executor.putObject(df, store_name, obj, key)
      }, [store_name], ydn.db.base.TransactionMode.READ_WRITE, "putObject")
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
  return df
};
ydn.db.core.TxStorage.prototype.clear = function(arg1, arg2) {
  var df = ydn.db.base.createDeferred();
  if(goog.isString(arg1)) {
    var store_name = arg1;
    if(goog.isString(arg2) || goog.isNumber(arg2) || goog.isArray(arg2)) {
      var id = arg2;
      this.exec(function(executor) {
        executor.clearById(df, store_name, id)
      }, [store_name], ydn.db.base.TransactionMode.READ_WRITE, "clearById")
    }else {
      if(!goog.isDef(arg2)) {
        this.exec(function(executor) {
          executor.clearByStore(df, store_name)
        }, [store_name], ydn.db.base.TransactionMode.READ_WRITE, "clearByStore")
      }else {
        throw new ydn.error.ArgumentException;
      }
    }
  }else {
    if(goog.isArray(arg1) && goog.isString(arg1[0])) {
      var store_names = arg1;
      this.exec(function(executor) {
        executor.clearByStore(df, store_names)
      }, store_names, ydn.db.base.TransactionMode.READ_WRITE, "clearByStore")
    }else {
      if(!goog.isDef(arg1)) {
        var store_names = this.schema.getStoreNames();
        this.exec(function(executor) {
          executor.clearByStore(df, store_names)
        }, store_names, ydn.db.base.TransactionMode.READ_WRITE, "clearByStore")
      }else {
        throw new ydn.error.ArgumentException;
      }
    }
  }
  return df
};
ydn.db.core.TxStorage.prototype.toString = function() {
  var s = "TxStorage:" + this.getStorage().getName();
  if(goog.DEBUG) {
    var scope = this.getScope();
    scope = scope ? "[" + scope + "]" : "";
    var mu = this.getMuTx().getScope();
    var mu_scope = mu ? "[" + mu + "]" : "";
    return s + ":" + this.q_no_ + scope + ":" + this.getTxNo() + mu_scope
  }
  return s
};
goog.provide("ydn.db.con.ICursorStream");
ydn.db.con.ICursorStream = function() {
};
ydn.db.con.ICursorStream.prototype.seek = goog.abstractMethod;
ydn.db.con.ICursorStream.prototype.onFinish = goog.abstractMethod;
goog.provide("ydn.db.con.IdbCursorStream");
goog.require("goog.debug.Logger");
goog.require("ydn.db.con.ICursorStream");
goog.require("ydn.db.con.IStorage");
ydn.db.con.IdbCursorStream = function(db, store_name, index_name, key_only, sink) {
  if("transaction" in db) {
    this.db_ = db;
    this.idb_ = null;
    this.tx_ = null
  }else {
    if("objectStore" in db) {
      var tx = db;
      this.db_ = null;
      this.idb_ = tx.db;
      this.tx_ = tx;
      if(goog.DEBUG && !this.tx_.db.objectStoreNames.contains(store_name)) {
        throw new ydn.error.ArgumentException('store "' + store_name + '" not in transaction.');
      }
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
  this.store_name_ = store_name;
  this.index_name_ = index_name;
  this.sink_ = sink;
  this.key_only_ = key_only;
  this.cursor_ = null;
  this.stack_ = [];
  this.on_tx_request_ = false
};
ydn.db.con.IdbCursorStream.prototype.logger = goog.debug.Logger.getLogger("ydn.db.con.IdbCursorStream");
ydn.db.con.IdbCursorStream.prototype.db_;
ydn.db.con.IdbCursorStream.prototype.tx_;
ydn.db.con.IdbCursorStream.prototype.idb_;
ydn.db.con.IdbCursorStream.prototype.on_tx_request_ = false;
ydn.db.con.IdbCursorStream.prototype.store_name_;
ydn.db.con.IdbCursorStream.prototype.index_name_;
ydn.db.con.IdbCursorStream.prototype.stack_ = [];
ydn.db.con.IdbCursorStream.prototype.sink_;
ydn.db.con.IdbCursorStream.prototype.processRequest_ = function(req) {
  var me = this;
  req.onsuccess = function(ev) {
    var cursor = ev.target.result;
    if(cursor) {
      if(goog.isFunction(me.sink_)) {
        if(me.key_only_) {
          me.sink_(cursor.primaryKey, cursor.key)
        }else {
          me.sink_(cursor.primaryKey, cursor["value"])
        }
      }else {
        me.logger.warning("sink gone, dropping value for: " + cursor.primaryKey)
      }
      if(me.stack_.length > 0) {
        cursor["continue"](me.stack_.shift())
      }
    }
  };
  req.onerror = function(ev) {
    var msg = "error" in req ? req["error"].name + ":" + req["error"].message : "";
    me.logger.warning("seeking fail. " + msg)
  }
};
ydn.db.con.IdbCursorStream.prototype.onFinish = function(callback) {
  if(this.stack_.length == 0 && !this.cursor_) {
    callback()
  }else {
    this.collector_ = callback
  }
};
ydn.db.con.IdbCursorStream.prototype.createRequest_ = function() {
  if(this.on_tx_request_) {
    return
  }
  var me = this;
  var on_completed = function(type, ev) {
    me.tx_ = null;
    if(type !== ydn.db.base.TransactionEventTypes.COMPLETE) {
      me.logger.warning(ev.name + ":" + ev.message)
    }
    me.logger.finest(me + " transaction " + type)
  };
  var doRequest = function(tx) {
    var key = me.stack_.shift();
    me.logger.finest(me + " transaction started for " + key);
    var store = tx.objectStore(me.store_name_);
    var indexNames = store["indexNames"];
    if(goog.isDef(me.index_name_) && indexNames.contains(me.index_name_)) {
      var index = store.index(me.index_name_);
      if(me.key_only_) {
        me.processRequest_(index.openKeyCursor(key))
      }else {
        me.processRequest_(index.openCursor(key))
      }
    }else {
      if(!goog.isDef(me.index_name_) || me.index_name_ == store.keyPath) {
        me.processRequest_(store.openCursor(key))
      }else {
        throw new ydn.db.InvalidStateError;
      }
    }
  };
  if(this.tx_) {
    me.logger.finest(me + " using existing tx.");
    doRequest(this.tx_)
  }else {
    if(this.idb_) {
      me.logger.finest(me + " creating tx from IDBDatabase.");
      this.tx = this.idb_.transaction([this.store_name_], ydn.db.base.TransactionMode.READ_ONLY);
      this.tx.oncomplete = function(event) {
        on_completed(ydn.db.base.TransactionEventTypes.COMPLETE, event)
      };
      this.tx.onerror = function(event) {
        on_completed(ydn.db.base.TransactionEventTypes.ERROR, event)
      };
      this.tx.onabort = function(event) {
        on_completed(ydn.db.base.TransactionEventTypes.ABORT, event)
      }
    }else {
      if(this.db_) {
        me.logger.finest(me + " creating tx from ydn.db.con.IStorage.");
        this.on_tx_request_ = true;
        this.db_.transaction(function(tx) {
          me.on_tx_request_ = false;
          doRequest(tx)
        }, [me.store_name_], ydn.db.base.TransactionMode.READ_ONLY, on_completed)
      }else {
        throw new ydn.error.InternalError("no way to create a transaction provided.");
      }
    }
  }
};
ydn.db.con.IdbCursorStream.prototype.clearStack_ = function() {
  if(this.cursor_ && this.stack_.length > 0) {
    this.cursor_["continue"](this.stack_.shift())
  }else {
    if(this.collector_) {
      this.collector_()
    }
  }
  this.cursor_ = null
};
ydn.db.con.IdbCursorStream.prototype.seek = function(key) {
  this.stack_.push(key);
  this.createRequest_()
};
goog.provide("ydn.db.Streamer");
goog.require("ydn.db.con.IdbCursorStream");
goog.require("ydn.db.con.IStorage");
goog.require("ydn.db.Iterator");
ydn.db.Streamer = function(storage, store_name, index_name, foreign_index_name) {
  this.store_name_ = store_name;
  this.index_name_ = goog.isString(index_name) ? index_name : undefined;
  if("transaction" in storage) {
    this.db_ = storage;
    this.cursor_ = null
  }else {
    if("db" in storage) {
      var tx = storage;
      this.db_ = null;
      this.setTx(tx)
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
  this.cursor_ = null;
  this.key_only_ = goog.isString(index_name);
  this.foreign_key_index_name_ = foreign_index_name || undefined;
  this.stack_value_ = [];
  this.stack_key_ = [];
  this.is_collecting_ = false
};
ydn.db.Streamer.prototype.logger = goog.debug.Logger.getLogger("ydn.db.Streamer");
ydn.db.Streamer.prototype.db_ = null;
ydn.db.Streamer.prototype.key_only_ = true;
ydn.db.Streamer.prototype.storage_ = null;
ydn.db.Streamer.prototype.store_name_;
ydn.db.Streamer.prototype.index_name_;
ydn.db.Streamer.prototype.sink_ = null;
ydn.db.Streamer.prototype.stack_key_ = [];
ydn.db.Streamer.prototype.stack_value_ = [];
ydn.db.Streamer.prototype.isKeyOnly = function() {
  return this.key_only_
};
ydn.db.Streamer.prototype.setSink = function(sink) {
  this.sink_ = sink
};
ydn.db.Streamer.prototype.setDb = function(db) {
  this.db_ = db
};
ydn.db.Streamer.prototype.setTx = function(tx) {
  if("db" in tx) {
    var idb_tx = tx;
    this.cursor_ = new ydn.db.con.IdbCursorStream(idb_tx, this.store_name_, this.index_name_, this.key_only_, goog.bind(this.collector_, this))
  }else {
    throw new ydn.error.ArgumentException;
  }
};
ydn.db.Streamer.prototype.push_ = function() {
  var on_queue = this.stack_value_.length > 0;
  if(on_queue && !this.is_collecting_ && goog.isFunction(this.sink_)) {
    var me = this;
    var waiter = function() {
      me.push_()
    };
    var key = this.stack_key_.shift();
    var value = this.stack_value_.shift();
    on_queue = this.stack_value_.length > 0;
    var to_wait = this.sink_(key, value, on_queue ? waiter : null);
    if(on_queue && !to_wait) {
      this.push_()
    }
  }
};
ydn.db.Streamer.prototype.is_collecting_ = false;
ydn.db.Streamer.prototype.collect = function(callback) {
  if(this.cursor_) {
    this.logger.warning("Not collected yet.");
    callback([])
  }
  this.is_collecting_ = true;
  var me = this;
  this.cursor_.onFinish(function on_finish(e) {
    callback(me.stack_value_);
    me.stack_value_ = [];
    me.is_collecting_ = false
  })
};
ydn.db.Streamer.prototype.collector_ = function(key, value) {
  this.stack_key_.push(key);
  this.stack_value_.push(value);
  this.push_()
};
ydn.db.Streamer.prototype.push = function(key, value) {
  if(this.is_collecting_) {
    throw new ydn.error.InvalidOperationError("collecting");
  }
  if(arguments.length >= 2) {
    this.collector_(key, value)
  }else {
    if(!this.cursor_) {
      if(!this.db_) {
        throw new ydn.error.InvalidOperationError("No database set.");
      }
      var type = this.db_.type();
      if(!type) {
        throw new ydn.error.InvalidOperationError("Database not connected.");
      }else {
        if(type === ydn.db.con.IndexedDb.TYPE) {
          this.cursor_ = new ydn.db.con.IdbCursorStream(this.db_, this.store_name_, this.index_name_, this.key_only_, goog.bind(this.collector_, this))
        }else {
          throw new ydn.error.NotImplementedException(type);
        }
      }
    }
    this.cursor_.seek(key)
  }
};
ydn.db.Streamer.prototype.pull = function(key, value) {
  if(!goog.isDef(this.foreign_key_index_name_)) {
    this.push(key)
  }else {
    if(this.key_only_) {
      this.push(value)
    }else {
      if(goog.isDefAndNotNull(value)) {
        this.push(value[this.foreign_key_index_name_])
      }else {
        this.push(undefined, undefined)
      }
    }
  }
};
ydn.db.Streamer.prototype.foreign_key_store_name_;
ydn.db.Streamer.prototype.foreign_key_index_name_;
ydn.db.Streamer.prototype.setRelation = function(store_name, index_name) {
  this.foreign_key_store_name_ = store_name;
  this.foreign_key_index_name_ = index_name
};
ydn.db.Streamer.prototype.getRelation = function() {
  return[this.foreign_key_store_name_, this.foreign_key_index_name_]
};
ydn.db.Streamer.prototype.getStoreName = function() {
  return this.store_name_
};
ydn.db.Streamer.prototype.getIndexName = function() {
  return this.index_name_
};
ydn.db.Streamer.prototype.toString = function() {
  return"Streamer:" + this.store_name_ + (this.index_name_ || "")
};
goog.provide("ydn.db.index.req.AbstractCursor");
ydn.db.index.req.AbstractCursor = function(store_name, index_name, keyRange, direction, key_only) {
  this.store_name = store_name;
  this.index_name = index_name;
  this.key_range = keyRange;
  this.reverse = direction == ydn.db.base.Direction.PREV || direction == ydn.db.base.Direction.PREV_UNIQUE;
  this.dir = direction;
  this.key_only = key_only
};
ydn.db.index.req.AbstractCursor.prototype.index_name = "";
ydn.db.index.req.AbstractCursor.prototype.store_name = "";
ydn.db.index.req.AbstractCursor.prototype.dir = "";
ydn.db.index.req.AbstractCursor.prototype.key_range = null;
ydn.db.index.req.AbstractCursor.prototype.reverse = false;
ydn.db.index.req.AbstractCursor.prototype.key_only = true;
ydn.db.index.req.AbstractCursor.prototype.onError = function(e) {
  throw e;
};
ydn.db.index.req.AbstractCursor.prototype.onSuccess = function(primary_key, key, value) {
  this.onNext(primary_key, key, value)
};
ydn.db.index.req.AbstractCursor.prototype.onNext = function(primary_key, key, value) {
};
ydn.db.index.req.AbstractCursor.prototype.forward = goog.abstractMethod;
ydn.db.index.req.AbstractCursor.prototype.seek = goog.abstractMethod;
ydn.db.index.req.AbstractCursor.prototype.getPrimaryKey = goog.abstractMethod;
ydn.db.index.req.AbstractCursor.prototype.hasCursor = goog.abstractMethod;
ydn.db.index.req.AbstractCursor.prototype.has_pending_request = false;
ydn.db.index.req.AbstractCursor.prototype.isRequestPending = function() {
  return this.has_pending_request
};
ydn.db.index.req.AbstractCursor.prototype.getIndexKey = goog.abstractMethod;
ydn.db.index.req.AbstractCursor.prototype.getValue = goog.abstractMethod;
ydn.db.index.req.AbstractCursor.prototype.clear = goog.abstractMethod;
ydn.db.index.req.AbstractCursor.prototype.update = goog.abstractMethod;
ydn.db.index.req.AbstractCursor.prototype.open_request = goog.abstractMethod;
ydn.db.index.req.AbstractCursor.prototype.toString = function() {
  if(goog.DEBUG) {
    var k = "";
    if(this.hasCursor()) {
      k = "{" + this.getPrimaryKey() + ":" + this.getIndexKey() + "}"
    }
    var index = goog.isDef(this.index_name) ? ":" + this.index_name : "";
    return"Cursor:" + this.store_name + index + k
  }else {
    return goog.base(this, "toString")
  }
};
goog.provide("ydn.db.index.req.IRequestExecutor");
goog.require("ydn.db.core.req.IRequestExecutor");
goog.require("ydn.db.Streamer");
goog.require("ydn.db.index.req.AbstractCursor");
ydn.db.index.req.IRequestExecutor = function() {
};
ydn.db.index.req.IRequestExecutor.prototype.getByIterator = goog.abstractMethod;
ydn.db.index.req.IRequestExecutor.prototype.keysByIterator = goog.abstractMethod;
ydn.db.index.req.IRequestExecutor.prototype.listByIterator = goog.abstractMethod;
ydn.db.index.req.IRequestExecutor.prototype.getIndexKeysByKeys = goog.abstractMethod;
ydn.db.index.req.IRequestExecutor.prototype.getKeysByIndexKeyRange = goog.abstractMethod;
ydn.db.index.req.IRequestExecutor.prototype.getCursor = goog.abstractMethod;
ydn.db.index.req.IRequestExecutor.prototype.getStreamer = goog.abstractMethod;
goog.provide("ydn.db.con.IDatabase");
goog.require("goog.async.Deferred");
ydn.db.con.IDatabase = function() {
};
ydn.db.con.IDatabase.prototype.close = function() {
};
ydn.db.con.IDatabase.prototype.type = function() {
};
ydn.db.con.IDatabase.prototype.isReady = function() {
};
ydn.db.con.IDatabase.prototype.connect = function(name, schema) {
};
ydn.db.con.IDatabase.prototype.getDbInstance = function() {
};
ydn.db.con.IDatabase.prototype.doTransaction = goog.abstractMethod;
ydn.db.con.IDatabase.prototype.getSchema = goog.abstractMethod;
goog.provide("ydn.db.utils");
ydn.db.utils.ARRAY_TERMINATOR = {};
ydn.db.utils.BYTE_TERMINATOR = 0;
ydn.db.utils.TYPE_NUMBER = 1;
ydn.db.utils.TYPE_DATE = 2;
ydn.db.utils.TYPE_STRING = 3;
ydn.db.utils.TYPE_ARRAY = 4;
ydn.db.utils.MAX_TYPE_BYTE_SIZE = 12;
ydn.db.utils.encodeKey = function(key) {
  var stack = [key], writer = new ydn.db.utils.HexStringWriter, type = 0, dataType, obj;
  while((obj = stack.pop()) !== undefined) {
    if(type % 4 === 0 && type + ydn.db.utils.TYPE_ARRAY > ydn.db.utils.MAX_TYPE_BYTE_SIZE) {
      writer.write(type);
      type = 0
    }
    dataType = typeof obj;
    if(obj instanceof Array) {
      type += ydn.db.utils.TYPE_ARRAY;
      if(obj.length > 0) {
        stack.push(ydn.db.utils.ARRAY_TERMINATOR);
        var i = obj.length;
        while(i--) {
          stack.push(obj[i])
        }
        continue
      }else {
        writer.write(type)
      }
    }else {
      if(dataType === "number") {
        type += ydn.db.utils.TYPE_NUMBER;
        writer.write(type);
        ydn.db.utils.encodeNumber(writer, obj)
      }else {
        if(obj instanceof Date) {
          type += ydn.db.utils.TYPE_DATE;
          writer.write(type);
          ydn.db.utils.encodeNumber(writer, obj.valueOf())
        }else {
          if(dataType === "string") {
            type += ydn.db.utils.TYPE_STRING;
            writer.write(type);
            ydn.db.utils.encodeString(writer, obj)
          }else {
            if(obj === ydn.db.utils.ARRAY_TERMINATOR) {
              writer.write(ydn.db.utils.BYTE_TERMINATOR)
            }else {
              return""
            }
          }
        }
      }
    }
    type = 0
  }
  return writer.trim().toString()
};
ydn.db.utils.decodeKey = function(encodedKey) {
  var rootArray = [];
  var parentArray = rootArray;
  var type, arrayStack = [], depth, tmp;
  var reader = new ydn.db.utils.HexStringReader(encodedKey);
  while(reader.read() != null) {
    if(reader.current === 0) {
      parentArray = arrayStack.pop();
      continue
    }
    if(reader.current === null) {
      return rootArray[0]
    }
    do {
      depth = reader.current / 4 | 0;
      type = reader.current % 4;
      for(var i = 0;i < depth;i++) {
        tmp = [];
        parentArray.push(tmp);
        arrayStack.push(parentArray);
        parentArray = tmp
      }
      if(type === 0 && reader.current + ydn.db.utils.TYPE_ARRAY > ydn.db.utils.MAX_TYPE_BYTE_SIZE) {
        reader.read()
      }else {
        break
      }
    }while(true);
    if(type === ydn.db.utils.TYPE_NUMBER) {
      parentArray.push(ydn.db.utils.decodeNumber(reader))
    }else {
      if(type === ydn.db.utils.TYPE_DATE) {
        parentArray.push(new Date(ydn.db.utils.decodeNumber(reader)))
      }else {
        if(type === ydn.db.utils.TYPE_STRING) {
          parentArray.push(ydn.db.utils.decodeString(reader))
        }else {
          if(type === 0) {
            parentArray = arrayStack.pop()
          }
        }
      }
    }
  }
  return rootArray[0]
};
ydn.db.utils.p16 = 65536;
ydn.db.utils.p32 = 4294967296;
ydn.db.utils.p48 = 281474976710656;
ydn.db.utils.p52 = 4503599627370496;
ydn.db.utils.pNeg1074 = 4.9E-324;
ydn.db.utils.pNeg1022 = 2.2250738585072014E-308;
ydn.db.utils.ieee754 = function(number) {
  var s = 0, e = 0, m = 0;
  if(number !== 0) {
    if(isFinite(number)) {
      if(number < 0) {
        s = 1;
        number = -number
      }
      var p = 0;
      if(number >= ydn.db.utils.pNeg1022) {
        var n = number;
        while(n < 1) {
          p--;
          n *= 2
        }
        while(n >= 2) {
          p++;
          n /= 2
        }
        e = p + 1023
      }
      m = e ? Math.floor((number / Math.pow(2, p) - 1) * ydn.db.utils.p52) : Math.floor(number / ydn.db.utils.pNeg1074)
    }else {
      e = 2047;
      if(isNaN(number)) {
        m = 0x8000000000000
      }else {
        if(number === -Infinity) {
          s = 1
        }
      }
    }
  }
  return{sign:s, exponent:e, mantissa:m}
};
ydn.db.utils.encodeNumber = function(writer, number) {
  var iee_number = ydn.db.utils.ieee754(number);
  if(iee_number.sign) {
    iee_number.mantissa = ydn.db.utils.p52 - 1 - iee_number.mantissa;
    iee_number.exponent = 2047 - iee_number.exponent
  }
  var word, m = iee_number.mantissa;
  writer.write((iee_number.sign ? 0 : 128) | iee_number.exponent >> 4);
  writer.write((iee_number.exponent & 15) << 4 | 0 | m / ydn.db.utils.p48);
  m %= ydn.db.utils.p48;
  word = 0 | m / ydn.db.utils.p32;
  writer.write(word >> 8, word & 255);
  m %= ydn.db.utils.p32;
  word = 0 | m / ydn.db.utils.p16;
  writer.write(word >> 8, word & 255);
  word = m % ydn.db.utils.p16;
  writer.write(word >> 8, word & 255)
};
ydn.db.utils.decodeNumber = function(reader) {
  var b = reader.read() | 0;
  var sign = b >> 7 ? false : true;
  var s = sign ? -1 : 1;
  var e = (b & 127) << 4;
  b = reader.read() | 0;
  e += b >> 4;
  if(sign) {
    e = 2047 - e
  }
  var tmp = [sign ? 15 - (b & 15) : b & 15];
  var i = 6;
  while(i--) {
    tmp.push(sign ? 255 - (reader.read() | 0) : reader.read() | 0)
  }
  var m = 0;
  i = 7;
  while(i--) {
    m = m / 256 + tmp[i]
  }
  m /= 16;
  if(m === 0 && e === 0) {
    return 0
  }
  return(m + 1) * Math.pow(2, e - 1023) * s
};
ydn.db.utils.secondLayer = 16383 + 127;
ydn.db.utils.encodeString = function(writer, string) {
  for(var i = 0;i < string.length;i++) {
    var code = string.charCodeAt(i);
    if(code <= 126) {
      writer.write(code + 1)
    }else {
      if(code <= ydn.db.utils.secondLayer) {
        code -= 127;
        writer.write(128 | code >> 8, code & 255)
      }else {
        writer.write(192 | code >> 10, code >> 2 | 255, (code | 3) << 6)
      }
    }
  }
  writer.write(ydn.db.utils.BYTE_TERMINATOR)
};
ydn.db.utils.decodeString = function(reader) {
  var buffer = [], layer = 0, unicode = 0, count = 0, $byte, tmp;
  while(true) {
    $byte = reader.read();
    if($byte === 0 || $byte == null) {
      break
    }
    if(layer === 0) {
      tmp = $byte >> 6;
      if(tmp < 2 && !isNaN($byte)) {
        buffer.push(String.fromCharCode($byte - 1))
      }else {
        layer = tmp;
        unicode = $byte << 10;
        count++
      }
    }else {
      if(layer === 2) {
        buffer.push(String.fromCharCode(unicode + $byte + 127));
        layer = unicode = count = 0
      }else {
        if(count === 2) {
          unicode += $byte << 2;
          count++
        }else {
          buffer.push(String.fromCharCode(unicode | $byte >> 6));
          layer = unicode = count = 0
        }
      }
    }
  }
  return buffer.join("")
};
ydn.db.utils.HexStringReader = function(string) {
  this.current = null;
  var lastIndex = string.length - 1;
  var index = -1;
  this.read = function() {
    return this.current = index < lastIndex ? parseInt(string[++index] + string[++index], 16) : null
  }
};
ydn.db.utils.HexStringWriter = function() {
  var buffer = [], c;
  this.write = function($byte) {
    for(var i = 0;i < arguments.length;i++) {
      c = arguments[i].toString(16);
      buffer.push(c.length === 2 ? c : c = "0" + c)
    }
  };
  this.toString = function() {
    return buffer.length ? buffer.join("") : null
  };
  this.trim = function() {
    var length = buffer.length;
    while(buffer[--length] === "00") {
    }
    buffer.length = ++length;
    return this
  }
};
goog.provide("ydn.db.schema.DataType");
goog.provide("ydn.db.schema.Database");
goog.provide("ydn.db.schema.Index");
goog.provide("ydn.db.schema.Store");
goog.require("ydn.db.base");
goog.require("ydn.db.Key");
goog.require("ydn.db.utils");
ydn.db.schema.Index = function(keyPath, opt_type, opt_unique, multiEntry, name) {
  if(!goog.isDef(keyPath) && goog.isDef(name)) {
    keyPath = name
  }
  if(goog.isArrayLike(keyPath)) {
    var ks = goog.array.map(keyPath, function(x) {
      return x
    });
    if(!goog.isDef(name)) {
      name = ks.join(", ")
    }
    keyPath = ks
  }else {
    if(goog.isString(keyPath)) {
    }else {
      throw new ydn.error.ArgumentException("index keyPath or name required.");
    }
  }
  this.keyPath = keyPath;
  this.name = goog.isDef(name) ? name : this.keyPath;
  this.type = ydn.db.schema.Index.toType(opt_type);
  if(this.type != opt_type) {
    throw new ydn.error.ArgumentException("Invalid index type: " + opt_type + " in " + this.name);
  }
  this.unique = !!opt_unique;
  this.multiEntry = !!multiEntry
};
ydn.db.schema.DataType = {ARRAY:"ARRAY", BLOB:"BLOB", DATE:"DATE", INTEGER:"INTEGER", NUMERIC:"NUMERIC", TEXT:"TEXT"};
ydn.db.DataTypeAbbr = {DATE:"d", NUMERIC:"n", TEXT:"t"};
ydn.db.schema.Index.ARRAY_SEP = String.fromCharCode(31);
ydn.db.schema.Index.js2sql = function(key, type) {
  if(type == ydn.db.schema.DataType.DATE) {
    if(key instanceof Date) {
      return+key
    }
  }else {
    if(type == ydn.db.schema.DataType.ARRAY) {
      var arr = !goog.isDefAndNotNull(key) ? [""] : goog.isArray(key) ? key : [key];
      var t = ydn.db.schema.Index.toAbbrType(arr[0]);
      var value = t == ydn.db.DataTypeAbbr.DATE ? arr.reduce(function(p, x) {
        return p + +x
      }, "") : arr.join(ydn.db.schema.Index.ARRAY_SEP);
      return t + ydn.db.schema.Index.ARRAY_SEP + value + ydn.db.schema.Index.ARRAY_SEP
    }else {
      if(goog.isDef(type)) {
        return key
      }else {
        var encoded = ydn.db.utils.encodeKey(key);
        return"X'" + encoded + "'"
      }
    }
  }
};
ydn.db.schema.Index.sql2js = function(key, type) {
  if(type == ydn.db.schema.DataType.DATE) {
    return new Date(key)
  }else {
    if(type == ydn.db.schema.DataType.ARRAY) {
      goog.asserts.assertString(key);
      var s = key;
      var arr = s.split(ydn.db.schema.Index.ARRAY_SEP);
      var t = arr[0];
      var effective_arr = arr.slice(1, arr.length - 1);
      return goog.array.map(effective_arr, function(x) {
        if(t == ydn.db.DataTypeAbbr.DATE) {
          return new Date(parseInt(x, 10))
        }else {
          if(t == ydn.db.DataTypeAbbr.NUMERIC) {
            return parseFloat(x)
          }else {
            return x
          }
        }
      })
    }else {
      if(goog.isDef(type)) {
        return key
      }else {
        return ydn.db.utils.decodeKey(key)
      }
    }
  }
};
ydn.db.schema.Index.TYPES = [ydn.db.schema.DataType.ARRAY, ydn.db.schema.DataType.BLOB, ydn.db.schema.DataType.DATE, ydn.db.schema.DataType.INTEGER, ydn.db.schema.DataType.NUMERIC, ydn.db.schema.DataType.TEXT];
ydn.db.schema.Index.toType = function(str) {
  var idx = goog.array.indexOf(ydn.db.schema.Index.TYPES, str);
  return ydn.db.schema.Index.TYPES[idx]
};
ydn.db.schema.Index.toAbbrType = function(x) {
  if(x instanceof Date) {
    return ydn.db.DataTypeAbbr.DATE
  }else {
    if(goog.isNumber(x)) {
      return ydn.db.DataTypeAbbr.NUMERIC
    }else {
      return ydn.db.DataTypeAbbr.TEXT
    }
  }
};
ydn.db.schema.Index.prototype.getType = function() {
  return this.type || ydn.db.schema.DataType.BLOB
};
ydn.db.schema.Index.prototype.isMultiEntry = function() {
  return this.multiEntry
};
ydn.db.schema.Index.prototype.toJSON = function() {
  return{"name":this.name, "keyPath":this.keyPath, "type":this.type, "unique":this.unique, "multiEntry":this.multiEntry}
};
ydn.db.schema.Index.prototype.difference = function(index) {
  if(!index) {
    return"no index for " + this.name
  }
  if(this.name != index.name) {
    return"name, expect: " + this.name + ", but: " + index.name
  }
  if(!ydn.object.equals(this.keyPath, index.keyPath)) {
    return"keyPath, expect: " + this.keyPath + ", but: " + index.keyPath
  }
  if(this.unique != index.unique) {
    return"unique, expect: " + this.unique + ", but: " + index.unique
  }
  if(goog.isDef(this.type) && goog.isDef(index.type) && this.type != index.type) {
    return"data type, expect: " + this.type + ", but: " + index.type
  }
  return""
};
ydn.db.schema.Index.toDir = function(str) {
  var idx = goog.array.indexOf(ydn.db.base.DIRECTIONS, str);
  return ydn.db.base.DIRECTIONS[idx]
};
ydn.db.schema.Index.prototype.getKeyPath = function() {
  return this.keyPath
};
ydn.db.schema.Index.fromJSON = function(json) {
  if(goog.DEBUG) {
    var fields = ["name", "unique", "type", "keyPath", "multiEntry"];
    for(var key in json) {
      if(json.hasOwnProperty(key) && goog.array.indexOf(fields, key) == -1) {
        throw new ydn.error.ArgumentException("Unknown field: " + key + " in " + ydn.json.stringify(json));
      }
    }
  }
  return new ydn.db.schema.Index(json.keyPath, json.type, json.unique, json.multiEntry, json.name)
};
ydn.db.schema.Store = function(name, keyPath, autoIncrement, opt_type, opt_indexes) {
  this.name = name;
  if(!goog.isString(this.name)) {
    throw new ydn.error.ArgumentException("store name must be a string");
  }
  this.keyPath = goog.isDef(keyPath) ? keyPath : null;
  if(!goog.isNull(this.keyPath) && (!goog.isString(this.keyPath) || goog.isArray(this.keyPath))) {
    throw new ydn.error.ArgumentException("keyPath must be a string or array");
  }
  this.autoIncrement = autoIncrement;
  var type;
  if(goog.isDef(opt_type)) {
    type = ydn.db.schema.Index.toType(opt_type);
    if(!goog.isDef(type)) {
      throw new ydn.error.ArgumentException("type invalid in store: " + this.name);
    }
  }
  this.type = goog.isDef(type) ? type : this.autoIncrement ? ydn.db.schema.DataType.INTEGER : undefined;
  if(this.autoIncrement) {
    var sqlite_msg = "AUTOINCREMENT is only allowed on an INTEGER PRIMARY KEY";
    goog.asserts.assert(this.type == ydn.db.schema.DataType.INTEGER, sqlite_msg)
  }
  this.keyPaths = goog.isString(this.keyPath) ? this.keyPath.split(".") : [];
  this.indexes = opt_indexes || []
};
ydn.db.schema.Store.prototype.toJSON = function() {
  var indexes = [];
  for(var i = 0;i < this.indexes.length;i++) {
    indexes.push(this.indexes[i].toJSON())
  }
  return{"name":this.name, "keyPath":this.keyPath, "autoIncrement":this.autoIncrement, "type":this.type, "indexes":indexes}
};
ydn.db.schema.Store.fromJSON = function(json) {
  if(goog.DEBUG) {
    var fields = ["name", "keyPath", "autoIncrement", "type", "indexes"];
    for(var key in json) {
      if(json.hasOwnProperty(key) && goog.array.indexOf(fields, key) == -1) {
        throw new ydn.error.ArgumentException('Unknown attribute "' + key + '"');
      }
    }
  }
  var indexes = [];
  var indexes_json = json.indexes || [];
  if(goog.isArray(indexes_json)) {
    for(var i = 0;i < indexes_json.length;i++) {
      var index = ydn.db.schema.Index.fromJSON(indexes_json[i]);
      if(goog.isDef(index.keyPath) && index.keyPath === json.keyPath) {
        continue
      }
      indexes.push(index)
    }
  }
  return new ydn.db.schema.Store(json.name, json.keyPath, json.autoIncrement, json.type, indexes)
};
ydn.db.schema.Store.prototype.clone = function() {
  return ydn.db.schema.Store.fromJSON(this.toJSON())
};
ydn.db.schema.Store.prototype.getIndex = function(name) {
  return goog.array.find(this.indexes, function(x) {
    return x.name == name
  })
};
ydn.db.schema.Store.prototype.hasIndex = function(name) {
  if(name == this.keyPath) {
    return true
  }
  return goog.array.some(this.indexes, function(x) {
    return x.name == name
  })
};
ydn.db.schema.Store.prototype.getQuotedKeyPath = function() {
  return goog.isString(this.keyPath) ? goog.string.quote(this.keyPath) : undefined
};
ydn.db.schema.Store.prototype.getSQLKeyColumnName = function() {
  return goog.isString(this.keyPath) ? goog.string.quote(this.keyPath) : ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME
};
ydn.db.schema.Store.prototype.getColumnName = function() {
  return goog.isString(this.keyPath) ? this.keyPath : ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME
};
ydn.db.schema.Store.prototype.getQuotedName = function() {
  return goog.string.quote(this.name)
};
ydn.db.schema.Store.prototype.getColumns = function() {
  if(this.columns_ && this.columns_.length != this.indexes.length) {
    this.columns_ = [];
    for(var i = 0;i < this.indexes.length;i++) {
      this.columns_.push(this.indexes[i].name)
    }
  }
  return this.columns_
};
ydn.db.schema.Store.prototype.getName = function() {
  return this.name
};
ydn.db.schema.Store.prototype.getAutoIncrement = function() {
  return this.autoIncrement
};
ydn.db.schema.Store.prototype.getKeyPath = function() {
  return this.keyPath
};
ydn.db.schema.Store.prototype.getIndexNames = function() {
  return this.indexes.map(function(x) {
    return x.name
  })
};
ydn.db.schema.Store.prototype.getType = function() {
  return this.type
};
ydn.db.schema.Store.prototype.getIndexKeyPaths = function() {
  return this.indexes.map(function(x) {
    return x.keyPath
  })
};
ydn.db.schema.Store.prototype.addIndex = function(name, opt_unique, opt_type, opt_multiEntry) {
  this.indexes.push(new ydn.db.schema.Index(name, opt_type, opt_unique, opt_multiEntry))
};
ydn.db.schema.Store.prototype.getKeyValue = function(obj) {
  return goog.object.getValueByKeys(obj, this.keyPaths)
};
ydn.db.schema.Store.prototype.getRowValue = function(obj) {
  if(goog.isDefAndNotNull(this.keyPath)) {
    var value = obj[this.keyPath];
    if(this.type == ydn.db.schema.DataType.DATE) {
      value = Date.parse(value)
    }else {
      if(this.type == ydn.db.schema.DataType.ARRAY) {
        value = parseFloat(value)
      }
    }
    return value
  }else {
    return undefined
  }
};
ydn.db.schema.Store.prototype.generateKey = function() {
  if(!goog.isDef(this.current_key_)) {
    this.current_key_ = 0
  }
  return this.current_key_++
};
ydn.db.schema.Store.prototype.setKeyValue = function(obj, value) {
  for(var i = 0;i < this.keyPaths.length;i++) {
    var key = this.keyPaths[i];
    if(i == this.keyPaths.length - 1) {
      obj[key] = value;
      return
    }
    if(!goog.isDef(obj[key])) {
      obj[key] = {}
    }
    obj = obj[key]
  }
};
ydn.db.schema.Store.DEFAULT_TEXT_STORE = "default_text_store";
ydn.db.schema.Store.prototype.getIndexedValues = function(obj, opt_key) {
  var key_column;
  var values = [];
  var normalized_key;
  var key = goog.isDef(opt_key) ? opt_key : goog.isString(this.keyPath) ? this.getKeyValue(obj) : undefined;
  var columns = [];
  if(goog.isDef(key)) {
    columns = goog.isDefAndNotNull(this.keyPath) ? [this.getQuotedKeyPath()] : [ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME];
    values = [ydn.db.schema.Index.js2sql(key, this.type)]
  }
  for(var i = 0;i < this.indexes.length;i++) {
    if(this.indexes[i].name == this.keyPath || this.indexes[i].name == ydn.db.base.DEFAULT_BLOB_COLUMN) {
      continue
    }
    var v = obj[this.indexes[i].name];
    if(goog.isDef(v)) {
      values.push(ydn.db.schema.Index.js2sql(v, this.indexes[i].type));
      columns.push(goog.string.quote(this.indexes[i].name))
    }
  }
  var data = {};
  for(var item in obj) {
    if(obj.hasOwnProperty(item) && !this.hasIndex(item)) {
      data[item] = obj[item]
    }
  }
  values.push(ydn.json.stringify(data));
  columns.push(ydn.db.base.DEFAULT_BLOB_COLUMN);
  var slots = [];
  for(var i = values.length - 1;i >= 0;i--) {
    slots[i] = "?"
  }
  return{columns:columns, slots:slots, values:values, key:key}
};
ydn.db.schema.Store.prototype.equals = function(store) {
  return this.name === store.name && ydn.object.equals(this.toJSON(), store.toJSON())
};
ydn.db.schema.Store.prototype.difference = function(store) {
  if(!store) {
    return"missing store: " + this.name
  }
  if(this.name != store.name) {
    return"store name, expect: " + this.name + ", but: " + store.name
  }
  if(this.keyPath != store.keyPath) {
    return"keyPath, expect:  " + this.keyPath + ", but: " + store.keyPath
  }
  if(goog.isDef(this.autoIncrement) && goog.isDef(store.autoIncrement) && this.autoIncrement != store.autoIncrement) {
    return"autoIncrement, expect:  " + this.autoIncrement + ", but: " + store.autoIncrement
  }
  if(this.indexes.length != store.indexes.length) {
    return"indexes length, expect:  " + this.indexes.length + ", but: " + store.indexes.length
  }
  if(goog.isDef(this.type) && goog.isDef(store.type) && this.type != store.type) {
    return"data type, expect:  " + this.type + ", but: " + store.type
  }
  for(var i = 0;i < this.indexes.length;i++) {
    var index = store.getIndex(this.indexes[i].name);
    var msg = this.indexes[i].difference(index);
    if(msg.length > 0) {
      return'index "' + this.indexes[i].name + '" ' + msg
    }
  }
  return""
};
ydn.db.schema.Store.prototype.similar = function(store) {
  return this.difference(store).length == 0
};
ydn.db.schema.Database = function(version, opt_stores) {
  var ver;
  var stores = opt_stores;
  if(goog.isObject(version)) {
    var json = version;
    if(goog.DEBUG) {
      var fields = ["version", "stores"];
      for(var key in json) {
        if(json.hasOwnProperty(key) && goog.array.indexOf(fields, key) == -1) {
          throw new ydn.error.ArgumentException("Unknown field: " + key + " in " + ydn.json.stringify(json));
        }
      }
    }
    ver = json["version"];
    stores = [];
    var stores_json = json.stores || [];
    if(goog.DEBUG && !goog.isArray(stores_json)) {
      throw new ydn.error.ArgumentException("stores must be array");
    }
    for(var i = 0;i < stores_json.length;i++) {
      var store = ydn.db.schema.Store.fromJSON(stores_json[i]);
      if(goog.DEBUG) {
        var idx = goog.array.findIndex(stores, function(x) {
          return x.name == store.name
        });
        if(idx != -1) {
          throw new ydn.error.ArgumentException('duplicate store name "' + store.name + '".');
        }
      }
      stores.push(store)
    }
  }else {
    if(goog.isString(version)) {
      ver = version.length == 0 ? undefined : parseFloat(version)
    }else {
      if(goog.isNumber(version)) {
        ver = version
      }
    }
  }
  if(goog.isDef(ver)) {
    if(!goog.isNumber(ver) || ver < 0) {
      throw new ydn.error.ArgumentException("Invalid version: " + ver + " (" + version + ")");
    }
    if(isNaN(ver)) {
      ver = undefined
    }
  }
  if(goog.isDef(opt_stores) && (!goog.isArray(opt_stores) || opt_stores.length > 0 && !(opt_stores[0] instanceof ydn.db.schema.Store))) {
    throw new ydn.error.ArgumentException("stores");
  }
  this.version = ver;
  this.is_auto_version_ = !goog.isDef(this.version);
  this.stores = stores || []
};
ydn.db.schema.Database.prototype.toJSON = function() {
  var stores = this.stores.map(function(x) {
    return x.toJSON()
  });
  return{"version":this.version, "stores":stores}
};
ydn.db.schema.Database.prototype.is_auto_version_ = false;
ydn.db.schema.Database.prototype.getVersion = function() {
  return this.version
};
ydn.db.schema.Database.prototype.setVersion = function(version) {
  goog.asserts.assert(this.is_auto_version_);
  goog.asserts.assertNumber(version);
  this.version = version
};
ydn.db.schema.Database.prototype.isAutoVersion = function() {
  return this.is_auto_version_
};
ydn.db.schema.Database.prototype.isAutoSchema = function() {
  return false
};
ydn.db.schema.Database.prototype.getStoreNames = function() {
  return this.stores.map(function(x) {
    return x.name
  })
};
ydn.db.schema.Database.prototype.store = function(idx) {
  return this.stores[idx] || null
};
ydn.db.schema.Database.prototype.count = function() {
  return this.stores.length
};
ydn.db.schema.Database.prototype.getStore = function(name) {
  return goog.array.find(this.stores, function(x) {
    return x.name == name
  })
};
ydn.db.schema.Database.prototype.getIndexOf = function(name) {
  return goog.array.indexOf(this.stores, function(x) {
    return x.name == name
  })
};
ydn.db.schema.Database.prototype.hasStore = function(name) {
  return goog.array.some(this.stores, function(x) {
    return x.name == name
  })
};
ydn.db.schema.Database.prototype.difference = function(schema) {
  if(!schema || this.stores.length != schema.stores.length) {
    return"Number of store: " + this.stores.length + " vs " + schema.stores.length
  }
  for(var i = 0;i < this.stores.length;i++) {
    var store = schema.getStore(this.stores[i].name);
    var msg = this.stores[i].difference(store);
    if(msg.length > 0) {
      return'store: "' + this.stores[i].name + '" ' + msg
    }
  }
  return""
};
ydn.db.schema.Database.prototype.similar = function(schema) {
  return this.difference(schema).length == 0
};
ydn.db.schema.Database.prototype.listStores = function() {
  if(!this.store_names) {
    this.store_names = goog.array.map(this.stores, function(x) {
      return x.name
    })
  }
  return this.store_names
};
goog.provide("ydn.db.con.IndexedDb");
goog.require("goog.Timer");
goog.require("goog.async.DeferredList");
goog.require("goog.debug.Error");
goog.require("goog.events");
goog.require("ydn.async");
goog.require("ydn.db.base");
goog.require("ydn.db.con.IDatabase");
goog.require("ydn.db.schema.Database");
goog.require("ydn.json");
ydn.db.con.IndexedDb = function(opt_size, time_out) {
  if(goog.isDef(opt_size)) {
    if(opt_size > 5 * 1024 * 1024) {
      this.logger.warning("storage size request ignored.")
    }
  }
  this.idx_db_ = null;
  this.time_out_ = time_out || 3 * 60 * 1E3
};
ydn.db.con.IndexedDb.prototype.connect = function(dbname, schema) {
  var me = this;
  var df = new goog.async.Deferred;
  var setDb = function(db, e) {
    if(goog.isDef(e)) {
      me.logger.warning(e ? e.message : "Error received.");
      me.idx_db_ = null;
      df.errback(e)
    }else {
      goog.asserts.assertObject(db);
      me.idx_db_ = db;
      me.idx_db_.onabort = function(e) {
        me.logger.finest(me + ": onabort - " + e.message)
      };
      me.idx_db_.onerror = function(e) {
        if(ydn.db.con.IndexedDb.DEBUG) {
          window.console.log([this, e])
        }
        me.logger.finest(me + ": onerror - " + e.message)
      };
      me.idx_db_.onversionchange = function(event) {
        if(ydn.db.con.IndexedDb.DEBUG) {
          window.console.log([this, event])
        }
        me.logger.finest(me + ": onversionchange to: " + event.version);
        if(me.idx_db_) {
          me.idx_db_.onabort = null;
          me.idx_db_.onerror = null;
          me.idx_db_.onversionchange = null;
          me.idx_db_.close();
          me.idx_db_ = null;
          if(goog.isFunction(me.onDisconnected)) {
            me.onDisconnected(event)
          }
        }
      };
      df.callback(true)
    }
  };
  var updateSchema = function(db, trans, is_caller_setversion) {
    var action = is_caller_setversion ? "changing" : "upgrading";
    var old_version = schema.isAutoSchema() ? "auto" : schema.getVersion();
    me.logger.finer(action + " version to " + db.version + " from " + old_version);
    for(var i = 0;i < schema.stores.length;i++) {
      me.update_store_(db, trans, schema.stores[i])
    }
  };
  var version = schema.getVersion();
  me.logger.finer("Opening database: " + dbname + " ver: " + version);
  var openRequest;
  if(!goog.isDef(version)) {
    openRequest = ydn.db.con.IndexedDb.indexedDb.open(dbname)
  }else {
    openRequest = ydn.db.con.IndexedDb.indexedDb.open(dbname, version)
  }
  openRequest.onsuccess = function(ev) {
    var db = ev.target.result;
    var msg = "Database: " + db.name + ", ver: " + db.version + " opened.";
    me.logger.finer(msg);
    if(schema.isAutoVersion()) {
      var schema_updater = function(db_schema) {
        if(schema.isAutoSchema()) {
          for(var i = 0;i < db_schema.stores.length;i++) {
            if(!schema.hasStore(db_schema.stores[i].name)) {
              schema.addStore(db_schema.stores[i].clone())
            }
          }
        }
        var diff_msg = schema.difference(db_schema);
        if(diff_msg.length > 0) {
          me.logger.finer("Schema change require for difference in " + diff_msg);
          var on_completed = function(t, e) {
            if(t == ydn.db.base.TransactionEventTypes.COMPLETE) {
              setDb(db)
            }else {
              me.logger.severe("Fail to update version on " + db.name + ":" + db.version);
              setDb(null, e)
            }
          };
          var next_version = goog.isNumber(db.version) ? db.version + 1 : 1;
          if("IDBOpenDBRequest" in goog.global) {
            db.close();
            var req = ydn.db.con.IndexedDb.indexedDb.open(dbname, next_version);
            req.onupgradeneeded = function(ev) {
              var db = ev.target.result;
              me.logger.finer("re-open for version " + db.version);
              updateSchema(db, req["transaction"], false)
            };
            req.onsuccess = function(ev) {
              setDb(ev.target.result)
            };
            req.onerror = function(e) {
              me.logger.finer(me + ": fail.");
              setDb(null)
            }
          }else {
            var ver_request = db.setVersion(next_version + "");
            ver_request.onfailure = function(e) {
              me.logger.warning("migrating from " + db.version + " to " + next_version + " failed.");
              setDb(null, e)
            };
            var trans = ver_request["transaction"];
            ver_request.onsuccess = function(e) {
              ver_request["transaction"].oncomplete = tr_on_complete;
              updateSchema(db, ver_request["transaction"], true)
            };
            var tr_on_complete = function(e) {
              var reOpenRequest = ydn.db.con.IndexedDb.indexedDb.open(dbname);
              reOpenRequest.onsuccess = function(rev) {
                var db = rev.target.result;
                me.logger.finer(me + ": OK.");
                setDb(db)
              };
              reOpenRequest.onerror = function(e) {
                me.logger.finer(me + ": fail.");
                setDb(null)
              }
            };
            if(goog.isDefAndNotNull(ver_request["transaction"])) {
              ver_request["transaction"].oncomplete = tr_on_complete
            }
          }
        }else {
          setDb(db)
        }
      };
      me.getSchema(schema_updater, undefined, db)
    }else {
      if(schema.getVersion() > db.version) {
        goog.asserts.assertFunction(db["setVersion"], "Expecting IDBDatabase in old format");
        var version = schema.getVersion();
        var ver_request = db.setVersion(version);
        ver_request.onfailure = function(e) {
          me.logger.warning("migrating from " + db.version + " to " + schema.getVersion() + " failed.");
          setDb(null, e)
        };
        ver_request.onsuccess = function(e) {
          updateSchema(db, ver_request["transaction"], true)
        }
      }else {
        if(schema.getVersion() == db.version) {
          me.logger.finer("database version " + db.version + " ready to go")
        }else {
          me.logger.warning("connected database version " + db.version + " is higher than requested version.")
        }
        var validator = function(db_schema) {
          var diff_msg = schema.difference(db_schema);
          if(diff_msg.length > 0) {
            me.logger.finer(diff_msg);
            setDb(null, new ydn.error.ConstrainError("different schema: " + diff_msg))
          }else {
            setDb(db)
          }
        };
        me.getSchema(validator, undefined, db)
      }
    }
  };
  openRequest.onupgradeneeded = function(ev) {
    var db = ev.target.result;
    me.logger.finer("upgrade needed for version " + db.version);
    updateSchema(db, openRequest["transaction"], false)
  };
  openRequest.onerror = function(ev) {
    var msg = "opening database " + dbname + ":" + schema.version + " failed.";
    if(ydn.db.con.IndexedDb.DEBUG) {
      window.console.log([ev, openRequest])
    }
    me.logger.severe(msg);
    setDb(null, ev)
  };
  openRequest.onblocked = function(ev) {
    if(ydn.db.con.IndexedDb.DEBUG) {
      window.console.log([ev, openRequest])
    }
    me.logger.severe("database " + dbname + " " + schema.version + " block, close other connections.");
    setDb(null, ev)
  };
  if(goog.isNumber(this.time_out_)) {
    goog.Timer.callOnce(function() {
      if(openRequest.readyState != "done") {
        var msg = me + ": database state is still " + openRequest.readyState;
        me.logger.severe(msg);
        setDb(null, new Error("connection timeout after " + me.time_out_))
      }
    }, this.time_out_)
  }
  return df
};
ydn.db.con.IndexedDb.DEBUG = goog.DEBUG && false;
ydn.db.con.IndexedDb.indexedDb = goog.global.indexedDB || goog.global.mozIndexedDB || goog.global.webkitIndexedDB || goog.global.moz_indexedDB || goog.global["msIndexedDB"];
ydn.db.con.IndexedDb.TYPE = "indexeddb";
ydn.db.con.IndexedDb.prototype.time_out_ = 3 * 60 * 1E3;
ydn.db.con.IndexedDb.prototype.type = function() {
  return ydn.db.con.IndexedDb.TYPE
};
ydn.db.con.IndexedDb.prototype.getDbInstance = function() {
  return this.idx_db_ || null
};
ydn.db.con.IndexedDb.prototype.isReady = function() {
  return!!this.idx_db_
};
ydn.db.con.IndexedDb.isSupported = function() {
  return!!ydn.db.con.IndexedDb.indexedDb
};
ydn.db.con.IndexedDb.prototype.logger = goog.debug.Logger.getLogger("ydn.db.con.IndexedDb");
ydn.db.con.IndexedDb.prototype.idx_db_ = null;
ydn.db.con.IndexedDb.prototype.getSchema = function(callback, trans, db) {
  var idb = db || this.idx_db_;
  var mode = ydn.db.base.TransactionMode.READ_ONLY;
  if(!goog.isDef(trans)) {
    var names = [];
    for(var i = idb.objectStoreNames.length - 1;i >= 0;i--) {
      names[i] = idb.objectStoreNames[i]
    }
    if(names.length == 0) {
      callback(new ydn.db.schema.Database(idb.version));
      return
    }
    trans = idb.transaction(names, mode)
  }else {
    if(goog.isNull(trans)) {
      if(idb.objectStoreNames.length == 0) {
        callback(new ydn.db.schema.Database(idb.version));
        return
      }else {
        throw new ydn.error.InternalError;
      }
    }else {
      idb = trans["db"]
    }
  }
  var objectStoreNames = idb.objectStoreNames;
  var stores = [];
  var n = objectStoreNames.length;
  for(var i = 0;i < n;i++) {
    var objStore = trans.objectStore(objectStoreNames[i]);
    var indexes = [];
    for(var j = 0, ni = objStore.indexNames.length;j < ni;j++) {
      var index = objStore.index(objStore.indexNames[j]);
      indexes[j] = new ydn.db.schema.Index(index.keyPath, undefined, index.unique, index.multiEntry, index.name)
    }
    stores[i] = new ydn.db.schema.Store(objStore.name, objStore.keyPath, objStore.autoIncrement, undefined, indexes)
  }
  var schema = new ydn.db.schema.Database(idb.version, stores);
  callback(schema)
};
ydn.db.con.IndexedDb.prototype.update_store_ = function(db, trans, store_schema) {
  this.logger.finest("Creating Object Store for " + store_schema.name + " keyPath: " + store_schema.keyPath);
  var objectStoreNames = db.objectStoreNames;
  var createObjectStore = function() {
    var options = {"autoIncrement":!!store_schema.autoIncrement};
    if(goog.isDefAndNotNull(store_schema.keyPath)) {
      options["keyPath"] = store_schema.keyPath
    }
    try {
      return db.createObjectStore(store_schema.name, options)
    }catch(e) {
      if(goog.DEBUG && e.name == "InvalidAccessError") {
        throw new ydn.db.InvalidAccessError("creating store for " + store_schema.name + " of keyPath: " + store_schema.keyPath + " and autoIncrement: " + store_schema.autoIncrement);
      }else {
        if(goog.DEBUG && e.name == "ConstraintError") {
          throw new ydn.error.ConstrainError("creating store for " + store_schema.name);
        }else {
          throw e;
        }
      }
    }
  };
  var store;
  if(objectStoreNames.contains(store_schema.name)) {
    store = trans.objectStore(store_schema.name);
    if(store.keyPath != store_schema.keyPath) {
      db.deleteObjectStore(store_schema.name);
      this.logger.warning("store: " + store_schema.name + " deleted due to keyPath change.");
      store = createObjectStore()
    }else {
      if(store.autoIncrement != store_schema.autoIncrement) {
        db.deleteObjectStore(store_schema.name);
        this.logger.warning("store: " + store_schema.name + " deleted due to autoIncrement change.");
        store = createObjectStore()
      }
    }
    var indexNames = store.indexNames;
    var created = 0;
    var deleted = 0;
    for(var j = 0;j < store_schema.indexes.length;j++) {
      var index = store_schema.indexes[j];
      if(!indexNames.contains(index.name)) {
        store.createIndex(index.name, index.keyPath, {unique:index.unique});
        created++
      }
    }
    for(var j = 0;j < indexNames.length;j++) {
      if(!store_schema.hasIndex(indexNames[j])) {
        store.deleteIndex(indexNames[j]);
        deleted++
      }
    }
    this.logger.finest("Updated store: " + store.name + ", " + created + " index created, " + deleted + " index deleted.")
  }else {
    store = createObjectStore();
    for(var j = 0;j < store_schema.indexes.length;j++) {
      var index = store_schema.indexes[j];
      this.logger.finest("Creating index: " + index.name + " multiEntry: " + index.multiEntry);
      if(index.unique || index.multiEntry) {
        var idx_options = {unique:index.unique, multiEntry:index.multiEntry};
        store.createIndex(index.name, index.keyPath, idx_options)
      }else {
        store.createIndex(index.name, index.keyPath)
      }
    }
    this.logger.finest("Created store: " + store.name + " keyPath: " + store.keyPath)
  }
};
ydn.db.con.IndexedDb.prototype.doTransaction = function(fnc, scopes, mode, on_completed) {
  var db = this.idx_db_;
  if(!scopes) {
    scopes = [];
    for(var i = db.objectStoreNames.length - 1;i >= 0;i--) {
      scopes[i] = db.objectStoreNames[i]
    }
  }
  if(scopes.length == 0) {
    fnc(null)
  }
  var tx = db.transaction(scopes, mode);
  tx.oncomplete = function(event) {
    on_completed(ydn.db.base.TransactionEventTypes.COMPLETE, event)
  };
  tx.onerror = function(event) {
    on_completed(ydn.db.base.TransactionEventTypes.ERROR, event)
  };
  tx.onabort = function(event) {
    on_completed(ydn.db.base.TransactionEventTypes.ABORT, event)
  };
  fnc(tx)
};
ydn.db.con.IndexedDb.prototype.close = function() {
  this.idx_db_.close()
};
ydn.db.con.IndexedDb.prototype.toString = function() {
  var s = this.idx_db_ ? this.idx_db_.name + ":" + this.idx_db_.version : "";
  return this.type() + ":" + s
};
goog.provide("ydn.string");
ydn.string.split_comma_seperated = function(str) {
  return str.match(/(?:"[^"]*"|[^,])+/g)
};
ydn.string.split_space_seperated = function(str) {
  return str.match(/\w+|"[^"]+"/g)
};
ydn.string.split_space = function(str) {
  return str.match(/[^\s"']+|"[^"]*"|'[^']*'/g)
};
goog.provide("ydn.db.con.WebSql");
goog.require("goog.async.Deferred");
goog.require("goog.debug.Logger");
goog.require("goog.events");
goog.require("goog.functions");
goog.require("ydn.async");
goog.require("ydn.db.SecurityError");
goog.require("ydn.db.base");
goog.require("ydn.db.con.IDatabase");
goog.require("ydn.json");
goog.require("ydn.string");
ydn.db.con.WebSql = function(opt_size) {
  this.size_ = goog.isDef(opt_size) ? opt_size : 4 * 1024 * 1024
};
ydn.db.con.WebSql.prototype.connect = function(dbname, schema) {
  var description = dbname;
  var me = this;
  var init_migrated = false;
  var df = new goog.async.Deferred;
  var setDb = function(db, e) {
    if(goog.isDef(e)) {
      me.sql_db_ = null;
      df.errback(e)
    }else {
      me.sql_db_ = db;
      df.callback(true)
    }
  };
  var doVersionChange_ = function(db, schema, is_version_change) {
    var action = is_version_change ? "changing version" : "setting version";
    me.logger.finest(dbname + ": " + action + " from " + db.version + " to " + schema.version);
    var mode = ydn.db.base.TransactionMode.READ_WRITE;
    var updated_count = 0;
    var transaction_callback = function(tx) {
      me.getSchema(function(table_infos) {
        for(var i = 0;i < schema.stores.length;i++) {
          var counter = function() {
            updated_count++
          };
          var table_info = table_infos.getStore(schema.stores[i].name);
          me.update_store_with_info_(tx, schema.stores[i], counter, table_info)
        }
      }, tx, db)
    };
    var success_callback = function() {
      var has_created = updated_count == schema.stores.length;
      if(!has_created) {
        me.logger.warning(dbname + ": " + action + " voided.")
      }else {
        me.logger.finest(dbname + ": ready.");
        setDb(db)
      }
    };
    var error_callback = function(e) {
      throw e;
    };
    db.transaction(transaction_callback, error_callback, success_callback)
  };
  var db = null;
  var creationCallback = function(e) {
    var msg = init_migrated ? " and already migrated, but migrating again." : ", migrating.";
    me.logger.finest("receiving creation callback " + msg);
    var use_version_change_request = true;
    doVersionChange_(db, schema, use_version_change_request)
  };
  try {
    var version = schema.isAutoVersion() ? "" : schema.version + "";
    if(ydn.db.con.WebSql.GENTLE_OPENING) {
      db = goog.global.openDatabase(dbname, "", description, this.size_)
    }else {
      try {
        db = goog.global.openDatabase(dbname, version, description, this.size_, creationCallback)
      }catch(e) {
        if(e.name == "INVALID_STATE_ERR") {
          db = goog.global.openDatabase(dbname, "", description, this.size_)
        }else {
          throw e;
        }
      }
    }
  }catch(e) {
    if(e.name == "SECURITY_ERR") {
      this.logger.warning("SECURITY_ERR for opening " + dbname);
      db = null;
      this.last_error_ = new ydn.db.SecurityError(e)
    }else {
      throw e;
    }
  }
  if(!db) {
    setDb(null, this.last_error_)
  }else {
    if(db.version === version) {
      this.logger.finest("Existing database version " + db.version + " opened.")
    }else {
      me.logger.finest("Database version " + db.version + " opened, but require " + version + " version.")
    }
    if(!schema.isAutoVersion() && db.version < version) {
      me.logger.finest("Upgrading to version: " + version)
    }
    doVersionChange_(db, schema, false)
  }
  return df
};
ydn.db.con.WebSql.GENTLE_OPENING = true;
ydn.db.con.WebSql.TYPE = "websql";
ydn.db.con.WebSql.prototype.type = function() {
  return ydn.db.con.WebSql.TYPE
};
ydn.db.con.WebSql.prototype.last_error_ = null;
ydn.db.con.WebSql.prototype.sql_db_ = null;
ydn.db.con.WebSql.prototype.getDbInstance = function() {
  return this.sql_db_ || null
};
ydn.db.con.WebSql.isSupported = function() {
  return goog.isFunction(goog.global.openDatabase)
};
ydn.db.con.WebSql.DEBUG = false;
ydn.db.con.WebSql.prototype.logger = goog.debug.Logger.getLogger("ydn.db.con.WebSql");
ydn.db.con.WebSql.prototype.prepareCreateTable_ = function(table_schema) {
  var sql = "CREATE TABLE IF NOT EXISTS " + table_schema.getQuotedName() + " (";
  var id_column_name = table_schema.getQuotedKeyPath() || ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME;
  var type = table_schema.type || "BLOB";
  if(type == ydn.db.schema.DataType.ARRAY) {
    type = ydn.db.schema.DataType.TEXT
  }
  if(goog.isDefAndNotNull(table_schema.keyPath)) {
    sql += table_schema.getQuotedKeyPath() + " " + type + " UNIQUE PRIMARY KEY ";
    if(table_schema.autoIncrement) {
      sql += " AUTOINCREMENT "
    }
  }else {
    if(table_schema.autoIncrement) {
      sql += ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME + " " + type + " UNIQUE PRIMARY KEY AUTOINCREMENT "
    }else {
      sql += ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME + " " + type + " UNIQUE PRIMARY KEY "
    }
  }
  sql += " ," + ydn.db.base.DEFAULT_BLOB_COLUMN + " " + ydn.db.schema.DataType.BLOB;
  var sqls = [];
  var sep = ", ";
  for(var i = 0;i < table_schema.indexes.length;i++) {
    var index = table_schema.indexes[i];
    var unique = index.unique ? " UNIQUE " : " ";
    var idx_sql = "CREATE " + unique + " INDEX IF NOT EXISTS " + goog.string.quote(index.name) + " ON " + table_schema.getQuotedName() + " (" + id_column_name + ")";
    sqls.push(idx_sql);
    if(index.keyPath == table_schema.keyPath) {
      continue
    }
    sql += sep + goog.string.quote(index.keyPath) + " " + index.getType() + unique
  }
  sql += ");";
  sqls.unshift(sql);
  return sqls
};
ydn.db.con.WebSql.prototype.getSchema = function(callback, trans, db) {
  db = db || this.sql_db_;
  var version = db && db.version ? parseInt(db.version, 10) : undefined;
  version = isNaN(version) ? undefined : version;
  var stores = [];
  var success_callback = function(transaction, results) {
    for(var i = 0;i < results.rows.length;i++) {
      var info = results.rows.item(i);
      if(info.name == "__WebKitDatabaseInfoTable__") {
        continue
      }
      if(info.type == "table") {
        var str = info.sql.substr(info.sql.indexOf("("), info.sql.lastIndexOf(")"));
        var column_infos = ydn.string.split_comma_seperated(str);
        var key_name = "";
        var key_type;
        var indexes = [];
        var autoIncrement = false;
        for(var j = 0;j < column_infos.length;j++) {
          var fields = ydn.string.split_space_seperated(column_infos[j]);
          var name = goog.string.stripQuotes(fields[0], '"');
          var type = ydn.db.schema.Index.toType(fields[1]);
          if(fields.indexOf("PRIMARY") != -1 && fields.indexOf("KEY") != -1) {
            key_name = name;
            key_type = type;
            if(fields.indexOf("AUTOINCREMENT") != -1) {
              autoIncrement = true
            }
          }else {
            if(name != ydn.db.base.DEFAULT_BLOB_COLUMN) {
              var unique = fields[2] == "UNIQUE";
              var index = new ydn.db.schema.Index(name, type, unique);
              indexes.push(index)
            }
          }
        }
        var store = new ydn.db.schema.Store(info.name, key_name, autoIncrement, key_type, indexes);
        stores.push(store)
      }
    }
    var out = new ydn.db.schema.Database(version, stores);
    callback(out)
  };
  var error_callback = function(tr, error) {
    if(ydn.db.con.WebSql.DEBUG) {
      window.console.log([tr, error])
    }
    throw error;
  };
  if(!trans) {
    var me = this;
    var tx_error_callback = function(e) {
      me.logger.severe("opening tx: " + e.message);
      throw e;
    };
    db.readTransaction(function(tx) {
      me.getSchema(callback, tx, db)
    }, tx_error_callback, success_callback);
    return
  }
  var sql = "SELECT * FROM sqlite_master";
  trans.executeSql(sql, [], success_callback, error_callback)
};
ydn.db.con.WebSql.prototype.update_store_ = function(trans, store_schema, callback) {
  var me = this;
  this.getSchema(function(table_infos) {
    var table_info = table_infos.getStore(store_schema.name);
    me.update_store_with_info_(trans, store_schema, callback, table_info)
  }, trans)
};
ydn.db.con.WebSql.prototype.update_store_with_info_ = function(trans, store_schema, callback, table_info) {
  var me = this;
  var sqls = this.prepareCreateTable_(store_schema);
  if(ydn.db.con.WebSql.DEBUG) {
    window.console.log([sqls, table_info])
  }
  var count = 0;
  var exe_sql = function(sql) {
    var success_callback = function(transaction, results) {
      count++;
      if(count == sqls.length) {
        callback(true)
      }
    };
    var error_callback = function(tr, error) {
      if(ydn.db.con.WebSql.DEBUG) {
        window.console.log([tr, error])
      }
      throw new ydn.db.SQLError(error, "Error creating table: " + store_schema.name + " " + sql);
    };
    trans.executeSql(sql, [], success_callback, error_callback)
  };
  var action = "Create";
  if(table_info) {
    if(store_schema.similar(table_info)) {
      me.logger.finest(store_schema.name + " exists.");
      callback(true);
      return
    }else {
      action = "Modify"
    }
  }
  me.logger.finest(action + " table: " + store_schema.name + ": " + sqls.join(";"));
  for(var i = 0;i < sqls.length;i++) {
    exe_sql(sqls[i])
  }
};
ydn.db.con.WebSql.prototype.isReady = function() {
  return!!this.sql_db_
};
ydn.db.con.WebSql.prototype.close = function() {
};
ydn.db.con.WebSql.prototype.doTransaction = function(trFn, scopes, mode, completed_event_handler) {
  var me = this;
  var transaction_callback = function(tx) {
    trFn(tx)
  };
  var success_callback = function() {
    completed_event_handler(ydn.db.base.TransactionEventTypes.COMPLETE, {"type":ydn.db.base.TransactionEventTypes.COMPLETE})
  };
  var error_callback = function(e) {
    me.logger.finest(me + ": Tx " + mode + " request cause error.");
    completed_event_handler(ydn.db.base.TransactionEventTypes.ERROR, e)
  };
  if(goog.isNull(this.sql_db_)) {
    trFn(null);
    completed_event_handler(ydn.db.base.TransactionEventTypes.ERROR, this.last_error_)
  }
  if(mode == ydn.db.base.TransactionMode.READ_ONLY) {
    this.sql_db_.readTransaction(transaction_callback, error_callback, success_callback)
  }else {
    if(mode == ydn.db.base.TransactionMode.VERSION_CHANGE) {
      var next_version = this.sql_db_.version + 1;
      this.sql_db_.changeVersion(this.sql_db_.version, next_version + "", transaction_callback, error_callback, success_callback)
    }else {
      this.sql_db_.transaction(transaction_callback, error_callback, success_callback)
    }
  }
};
ydn.db.con.WebSql.deleteDatabase = function(db_name) {
  var db = new ydn.db.con.WebSql;
  var schema = new ydn.db.schema.EditableDatabase;
  var df = db.connect(db_name, schema);
  var on_completed = function(t, e) {
    db.logger.info("all tables in " + db_name + " deleted.")
  };
  df.addCallback(function() {
    db.doTransaction(function delete_tables(tx) {
      db.getSchema(function get_schema(existing_schema) {
        var n = existing_schema.count();
        if(n > 0) {
          for(var i = 0;i < n;i++) {
            var store = existing_schema.store(i);
            db.logger.finer("deleting table: " + store.getName());
            tx.executeSql("DROP TABLE " + store.getQuotedName())
          }
        }else {
          db.logger.info("no table to delete in " + db_name)
        }
      }, tx)
    }, [], ydn.db.base.TransactionMode.READ_WRITE, on_completed)
  });
  df.addErrback(function() {
    db.logger.warning("Connecting " + db_name + " failed.")
  })
};
goog.provide("ydn.db");
goog.require("ydn.db.con.IndexedDb");
goog.require("ydn.db.con.WebSql");
goog.require("ydn.db.utils");
ydn.db.deleteDatabase = function(db_name) {
  if(ydn.db.con.IndexedDb.indexedDb && "deleteDatabase" in ydn.db.con.IndexedDb.indexedDb) {
    ydn.db.con.IndexedDb.indexedDb.deleteDatabase(db_name)
  }
  ydn.db.con.WebSql.deleteDatabase(db_name);
  ydn.db.con.LocalStorage.deleteDatabase(db_name);
  ydn.db.con.SessionStorage.deleteDatabase(db_name)
};
ydn.db.cmp_ = function(first, second) {
  first = ydn.db.utils.encodeKey(first);
  second = ydn.db.utils.encodeKey(second);
  return first > second ? 1 : first == second ? 0 : -1
};
ydn.db.cmp = function(first, second) {
  if(ydn.db.con.IndexedDb.indexedDb) {
    return ydn.db.con.IndexedDb.indexedDb["cmp"](first, second)
  }else {
    first = ydn.db.utils.encodeKey(first);
    second = ydn.db.utils.encodeKey(second);
    return first > second ? 1 : first == second ? 0 : -1
  }
};
goog.provide("ydn.db.algo.AbstractSolver");
goog.require("goog.debug.Logger");
goog.require("ydn.db.Streamer");
goog.require("ydn.db");
ydn.db.algo.AbstractSolver = function(out, limit) {
  if(goog.DEBUG && goog.isDefAndNotNull(out) && !("push" in out)) {
    throw new ydn.error.ArgumentException;
  }
  this.out = out || null;
  this.limit = limit;
  this.match_count = 0
};
ydn.db.algo.AbstractSolver.prototype.logger = goog.debug.Logger.getLogger("ydn.db.algo.AbstractSolver");
ydn.db.algo.AbstractSolver.prototype.out = null;
ydn.db.algo.AbstractSolver.prototype.begin = function(iterators, callback) {
  return false
};
ydn.db.algo.AbstractSolver.prototype.pusher = function(advance, keys, values) {
  var has_key = goog.isDefAndNotNull(keys[0]);
  var match_key = keys[0];
  for(var i = 1;i < keys.length;i++) {
    if(goog.isDefAndNotNull(keys[i])) {
      has_key = true;
      if(goog.isDefAndNotNull(match_key) && ydn.db.cmp(keys[i], match_key) != 0) {
        match_key = null;
        break
      }
    }else {
      match_key = null
    }
  }
  if(goog.isDefAndNotNull(match_key)) {
    this.match_count++;
    if(this.out) {
      this.out.push(match_key)
    }
    if(goog.isDef(this.limit) && this.match_count >= this.limit) {
      return[]
    }
  }
  return advance
};
ydn.db.algo.AbstractSolver.prototype.solver = function(input, output) {
  return[]
};
ydn.db.algo.AbstractSolver.prototype.finish = function(callback) {
  return false
};
goog.provide("ydn.db.ICursor");
ydn.db.ICursor = function() {
};
ydn.db.ICursor.prototype.key = goog.abstractMethod;
ydn.db.ICursor.prototype.indexKey = goog.abstractMethod;
ydn.db.ICursor.prototype.dispose = goog.abstractMethod;
goog.provide("ydn.db.IDBCursor");
goog.require("ydn.db.ICursor");
ydn.db.IDBCursor = function(cursor, peerCursors) {
  this.cursor_ = cursor;
  this.peerCursors_ = peerCursors
};
ydn.db.IDBCursor.prototype.cursor_ = null;
ydn.db.IDBCursor.prototype.peerCursors_ = null;
ydn.db.IDBCursor.prototype.dispose = function() {
  this.cursor_ = null;
  this.peerCursors_ = null
};
ydn.db.IDBCursor.prototype.key = function(i) {
  if(!this.cursor_) {
    throw new ydn.db.InvalidStateError;
  }
  if(!goog.isDef(i) || i == 0) {
    return this.cursor_.key
  }else {
    i--;
    if(i > 0 && i < this.peerCursors_.length) {
      return this.peerCursors_[i].key
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
};
ydn.db.IDBCursor.prototype.indexKey = function(i) {
  if(!this.cursor_) {
    throw new ydn.db.InvalidStateError;
  }
  if(!goog.isDef(i) || i == 0) {
    return this.cursor_.primaryKey
  }else {
    i--;
    if(i > 0 && i < this.peerCursors_.length) {
      return this.peerCursors_[i].primaryKey
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
};
goog.provide("ydn.db.IValueCursor");
goog.require("ydn.db.ICursor");
ydn.db.IValueCursor = function() {
};
ydn.db.IValueCursor.prototype.value = goog.abstractMethod;
ydn.db.IValueCursor.prototype.update = goog.abstractMethod;
ydn.db.IValueCursor.prototype.clear = goog.abstractMethod;
goog.provide("ydn.db.IDBValueCursor");
goog.require("ydn.db.IValueCursor");
ydn.db.IDBValueCursor = function(cursor, peerCursors, readonly) {
  this.cursor_ = cursor;
  this.peerCursors_ = peerCursors;
  this.readonly_ = readonly
};
ydn.db.IDBValueCursor.prototype.cursor_ = null;
ydn.db.IDBValueCursor.prototype.peerCursors_ = null;
ydn.db.IDBValueCursor.prototype.readonly_ = true;
ydn.db.IDBValueCursor.prototype.dispose = function() {
  this.cursor_ = null;
  this.peerCursors_ = null
};
ydn.db.IDBValueCursor.prototype.key = function(i) {
  if(!this.cursor_) {
    throw new ydn.error.InvalidOperationException;
  }
  if(!goog.isDef(i) || i == 0) {
    return this.cursor_.key
  }else {
    i--;
    if(i > 0 && i < this.peerCursors_.length) {
      return this.peerCursors_[i].key
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
};
ydn.db.IDBValueCursor.prototype.indexKey = function(i) {
  if(!this.cursor_) {
    throw new ydn.error.InvalidOperationException;
  }
  if(!goog.isDef(i) || i == 0) {
    return this.cursor_.primaryKey
  }else {
    i--;
    if(i > 0 && i < this.peerCursors_.length) {
      return this.peerCursors_[i].primaryKey
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
};
ydn.db.IDBValueCursor.prototype.value = function(i) {
  if(!this.cursor_) {
    throw new ydn.error.InvalidOperationException;
  }
  if(!goog.isDef(i) || i == 0) {
    return this.cursor_.value
  }else {
    i--;
    if(i > 0 && i < this.peerCursors_.length) {
      return this.peerCursors_[i].value
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
};
ydn.db.IDBValueCursor.prototype.update = function(value, i) {
  if(this.readonly_) {
    throw new ydn.error.ArgumentException;
  }
  if(!this.cursor_) {
    throw new ydn.error.InvalidOperationException;
  }
  var cur;
  if(!goog.isDef(i) || i == 0) {
    cur = this.cursor_
  }else {
    i--;
    if(i > 0 && i < this.peerCursors_.length) {
      cur = this.peerCursors_[i]
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
  var req = cur.update(value);
  var del_df = new goog.async.Deferred;
  req.onerror = function(e) {
    del_df.errback(e)
  };
  req.onsuccess = function(x) {
    del_df.callback(x)
  };
  return del_df
};
ydn.db.IDBValueCursor.prototype.clear = function(i) {
  if(this.readonly_) {
    throw new ydn.error.ArgumentException;
  }
  if(!this.cursor_) {
    throw new ydn.error.InvalidOperationException;
  }
  var cur;
  if(!goog.isDef(i) || i == 0) {
    cur = this.cursor_
  }else {
    i--;
    if(i > 0 && i < this.peerCursors_.length) {
      cur = this.peerCursors_[i]
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
  var req = cur["delete"]();
  var del_df = new goog.async.Deferred;
  req.onerror = function(e) {
    del_df.errback(e)
  };
  req.onsuccess = function(x) {
    del_df.callback(x)
  };
  return del_df
};
goog.provide("ydn.db.index.req.IDBCursor");
goog.require("ydn.db.index.req.AbstractCursor");
ydn.db.index.req.IDBCursor = function(obj_store, store_name, index_name, keyRange, direction, key_only, ini_key, ini_index_key) {
  goog.base(this, store_name, index_name, keyRange, direction, key_only);
  goog.asserts.assert(obj_store);
  this.obj_store = obj_store;
  this.index = null;
  if(goog.isDefAndNotNull(index_name)) {
    if(obj_store.indexNames.contains(index_name)) {
      this.index = obj_store.index(index_name)
    }else {
      if(obj_store.keyPath != index_name) {
        throw new ydn.db.InternalError('index "' + index_name + '" not found in ' + obj_store.name);
      }
    }
  }
  this.cur = null;
  this.target_key_ = null;
  this.target_index_key_ = null;
  this.target_exclusive_ = false;
  this.has_pending_request_ = false
};
goog.inherits(ydn.db.index.req.IDBCursor, ydn.db.index.req.AbstractCursor);
ydn.db.index.req.IDBCursor.DEBUG = false;
ydn.db.index.req.IDBCursor.prototype.logger = goog.debug.Logger.getLogger("ydn.db.index.req.IDBCursor");
ydn.db.index.req.IDBCursor.prototype.obj_store = null;
ydn.db.index.req.IDBCursor.prototype.index = null;
ydn.db.index.req.IDBCursor.prototype.cur = null;
ydn.db.index.req.IDBCursor.prototype.requestOnSuccess = function(event) {
  var label = "IDBCursor: " + this.store_name + ":" + this.index_name;
  this.has_pending_request_ = false;
  var target = event.target;
  var cur = event.target.result;
  this.cur = cur;
  if(cur) {
    if(goog.isDefAndNotNull(this.target_index_key_)) {
      var index_cmp = ydn.db.con.IndexedDb.indexedDb.cmp(cur.key, this.target_index_key_);
      if(index_cmp === 1) {
        this.target_key_ = null;
        this.target_index_key_ = null;
        this.onSuccess(cur.primaryKey, cur.key, cur.value);
        return
      }else {
        if(index_cmp === 0) {
          this.target_index_key_ = null
        }else {
          cur["continue"]();
          return
        }
      }
    }
    if(goog.isDefAndNotNull(this.target_key_)) {
      var primary_cmp = ydn.db.con.IndexedDb.indexedDb.cmp(this.target_key_, cur.primaryKey);
      if(primary_cmp === 0) {
        this.target_key_ = null;
        if(this.target_exclusive_) {
          this.target_exclusive_ = false;
          cur["continue"]()
        }else {
          this.onSuccess(cur.primaryKey, cur.key, cur.value)
        }
      }else {
        if(primary_cmp === 1) {
          cur["continue"]()
        }else {
          this.target_key_ = null;
          this.onSuccess(cur.primaryKey, cur.key, cur.value)
        }
      }
    }else {
      this.onSuccess(cur.primaryKey, cur.key, cur.value)
    }
  }else {
    this.target_index_key_ = null;
    this.target_key_ = null;
    this.target_exclusive_ = false;
    this.logger.finest(label + " completed.");
    this.onSuccess(undefined, undefined, undefined)
  }
};
ydn.db.index.req.IDBCursor.prototype.target_key_ = null;
ydn.db.index.req.IDBCursor.prototype.target_index_key_ = null;
ydn.db.index.req.IDBCursor.prototype.target_exclusive_ = false;
ydn.db.index.req.IDBCursor.prototype.has_pending_request_ = false;
ydn.db.index.req.IDBCursor.prototype.open_request = function(ini_key, ini_index_key, exclusive) {
  var label = "IDBCursor: " + this.store_name + ":" + this.index_name;
  this.target_key_ = ini_key;
  this.target_index_key_ = ini_index_key;
  this.target_exclusive_ = !!exclusive;
  var key_range = this.key_range;
  if(goog.isDefAndNotNull(ini_index_key)) {
    if(goog.isDefAndNotNull(this.key_range)) {
      var cmp = ydn.db.con.IndexedDb.indexedDb.cmp(ini_index_key, this.key_range.lower);
      if(cmp == 1) {
        this.logger.finest(label + " not opened, index key out of range " + ini_index_key + ">=" + this.key_range.lower);
        this.onNext(undefined, undefined, undefined);
        return
      }
      key_range = ydn.db.IDBKeyRange.bound(ini_index_key, this.key_range.upper, false, this.key_range.upperOpen)
    }else {
      key_range = ydn.db.IDBKeyRange.lowerBound(ini_index_key)
    }
  }
  var request;
  if(this.key_only) {
    if(this.index) {
      if(goog.isDefAndNotNull(this.dir)) {
        request = this.index.openKeyCursor(key_range, this.dir)
      }else {
        if(goog.isDefAndNotNull(key_range)) {
          request = this.index.openKeyCursor(key_range)
        }else {
          request = this.index.openKeyCursor()
        }
      }
    }else {
      if(goog.isDefAndNotNull(this.dir)) {
        request = this.obj_store.openCursor(key_range, this.dir)
      }else {
        if(goog.isDefAndNotNull(key_range)) {
          request = this.obj_store.openCursor(key_range)
        }else {
          request = this.obj_store.openCursor()
        }
      }
    }
  }else {
    if(this.index) {
      if(goog.isDefAndNotNull(this.dir)) {
        request = this.index.openCursor(key_range, this.dir)
      }else {
        if(goog.isDefAndNotNull(key_range)) {
          request = this.index.openCursor(key_range)
        }else {
          request = this.index.openCursor()
        }
      }
    }else {
      if(goog.isDefAndNotNull(this.dir)) {
        request = this.obj_store.openCursor(key_range, this.dir)
      }else {
        if(goog.isDefAndNotNull(key_range)) {
          request = this.obj_store.openCursor(key_range)
        }else {
          request = this.obj_store.openCursor()
        }
      }
    }
  }
  this.has_pending_request_ = true;
  this.logger.finest(label + " opened, request " + request.readyState);
  request.onsuccess = goog.bind(this.requestOnSuccess, this);
  request.onerror = goog.bind(this.onError, this)
};
ydn.db.index.req.IDBCursor.prototype.advance = function(count) {
  if(this.cur) {
    this.cur.advance(count)
  }else {
    var label = "IDBCursor:" + this.store_name + ":" + this.index_name;
    throw new ydn.error.InvalidOperationError(label + " cursor gone.");
  }
};
ydn.db.index.req.IDBCursor.prototype.forward = function(next_position) {
  var label = "IDBCursor:" + this.store_name + ":" + this.index_name;
  if(next_position === false) {
    this.logger.finest(label + " restarting.");
    this.open_request()
  }else {
    if(this.cur) {
      if(next_position === true) {
        this.cur["continue"]()
      }else {
        if(goog.isDefAndNotNull(next_position)) {
          this.cur["continue"](next_position)
        }else {
          this.onSuccess(undefined, undefined, undefined);
          this.logger.finest(label + " resting.")
        }
      }
    }else {
      throw new ydn.error.InvalidOperationError(label + " cursor gone.");
    }
  }
};
ydn.db.index.req.IDBCursor.prototype.hasCursor = function() {
  return!!this.cur
};
ydn.db.index.req.IDBCursor.prototype.getIndexKey = function() {
  return this.cur.key
};
ydn.db.index.req.IDBCursor.prototype.getPrimaryKey = function() {
  return this.cur.primaryKey
};
ydn.db.index.req.IDBCursor.prototype.getValue = function() {
  return this.cur.value
};
ydn.db.index.req.IDBCursor.prototype.seek = function(next_primary_key, next_index_key, exclusive) {
  var label = "IDBCursor:" + this.store_name + ":" + this.index_name;
  if(goog.DEBUG && this.has_pending_request_) {
    throw new ydn.db.InternalError(label + " has pending request.");
  }
  this.target_index_key_ = next_index_key;
  this.target_key_ = next_primary_key;
  this.target_exclusive_ = !!exclusive;
  if(this.cur) {
    var value = this.key_only ? this.cur.key : this.cur["value"];
    var primary_cmp = ydn.db.con.IndexedDb.indexedDb.cmp(next_primary_key, this.cur.primaryKey);
    var primary_on_track = primary_cmp == 0 || primary_cmp == 1 && !this.reverse || primary_cmp == -1 && this.reverse;
    if(ydn.db.index.req.IDBCursor.DEBUG) {
      var s = primary_cmp === 0 ? "next" : primary_cmp === 1 ? "on track" : "wrong track";
      window.console.log(this + " seek " + next_primary_key + ":" + next_index_key + " " + s)
    }
    if(goog.isDefAndNotNull(next_index_key)) {
      var index_cmp = ydn.db.con.IndexedDb.indexedDb.cmp(this.cur.key, next_index_key);
      var index_on_track = index_cmp == 1 && !this.reverse || index_cmp == -1 && this.reverse;
      if(index_cmp === 0) {
        if(goog.DEBUG && primary_cmp === 0) {
          throw new ydn.error.InternalError(label + " cursor cannot seek to current position");
        }else {
          if(primary_on_track) {
            this.has_pending_request_ = true;
            this.cur["continue"]()
          }else {
            this.open_request(next_primary_key, next_index_key)
          }
        }
      }else {
        if(index_on_track) {
          this.cur["continue"](next_index_key)
        }else {
          this.logger.finest(label + " restarting for " + next_primary_key);
          this.open_request(next_primary_key, next_index_key)
        }
      }
    }else {
      if(primary_cmp === 0) {
        if(goog.DEBUG && !exclusive) {
          throw new ydn.db.InternalError(label + "cursor cannot seek to current position");
        }
        this.has_pending_request_ = true;
        this.cur["continue"]()
      }else {
        if(primary_on_track) {
          this.has_pending_request_ = true;
          this.cur["continue"]()
        }else {
          this.open_request(next_primary_key, next_index_key, exclusive)
        }
      }
    }
  }else {
    throw new ydn.db.InternalError(label + " cursor gone.");
  }
};
ydn.db.index.req.IDBCursor.prototype.update = function(record, index) {
  var idx = goog.isDef(index) ? index : 0;
  if(this.cur) {
    var df = new goog.async.Deferred;
    var req = this.cur.update(record);
    req.onsuccess = function(x) {
      df.callback(x)
    };
    req.onerror = function(e) {
      df.errback(e)
    };
    return df
  }else {
    throw new ydn.db.InvalidAccessError("cursor gone");
  }
};
goog.provide("ydn.db.index.req.IndexedDb");
goog.require("ydn.db.core.req.IndexedDb");
goog.require("ydn.db.index.req.IRequestExecutor");
goog.require("ydn.db.algo.AbstractSolver");
goog.require("ydn.db.IDBCursor");
goog.require("ydn.db.IDBValueCursor");
goog.require("ydn.db.index.req.IDBCursor");
goog.require("ydn.error");
goog.require("ydn.json");
ydn.db.index.req.IndexedDb = function(dbname, schema) {
  goog.base(this, dbname, schema)
};
goog.inherits(ydn.db.index.req.IndexedDb, ydn.db.core.req.IndexedDb);
ydn.db.index.req.IndexedDb.DEBUG = false;
ydn.db.index.req.IndexedDb.prototype.logger = goog.debug.Logger.getLogger("ydn.db.index.req.IndexedDb");
ydn.db.index.req.IndexedDb.prototype.getByIterator = function(df, q) {
  var req = q.iterate(this);
  req.onError = function(e) {
    df.errback(e)
  };
  req.onNext = function(primary_key, key, value) {
    q.exit();
    df.callback(q.isKeyOnly() ? key : value)
  }
};
ydn.db.index.req.IndexedDb.prototype.getTx = function() {
  return this.tx
};
ydn.db.index.req.IndexedDb.prototype.keysByIterator = function(df, iter, limit, offset) {
  var arr = [];
  var cursor = iter.iterate(this);
  cursor.onError = function(e) {
    df.errback(e)
  };
  var count = 0;
  var cued = false;
  cursor.onNext = function(primary_key, key, value) {
    if(goog.isDef(key)) {
      if(!cued && offset > 0) {
        cursor.advance(offset);
        cued = true;
        return
      }
      count++;
      arr.push(key);
      if(!goog.isDef(limit) || count < limit) {
        cursor.forward(true)
      }else {
        iter.exit();
        df.callback(arr)
      }
    }else {
      df.callback(arr)
    }
  }
};
ydn.db.index.req.IndexedDb.prototype.listByIterator = function(df, iter, limit, offset) {
  var arr = [];
  var cursor = iter.iterate(this);
  cursor.onError = function(e) {
    df.errback(e)
  };
  var count = 0;
  var cued = false;
  cursor.onNext = function(primary_key, key, value) {
    if(goog.isDef(key)) {
      if(!cued && offset > 0) {
        cursor.advance(offset);
        cued = true;
        return
      }
      count++;
      arr.push(iter.isKeyOnly() ? primary_key : value);
      if(!goog.isDef(limit) || count < limit) {
        cursor.forward(true)
      }else {
        iter.exit();
        df.callback(arr)
      }
    }else {
      df.callback(arr)
    }
  }
};
ydn.db.index.req.IndexedDb.prototype.getCursor = function(store_name, index_name, keyRange, direction, key_only, ini_key, ini_index_key) {
  var obj_store = this.getTx().objectStore(store_name);
  return new ydn.db.index.req.IDBCursor(obj_store, store_name, index_name, keyRange, direction, key_only, ini_key, ini_index_key)
};
ydn.db.index.req.IndexedDb.prototype.getStreamer = function(store_name, index_name, foreign_index_name) {
  return new ydn.db.Streamer(this.getTx(), store_name, index_name, foreign_index_name)
};
goog.provide("ydn.db.WebsqlCursor");
goog.require("ydn.db.IValueCursor");
ydn.db.WebsqlCursor = function(tx, key, indexKey, value, peerKeys, peerIndexKeys, peerValues) {
  this.tx_ = tx;
  this.key_ = key;
  this.indexKey_ = indexKey;
  this.value_ = value;
  this.peerKeys_ = peerKeys;
  this.peerIndexKeys_ = peerIndexKeys;
  this.peerValues_ = peerValues
};
ydn.db.WebsqlCursor.prototype.tx_ = null;
ydn.db.WebsqlCursor.prototype.key_ = null;
ydn.db.WebsqlCursor.prototype.indexKey_ = null;
ydn.db.WebsqlCursor.prototype.value_ = null;
ydn.db.WebsqlCursor.prototype.peerKeys_ = null;
ydn.db.WebsqlCursor.prototype.peerIndexKeys_ = null;
ydn.db.WebsqlCursor.prototype.peerValues_ = null;
ydn.db.WebsqlCursor.prototype.dispose = function() {
  this.tx_ = null;
  this.key_ = null;
  this.indexKey_ = null;
  this.value_ = null;
  this.peerKeys_ = null;
  this.peerIndexKeys_ = null;
  this.peerValues_ = null
};
ydn.db.WebsqlCursor.prototype.key = function(i) {
  if(!goog.isDefAndNotNull(this.key_)) {
    throw new ydn.db.InvalidStateError;
  }
  if(!goog.isDef(i) || i == 0) {
    return this.key_
  }else {
    i--;
    if(i > 0 && i < this.peerKeys_.length) {
      return this.peerKeys_[i]
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
};
ydn.db.WebsqlCursor.prototype.indexKey = function(i) {
  if(!goog.isDef(i) || i == 0) {
    return this.indexKey_
  }else {
    i--;
    if(i > 0 && i < this.peerIndexKeys_.length) {
      return this.peerIndexKeys_[i]
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
};
ydn.db.WebsqlCursor.prototype.value = function(i) {
  if(!goog.isDef(i) || i == 0) {
    return this.value_
  }else {
    i--;
    if(i > 0 && i < this.peerValues_.length) {
      return this.peerValues_[i]
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
};
ydn.db.WebsqlCursor.prototype.clear = function(i) {
  throw new ydn.error.InvalidOperationException;
};
ydn.db.WebsqlCursor.prototype.update = function(value, i) {
  throw new ydn.error.InvalidOperationException;
};
goog.provide("ydn.db.index.req.WebsqlCursor");
goog.require("ydn.db.index.req.AbstractCursor");
ydn.db.index.req.WebsqlCursor = function(tx, store_schema, store_name, index_name, keyRange, direction, key_only, ini_key, ini_index_key) {
  goog.base(this, store_name, index_name, keyRange, direction, key_only);
  goog.asserts.assert(tx);
  this.tx = tx;
  goog.asserts.assert(store_schema);
  this.store_schema_ = store_schema;
  this.cache_primary_keys_ = null;
  this.cache_keys_ = null;
  this.cache_values_ = null;
  this.open_request(ini_key, ini_index_key)
};
goog.inherits(ydn.db.index.req.WebsqlCursor, ydn.db.index.req.AbstractCursor);
ydn.db.index.req.WebsqlCursor.DEBUG = false;
ydn.db.index.req.WebsqlCursor.prototype.logger = goog.debug.Logger.getLogger("ydn.db.index.req.WebsqlCursor");
ydn.db.index.req.WebsqlCursor.prototype.tx;
ydn.db.index.req.WebsqlCursor.prototype.store_schema_ = null;
ydn.db.index.req.WebsqlCursor.prototype.current_key_ = null;
ydn.db.index.req.WebsqlCursor.prototype.current_primary_key_ = null;
ydn.db.index.req.WebsqlCursor.prototype.current_value_ = null;
ydn.db.index.req.WebsqlCursor.prototype.cache_keys_ = null;
ydn.db.index.req.WebsqlCursor.prototype.cache_primary_keys_ = null;
ydn.db.index.req.WebsqlCursor.prototype.cache_values_ = null;
ydn.db.index.req.WebsqlCursor.prototype.open_request = function(ini_key, ini_index_key, exclusive) {
  var label = this.store_name + ":" + this.index_name;
  this.cache_primary_keys_ = [];
  this.cache_keys_ = [];
  this.cache_values_ = [];
  var key_range = this.key_range;
  if(goog.isDefAndNotNull(ini_index_key)) {
    if(goog.isDefAndNotNull(this.key_range)) {
      var cmp = ydn.db.con.IndexedDb.indexedDb.cmp(ini_index_key, this.key_range.upper);
      if(cmp == 1 || cmp == 0 && !this.key_range.upperOpen) {
        this.onNext(undefined, undefined, undefined);
        return
      }
      key_range = ydn.db.IDBKeyRange.bound(ini_index_key, this.key_range.upper, false, this.key_range.upperOpen)
    }else {
      key_range = ydn.db.IDBKeyRange.lowerBound(ini_index_key)
    }
  }
  var me = this;
  var request;
  var sqls = ["SELECT"];
  var params = [];
  var column_name = this.index_name ? this.index_name : ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME;
  var q_column_name = goog.string.quote(column_name);
  var primary_column_name = this.store_schema_.getColumnName();
  var q_primary_column_name = goog.string.quote(primary_column_name);
  sqls.push(this.key_only ? q_column_name + ", " + q_primary_column_name : "*");
  sqls.push("FROM " + goog.string.quote(this.store_name));
  var where_clause = ydn.db.Where.toWhereClause(column_name, key_range);
  if(where_clause.sql) {
    sqls.push("WHERE " + where_clause.sql);
    params = params.concat(where_clause.params)
  }
  if(goog.isDefAndNotNull(ini_key)) {
    if(where_clause.sql) {
      sqls.push("AND " + ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME + " = ?");
      params.push(ini_key)
    }else {
      sqls.push("WHERE " + ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME + " = ?");
      params.push(ini_key)
    }
  }
  var order = this.reverse ? "DESC" : "ASC";
  sqls.push(" ORDER BY " + q_column_name + " " + order);
  if(this.key_only) {
    sqls.push(" LIMIT " + 100)
  }else {
    sqls.push(" LIMIT " + 1)
  }
  this.has_pending_request = true;
  var onSuccess = function(transaction, results) {
    me.has_pending_request = false;
    var n = results.rows.length;
    for(var i = 0;i < n;i++) {
      var row = results.rows.item(i);
      me.cache_primary_keys_[i] = ydn.db.schema.Index.sql2js(row[primary_column_name], me.store_schema_.getType());
      if(me.key_only) {
        me.cache_keys_[i] = ydn.db.schema.Index.sql2js(row[column_name], me.store_schema_.getType())
      }else {
        if(goog.isDefAndNotNull(row)) {
          me.cache_values_[i] = ydn.db.core.req.WebSql.parseRow(row, me.store_schema_)
        }
      }
    }
    if(ydn.db.index.req.WebsqlCursor.DEBUG) {
      window.console.log(["onSuccess", n, results.rows, me.cache_primary_keys_, me.cache_keys_, me.cache_values_])
    }
    if(n > 0) {
      me.current_primary_key_ = me.cache_primary_keys_.shift();
      me.current_key_ = me.cache_keys_.shift();
      me.current_value_ = me.cache_values_.shift();
      me.onSuccess(me.current_primary_key_, me.current_key_, me.current_value_)
    }else {
      me.logger.finest("Iterator: " + label + " completed.");
      me.onSuccess(undefined, undefined, undefined)
    }
  };
  var onError = function(tr, error) {
    if(ydn.db.index.req.WebsqlCursor.DEBUG) {
      window.console.log([sql, tr, error])
    }
    me.logger.warning("get error: " + error.message);
    me.onError(error);
    return true
  };
  var sql = sqls.join(" ");
  me.logger.finest("Iterator: " + label + " opened: " + sql);
  this.tx.executeSql(sql, params, onSuccess, onError)
};
ydn.db.index.req.WebsqlCursor.prototype.forward = function(next_position) {
  var label = this.store_name + ":" + this.index_name;
  if(next_position === false) {
    this.logger.finest("Iterator: " + label + " restarting.");
    this.open_request()
  }else {
    if(this.hasCursor()) {
      if(goog.isDefAndNotNull(next_position)) {
        if(goog.isArray(this.cache_keys_) && this.cache_keys_.length > 0) {
          if(next_position === true) {
            this.current_primary_key_ = this.cache_primary_keys_.shift();
            this.current_key_ = this.cache_keys_.shift();
            this.current_value_ = this.cache_values_.shift();
            this.onSuccess(this.current_primary_key_, this.current_key_, this.current_value_)
          }else {
            do {
              this.current_primary_key_ = this.cache_primary_keys_.shift();
              this.current_key_ = this.cache_keys_.shift();
              this.current_value_ = this.cache_values_.shift();
              if(!goog.isDef(this.current_key_)) {
                this.open_request(null, next_position);
                return
              }
              if(ydn.db.cmp(this.current_key_, next_position) == 0) {
                this.onSuccess(this.current_primary_key_, this.current_key_, this.current_value_);
                return
              }
            }while(goog.isDefAndNotNull(this.current_primary_key_));
            this.open_request(null, next_position)
          }
        }else {
          if(next_position === true) {
            this.open_request(this.current_primary_key_, this.current_key_, true)
          }else {
            this.open_request(null, next_position)
          }
        }
      }else {
        this.onSuccess(undefined, undefined, undefined);
        this.current_key_ = null;
        this.current_primary_key_ = null;
        this.current_value_ = null;
        this.logger.finest("Cursor: " + label + " resting.")
      }
    }else {
      throw new ydn.error.InvalidOperationError("Iterator:" + label + " cursor gone.");
    }
  }
};
ydn.db.index.req.WebsqlCursor.prototype.hasCursor = function() {
  return goog.isDefAndNotNull(this.current_key_)
};
ydn.db.index.req.WebsqlCursor.prototype.getIndexKey = function() {
  return this.current_key_
};
ydn.db.index.req.WebsqlCursor.prototype.getPrimaryKey = function() {
  return this.current_primary_key_
};
ydn.db.index.req.WebsqlCursor.prototype.getValue = function() {
  return this.current_value_
};
ydn.db.index.req.WebsqlCursor.prototype.seek = function(next_primary_key, next_index_key, inclusive) {
  throw new ydn.error.NotImplementedException;
};
goog.provide("ydn.db.index.req.WebSql");
goog.require("goog.async.Deferred");
goog.require("goog.debug.Logger");
goog.require("goog.events");
goog.require("ydn.async");
goog.require("ydn.db.WebsqlCursor");
goog.require("ydn.json");
goog.require("ydn.db.index.req.IRequestExecutor");
goog.require("ydn.db.index.req.WebsqlCursor");
ydn.db.index.req.WebSql = function(dbname, schema) {
  goog.base(this, dbname, schema)
};
goog.inherits(ydn.db.index.req.WebSql, ydn.db.core.req.WebSql);
ydn.db.index.req.WebSql.DEBUG = false;
ydn.db.index.req.WebSql.prototype.logger = goog.debug.Logger.getLogger("ydn.db.index.req.WebSql");
ydn.db.index.req.WebSql.prototype.getByIterator = function(df, q) {
  var qdf = new goog.async.Deferred;
  this.fetchIterator_(qdf, q, false, 1);
  qdf.addCallbacks(function(results) {
    if(goog.isArray(results)) {
      df.callback(results[0])
    }else {
      df.callback()
    }
  }, function(e) {
    df.errback(e)
  })
};
ydn.db.index.req.WebSql.prototype.keysByIterator = function(df, q, limit, offset) {
  this.fetchIterator_(df, q, true, limit, offset)
};
ydn.db.index.req.WebSql.prototype.listByIterator = function(df, q, limit, offset) {
  this.fetchIterator_(df, q, false, limit, offset)
};
ydn.db.index.req.WebSql.prototype.fetchIterator_ = function(df, q, keys_method, limit, offset) {
  var me = this;
  var store = this.schema.getStore(q.getStoreName());
  var idx_name = q.getIndexName();
  var index = goog.isDef(idx_name) ? store.getIndex(idx_name) : null;
  var key_column = index ? index.getKeyPath() : goog.isDefAndNotNull(store.keyPath) ? store.keyPath : ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME;
  var column = goog.string.quote(key_column);
  var select = "SELECT";
  var fields = "*";
  if(keys_method) {
    fields = column
  }else {
    if(q.isKeyOnly()) {
      fields = goog.isDefAndNotNull(store.keyPath) ? store.getQuotedKeyPath() : ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME
    }
  }
  var from = fields + " FROM " + store.getQuotedName();
  var key_range = q.keyRange();
  var where_clause = "";
  var params = [];
  if(key_range) {
    if(ydn.db.Where.resolvedStartsWith(key_range)) {
      where_clause = column + " LIKE ?";
      params.push(key_range["lower"] + "%")
    }else {
      if(goog.isDef(key_range.lower)) {
        var lowerOp = key_range["lowerOpen"] ? " > " : " >= ";
        where_clause += " " + column + lowerOp + "?";
        params.push(key_range.lower)
      }
      if(goog.isDef(key_range["upper"])) {
        var upperOp = key_range["upperOpen"] ? " < " : " <= ";
        var and = where_clause.length > 0 ? " AND " : " ";
        where_clause += and + column + upperOp + "?";
        params.push(key_range.upper)
      }
    }
    where_clause = " WHERE " + "(" + where_clause + ")"
  }
  var dir = "ASC";
  if(q.isReversed()) {
    dir = "DESC"
  }
  var order = "ORDER BY " + column;
  var limit_offset = "";
  if(goog.isDef(limit)) {
    limit_offset = " LIMIT " + limit
  }
  if(goog.isDef(offset)) {
    limit_offset += " OFFSET " + offset
  }
  var group_by = "";
  var sql = [select, from, where_clause, group_by, order, dir, limit_offset].join(" ");
  var row_parser;
  if(keys_method || q.isKeyOnly()) {
    row_parser = function(row) {
      var value = ydn.object.takeFirst(row);
      var type = index ? index.type : store.type;
      return ydn.db.schema.Index.sql2js(value, type)
    }
  }else {
    row_parser = function(row) {
      return ydn.db.core.req.WebSql.parseRow(row, store)
    }
  }
  var callback = function(transaction, results) {
    var result = [];
    var idx = -1;
    var n = results.rows.length;
    for(var i = 0;i < n;i++) {
      var row = results.rows.item(i);
      result.push(row_parser(row))
    }
    df.callback(result)
  };
  var error_callback = function(tr, error) {
    if(ydn.db.index.req.WebSql.DEBUG) {
      window.console.log([q, tr, error])
    }
    me.logger.warning("Sqlite error: " + error.message);
    df.errback(error);
    return true
  };
  if(ydn.db.index.req.WebSql.DEBUG) {
    window.console.log([sql, ydn.json.stringify(params)])
  }
  this.tx.executeSql(sql, params, callback, error_callback)
};
ydn.db.index.req.WebSql.prototype.getIndexKeysByKeys = goog.abstractMethod;
ydn.db.index.req.WebSql.prototype.getKeysByIndexKeyRange = goog.abstractMethod;
ydn.db.index.req.WebSql.prototype.getCursor = function(store_name, index_name, keyRange, direction, key_only, ini_key, ini_index_key) {
  var store = this.schema.getStore(store_name);
  return new ydn.db.index.req.WebsqlCursor(this.getTx(), store, store_name, index_name, keyRange, direction, key_only, ini_key, ini_index_key)
};
ydn.db.index.req.WebSql.prototype.getStreamer = goog.abstractMethod;
goog.provide("ydn.db.index.req.SimpleStore");
goog.require("ydn.db.core.req.SimpleStore");
goog.require("ydn.db.index.req.IRequestExecutor");
ydn.db.index.req.SimpleStore = function(dbname, schema) {
  goog.base(this, dbname, schema)
};
goog.inherits(ydn.db.index.req.SimpleStore, ydn.db.core.req.SimpleStore);
ydn.db.index.req.SimpleStore.prototype.getByIterator = goog.abstractMethod;
ydn.db.index.req.SimpleStore.prototype.getIndexKeysByKeys = goog.abstractMethod;
ydn.db.index.req.SimpleStore.prototype.getKeysByIndexKeyRange = goog.abstractMethod;
ydn.db.index.req.SimpleStore.prototype.keysByIterator = goog.abstractMethod;
ydn.db.index.req.SimpleStore.prototype.listByIterator = goog.abstractMethod;
ydn.db.index.req.SimpleStore.prototype.getCursor = goog.abstractMethod;
ydn.db.index.req.SimpleStore.prototype.getStreamer = goog.abstractMethod;
goog.provide("ydn.db.index.IStorage");
goog.require("ydn.db.index.req.IRequestExecutor");
goog.require("ydn.db.core.IStorage");
ydn.db.index.IStorage = function() {
};
goog.provide("ydn.db.index.TxStorage");
goog.require("ydn.db.Iterator");
goog.require("ydn.db.core.TxStorage");
goog.require("ydn.db.index.req.IRequestExecutor");
goog.require("ydn.db.index.req.IndexedDb");
goog.require("ydn.db.index.req.WebSql");
goog.require("ydn.db.index.req.SimpleStore");
goog.require("ydn.db.index.IStorage");
ydn.db.index.TxStorage = function(storage, ptx_no, scope_name, schema) {
  goog.base(this, storage, ptx_no, scope_name, schema)
};
goog.inherits(ydn.db.index.TxStorage, ydn.db.core.TxStorage);
ydn.db.index.TxStorage.prototype.getExecutor = function() {
  if(!this.executor) {
    var type = this.type();
    if(type == ydn.db.con.IndexedDb.TYPE) {
      this.executor = new ydn.db.index.req.IndexedDb(this.getName(), this.schema)
    }else {
      if(type == ydn.db.con.WebSql.TYPE) {
        this.executor = new ydn.db.index.req.WebSql(this.db_name, this.schema)
      }else {
        if(type == ydn.db.con.SimpleStorage.TYPE || type == ydn.db.con.LocalStorage.TYPE || type == ydn.db.con.SessionStorage.TYPE) {
          this.executor = new ydn.db.index.req.SimpleStore(this.db_name, this.schema)
        }else {
          throw new ydn.db.InternalError("No executor for " + type);
        }
      }
    }
  }
  return this.executor
};
ydn.db.index.TxStorage.prototype.exec = function(callback, store_names, mode, scope) {
  goog.base(this, "exec", callback, store_names, mode, scope)
};
ydn.db.index.TxStorage.prototype.get = function(arg1, arg2) {
  if(arg1 instanceof ydn.db.Iterator) {
    var df = ydn.db.base.createDeferred();
    var q = arg1;
    var q_store_name = q.getStoreName();
    var store = this.schema.getStore(q_store_name);
    if(!store) {
      throw new ydn.error.ArgumentException('store "' + q_store_name + '" not found.');
    }
    var index_name = q.getIndexName();
    if(goog.isDef(index_name) && !store.hasIndex(index_name)) {
      throw new ydn.error.ArgumentException('index "' + index_name + '" not found in store "' + q_store_name + '".');
    }
    this.exec(function(executor) {
      executor.getByIterator(df, q)
    }, [q_store_name], ydn.db.base.TransactionMode.READ_ONLY, "getByIterator");
    return df
  }else {
    return goog.base(this, "get", arg1, arg2)
  }
};
ydn.db.index.TxStorage.prototype.keys = function(arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  if(arg1 instanceof ydn.db.Iterator) {
    var df = ydn.db.base.createDeferred();
    if(goog.isDef(arg3) || goog.isDef(arg4) || goog.isDef(arg5)) {
      throw new ydn.error.ArgumentException("too many arguments.");
    }
    var limit;
    if(goog.isNumber(arg2)) {
      limit = arg2;
      if(limit < 1) {
        throw new ydn.error.ArgumentException("limit must be a positive value");
      }
    }else {
      if(goog.isDef(arg2)) {
        throw new ydn.error.ArgumentException("limit");
      }
    }
    var offset;
    if(goog.isNumber(arg3)) {
      offset = arg3
    }else {
      if(goog.isDef(arg3)) {
        throw new ydn.error.ArgumentException("offset");
      }
    }
    var q = arg1;
    this.exec(function(executor) {
      executor.keysByIterator(df, q, limit, offset)
    }, q.stores(), ydn.db.base.TransactionMode.READ_ONLY, "listByIterator");
    return df
  }else {
    return goog.base(this, "keys", arg1, arg2, arg3, arg4, arg5, arg6, arg7)
  }
};
ydn.db.index.TxStorage.prototype.list = function(arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  if(arg1 instanceof ydn.db.Iterator) {
    var df = ydn.db.base.createDeferred();
    if(goog.isDef(arg4) || goog.isDef(arg5)) {
      throw new ydn.error.ArgumentException("too many arguments.");
    }
    var limit;
    if(goog.isNumber(arg2)) {
      limit = arg2;
      if(limit < 1) {
        throw new ydn.error.ArgumentException("limit must be a positive value");
      }
    }else {
      if(goog.isDef(arg2)) {
        throw new ydn.error.ArgumentException("limit");
      }
    }
    var offset;
    if(goog.isNumber(arg3)) {
      offset = arg3
    }else {
      if(goog.isDef(arg3)) {
        throw new ydn.error.ArgumentException("offset");
      }
    }
    var q = arg1;
    this.exec(function(executor) {
      executor.listByIterator(df, q, limit, offset)
    }, q.stores(), ydn.db.base.TransactionMode.READ_ONLY, "listByIterator");
    return df
  }else {
    return goog.base(this, "list", arg1, arg2, arg3, arg4, arg5, arg6, arg7)
  }
};
ydn.db.index.TxStorage.prototype.scan = function(iterators, solver, opt_streamers) {
  var df = ydn.db.base.createDeferred();
  if(!goog.isArray(iterators) || !(iterators[0] instanceof ydn.db.Iterator)) {
    throw new ydn.error.ArgumentException;
  }
  var tr_mode = ydn.db.base.TransactionMode.READ_ONLY;
  var scopes = [];
  for(var i = 0;i < iterators.length;i++) {
    var stores = iterators[i].stores();
    for(var j = 0;j < stores.length;j++) {
      if(!goog.array.contains(scopes, stores[j])) {
        scopes.push(stores[j])
      }
    }
  }
  var passthrough_streamers = opt_streamers || [];
  for(var i = 0;i < passthrough_streamers.length;i++) {
    var store = passthrough_streamers[i].getStoreName();
    if(!goog.array.contains(scopes, store)) {
      scopes.push(store)
    }
  }
  var me = this;
  this.exec(function(executor) {
    var done = false;
    var total;
    var idx2streamer = [];
    var idx2iterator = [];
    var keys = [];
    var values = [];
    var cursors = [];
    var streamers = [];
    var do_exit = function() {
      for(var k = 0;k < iterators.length;k++) {
        iterators[k].exit()
      }
      done = true;
      goog.array.clear(cursors);
      goog.array.clear(streamers);
      df.callback()
    };
    var result_count = 0;
    var streamer_result_count = 0;
    var has_key_count = 0;
    var on_result_ready = function() {
      result_count = 0;
      var out;
      if(solver instanceof ydn.db.algo.AbstractSolver) {
        out = solver.solver(keys, values)
      }else {
        out = solver(keys, values)
      }
      var next_primary_keys = [];
      var next_index_keys = [];
      var advance = [];
      if(goog.isArray(out)) {
        next_primary_keys = out
      }else {
        if(goog.isNull(out)) {
          next_primary_keys = []
        }else {
          if(!goog.isDef(out)) {
            next_primary_keys = [];
            for(var i = 0;i < iterators.length;i++) {
              if(goog.isDef(idx2iterator[i])) {
                next_primary_keys[i] = true
              }
            }
          }else {
            if(goog.isObject(out)) {
              if(goog.isArray(out["next_primary_keys"])) {
                next_primary_keys = out["next_primary_keys"]
              }
              if(goog.isArray(out["next_index_keys"])) {
                next_index_keys = out["next_index_keys"]
              }
              if(goog.isArray(out["advance"])) {
                advance = out["advance"]
              }
            }else {
              throw new ydn.error.InvalidOperationException("scan callback output");
            }
          }
        }
      }
      var move_count = 0;
      for(var i = 0;i < iterators.length;i++) {
        if(goog.isDefAndNotNull(next_primary_keys[i])) {
          var idx = idx2iterator[i];
          if(!goog.isDef(idx)) {
            throw new ydn.error.InvalidOperationException(i + " is not an iterator.");
          }
          var iterator = iterators[idx];
          var req = cursors[i];
          if(next_primary_keys[i] !== false && !goog.isDef(keys[i])) {
            throw new ydn.error.InvalidOperationError("Iterator " + i + " must not advance.");
          }
          keys[i] = undefined;
          values[i] = undefined;
          if(ydn.db.core.req.IndexedDb.DEBUG) {
            var s = next_primary_keys[i] === false ? "restart" : next_primary_keys[i] === true ? "" : next_primary_keys[i];
            window.console.log(iterator.toString() + ": forward " + s)
          }
          if(goog.isDef(next_primary_keys[i]) && goog.isDef(next_index_keys[i])) {
            req.forward(next_primary_keys[i], next_index_keys[i], !!advance[i])
          }else {
            if(goog.isDef(next_primary_keys[i])) {
              if(goog.isBoolean(next_primary_keys[i])) {
                req.forward(next_primary_keys[i])
              }else {
                req.seek(next_primary_keys[i])
              }
            }else {
              if(goog.isDef(next_index_keys[i])) {
                req.forward(next_index_keys[i])
              }else {
                if(goog.isDef(advance[i])) {
                  req.forward(!!advance[i])
                }
              }
            }
          }
          move_count++
        }else {
          result_count++
        }
      }
      if(move_count == 0) {
        do_exit()
      }
    };
    var on_streamer_pop = function(i, key, value) {
      if(done) {
        if(ydn.db.core.req.IndexedDb.DEBUG) {
          window.console.log(["on_streamer_next", i, key, value])
        }
        throw new ydn.error.InternalError;
      }
      keys[i] = key;
      values[i] = value;
      result_count++;
      if(result_count === total) {
        on_result_ready()
      }
      return false
    };
    var on_iterator_next = function(i, primary_key, key, value) {
      if(done) {
        if(ydn.db.core.req.IndexedDb.DEBUG) {
          window.console.log(["on_iterator_next", i, primary_key, key, value])
        }
        throw new ydn.error.InternalError;
      }
      result_count++;
      var idx = idx2iterator[i];
      var iterator = iterators[idx];
      keys[i] = primary_key;
      values[i] = iterator.isKeyOnly() ? key : value;
      var streamer_idx = idx2streamer[i];
      for(var j = 0, n = iterator.degree() - 1;j < n;j++) {
        var streamer = streamers[streamer_idx + j];
        streamer.pull(key, value)
      }
      if(result_count === total) {
        on_result_ready()
      }
    };
    var on_error = function(e) {
      goog.array.clear(cursors);
      goog.array.clear(streamers);
      df.errback(e)
    };
    var open_iterators = function() {
      var idx = 0;
      for(var i = 0;i < iterators.length;i++) {
        var iterator = iterators[i];
        var mode = iterator.isKeyOnly() ? ydn.db.base.CursorMode.KEY_ONLY : ydn.db.base.CursorMode.READ_ONLY;
        var cursor = iterator.iterate(executor);
        cursor.onError = on_error;
        cursor.onNext = goog.partial(on_iterator_next, idx);
        cursors[i] = cursor;
        idx2iterator[idx] = i;
        idx++;
        for(var j = 0, n = iterator.degree() - 1;j < n;j++) {
          var streamer = executor.getStreamer(iterator.getPeerStoreName(j), iterator.getBaseIndexName(j), iterator.getPeerIndexName(j));
          streamer.setSink(goog.partial(on_streamer_pop, idx));
          streamers.push(streamer);
          idx2streamer[idx] = streamers.length;
          idx++
        }
      }
      total = iterators.length + streamers.length
    };
    for(var i = 0;i < passthrough_streamers.length;i++) {
      passthrough_streamers[i].setTx(this.getTx())
    }
    if(solver instanceof ydn.db.algo.AbstractSolver) {
      var wait = solver.begin(iterators, function() {
        open_iterators()
      });
      if(!wait) {
        open_iterators()
      }
    }else {
      open_iterators()
    }
  }, scopes, tr_mode, "join");
  return df
};
ydn.db.index.TxStorage.prototype.open = function(iterator, callback, mode) {
  if(!(iterator instanceof ydn.db.Iterator)) {
    throw new ydn.error.ArgumentException;
  }
  var store = this.schema.getStore(iterator.getStoreName());
  if(!store) {
    throw new ydn.error.ArgumentException('Store "' + iterator.getStoreName() + '" not found.');
  }
  var tr_mode = mode || ydn.db.base.TransactionMode.READ_ONLY;
  var df = ydn.db.base.createDeferred();
  this.exec(function(executor) {
    var read_write = tr_mode == ydn.db.base.TransactionMode.READ_WRITE;
    var cursor = iterator.iterate(executor);
    cursor.onError = function(e) {
      df.errback(e)
    };
    cursor.onNext = function(primaryKey, key, value) {
      if(goog.isDefAndNotNull(primaryKey)) {
        var adv = callback(cursor);
        cursor.forward(true)
      }else {
        df.callback()
      }
    }
  }, iterator.stores(), tr_mode, "open");
  return df
};
ydn.db.index.TxStorage.prototype.map = function(iterator, callback) {
  var stores = iterator.stores();
  for(var store, i = 0;store = stores[i];i++) {
    if(!store) {
      throw new ydn.error.ArgumentException('Store "' + store + '" not found.');
    }
  }
  var df = ydn.db.base.createDeferred();
  this.exec(function(executor) {
    var cursor = iterator.iterate(executor);
    cursor.onError = function(e) {
      df.errback(e)
    };
    cursor.onNext = function(primaryKey, key, value) {
      if(goog.isDef(key)) {
        var ref;
        if(iterator.isKeyOnly()) {
          if(iterator.isIndexIterator()) {
            ref = key
          }else {
            ref = primaryKey
          }
        }else {
          if(iterator.isIndexIterator()) {
            ref = primaryKey
          }else {
            ref = value
          }
        }
        var adv = callback(ref);
        if(!goog.isDef(adv)) {
          cursor.forward(true)
        }else {
          if(goog.isBoolean(adv)) {
            throw new ydn.error.InvalidOperationException(adv);
          }else {
            if(goog.isNull(adv)) {
              cursor.forward(null)
            }else {
              cursor.forward(adv)
            }
          }
        }
      }else {
        df.callback(undefined)
      }
    }
  }, stores, ydn.db.base.TransactionMode.READ_ONLY, "map");
  return df
};
ydn.db.index.TxStorage.prototype.reduce = function(iterator, callback, initial) {
  var stores = iterator.stores();
  for(var store, i = 0;store = stores[i];i++) {
    if(!store) {
      throw new ydn.error.ArgumentException('Store "' + store + '" not found.');
    }
  }
  var df = ydn.db.base.createDeferred();
  var previous = goog.isObject(initial) ? ydn.object.clone(initial) : initial;
  this.exec(function(executor) {
    var cursor = iterator.iterate(executor);
    cursor.onError = function(e) {
      df.errback(e)
    };
    var key_only = iterator.isKeyOnly();
    var index = 0;
    cursor.onNext = function(primaryKey, key, value) {
      if(goog.isDefAndNotNull(primaryKey)) {
        var current_value;
        if(iterator.isKeyOnly()) {
          if(iterator.isIndexIterator()) {
            current_value = key
          }else {
            current_value = primaryKey
          }
        }else {
          if(iterator.isIndexIterator()) {
            current_value = primaryKey
          }else {
            current_value = value
          }
        }
        previous = callback(previous, current_value, index++);
        cursor.forward(true)
      }else {
        df.callback(previous)
      }
    }
  }, stores, ydn.db.base.TransactionMode.READ_ONLY, "map");
  return df
};
goog.provide("ydn.db.sql.req.IterableQuery");
goog.require("ydn.db.Iterator");
goog.require("goog.functions");
goog.require("ydn.db.KeyRange");
goog.require("ydn.db.Where");
goog.require("ydn.error.ArgumentException");
ydn.db.sql.req.IterableQuery = function(store, index, keyRange, reverse, unique, key_only, filter, continued) {
  goog.base(this, store, index, keyRange, reverse, unique, key_only);
  this.initial = null;
  this.map = null;
  this.reduce = null;
  this.finalize = null;
  this.filter_fn = filter || null;
  this.continued = continued || null
};
goog.inherits(ydn.db.sql.req.IterableQuery, ydn.db.Iterator);
ydn.db.sql.req.IterableQuery.prototype.toJSON = function() {
  var obj = goog.base(this, "toJSON");
  obj["initial"] = this.initial ? this.initial.toString() : null;
  obj["map"] = this.map ? this.map.toString() : null;
  obj["reduce"] = this.reduce ? this.reduce.toString() : null;
  obj["finalize"] = this.finalize ? this.finalize.toString() : null;
  return obj
};
ydn.db.sql.req.IterableQuery.prototype.initial = null;
ydn.db.sql.req.IterableQuery.prototype.map = null;
ydn.db.sql.req.IterableQuery.prototype.reduce = null;
ydn.db.sql.req.IterableQuery.prototype.finalize = null;
ydn.db.sql.req.IterableQuery.prototype.toString = function() {
  var idx = goog.isDef(this.getIndexName()) ? ":" + this.getIndexName() : "";
  return"Cursor:" + this.getStoreName() + idx
};
ydn.db.sql.req.IterableQuery.prototype.processWhereAsFilter = function(where) {
  var prev_filter = goog.functions.TRUE;
  if(goog.isFunction(this.filter_fn)) {
    prev_filter = this.filter_fn
  }
  this.filter_fn = function(obj) {
    var value = obj[where.field];
    var ok1 = true;
    if(goog.isDef(where.lower)) {
      ok1 = where.lowerOpen ? value < where.lower : value <= where.lower
    }
    var ok2 = true;
    if(goog.isDef(where.upper)) {
      ok2 = where.upperOpen ? value > where.upper : value >= where.upper
    }
    return prev_filter(obj) && ok1 && ok2
  }
};
goog.provide("ydn.db.sql.req.IdbQuery");
goog.require("ydn.db.sql.req.IterableQuery");
goog.require("goog.functions");
goog.require("ydn.db.KeyRange");
goog.require("ydn.db.Where");
goog.require("ydn.error.ArgumentException");
ydn.db.sql.req.IdbQuery = function(store, index, keyRange, reverse, unique, key_only, filter, continued) {
  goog.base(this, store, index, keyRange, reverse, unique, key_only, filter, continued)
};
goog.inherits(ydn.db.sql.req.IdbQuery, ydn.db.sql.req.IterableQuery);
ydn.db.sql.req.IdbQuery.Methods = {OPEN:"op", COUNT:"cn"};
ydn.db.sql.req.IdbQuery.prototype.method = ydn.db.sql.req.IdbQuery.Methods.OPEN;
goog.provide("ydn.math.Expression");
goog.require("ydn.string");
goog.require("goog.string");
goog.require("ydn.object");
goog.require("ydn.error");
ydn.math.Expression = function(tokens) {
  this.tokens = tokens
};
ydn.math.Expression.prototype.tokens = [];
ydn.math.Expression.prototype.evaluate = function(with_object, var_args) {
  var stack = [];
  for(var i = 0;i < this.tokens.length;i++) {
    var tok = this.tokens[i];
    var is_field_name = tok[0] === '"' && tok[tok.length - 1] === '"';
    var is_string_literal = tok[0] === "'" && tok[tok.length - 1] === "'";
    if(is_field_name) {
      var keys = goog.string.stripQuotes(tok, '"').split(".");
      goog.asserts.assertObject(with_object);
      var value = goog.object.getValueByKeys(with_object, keys);
      stack.push(value)
    }else {
      if(is_string_literal) {
        stack.push(goog.string.stripQuotes(tok, "'"))
      }else {
        if(goog.isString(tok)) {
          if(tok === "true") {
            stack.push(true)
          }else {
            if(tok === "false") {
              stack.push(false)
            }else {
              if(tok === "Date") {
                stack.push(new Date(parseInt(stack.pop(), 10)))
              }else {
                if(tok === "now") {
                  stack.push(new Date)
                }else {
                  if(tok === "!") {
                    stack[stack.length - 1] = !stack[stack.length - 1]
                  }else {
                    if(tok === "==") {
                      stack.push(stack.pop() == stack.pop())
                    }else {
                      if(tok === "===") {
                        stack.push(stack.pop() === stack.pop())
                      }else {
                        if(tok === "!=") {
                          stack.push(stack.pop() != stack.pop())
                        }else {
                          if(tok === "!==") {
                            stack.push(stack.pop() !== stack.pop())
                          }else {
                            if(tok === "<=") {
                              stack.push(stack.pop() <= stack.pop())
                            }else {
                              if(tok === "<") {
                                stack.push(stack.pop() < stack.pop())
                              }else {
                                if(tok === ">=") {
                                  stack.push(stack.pop() >= stack.pop())
                                }else {
                                  if(tok === ">") {
                                    stack.push(stack.pop() > stack.pop())
                                  }else {
                                    if(tok === "&") {
                                      stack.push(stack.pop() & stack.pop())
                                    }else {
                                      if(tok === "|") {
                                        stack.push(stack.pop() | stack.pop())
                                      }else {
                                        if(tok === "?") {
                                          var ok = !!stack.pop();
                                          var a = stack.pop();
                                          var b = stack.pop();
                                          var v = ok ? a : b;
                                          stack.push(v)
                                        }else {
                                          if(tok === "+") {
                                            stack.push(stack.pop() + stack.pop())
                                          }else {
                                            if(tok === "-") {
                                              stack.push(stack.pop() - stack.pop())
                                            }else {
                                              if(tok === "*") {
                                                stack.push(stack.pop() * stack.pop())
                                              }else {
                                                if(tok === "/") {
                                                  stack.push(stack.pop() / stack.pop())
                                                }else {
                                                  if(tok === "%") {
                                                    stack.push(stack.pop() % stack.pop())
                                                  }else {
                                                    if(tok === "at") {
                                                      var at = stack.pop();
                                                      var arr = stack.pop();
                                                      stack.push(arr[at])
                                                    }else {
                                                      if(tok === "of") {
                                                        var ele = stack.pop();
                                                        var arr = stack.pop();
                                                        var v = goog.isArray(arr) ? arr.indexOf(ele) : -1;
                                                        stack.push(v)
                                                      }else {
                                                        if(tok === "in") {
                                                          var ele = stack.pop();
                                                          var arr = stack.pop();
                                                          var v = goog.isArray(arr) ? arr.indexOf(ele) >= 0 : false;
                                                          stack.push(v)
                                                        }else {
                                                          if(tok === "abs") {
                                                            stack[stack.length - 1] = Math.abs(stack[stack.length - 1])
                                                          }else {
                                                            if(tok[0] == "$" && /^\$\d$/.test(tok)) {
                                                              var pos = parseInt(tok.match(/^\$(\d)$/)[1], 10);
                                                              stack.push(arguments[pos])
                                                            }else {
                                                              stack.push(parseFloat(tok))
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }else {
          stack.push(tok)
        }
      }
    }
  }
  return stack[0]
};
ydn.math.Expression.prototype.compile = function() {
  var tokens = this.tokens;
  return function() {
    var args = arguments.length > 2 ? Array.prototype.slice(arguments, 2) : undefined;
    return ydn.math.Expression.prototype.evaluate.apply(null, args)
  }
};
ydn.math.Expression.prototype.toJSON = function() {
  return{"Tokens":ydn.object.clone(this.tokens)}
};
ydn.math.Expression.parseRpn = function(expression) {
  return new ydn.math.Expression(ydn.string.split_space(expression))
};
ydn.math.Expression.parseInfix = function(expression) {
  throw new ydn.error.NotImplementedException("Too lazy to learn Dutch in Shunting Yard station, " + "we speak Polish here.");
};
goog.provide("ydn.db.Sql");
goog.require("goog.functions");
goog.require("ydn.db.KeyRange");
goog.require("ydn.db.schema.Database");
goog.require("ydn.error.ArgumentException");
goog.require("ydn.db.sql.req.IdbQuery");
goog.require("ydn.math.Expression");
goog.require("ydn.db.Where");
goog.require("ydn.string");
ydn.db.Sql = function(sql) {
  if(!goog.isString(sql)) {
    throw new ydn.error.ArgumentException;
  }
  this.sql_ = sql;
  this.parseBasic_(sql);
  this.last_error_ = "";
  this.has_parsed_ = false
};
ydn.db.Sql.prototype.sql_ = "";
ydn.db.Sql.prototype.mode_ = ydn.db.base.TransactionMode.READ_ONLY;
ydn.db.Sql.prototype.store_names_;
ydn.db.Sql.prototype.modifier_;
ydn.db.Sql.prototype.condition_;
ydn.db.Sql.prototype.aggregate_;
ydn.db.Sql.prototype.order_;
ydn.db.Sql.prototype.limit_ = NaN;
ydn.db.Sql.prototype.offset_ = NaN;
ydn.db.Sql.prototype.reverse_ = false;
ydn.db.Sql.prototype.selList_;
ydn.db.Sql.prototype.last_error_ = "";
ydn.db.Sql.prototype.has_parsed_ = false;
ydn.db.Sql.prototype.parseBasic_ = function(sql) {
  var from_parts = sql.split(/\sFROM\s/i);
  if(from_parts.length != 2) {
    throw new ydn.db.SqlParseError("FROM required.");
  }
  var pre_from = from_parts[0];
  var post_from = from_parts[1];
  var pre_from_parts = pre_from.match(/\s*?(SELECT|INSERT|UPDATE|DELETE)\s+(.*)/i);
  if(pre_from_parts.length != 3) {
    throw new ydn.db.SqlParseError("Unable to parse: " + sql);
  }
  this.action_ = pre_from_parts[1].toUpperCase();
  if(this.action_ == "SELECT") {
    this.mode_ = ydn.db.base.TransactionMode.READ_ONLY
  }else {
    if(this.action_ == "INSERT") {
      this.mode_ = ydn.db.base.TransactionMode.READ_WRITE
    }else {
      if(this.action_ == "UPDATE") {
        this.mode_ = ydn.db.base.TransactionMode.READ_WRITE
      }else {
        if(this.action_ == "DELETE") {
          this.mode_ = ydn.db.base.TransactionMode.READ_WRITE
        }else {
          throw new ydn.db.SqlParseError("Unknown SQL verb: " + this.action_);
        }
      }
    }
  }
  var selList = pre_from_parts[2].trim();
  var agg = selList.match(/^(MIN|MAX|COUNT|AVG|SUM)/i);
  if(agg) {
    this.aggregate_ = agg[0].toUpperCase();
    selList = selList.replace(/^(MIN|MAX|COUNT|AVG|SUM)/i, "").trim()
  }else {
    this.aggregate_ = undefined
  }
  if(selList.charAt(0) == "(") {
    if(selList.charAt(selList.length - 1) == ")") {
      selList = selList.substring(1, selList.length - 1)
    }else {
      new ydn.db.SqlParseError("missing closing parentheses")
    }
  }
  this.selList_ = selList;
  var mod_idx = post_from.search(/(ORDER BY|LIMIT|OFFSET)/i);
  if(mod_idx > 0) {
    this.modifier_ = post_from.substring(mod_idx);
    post_from = post_from.substring(0, mod_idx)
  }else {
    this.modifier_ = ""
  }
  var where_idx = post_from.search(/WHERE/i);
  if(where_idx > 0) {
    this.condition_ = post_from.substring(where_idx + 6).trim();
    post_from = post_from.substring(0, where_idx)
  }else {
    this.condition_ = ""
  }
  var stores = post_from.trim().split(",");
  this.store_names_ = stores.map(function(x) {
    x = goog.string.stripQuotes(x, '"');
    x = goog.string.stripQuotes(x, "'");
    return x.trim()
  })
};
ydn.db.Sql.prototype.parse = function(params) {
  if(params) {
    for(var i = 0;i < params.length;i++) {
      this.sql_ = this.sql_.replace("?", params[i])
    }
    this.parseBasic_(this.sql_)
  }
  this.wheres_ = this.parseConditions();
  if(!this.wheres_) {
    return this.last_error_
  }
  var start_idx = this.modifier_.length;
  var offset_result = /OFFSET\s+(\d+)/i.exec(this.modifier_);
  if(offset_result) {
    this.offset_ = parseInt(offset_result[1], 10);
    start_idx = this.modifier_.search(/OFFSET/i)
  }
  var limit_result = /LIMIT\s+(\d+)/i.exec(this.modifier_);
  if(limit_result) {
    this.limit_ = parseInt(limit_result[1], 10);
    var idx = this.modifier_.search(/LIMIT/i);
    if(idx < start_idx) {
      start_idx = idx
    }
  }
  var order_str = this.modifier_.substr(0, start_idx);
  var order_result = /ORDER BY\s+(.+)/i.exec(order_str);
  if(order_result) {
    var order = order_result[1].trim();
    var asc_desc = order.match(/(ASC|DESC)/i);
    if(asc_desc) {
      this.reverse_ = asc_desc[0].toUpperCase() == "DESC";
      order = order.replace(/\s+(ASC|DESC)/i, "")
    }else {
      this.reverse_ = false
    }
    this.order_ = goog.string.stripQuotes(goog.string.stripQuotes(order, '"'), "'");
    goog.asserts.assert(this.order_.length > 0, "Invalid order by field")
  }else {
    this.order_ = undefined
  }
  this.has_parsed_ = true;
  return""
};
ydn.db.Sql.prototype.getSelList = function() {
  if(this.selList_ == "*") {
    return null
  }else {
    var fields = this.selList_.split(",");
    fields = fields.map(function(s) {
      return s.trim()
    });
    return fields
  }
};
ydn.db.Sql.prototype.getSql = function() {
  return this.sql_
};
ydn.db.Sql.prototype.toJSON = function() {
  return{"sql":this.sql_}
};
ydn.db.Sql.prototype.getStoreNames = function() {
  return goog.array.clone(this.store_names_)
};
ydn.db.Sql.prototype.getMode = function() {
  return this.mode_
};
ydn.db.Sql.prototype.getLimit = function() {
  return this.limit_
};
ydn.db.Sql.prototype.getOffset = function() {
  return this.offset_
};
ydn.db.Sql.prototype.getOrderBy = function() {
  return this.order_
};
ydn.db.Sql.prototype.isReversed = function() {
  return this.reverse_
};
ydn.db.Sql.prototype.getConditions = function() {
  return this.wheres_
};
ydn.db.Sql.prototype.parseConditions = function() {
  var wheres = [];
  var re_op = /(.+?)(<=|>=|=|>|<)(.+)/i;
  var findIndex = function(field) {
    return goog.array.findIndex(wheres, function(w) {
      return w.getField() == field
    })
  };
  if(this.condition_.length > 0) {
    var conds = this.condition_.split("AND");
    for(var i = 0;i < conds.length;i++) {
      var cond = conds[i];
      var result = re_op.exec(cond);
      if(result) {
        var field = result[1].trim();
        field = goog.string.stripQuotes(field, '"');
        field = goog.string.stripQuotes(field, "'");
        if(field.length > 0) {
          var value = result[3].trim();
          if(goog.string.startsWith(value, '"')) {
            value = goog.string.stripQuotes(value, '"')
          }else {
            if(goog.string.startsWith(value, "'")) {
              value = goog.string.stripQuotes(value, "'")
            }else {
              value = parseFloat(value)
            }
          }
          var op = result[2];
          var where = new ydn.db.Where(field, op, value);
          var ex_idx = findIndex(field);
          if(ex_idx >= 0) {
            wheres[ex_idx] = wheres[ex_idx].and(where);
            if(!wheres[ex_idx]) {
              this.last_error_ = 'where clause "' + cond + '" conflict';
              return null
            }
          }else {
            wheres.push(where)
          }
        }else {
          this.last_error_ = 'Invalid clause "' + cond + '"';
          return null
        }
      }else {
        this.last_error_ = 'Invalid clause "' + cond + '"';
        return null
      }
    }
  }
  return wheres
};
ydn.db.Sql.prototype.getAction = function() {
  return this.action_
};
ydn.db.Sql.prototype.toString = function() {
  if(goog.DEBUG) {
    return"query:" + this.sql_
  }else {
    return goog.base(this, "toString")
  }
};
ydn.db.Sql.prototype.getAggregate = function() {
  return this.aggregate_
};
goog.provide("ydn.db.sql.req.IRequestExecutor");
goog.require("ydn.db.core.req.IRequestExecutor");
goog.require("ydn.db.Streamer");
goog.require("ydn.db.Sql");
ydn.db.sql.req.IRequestExecutor = function() {
};
ydn.db.sql.req.IRequestExecutor.prototype.explainSql = goog.abstractMethod;
ydn.db.sql.req.IRequestExecutor.prototype.executeSql = goog.abstractMethod;
goog.provide("ydn.db.sql.IStorage");
goog.require("ydn.db.sql.req.IRequestExecutor");
goog.require("ydn.db.index.IStorage");
ydn.db.sql.IStorage = function() {
};
goog.provide("ydn.db.sql.req.idb.Node");
goog.require("ydn.db.Iterator");
goog.require("ydn.db.KeyRange");
goog.require("ydn.db.Sql");
goog.require("ydn.error.ArgumentException");
ydn.db.sql.req.idb.Node = function(schema, sql) {
  this.sql = sql;
  this.store_schema = schema
};
ydn.db.sql.req.idb.Node.prototype.logger = goog.debug.Logger.getLogger("ydn.db.sql.req.idb.Node");
ydn.db.sql.req.idb.Node.prototype.store_schema;
ydn.db.sql.req.idb.Node.prototype.sql;
ydn.db.sql.req.idb.Node.prototype.toJSON = function() {
  return{"sql":this.sql}
};
ydn.db.sql.req.idb.Node.prototype.toString = function() {
  return"idb.Node:"
};
ydn.db.sql.req.idb.Node.prototype.execute = function(df, req) {
  var me = this;
  var out = [];
  var store_name = this.sql.getStoreNames()[0];
  var wheres = this.sql.getConditions();
  var limit = this.sql.getLimit();
  limit = isNaN(limit) ? ydn.db.base.DEFAULT_RESULT_LIMIT : limit;
  var offset = this.sql.getOffset();
  offset = isNaN(offset) ? 0 : offset;
  var order = this.sql.getOrderBy();
  var sel_fields = this.sql.getSelList();
  var key_range = null;
  var reverse = this.sql.isReversed();
  if(wheres.length == 0) {
    key_range = null
  }else {
    if(wheres.length == 1) {
      key_range = ydn.db.KeyRange.parseIDBKeyRange(wheres[0])
    }else {
      throw new ydn.error.NotSupportedException("too many conditions.");
    }
  }
  if(goog.isNull(sel_fields) || sel_fields.length == 0) {
    if(goog.isDefAndNotNull(order) && order != this.store_schema.getKeyPath()) {
      var iter = new ydn.db.ValueIterator(store_name, order, key_range, reverse);
      req.listByIterator(df, iter, limit, offset)
    }else {
      if(key_range) {
        req.listByIndexKeyRange(df, store_name, wheres[0].getField(), key_range, reverse, limit, offset, false)
      }else {
        req.listByKeyRange(df, store_name, key_range, reverse, limit, offset)
      }
    }
  }else {
    if(sel_fields.length == 1) {
      if(goog.isDefAndNotNull(order) && order != sel_fields[0]) {
        var ndf = new goog.async.Deferred;
        var iter = new ydn.db.ValueIterator(store_name, order, key_range, reverse);
        req.listByIterator(ndf, iter, limit, offset);
        ndf.addCallbacks(function(values) {
          var results = values.map(function(x) {
            return goog.object.getValueByKeys(x, sel_fields[0])
          });
          df.callback(results)
        }, function(e) {
          df.errback(e)
        })
      }else {
        var iter = new ydn.db.KeyIterator(store_name, sel_fields[0], key_range, reverse);
        req.listByIterator(df, iter, limit, offset)
      }
    }else {
      var ndf = new goog.async.Deferred;
      req.listByKeyRange(ndf, store_name, key_range, reverse, limit, offset);
      ndf.addCallbacks(function(records) {
        var out = records.map(function(record) {
          var obj = {};
          for(var i = 0;i < sel_fields.length;i++) {
            obj[sel_fields[i]] = goog.object.getValueByKeys(record, sel_fields[i])
          }
          return obj
        })
      }, function(e) {
        df.errback(e)
      })
    }
  }
};
goog.provide("ydn.db.sql.req.idb.ReduceNode");
goog.require("ydn.db.sql.req.idb.Node");
goog.require("ydn.object");
ydn.db.sql.req.idb.ReduceNode = function(schema, sql) {
  goog.base(this, schema, sql)
};
goog.inherits(ydn.db.sql.req.idb.ReduceNode, ydn.db.sql.req.idb.Node);
ydn.db.sql.req.idb.ReduceNode.prototype.execute = function(df, req) {
  var me = this;
  var out;
  var store_name = this.sql.getStoreNames()[0];
  var wheres = this.sql.getConditions();
  var key_range = null;
  var reverse = this.sql.isReversed();
  if(wheres.length == 0) {
    key_range = null
  }else {
    if(wheres.length == 1) {
      key_range = ydn.db.KeyRange.parseIDBKeyRange(wheres[0])
    }else {
      throw new ydn.error.NotSupportedException("too many conditions.");
    }
  }
  var aggregate = this.sql.getAggregate();
  if(aggregate == "COUNT") {
    if(key_range) {
      req.countKeyRange(df, store_name, key_range, wheres[0].getField())
    }else {
      req.countKeyRange(df, store_name, null)
    }
  }else {
    var reduce;
    var fields = this.sql.getSelList();
    if(!fields || fields.length == 0) {
      throw new ydn.error.InvalidOperationError("field name require for reduce operation: " + aggregate);
    }
    var field_name = fields[0];
    if(aggregate == "MIN") {
      reduce = ydn.db.sql.req.idb.ReduceNode.reduceMin(field_name)
    }else {
      if(aggregate == "MAX") {
        reduce = ydn.db.sql.req.idb.ReduceNode.reduceMax(field_name)
      }else {
        if(aggregate == "AVG") {
          out = 0;
          reduce = ydn.db.sql.req.idb.ReduceNode.reduceAverage(field_name)
        }else {
          if(aggregate == "SUM") {
            out = 0;
            reduce = ydn.db.sql.req.idb.ReduceNode.reduceSum(field_name)
          }else {
            throw new ydn.error.NotSupportedException(aggregate);
          }
        }
      }
    }
    var iter;
    if(key_range) {
      iter = new ydn.db.ValueIterator(store_name, wheres[0].getField(), key_range)
    }else {
      iter = new ydn.db.ValueIterator(store_name)
    }
    var cursor = iter.iterate(req);
    cursor.onError = function(e) {
      df.errback(e)
    };
    var i = 0;
    cursor.onNext = function(primaryKey, key, value) {
      if(goog.isDef(key)) {
        out = reduce(value, out, i);
        cursor.advance(1);
        i++
      }else {
        df.callback(out)
      }
    }
  }
};
ydn.db.sql.req.idb.ReduceNode.reduceAverage = function(field) {
  return function(curr, prev, i) {
    if(!goog.isDef(prev)) {
      prev = 0
    }
    return(prev * i + curr[field]) / (i + 1)
  }
};
ydn.db.sql.req.idb.ReduceNode.reduceSum = function(field) {
  return function(curr, prev, i) {
    return prev + curr[field]
  }
};
ydn.db.sql.req.idb.ReduceNode.reduceMin = function(field) {
  return function(curr, prev, i) {
    var x = curr[field];
    if(!goog.isDef(prev)) {
      return x
    }
    return prev < x ? prev : x
  }
};
ydn.db.sql.req.idb.ReduceNode.reduceMax = function(field) {
  return function(curr, prev, i) {
    var x = curr[field];
    if(!goog.isDef(prev)) {
      return x
    }
    return prev > x ? prev : x
  }
};
goog.provide("ydn.db.sql.req.IndexedDb");
goog.require("ydn.db.index.req.IndexedDb");
goog.require("ydn.db.sql.req.IRequestExecutor");
goog.require("ydn.db.sql.req.idb.Node");
goog.require("ydn.db.sql.req.idb.ReduceNode");
ydn.db.sql.req.IndexedDb = function(dbname, schema) {
  goog.base(this, dbname, schema)
};
goog.inherits(ydn.db.sql.req.IndexedDb, ydn.db.index.req.IndexedDb);
ydn.db.sql.req.IndexedDb.DEBUG = false;
ydn.db.sql.req.IndexedDb.prototype.logger = goog.debug.Logger.getLogger("ydn.db.sql.req.IndexedDb");
ydn.db.sql.req.IndexedDb.prototype.executeSql = function(df, sql, params) {
  var msg = sql.parse(params);
  if(msg) {
    throw new ydn.db.SqlParseError(msg);
  }
  var store_names = sql.getStoreNames();
  if(store_names.length == 1) {
    var store_schema = this.schema.getStore(store_names[0]);
    if(!store_schema) {
      throw new ydn.db.NotFoundError(store_names[0]);
    }
    var fields = sql.getSelList();
    if(fields) {
      for(var i = 0;i < fields.length;i++) {
        if(!store_schema.hasIndex(fields[i])) {
          throw new ydn.db.NotFoundError('Index "' + fields[i] + '" not found in ' + store_names[0]);
        }
      }
    }
    var node;
    if(sql.getAggregate()) {
      node = new ydn.db.sql.req.idb.ReduceNode(store_schema, sql)
    }else {
      node = new ydn.db.sql.req.idb.Node(store_schema, sql)
    }
    node.execute(df, this)
  }else {
    throw new ydn.error.NotSupportedException(sql.getSql());
  }
};
ydn.db.sql.req.IndexedDb.prototype.explainSql = function(sql) {
  throw new ydn.error.NotImplementedException;
};
goog.provide("ydn.db.sql.req.SqlQuery");
goog.require("ydn.db.sql.req.IterableQuery");
goog.require("goog.functions");
goog.require("ydn.db.KeyRange");
goog.require("ydn.db.Where");
goog.require("ydn.error.ArgumentException");
ydn.db.sql.req.SqlQuery = function(store, index, keyRange, reverse, unique, key_only, filter, continued) {
  goog.base(this, store, index, keyRange, reverse, unique, key_only, filter, continued);
  this.parseRow = ydn.db.sql.req.SqlQuery.prototype.parseRow;
  this.sql = "";
  this.params = []
};
goog.inherits(ydn.db.sql.req.SqlQuery, ydn.db.sql.req.IterableQuery);
ydn.db.sql.req.SqlQuery.prototype.toJSON = function() {
  var obj = goog.base(this, "toJSON");
  obj["sql"] = this.sql;
  obj["params"] = ydn.object.clone(this.params);
  return obj
};
ydn.db.sql.req.SqlQuery.prototype.toWhereClause = function(keyPath) {
  var idx = this.getIndexName();
  var index = goog.isDef(idx) ? idx : goog.isDefAndNotNull(keyPath) ? keyPath : ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME;
  var column = goog.string.quote(index);
  var where = new ydn.db.Where(column, keyPath);
  return where.toWhereClause()
};
ydn.db.sql.req.SqlQuery.prototype.sql = "";
ydn.db.sql.req.SqlQuery.prototype.params = [];
ydn.db.sql.req.SqlQuery.prototype.toString = function() {
  var idx = goog.isDef(this.getIndexName()) ? ":" + this.getIndexName() : "";
  return"Cursor:" + this.getStoreName() + idx
};
ydn.db.sql.req.SqlQuery.prototype.parseRow = function(row, store) {
  return ydn.db.core.req.WebSql.parseRow(row, store)
};
ydn.db.sql.req.SqlQuery.parseRowIdentity = function(row, store) {
  return row
};
goog.provide("ydn.db.sql.req.websql.Node");
goog.require("ydn.db.schema.Store");
goog.require("ydn.db.Sql");
ydn.db.sql.req.websql.Node = function(schema, sql) {
  this.sql = sql;
  this.store_schema_ = schema;
  this.sel_fields_ = sql.getSelList()
};
ydn.db.sql.req.websql.Node.prototype.logger = goog.debug.Logger.getLogger("ydn.db.sql.req.websql.Node");
ydn.db.sql.req.websql.Node.prototype.store_schema_;
ydn.db.sql.req.websql.Node.prototype.sql;
ydn.db.sql.req.websql.Node.prototype.sel_fields_;
ydn.db.sql.req.websql.Node.prototype.toJSON = function() {
  return{"sql":this.sql.getSql()}
};
ydn.db.sql.req.websql.Node.prototype.toString = function() {
  return"websql.Node:"
};
ydn.db.sql.req.websql.Node.prototype.parseRow = function(row) {
  if(!this.sel_fields_) {
    return ydn.db.core.req.WebSql.parseRow(row, this.store_schema_)
  }else {
    if(this.sel_fields_.length == 1) {
      if(goog.isObject(row)) {
        return goog.object.getValueByKeys(row, this.sel_fields_[0])
      }else {
        return undefined
      }
    }else {
      var obj = {};
      for(var i = 0;i < this.sel_fields_.length;i++) {
        obj[this.sel_fields_[i]] = goog.object.getValueByKeys(row, this.sel_fields_[i])
      }
      return obj
    }
  }
};
ydn.db.sql.req.websql.Node.prototype.execute = function(df, tx, params) {
  var sql_stm = this.sql.getSql();
  var me = this;
  var out = [];
  var callback = function(transaction, results) {
    var n = results.rows.length;
    for(var i = 0;i < n;i++) {
      var row = results.rows.item(i);
      if(goog.isObject(row)) {
        var value = me.parseRow(row);
        out.push(value)
      }else {
        out.push(value)
      }
    }
    df.callback(out)
  };
  var error_callback = function(tr, error) {
    if(ydn.db.sql.req.WebSql.DEBUG) {
      window.console.log([sql_stm, tr, error])
    }
    me.logger.warning("Sqlite error: " + error.message);
    df.errback(error);
    return true
  };
  if(ydn.db.sql.req.WebSql.DEBUG) {
    window.console.log(this + " open SQL: " + sql_stm + " PARAMS:" + ydn.json.stringify(params))
  }
  tx.executeSql(sql_stm, params, callback, error_callback)
};
goog.provide("ydn.db.sql.req.websql.ReduceNode");
goog.require("ydn.db.sql.req.websql.Node");
goog.require("ydn.object");
ydn.db.sql.req.websql.ReduceNode = function(schema, sql) {
  goog.base(this, schema, sql)
};
goog.inherits(ydn.db.sql.req.websql.ReduceNode, ydn.db.sql.req.websql.Node);
ydn.db.sql.req.websql.ReduceNode.prototype.execute = function(df, tx, params) {
  var sql_stm = this.sql.getSql();
  var me = this;
  var out = [];
  var callback = function(transaction, results) {
    var n = results.rows.length;
    if(n == 1) {
      var value = ydn.object.takeFirst(results.rows.item(0));
      df.callback(value)
    }else {
      if(n == 0) {
        df.callback(undefined)
      }else {
        throw new ydn.db.InternalError;
      }
    }
  };
  var error_callback = function(tr, error) {
    if(ydn.db.sql.req.WebSql.DEBUG) {
      window.console.log([sql_stm, tr, error])
    }
    me.logger.warning("Sqlite error: " + error.message);
    df.errback(error);
    return true
  };
  if(ydn.db.sql.req.WebSql.DEBUG) {
    window.console.log(this + " open SQL: " + sql_stm + " PARAMS:" + ydn.json.stringify(params))
  }
  tx.executeSql(sql_stm, params, callback, error_callback)
};
goog.provide("ydn.db.sql.req.WebSql");
goog.require("ydn.db.index.req.WebSql");
goog.require("ydn.db.sql.req.SqlQuery");
goog.require("ydn.db.sql.req.IRequestExecutor");
goog.require("ydn.db.sql.req.websql.Node");
goog.require("ydn.db.sql.req.websql.ReduceNode");
ydn.db.sql.req.WebSql = function(dbname, schema) {
  goog.base(this, dbname, schema)
};
goog.inherits(ydn.db.sql.req.WebSql, ydn.db.index.req.WebSql);
ydn.db.sql.req.WebSql.DEBUG = false;
ydn.db.sql.req.WebSql.prototype.logger = goog.debug.Logger.getLogger("ydn.db.sql.req.WebSql");
ydn.db.sql.req.WebSql.prototype.explainSql = function(query) {
  return{"sql":query.getSql()}
};
ydn.db.sql.req.WebSql.prototype.executeSql = function(df, sql, params) {
  var store_names = sql.getStoreNames();
  if(store_names.length == 1) {
    var store_schema = this.schema.getStore(store_names[0]);
    if(!store_schema) {
      throw new ydn.db.NotFoundError(store_names[0]);
    }
    var fields = sql.getSelList();
    if(fields) {
      for(var i = 0;i < fields.length;i++) {
        if(!store_schema.hasIndex(fields[i])) {
          throw new ydn.db.NotFoundError('Index "' + fields[i] + '" not found in ' + store_names[0]);
        }
      }
    }
    var node;
    if(sql.getAggregate()) {
      node = new ydn.db.sql.req.websql.ReduceNode(store_schema, sql)
    }else {
      node = new ydn.db.sql.req.websql.Node(store_schema, sql)
    }
    node.execute(df, this.tx, params)
  }else {
    throw new ydn.error.NotSupportedException(sql.getSql());
  }
};
ydn.db.sql.req.WebSql.prototype.openSqlQuery = function(df, cursor, next_callback, mode) {
  var me = this;
  var sql = cursor.sql;
  var store = this.schema.getStore(cursor.getStoreName());
  var callback = function(transaction, results) {
    var n = results.rows.length;
    for(var i = 0;i < n;i++) {
      var row = results.rows.item(i);
      var value = {};
      var key = undefined;
      if(goog.isDefAndNotNull(row)) {
        value = cursor.parseRow(row, store);
        var key_str = goog.isDefAndNotNull(store.keyPath) ? row[store.keyPath] : row[ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME];
        key = ydn.db.schema.Index.sql2js(key_str, store.type);
        var to_continue = !goog.isFunction(cursor.continued) || cursor.continued(value);
        if(!goog.isFunction(cursor.filter_fn) || cursor.filter_fn(value)) {
          var peerKeys = [];
          var peerIndexKeys = [];
          var peerValues = [];
          var tx = mode === "readwrite" ? me.getTx() : null;
          var icursor = new ydn.db.WebsqlCursor(tx, key, null, value, peerKeys, peerIndexKeys, peerValues);
          var to_break = next_callback(icursor);
          icursor.dispose();
          if(to_break === true) {
            break
          }
        }
        if(!to_continue) {
          break
        }
      }
    }
    df.callback()
  };
  var error_callback = function(tr, error) {
    if(ydn.db.index.req.WebSql.DEBUG) {
      window.console.log([cursor, tr, error])
    }
    me.logger.warning("Sqlite error: " + error.message);
    df.errback(error);
    return true
  };
  if(goog.DEBUG) {
    this.logger.finest(this + " open SQL: " + sql + " PARAMS:" + ydn.json.stringify(cursor.params))
  }
  this.tx.executeSql(sql, cursor.params, callback, error_callback)
};
ydn.db.sql.req.WebSql.prototype.planQuery = function(query) {
  var store = this.schema.getStore(query.getStoreName());
  if(!store) {
    throw new ydn.db.SqlParseError("TABLE: " + query.getStoreName() + " not found.");
  }
  var sql = new ydn.db.sql.req.SqlQuery(query.getStoreName(), query.getIndexName(), ydn.db.KeyRange.clone(query.keyRange()), query.isReversed(), query.isUnique(), query.isKeyOnly());
  var select = "SELECT";
  var idx_name = sql.getIndexName();
  var index = goog.isDef(idx_name) ? store.getIndex(idx_name) : null;
  var key_column = index ? index.getKeyPath() : goog.isDefAndNotNull(store.keyPath) ? store.keyPath : ydn.db.base.SQLITE_SPECIAL_COLUNM_NAME;
  var column = goog.string.quote(key_column);
  var fields = query.isKeyOnly() ? column : "*";
  var from = fields + " FROM " + store.getQuotedName();
  var key_range = query.keyRange();
  var where_clause = "";
  if(key_range) {
    if(ydn.db.Where.resolvedStartsWith(key_range)) {
      where_clause = column + " LIKE ?";
      sql.params.push(key_range["lower"] + "%")
    }else {
      if(goog.isDef(key_range.lower)) {
        var lowerOp = key_range["lowerOpen"] ? " > " : " >= ";
        where_clause += " " + column + lowerOp + "?";
        sql.params.push(key_range.lower)
      }
      if(goog.isDef(key_range["upper"])) {
        var upperOp = key_range["upperOpen"] ? " < " : " <= ";
        var and = where_clause.length > 0 ? " AND " : " ";
        where_clause += and + column + upperOp + "?";
        sql.params.push(key_range.upper)
      }
    }
    where_clause = " WHERE " + "(" + where_clause + ")"
  }
  var dir = "ASC";
  if(query.isReversed()) {
    dir = "DESC"
  }
  var order = "ORDER BY " + column;
  sql.sql = [select, from, where_clause, order, dir].join(" ");
  return sql
};
goog.provide("ydn.db.sql.req.SimpleStore");
goog.require("ydn.db.index.req.SimpleStore");
goog.require("ydn.db.sql.req.IRequestExecutor");
ydn.db.sql.req.SimpleStore = function(dbname, schema) {
  goog.base(this, dbname, schema)
};
goog.inherits(ydn.db.sql.req.SimpleStore, ydn.db.index.req.SimpleStore);
ydn.db.sql.req.SimpleStore.prototype.executeSql = goog.abstractMethod;
ydn.db.sql.req.SimpleStore.prototype.explainSql = goog.abstractMethod;
goog.provide("ydn.db.sql.TxStorage");
goog.require("ydn.db.Iterator");
goog.require("ydn.db.index.TxStorage");
goog.require("ydn.db.sql.IStorage");
goog.require("ydn.db.sql.req.IRequestExecutor");
goog.require("ydn.db.sql.req.IndexedDb");
goog.require("ydn.db.sql.req.WebSql");
goog.require("ydn.db.sql.req.SimpleStore");
ydn.db.sql.TxStorage = function(storage, ptx_no, scope_name, schema) {
  goog.base(this, storage, ptx_no, scope_name, schema)
};
goog.inherits(ydn.db.sql.TxStorage, ydn.db.index.TxStorage);
ydn.db.sql.TxStorage.prototype.getExecutor = function() {
  if(!this.executor) {
    var type = this.type();
    if(type == ydn.db.con.IndexedDb.TYPE) {
      this.executor = new ydn.db.sql.req.IndexedDb(this.getName(), this.schema)
    }else {
      if(type == ydn.db.con.WebSql.TYPE) {
        this.executor = new ydn.db.sql.req.WebSql(this.db_name, this.schema)
      }else {
        if(type == ydn.db.con.SimpleStorage.TYPE || type == ydn.db.con.LocalStorage.TYPE || type == ydn.db.con.SessionStorage.TYPE) {
          this.executor = new ydn.db.sql.req.SimpleStore(this.db_name, this.schema)
        }else {
          throw new ydn.db.InternalError("No executor for " + type);
        }
      }
    }
  }
  return this.executor
};
ydn.db.sql.TxStorage.prototype.exec = function(callback, store_names, mode, scope) {
  goog.base(this, "exec", callback, store_names, mode, scope)
};
ydn.db.sql.TxStorage.prototype.explain = function(q) {
  if(!this.executor) {
    return{"error":"database not ready"}
  }else {
    if(q instanceof ydn.db.Sql) {
      return this.getExecutor().explainSql(q)
    }else {
      throw new ydn.error.ArgumentException;
    }
  }
};
ydn.db.sql.TxStorage.prototype.executeSql = function(sql, params) {
  var df = ydn.db.base.createDeferred();
  var query = new ydn.db.Sql(sql);
  var stores = query.getStoreNames();
  for(var i = 0;i < stores.length;i++) {
    var store = this.schema.getStore(stores[i]);
    if(!store) {
      throw new ydn.error.ArgumentException("store: " + store + " not exists.");
    }
  }
  this.exec(function(executor) {
    executor.executeSql(df, query, params || [])
  }, query.getStoreNames(), query.getMode(), "executeSql");
  return df
};
goog.provide("ydn.db.req.InMemoryStorage");
ydn.db.req.InMemoryStorage = function() {
  this.clear()
};
ydn.db.req.InMemoryStorage.prototype.setItem = function(key, value) {
  if(!goog.isDef(this.memoryStorage[key])) {
    this.keys.push(key.toString());
    this.length = this.keys.length
  }
  this.memoryStorage[key] = value
};
ydn.db.req.InMemoryStorage.prototype.getItem = function(key) {
  return this.memoryStorage[key] || null
};
ydn.db.req.InMemoryStorage.prototype.removeItem = function(key) {
  delete this.memoryStorage[key];
  goog.array.remove(this.keys, key.toString());
  this.length = this.keys.length
};
ydn.db.req.InMemoryStorage.prototype.length = 0;
ydn.db.req.InMemoryStorage.prototype.key = function(i) {
  var key = this.keys[i];
  return goog.isDef(key) ? this.memoryStorage[key] : null
};
ydn.db.req.InMemoryStorage.prototype.clear = function() {
  this.memoryStorage = {};
  this.keys = [];
  this.length = 0
};
goog.provide("ydn.db.con.SimpleStorage");
goog.require("goog.Timer");
goog.require("goog.asserts");
goog.require("goog.async.Deferred");
goog.require("ydn.db.Key");
goog.require("ydn.db.con.IDatabase");
goog.require("ydn.db.req.InMemoryStorage");
ydn.db.con.SimpleStorage = function(opt_localStorage) {
  this.cache_ = opt_localStorage || new ydn.db.req.InMemoryStorage
};
ydn.db.con.SimpleStorage.prototype.logger = goog.debug.Logger.getLogger("ydn.db.con.SimpleStorage");
ydn.db.con.SimpleStorage.TYPE = "memory";
ydn.db.con.SimpleStorage.isSupported = function() {
  return true
};
ydn.db.con.SimpleStorage.DEBUG = false;
ydn.db.con.SimpleStorage.NAMESPACE = "ydn.db";
ydn.db.con.SimpleStorage.SEP = "^|";
ydn.db.con.SimpleStorage.StoreSchema;
ydn.db.con.SimpleStorage.prototype.connect = function(dbname, schema) {
  this.dbname = dbname;
  this.schema = schema;
  this.storeSchema_ = {};
  for(var i = 0;i < schema.count();i++) {
    var store = schema.store(i);
    this.storeSchema_[store.getName()] = store.toJSON()
  }
  this.indexes = {};
  var db_key = this.makeKey();
  var ex_schema = ydn.json.parse(this.cache_.getItem(db_key));
  var stores = schema.getStoreNames();
  if(ex_schema) {
    for(var store_name in ex_schema) {
      if(ex_schema.hasOwnProperty(store_name)) {
        if(!schema.hasStore(store_name)) {
          var store_json = ex_schema[store_name];
          if(schema.isAutoSchema()) {
            this.logger.finer("Adding existing store: " + store_name);
            this.storeSchema_[store_name] = store_json
          }else {
            this.logger.finer("Deleting old store: " + store_name);
            this.removeItemInternal(store_name)
          }
        }else {
        }
      }
    }
  }else {
    this.cache_.setItem(db_key, ydn.json.stringify(this.storeSchema_))
  }
  return goog.async.Deferred.succeed(true)
};
ydn.db.con.SimpleStorage.prototype.isReady = function() {
  return!!this.dbname
};
ydn.db.con.SimpleStorage.prototype.getDbInstance = function() {
  return this.cache_ || null
};
ydn.db.con.SimpleStorage.DEFAULT_KEY_PATH = "_id_";
ydn.db.con.SimpleStorage.prototype.type = function() {
  return"memory"
};
ydn.db.con.SimpleStorage.prototype.close = function() {
};
ydn.db.con.SimpleStorage.prototype.getStorage = function() {
  return this.cache_
};
ydn.db.con.SimpleStorage.prototype.doTransaction = function(trFn, scopes, mode, oncompleted) {
  trFn(this);
  oncompleted(ydn.db.base.TransactionEventTypes.COMPLETE, {})
};
ydn.db.con.SimpleStorage.prototype.getSchema = function(callback) {
  goog.Timer.callOnce(function() {
    var stores = [];
    var db_value = this.cache_.getItem(this.makeKey());
    var store_names = db_value["stores"];
    for(var i = 0;i < store_names.length;i++) {
      var store_obj = this.cache_.getItem(this.makeKey(store_names[i]));
      stores[i] = new ydn.db.schema.Store(store_names[i], store_obj["keyPath"], store_obj["autoIncrement"])
    }
    var schema = new ydn.db.schema.Database(this.dbname, stores);
    callback(schema)
  }, 0, this)
};
ydn.db.con.SimpleStorage.prototype.extractKey = function(store, value, opt_key) {
  var key = goog.isDef(opt_key) ? opt_key : goog.isDefAndNotNull(store.keyPath) ? store.getKeyValue(value) : undefined;
  if(!goog.isDef(key)) {
    if(store.getAutoIncrement()) {
      var store_key = this.makeKey(store.name);
      var store_obj = this.storeSchema_[store.name];
      if(!goog.isDef(store_obj["autoIncrementNo"])) {
        store_obj["autoIncrementNo"] = this.getKeys(store.name, null).length
      }
      store_obj["autoIncrementNo"]++;
      key = store_obj["autoIncrementNo"]
    }else {
      if(ydn.db.con.SimpleStorage.DEBUG) {
        window.console.log([store, value, opt_key])
      }
      throw new ydn.db.InvalidKeyException;
    }
  }
  return key
};
ydn.db.con.SimpleStorage.prototype.makeKey = function(store_name, id) {
  var parts = [ydn.db.con.SimpleStorage.NAMESPACE, this.dbname];
  if(goog.isDef(store_name)) {
    parts.push(store_name);
    if(goog.isDef(id)) {
      parts.push(ydn.db.utils.encodeKey(id))
    }
  }
  return parts.join(ydn.db.con.SimpleStorage.SEP)
};
ydn.db.con.SimpleStorage.prototype.getItemInternal = function(store_name, id) {
  var store = store_name instanceof ydn.db.schema.Store ? store_name.name : store_name;
  var key = this.makeKey(store, id);
  var value = this.cache_.getItem(key);
  if(!goog.isNull(value)) {
    value = ydn.json.parse(value)
  }else {
    value = undefined
  }
  return value
};
ydn.db.con.SimpleStorage.prototype.setItemInternal = function(value, store_name, id) {
  var store = this.schema.getStore(store_name);
  var index_name = store.getKeyPath() || ydn.db.con.SimpleStorage.DEFAULT_KEY_PATH;
  goog.asserts.assertObject(value);
  var obj_id = this.extractKey(store, value, id);
  var key = this.makeKey(store_name, obj_id);
  var str = ydn.json.stringify(value);
  if(ydn.db.con.SimpleStorage.DEBUG) {
    window.console.log(["setItemInternal", store_name, id, obj_id, key, str])
  }
  this.cache_.setItem(key, str);
  var idx_arr = this.storeSchema_[store_name]["Keys"];
  if(idx_arr) {
    goog.asserts.assertArray(idx_arr);
    for(var i = 0, n = idx_arr.length;i < n;i++) {
      if(obj_id == idx_arr[i]) {
        break
      }else {
        if(obj_id > idx_arr[i]) {
          goog.array.insertAt(idx_arr, obj_id, i);
          break
        }
      }
    }
  }
  return obj_id
};
ydn.db.con.SimpleStorage.prototype.removeItemInternal = function(store_name, id) {
  if(goog.isDef(id)) {
    this.cache_.removeItem(this.makeKey(store_name, id));
    var idx_arr = this.storeSchema_[store_name]["Keys"];
    if(goog.isDef(idx_arr)) {
      goog.array.remove(idx_arr, id)
    }
  }else {
    if(goog.isDef(store_name)) {
      if(this.storeSchema_[store_name]) {
        this.storeSchema_[store_name]["Keys"] = null
      }
      var base = this.makeKey(store_name) + ydn.db.con.SimpleStorage.SEP;
      for(var i = this.cache_.length - 1;i >= 0;i--) {
        var k = this.cache_.key(i);
        goog.asserts.assertString(k);
        if(goog.string.startsWith(k, base)) {
          this.cache_.removeItem(k)
        }
      }
    }else {
      var base = this.makeKey() + ydn.db.con.SimpleStorage.SEP;
      for(var i = this.cache_.length - 1;i >= 0;i--) {
        var k = this.cache_.key(i);
        goog.asserts.assertString(k);
        if(goog.string.startsWith(k, base)) {
          this.cache_.removeItem(k)
        }
      }
    }
  }
};
ydn.db.con.SimpleStorage.prototype.index = function(store_name, index_name) {
  var store_json = this.storeSchema_[store_name];
  var keys = store_json["Keys"];
  if(!goog.isDefAndNotNull(keys)) {
    keys = [];
    var indexes = {};
    var base = this.makeKey(store_name);
    base += ydn.db.con.SimpleStorage.SEP;
    for(var i = 0, n = this.cache_.length;i < n;i++) {
      var key = this.cache_.key(i);
      goog.asserts.assertString(key);
      if(goog.string.startsWith(key, base)) {
        keys.push(key);
        for(var j = 0, m = store_json.indexes.length;j < m;j++) {
          var idxKeyPath = store_json.indexes[i]
        }
      }
    }
    goog.array.sort(keys);
    store_json["Keys"] = keys;
    store_json["indexes"] = indexes
  }
  return keys
};
ydn.db.con.SimpleStorage.prototype.getKeys = function(store_name, index_name, lower, upper, lowerOpen, upperOpen) {
  if(goog.isDefAndNotNull(index_name)) {
    throw new ydn.error.NotImplementedException;
  }
  var keys = this.index(store_name);
  var cmp_upper = function() {
    if(upperOpen) {
      return function(x) {
        return x <= upper
      }
    }else {
      return function(x) {
        return x < upper
      }
    }
  };
  var cmp_lower = function() {
    if(lowerOpen) {
      return function(x) {
        return x > lower
      }
    }else {
      return function(x) {
        return x >= lower
      }
    }
  };
  if(!goog.isDef(lower) && !goog.isDef(upper)) {
    return keys
  }else {
    if(!goog.isDef(lower)) {
      var idx = goog.array.findIndex(keys, cmp_upper());
      return keys.slice(0, idx)
    }else {
      if(!goog.isDef(upper)) {
        var idx = goog.array.findIndex(keys, cmp_lower());
        return keys.slice(idx)
      }else {
        var idx1 = goog.array.findIndex(keys, cmp_upper());
        var idx2 = goog.array.findIndex(keys, cmp_lower());
        return keys.slice(idx1, idx2)
      }
    }
  }
};
goog.provide("ydn.db.con.LocalStorage");
goog.provide("ydn.db.con.SessionStorage");
goog.require("ydn.db.con.SimpleStorage");
ydn.db.con.LocalStorage = function() {
  goog.asserts.assertObject(window.localStorage);
  goog.base(this, window.localStorage)
};
goog.inherits(ydn.db.con.LocalStorage, ydn.db.con.SimpleStorage);
ydn.db.con.LocalStorage.isSupported = function() {
  return!!window.localStorage
};
ydn.db.con.LocalStorage.TYPE = "localstorage";
ydn.db.con.LocalStorage.prototype.type = function() {
  return ydn.db.con.LocalStorage.TYPE
};
ydn.db.con.LocalStorage.deleteDatabase = function(db_name) {
  var db = new ydn.db.con.LocalStorage;
  var schema = new ydn.db.schema.EditableDatabase;
  db.connect(db_name, schema);
  db.removeItemInternal()
};
ydn.db.con.SessionStorage = function() {
  goog.asserts.assertObject(window.sessionStorage);
  goog.base(this, window.sessionStorage)
};
goog.inherits(ydn.db.con.SessionStorage, ydn.db.con.SimpleStorage);
ydn.db.con.SessionStorage.isSupported = function() {
  return!!window.sessionStorage
};
ydn.db.con.SessionStorage.TYPE = "sessionstorage";
ydn.db.con.SessionStorage.prototype.type = function() {
  return ydn.db.con.SessionStorage.TYPE
};
ydn.db.con.SessionStorage.deleteDatabase = function(db_name) {
  var db = new ydn.db.con.SessionStorage;
  var schema = new ydn.db.schema.EditableDatabase;
  db.connect(db_name, schema);
  db.removeItemInternal()
};
goog.provide("ydn.db.events.StoreEvent");
goog.provide("ydn.db.events.StorageEvent");
goog.provide("ydn.db.events.Types");
ydn.db.events.Types = {CONNECTED:"connected", CREATED:"created", DELETED:"deleted", FAIL:"failed", UPDATED:"updated"};
ydn.db.events.Event = function(event_type, event_target, source) {
  goog.base(this, event_type, event_target);
  this.source = source
};
goog.inherits(ydn.db.events.Event, goog.events.Event);
ydn.db.events.Event.prototype.source = null;
ydn.db.events.StorageEvent = function(event_type, event_target, source, msg) {
  goog.base(this, event_type, event_target, source);
  this.message = msg || ""
};
goog.inherits(ydn.db.events.StorageEvent, ydn.db.events.Event);
ydn.db.events.StorageEvent.prototype.message = "";
ydn.db.events.StoreEvent = function(event_type, event_target, source) {
  goog.base(this, event_type, event_target, source)
};
goog.inherits(ydn.db.events.StoreEvent, ydn.db.events.Event);
goog.provide("ydn.db.schema.EditableDatabase");
goog.require("ydn.db.schema.Database");
ydn.db.schema.EditableDatabase = function(version, opt_stores) {
  goog.base(this, version, opt_stores)
};
goog.inherits(ydn.db.schema.EditableDatabase, ydn.db.schema.Database);
ydn.db.schema.EditableDatabase.prototype.isAutoSchema = function() {
  return true
};
ydn.db.schema.EditableDatabase.prototype.addStore = function(table) {
  this.stores.push(table)
};
/*
 Copyright 2012 YDN Authors, Yathit. All Rights Reserved.
*/
goog.provide("ydn.db.con.Storage");
goog.require("goog.events.EventTarget");
goog.require("goog.userAgent.product");
goog.require("ydn.async");
goog.require("ydn.db.con.IStorage");
goog.require("ydn.db.con.IndexedDb");
goog.require("ydn.db.con.LocalStorage");
goog.require("ydn.db.con.SessionStorage");
goog.require("ydn.db.con.SimpleStorage");
goog.require("ydn.db.con.WebSql");
goog.require("ydn.db.events.StorageEvent");
goog.require("ydn.db.schema.EditableDatabase");
goog.require("ydn.error.ArgumentException");
goog.require("ydn.object");
ydn.db.con.Storage = function(opt_dbname, opt_schema, opt_options) {
  goog.base(this);
  var options = opt_options || {};
  if(goog.DEBUG) {
    var fields = ["autoSchema", "size", "mechanisms"];
    for(var key in options) {
      if(options.hasOwnProperty(key) && goog.array.indexOf(fields, key) == -1) {
        throw new ydn.error.ArgumentException('Unknown attribute "' + key + '" in options.');
      }
    }
  }
  this.mechanisms = options.mechanisms || ydn.db.con.Storage.PREFERENCE;
  this.size = options.size;
  this.use_text_store = goog.isDef(options.use_text_store) ? options.use_text_store : ydn.db.base.ENABLE_DEFAULT_TEXT_STORE;
  this.db_ = null;
  this.txQueue_ = [];
  this.in_version_change_tx_ = false;
  var schema;
  if(opt_schema instanceof ydn.db.schema.Database) {
    schema = opt_schema
  }else {
    if(goog.isObject(opt_schema)) {
      if(options.autoSchema || !goog.isDef(opt_schema["stores"])) {
        schema = new ydn.db.schema.EditableDatabase(opt_schema)
      }else {
        schema = new ydn.db.schema.Database(opt_schema)
      }
    }else {
      schema = new ydn.db.schema.EditableDatabase
    }
  }
  this.schema = schema;
  if(goog.isDef(opt_dbname)) {
    this.setName(opt_dbname)
  }
};
goog.inherits(ydn.db.con.Storage, goog.events.EventTarget);
ydn.db.con.Storage.prototype.logger = goog.debug.Logger.getLogger("ydn.db.con.Storage");
ydn.db.con.Storage.prototype.getSchema = function(opt_callback) {
  if(goog.isDef(opt_callback)) {
    var callback = function(schema) {
      opt_callback(schema.toJSON())
    };
    if(this.db_) {
      this.db_.getSchema(callback)
    }else {
      var me = this;
      goog.asserts.assertFunction(callback);
      var get_schema = function(tx) {
        me.db_.getSchema(callback, tx)
      };
      this.transaction(get_schema, null, ydn.db.base.TransactionMode.READ_ONLY)
    }
  }
  return this.schema ? this.schema.toJSON() : null
};
ydn.db.con.Storage.prototype.addStoreSchema = function(store_schema) {
  var new_store = store_schema instanceof ydn.db.schema.Store ? store_schema : ydn.db.schema.Store.fromJSON(store_schema);
  var store_name = store_schema.name;
  var store = this.schema.getStore(store_name);
  if(!new_store.similar(store)) {
    var action = store ? "update" : "add";
    if(this.schema instanceof ydn.db.schema.EditableDatabase) {
      var schema = this.schema;
      schema.addStore(new_store);
      if(this.db_) {
        this.db_.close();
        this.db_ = null;
        return this.connectDatabase()
      }else {
        return goog.async.Deferred.succeed(false)
      }
    }else {
      throw new ydn.error.ConstrainError("Cannot " + action + " store: " + store_name + ". Not auto schema generation mode.");
    }
  }else {
    return goog.async.Deferred.succeed(false)
  }
};
ydn.db.con.Storage.prototype.setName = function(opt_db_name) {
  if(this.db_) {
    throw Error("Already defined.");
  }
  this.db_name = opt_db_name;
  this.connectDatabase()
};
ydn.db.con.Storage.prototype.schema;
ydn.db.con.Storage.prototype.getName = function() {
  return this.db_name
};
ydn.db.con.Storage.PREFERENCE = [ydn.db.con.IndexedDb.TYPE, ydn.db.con.WebSql.TYPE, ydn.db.con.LocalStorage.TYPE, ydn.db.con.SessionStorage.TYPE, ydn.db.con.SimpleStorage.TYPE];
ydn.db.con.Storage.prototype.createDbInstance = function(db_type) {
  if(db_type == ydn.db.con.IndexedDb.TYPE) {
    return new ydn.db.con.IndexedDb(this.size)
  }else {
    if(db_type == ydn.db.con.WebSql.TYPE) {
      return new ydn.db.con.WebSql(this.size)
    }else {
      if(db_type == ydn.db.con.LocalStorage.TYPE) {
        return new ydn.db.con.LocalStorage
      }else {
        if(db_type == ydn.db.con.SessionStorage.TYPE) {
          return new ydn.db.con.SessionStorage
        }else {
          if(db_type == ydn.db.con.SimpleStorage.TYPE) {
            return new ydn.db.con.SimpleStorage
          }
        }
      }
    }
  }
  return null
};
ydn.db.con.Storage.prototype.connectDatabase = function() {
  goog.asserts.assertString(this.db_name);
  var df = new goog.async.Deferred;
  var db = null;
  if(goog.userAgent.product.ASSUME_CHROME || goog.userAgent.product.ASSUME_FIREFOX) {
    db = this.createDbInstance(ydn.db.con.IndexedDb.TYPE)
  }else {
    if(goog.userAgent.product.ASSUME_SAFARI) {
      db = this.createDbInstance(ydn.db.con.WebSql.TYPE)
    }else {
      var preference = this.mechanisms;
      for(var i = 0;i < preference.length;i++) {
        var db_type = preference[i].toLowerCase();
        if(db_type == ydn.db.con.IndexedDb.TYPE && ydn.db.con.IndexedDb.isSupported()) {
          db = this.createDbInstance(db_type);
          break
        }else {
          if(db_type == ydn.db.con.WebSql.TYPE && ydn.db.con.WebSql.isSupported()) {
            db = this.createDbInstance(db_type);
            break
          }else {
            if(db_type == ydn.db.con.LocalStorage.TYPE && ydn.db.con.LocalStorage.isSupported()) {
              db = this.createDbInstance(db_type);
              break
            }else {
              if(db_type == ydn.db.con.SessionStorage.TYPE && ydn.db.con.SessionStorage.isSupported()) {
                db = this.createDbInstance(db_type);
                break
              }else {
                if(db_type == ydn.db.con.SimpleStorage.TYPE) {
                  db = this.createDbInstance(db_type);
                  break
                }
              }
            }
          }
        }
      }
    }
  }
  if(goog.isNull(db)) {
    throw new ydn.error.ConstrainError("No storage mechanism found.");
  }
  var me = this;
  this.init();
  db.connect(this.db_name, this.schema).addCallback(function(ok) {
    me.db_ = db;
    me.logger.finest(me + ": ready.");
    me.last_queue_checkin_ = NaN;
    goog.async.Deferred.succeed(true);
    me.popTxQueue_();
    var event = new ydn.db.events.StorageEvent(ydn.db.events.Types.CONNECTED, me, null);
    me.dispatchEvent(event);
    db.onDisconnected = function(e) {
      me.logger.finest(me + ": disconnected.")
    }
  }).addErrback(function(e) {
    me.logger.warning(me + ": opening fail: " + e.message);
    goog.async.Deferred.fail(e);
    me.purgeTxQueue_(e);
    var event = new ydn.db.events.StorageEvent(ydn.db.events.Types.FAIL, me, e, "opening database fail: " + e.message);
    me.dispatchEvent(event)
  });
  return df
};
ydn.db.con.Storage.prototype.type = function() {
  if(this.db_) {
    return this.db_.type()
  }else {
    return""
  }
};
ydn.db.con.Storage.prototype.isReady = function() {
  return!!this.db_ && this.db_.isReady()
};
ydn.db.con.Storage.prototype.init = function() {
};
ydn.db.con.Storage.prototype.close = function() {
  if(this.db_) {
    this.db_.close();
    this.db_ = null
  }
};
ydn.db.con.Storage.prototype.getDbInstance = function() {
  return this.db_ ? this.db_.getDbInstance() : null
};
ydn.db.con.Storage.prototype.last_queue_checkin_ = NaN;
ydn.db.con.Storage.timeOut = goog.DEBUG || ydn.db.con.IndexedDb.DEBUG ? 500 : 3E3;
ydn.db.con.Storage.QUEUE_LIMIT = 100;
ydn.db.con.Storage.prototype.popTxQueue_ = function() {
  var task = this.txQueue_.shift();
  if(task) {
    ydn.db.con.Storage.prototype.transaction.call(this, task.fnc, task.scopes, task.mode, task.oncompleted)
  }
  this.last_queue_checkin_ = goog.now()
};
ydn.db.con.Storage.prototype.pushTxQueue_ = function(trFn, store_names, opt_mode, completed_event_handler) {
  this.txQueue_.push({fnc:trFn, scopes:store_names, mode:opt_mode, oncompleted:completed_event_handler});
  var now = goog.now();
  if(goog.DEBUG && this.txQueue_.length > ydn.db.con.Storage.QUEUE_LIMIT && this.txQueue_.length % ydn.db.con.Storage.QUEUE_LIMIT == 0) {
    this.logger.warning("Transaction queue stack size is " + this.txQueue_.length + ". It is too large, possibility due to incorrect usage.")
  }
};
ydn.db.con.Storage.prototype.purgeTxQueue_ = function(e) {
  if(this.txQueue_) {
    this.logger.info("Purging " + this.txQueue_.length + " transactions request.");
    var task = this.txQueue_.shift();
    while(task) {
      task.oncompleted(ydn.db.base.TransactionEventTypes.ERROR, e);
      task = this.txQueue_.shift()
    }
  }
};
ydn.db.con.Storage.prototype.in_version_change_tx_ = false;
ydn.db.con.Storage.prototype.transaction = function(trFn, store_names, opt_mode, completed_event_handler) {
  var names = store_names;
  if(goog.isString(store_names)) {
    names = [store_names]
  }else {
    if(!goog.isDefAndNotNull(store_names)) {
      names = null
    }else {
      if(!goog.isArray(store_names) || !goog.isString(store_names[0])) {
        throw new ydn.error.ArgumentException("storeNames");
      }
    }
  }
  var is_ready = !!this.db_ && this.db_.isReady();
  if(!is_ready || this.in_version_change_tx_) {
    this.pushTxQueue_(trFn, names, opt_mode, completed_event_handler);
    return
  }
  var me = this;
  var mode = goog.isDef(opt_mode) ? opt_mode : ydn.db.base.TransactionMode.READ_ONLY;
  if(mode == ydn.db.base.TransactionMode.VERSION_CHANGE) {
    this.in_version_change_tx_ = true
  }
  var on_complete = function(type, ev) {
    if(goog.isFunction(completed_event_handler)) {
      completed_event_handler(type, ev)
    }
    if(mode == ydn.db.base.TransactionMode.VERSION_CHANGE) {
      me.in_version_change_tx_ = false
    }
    me.popTxQueue_()
  };
  this.db_.doTransaction(function(tx) {
    trFn(tx)
  }, names, mode, on_complete)
};
ydn.db.con.Storage.prototype.isAutoVersion = function() {
  return this.schema.isAutoVersion()
};
ydn.db.con.Storage.prototype.isAutoSchema = function() {
  return this.schema.isAutoSchema()
};
ydn.db.con.Storage.prototype.toString = function() {
  return"ydn.db.con.Storage:" + this.db_
};
goog.provide("ydn.db.tr.Mutex");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("ydn.db.InvalidStateError");
ydn.db.tr.Mutex = function(tr_no) {
  this.tr_no = tr_no;
  this.tx_ = null;
  this.tx_count_ = 0
};
ydn.db.tr.Mutex.prototype.logger = goog.debug.Logger.getLogger("ydn.db.tr.Mutex");
ydn.db.tr.Mutex.DEBUG = false;
ydn.db.tr.Mutex.prototype.up = function(tx, scope) {
  goog.asserts.assert(!this.tx_, this + "transaction overlap with " + scope);
  this.tx_ = tx;
  this.is_locked_ = false;
  this.out_of_scope_ = false;
  this.scope_name = goog.isDef(scope) ? scope : "";
  this.tx_count_++;
  this.oncompleted = null;
  if(ydn.db.tr.Mutex.DEBUG) {
    window.console.log(this + ": open")
  }else {
    this.logger.finest(this + ": open")
  }
};
ydn.db.tr.Mutex.prototype.idb_tx_ = null;
ydn.db.tr.Mutex.prototype.is_set_done_ = false;
ydn.db.tr.Mutex.prototype.scope_name = "";
ydn.db.tr.Mutex.prototype.getScope = function() {
  return this.scope_name
};
ydn.db.tr.Mutex.prototype.down = function(type, event) {
  if(this.tx_) {
    if(ydn.db.tr.Mutex.DEBUG) {
      window.console.log(this + ": close")
    }else {
      this.logger.finest(this + ": close")
    }
    this.tx_ = null;
    if(goog.isFunction(this.oncompleted)) {
      this.oncompleted(type, event)
    }
    this.oncompleted = null
  }else {
    this.logger.warning(this + " has no TX to be unlocked for " + type)
  }
};
ydn.db.tr.Mutex.prototype.out = function() {
  this.out_of_scope_ = true
};
ydn.db.tr.Mutex.prototype.inScope = function() {
  return!this.out_of_scope_
};
ydn.db.tr.Mutex.prototype.lock = function() {
  if(ydn.db.tr.Mutex.DEBUG) {
    window.console.log(this + ": locked")
  }else {
    this.logger.finest(this + ": locked")
  }
  this.is_locked_ = true
};
ydn.db.tr.Mutex.prototype.getTxCount = function() {
  return this.tx_count_
};
ydn.db.tr.Mutex.prototype.isLocked = function() {
  return this.is_locked_
};
ydn.db.tr.Mutex.prototype.isActive = function() {
  return!!this.tx_
};
ydn.db.tr.Mutex.prototype.isAvailable = function() {
  return!this.is_locked_
};
ydn.db.tr.Mutex.prototype.isActiveAndAvailable = function() {
  return this.isActive() && this.isAvailable()
};
ydn.db.tr.Mutex.prototype.oncompleted = null;
ydn.db.tr.Mutex.prototype.getTx = function() {
  return this.tx_
};
ydn.db.tr.Mutex.prototype.toString = function() {
  var s = "Mutex";
  if(goog.DEBUG) {
    var sc = !!this.scope_name ? "[" + this.scope_name + "]" : "";
    s = s + ":" + this.tr_no + ":" + this.tx_count_ + sc
  }
  return s
};
goog.provide("ydn.db.tr.IStorage");
goog.require("ydn.db.tr.Mutex");
ydn.db.tr.IStorage = function() {
};
ydn.db.tr.IStorage.prototype.run = goog.abstractMethod;
ydn.db.tr.IStorage.getTx = goog.abstractMethod;
ydn.db.tr.IStorage.prototype.getTxNo = goog.abstractMethod;
goog.provide("ydn.db.tr.Storage");
goog.require("ydn.db.con.Storage");
goog.require("ydn.db.tr.IStorage");
goog.require("ydn.db.tr.TxStorage");
ydn.db.tr.Storage = function(opt_dbname, opt_schema, opt_options) {
  goog.base(this, opt_dbname, opt_schema, opt_options);
  this.ptx_no = 0
};
goog.inherits(ydn.db.tr.Storage, ydn.db.con.Storage);
ydn.db.tr.Storage.prototype.ptx_no = 0;
ydn.db.tr.Storage.prototype.getTxNo = function() {
  return this.ptx_no
};
ydn.db.tr.Storage.prototype.newTxInstance = function(scope_name) {
  return new ydn.db.tr.TxStorage(this, this.ptx_no++, scope_name)
};
ydn.db.tr.Storage.prototype.run = function(trFn, store_names, opt_mode, oncompleted, opt_args) {
  var scope_name = trFn.name || "";
  var tx_queue = this.newTxInstance(scope_name);
  if(arguments.length > 4) {
    var args = Array.prototype.slice.call(arguments, 4);
    var outFn = function() {
      var newArgs = Array.prototype.slice.call(arguments);
      newArgs = newArgs.concat(args);
      return trFn.apply(this, newArgs)
    };
    outFn.name = trFn.name;
    tx_queue.run(outFn, store_names, opt_mode, oncompleted)
  }else {
    tx_queue.run(trFn, store_names, opt_mode, oncompleted)
  }
};
goog.provide("ydn.db.core.Storage");
goog.require("goog.userAgent.product");
goog.require("ydn.async");
goog.require("ydn.db.core.IStorage");
goog.require("ydn.db.core.TxStorage");
goog.require("ydn.db.tr.Storage");
goog.require("ydn.object");
ydn.db.core.Storage = function(opt_dbname, opt_schema, opt_options) {
  goog.base(this, opt_dbname, opt_schema, opt_options);
  this.default_tx_queue_ = this.newTxInstance("base")
};
goog.inherits(ydn.db.core.Storage, ydn.db.tr.Storage);
ydn.db.core.Storage.prototype.init = function() {
  goog.base(this, "init")
};
ydn.db.core.Storage.prototype.newTxInstance = function(scope_name) {
  return new ydn.db.core.TxStorage(this, this.ptx_no++, scope_name, this.schema)
};
ydn.db.core.Storage.prototype.getTxNo = function() {
  return this.default_tx_queue_.getTxNo()
};
ydn.db.core.Storage.prototype.count = function(store_name, key_range, index) {
  return this.default_tx_queue_.count(store_name, key_range, index)
};
ydn.db.core.Storage.prototype.get = function(arg1, arg2) {
  return this.default_tx_queue_.get(arg1, arg2)
};
ydn.db.core.Storage.prototype.keys = function(store_name, arg2, arg3, arg4, arg5, arg6, arg7) {
  return this.default_tx_queue_.keys(store_name, arg2, arg3, arg4, arg5, arg6, arg7)
};
ydn.db.core.Storage.prototype.list = function(arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  return this.default_tx_queue_.list(arg1, arg2, arg3, arg4, arg5, arg6, arg7)
};
ydn.db.core.Storage.prototype.put = function(store, value, opt_key) {
  return this.default_tx_queue_.put(store, value, opt_key)
};
ydn.db.core.Storage.prototype.clear = function(arg1, arg2) {
  return this.default_tx_queue_.clear(arg1, arg2)
};
ydn.db.core.Storage.prototype.toString = function() {
  var s = "Storage:" + this.getName();
  if(goog.DEBUG && this.default_tx_queue_) {
    return s + ":" + this.default_tx_queue_.getTxNo()
  }
  return s
};
goog.provide("ydn.db.index.Storage");
goog.require("ydn.db.index.TxStorage");
goog.require("ydn.db.core.Storage");
ydn.db.index.Storage = function(opt_dbname, opt_schema, opt_options) {
  goog.base(this, opt_dbname, opt_schema, opt_options)
};
goog.inherits(ydn.db.index.Storage, ydn.db.core.Storage);
ydn.db.index.Storage.prototype.newTxInstance = function(scope_name) {
  return new ydn.db.index.TxStorage(this, this.ptx_no++, scope_name, this.schema)
};
ydn.db.index.Storage.prototype.open = function(iterator, callback, mode) {
  return this.default_tx_queue_.open(iterator, callback, mode)
};
ydn.db.index.Storage.prototype.scan = function(iterators, solver, streamers) {
  return this.default_tx_queue_.scan(iterators, solver, streamers)
};
ydn.db.index.Storage.prototype.explain = function(q) {
  return this.default_tx_queue_.explain(q)
};
ydn.db.index.Storage.prototype.map = function(iterator, callback) {
  return this.default_tx_queue_.map(iterator, callback)
};
ydn.db.index.Storage.prototype.reduce = function(iterator, callback, initial) {
  return this.default_tx_queue_.reduce(iterator, callback, initial)
};
goog.provide("ydn.db.sql.Storage");
goog.require("ydn.db.sql.TxStorage");
goog.require("ydn.db.index.Storage");
ydn.db.sql.Storage = function(opt_dbname, opt_schema, opt_options) {
  goog.base(this, opt_dbname, opt_schema, opt_options)
};
goog.inherits(ydn.db.sql.Storage, ydn.db.index.Storage);
ydn.db.sql.Storage.prototype.newTxInstance = function(scope_name) {
  return new ydn.db.sql.TxStorage(this, this.ptx_no++, scope_name, this.schema)
};
ydn.db.sql.Storage.prototype.executeSql = function(sql, params) {
  return this.default_tx_queue_.executeSql(sql, params)
};
goog.provide("ydn.db.algo");
goog.require("ydn.error.ArgumentException");
ydn.db.algo.nestedLoopJoin = function() {
  var current_loop;
  return function(keys, index_keys) {
    if(!goog.isDef(current_loop)) {
      current_loop = keys.length - 1
    }
    var advancement = [];
    advancement[keys.length - 1] = null;
    var has_adv = false;
    for(var i = 0;i < keys.length;i++) {
      if(!goog.isDef(keys[i])) {
        if(i != 0) {
          keys[i] = false;
          keys[i - 1] = true
        }
        has_adv = true;
        break
      }
    }
    if(!has_adv) {
      advancement[current_loop] = true
    }
    return advancement
  }
};
ydn.db.getAlgorithm = function(name) {
  if(name === "nested-loop-join") {
    return ydn.db.algo.nestedLoopJoin()
  }else {
    throw new ydn.error.ArgumentException("Unknown algorithm: " + name);
  }
};
goog.provide("ydn.db.TxStorage");
goog.require("ydn.db.sql.TxStorage");
goog.require("ydn.db.algo");
goog.require("ydn.error.NotSupportedException");
ydn.db.TxStorage = function(storage, ptx_no, scope_name, schema) {
  goog.base(this, storage, ptx_no, scope_name, schema)
};
goog.inherits(ydn.db.TxStorage, ydn.db.sql.TxStorage);
ydn.db.TxStorage.KEY_VALUE_STORE_SCHEMA = {"name":ydn.db.schema.Store.DEFAULT_TEXT_STORE, "keyPath":"id", "type":ydn.db.schema.DataType.TEXT};
ydn.db.TxStorage.prototype.setItem = function(key, value, opt_expiration) {
  var wrapper = this.getStorage().getWrapper();
  if(wrapper) {
    value = wrapper.wrapValue(key, value, opt_expiration)
  }
  var store = ydn.db.schema.Store.DEFAULT_TEXT_STORE;
  if(!this.schema.hasStore(ydn.db.schema.Store.DEFAULT_TEXT_STORE)) {
    if(this.schema.isAutoSchema()) {
      store = ydn.db.TxStorage.KEY_VALUE_STORE_SCHEMA
    }else {
      throw new ydn.error.ArgumentException("key-value store not in used.");
    }
  }
  return this.put(store, {"id":key, "value":value})
};
ydn.db.TxStorage.prototype.removeItem = function(id) {
  return this.clear(ydn.db.schema.Store.DEFAULT_TEXT_STORE, id)
};
ydn.db.TxStorage.prototype.getItem = function(key) {
  var out = this.get(ydn.db.schema.Store.DEFAULT_TEXT_STORE, key);
  var df = new goog.async.Deferred;
  var me = this;
  out.addCallback(function(data) {
    if(goog.isDef(data)) {
      var value = data["value"];
      var wrapper = me.getStorage().getWrapper();
      if(wrapper && goog.isDef(value)) {
        value = wrapper.unwrapValue(key, value)
      }
      df.callback(value)
    }else {
      df.callback(undefined)
    }
  });
  out.addErrback(function(data) {
    df.errback(data)
  });
  return df
};
ydn.db.TxStorage.prototype.toString = function() {
  var s = "TxStorage:" + this.getStorage().getName();
  if(goog.DEBUG) {
    var scope = this.getScope();
    scope = scope ? "[" + scope + "]" : "";
    var mu = this.getMuTx().getScope();
    var mu_scope = mu ? "[" + mu + "]" : "";
    return s + ":" + this.q_no_ + scope + ":" + this.getTxNo() + mu_scope
  }
  return s
};
goog.provide("ydn.db.IStorage");
goog.require("ydn.db.index.IStorage");
ydn.db.IStorage = function() {
};
goog.provide("ydn.db.Storage");
goog.require("goog.userAgent.product");
goog.require("ydn.async");
goog.require("ydn.object");
if(ydn.db.base.ENABLE_ENCRYPTION) {
  goog.require("ydn.db.RichStorage_")
}
goog.require("ydn.db.sql.Storage");
goog.require("ydn.db.TxStorage");
goog.require("ydn.db.IStorage");
ydn.db.Storage = function(opt_dbname, opt_schema, opt_options) {
  goog.base(this, opt_dbname, opt_schema, opt_options)
};
goog.inherits(ydn.db.Storage, ydn.db.sql.Storage);
ydn.db.Storage.prototype.init = function() {
  goog.base(this, "init")
};
ydn.db.Storage.prototype.newTxInstance = function(scope_name) {
  return new ydn.db.TxStorage(this, this.ptx_no++, scope_name, this.schema)
};
ydn.db.Storage.prototype.encrypt = function(secret, opt_expiration) {
  if(ydn.db.base.ENABLE_ENCRYPTION) {
    this.wrapper = new ydn.db.RichStorage(this, secret, opt_expiration)
  }
};
ydn.db.Storage.prototype.getWrapper = function() {
  return this.wrapper || null
};
ydn.db.Storage.prototype.getItem = function(key) {
  return this.default_tx_queue_.getItem(key)
};
ydn.db.Storage.prototype.setItem = function(key, value, opt_expiration) {
  return this.default_tx_queue_.setItem(key, value, opt_expiration)
};
ydn.db.Storage.prototype.removeItem = function(id) {
  return this.default_tx_queue_.removeItem(id)
};
ydn.db.Storage.prototype.toString = function() {
  var s = "Storage:" + this.getName();
  if(goog.DEBUG && this.default_tx_queue_) {
    return s + ":" + this.default_tx_queue_.getTxNo()
  }
  return s
};
goog.addDependency("../../third_party/closure/goog/caja/string/html/htmlparser.js", ["goog.string.html.HtmlParser", "goog.string.html.HtmlParser.EFlags", "goog.string.html.HtmlParser.Elements", "goog.string.html.HtmlParser.Entities", "goog.string.html.HtmlSaxHandler"], []);
goog.addDependency("../../third_party/closure/goog/caja/string/html/htmlsanitizer.js", ["goog.string.html.HtmlSanitizer", "goog.string.html.HtmlSanitizer.AttributeType", "goog.string.html.HtmlSanitizer.Attributes", "goog.string.html.htmlSanitize"], ["goog.string.StringBuffer", "goog.string.html.HtmlParser", "goog.string.html.HtmlParser.EFlags", "goog.string.html.HtmlParser.Elements", "goog.string.html.HtmlSaxHandler"]);
goog.addDependency("../../third_party/closure/goog/dojo/dom/query.js", ["goog.dom.query"], ["goog.array", "goog.dom", "goog.functions", "goog.string", "goog.userAgent"]);
goog.addDependency("../../third_party/closure/goog/jpeg_encoder/jpeg_encoder_basic.js", ["goog.crypt.JpegEncoder"], ["goog.crypt.base64"]);
goog.addDependency("../../third_party/closure/goog/loremipsum/text/loremipsum.js", ["goog.text.LoremIpsum"], ["goog.array", "goog.math", "goog.string", "goog.structs.Map", "goog.structs.Set"]);
goog.addDependency("../../third_party/closure/goog/mochikit/async/deferred.js", ["goog.async.Deferred", "goog.async.Deferred.AlreadyCalledError", "goog.async.Deferred.CancelledError"], ["goog.array", "goog.asserts", "goog.debug.Error"]);
goog.addDependency("../../third_party/closure/goog/mochikit/async/deferredlist.js", ["goog.async.DeferredList"], ["goog.array", "goog.async.Deferred"]);
goog.addDependency("../../third_party/closure/goog/osapi/osapi.js", ["goog.osapi"], []);
goog.addDependency("../../third_party/closure/goog/silverlight/clipboardbutton.js", ["goog.silverlight.ClipboardButton", "goog.silverlight.ClipboardButtonType", "goog.silverlight.ClipboardEvent", "goog.silverlight.CopyButton", "goog.silverlight.PasteButton", "goog.silverlight.PasteButtonEvent"], ["goog.asserts", "goog.events.Event", "goog.math.Size", "goog.silverlight", "goog.ui.Component"]);
goog.addDependency("../../third_party/closure/goog/silverlight/silverlight.js", ["goog.silverlight"], []);
goog.addDependency("../../third_party/closure/goog/silverlight/supporteduseragent.js", ["goog.silverlight.supportedUserAgent"], []);
goog.addDependency("array/array.js", ["goog.array", "goog.array.ArrayLike"], ["goog.asserts"]);
goog.addDependency("asserts/asserts.js", ["goog.asserts", "goog.asserts.AssertionError"], ["goog.debug.Error", "goog.string"]);
goog.addDependency("async/animationdelay.js", ["goog.async.AnimationDelay"], ["goog.async.Delay", "goog.functions"]);
goog.addDependency("async/conditionaldelay.js", ["goog.async.ConditionalDelay"], ["goog.Disposable", "goog.async.Delay"]);
goog.addDependency("async/delay.js", ["goog.Delay", "goog.async.Delay"], ["goog.Disposable", "goog.Timer"]);
goog.addDependency("async/throttle.js", ["goog.Throttle", "goog.async.Throttle"], ["goog.Disposable", "goog.Timer"]);
goog.addDependency("base.js", ["goog"], []);
goog.addDependency("color/alpha.js", ["goog.color.alpha"], ["goog.color"]);
goog.addDependency("color/color.js", ["goog.color"], ["goog.color.names", "goog.math"]);
goog.addDependency("color/names.js", ["goog.color.names"], []);
goog.addDependency("crypt/aes.js", ["goog.crypt.Aes"], ["goog.asserts", "goog.crypt.BlockCipher"]);
goog.addDependency("crypt/arc4.js", ["goog.crypt.Arc4"], ["goog.asserts"]);
goog.addDependency("crypt/base64.js", ["goog.crypt.base64"], ["goog.crypt", "goog.userAgent"]);
goog.addDependency("crypt/basen.js", ["goog.crypt.baseN"], []);
goog.addDependency("crypt/blobhasher.js", ["goog.crypt.BlobHasher", "goog.crypt.BlobHasher.EventType"], ["goog.asserts", "goog.crypt", "goog.crypt.Hash", "goog.debug.Logger", "goog.events.EventTarget", "goog.fs"]);
goog.addDependency("crypt/blockcipher.js", ["goog.crypt.BlockCipher"], []);
goog.addDependency("crypt/cbc.js", ["goog.crypt.Cbc"], ["goog.array"]);
goog.addDependency("crypt/cbc_test.js", ["goog.crypt.CbcTest"], ["goog.crypt", "goog.crypt.Aes", "goog.crypt.Cbc", "goog.testing.jsunit"]);
goog.addDependency("crypt/crypt.js", ["goog.crypt"], ["goog.array"]);
goog.addDependency("crypt/hash.js", ["goog.crypt.Hash"], []);
goog.addDependency("crypt/hash32.js", ["goog.crypt.hash32"], ["goog.crypt"]);
goog.addDependency("crypt/hash_test.js", ["goog.crypt.hash_test"], ["goog.testing.asserts"]);
goog.addDependency("crypt/hmac.js", ["goog.crypt.Hmac"], ["goog.asserts", "goog.crypt.Hash"]);
goog.addDependency("crypt/md5.js", ["goog.crypt.Md5"], ["goog.crypt.Hash"]);
goog.addDependency("crypt/sha1.js", ["goog.crypt.Sha1"], ["goog.crypt.Hash"]);
goog.addDependency("cssom/cssom.js", ["goog.cssom", "goog.cssom.CssRuleType"], ["goog.array", "goog.dom"]);
goog.addDependency("cssom/iframe/style.js", ["goog.cssom.iframe.style"], ["goog.cssom", "goog.dom", "goog.dom.NodeType", "goog.dom.classes", "goog.string", "goog.style", "goog.userAgent"]);
goog.addDependency("datasource/datamanager.js", ["goog.ds.DataManager"], ["goog.ds.BasicNodeList", "goog.ds.DataNode", "goog.ds.Expr", "goog.string", "goog.structs", "goog.structs.Map"]);
goog.addDependency("datasource/datasource.js", ["goog.ds.BaseDataNode", "goog.ds.BasicNodeList", "goog.ds.DataNode", "goog.ds.DataNodeList", "goog.ds.EmptyNodeList", "goog.ds.LoadState", "goog.ds.SortedNodeList", "goog.ds.Util", "goog.ds.logger"], ["goog.array", "goog.debug.Logger"]);
goog.addDependency("datasource/expr.js", ["goog.ds.Expr"], ["goog.ds.BasicNodeList", "goog.ds.EmptyNodeList", "goog.string"]);
goog.addDependency("datasource/fastdatanode.js", ["goog.ds.AbstractFastDataNode", "goog.ds.FastDataNode", "goog.ds.FastListNode", "goog.ds.PrimitiveFastDataNode"], ["goog.ds.DataManager", "goog.ds.EmptyNodeList", "goog.string"]);
goog.addDependency("datasource/jsdatasource.js", ["goog.ds.JsDataSource", "goog.ds.JsPropertyDataSource"], ["goog.ds.BaseDataNode", "goog.ds.BasicNodeList", "goog.ds.DataManager", "goog.ds.EmptyNodeList", "goog.ds.LoadState"]);
goog.addDependency("datasource/jsondatasource.js", ["goog.ds.JsonDataSource"], ["goog.Uri", "goog.dom", "goog.ds.DataManager", "goog.ds.JsDataSource", "goog.ds.LoadState", "goog.ds.logger"]);
goog.addDependency("datasource/jsxmlhttpdatasource.js", ["goog.ds.JsXmlHttpDataSource"], ["goog.Uri", "goog.ds.DataManager", "goog.ds.FastDataNode", "goog.ds.LoadState", "goog.ds.logger", "goog.events", "goog.net.EventType", "goog.net.XhrIo"]);
goog.addDependency("datasource/xmldatasource.js", ["goog.ds.XmlDataSource", "goog.ds.XmlHttpDataSource"], ["goog.Uri", "goog.dom.NodeType", "goog.dom.xml", "goog.ds.BasicNodeList", "goog.ds.DataManager", "goog.ds.LoadState", "goog.ds.logger", "goog.net.XhrIo", "goog.string"]);
goog.addDependency("date/date.js", ["goog.date", "goog.date.Date", "goog.date.DateTime", "goog.date.Interval", "goog.date.month", "goog.date.weekDay"], ["goog.asserts", "goog.date.DateLike", "goog.i18n.DateTimeSymbols", "goog.string"]);
goog.addDependency("date/datelike.js", ["goog.date.DateLike"], []);
goog.addDependency("date/daterange.js", ["goog.date.DateRange", "goog.date.DateRange.Iterator", "goog.date.DateRange.StandardDateRangeKeys"], ["goog.date.Date", "goog.date.Interval", "goog.iter.Iterator", "goog.iter.StopIteration"]);
goog.addDependency("date/relative.js", ["goog.date.relative"], ["goog.i18n.DateTimeFormat"]);
goog.addDependency("date/utcdatetime.js", ["goog.date.UtcDateTime"], ["goog.date", "goog.date.Date", "goog.date.DateTime", "goog.date.Interval"]);
goog.addDependency("db/cursor.js", ["goog.db.Cursor"], ["goog.async.Deferred", "goog.db.Error", "goog.debug", "goog.events.EventTarget"]);
goog.addDependency("db/db.js", ["goog.db"], ["goog.async.Deferred", "goog.db.Error", "goog.db.IndexedDb"]);
goog.addDependency("db/error.js", ["goog.db.Error", "goog.db.Error.ErrorCode", "goog.db.Error.VersionChangeBlockedError"], ["goog.debug.Error"]);
goog.addDependency("db/index.js", ["goog.db.Index"], ["goog.async.Deferred", "goog.db.Error", "goog.debug"]);
goog.addDependency("db/indexeddb.js", ["goog.db.IndexedDb"], ["goog.async.Deferred", "goog.db.Error", "goog.db.Error.VersionChangeBlockedError", "goog.db.ObjectStore", "goog.db.Transaction", "goog.db.Transaction.TransactionMode"]);
goog.addDependency("db/keyrange.js", ["goog.db.KeyRange"], []);
goog.addDependency("db/objectstore.js", ["goog.db.ObjectStore"], ["goog.async.Deferred", "goog.db.Cursor", "goog.db.Error", "goog.db.Index", "goog.debug", "goog.events"]);
goog.addDependency("db/transaction.js", ["goog.db.Transaction", "goog.db.Transaction.TransactionMode"], ["goog.db.Error", "goog.db.ObjectStore", "goog.events.EventHandler", "goog.events.EventTarget"]);
goog.addDependency("debug/console.js", ["goog.debug.Console"], ["goog.debug.LogManager", "goog.debug.Logger.Level", "goog.debug.TextFormatter"]);
goog.addDependency("debug/debug.js", ["goog.debug"], ["goog.array", "goog.string", "goog.structs.Set", "goog.userAgent"]);
goog.addDependency("debug/debugwindow.js", ["goog.debug.DebugWindow"], ["goog.debug.HtmlFormatter", "goog.debug.LogManager", "goog.debug.Logger", "goog.structs.CircularBuffer", "goog.userAgent"]);
goog.addDependency("debug/devcss/devcss.js", ["goog.debug.DevCss", "goog.debug.DevCss.UserAgent"], ["goog.cssom", "goog.dom.classes", "goog.events", "goog.events.EventType", "goog.string", "goog.userAgent"]);
goog.addDependency("debug/devcss/devcssrunner.js", ["goog.debug.devCssRunner"], ["goog.debug.DevCss"]);
goog.addDependency("debug/divconsole.js", ["goog.debug.DivConsole"], ["goog.debug.HtmlFormatter", "goog.debug.LogManager", "goog.style"]);
goog.addDependency("debug/entrypointregistry.js", ["goog.debug.EntryPointMonitor", "goog.debug.entryPointRegistry"], ["goog.asserts"]);
goog.addDependency("debug/error.js", ["goog.debug.Error"], []);
goog.addDependency("debug/errorhandler.js", ["goog.debug.ErrorHandler", "goog.debug.ErrorHandler.ProtectedFunctionError"], ["goog.asserts", "goog.debug", "goog.debug.EntryPointMonitor", "goog.debug.Trace"]);
goog.addDependency("debug/errorhandlerweakdep.js", ["goog.debug.errorHandlerWeakDep"], []);
goog.addDependency("debug/errorreporter.js", ["goog.debug.ErrorReporter", "goog.debug.ErrorReporter.ExceptionEvent"], ["goog.debug", "goog.debug.ErrorHandler", "goog.debug.Logger", "goog.debug.entryPointRegistry", "goog.events", "goog.events.Event", "goog.events.EventTarget", "goog.net.XhrIo", "goog.object", "goog.string", "goog.uri.utils", "goog.userAgent"]);
goog.addDependency("debug/fancywindow.js", ["goog.debug.FancyWindow"], ["goog.debug.DebugWindow", "goog.debug.LogManager", "goog.debug.Logger", "goog.debug.Logger.Level", "goog.dom.DomHelper", "goog.object", "goog.string", "goog.userAgent"]);
goog.addDependency("debug/formatter.js", ["goog.debug.Formatter", "goog.debug.HtmlFormatter", "goog.debug.TextFormatter"], ["goog.debug.RelativeTimeProvider", "goog.string"]);
goog.addDependency("debug/fpsdisplay.js", ["goog.debug.FpsDisplay"], ["goog.asserts", "goog.async.AnimationDelay", "goog.ui.Component"]);
goog.addDependency("debug/gcdiagnostics.js", ["goog.debug.GcDiagnostics"], ["goog.debug.Logger", "goog.debug.Trace", "goog.userAgent"]);
goog.addDependency("debug/logbuffer.js", ["goog.debug.LogBuffer"], ["goog.asserts", "goog.debug.LogRecord"]);
goog.addDependency("debug/logger.js", ["goog.debug.LogManager", "goog.debug.Logger", "goog.debug.Logger.Level"], ["goog.array", "goog.asserts", "goog.debug", "goog.debug.LogBuffer", "goog.debug.LogRecord"]);
goog.addDependency("debug/logrecord.js", ["goog.debug.LogRecord"], []);
goog.addDependency("debug/logrecordserializer.js", ["goog.debug.logRecordSerializer"], ["goog.debug.LogRecord", "goog.debug.Logger.Level", "goog.json", "goog.object"]);
goog.addDependency("debug/reflect.js", ["goog.debug.reflect"], []);
goog.addDependency("debug/relativetimeprovider.js", ["goog.debug.RelativeTimeProvider"], []);
goog.addDependency("debug/tracer.js", ["goog.debug.Trace"], ["goog.array", "goog.debug.Logger", "goog.iter", "goog.structs.Map", "goog.structs.SimplePool"]);
goog.addDependency("disposable/disposable.js", ["goog.Disposable", "goog.dispose"], ["goog.disposable.IDisposable"]);
goog.addDependency("disposable/idisposable.js", ["goog.disposable.IDisposable"], []);
goog.addDependency("dom/a11y.js", ["goog.dom.a11y", "goog.dom.a11y.Announcer", "goog.dom.a11y.LivePriority", "goog.dom.a11y.Role", "goog.dom.a11y.State"], ["goog.Disposable", "goog.dom", "goog.object"]);
goog.addDependency("dom/abstractmultirange.js", ["goog.dom.AbstractMultiRange"], ["goog.array", "goog.dom", "goog.dom.AbstractRange"]);
goog.addDependency("dom/abstractrange.js", ["goog.dom.AbstractRange", "goog.dom.RangeIterator", "goog.dom.RangeType"], ["goog.dom", "goog.dom.NodeType", "goog.dom.SavedCaretRange", "goog.dom.TagIterator", "goog.userAgent"]);
goog.addDependency("dom/annotate.js", ["goog.dom.annotate"], ["goog.array", "goog.dom", "goog.dom.NodeType", "goog.string"]);
goog.addDependency("dom/browserfeature.js", ["goog.dom.BrowserFeature"], ["goog.userAgent"]);
goog.addDependency("dom/browserrange/abstractrange.js", ["goog.dom.browserrange.AbstractRange"], ["goog.dom", "goog.dom.NodeType", "goog.dom.RangeEndpoint", "goog.dom.TagName", "goog.dom.TextRangeIterator", "goog.iter", "goog.string", "goog.string.StringBuffer", "goog.userAgent"]);
goog.addDependency("dom/browserrange/browserrange.js", ["goog.dom.browserrange", "goog.dom.browserrange.Error"], ["goog.dom", "goog.dom.browserrange.GeckoRange", "goog.dom.browserrange.IeRange", "goog.dom.browserrange.OperaRange", "goog.dom.browserrange.W3cRange", "goog.dom.browserrange.WebKitRange", "goog.userAgent"]);
goog.addDependency("dom/browserrange/geckorange.js", ["goog.dom.browserrange.GeckoRange"], ["goog.dom.browserrange.W3cRange"]);
goog.addDependency("dom/browserrange/ierange.js", ["goog.dom.browserrange.IeRange"], ["goog.array", "goog.debug.Logger", "goog.dom", "goog.dom.NodeIterator", "goog.dom.NodeType", "goog.dom.RangeEndpoint", "goog.dom.TagName", "goog.dom.browserrange.AbstractRange", "goog.iter", "goog.iter.StopIteration", "goog.string"]);
goog.addDependency("dom/browserrange/operarange.js", ["goog.dom.browserrange.OperaRange"], ["goog.dom.browserrange.W3cRange"]);
goog.addDependency("dom/browserrange/w3crange.js", ["goog.dom.browserrange.W3cRange"], ["goog.dom", "goog.dom.NodeType", "goog.dom.RangeEndpoint", "goog.dom.browserrange.AbstractRange", "goog.string"]);
goog.addDependency("dom/browserrange/webkitrange.js", ["goog.dom.browserrange.WebKitRange"], ["goog.dom.RangeEndpoint", "goog.dom.browserrange.W3cRange", "goog.userAgent"]);
goog.addDependency("dom/bufferedviewportsizemonitor.js", ["goog.dom.BufferedViewportSizeMonitor"], ["goog.asserts", "goog.async.Delay", "goog.events", "goog.events.EventTarget", "goog.events.EventType"]);
goog.addDependency("dom/bufferedviewportsizemonitor_test.js", ["goog.dom.BufferedViewportSizeMonitorTest"], ["goog.dom.BufferedViewportSizeMonitor", "goog.dom.ViewportSizeMonitor", "goog.events", "goog.events.EventType", "goog.math.Size", "goog.testing.MockClock", "goog.testing.events", "goog.testing.events.Event", "goog.testing.jsunit"]);
goog.addDependency("dom/classes.js", ["goog.dom.classes"], ["goog.array"]);
goog.addDependency("dom/classes_test.js", ["goog.dom.classes_test"], ["goog.dom", "goog.dom.classes", "goog.testing.jsunit"]);
goog.addDependency("dom/controlrange.js", ["goog.dom.ControlRange", "goog.dom.ControlRangeIterator"], ["goog.array", "goog.dom", "goog.dom.AbstractMultiRange", "goog.dom.AbstractRange", "goog.dom.RangeIterator", "goog.dom.RangeType", "goog.dom.SavedRange", "goog.dom.TagWalkType", "goog.dom.TextRange", "goog.iter.StopIteration", "goog.userAgent"]);
goog.addDependency("dom/dataset.js", ["goog.dom.dataset"], ["goog.string"]);
goog.addDependency("dom/dom.js", ["goog.dom", "goog.dom.DomHelper", "goog.dom.NodeType"], ["goog.array", "goog.dom.BrowserFeature", "goog.dom.TagName", "goog.dom.classes", "goog.math.Coordinate", "goog.math.Size", "goog.object", "goog.string", "goog.userAgent"]);
goog.addDependency("dom/dom_test.js", ["goog.dom.dom_test"], ["goog.dom", "goog.dom.DomHelper", "goog.dom.NodeType", "goog.dom.TagName", "goog.object", "goog.testing.asserts", "goog.userAgent", "goog.userAgent.product", "goog.userAgent.product.isVersion"]);
goog.addDependency("dom/fontsizemonitor.js", ["goog.dom.FontSizeMonitor", "goog.dom.FontSizeMonitor.EventType"], ["goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.userAgent"]);
goog.addDependency("dom/forms.js", ["goog.dom.forms"], ["goog.structs.Map"]);
goog.addDependency("dom/fullscreen.js", ["goog.dom.fullscreen", "goog.dom.fullscreen.EventType"], ["goog.dom", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("dom/iframe.js", ["goog.dom.iframe"], ["goog.dom"]);
goog.addDependency("dom/iter.js", ["goog.dom.iter.AncestorIterator", "goog.dom.iter.ChildIterator", "goog.dom.iter.SiblingIterator"], ["goog.iter.Iterator", "goog.iter.StopIteration"]);
goog.addDependency("dom/multirange.js", ["goog.dom.MultiRange", "goog.dom.MultiRangeIterator"], ["goog.array", "goog.debug.Logger", "goog.dom.AbstractMultiRange", "goog.dom.AbstractRange", "goog.dom.RangeIterator", "goog.dom.RangeType", "goog.dom.SavedRange", "goog.dom.TextRange", "goog.iter.StopIteration"]);
goog.addDependency("dom/nodeiterator.js", ["goog.dom.NodeIterator"], ["goog.dom.TagIterator"]);
goog.addDependency("dom/nodeoffset.js", ["goog.dom.NodeOffset"], ["goog.Disposable", "goog.dom.TagName"]);
goog.addDependency("dom/pattern/abstractpattern.js", ["goog.dom.pattern.AbstractPattern"], ["goog.dom.pattern.MatchType"]);
goog.addDependency("dom/pattern/allchildren.js", ["goog.dom.pattern.AllChildren"], ["goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType"]);
goog.addDependency("dom/pattern/callback/callback.js", ["goog.dom.pattern.callback"], ["goog.dom", "goog.dom.TagWalkType", "goog.iter"]);
goog.addDependency("dom/pattern/callback/counter.js", ["goog.dom.pattern.callback.Counter"], []);
goog.addDependency("dom/pattern/callback/test.js", ["goog.dom.pattern.callback.Test"], ["goog.iter.StopIteration"]);
goog.addDependency("dom/pattern/childmatches.js", ["goog.dom.pattern.ChildMatches"], ["goog.dom.pattern.AllChildren", "goog.dom.pattern.MatchType"]);
goog.addDependency("dom/pattern/endtag.js", ["goog.dom.pattern.EndTag"], ["goog.dom.TagWalkType", "goog.dom.pattern.Tag"]);
goog.addDependency("dom/pattern/fulltag.js", ["goog.dom.pattern.FullTag"], ["goog.dom.pattern.MatchType", "goog.dom.pattern.StartTag", "goog.dom.pattern.Tag"]);
goog.addDependency("dom/pattern/matcher.js", ["goog.dom.pattern.Matcher"], ["goog.dom.TagIterator", "goog.dom.pattern.MatchType", "goog.iter"]);
goog.addDependency("dom/pattern/nodetype.js", ["goog.dom.pattern.NodeType"], ["goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType"]);
goog.addDependency("dom/pattern/pattern.js", ["goog.dom.pattern", "goog.dom.pattern.MatchType"], []);
goog.addDependency("dom/pattern/repeat.js", ["goog.dom.pattern.Repeat"], ["goog.dom.NodeType", "goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType"]);
goog.addDependency("dom/pattern/sequence.js", ["goog.dom.pattern.Sequence"], ["goog.dom.NodeType", "goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType"]);
goog.addDependency("dom/pattern/starttag.js", ["goog.dom.pattern.StartTag"], ["goog.dom.TagWalkType", "goog.dom.pattern.Tag"]);
goog.addDependency("dom/pattern/tag.js", ["goog.dom.pattern.Tag"], ["goog.dom.pattern", "goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType", "goog.object"]);
goog.addDependency("dom/pattern/text.js", ["goog.dom.pattern.Text"], ["goog.dom.NodeType", "goog.dom.pattern", "goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType"]);
goog.addDependency("dom/range.js", ["goog.dom.Range"], ["goog.dom", "goog.dom.AbstractRange", "goog.dom.ControlRange", "goog.dom.MultiRange", "goog.dom.NodeType", "goog.dom.TextRange", "goog.userAgent"]);
goog.addDependency("dom/rangeendpoint.js", ["goog.dom.RangeEndpoint"], []);
goog.addDependency("dom/savedcaretrange.js", ["goog.dom.SavedCaretRange"], ["goog.array", "goog.dom", "goog.dom.SavedRange", "goog.dom.TagName", "goog.string"]);
goog.addDependency("dom/savedrange.js", ["goog.dom.SavedRange"], ["goog.Disposable", "goog.debug.Logger"]);
goog.addDependency("dom/selection.js", ["goog.dom.selection"], ["goog.string", "goog.userAgent"]);
goog.addDependency("dom/tagiterator.js", ["goog.dom.TagIterator", "goog.dom.TagWalkType"], ["goog.dom.NodeType", "goog.iter.Iterator", "goog.iter.StopIteration"]);
goog.addDependency("dom/tagname.js", ["goog.dom.TagName"], []);
goog.addDependency("dom/textrange.js", ["goog.dom.TextRange"], ["goog.array", "goog.dom", "goog.dom.AbstractRange", "goog.dom.RangeType", "goog.dom.SavedRange", "goog.dom.TagName", "goog.dom.TextRangeIterator", "goog.dom.browserrange", "goog.string", "goog.userAgent"]);
goog.addDependency("dom/textrangeiterator.js", ["goog.dom.TextRangeIterator"], ["goog.array", "goog.dom.NodeType", "goog.dom.RangeIterator", "goog.dom.TagName", "goog.iter.StopIteration"]);
goog.addDependency("dom/viewportsizemonitor.js", ["goog.dom.ViewportSizeMonitor"], ["goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.math.Size", "goog.userAgent"]);
goog.addDependency("dom/xml.js", ["goog.dom.xml"], ["goog.dom", "goog.dom.NodeType"]);
goog.addDependency("editor/browserfeature.js", ["goog.editor.BrowserFeature"], ["goog.editor.defines", "goog.userAgent", "goog.userAgent.product", "goog.userAgent.product.isVersion"]);
goog.addDependency("editor/clicktoeditwrapper.js", ["goog.editor.ClickToEditWrapper"], ["goog.Disposable", "goog.asserts", "goog.debug.Logger", "goog.dom", "goog.dom.Range", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Field.EventType", "goog.editor.range", "goog.events.BrowserEvent.MouseButton", "goog.events.EventHandler", "goog.events.EventType"]);
goog.addDependency("editor/command.js", ["goog.editor.Command"], []);
goog.addDependency("editor/contenteditablefield.js", ["goog.editor.ContentEditableField"], ["goog.asserts", "goog.debug.Logger", "goog.editor.Field"]);
goog.addDependency("editor/defines.js", ["goog.editor.defines"], []);
goog.addDependency("editor/field.js", ["goog.editor.Field", "goog.editor.Field.EventType"], ["goog.array", "goog.async.Delay", "goog.debug.Logger", "goog.dom", "goog.dom.Range", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Plugin", "goog.editor.icontent", "goog.editor.icontent.FieldFormatInfo", "goog.editor.icontent.FieldStyleInfo", "goog.editor.node", "goog.editor.range", "goog.events", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", 
"goog.events.KeyCodes", "goog.functions", "goog.string", "goog.string.Unicode", "goog.style", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("editor/field_test.js", ["goog.editor.field_test"], ["goog.dom.Range", "goog.editor.Command", "goog.editor.Field", "goog.editor.Plugin", "goog.events", "goog.events.KeyCodes", "goog.functions", "goog.testing.LooseMock", "goog.testing.MockClock", "goog.testing.dom", "goog.testing.events", "goog.testing.recordFunction", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("editor/focus.js", ["goog.editor.focus"], ["goog.dom.selection"]);
goog.addDependency("editor/icontent.js", ["goog.editor.icontent", "goog.editor.icontent.FieldFormatInfo", "goog.editor.icontent.FieldStyleInfo"], ["goog.editor.BrowserFeature", "goog.style", "goog.userAgent"]);
goog.addDependency("editor/link.js", ["goog.editor.Link"], ["goog.array", "goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.node", "goog.editor.range", "goog.string", "goog.string.Unicode", "goog.uri.utils", "goog.uri.utils.ComponentIndex"]);
goog.addDependency("editor/node.js", ["goog.editor.node"], ["goog.dom", "goog.dom.NodeType", "goog.dom.TagName", "goog.dom.iter.ChildIterator", "goog.dom.iter.SiblingIterator", "goog.iter", "goog.object", "goog.string", "goog.string.Unicode"]);
goog.addDependency("editor/plugin.js", ["goog.editor.Plugin"], ["goog.debug.Logger", "goog.editor.Command", "goog.events.EventTarget", "goog.functions", "goog.object", "goog.reflect"]);
goog.addDependency("editor/plugins/abstractbubbleplugin.js", ["goog.editor.plugins.AbstractBubblePlugin"], ["goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.dom.TagName", "goog.editor.Plugin", "goog.editor.style", "goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.actionEventWrapper", "goog.functions", "goog.string.Unicode", "goog.ui.Component.EventType", "goog.ui.editor.Bubble", "goog.userAgent"]);
goog.addDependency("editor/plugins/abstractdialogplugin.js", ["goog.editor.plugins.AbstractDialogPlugin", "goog.editor.plugins.AbstractDialogPlugin.EventType"], ["goog.dom", "goog.dom.Range", "goog.editor.Field.EventType", "goog.editor.Plugin", "goog.editor.range", "goog.events", "goog.ui.editor.AbstractDialog.EventType"]);
goog.addDependency("editor/plugins/abstracttabhandler.js", ["goog.editor.plugins.AbstractTabHandler"], ["goog.editor.Plugin", "goog.events.KeyCodes"]);
goog.addDependency("editor/plugins/basictextformatter.js", ["goog.editor.plugins.BasicTextFormatter", "goog.editor.plugins.BasicTextFormatter.COMMAND"], ["goog.array", "goog.debug.Logger", "goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Link", "goog.editor.Plugin", "goog.editor.node", "goog.editor.range", "goog.editor.style", "goog.iter", "goog.iter.StopIteration", "goog.object", "goog.string", "goog.string.Unicode", 
"goog.style", "goog.ui.editor.messages", "goog.userAgent"]);
goog.addDependency("editor/plugins/blockquote.js", ["goog.editor.plugins.Blockquote"], ["goog.debug.Logger", "goog.dom", "goog.dom.NodeType", "goog.dom.TagName", "goog.dom.classes", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Plugin", "goog.editor.node", "goog.functions"]);
goog.addDependency("editor/plugins/emoticons.js", ["goog.editor.plugins.Emoticons"], ["goog.dom.TagName", "goog.editor.Plugin", "goog.functions", "goog.ui.emoji.Emoji"]);
goog.addDependency("editor/plugins/enterhandler.js", ["goog.editor.plugins.EnterHandler"], ["goog.dom", "goog.dom.AbstractRange", "goog.dom.NodeOffset", "goog.dom.NodeType", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Plugin", "goog.editor.node", "goog.editor.plugins.Blockquote", "goog.editor.range", "goog.editor.style", "goog.events.KeyCodes", "goog.string", "goog.userAgent"]);
goog.addDependency("editor/plugins/equationeditorbubble.js", ["goog.editor.plugins.equation.EquationBubble"], ["goog.dom", "goog.dom.TagName", "goog.editor.Command", "goog.editor.plugins.AbstractBubblePlugin", "goog.string.Unicode", "goog.ui.editor.Bubble", "goog.ui.equation.ImageRenderer"]);
goog.addDependency("editor/plugins/equationeditorplugin.js", ["goog.editor.plugins.EquationEditorPlugin"], ["goog.editor.Command", "goog.editor.plugins.AbstractDialogPlugin", "goog.editor.range", "goog.functions", "goog.ui.editor.AbstractDialog.Builder", "goog.ui.editor.EquationEditorDialog", "goog.ui.editor.EquationEditorOkEvent", "goog.ui.equation.EquationEditor", "goog.ui.equation.ImageRenderer", "goog.ui.equation.TexEditor"]);
goog.addDependency("editor/plugins/headerformatter.js", ["goog.editor.plugins.HeaderFormatter"], ["goog.editor.Command", "goog.editor.Plugin", "goog.userAgent"]);
goog.addDependency("editor/plugins/linkbubble.js", ["goog.editor.plugins.LinkBubble", "goog.editor.plugins.LinkBubble.Action"], ["goog.array", "goog.dom", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Link", "goog.editor.plugins.AbstractBubblePlugin", "goog.editor.range", "goog.string", "goog.style", "goog.ui.editor.messages", "goog.uri.utils", "goog.window"]);
goog.addDependency("editor/plugins/linkdialogplugin.js", ["goog.editor.plugins.LinkDialogPlugin"], ["goog.array", "goog.dom", "goog.editor.Command", "goog.editor.plugins.AbstractDialogPlugin", "goog.events.EventHandler", "goog.functions", "goog.ui.editor.AbstractDialog.EventType", "goog.ui.editor.LinkDialog", "goog.ui.editor.LinkDialog.EventType", "goog.ui.editor.LinkDialog.OkEvent", "goog.uri.utils"]);
goog.addDependency("editor/plugins/linkshortcutplugin.js", ["goog.editor.plugins.LinkShortcutPlugin"], ["goog.editor.Command", "goog.editor.Link", "goog.editor.Plugin", "goog.string"]);
goog.addDependency("editor/plugins/listtabhandler.js", ["goog.editor.plugins.ListTabHandler"], ["goog.dom.TagName", "goog.editor.Command", "goog.editor.plugins.AbstractTabHandler"]);
goog.addDependency("editor/plugins/loremipsum.js", ["goog.editor.plugins.LoremIpsum"], ["goog.asserts", "goog.dom", "goog.editor.Command", "goog.editor.Plugin", "goog.editor.node", "goog.functions"]);
goog.addDependency("editor/plugins/removeformatting.js", ["goog.editor.plugins.RemoveFormatting"], ["goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Plugin", "goog.editor.node", "goog.editor.range", "goog.string"]);
goog.addDependency("editor/plugins/spacestabhandler.js", ["goog.editor.plugins.SpacesTabHandler"], ["goog.dom", "goog.dom.TagName", "goog.editor.plugins.AbstractTabHandler", "goog.editor.range"]);
goog.addDependency("editor/plugins/tableeditor.js", ["goog.editor.plugins.TableEditor"], ["goog.array", "goog.dom", "goog.dom.TagName", "goog.editor.Plugin", "goog.editor.Table", "goog.editor.node", "goog.editor.range", "goog.object"]);
goog.addDependency("editor/plugins/tagonenterhandler.js", ["goog.editor.plugins.TagOnEnterHandler"], ["goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.dom.TagName", "goog.editor.Command", "goog.editor.node", "goog.editor.plugins.EnterHandler", "goog.editor.range", "goog.editor.style", "goog.events.KeyCodes", "goog.string", "goog.style", "goog.userAgent"]);
goog.addDependency("editor/plugins/undoredo.js", ["goog.editor.plugins.UndoRedo"], ["goog.debug.Logger", "goog.dom", "goog.dom.NodeOffset", "goog.dom.Range", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Field.EventType", "goog.editor.Plugin", "goog.editor.plugins.UndoRedoManager", "goog.editor.plugins.UndoRedoState", "goog.events", "goog.events.EventHandler"]);
goog.addDependency("editor/plugins/undoredomanager.js", ["goog.editor.plugins.UndoRedoManager", "goog.editor.plugins.UndoRedoManager.EventType"], ["goog.editor.plugins.UndoRedoState", "goog.events.EventTarget"]);
goog.addDependency("editor/plugins/undoredostate.js", ["goog.editor.plugins.UndoRedoState"], ["goog.events.EventTarget"]);
goog.addDependency("editor/range.js", ["goog.editor.range", "goog.editor.range.Point"], ["goog.array", "goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.dom.RangeEndpoint", "goog.dom.SavedCaretRange", "goog.editor.BrowserFeature", "goog.editor.node", "goog.editor.style", "goog.iter"]);
goog.addDependency("editor/seamlessfield.js", ["goog.editor.SeamlessField"], ["goog.cssom.iframe.style", "goog.debug.Logger", "goog.dom", "goog.dom.Range", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Field", "goog.editor.icontent", "goog.editor.icontent.FieldFormatInfo", "goog.editor.icontent.FieldStyleInfo", "goog.editor.node", "goog.events", "goog.events.EventType", "goog.style"]);
goog.addDependency("editor/seamlessfield_test.js", ["goog.editor.seamlessfield_test"], ["goog.dom", "goog.dom.DomHelper", "goog.dom.Range", "goog.editor.BrowserFeature", "goog.editor.Field", "goog.editor.SeamlessField", "goog.events", "goog.functions", "goog.style", "goog.testing.MockClock", "goog.testing.MockRange", "goog.testing.jsunit"]);
goog.addDependency("editor/style.js", ["goog.editor.style"], ["goog.dom", "goog.dom.NodeType", "goog.editor.BrowserFeature", "goog.events.EventType", "goog.object", "goog.style", "goog.userAgent"]);
goog.addDependency("editor/table.js", ["goog.editor.Table", "goog.editor.TableCell", "goog.editor.TableRow"], ["goog.debug.Logger", "goog.dom", "goog.dom.DomHelper", "goog.dom.NodeType", "goog.dom.TagName", "goog.string.Unicode", "goog.style"]);
goog.addDependency("events/actioneventwrapper.js", ["goog.events.actionEventWrapper"], ["goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.events.EventWrapper", "goog.events.KeyCodes"]);
goog.addDependency("events/actionhandler.js", ["goog.events.ActionEvent", "goog.events.ActionHandler", "goog.events.ActionHandler.EventType", "goog.events.BeforeActionEvent"], ["goog.events", "goog.events.BrowserEvent", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.userAgent"]);
goog.addDependency("events/browserevent.js", ["goog.events.BrowserEvent", "goog.events.BrowserEvent.MouseButton"], ["goog.events.BrowserFeature", "goog.events.Event", "goog.events.EventType", "goog.reflect", "goog.userAgent"]);
goog.addDependency("events/browserfeature.js", ["goog.events.BrowserFeature"], ["goog.userAgent"]);
goog.addDependency("events/event.js", ["goog.events.Event"], ["goog.Disposable"]);
goog.addDependency("events/eventhandler.js", ["goog.events.EventHandler"], ["goog.Disposable", "goog.array", "goog.events", "goog.events.EventWrapper"]);
goog.addDependency("events/events.js", ["goog.events"], ["goog.array", "goog.debug.entryPointRegistry", "goog.debug.errorHandlerWeakDep", "goog.events.BrowserEvent", "goog.events.BrowserFeature", "goog.events.Event", "goog.events.EventWrapper", "goog.events.Listener", "goog.object", "goog.userAgent"]);
goog.addDependency("events/eventtarget.js", ["goog.events.EventTarget"], ["goog.Disposable", "goog.events"]);
goog.addDependency("events/eventtype.js", ["goog.events.EventType"], ["goog.userAgent"]);
goog.addDependency("events/eventwrapper.js", ["goog.events.EventWrapper"], []);
goog.addDependency("events/filedrophandler.js", ["goog.events.FileDropHandler", "goog.events.FileDropHandler.EventType"], ["goog.array", "goog.debug.Logger", "goog.dom", "goog.events", "goog.events.BrowserEvent", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType"]);
goog.addDependency("events/focushandler.js", ["goog.events.FocusHandler", "goog.events.FocusHandler.EventType"], ["goog.events", "goog.events.BrowserEvent", "goog.events.EventTarget", "goog.userAgent"]);
goog.addDependency("events/imehandler.js", ["goog.events.ImeHandler", "goog.events.ImeHandler.Event", "goog.events.ImeHandler.EventType"], ["goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("events/inputhandler.js", ["goog.events.InputHandler", "goog.events.InputHandler.EventType"], ["goog.Timer", "goog.dom", "goog.events", "goog.events.BrowserEvent", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.KeyCodes", "goog.userAgent"]);
goog.addDependency("events/keycodes.js", ["goog.events.KeyCodes"], ["goog.userAgent"]);
goog.addDependency("events/keyhandler.js", ["goog.events.KeyEvent", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType"], ["goog.events", "goog.events.BrowserEvent", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.userAgent"]);
goog.addDependency("events/keynames.js", ["goog.events.KeyNames"], []);
goog.addDependency("events/listener.js", ["goog.events.Listener"], []);
goog.addDependency("events/mousewheelhandler.js", ["goog.events.MouseWheelEvent", "goog.events.MouseWheelHandler", "goog.events.MouseWheelHandler.EventType"], ["goog.events", "goog.events.BrowserEvent", "goog.events.EventTarget", "goog.math", "goog.style", "goog.userAgent"]);
goog.addDependency("events/onlinehandler.js", ["goog.events.OnlineHandler", "goog.events.OnlineHandler.EventType"], ["goog.Timer", "goog.events.BrowserFeature", "goog.events.EventHandler", "goog.events.EventTarget", "goog.userAgent"]);
goog.addDependency("events/pastehandler.js", ["goog.events.PasteHandler", "goog.events.PasteHandler.EventType", "goog.events.PasteHandler.State"], ["goog.Timer", "goog.async.ConditionalDelay", "goog.debug.Logger", "goog.events.BrowserEvent", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes"]);
goog.addDependency("format/emailaddress.js", ["goog.format.EmailAddress"], ["goog.string"]);
goog.addDependency("format/format.js", ["goog.format"], ["goog.i18n.GraphemeBreak", "goog.string", "goog.userAgent"]);
goog.addDependency("format/htmlprettyprinter.js", ["goog.format.HtmlPrettyPrinter", "goog.format.HtmlPrettyPrinter.Buffer"], ["goog.object", "goog.string.StringBuffer"]);
goog.addDependency("format/jsonprettyprinter.js", ["goog.format.JsonPrettyPrinter", "goog.format.JsonPrettyPrinter.HtmlDelimiters", "goog.format.JsonPrettyPrinter.TextDelimiters"], ["goog.json", "goog.json.Serializer", "goog.string", "goog.string.StringBuffer", "goog.string.format"]);
goog.addDependency("fs/entry.js", ["goog.fs.DirectoryEntry", "goog.fs.DirectoryEntry.Behavior", "goog.fs.Entry", "goog.fs.FileEntry"], ["goog.array", "goog.async.Deferred", "goog.fs.Error", "goog.fs.FileWriter", "goog.functions", "goog.string"]);
goog.addDependency("fs/error.js", ["goog.fs.Error", "goog.fs.Error.ErrorCode"], ["goog.debug.Error", "goog.string"]);
goog.addDependency("fs/filereader.js", ["goog.fs.FileReader", "goog.fs.FileReader.EventType", "goog.fs.FileReader.ReadyState"], ["goog.async.Deferred", "goog.events.Event", "goog.events.EventTarget", "goog.fs.Error", "goog.fs.ProgressEvent"]);
goog.addDependency("fs/filesaver.js", ["goog.fs.FileSaver", "goog.fs.FileSaver.EventType", "goog.fs.FileSaver.ProgressEvent", "goog.fs.FileSaver.ReadyState"], ["goog.events.Event", "goog.events.EventTarget", "goog.fs.Error", "goog.fs.ProgressEvent"]);
goog.addDependency("fs/filesystem.js", ["goog.fs.FileSystem"], ["goog.fs.DirectoryEntry"]);
goog.addDependency("fs/filewriter.js", ["goog.fs.FileWriter"], ["goog.fs.Error", "goog.fs.FileSaver"]);
goog.addDependency("fs/fs.js", ["goog.fs"], ["goog.async.Deferred", "goog.events", "goog.fs.Error", "goog.fs.FileReader", "goog.fs.FileSystem", "goog.userAgent"]);
goog.addDependency("fs/progressevent.js", ["goog.fs.ProgressEvent"], ["goog.events.Event"]);
goog.addDependency("functions/functions.js", ["goog.functions"], []);
goog.addDependency("fx/abstractdragdrop.js", ["goog.fx.AbstractDragDrop", "goog.fx.AbstractDragDrop.EventType", "goog.fx.DragDropEvent", "goog.fx.DragDropItem"], ["goog.dom", "goog.dom.classes", "goog.events", "goog.events.Event", "goog.events.EventTarget", "goog.events.EventType", "goog.fx.Dragger", "goog.fx.Dragger.EventType", "goog.math.Box", "goog.math.Coordinate", "goog.style"]);
goog.addDependency("fx/anim/anim.js", ["goog.fx.anim", "goog.fx.anim.Animated"], ["goog.async.AnimationDelay", "goog.async.Delay", "goog.object"]);
goog.addDependency("fx/animation.js", ["goog.fx.Animation", "goog.fx.Animation.EventType", "goog.fx.Animation.State", "goog.fx.AnimationEvent"], ["goog.array", "goog.events.Event", "goog.fx.Transition", "goog.fx.Transition.EventType", "goog.fx.TransitionBase.State", "goog.fx.anim", "goog.fx.anim.Animated"]);
goog.addDependency("fx/animationqueue.js", ["goog.fx.AnimationParallelQueue", "goog.fx.AnimationQueue", "goog.fx.AnimationSerialQueue"], ["goog.array", "goog.asserts", "goog.events.EventHandler", "goog.fx.Transition.EventType", "goog.fx.TransitionBase", "goog.fx.TransitionBase.State"]);
goog.addDependency("fx/css3/fx.js", ["goog.fx.css3"], ["goog.fx.css3.Transition"]);
goog.addDependency("fx/css3/transition.js", ["goog.fx.css3.Transition"], ["goog.Timer", "goog.fx.TransitionBase", "goog.style", "goog.style.transition"]);
goog.addDependency("fx/cssspriteanimation.js", ["goog.fx.CssSpriteAnimation"], ["goog.fx.Animation"]);
goog.addDependency("fx/dom.js", ["goog.fx.dom", "goog.fx.dom.BgColorTransform", "goog.fx.dom.ColorTransform", "goog.fx.dom.Fade", "goog.fx.dom.FadeIn", "goog.fx.dom.FadeInAndShow", "goog.fx.dom.FadeOut", "goog.fx.dom.FadeOutAndHide", "goog.fx.dom.PredefinedEffect", "goog.fx.dom.Resize", "goog.fx.dom.ResizeHeight", "goog.fx.dom.ResizeWidth", "goog.fx.dom.Scroll", "goog.fx.dom.Slide", "goog.fx.dom.SlideFrom", "goog.fx.dom.Swipe"], ["goog.color", "goog.events", "goog.fx.Animation", "goog.fx.Transition.EventType", 
"goog.style", "goog.style.bidi"]);
goog.addDependency("fx/dragdrop.js", ["goog.fx.DragDrop"], ["goog.fx.AbstractDragDrop", "goog.fx.DragDropItem"]);
goog.addDependency("fx/dragdropgroup.js", ["goog.fx.DragDropGroup"], ["goog.dom", "goog.fx.AbstractDragDrop", "goog.fx.DragDropItem"]);
goog.addDependency("fx/dragger.js", ["goog.fx.DragEvent", "goog.fx.Dragger", "goog.fx.Dragger.EventType"], ["goog.dom", "goog.events", "goog.events.BrowserEvent.MouseButton", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.math.Coordinate", "goog.math.Rect", "goog.style", "goog.style.bidi", "goog.userAgent"]);
goog.addDependency("fx/draglistgroup.js", ["goog.fx.DragListDirection", "goog.fx.DragListGroup", "goog.fx.DragListGroup.EventType", "goog.fx.DragListGroupEvent"], ["goog.asserts", "goog.dom", "goog.dom.NodeType", "goog.dom.classes", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.fx.Dragger", "goog.fx.Dragger.EventType", "goog.math.Coordinate", "goog.style"]);
goog.addDependency("fx/dragscrollsupport.js", ["goog.fx.DragScrollSupport"], ["goog.Disposable", "goog.Timer", "goog.dom", "goog.events.EventHandler", "goog.events.EventType", "goog.math.Coordinate", "goog.style"]);
goog.addDependency("fx/easing.js", ["goog.fx.easing"], []);
goog.addDependency("fx/fx.js", ["goog.fx"], ["goog.asserts", "goog.fx.Animation", "goog.fx.Animation.EventType", "goog.fx.Animation.State", "goog.fx.AnimationEvent", "goog.fx.Transition.EventType", "goog.fx.easing"]);
goog.addDependency("fx/transition.js", ["goog.fx.Transition", "goog.fx.Transition.EventType"], []);
goog.addDependency("fx/transitionbase.js", ["goog.fx.TransitionBase", "goog.fx.TransitionBase.State"], ["goog.events.EventTarget", "goog.fx.Transition", "goog.fx.Transition.EventType"]);
goog.addDependency("gears/basestore.js", ["goog.gears.BaseStore", "goog.gears.BaseStore.SchemaType"], ["goog.Disposable"]);
goog.addDependency("gears/database.js", ["goog.gears.Database", "goog.gears.Database.EventType", "goog.gears.Database.TransactionEvent"], ["goog.array", "goog.debug", "goog.debug.Logger", "goog.events.Event", "goog.events.EventTarget", "goog.gears", "goog.json"]);
goog.addDependency("gears/gears.js", ["goog.gears"], ["goog.string"]);
goog.addDependency("gears/httprequest.js", ["goog.gears.HttpRequest"], ["goog.Timer", "goog.gears", "goog.net.WrapperXmlHttpFactory", "goog.net.XmlHttp"]);
goog.addDependency("gears/loggerclient.js", ["goog.gears.LoggerClient"], ["goog.Disposable", "goog.debug", "goog.debug.Logger"]);
goog.addDependency("gears/loggerserver.js", ["goog.gears.LoggerServer"], ["goog.Disposable", "goog.debug.Logger", "goog.debug.Logger.Level", "goog.gears.Worker.EventType"]);
goog.addDependency("gears/logstore.js", ["goog.gears.LogStore", "goog.gears.LogStore.Query"], ["goog.async.Delay", "goog.debug.LogManager", "goog.debug.LogRecord", "goog.debug.Logger", "goog.debug.Logger.Level", "goog.gears.BaseStore", "goog.gears.BaseStore.SchemaType", "goog.json"]);
goog.addDependency("gears/managedresourcestore.js", ["goog.gears.ManagedResourceStore", "goog.gears.ManagedResourceStore.EventType", "goog.gears.ManagedResourceStore.UpdateStatus", "goog.gears.ManagedResourceStoreEvent"], ["goog.debug.Logger", "goog.events.Event", "goog.events.EventTarget", "goog.gears", "goog.string"]);
goog.addDependency("gears/multipartformdata.js", ["goog.gears.MultipartFormData"], ["goog.asserts", "goog.gears", "goog.string"]);
goog.addDependency("gears/statustype.js", ["goog.gears.StatusType"], []);
goog.addDependency("gears/urlcapture.js", ["goog.gears.UrlCapture", "goog.gears.UrlCapture.Event", "goog.gears.UrlCapture.EventType"], ["goog.Uri", "goog.debug.Logger", "goog.events.Event", "goog.events.EventTarget", "goog.gears"]);
goog.addDependency("gears/worker.js", ["goog.gears.Worker", "goog.gears.Worker.EventType", "goog.gears.WorkerEvent"], ["goog.events.Event", "goog.events.EventTarget"]);
goog.addDependency("gears/workerchannel.js", ["goog.gears.WorkerChannel"], ["goog.Disposable", "goog.debug", "goog.debug.Logger", "goog.events", "goog.gears.Worker", "goog.gears.Worker.EventType", "goog.gears.WorkerEvent", "goog.json", "goog.messaging.AbstractChannel"]);
goog.addDependency("gears/workerpool.js", ["goog.gears.WorkerPool", "goog.gears.WorkerPool.Event", "goog.gears.WorkerPool.EventType"], ["goog.events.Event", "goog.events.EventTarget", "goog.gears", "goog.gears.Worker"]);
goog.addDependency("graphics/abstractgraphics.js", ["goog.graphics.AbstractGraphics"], ["goog.graphics.Path", "goog.math.Coordinate", "goog.math.Size", "goog.style", "goog.ui.Component"]);
goog.addDependency("graphics/affinetransform.js", ["goog.graphics.AffineTransform"], ["goog.math"]);
goog.addDependency("graphics/canvaselement.js", ["goog.graphics.CanvasEllipseElement", "goog.graphics.CanvasGroupElement", "goog.graphics.CanvasImageElement", "goog.graphics.CanvasPathElement", "goog.graphics.CanvasRectElement", "goog.graphics.CanvasTextElement"], ["goog.array", "goog.dom", "goog.dom.TagName", "goog.graphics.EllipseElement", "goog.graphics.GroupElement", "goog.graphics.ImageElement", "goog.graphics.Path", "goog.graphics.PathElement", "goog.graphics.RectElement", "goog.graphics.TextElement"]);
goog.addDependency("graphics/canvasgraphics.js", ["goog.graphics.CanvasGraphics"], ["goog.dom", "goog.events.EventType", "goog.graphics.AbstractGraphics", "goog.graphics.CanvasEllipseElement", "goog.graphics.CanvasGroupElement", "goog.graphics.CanvasImageElement", "goog.graphics.CanvasPathElement", "goog.graphics.CanvasRectElement", "goog.graphics.CanvasTextElement", "goog.graphics.Font", "goog.graphics.LinearGradient", "goog.graphics.SolidFill", "goog.graphics.Stroke", "goog.math.Size"]);
goog.addDependency("graphics/element.js", ["goog.graphics.Element"], ["goog.events", "goog.events.EventTarget", "goog.graphics.AffineTransform", "goog.math"]);
goog.addDependency("graphics/ellipseelement.js", ["goog.graphics.EllipseElement"], ["goog.graphics.StrokeAndFillElement"]);
goog.addDependency("graphics/ext/coordinates.js", ["goog.graphics.ext.coordinates"], ["goog.string"]);
goog.addDependency("graphics/ext/element.js", ["goog.graphics.ext.Element"], ["goog.events", "goog.events.EventTarget", "goog.functions", "goog.graphics", "goog.graphics.ext.coordinates"]);
goog.addDependency("graphics/ext/ellipse.js", ["goog.graphics.ext.Ellipse"], ["goog.graphics.ext.StrokeAndFillElement"]);
goog.addDependency("graphics/ext/ext.js", ["goog.graphics.ext"], ["goog.graphics.ext.Ellipse", "goog.graphics.ext.Graphics", "goog.graphics.ext.Group", "goog.graphics.ext.Image", "goog.graphics.ext.Rectangle", "goog.graphics.ext.Shape", "goog.graphics.ext.coordinates"]);
goog.addDependency("graphics/ext/graphics.js", ["goog.graphics.ext.Graphics"], ["goog.events.EventType", "goog.graphics.ext.Group"]);
goog.addDependency("graphics/ext/group.js", ["goog.graphics.ext.Group"], ["goog.graphics.ext.Element"]);
goog.addDependency("graphics/ext/image.js", ["goog.graphics.ext.Image"], ["goog.graphics.ext.Element"]);
goog.addDependency("graphics/ext/path.js", ["goog.graphics.ext.Path"], ["goog.graphics.AffineTransform", "goog.graphics.Path", "goog.math", "goog.math.Rect"]);
goog.addDependency("graphics/ext/rectangle.js", ["goog.graphics.ext.Rectangle"], ["goog.graphics.ext.StrokeAndFillElement"]);
goog.addDependency("graphics/ext/shape.js", ["goog.graphics.ext.Shape"], ["goog.graphics.ext.Path", "goog.graphics.ext.StrokeAndFillElement", "goog.math.Rect"]);
goog.addDependency("graphics/ext/strokeandfillelement.js", ["goog.graphics.ext.StrokeAndFillElement"], ["goog.graphics.ext.Element"]);
goog.addDependency("graphics/fill.js", ["goog.graphics.Fill"], []);
goog.addDependency("graphics/font.js", ["goog.graphics.Font"], []);
goog.addDependency("graphics/graphics.js", ["goog.graphics"], ["goog.graphics.CanvasGraphics", "goog.graphics.SvgGraphics", "goog.graphics.VmlGraphics", "goog.userAgent"]);
goog.addDependency("graphics/groupelement.js", ["goog.graphics.GroupElement"], ["goog.graphics.Element"]);
goog.addDependency("graphics/imageelement.js", ["goog.graphics.ImageElement"], ["goog.graphics.Element"]);
goog.addDependency("graphics/lineargradient.js", ["goog.graphics.LinearGradient"], ["goog.asserts", "goog.graphics.Fill"]);
goog.addDependency("graphics/path.js", ["goog.graphics.Path", "goog.graphics.Path.Segment"], ["goog.array", "goog.math"]);
goog.addDependency("graphics/pathelement.js", ["goog.graphics.PathElement"], ["goog.graphics.StrokeAndFillElement"]);
goog.addDependency("graphics/paths.js", ["goog.graphics.paths"], ["goog.graphics.Path", "goog.math.Coordinate"]);
goog.addDependency("graphics/rectelement.js", ["goog.graphics.RectElement"], ["goog.graphics.StrokeAndFillElement"]);
goog.addDependency("graphics/solidfill.js", ["goog.graphics.SolidFill"], ["goog.graphics.Fill"]);
goog.addDependency("graphics/stroke.js", ["goog.graphics.Stroke"], []);
goog.addDependency("graphics/strokeandfillelement.js", ["goog.graphics.StrokeAndFillElement"], ["goog.graphics.Element"]);
goog.addDependency("graphics/svgelement.js", ["goog.graphics.SvgEllipseElement", "goog.graphics.SvgGroupElement", "goog.graphics.SvgImageElement", "goog.graphics.SvgPathElement", "goog.graphics.SvgRectElement", "goog.graphics.SvgTextElement"], ["goog.dom", "goog.graphics.EllipseElement", "goog.graphics.GroupElement", "goog.graphics.ImageElement", "goog.graphics.PathElement", "goog.graphics.RectElement", "goog.graphics.TextElement"]);
goog.addDependency("graphics/svggraphics.js", ["goog.graphics.SvgGraphics"], ["goog.Timer", "goog.dom", "goog.events.EventHandler", "goog.events.EventType", "goog.graphics.AbstractGraphics", "goog.graphics.Font", "goog.graphics.LinearGradient", "goog.graphics.SolidFill", "goog.graphics.Stroke", "goog.graphics.SvgEllipseElement", "goog.graphics.SvgGroupElement", "goog.graphics.SvgImageElement", "goog.graphics.SvgPathElement", "goog.graphics.SvgRectElement", "goog.graphics.SvgTextElement", "goog.math.Size", 
"goog.style", "goog.userAgent"]);
goog.addDependency("graphics/textelement.js", ["goog.graphics.TextElement"], ["goog.graphics.StrokeAndFillElement"]);
goog.addDependency("graphics/vmlelement.js", ["goog.graphics.VmlEllipseElement", "goog.graphics.VmlGroupElement", "goog.graphics.VmlImageElement", "goog.graphics.VmlPathElement", "goog.graphics.VmlRectElement", "goog.graphics.VmlTextElement"], ["goog.dom", "goog.graphics.EllipseElement", "goog.graphics.GroupElement", "goog.graphics.ImageElement", "goog.graphics.PathElement", "goog.graphics.RectElement", "goog.graphics.TextElement"]);
goog.addDependency("graphics/vmlgraphics.js", ["goog.graphics.VmlGraphics"], ["goog.array", "goog.dom", "goog.events.EventHandler", "goog.events.EventType", "goog.graphics.AbstractGraphics", "goog.graphics.Font", "goog.graphics.LinearGradient", "goog.graphics.SolidFill", "goog.graphics.Stroke", "goog.graphics.VmlEllipseElement", "goog.graphics.VmlGroupElement", "goog.graphics.VmlImageElement", "goog.graphics.VmlPathElement", "goog.graphics.VmlRectElement", "goog.graphics.VmlTextElement", "goog.math.Size", 
"goog.string", "goog.style"]);
goog.addDependency("history/event.js", ["goog.history.Event"], ["goog.events.Event", "goog.history.EventType"]);
goog.addDependency("history/eventtype.js", ["goog.history.EventType"], []);
goog.addDependency("history/history.js", ["goog.History", "goog.History.Event", "goog.History.EventType"], ["goog.Timer", "goog.dom", "goog.events", "goog.events.BrowserEvent", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.history.Event", "goog.history.EventType", "goog.string", "goog.userAgent"]);
goog.addDependency("history/html5history.js", ["goog.history.Html5History", "goog.history.Html5History.TokenTransformer"], ["goog.asserts", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.history.Event", "goog.history.EventType"]);
goog.addDependency("i18n/bidi.js", ["goog.i18n.bidi"], []);
goog.addDependency("i18n/bidiformatter.js", ["goog.i18n.BidiFormatter"], ["goog.i18n.bidi", "goog.string"]);
goog.addDependency("i18n/charlistdecompressor.js", ["goog.i18n.CharListDecompressor"], ["goog.array", "goog.i18n.uChar"]);
goog.addDependency("i18n/charpickerdata.js", ["goog.i18n.CharPickerData"], []);
goog.addDependency("i18n/currency.js", ["goog.i18n.currency"], []);
goog.addDependency("i18n/currencycodemap.js", ["goog.i18n.currencyCodeMap", "goog.i18n.currencyCodeMapTier2"], []);
goog.addDependency("i18n/datetimeformat.js", ["goog.i18n.DateTimeFormat", "goog.i18n.DateTimeFormat.Format"], ["goog.asserts", "goog.date.DateLike", "goog.i18n.DateTimeSymbols", "goog.i18n.TimeZone", "goog.string"]);
goog.addDependency("i18n/datetimeparse.js", ["goog.i18n.DateTimeParse"], ["goog.date.DateLike", "goog.i18n.DateTimeFormat", "goog.i18n.DateTimeSymbols"]);
goog.addDependency("i18n/datetimepatterns.js", ["goog.i18n.DateTimePatterns", "goog.i18n.DateTimePatterns_af", "goog.i18n.DateTimePatterns_am", "goog.i18n.DateTimePatterns_ar", "goog.i18n.DateTimePatterns_bg", "goog.i18n.DateTimePatterns_bn", "goog.i18n.DateTimePatterns_ca", "goog.i18n.DateTimePatterns_chr", "goog.i18n.DateTimePatterns_cs", "goog.i18n.DateTimePatterns_cy", "goog.i18n.DateTimePatterns_da", "goog.i18n.DateTimePatterns_de", "goog.i18n.DateTimePatterns_de_AT", "goog.i18n.DateTimePatterns_de_CH", 
"goog.i18n.DateTimePatterns_el", "goog.i18n.DateTimePatterns_en", "goog.i18n.DateTimePatterns_en_AU", "goog.i18n.DateTimePatterns_en_GB", "goog.i18n.DateTimePatterns_en_IE", "goog.i18n.DateTimePatterns_en_IN", "goog.i18n.DateTimePatterns_en_SG", "goog.i18n.DateTimePatterns_en_US", "goog.i18n.DateTimePatterns_en_ZA", "goog.i18n.DateTimePatterns_es", "goog.i18n.DateTimePatterns_es_419", "goog.i18n.DateTimePatterns_et", "goog.i18n.DateTimePatterns_eu", "goog.i18n.DateTimePatterns_fa", "goog.i18n.DateTimePatterns_fi", 
"goog.i18n.DateTimePatterns_fil", "goog.i18n.DateTimePatterns_fr", "goog.i18n.DateTimePatterns_fr_CA", "goog.i18n.DateTimePatterns_gl", "goog.i18n.DateTimePatterns_gsw", "goog.i18n.DateTimePatterns_gu", "goog.i18n.DateTimePatterns_haw", "goog.i18n.DateTimePatterns_he", "goog.i18n.DateTimePatterns_hi", "goog.i18n.DateTimePatterns_hr", "goog.i18n.DateTimePatterns_hu", "goog.i18n.DateTimePatterns_id", "goog.i18n.DateTimePatterns_in", "goog.i18n.DateTimePatterns_is", "goog.i18n.DateTimePatterns_it", 
"goog.i18n.DateTimePatterns_iw", "goog.i18n.DateTimePatterns_ja", "goog.i18n.DateTimePatterns_kn", "goog.i18n.DateTimePatterns_ko", "goog.i18n.DateTimePatterns_ln", "goog.i18n.DateTimePatterns_lt", "goog.i18n.DateTimePatterns_lv", "goog.i18n.DateTimePatterns_ml", "goog.i18n.DateTimePatterns_mo", "goog.i18n.DateTimePatterns_mr", "goog.i18n.DateTimePatterns_ms", "goog.i18n.DateTimePatterns_mt", "goog.i18n.DateTimePatterns_nl", "goog.i18n.DateTimePatterns_no", "goog.i18n.DateTimePatterns_or", "goog.i18n.DateTimePatterns_pl", 
"goog.i18n.DateTimePatterns_pt", "goog.i18n.DateTimePatterns_pt_BR", "goog.i18n.DateTimePatterns_pt_PT", "goog.i18n.DateTimePatterns_ro", "goog.i18n.DateTimePatterns_ru", "goog.i18n.DateTimePatterns_sk", "goog.i18n.DateTimePatterns_sl", "goog.i18n.DateTimePatterns_sq", "goog.i18n.DateTimePatterns_sr", "goog.i18n.DateTimePatterns_sv", "goog.i18n.DateTimePatterns_sw", "goog.i18n.DateTimePatterns_ta", "goog.i18n.DateTimePatterns_te", "goog.i18n.DateTimePatterns_th", "goog.i18n.DateTimePatterns_tl", 
"goog.i18n.DateTimePatterns_tr", "goog.i18n.DateTimePatterns_uk", "goog.i18n.DateTimePatterns_ur", "goog.i18n.DateTimePatterns_vi", "goog.i18n.DateTimePatterns_zh", "goog.i18n.DateTimePatterns_zh_CN", "goog.i18n.DateTimePatterns_zh_HK", "goog.i18n.DateTimePatterns_zh_TW", "goog.i18n.DateTimePatterns_zu"], []);
goog.addDependency("i18n/datetimepatternsext.js", ["goog.i18n.DateTimePatternsExt", "goog.i18n.DateTimePatterns_af_NA", "goog.i18n.DateTimePatterns_af_ZA", "goog.i18n.DateTimePatterns_agq", "goog.i18n.DateTimePatterns_agq_CM", "goog.i18n.DateTimePatterns_ak", "goog.i18n.DateTimePatterns_ak_GH", "goog.i18n.DateTimePatterns_am_ET", "goog.i18n.DateTimePatterns_ar_AE", "goog.i18n.DateTimePatterns_ar_BH", "goog.i18n.DateTimePatterns_ar_DZ", "goog.i18n.DateTimePatterns_ar_EG", "goog.i18n.DateTimePatterns_ar_IQ", 
"goog.i18n.DateTimePatterns_ar_JO", "goog.i18n.DateTimePatterns_ar_KW", "goog.i18n.DateTimePatterns_ar_LB", "goog.i18n.DateTimePatterns_ar_LY", "goog.i18n.DateTimePatterns_ar_MA", "goog.i18n.DateTimePatterns_ar_OM", "goog.i18n.DateTimePatterns_ar_QA", "goog.i18n.DateTimePatterns_ar_SA", "goog.i18n.DateTimePatterns_ar_SD", "goog.i18n.DateTimePatterns_ar_SY", "goog.i18n.DateTimePatterns_ar_TN", "goog.i18n.DateTimePatterns_ar_YE", "goog.i18n.DateTimePatterns_as", "goog.i18n.DateTimePatterns_as_IN", 
"goog.i18n.DateTimePatterns_asa", "goog.i18n.DateTimePatterns_asa_TZ", "goog.i18n.DateTimePatterns_az", "goog.i18n.DateTimePatterns_az_Cyrl", "goog.i18n.DateTimePatterns_az_Cyrl_AZ", "goog.i18n.DateTimePatterns_az_Latn", "goog.i18n.DateTimePatterns_az_Latn_AZ", "goog.i18n.DateTimePatterns_bas", "goog.i18n.DateTimePatterns_bas_CM", "goog.i18n.DateTimePatterns_be", "goog.i18n.DateTimePatterns_be_BY", "goog.i18n.DateTimePatterns_bem", "goog.i18n.DateTimePatterns_bem_ZM", "goog.i18n.DateTimePatterns_bez", 
"goog.i18n.DateTimePatterns_bez_TZ", "goog.i18n.DateTimePatterns_bg_BG", "goog.i18n.DateTimePatterns_bm", "goog.i18n.DateTimePatterns_bm_ML", "goog.i18n.DateTimePatterns_bn_BD", "goog.i18n.DateTimePatterns_bn_IN", "goog.i18n.DateTimePatterns_bo", "goog.i18n.DateTimePatterns_bo_CN", "goog.i18n.DateTimePatterns_bo_IN", "goog.i18n.DateTimePatterns_br", "goog.i18n.DateTimePatterns_br_FR", "goog.i18n.DateTimePatterns_brx", "goog.i18n.DateTimePatterns_brx_IN", "goog.i18n.DateTimePatterns_bs", "goog.i18n.DateTimePatterns_bs_BA", 
"goog.i18n.DateTimePatterns_ca_ES", "goog.i18n.DateTimePatterns_cgg", "goog.i18n.DateTimePatterns_cgg_UG", "goog.i18n.DateTimePatterns_chr_US", "goog.i18n.DateTimePatterns_cs_CZ", "goog.i18n.DateTimePatterns_cy_GB", "goog.i18n.DateTimePatterns_da_DK", "goog.i18n.DateTimePatterns_dav", "goog.i18n.DateTimePatterns_dav_KE", "goog.i18n.DateTimePatterns_de_BE", "goog.i18n.DateTimePatterns_de_DE", "goog.i18n.DateTimePatterns_de_LI", "goog.i18n.DateTimePatterns_de_LU", "goog.i18n.DateTimePatterns_dje", 
"goog.i18n.DateTimePatterns_dje_NE", "goog.i18n.DateTimePatterns_dua", "goog.i18n.DateTimePatterns_dua_CM", "goog.i18n.DateTimePatterns_dyo", "goog.i18n.DateTimePatterns_dyo_SN", "goog.i18n.DateTimePatterns_ebu", "goog.i18n.DateTimePatterns_ebu_KE", "goog.i18n.DateTimePatterns_ee", "goog.i18n.DateTimePatterns_ee_GH", "goog.i18n.DateTimePatterns_ee_TG", "goog.i18n.DateTimePatterns_el_CY", "goog.i18n.DateTimePatterns_el_GR", "goog.i18n.DateTimePatterns_en_AS", "goog.i18n.DateTimePatterns_en_BB", "goog.i18n.DateTimePatterns_en_BE", 
"goog.i18n.DateTimePatterns_en_BM", "goog.i18n.DateTimePatterns_en_BW", "goog.i18n.DateTimePatterns_en_BZ", "goog.i18n.DateTimePatterns_en_CA", "goog.i18n.DateTimePatterns_en_GU", "goog.i18n.DateTimePatterns_en_GY", "goog.i18n.DateTimePatterns_en_HK", "goog.i18n.DateTimePatterns_en_JM", "goog.i18n.DateTimePatterns_en_MH", "goog.i18n.DateTimePatterns_en_MP", "goog.i18n.DateTimePatterns_en_MT", "goog.i18n.DateTimePatterns_en_MU", "goog.i18n.DateTimePatterns_en_NA", "goog.i18n.DateTimePatterns_en_NZ", 
"goog.i18n.DateTimePatterns_en_PH", "goog.i18n.DateTimePatterns_en_PK", "goog.i18n.DateTimePatterns_en_TT", "goog.i18n.DateTimePatterns_en_UM", "goog.i18n.DateTimePatterns_en_US_POSIX", "goog.i18n.DateTimePatterns_en_VI", "goog.i18n.DateTimePatterns_en_ZW", "goog.i18n.DateTimePatterns_eo", "goog.i18n.DateTimePatterns_es_AR", "goog.i18n.DateTimePatterns_es_BO", "goog.i18n.DateTimePatterns_es_CL", "goog.i18n.DateTimePatterns_es_CO", "goog.i18n.DateTimePatterns_es_CR", "goog.i18n.DateTimePatterns_es_DO", 
"goog.i18n.DateTimePatterns_es_EC", "goog.i18n.DateTimePatterns_es_ES", "goog.i18n.DateTimePatterns_es_GQ", "goog.i18n.DateTimePatterns_es_GT", "goog.i18n.DateTimePatterns_es_HN", "goog.i18n.DateTimePatterns_es_MX", "goog.i18n.DateTimePatterns_es_NI", "goog.i18n.DateTimePatterns_es_PA", "goog.i18n.DateTimePatterns_es_PE", "goog.i18n.DateTimePatterns_es_PR", "goog.i18n.DateTimePatterns_es_PY", "goog.i18n.DateTimePatterns_es_SV", "goog.i18n.DateTimePatterns_es_US", "goog.i18n.DateTimePatterns_es_UY", 
"goog.i18n.DateTimePatterns_es_VE", "goog.i18n.DateTimePatterns_et_EE", "goog.i18n.DateTimePatterns_eu_ES", "goog.i18n.DateTimePatterns_ewo", "goog.i18n.DateTimePatterns_ewo_CM", "goog.i18n.DateTimePatterns_fa_AF", "goog.i18n.DateTimePatterns_fa_IR", "goog.i18n.DateTimePatterns_ff", "goog.i18n.DateTimePatterns_ff_SN", "goog.i18n.DateTimePatterns_fi_FI", "goog.i18n.DateTimePatterns_fil_PH", "goog.i18n.DateTimePatterns_fo", "goog.i18n.DateTimePatterns_fo_FO", "goog.i18n.DateTimePatterns_fr_BE", "goog.i18n.DateTimePatterns_fr_BF", 
"goog.i18n.DateTimePatterns_fr_BI", "goog.i18n.DateTimePatterns_fr_BJ", "goog.i18n.DateTimePatterns_fr_BL", "goog.i18n.DateTimePatterns_fr_CD", "goog.i18n.DateTimePatterns_fr_CF", "goog.i18n.DateTimePatterns_fr_CG", "goog.i18n.DateTimePatterns_fr_CH", "goog.i18n.DateTimePatterns_fr_CI", "goog.i18n.DateTimePatterns_fr_CM", "goog.i18n.DateTimePatterns_fr_DJ", "goog.i18n.DateTimePatterns_fr_FR", "goog.i18n.DateTimePatterns_fr_GA", "goog.i18n.DateTimePatterns_fr_GF", "goog.i18n.DateTimePatterns_fr_GN", 
"goog.i18n.DateTimePatterns_fr_GP", "goog.i18n.DateTimePatterns_fr_GQ", "goog.i18n.DateTimePatterns_fr_KM", "goog.i18n.DateTimePatterns_fr_LU", "goog.i18n.DateTimePatterns_fr_MC", "goog.i18n.DateTimePatterns_fr_MF", "goog.i18n.DateTimePatterns_fr_MG", "goog.i18n.DateTimePatterns_fr_ML", "goog.i18n.DateTimePatterns_fr_MQ", "goog.i18n.DateTimePatterns_fr_NE", "goog.i18n.DateTimePatterns_fr_RE", "goog.i18n.DateTimePatterns_fr_RW", "goog.i18n.DateTimePatterns_fr_SN", "goog.i18n.DateTimePatterns_fr_TD", 
"goog.i18n.DateTimePatterns_fr_TG", "goog.i18n.DateTimePatterns_fr_YT", "goog.i18n.DateTimePatterns_ga", "goog.i18n.DateTimePatterns_ga_IE", "goog.i18n.DateTimePatterns_gl_ES", "goog.i18n.DateTimePatterns_gsw_CH", "goog.i18n.DateTimePatterns_gu_IN", "goog.i18n.DateTimePatterns_guz", "goog.i18n.DateTimePatterns_guz_KE", "goog.i18n.DateTimePatterns_gv", "goog.i18n.DateTimePatterns_gv_GB", "goog.i18n.DateTimePatterns_ha", "goog.i18n.DateTimePatterns_ha_Latn", "goog.i18n.DateTimePatterns_ha_Latn_GH", 
"goog.i18n.DateTimePatterns_ha_Latn_NE", "goog.i18n.DateTimePatterns_ha_Latn_NG", "goog.i18n.DateTimePatterns_haw_US", "goog.i18n.DateTimePatterns_he_IL", "goog.i18n.DateTimePatterns_hi_IN", "goog.i18n.DateTimePatterns_hr_HR", "goog.i18n.DateTimePatterns_hu_HU", "goog.i18n.DateTimePatterns_hy", "goog.i18n.DateTimePatterns_hy_AM", "goog.i18n.DateTimePatterns_id_ID", "goog.i18n.DateTimePatterns_ig", "goog.i18n.DateTimePatterns_ig_NG", "goog.i18n.DateTimePatterns_ii", "goog.i18n.DateTimePatterns_ii_CN", 
"goog.i18n.DateTimePatterns_is_IS", "goog.i18n.DateTimePatterns_it_CH", "goog.i18n.DateTimePatterns_it_IT", "goog.i18n.DateTimePatterns_ja_JP", "goog.i18n.DateTimePatterns_jmc", "goog.i18n.DateTimePatterns_jmc_TZ", "goog.i18n.DateTimePatterns_ka", "goog.i18n.DateTimePatterns_ka_GE", "goog.i18n.DateTimePatterns_kab", "goog.i18n.DateTimePatterns_kab_DZ", "goog.i18n.DateTimePatterns_kam", "goog.i18n.DateTimePatterns_kam_KE", "goog.i18n.DateTimePatterns_kde", "goog.i18n.DateTimePatterns_kde_TZ", "goog.i18n.DateTimePatterns_kea", 
"goog.i18n.DateTimePatterns_kea_CV", "goog.i18n.DateTimePatterns_khq", "goog.i18n.DateTimePatterns_khq_ML", "goog.i18n.DateTimePatterns_ki", "goog.i18n.DateTimePatterns_ki_KE", "goog.i18n.DateTimePatterns_kk", "goog.i18n.DateTimePatterns_kk_Cyrl", "goog.i18n.DateTimePatterns_kk_Cyrl_KZ", "goog.i18n.DateTimePatterns_kl", "goog.i18n.DateTimePatterns_kl_GL", "goog.i18n.DateTimePatterns_kln", "goog.i18n.DateTimePatterns_kln_KE", "goog.i18n.DateTimePatterns_km", "goog.i18n.DateTimePatterns_km_KH", "goog.i18n.DateTimePatterns_kn_IN", 
"goog.i18n.DateTimePatterns_ko_KR", "goog.i18n.DateTimePatterns_kok", "goog.i18n.DateTimePatterns_kok_IN", "goog.i18n.DateTimePatterns_ksb", "goog.i18n.DateTimePatterns_ksb_TZ", "goog.i18n.DateTimePatterns_ksf", "goog.i18n.DateTimePatterns_ksf_CM", "goog.i18n.DateTimePatterns_kw", "goog.i18n.DateTimePatterns_kw_GB", "goog.i18n.DateTimePatterns_lag", "goog.i18n.DateTimePatterns_lag_TZ", "goog.i18n.DateTimePatterns_lg", "goog.i18n.DateTimePatterns_lg_UG", "goog.i18n.DateTimePatterns_ln_CD", "goog.i18n.DateTimePatterns_ln_CG", 
"goog.i18n.DateTimePatterns_lt_LT", "goog.i18n.DateTimePatterns_lu", "goog.i18n.DateTimePatterns_lu_CD", "goog.i18n.DateTimePatterns_luo", "goog.i18n.DateTimePatterns_luo_KE", "goog.i18n.DateTimePatterns_luy", "goog.i18n.DateTimePatterns_luy_KE", "goog.i18n.DateTimePatterns_lv_LV", "goog.i18n.DateTimePatterns_mas", "goog.i18n.DateTimePatterns_mas_KE", "goog.i18n.DateTimePatterns_mas_TZ", "goog.i18n.DateTimePatterns_mer", "goog.i18n.DateTimePatterns_mer_KE", "goog.i18n.DateTimePatterns_mfe", "goog.i18n.DateTimePatterns_mfe_MU", 
"goog.i18n.DateTimePatterns_mg", "goog.i18n.DateTimePatterns_mg_MG", "goog.i18n.DateTimePatterns_mgh", "goog.i18n.DateTimePatterns_mgh_MZ", "goog.i18n.DateTimePatterns_mk", "goog.i18n.DateTimePatterns_mk_MK", "goog.i18n.DateTimePatterns_ml_IN", "goog.i18n.DateTimePatterns_mr_IN", "goog.i18n.DateTimePatterns_ms_BN", "goog.i18n.DateTimePatterns_ms_MY", "goog.i18n.DateTimePatterns_mt_MT", "goog.i18n.DateTimePatterns_mua", "goog.i18n.DateTimePatterns_mua_CM", "goog.i18n.DateTimePatterns_my", "goog.i18n.DateTimePatterns_my_MM", 
"goog.i18n.DateTimePatterns_naq", "goog.i18n.DateTimePatterns_naq_NA", "goog.i18n.DateTimePatterns_nb", "goog.i18n.DateTimePatterns_nb_NO", "goog.i18n.DateTimePatterns_nd", "goog.i18n.DateTimePatterns_nd_ZW", "goog.i18n.DateTimePatterns_ne", "goog.i18n.DateTimePatterns_ne_IN", "goog.i18n.DateTimePatterns_ne_NP", "goog.i18n.DateTimePatterns_nl_AW", "goog.i18n.DateTimePatterns_nl_BE", "goog.i18n.DateTimePatterns_nl_NL", "goog.i18n.DateTimePatterns_nmg", "goog.i18n.DateTimePatterns_nmg_CM", "goog.i18n.DateTimePatterns_nn", 
"goog.i18n.DateTimePatterns_nn_NO", "goog.i18n.DateTimePatterns_nus", "goog.i18n.DateTimePatterns_nus_SD", "goog.i18n.DateTimePatterns_nyn", "goog.i18n.DateTimePatterns_nyn_UG", "goog.i18n.DateTimePatterns_om", "goog.i18n.DateTimePatterns_om_ET", "goog.i18n.DateTimePatterns_om_KE", "goog.i18n.DateTimePatterns_or_IN", "goog.i18n.DateTimePatterns_pa", "goog.i18n.DateTimePatterns_pa_Arab", "goog.i18n.DateTimePatterns_pa_Arab_PK", "goog.i18n.DateTimePatterns_pa_Guru", "goog.i18n.DateTimePatterns_pa_Guru_IN", 
"goog.i18n.DateTimePatterns_pl_PL", "goog.i18n.DateTimePatterns_ps", "goog.i18n.DateTimePatterns_ps_AF", "goog.i18n.DateTimePatterns_pt_AO", "goog.i18n.DateTimePatterns_pt_GW", "goog.i18n.DateTimePatterns_pt_MZ", "goog.i18n.DateTimePatterns_pt_ST", "goog.i18n.DateTimePatterns_rm", "goog.i18n.DateTimePatterns_rm_CH", "goog.i18n.DateTimePatterns_rn", "goog.i18n.DateTimePatterns_rn_BI", "goog.i18n.DateTimePatterns_ro_MD", "goog.i18n.DateTimePatterns_ro_RO", "goog.i18n.DateTimePatterns_rof", "goog.i18n.DateTimePatterns_rof_TZ", 
"goog.i18n.DateTimePatterns_ru_MD", "goog.i18n.DateTimePatterns_ru_RU", "goog.i18n.DateTimePatterns_ru_UA", "goog.i18n.DateTimePatterns_rw", "goog.i18n.DateTimePatterns_rw_RW", "goog.i18n.DateTimePatterns_rwk", "goog.i18n.DateTimePatterns_rwk_TZ", "goog.i18n.DateTimePatterns_saq", "goog.i18n.DateTimePatterns_saq_KE", "goog.i18n.DateTimePatterns_sbp", "goog.i18n.DateTimePatterns_sbp_TZ", "goog.i18n.DateTimePatterns_seh", "goog.i18n.DateTimePatterns_seh_MZ", "goog.i18n.DateTimePatterns_ses", "goog.i18n.DateTimePatterns_ses_ML", 
"goog.i18n.DateTimePatterns_sg", "goog.i18n.DateTimePatterns_sg_CF", "goog.i18n.DateTimePatterns_shi", "goog.i18n.DateTimePatterns_shi_Latn", "goog.i18n.DateTimePatterns_shi_Latn_MA", "goog.i18n.DateTimePatterns_shi_Tfng", "goog.i18n.DateTimePatterns_shi_Tfng_MA", "goog.i18n.DateTimePatterns_si", "goog.i18n.DateTimePatterns_si_LK", "goog.i18n.DateTimePatterns_sk_SK", "goog.i18n.DateTimePatterns_sl_SI", "goog.i18n.DateTimePatterns_sn", "goog.i18n.DateTimePatterns_sn_ZW", "goog.i18n.DateTimePatterns_so", 
"goog.i18n.DateTimePatterns_so_DJ", "goog.i18n.DateTimePatterns_so_ET", "goog.i18n.DateTimePatterns_so_KE", "goog.i18n.DateTimePatterns_so_SO", "goog.i18n.DateTimePatterns_sq_AL", "goog.i18n.DateTimePatterns_sr_Cyrl", "goog.i18n.DateTimePatterns_sr_Cyrl_BA", "goog.i18n.DateTimePatterns_sr_Cyrl_ME", "goog.i18n.DateTimePatterns_sr_Cyrl_RS", "goog.i18n.DateTimePatterns_sr_Latn", "goog.i18n.DateTimePatterns_sr_Latn_BA", "goog.i18n.DateTimePatterns_sr_Latn_ME", "goog.i18n.DateTimePatterns_sr_Latn_RS", 
"goog.i18n.DateTimePatterns_sv_FI", "goog.i18n.DateTimePatterns_sv_SE", "goog.i18n.DateTimePatterns_sw_KE", "goog.i18n.DateTimePatterns_sw_TZ", "goog.i18n.DateTimePatterns_swc", "goog.i18n.DateTimePatterns_swc_CD", "goog.i18n.DateTimePatterns_ta_IN", "goog.i18n.DateTimePatterns_ta_LK", "goog.i18n.DateTimePatterns_te_IN", "goog.i18n.DateTimePatterns_teo", "goog.i18n.DateTimePatterns_teo_KE", "goog.i18n.DateTimePatterns_teo_UG", "goog.i18n.DateTimePatterns_th_TH", "goog.i18n.DateTimePatterns_ti", "goog.i18n.DateTimePatterns_ti_ER", 
"goog.i18n.DateTimePatterns_ti_ET", "goog.i18n.DateTimePatterns_to", "goog.i18n.DateTimePatterns_to_TO", "goog.i18n.DateTimePatterns_tr_TR", "goog.i18n.DateTimePatterns_twq", "goog.i18n.DateTimePatterns_twq_NE", "goog.i18n.DateTimePatterns_tzm", "goog.i18n.DateTimePatterns_tzm_Latn", "goog.i18n.DateTimePatterns_tzm_Latn_MA", "goog.i18n.DateTimePatterns_uk_UA", "goog.i18n.DateTimePatterns_ur_IN", "goog.i18n.DateTimePatterns_ur_PK", "goog.i18n.DateTimePatterns_uz", "goog.i18n.DateTimePatterns_uz_Arab", 
"goog.i18n.DateTimePatterns_uz_Arab_AF", "goog.i18n.DateTimePatterns_uz_Cyrl", "goog.i18n.DateTimePatterns_uz_Cyrl_UZ", "goog.i18n.DateTimePatterns_uz_Latn", "goog.i18n.DateTimePatterns_uz_Latn_UZ", "goog.i18n.DateTimePatterns_vai", "goog.i18n.DateTimePatterns_vai_Latn", "goog.i18n.DateTimePatterns_vai_Latn_LR", "goog.i18n.DateTimePatterns_vai_Vaii", "goog.i18n.DateTimePatterns_vai_Vaii_LR", "goog.i18n.DateTimePatterns_vi_VN", "goog.i18n.DateTimePatterns_vun", "goog.i18n.DateTimePatterns_vun_TZ", 
"goog.i18n.DateTimePatterns_xog", "goog.i18n.DateTimePatterns_xog_UG", "goog.i18n.DateTimePatterns_yav", "goog.i18n.DateTimePatterns_yav_CM", "goog.i18n.DateTimePatterns_yo", "goog.i18n.DateTimePatterns_yo_NG", "goog.i18n.DateTimePatterns_zh_Hans", "goog.i18n.DateTimePatterns_zh_Hans_CN", "goog.i18n.DateTimePatterns_zh_Hans_HK", "goog.i18n.DateTimePatterns_zh_Hans_MO", "goog.i18n.DateTimePatterns_zh_Hans_SG", "goog.i18n.DateTimePatterns_zh_Hant", "goog.i18n.DateTimePatterns_zh_Hant_HK", "goog.i18n.DateTimePatterns_zh_Hant_MO", 
"goog.i18n.DateTimePatterns_zh_Hant_TW", "goog.i18n.DateTimePatterns_zu_ZA"], ["goog.i18n.DateTimePatterns"]);
goog.addDependency("i18n/datetimesymbols.js", ["goog.i18n.DateTimeSymbols", "goog.i18n.DateTimeSymbols_af", "goog.i18n.DateTimeSymbols_am", "goog.i18n.DateTimeSymbols_ar", "goog.i18n.DateTimeSymbols_bg", "goog.i18n.DateTimeSymbols_bn", "goog.i18n.DateTimeSymbols_ca", "goog.i18n.DateTimeSymbols_chr", "goog.i18n.DateTimeSymbols_cs", "goog.i18n.DateTimeSymbols_cy", "goog.i18n.DateTimeSymbols_da", "goog.i18n.DateTimeSymbols_de", "goog.i18n.DateTimeSymbols_de_AT", "goog.i18n.DateTimeSymbols_de_CH", "goog.i18n.DateTimeSymbols_el", 
"goog.i18n.DateTimeSymbols_en", "goog.i18n.DateTimeSymbols_en_AU", "goog.i18n.DateTimeSymbols_en_GB", "goog.i18n.DateTimeSymbols_en_IE", "goog.i18n.DateTimeSymbols_en_IN", "goog.i18n.DateTimeSymbols_en_ISO", "goog.i18n.DateTimeSymbols_en_SG", "goog.i18n.DateTimeSymbols_en_US", "goog.i18n.DateTimeSymbols_en_ZA", "goog.i18n.DateTimeSymbols_es", "goog.i18n.DateTimeSymbols_es_419", "goog.i18n.DateTimeSymbols_et", "goog.i18n.DateTimeSymbols_eu", "goog.i18n.DateTimeSymbols_fa", "goog.i18n.DateTimeSymbols_fi", 
"goog.i18n.DateTimeSymbols_fil", "goog.i18n.DateTimeSymbols_fr", "goog.i18n.DateTimeSymbols_fr_CA", "goog.i18n.DateTimeSymbols_gl", "goog.i18n.DateTimeSymbols_gsw", "goog.i18n.DateTimeSymbols_gu", "goog.i18n.DateTimeSymbols_haw", "goog.i18n.DateTimeSymbols_he", "goog.i18n.DateTimeSymbols_hi", "goog.i18n.DateTimeSymbols_hr", "goog.i18n.DateTimeSymbols_hu", "goog.i18n.DateTimeSymbols_id", "goog.i18n.DateTimeSymbols_in", "goog.i18n.DateTimeSymbols_is", "goog.i18n.DateTimeSymbols_it", "goog.i18n.DateTimeSymbols_iw", 
"goog.i18n.DateTimeSymbols_ja", "goog.i18n.DateTimeSymbols_kn", "goog.i18n.DateTimeSymbols_ko", "goog.i18n.DateTimeSymbols_ln", "goog.i18n.DateTimeSymbols_lt", "goog.i18n.DateTimeSymbols_lv", "goog.i18n.DateTimeSymbols_ml", "goog.i18n.DateTimeSymbols_mr", "goog.i18n.DateTimeSymbols_ms", "goog.i18n.DateTimeSymbols_mt", "goog.i18n.DateTimeSymbols_nl", "goog.i18n.DateTimeSymbols_no", "goog.i18n.DateTimeSymbols_or", "goog.i18n.DateTimeSymbols_pl", "goog.i18n.DateTimeSymbols_pt", "goog.i18n.DateTimeSymbols_pt_BR", 
"goog.i18n.DateTimeSymbols_pt_PT", "goog.i18n.DateTimeSymbols_ro", "goog.i18n.DateTimeSymbols_ru", "goog.i18n.DateTimeSymbols_sk", "goog.i18n.DateTimeSymbols_sl", "goog.i18n.DateTimeSymbols_sq", "goog.i18n.DateTimeSymbols_sr", "goog.i18n.DateTimeSymbols_sv", "goog.i18n.DateTimeSymbols_sw", "goog.i18n.DateTimeSymbols_ta", "goog.i18n.DateTimeSymbols_te", "goog.i18n.DateTimeSymbols_th", "goog.i18n.DateTimeSymbols_tl", "goog.i18n.DateTimeSymbols_tr", "goog.i18n.DateTimeSymbols_uk", "goog.i18n.DateTimeSymbols_ur", 
"goog.i18n.DateTimeSymbols_vi", "goog.i18n.DateTimeSymbols_zh", "goog.i18n.DateTimeSymbols_zh_CN", "goog.i18n.DateTimeSymbols_zh_HK", "goog.i18n.DateTimeSymbols_zh_TW", "goog.i18n.DateTimeSymbols_zu"], []);
goog.addDependency("i18n/datetimesymbolsext.js", ["goog.i18n.DateTimeSymbolsExt", "goog.i18n.DateTimeSymbols_aa", "goog.i18n.DateTimeSymbols_aa_DJ", "goog.i18n.DateTimeSymbols_aa_ER", "goog.i18n.DateTimeSymbols_aa_ET", "goog.i18n.DateTimeSymbols_af_NA", "goog.i18n.DateTimeSymbols_af_ZA", "goog.i18n.DateTimeSymbols_agq", "goog.i18n.DateTimeSymbols_agq_CM", "goog.i18n.DateTimeSymbols_ak", "goog.i18n.DateTimeSymbols_ak_GH", "goog.i18n.DateTimeSymbols_am_ET", "goog.i18n.DateTimeSymbols_ar_AE", "goog.i18n.DateTimeSymbols_ar_BH", 
"goog.i18n.DateTimeSymbols_ar_DZ", "goog.i18n.DateTimeSymbols_ar_EG", "goog.i18n.DateTimeSymbols_ar_IQ", "goog.i18n.DateTimeSymbols_ar_JO", "goog.i18n.DateTimeSymbols_ar_KW", "goog.i18n.DateTimeSymbols_ar_LB", "goog.i18n.DateTimeSymbols_ar_LY", "goog.i18n.DateTimeSymbols_ar_MA", "goog.i18n.DateTimeSymbols_ar_OM", "goog.i18n.DateTimeSymbols_ar_QA", "goog.i18n.DateTimeSymbols_ar_SA", "goog.i18n.DateTimeSymbols_ar_SD", "goog.i18n.DateTimeSymbols_ar_SY", "goog.i18n.DateTimeSymbols_ar_TN", "goog.i18n.DateTimeSymbols_ar_YE", 
"goog.i18n.DateTimeSymbols_as", "goog.i18n.DateTimeSymbols_as_IN", "goog.i18n.DateTimeSymbols_asa", "goog.i18n.DateTimeSymbols_asa_TZ", "goog.i18n.DateTimeSymbols_az", "goog.i18n.DateTimeSymbols_az_Cyrl", "goog.i18n.DateTimeSymbols_az_Cyrl_AZ", "goog.i18n.DateTimeSymbols_az_Latn", "goog.i18n.DateTimeSymbols_az_Latn_AZ", "goog.i18n.DateTimeSymbols_bas", "goog.i18n.DateTimeSymbols_bas_CM", "goog.i18n.DateTimeSymbols_be", "goog.i18n.DateTimeSymbols_be_BY", "goog.i18n.DateTimeSymbols_bem", "goog.i18n.DateTimeSymbols_bem_ZM", 
"goog.i18n.DateTimeSymbols_bez", "goog.i18n.DateTimeSymbols_bez_TZ", "goog.i18n.DateTimeSymbols_bg_BG", "goog.i18n.DateTimeSymbols_bm", "goog.i18n.DateTimeSymbols_bm_ML", "goog.i18n.DateTimeSymbols_bn_BD", "goog.i18n.DateTimeSymbols_bn_IN", "goog.i18n.DateTimeSymbols_bo", "goog.i18n.DateTimeSymbols_bo_CN", "goog.i18n.DateTimeSymbols_bo_IN", "goog.i18n.DateTimeSymbols_br", "goog.i18n.DateTimeSymbols_br_FR", "goog.i18n.DateTimeSymbols_brx", "goog.i18n.DateTimeSymbols_brx_IN", "goog.i18n.DateTimeSymbols_bs", 
"goog.i18n.DateTimeSymbols_bs_BA", "goog.i18n.DateTimeSymbols_byn", "goog.i18n.DateTimeSymbols_byn_ER", "goog.i18n.DateTimeSymbols_ca_ES", "goog.i18n.DateTimeSymbols_cgg", "goog.i18n.DateTimeSymbols_cgg_UG", "goog.i18n.DateTimeSymbols_chr_US", "goog.i18n.DateTimeSymbols_ckb", "goog.i18n.DateTimeSymbols_ckb_Arab", "goog.i18n.DateTimeSymbols_ckb_Arab_IQ", "goog.i18n.DateTimeSymbols_ckb_Arab_IR", "goog.i18n.DateTimeSymbols_ckb_IQ", "goog.i18n.DateTimeSymbols_ckb_IR", "goog.i18n.DateTimeSymbols_ckb_Latn", 
"goog.i18n.DateTimeSymbols_ckb_Latn_IQ", "goog.i18n.DateTimeSymbols_cs_CZ", "goog.i18n.DateTimeSymbols_cy_GB", "goog.i18n.DateTimeSymbols_da_DK", "goog.i18n.DateTimeSymbols_dav", "goog.i18n.DateTimeSymbols_dav_KE", "goog.i18n.DateTimeSymbols_de_BE", "goog.i18n.DateTimeSymbols_de_DE", "goog.i18n.DateTimeSymbols_de_LI", "goog.i18n.DateTimeSymbols_de_LU", "goog.i18n.DateTimeSymbols_dje", "goog.i18n.DateTimeSymbols_dje_NE", "goog.i18n.DateTimeSymbols_dua", "goog.i18n.DateTimeSymbols_dua_CM", "goog.i18n.DateTimeSymbols_dyo", 
"goog.i18n.DateTimeSymbols_dyo_SN", "goog.i18n.DateTimeSymbols_dz", "goog.i18n.DateTimeSymbols_dz_BT", "goog.i18n.DateTimeSymbols_ebu", "goog.i18n.DateTimeSymbols_ebu_KE", "goog.i18n.DateTimeSymbols_ee", "goog.i18n.DateTimeSymbols_ee_GH", "goog.i18n.DateTimeSymbols_ee_TG", "goog.i18n.DateTimeSymbols_el_CY", "goog.i18n.DateTimeSymbols_el_GR", "goog.i18n.DateTimeSymbols_en_AS", "goog.i18n.DateTimeSymbols_en_BB", "goog.i18n.DateTimeSymbols_en_BE", "goog.i18n.DateTimeSymbols_en_BM", "goog.i18n.DateTimeSymbols_en_BW", 
"goog.i18n.DateTimeSymbols_en_BZ", "goog.i18n.DateTimeSymbols_en_CA", "goog.i18n.DateTimeSymbols_en_Dsrt", "goog.i18n.DateTimeSymbols_en_Dsrt_US", "goog.i18n.DateTimeSymbols_en_GU", "goog.i18n.DateTimeSymbols_en_GY", "goog.i18n.DateTimeSymbols_en_HK", "goog.i18n.DateTimeSymbols_en_JM", "goog.i18n.DateTimeSymbols_en_MH", "goog.i18n.DateTimeSymbols_en_MP", "goog.i18n.DateTimeSymbols_en_MT", "goog.i18n.DateTimeSymbols_en_MU", "goog.i18n.DateTimeSymbols_en_NA", "goog.i18n.DateTimeSymbols_en_NZ", "goog.i18n.DateTimeSymbols_en_PH", 
"goog.i18n.DateTimeSymbols_en_PK", "goog.i18n.DateTimeSymbols_en_TT", "goog.i18n.DateTimeSymbols_en_UM", "goog.i18n.DateTimeSymbols_en_VI", "goog.i18n.DateTimeSymbols_en_ZW", "goog.i18n.DateTimeSymbols_eo", "goog.i18n.DateTimeSymbols_es_AR", "goog.i18n.DateTimeSymbols_es_BO", "goog.i18n.DateTimeSymbols_es_CL", "goog.i18n.DateTimeSymbols_es_CO", "goog.i18n.DateTimeSymbols_es_CR", "goog.i18n.DateTimeSymbols_es_DO", "goog.i18n.DateTimeSymbols_es_EC", "goog.i18n.DateTimeSymbols_es_ES", "goog.i18n.DateTimeSymbols_es_GQ", 
"goog.i18n.DateTimeSymbols_es_GT", "goog.i18n.DateTimeSymbols_es_HN", "goog.i18n.DateTimeSymbols_es_MX", "goog.i18n.DateTimeSymbols_es_NI", "goog.i18n.DateTimeSymbols_es_PA", "goog.i18n.DateTimeSymbols_es_PE", "goog.i18n.DateTimeSymbols_es_PR", "goog.i18n.DateTimeSymbols_es_PY", "goog.i18n.DateTimeSymbols_es_SV", "goog.i18n.DateTimeSymbols_es_US", "goog.i18n.DateTimeSymbols_es_UY", "goog.i18n.DateTimeSymbols_es_VE", "goog.i18n.DateTimeSymbols_et_EE", "goog.i18n.DateTimeSymbols_eu_ES", "goog.i18n.DateTimeSymbols_ewo", 
"goog.i18n.DateTimeSymbols_ewo_CM", "goog.i18n.DateTimeSymbols_fa_AF", "goog.i18n.DateTimeSymbols_fa_IR", "goog.i18n.DateTimeSymbols_ff", "goog.i18n.DateTimeSymbols_ff_SN", "goog.i18n.DateTimeSymbols_fi_FI", "goog.i18n.DateTimeSymbols_fil_PH", "goog.i18n.DateTimeSymbols_fo", "goog.i18n.DateTimeSymbols_fo_FO", "goog.i18n.DateTimeSymbols_fr_BE", "goog.i18n.DateTimeSymbols_fr_BF", "goog.i18n.DateTimeSymbols_fr_BI", "goog.i18n.DateTimeSymbols_fr_BJ", "goog.i18n.DateTimeSymbols_fr_BL", "goog.i18n.DateTimeSymbols_fr_CD", 
"goog.i18n.DateTimeSymbols_fr_CF", "goog.i18n.DateTimeSymbols_fr_CG", "goog.i18n.DateTimeSymbols_fr_CH", "goog.i18n.DateTimeSymbols_fr_CI", "goog.i18n.DateTimeSymbols_fr_CM", "goog.i18n.DateTimeSymbols_fr_DJ", "goog.i18n.DateTimeSymbols_fr_FR", "goog.i18n.DateTimeSymbols_fr_GA", "goog.i18n.DateTimeSymbols_fr_GF", "goog.i18n.DateTimeSymbols_fr_GN", "goog.i18n.DateTimeSymbols_fr_GP", "goog.i18n.DateTimeSymbols_fr_GQ", "goog.i18n.DateTimeSymbols_fr_KM", "goog.i18n.DateTimeSymbols_fr_LU", "goog.i18n.DateTimeSymbols_fr_MC", 
"goog.i18n.DateTimeSymbols_fr_MF", "goog.i18n.DateTimeSymbols_fr_MG", "goog.i18n.DateTimeSymbols_fr_ML", "goog.i18n.DateTimeSymbols_fr_MQ", "goog.i18n.DateTimeSymbols_fr_NE", "goog.i18n.DateTimeSymbols_fr_RE", "goog.i18n.DateTimeSymbols_fr_RW", "goog.i18n.DateTimeSymbols_fr_SN", "goog.i18n.DateTimeSymbols_fr_TD", "goog.i18n.DateTimeSymbols_fr_TG", "goog.i18n.DateTimeSymbols_fr_YT", "goog.i18n.DateTimeSymbols_fur", "goog.i18n.DateTimeSymbols_fur_IT", "goog.i18n.DateTimeSymbols_ga", "goog.i18n.DateTimeSymbols_ga_IE", 
"goog.i18n.DateTimeSymbols_gl_ES", "goog.i18n.DateTimeSymbols_gsw_CH", "goog.i18n.DateTimeSymbols_gu_IN", "goog.i18n.DateTimeSymbols_guz", "goog.i18n.DateTimeSymbols_guz_KE", "goog.i18n.DateTimeSymbols_gv", "goog.i18n.DateTimeSymbols_gv_GB", "goog.i18n.DateTimeSymbols_ha", "goog.i18n.DateTimeSymbols_ha_Latn", "goog.i18n.DateTimeSymbols_ha_Latn_GH", "goog.i18n.DateTimeSymbols_ha_Latn_NE", "goog.i18n.DateTimeSymbols_ha_Latn_NG", "goog.i18n.DateTimeSymbols_haw_US", "goog.i18n.DateTimeSymbols_he_IL", 
"goog.i18n.DateTimeSymbols_hi_IN", "goog.i18n.DateTimeSymbols_hr_HR", "goog.i18n.DateTimeSymbols_hu_HU", "goog.i18n.DateTimeSymbols_hy", "goog.i18n.DateTimeSymbols_hy_AM", "goog.i18n.DateTimeSymbols_ia", "goog.i18n.DateTimeSymbols_id_ID", "goog.i18n.DateTimeSymbols_ig", "goog.i18n.DateTimeSymbols_ig_NG", "goog.i18n.DateTimeSymbols_ii", "goog.i18n.DateTimeSymbols_ii_CN", "goog.i18n.DateTimeSymbols_is_IS", "goog.i18n.DateTimeSymbols_it_CH", "goog.i18n.DateTimeSymbols_it_IT", "goog.i18n.DateTimeSymbols_ja_JP", 
"goog.i18n.DateTimeSymbols_jmc", "goog.i18n.DateTimeSymbols_jmc_TZ", "goog.i18n.DateTimeSymbols_ka", "goog.i18n.DateTimeSymbols_ka_GE", "goog.i18n.DateTimeSymbols_kab", "goog.i18n.DateTimeSymbols_kab_DZ", "goog.i18n.DateTimeSymbols_kam", "goog.i18n.DateTimeSymbols_kam_KE", "goog.i18n.DateTimeSymbols_kde", "goog.i18n.DateTimeSymbols_kde_TZ", "goog.i18n.DateTimeSymbols_kea", "goog.i18n.DateTimeSymbols_kea_CV", "goog.i18n.DateTimeSymbols_khq", "goog.i18n.DateTimeSymbols_khq_ML", "goog.i18n.DateTimeSymbols_ki", 
"goog.i18n.DateTimeSymbols_ki_KE", "goog.i18n.DateTimeSymbols_kk", "goog.i18n.DateTimeSymbols_kk_Cyrl", "goog.i18n.DateTimeSymbols_kk_Cyrl_KZ", "goog.i18n.DateTimeSymbols_kl", "goog.i18n.DateTimeSymbols_kl_GL", "goog.i18n.DateTimeSymbols_kln", "goog.i18n.DateTimeSymbols_kln_KE", "goog.i18n.DateTimeSymbols_km", "goog.i18n.DateTimeSymbols_km_KH", "goog.i18n.DateTimeSymbols_kn_IN", "goog.i18n.DateTimeSymbols_ko_KR", "goog.i18n.DateTimeSymbols_kok", "goog.i18n.DateTimeSymbols_kok_IN", "goog.i18n.DateTimeSymbols_ksb", 
"goog.i18n.DateTimeSymbols_ksb_TZ", "goog.i18n.DateTimeSymbols_ksf", "goog.i18n.DateTimeSymbols_ksf_CM", "goog.i18n.DateTimeSymbols_ksh", "goog.i18n.DateTimeSymbols_ksh_DE", "goog.i18n.DateTimeSymbols_ku", "goog.i18n.DateTimeSymbols_kw", "goog.i18n.DateTimeSymbols_kw_GB", "goog.i18n.DateTimeSymbols_lag", "goog.i18n.DateTimeSymbols_lag_TZ", "goog.i18n.DateTimeSymbols_lg", "goog.i18n.DateTimeSymbols_lg_UG", "goog.i18n.DateTimeSymbols_ln_CD", "goog.i18n.DateTimeSymbols_ln_CG", "goog.i18n.DateTimeSymbols_lo", 
"goog.i18n.DateTimeSymbols_lo_LA", "goog.i18n.DateTimeSymbols_lt_LT", "goog.i18n.DateTimeSymbols_lu", "goog.i18n.DateTimeSymbols_lu_CD", "goog.i18n.DateTimeSymbols_luo", "goog.i18n.DateTimeSymbols_luo_KE", "goog.i18n.DateTimeSymbols_luy", "goog.i18n.DateTimeSymbols_luy_KE", "goog.i18n.DateTimeSymbols_lv_LV", "goog.i18n.DateTimeSymbols_mas", "goog.i18n.DateTimeSymbols_mas_KE", "goog.i18n.DateTimeSymbols_mas_TZ", "goog.i18n.DateTimeSymbols_mer", "goog.i18n.DateTimeSymbols_mer_KE", "goog.i18n.DateTimeSymbols_mfe", 
"goog.i18n.DateTimeSymbols_mfe_MU", "goog.i18n.DateTimeSymbols_mg", "goog.i18n.DateTimeSymbols_mg_MG", "goog.i18n.DateTimeSymbols_mgh", "goog.i18n.DateTimeSymbols_mgh_MZ", "goog.i18n.DateTimeSymbols_mk", "goog.i18n.DateTimeSymbols_mk_MK", "goog.i18n.DateTimeSymbols_ml_IN", "goog.i18n.DateTimeSymbols_mr_IN", "goog.i18n.DateTimeSymbols_ms_BN", "goog.i18n.DateTimeSymbols_ms_MY", "goog.i18n.DateTimeSymbols_mt_MT", "goog.i18n.DateTimeSymbols_mua", "goog.i18n.DateTimeSymbols_mua_CM", "goog.i18n.DateTimeSymbols_my", 
"goog.i18n.DateTimeSymbols_my_MM", "goog.i18n.DateTimeSymbols_naq", "goog.i18n.DateTimeSymbols_naq_NA", "goog.i18n.DateTimeSymbols_nb", "goog.i18n.DateTimeSymbols_nb_NO", "goog.i18n.DateTimeSymbols_nd", "goog.i18n.DateTimeSymbols_nd_ZW", "goog.i18n.DateTimeSymbols_ne", "goog.i18n.DateTimeSymbols_ne_IN", "goog.i18n.DateTimeSymbols_ne_NP", "goog.i18n.DateTimeSymbols_nl_AW", "goog.i18n.DateTimeSymbols_nl_BE", "goog.i18n.DateTimeSymbols_nl_NL", "goog.i18n.DateTimeSymbols_nmg", "goog.i18n.DateTimeSymbols_nmg_CM", 
"goog.i18n.DateTimeSymbols_nn", "goog.i18n.DateTimeSymbols_nn_NO", "goog.i18n.DateTimeSymbols_nr", "goog.i18n.DateTimeSymbols_nr_ZA", "goog.i18n.DateTimeSymbols_nso", "goog.i18n.DateTimeSymbols_nso_ZA", "goog.i18n.DateTimeSymbols_nus", "goog.i18n.DateTimeSymbols_nus_SD", "goog.i18n.DateTimeSymbols_nyn", "goog.i18n.DateTimeSymbols_nyn_UG", "goog.i18n.DateTimeSymbols_om", "goog.i18n.DateTimeSymbols_om_ET", "goog.i18n.DateTimeSymbols_om_KE", "goog.i18n.DateTimeSymbols_or_IN", "goog.i18n.DateTimeSymbols_pa", 
"goog.i18n.DateTimeSymbols_pa_Arab", "goog.i18n.DateTimeSymbols_pa_Arab_PK", "goog.i18n.DateTimeSymbols_pa_Guru", "goog.i18n.DateTimeSymbols_pa_Guru_IN", "goog.i18n.DateTimeSymbols_pl_PL", "goog.i18n.DateTimeSymbols_ps", "goog.i18n.DateTimeSymbols_ps_AF", "goog.i18n.DateTimeSymbols_pt_AO", "goog.i18n.DateTimeSymbols_pt_GW", "goog.i18n.DateTimeSymbols_pt_MZ", "goog.i18n.DateTimeSymbols_pt_ST", "goog.i18n.DateTimeSymbols_rm", "goog.i18n.DateTimeSymbols_rm_CH", "goog.i18n.DateTimeSymbols_rn", "goog.i18n.DateTimeSymbols_rn_BI", 
"goog.i18n.DateTimeSymbols_ro_MD", "goog.i18n.DateTimeSymbols_ro_RO", "goog.i18n.DateTimeSymbols_rof", "goog.i18n.DateTimeSymbols_rof_TZ", "goog.i18n.DateTimeSymbols_ru_MD", "goog.i18n.DateTimeSymbols_ru_RU", "goog.i18n.DateTimeSymbols_ru_UA", "goog.i18n.DateTimeSymbols_rw", "goog.i18n.DateTimeSymbols_rw_RW", "goog.i18n.DateTimeSymbols_rwk", "goog.i18n.DateTimeSymbols_rwk_TZ", "goog.i18n.DateTimeSymbols_sah", "goog.i18n.DateTimeSymbols_sah_RU", "goog.i18n.DateTimeSymbols_saq", "goog.i18n.DateTimeSymbols_saq_KE", 
"goog.i18n.DateTimeSymbols_sbp", "goog.i18n.DateTimeSymbols_sbp_TZ", "goog.i18n.DateTimeSymbols_se", "goog.i18n.DateTimeSymbols_se_FI", "goog.i18n.DateTimeSymbols_se_NO", "goog.i18n.DateTimeSymbols_seh", "goog.i18n.DateTimeSymbols_seh_MZ", "goog.i18n.DateTimeSymbols_ses", "goog.i18n.DateTimeSymbols_ses_ML", "goog.i18n.DateTimeSymbols_sg", "goog.i18n.DateTimeSymbols_sg_CF", "goog.i18n.DateTimeSymbols_shi", "goog.i18n.DateTimeSymbols_shi_Latn", "goog.i18n.DateTimeSymbols_shi_Latn_MA", "goog.i18n.DateTimeSymbols_shi_Tfng", 
"goog.i18n.DateTimeSymbols_shi_Tfng_MA", "goog.i18n.DateTimeSymbols_si", "goog.i18n.DateTimeSymbols_si_LK", "goog.i18n.DateTimeSymbols_sk_SK", "goog.i18n.DateTimeSymbols_sl_SI", "goog.i18n.DateTimeSymbols_sn", "goog.i18n.DateTimeSymbols_sn_ZW", "goog.i18n.DateTimeSymbols_so", "goog.i18n.DateTimeSymbols_so_DJ", "goog.i18n.DateTimeSymbols_so_ET", "goog.i18n.DateTimeSymbols_so_KE", "goog.i18n.DateTimeSymbols_so_SO", "goog.i18n.DateTimeSymbols_sq_AL", "goog.i18n.DateTimeSymbols_sr_Cyrl", "goog.i18n.DateTimeSymbols_sr_Cyrl_BA", 
"goog.i18n.DateTimeSymbols_sr_Cyrl_ME", "goog.i18n.DateTimeSymbols_sr_Cyrl_RS", "goog.i18n.DateTimeSymbols_sr_Latn", "goog.i18n.DateTimeSymbols_sr_Latn_BA", "goog.i18n.DateTimeSymbols_sr_Latn_ME", "goog.i18n.DateTimeSymbols_sr_Latn_RS", "goog.i18n.DateTimeSymbols_ss", "goog.i18n.DateTimeSymbols_ss_SZ", "goog.i18n.DateTimeSymbols_ss_ZA", "goog.i18n.DateTimeSymbols_ssy", "goog.i18n.DateTimeSymbols_ssy_ER", "goog.i18n.DateTimeSymbols_st", "goog.i18n.DateTimeSymbols_st_LS", "goog.i18n.DateTimeSymbols_st_ZA", 
"goog.i18n.DateTimeSymbols_sv_FI", "goog.i18n.DateTimeSymbols_sv_SE", "goog.i18n.DateTimeSymbols_sw_KE", "goog.i18n.DateTimeSymbols_sw_TZ", "goog.i18n.DateTimeSymbols_swc", "goog.i18n.DateTimeSymbols_swc_CD", "goog.i18n.DateTimeSymbols_ta_IN", "goog.i18n.DateTimeSymbols_ta_LK", "goog.i18n.DateTimeSymbols_te_IN", "goog.i18n.DateTimeSymbols_teo", "goog.i18n.DateTimeSymbols_teo_KE", "goog.i18n.DateTimeSymbols_teo_UG", "goog.i18n.DateTimeSymbols_tg", "goog.i18n.DateTimeSymbols_tg_Cyrl", "goog.i18n.DateTimeSymbols_tg_Cyrl_TJ", 
"goog.i18n.DateTimeSymbols_th_TH", "goog.i18n.DateTimeSymbols_ti", "goog.i18n.DateTimeSymbols_ti_ER", "goog.i18n.DateTimeSymbols_ti_ET", "goog.i18n.DateTimeSymbols_tig", "goog.i18n.DateTimeSymbols_tig_ER", "goog.i18n.DateTimeSymbols_tn", "goog.i18n.DateTimeSymbols_tn_ZA", "goog.i18n.DateTimeSymbols_to", "goog.i18n.DateTimeSymbols_to_TO", "goog.i18n.DateTimeSymbols_tr_TR", "goog.i18n.DateTimeSymbols_ts", "goog.i18n.DateTimeSymbols_ts_ZA", "goog.i18n.DateTimeSymbols_twq", "goog.i18n.DateTimeSymbols_twq_NE", 
"goog.i18n.DateTimeSymbols_tzm", "goog.i18n.DateTimeSymbols_tzm_Latn", "goog.i18n.DateTimeSymbols_tzm_Latn_MA", "goog.i18n.DateTimeSymbols_uk_UA", "goog.i18n.DateTimeSymbols_ur_IN", "goog.i18n.DateTimeSymbols_ur_PK", "goog.i18n.DateTimeSymbols_uz", "goog.i18n.DateTimeSymbols_uz_Arab", "goog.i18n.DateTimeSymbols_uz_Arab_AF", "goog.i18n.DateTimeSymbols_uz_Cyrl", "goog.i18n.DateTimeSymbols_uz_Cyrl_UZ", "goog.i18n.DateTimeSymbols_uz_Latn", "goog.i18n.DateTimeSymbols_uz_Latn_UZ", "goog.i18n.DateTimeSymbols_vai", 
"goog.i18n.DateTimeSymbols_vai_Latn", "goog.i18n.DateTimeSymbols_vai_Latn_LR", "goog.i18n.DateTimeSymbols_vai_Vaii", "goog.i18n.DateTimeSymbols_vai_Vaii_LR", "goog.i18n.DateTimeSymbols_ve", "goog.i18n.DateTimeSymbols_ve_ZA", "goog.i18n.DateTimeSymbols_vi_VN", "goog.i18n.DateTimeSymbols_vun", "goog.i18n.DateTimeSymbols_vun_TZ", "goog.i18n.DateTimeSymbols_wae", "goog.i18n.DateTimeSymbols_wae_CH", "goog.i18n.DateTimeSymbols_wal", "goog.i18n.DateTimeSymbols_wal_ET", "goog.i18n.DateTimeSymbols_xh", "goog.i18n.DateTimeSymbols_xh_ZA", 
"goog.i18n.DateTimeSymbols_xog", "goog.i18n.DateTimeSymbols_xog_UG", "goog.i18n.DateTimeSymbols_yav", "goog.i18n.DateTimeSymbols_yav_CM", "goog.i18n.DateTimeSymbols_yo", "goog.i18n.DateTimeSymbols_yo_NG", "goog.i18n.DateTimeSymbols_zh_Hans", "goog.i18n.DateTimeSymbols_zh_Hans_CN", "goog.i18n.DateTimeSymbols_zh_Hans_HK", "goog.i18n.DateTimeSymbols_zh_Hans_MO", "goog.i18n.DateTimeSymbols_zh_Hans_SG", "goog.i18n.DateTimeSymbols_zh_Hant", "goog.i18n.DateTimeSymbols_zh_Hant_HK", "goog.i18n.DateTimeSymbols_zh_Hant_MO", 
"goog.i18n.DateTimeSymbols_zh_Hant_TW", "goog.i18n.DateTimeSymbols_zu_ZA"], ["goog.i18n.DateTimeSymbols"]);
goog.addDependency("i18n/graphemebreak.js", ["goog.i18n.GraphemeBreak"], ["goog.structs.InversionMap"]);
goog.addDependency("i18n/messageformat.js", ["goog.i18n.MessageFormat"], ["goog.asserts", "goog.i18n.NumberFormat", "goog.i18n.ordinalRules", "goog.i18n.pluralRules"]);
goog.addDependency("i18n/mime.js", ["goog.i18n.mime", "goog.i18n.mime.encode"], []);
goog.addDependency("i18n/numberformat.js", ["goog.i18n.NumberFormat", "goog.i18n.NumberFormat.CurrencyStyle", "goog.i18n.NumberFormat.Format"], ["goog.i18n.NumberFormatSymbols", "goog.i18n.currency"]);
goog.addDependency("i18n/numberformatsymbols.js", ["goog.i18n.NumberFormatSymbols", "goog.i18n.NumberFormatSymbols_af", "goog.i18n.NumberFormatSymbols_af_ZA", "goog.i18n.NumberFormatSymbols_am", "goog.i18n.NumberFormatSymbols_am_ET", "goog.i18n.NumberFormatSymbols_ar", "goog.i18n.NumberFormatSymbols_ar_001", "goog.i18n.NumberFormatSymbols_ar_EG", "goog.i18n.NumberFormatSymbols_bg", "goog.i18n.NumberFormatSymbols_bg_BG", "goog.i18n.NumberFormatSymbols_bn", "goog.i18n.NumberFormatSymbols_bn_BD", "goog.i18n.NumberFormatSymbols_ca", 
"goog.i18n.NumberFormatSymbols_ca_ES", "goog.i18n.NumberFormatSymbols_chr", "goog.i18n.NumberFormatSymbols_chr_US", "goog.i18n.NumberFormatSymbols_cs", "goog.i18n.NumberFormatSymbols_cs_CZ", "goog.i18n.NumberFormatSymbols_cy", "goog.i18n.NumberFormatSymbols_cy_GB", "goog.i18n.NumberFormatSymbols_da", "goog.i18n.NumberFormatSymbols_da_DK", "goog.i18n.NumberFormatSymbols_de", "goog.i18n.NumberFormatSymbols_de_AT", "goog.i18n.NumberFormatSymbols_de_BE", "goog.i18n.NumberFormatSymbols_de_CH", "goog.i18n.NumberFormatSymbols_de_DE", 
"goog.i18n.NumberFormatSymbols_de_LU", "goog.i18n.NumberFormatSymbols_el", "goog.i18n.NumberFormatSymbols_el_GR", "goog.i18n.NumberFormatSymbols_en", "goog.i18n.NumberFormatSymbols_en_AS", "goog.i18n.NumberFormatSymbols_en_AU", "goog.i18n.NumberFormatSymbols_en_Dsrt", "goog.i18n.NumberFormatSymbols_en_Dsrt_US", "goog.i18n.NumberFormatSymbols_en_GB", "goog.i18n.NumberFormatSymbols_en_GU", "goog.i18n.NumberFormatSymbols_en_IE", "goog.i18n.NumberFormatSymbols_en_IN", "goog.i18n.NumberFormatSymbols_en_MH", 
"goog.i18n.NumberFormatSymbols_en_MP", "goog.i18n.NumberFormatSymbols_en_SG", "goog.i18n.NumberFormatSymbols_en_UM", "goog.i18n.NumberFormatSymbols_en_US", "goog.i18n.NumberFormatSymbols_en_VI", "goog.i18n.NumberFormatSymbols_en_ZA", "goog.i18n.NumberFormatSymbols_es", "goog.i18n.NumberFormatSymbols_es_419", "goog.i18n.NumberFormatSymbols_es_ES", "goog.i18n.NumberFormatSymbols_et", "goog.i18n.NumberFormatSymbols_et_EE", "goog.i18n.NumberFormatSymbols_eu", "goog.i18n.NumberFormatSymbols_eu_ES", "goog.i18n.NumberFormatSymbols_fa", 
"goog.i18n.NumberFormatSymbols_fa_IR", "goog.i18n.NumberFormatSymbols_fi", "goog.i18n.NumberFormatSymbols_fi_FI", "goog.i18n.NumberFormatSymbols_fil", "goog.i18n.NumberFormatSymbols_fil_PH", "goog.i18n.NumberFormatSymbols_fr", "goog.i18n.NumberFormatSymbols_fr_BL", "goog.i18n.NumberFormatSymbols_fr_CA", "goog.i18n.NumberFormatSymbols_fr_FR", "goog.i18n.NumberFormatSymbols_fr_GF", "goog.i18n.NumberFormatSymbols_fr_GP", "goog.i18n.NumberFormatSymbols_fr_MC", "goog.i18n.NumberFormatSymbols_fr_MF", "goog.i18n.NumberFormatSymbols_fr_MQ", 
"goog.i18n.NumberFormatSymbols_fr_RE", "goog.i18n.NumberFormatSymbols_fr_YT", "goog.i18n.NumberFormatSymbols_gl", "goog.i18n.NumberFormatSymbols_gl_ES", "goog.i18n.NumberFormatSymbols_gsw", "goog.i18n.NumberFormatSymbols_gsw_CH", "goog.i18n.NumberFormatSymbols_gu", "goog.i18n.NumberFormatSymbols_gu_IN", "goog.i18n.NumberFormatSymbols_haw", "goog.i18n.NumberFormatSymbols_haw_US", "goog.i18n.NumberFormatSymbols_he", "goog.i18n.NumberFormatSymbols_he_IL", "goog.i18n.NumberFormatSymbols_hi", "goog.i18n.NumberFormatSymbols_hi_IN", 
"goog.i18n.NumberFormatSymbols_hr", "goog.i18n.NumberFormatSymbols_hr_HR", "goog.i18n.NumberFormatSymbols_hu", "goog.i18n.NumberFormatSymbols_hu_HU", "goog.i18n.NumberFormatSymbols_id", "goog.i18n.NumberFormatSymbols_id_ID", "goog.i18n.NumberFormatSymbols_in", "goog.i18n.NumberFormatSymbols_is", "goog.i18n.NumberFormatSymbols_is_IS", "goog.i18n.NumberFormatSymbols_it", "goog.i18n.NumberFormatSymbols_it_IT", "goog.i18n.NumberFormatSymbols_iw", "goog.i18n.NumberFormatSymbols_ja", "goog.i18n.NumberFormatSymbols_ja_JP", 
"goog.i18n.NumberFormatSymbols_kn", "goog.i18n.NumberFormatSymbols_kn_IN", "goog.i18n.NumberFormatSymbols_ko", "goog.i18n.NumberFormatSymbols_ko_KR", "goog.i18n.NumberFormatSymbols_ln", "goog.i18n.NumberFormatSymbols_ln_CD", "goog.i18n.NumberFormatSymbols_lt", "goog.i18n.NumberFormatSymbols_lt_LT", "goog.i18n.NumberFormatSymbols_lv", "goog.i18n.NumberFormatSymbols_lv_LV", "goog.i18n.NumberFormatSymbols_ml", "goog.i18n.NumberFormatSymbols_ml_IN", "goog.i18n.NumberFormatSymbols_mr", "goog.i18n.NumberFormatSymbols_mr_IN", 
"goog.i18n.NumberFormatSymbols_ms", "goog.i18n.NumberFormatSymbols_ms_MY", "goog.i18n.NumberFormatSymbols_mt", "goog.i18n.NumberFormatSymbols_mt_MT", "goog.i18n.NumberFormatSymbols_nl", "goog.i18n.NumberFormatSymbols_nl_NL", "goog.i18n.NumberFormatSymbols_no", "goog.i18n.NumberFormatSymbols_or", "goog.i18n.NumberFormatSymbols_or_IN", "goog.i18n.NumberFormatSymbols_pl", "goog.i18n.NumberFormatSymbols_pl_PL", "goog.i18n.NumberFormatSymbols_pt", "goog.i18n.NumberFormatSymbols_pt_BR", "goog.i18n.NumberFormatSymbols_pt_PT", 
"goog.i18n.NumberFormatSymbols_ro", "goog.i18n.NumberFormatSymbols_ro_RO", "goog.i18n.NumberFormatSymbols_ru", "goog.i18n.NumberFormatSymbols_ru_RU", "goog.i18n.NumberFormatSymbols_sk", "goog.i18n.NumberFormatSymbols_sk_SK", "goog.i18n.NumberFormatSymbols_sl", "goog.i18n.NumberFormatSymbols_sl_SI", "goog.i18n.NumberFormatSymbols_sq", "goog.i18n.NumberFormatSymbols_sq_AL", "goog.i18n.NumberFormatSymbols_sr", "goog.i18n.NumberFormatSymbols_sr_Cyrl_RS", "goog.i18n.NumberFormatSymbols_sr_Latn_RS", "goog.i18n.NumberFormatSymbols_sv", 
"goog.i18n.NumberFormatSymbols_sv_SE", "goog.i18n.NumberFormatSymbols_sw", "goog.i18n.NumberFormatSymbols_sw_TZ", "goog.i18n.NumberFormatSymbols_ta", "goog.i18n.NumberFormatSymbols_ta_IN", "goog.i18n.NumberFormatSymbols_te", "goog.i18n.NumberFormatSymbols_te_IN", "goog.i18n.NumberFormatSymbols_th", "goog.i18n.NumberFormatSymbols_th_TH", "goog.i18n.NumberFormatSymbols_tl", "goog.i18n.NumberFormatSymbols_tr", "goog.i18n.NumberFormatSymbols_tr_TR", "goog.i18n.NumberFormatSymbols_uk", "goog.i18n.NumberFormatSymbols_uk_UA", 
"goog.i18n.NumberFormatSymbols_ur", "goog.i18n.NumberFormatSymbols_ur_PK", "goog.i18n.NumberFormatSymbols_vi", "goog.i18n.NumberFormatSymbols_vi_VN", "goog.i18n.NumberFormatSymbols_zh", "goog.i18n.NumberFormatSymbols_zh_CN", "goog.i18n.NumberFormatSymbols_zh_HK", "goog.i18n.NumberFormatSymbols_zh_Hans", "goog.i18n.NumberFormatSymbols_zh_Hans_CN", "goog.i18n.NumberFormatSymbols_zh_TW", "goog.i18n.NumberFormatSymbols_zu", "goog.i18n.NumberFormatSymbols_zu_ZA"], []);
goog.addDependency("i18n/numberformatsymbolsext.js", ["goog.i18n.NumberFormatSymbolsExt", "goog.i18n.NumberFormatSymbols_aa", "goog.i18n.NumberFormatSymbols_aa_DJ", "goog.i18n.NumberFormatSymbols_aa_ER", "goog.i18n.NumberFormatSymbols_aa_ET", "goog.i18n.NumberFormatSymbols_af_NA", "goog.i18n.NumberFormatSymbols_agq", "goog.i18n.NumberFormatSymbols_agq_CM", "goog.i18n.NumberFormatSymbols_ak", "goog.i18n.NumberFormatSymbols_ak_GH", "goog.i18n.NumberFormatSymbols_ar_AE", "goog.i18n.NumberFormatSymbols_ar_BH", 
"goog.i18n.NumberFormatSymbols_ar_DZ", "goog.i18n.NumberFormatSymbols_ar_IQ", "goog.i18n.NumberFormatSymbols_ar_JO", "goog.i18n.NumberFormatSymbols_ar_KW", "goog.i18n.NumberFormatSymbols_ar_LB", "goog.i18n.NumberFormatSymbols_ar_LY", "goog.i18n.NumberFormatSymbols_ar_MA", "goog.i18n.NumberFormatSymbols_ar_OM", "goog.i18n.NumberFormatSymbols_ar_QA", "goog.i18n.NumberFormatSymbols_ar_SA", "goog.i18n.NumberFormatSymbols_ar_SD", "goog.i18n.NumberFormatSymbols_ar_SY", "goog.i18n.NumberFormatSymbols_ar_TN", 
"goog.i18n.NumberFormatSymbols_ar_YE", "goog.i18n.NumberFormatSymbols_as", "goog.i18n.NumberFormatSymbols_as_IN", "goog.i18n.NumberFormatSymbols_asa", "goog.i18n.NumberFormatSymbols_asa_TZ", "goog.i18n.NumberFormatSymbols_az", "goog.i18n.NumberFormatSymbols_az_Cyrl", "goog.i18n.NumberFormatSymbols_az_Cyrl_AZ", "goog.i18n.NumberFormatSymbols_az_Latn", "goog.i18n.NumberFormatSymbols_az_Latn_AZ", "goog.i18n.NumberFormatSymbols_bas", "goog.i18n.NumberFormatSymbols_bas_CM", "goog.i18n.NumberFormatSymbols_be", 
"goog.i18n.NumberFormatSymbols_be_BY", "goog.i18n.NumberFormatSymbols_bem", "goog.i18n.NumberFormatSymbols_bem_ZM", "goog.i18n.NumberFormatSymbols_bez", "goog.i18n.NumberFormatSymbols_bez_TZ", "goog.i18n.NumberFormatSymbols_bm", "goog.i18n.NumberFormatSymbols_bm_ML", "goog.i18n.NumberFormatSymbols_bn_IN", "goog.i18n.NumberFormatSymbols_bo", "goog.i18n.NumberFormatSymbols_bo_CN", "goog.i18n.NumberFormatSymbols_bo_IN", "goog.i18n.NumberFormatSymbols_br", "goog.i18n.NumberFormatSymbols_br_FR", "goog.i18n.NumberFormatSymbols_brx", 
"goog.i18n.NumberFormatSymbols_brx_IN", "goog.i18n.NumberFormatSymbols_bs", "goog.i18n.NumberFormatSymbols_bs_BA", "goog.i18n.NumberFormatSymbols_byn", "goog.i18n.NumberFormatSymbols_byn_ER", "goog.i18n.NumberFormatSymbols_cgg", "goog.i18n.NumberFormatSymbols_cgg_UG", "goog.i18n.NumberFormatSymbols_ckb", "goog.i18n.NumberFormatSymbols_ckb_Arab", "goog.i18n.NumberFormatSymbols_ckb_Arab_IQ", "goog.i18n.NumberFormatSymbols_ckb_Arab_IR", "goog.i18n.NumberFormatSymbols_ckb_IQ", "goog.i18n.NumberFormatSymbols_ckb_IR", 
"goog.i18n.NumberFormatSymbols_ckb_Latn", "goog.i18n.NumberFormatSymbols_ckb_Latn_IQ", "goog.i18n.NumberFormatSymbols_dav", "goog.i18n.NumberFormatSymbols_dav_KE", "goog.i18n.NumberFormatSymbols_de_LI", "goog.i18n.NumberFormatSymbols_dje", "goog.i18n.NumberFormatSymbols_dje_NE", "goog.i18n.NumberFormatSymbols_dua", "goog.i18n.NumberFormatSymbols_dua_CM", "goog.i18n.NumberFormatSymbols_dyo", "goog.i18n.NumberFormatSymbols_dyo_SN", "goog.i18n.NumberFormatSymbols_dz", "goog.i18n.NumberFormatSymbols_dz_BT", 
"goog.i18n.NumberFormatSymbols_ebu", "goog.i18n.NumberFormatSymbols_ebu_KE", "goog.i18n.NumberFormatSymbols_ee", "goog.i18n.NumberFormatSymbols_ee_GH", "goog.i18n.NumberFormatSymbols_ee_TG", "goog.i18n.NumberFormatSymbols_el_CY", "goog.i18n.NumberFormatSymbols_en_BB", "goog.i18n.NumberFormatSymbols_en_BE", "goog.i18n.NumberFormatSymbols_en_BM", "goog.i18n.NumberFormatSymbols_en_BW", "goog.i18n.NumberFormatSymbols_en_BZ", "goog.i18n.NumberFormatSymbols_en_CA", "goog.i18n.NumberFormatSymbols_en_GY", 
"goog.i18n.NumberFormatSymbols_en_HK", "goog.i18n.NumberFormatSymbols_en_JM", "goog.i18n.NumberFormatSymbols_en_MT", "goog.i18n.NumberFormatSymbols_en_MU", "goog.i18n.NumberFormatSymbols_en_NA", "goog.i18n.NumberFormatSymbols_en_NZ", "goog.i18n.NumberFormatSymbols_en_PH", "goog.i18n.NumberFormatSymbols_en_PK", "goog.i18n.NumberFormatSymbols_en_TT", "goog.i18n.NumberFormatSymbols_en_ZW", "goog.i18n.NumberFormatSymbols_eo", "goog.i18n.NumberFormatSymbols_es_AR", "goog.i18n.NumberFormatSymbols_es_BO", 
"goog.i18n.NumberFormatSymbols_es_CL", "goog.i18n.NumberFormatSymbols_es_CO", "goog.i18n.NumberFormatSymbols_es_CR", "goog.i18n.NumberFormatSymbols_es_DO", "goog.i18n.NumberFormatSymbols_es_EC", "goog.i18n.NumberFormatSymbols_es_GQ", "goog.i18n.NumberFormatSymbols_es_GT", "goog.i18n.NumberFormatSymbols_es_HN", "goog.i18n.NumberFormatSymbols_es_MX", "goog.i18n.NumberFormatSymbols_es_NI", "goog.i18n.NumberFormatSymbols_es_PA", "goog.i18n.NumberFormatSymbols_es_PE", "goog.i18n.NumberFormatSymbols_es_PR", 
"goog.i18n.NumberFormatSymbols_es_PY", "goog.i18n.NumberFormatSymbols_es_SV", "goog.i18n.NumberFormatSymbols_es_US", "goog.i18n.NumberFormatSymbols_es_UY", "goog.i18n.NumberFormatSymbols_es_VE", "goog.i18n.NumberFormatSymbols_ewo", "goog.i18n.NumberFormatSymbols_ewo_CM", "goog.i18n.NumberFormatSymbols_fa_AF", "goog.i18n.NumberFormatSymbols_ff", "goog.i18n.NumberFormatSymbols_ff_SN", "goog.i18n.NumberFormatSymbols_fo", "goog.i18n.NumberFormatSymbols_fo_FO", "goog.i18n.NumberFormatSymbols_fr_BE", "goog.i18n.NumberFormatSymbols_fr_BF", 
"goog.i18n.NumberFormatSymbols_fr_BI", "goog.i18n.NumberFormatSymbols_fr_BJ", "goog.i18n.NumberFormatSymbols_fr_CD", "goog.i18n.NumberFormatSymbols_fr_CF", "goog.i18n.NumberFormatSymbols_fr_CG", "goog.i18n.NumberFormatSymbols_fr_CH", "goog.i18n.NumberFormatSymbols_fr_CI", "goog.i18n.NumberFormatSymbols_fr_CM", "goog.i18n.NumberFormatSymbols_fr_DJ", "goog.i18n.NumberFormatSymbols_fr_GA", "goog.i18n.NumberFormatSymbols_fr_GN", "goog.i18n.NumberFormatSymbols_fr_GQ", "goog.i18n.NumberFormatSymbols_fr_KM", 
"goog.i18n.NumberFormatSymbols_fr_LU", "goog.i18n.NumberFormatSymbols_fr_MG", "goog.i18n.NumberFormatSymbols_fr_ML", "goog.i18n.NumberFormatSymbols_fr_NE", "goog.i18n.NumberFormatSymbols_fr_RW", "goog.i18n.NumberFormatSymbols_fr_SN", "goog.i18n.NumberFormatSymbols_fr_TD", "goog.i18n.NumberFormatSymbols_fr_TG", "goog.i18n.NumberFormatSymbols_fur", "goog.i18n.NumberFormatSymbols_fur_IT", "goog.i18n.NumberFormatSymbols_ga", "goog.i18n.NumberFormatSymbols_ga_IE", "goog.i18n.NumberFormatSymbols_gd", "goog.i18n.NumberFormatSymbols_gd_GB", 
"goog.i18n.NumberFormatSymbols_guz", "goog.i18n.NumberFormatSymbols_guz_KE", "goog.i18n.NumberFormatSymbols_gv", "goog.i18n.NumberFormatSymbols_gv_GB", "goog.i18n.NumberFormatSymbols_ha", "goog.i18n.NumberFormatSymbols_ha_Latn", "goog.i18n.NumberFormatSymbols_ha_Latn_GH", "goog.i18n.NumberFormatSymbols_ha_Latn_NE", "goog.i18n.NumberFormatSymbols_ha_Latn_NG", "goog.i18n.NumberFormatSymbols_hy", "goog.i18n.NumberFormatSymbols_hy_AM", "goog.i18n.NumberFormatSymbols_ia", "goog.i18n.NumberFormatSymbols_ig", 
"goog.i18n.NumberFormatSymbols_ig_NG", "goog.i18n.NumberFormatSymbols_ii", "goog.i18n.NumberFormatSymbols_ii_CN", "goog.i18n.NumberFormatSymbols_it_CH", "goog.i18n.NumberFormatSymbols_jmc", "goog.i18n.NumberFormatSymbols_jmc_TZ", "goog.i18n.NumberFormatSymbols_ka", "goog.i18n.NumberFormatSymbols_ka_GE", "goog.i18n.NumberFormatSymbols_kab", "goog.i18n.NumberFormatSymbols_kab_DZ", "goog.i18n.NumberFormatSymbols_kam", "goog.i18n.NumberFormatSymbols_kam_KE", "goog.i18n.NumberFormatSymbols_kde", "goog.i18n.NumberFormatSymbols_kde_TZ", 
"goog.i18n.NumberFormatSymbols_kea", "goog.i18n.NumberFormatSymbols_kea_CV", "goog.i18n.NumberFormatSymbols_khq", "goog.i18n.NumberFormatSymbols_khq_ML", "goog.i18n.NumberFormatSymbols_ki", "goog.i18n.NumberFormatSymbols_ki_KE", "goog.i18n.NumberFormatSymbols_kk", "goog.i18n.NumberFormatSymbols_kk_Cyrl", "goog.i18n.NumberFormatSymbols_kk_Cyrl_KZ", "goog.i18n.NumberFormatSymbols_kl", "goog.i18n.NumberFormatSymbols_kl_GL", "goog.i18n.NumberFormatSymbols_kln", "goog.i18n.NumberFormatSymbols_kln_KE", 
"goog.i18n.NumberFormatSymbols_km", "goog.i18n.NumberFormatSymbols_km_KH", "goog.i18n.NumberFormatSymbols_kok", "goog.i18n.NumberFormatSymbols_kok_IN", "goog.i18n.NumberFormatSymbols_ksb", "goog.i18n.NumberFormatSymbols_ksb_TZ", "goog.i18n.NumberFormatSymbols_ksf", "goog.i18n.NumberFormatSymbols_ksf_CM", "goog.i18n.NumberFormatSymbols_ksh", "goog.i18n.NumberFormatSymbols_ksh_DE", "goog.i18n.NumberFormatSymbols_ku", "goog.i18n.NumberFormatSymbols_kw", "goog.i18n.NumberFormatSymbols_kw_GB", "goog.i18n.NumberFormatSymbols_lag", 
"goog.i18n.NumberFormatSymbols_lag_TZ", "goog.i18n.NumberFormatSymbols_lg", "goog.i18n.NumberFormatSymbols_lg_UG", "goog.i18n.NumberFormatSymbols_ln_CG", "goog.i18n.NumberFormatSymbols_lo", "goog.i18n.NumberFormatSymbols_lo_LA", "goog.i18n.NumberFormatSymbols_lu", "goog.i18n.NumberFormatSymbols_lu_CD", "goog.i18n.NumberFormatSymbols_luo", "goog.i18n.NumberFormatSymbols_luo_KE", "goog.i18n.NumberFormatSymbols_luy", "goog.i18n.NumberFormatSymbols_luy_KE", "goog.i18n.NumberFormatSymbols_mas", "goog.i18n.NumberFormatSymbols_mas_KE", 
"goog.i18n.NumberFormatSymbols_mas_TZ", "goog.i18n.NumberFormatSymbols_mer", "goog.i18n.NumberFormatSymbols_mer_KE", "goog.i18n.NumberFormatSymbols_mfe", "goog.i18n.NumberFormatSymbols_mfe_MU", "goog.i18n.NumberFormatSymbols_mg", "goog.i18n.NumberFormatSymbols_mg_MG", "goog.i18n.NumberFormatSymbols_mgh", "goog.i18n.NumberFormatSymbols_mgh_MZ", "goog.i18n.NumberFormatSymbols_mk", "goog.i18n.NumberFormatSymbols_mk_MK", "goog.i18n.NumberFormatSymbols_ms_BN", "goog.i18n.NumberFormatSymbols_mua", "goog.i18n.NumberFormatSymbols_mua_CM", 
"goog.i18n.NumberFormatSymbols_my", "goog.i18n.NumberFormatSymbols_my_MM", "goog.i18n.NumberFormatSymbols_naq", "goog.i18n.NumberFormatSymbols_naq_NA", "goog.i18n.NumberFormatSymbols_nb", "goog.i18n.NumberFormatSymbols_nb_NO", "goog.i18n.NumberFormatSymbols_nd", "goog.i18n.NumberFormatSymbols_nd_ZW", "goog.i18n.NumberFormatSymbols_ne", "goog.i18n.NumberFormatSymbols_ne_IN", "goog.i18n.NumberFormatSymbols_ne_NP", "goog.i18n.NumberFormatSymbols_nl_AW", "goog.i18n.NumberFormatSymbols_nl_BE", "goog.i18n.NumberFormatSymbols_nl_CW", 
"goog.i18n.NumberFormatSymbols_nl_SX", "goog.i18n.NumberFormatSymbols_nmg", "goog.i18n.NumberFormatSymbols_nmg_CM", "goog.i18n.NumberFormatSymbols_nn", "goog.i18n.NumberFormatSymbols_nn_NO", "goog.i18n.NumberFormatSymbols_nr", "goog.i18n.NumberFormatSymbols_nr_ZA", "goog.i18n.NumberFormatSymbols_nso", "goog.i18n.NumberFormatSymbols_nso_ZA", "goog.i18n.NumberFormatSymbols_nus", "goog.i18n.NumberFormatSymbols_nus_SD", "goog.i18n.NumberFormatSymbols_nyn", "goog.i18n.NumberFormatSymbols_nyn_UG", "goog.i18n.NumberFormatSymbols_om", 
"goog.i18n.NumberFormatSymbols_om_ET", "goog.i18n.NumberFormatSymbols_om_KE", "goog.i18n.NumberFormatSymbols_pa", "goog.i18n.NumberFormatSymbols_pa_Arab", "goog.i18n.NumberFormatSymbols_pa_Arab_PK", "goog.i18n.NumberFormatSymbols_pa_Guru", "goog.i18n.NumberFormatSymbols_pa_Guru_IN", "goog.i18n.NumberFormatSymbols_ps", "goog.i18n.NumberFormatSymbols_ps_AF", "goog.i18n.NumberFormatSymbols_pt_AO", "goog.i18n.NumberFormatSymbols_pt_GW", "goog.i18n.NumberFormatSymbols_pt_MZ", "goog.i18n.NumberFormatSymbols_pt_ST", 
"goog.i18n.NumberFormatSymbols_rm", "goog.i18n.NumberFormatSymbols_rm_CH", "goog.i18n.NumberFormatSymbols_rn", "goog.i18n.NumberFormatSymbols_rn_BI", "goog.i18n.NumberFormatSymbols_ro_MD", "goog.i18n.NumberFormatSymbols_rof", "goog.i18n.NumberFormatSymbols_rof_TZ", "goog.i18n.NumberFormatSymbols_ru_MD", "goog.i18n.NumberFormatSymbols_ru_UA", "goog.i18n.NumberFormatSymbols_rw", "goog.i18n.NumberFormatSymbols_rw_RW", "goog.i18n.NumberFormatSymbols_rwk", "goog.i18n.NumberFormatSymbols_rwk_TZ", "goog.i18n.NumberFormatSymbols_sah", 
"goog.i18n.NumberFormatSymbols_sah_RU", "goog.i18n.NumberFormatSymbols_saq", "goog.i18n.NumberFormatSymbols_saq_KE", "goog.i18n.NumberFormatSymbols_sbp", "goog.i18n.NumberFormatSymbols_sbp_TZ", "goog.i18n.NumberFormatSymbols_se", "goog.i18n.NumberFormatSymbols_se_FI", "goog.i18n.NumberFormatSymbols_se_NO", "goog.i18n.NumberFormatSymbols_seh", "goog.i18n.NumberFormatSymbols_seh_MZ", "goog.i18n.NumberFormatSymbols_ses", "goog.i18n.NumberFormatSymbols_ses_ML", "goog.i18n.NumberFormatSymbols_sg", "goog.i18n.NumberFormatSymbols_sg_CF", 
"goog.i18n.NumberFormatSymbols_shi", "goog.i18n.NumberFormatSymbols_shi_Latn", "goog.i18n.NumberFormatSymbols_shi_Latn_MA", "goog.i18n.NumberFormatSymbols_shi_Tfng", "goog.i18n.NumberFormatSymbols_shi_Tfng_MA", "goog.i18n.NumberFormatSymbols_si", "goog.i18n.NumberFormatSymbols_si_LK", "goog.i18n.NumberFormatSymbols_sn", "goog.i18n.NumberFormatSymbols_sn_ZW", "goog.i18n.NumberFormatSymbols_so", "goog.i18n.NumberFormatSymbols_so_DJ", "goog.i18n.NumberFormatSymbols_so_ET", "goog.i18n.NumberFormatSymbols_so_KE", 
"goog.i18n.NumberFormatSymbols_so_SO", "goog.i18n.NumberFormatSymbols_sr_Cyrl", "goog.i18n.NumberFormatSymbols_sr_Cyrl_BA", "goog.i18n.NumberFormatSymbols_sr_Cyrl_ME", "goog.i18n.NumberFormatSymbols_sr_Latn", "goog.i18n.NumberFormatSymbols_sr_Latn_BA", "goog.i18n.NumberFormatSymbols_sr_Latn_ME", "goog.i18n.NumberFormatSymbols_ss", "goog.i18n.NumberFormatSymbols_ss_SZ", "goog.i18n.NumberFormatSymbols_ss_ZA", "goog.i18n.NumberFormatSymbols_ssy", "goog.i18n.NumberFormatSymbols_ssy_ER", "goog.i18n.NumberFormatSymbols_st", 
"goog.i18n.NumberFormatSymbols_st_LS", "goog.i18n.NumberFormatSymbols_st_ZA", "goog.i18n.NumberFormatSymbols_sv_FI", "goog.i18n.NumberFormatSymbols_sw_KE", "goog.i18n.NumberFormatSymbols_swc", "goog.i18n.NumberFormatSymbols_swc_CD", "goog.i18n.NumberFormatSymbols_ta_LK", "goog.i18n.NumberFormatSymbols_teo", "goog.i18n.NumberFormatSymbols_teo_KE", "goog.i18n.NumberFormatSymbols_teo_UG", "goog.i18n.NumberFormatSymbols_tg", "goog.i18n.NumberFormatSymbols_tg_Cyrl", "goog.i18n.NumberFormatSymbols_tg_Cyrl_TJ", 
"goog.i18n.NumberFormatSymbols_ti", "goog.i18n.NumberFormatSymbols_ti_ER", "goog.i18n.NumberFormatSymbols_ti_ET", "goog.i18n.NumberFormatSymbols_tig", "goog.i18n.NumberFormatSymbols_tig_ER", "goog.i18n.NumberFormatSymbols_tn", "goog.i18n.NumberFormatSymbols_tn_ZA", "goog.i18n.NumberFormatSymbols_to", "goog.i18n.NumberFormatSymbols_to_TO", "goog.i18n.NumberFormatSymbols_ts", "goog.i18n.NumberFormatSymbols_ts_ZA", "goog.i18n.NumberFormatSymbols_twq", "goog.i18n.NumberFormatSymbols_twq_NE", "goog.i18n.NumberFormatSymbols_tzm", 
"goog.i18n.NumberFormatSymbols_tzm_Latn", "goog.i18n.NumberFormatSymbols_tzm_Latn_MA", "goog.i18n.NumberFormatSymbols_ur_IN", "goog.i18n.NumberFormatSymbols_uz", "goog.i18n.NumberFormatSymbols_uz_Arab", "goog.i18n.NumberFormatSymbols_uz_Arab_AF", "goog.i18n.NumberFormatSymbols_uz_Cyrl", "goog.i18n.NumberFormatSymbols_uz_Cyrl_UZ", "goog.i18n.NumberFormatSymbols_uz_Latn", "goog.i18n.NumberFormatSymbols_uz_Latn_UZ", "goog.i18n.NumberFormatSymbols_vai", "goog.i18n.NumberFormatSymbols_vai_Latn", "goog.i18n.NumberFormatSymbols_vai_Latn_LR", 
"goog.i18n.NumberFormatSymbols_vai_Vaii", "goog.i18n.NumberFormatSymbols_vai_Vaii_LR", "goog.i18n.NumberFormatSymbols_ve", "goog.i18n.NumberFormatSymbols_ve_ZA", "goog.i18n.NumberFormatSymbols_vun", "goog.i18n.NumberFormatSymbols_vun_TZ", "goog.i18n.NumberFormatSymbols_wae", "goog.i18n.NumberFormatSymbols_wae_CH", "goog.i18n.NumberFormatSymbols_wal", "goog.i18n.NumberFormatSymbols_wal_ET", "goog.i18n.NumberFormatSymbols_xh", "goog.i18n.NumberFormatSymbols_xh_ZA", "goog.i18n.NumberFormatSymbols_xog", 
"goog.i18n.NumberFormatSymbols_xog_UG", "goog.i18n.NumberFormatSymbols_yav", "goog.i18n.NumberFormatSymbols_yav_CM", "goog.i18n.NumberFormatSymbols_yo", "goog.i18n.NumberFormatSymbols_yo_NG", "goog.i18n.NumberFormatSymbols_zh_Hans_HK", "goog.i18n.NumberFormatSymbols_zh_Hans_MO", "goog.i18n.NumberFormatSymbols_zh_Hans_SG", "goog.i18n.NumberFormatSymbols_zh_Hant", "goog.i18n.NumberFormatSymbols_zh_Hant_HK", "goog.i18n.NumberFormatSymbols_zh_Hant_MO", "goog.i18n.NumberFormatSymbols_zh_Hant_TW"], ["goog.i18n.NumberFormatSymbols"]);
goog.addDependency("i18n/ordinalrules.js", ["goog.i18n.ordinalRules"], []);
goog.addDependency("i18n/pluralrules.js", ["goog.i18n.pluralRules"], []);
goog.addDependency("i18n/timezone.js", ["goog.i18n.TimeZone"], ["goog.array", "goog.date.DateLike", "goog.string"]);
goog.addDependency("i18n/uchar.js", ["goog.i18n.uChar"], []);
goog.addDependency("i18n/uchar/localnamefetcher.js", ["goog.i18n.uChar.LocalNameFetcher"], ["goog.debug.Logger", "goog.i18n.uChar", "goog.i18n.uChar.NameFetcher"]);
goog.addDependency("i18n/uchar/namefetcher.js", ["goog.i18n.uChar.NameFetcher"], []);
goog.addDependency("i18n/uchar/remotenamefetcher.js", ["goog.i18n.uChar.RemoteNameFetcher"], ["goog.Disposable", "goog.Uri", "goog.debug.Logger", "goog.i18n.uChar", "goog.i18n.uChar.NameFetcher", "goog.net.XhrIo", "goog.structs.Map"]);
goog.addDependency("iter/iter.js", ["goog.iter", "goog.iter.Iterator", "goog.iter.StopIteration"], ["goog.array", "goog.asserts"]);
goog.addDependency("json/evaljsonprocessor.js", ["goog.json.EvalJsonProcessor"], ["goog.json", "goog.json.Processor", "goog.json.Serializer"]);
goog.addDependency("json/json.js", ["goog.json", "goog.json.Serializer"], []);
goog.addDependency("json/nativejsonprocessor.js", ["goog.json.NativeJsonProcessor"], ["goog.asserts", "goog.json", "goog.json.Processor"]);
goog.addDependency("json/processor.js", ["goog.json.Processor"], ["goog.string.Parser", "goog.string.Stringifier"]);
goog.addDependency("labs/mock/mock.js", ["goog.labs.mock"], ["goog.array", "goog.debug.Error", "goog.functions"]);
goog.addDependency("labs/net/image.js", ["goog.labs.net.image"], ["goog.events.EventHandler", "goog.events.EventType", "goog.net.EventType", "goog.result.SimpleResult", "goog.userAgent"]);
goog.addDependency("labs/net/image_test.js", ["goog.labs.net.imageTest"], ["goog.events", "goog.labs.net.image", "goog.result", "goog.result.Result", "goog.string", "goog.testing.AsyncTestCase", "goog.testing.jsunit", "goog.testing.recordFunction"]);
goog.addDependency("labs/net/xhr.js", ["goog.labs.net.xhr", "goog.labs.net.xhr.Error", "goog.labs.net.xhr.HttpError", "goog.labs.net.xhr.TimeoutError"], ["goog.debug.Error", "goog.json", "goog.net.HttpStatus", "goog.net.XmlHttp", "goog.result", "goog.string", "goog.uri.utils"]);
goog.addDependency("labs/object/object.js", ["goog.labs.object"], []);
goog.addDependency("labs/observe/notice.js", ["goog.labs.observe.Notice"], []);
goog.addDependency("labs/observe/observable.js", ["goog.labs.observe.Observable"], ["goog.disposable.IDisposable"]);
goog.addDependency("labs/observe/observableset.js", ["goog.labs.observe.ObservableSet"], ["goog.array", "goog.labs.observe.Observer"]);
goog.addDependency("labs/observe/observationset.js", ["goog.labs.observe.ObservationSet"], ["goog.array", "goog.labs.observe.Observer"]);
goog.addDependency("labs/observe/observer.js", ["goog.labs.observe.Observer"], []);
goog.addDependency("labs/observe/simpleobservable.js", ["goog.labs.observe.SimpleObservable"], ["goog.Disposable", "goog.array", "goog.asserts", "goog.labs.observe.Notice", "goog.labs.observe.Observable", "goog.labs.observe.Observer", "goog.object"]);
goog.addDependency("labs/structs/map.js", ["goog.labs.structs.Map"], ["goog.array", "goog.asserts", "goog.labs.object", "goog.object"]);
goog.addDependency("labs/structs/map_perf.js", ["goog.labs.structs.mapPerf"], ["goog.dom", "goog.labs.structs.Map", "goog.structs.Map", "goog.testing.PerformanceTable", "goog.testing.jsunit"]);
goog.addDependency("labs/structs/multimap.js", ["goog.labs.structs.Multimap"], ["goog.array", "goog.labs.object", "goog.labs.structs.Map"]);
goog.addDependency("labs/testing/assertthat.js", ["goog.labs.testing.MatcherError", "goog.labs.testing.assertThat"], ["goog.asserts", "goog.debug.Error", "goog.labs.testing.Matcher"]);
goog.addDependency("labs/testing/decoratormatcher.js", ["goog.labs.testing.AnythingMatcher"], ["goog.labs.testing.Matcher"]);
goog.addDependency("labs/testing/dictionarymatcher.js", ["goog.labs.testing.HasEntriesMatcher", "goog.labs.testing.HasEntryMatcher", "goog.labs.testing.HasKeyMatcher", "goog.labs.testing.HasValueMatcher"], ["goog.array", "goog.asserts", "goog.labs.testing.Matcher", "goog.string"]);
goog.addDependency("labs/testing/logicmatcher.js", ["goog.labs.testing.AllOfMatcher", "goog.labs.testing.AnyOfMatcher", "goog.labs.testing.IsNotMatcher"], ["goog.array", "goog.labs.testing.Matcher"]);
goog.addDependency("labs/testing/matcher.js", ["goog.labs.testing.Matcher"], []);
goog.addDependency("labs/testing/numbermatcher.js", ["goog.labs.testing.CloseToMatcher", "goog.labs.testing.EqualToMatcher", "goog.labs.testing.GreaterThanEqualToMatcher", "goog.labs.testing.GreaterThanMatcher", "goog.labs.testing.LessThanEqualToMatcher", "goog.labs.testing.LessThanMatcher"], ["goog.asserts", "goog.labs.testing.Matcher"]);
goog.addDependency("labs/testing/objectmatcher.js", ["goog.labs.testing.HasPropertyMatcher", "goog.labs.testing.InstanceOfMatcher", "goog.labs.testing.IsNullMatcher", "goog.labs.testing.IsNullOrUndefinedMatcher", "goog.labs.testing.IsUndefinedMatcher", "goog.labs.testing.ObjectEqualsMatcher"], ["goog.labs.testing.Matcher", "goog.string"]);
goog.addDependency("labs/testing/stringmatcher.js", ["goog.labs.testing.ContainsStringMatcher", "goog.labs.testing.EndsWithMatcher", "goog.labs.testing.EqualToIgnoringCaseMatcher", "goog.labs.testing.EqualToIgnoringWhitespaceMatcher", "goog.labs.testing.EqualsMatcher", "goog.labs.testing.StartsWithMatcher", "goog.labs.testing.StringContainsInOrderMatcher"], ["goog.asserts", "goog.labs.testing.Matcher", "goog.string"]);
goog.addDependency("locale/countries.js", ["goog.locale.countries"], []);
goog.addDependency("locale/defaultlocalenameconstants.js", ["goog.locale.defaultLocaleNameConstants"], []);
goog.addDependency("locale/genericfontnames.js", ["goog.locale.genericFontNames"], []);
goog.addDependency("locale/genericfontnamesdata.js", ["goog.locale.genericFontNamesData"], ["goog.locale"]);
goog.addDependency("locale/locale.js", ["goog.locale"], ["goog.locale.nativeNameConstants"]);
goog.addDependency("locale/nativenameconstants.js", ["goog.locale.nativeNameConstants"], []);
goog.addDependency("locale/scriptToLanguages.js", ["goog.locale.scriptToLanguages"], ["goog.locale"]);
goog.addDependency("locale/timezonedetection.js", ["goog.locale.timeZoneDetection"], ["goog.locale", "goog.locale.TimeZoneFingerprint"]);
goog.addDependency("locale/timezonefingerprint.js", ["goog.locale.TimeZoneFingerprint"], ["goog.locale"]);
goog.addDependency("locale/timezonelist.js", ["goog.locale.TimeZoneList"], ["goog.locale"]);
goog.addDependency("math/bezier.js", ["goog.math.Bezier"], ["goog.math", "goog.math.Coordinate"]);
goog.addDependency("math/box.js", ["goog.math.Box"], ["goog.math.Coordinate"]);
goog.addDependency("math/coordinate.js", ["goog.math.Coordinate"], ["goog.math"]);
goog.addDependency("math/coordinate3.js", ["goog.math.Coordinate3"], []);
goog.addDependency("math/exponentialbackoff.js", ["goog.math.ExponentialBackoff"], ["goog.asserts"]);
goog.addDependency("math/integer.js", ["goog.math.Integer"], []);
goog.addDependency("math/interpolator/interpolator1.js", ["goog.math.interpolator.Interpolator1"], []);
goog.addDependency("math/interpolator/linear1.js", ["goog.math.interpolator.Linear1"], ["goog.array", "goog.math", "goog.math.interpolator.Interpolator1"]);
goog.addDependency("math/interpolator/pchip1.js", ["goog.math.interpolator.Pchip1"], ["goog.math", "goog.math.interpolator.Spline1"]);
goog.addDependency("math/interpolator/spline1.js", ["goog.math.interpolator.Spline1"], ["goog.array", "goog.math", "goog.math.interpolator.Interpolator1", "goog.math.tdma"]);
goog.addDependency("math/line.js", ["goog.math.Line"], ["goog.math", "goog.math.Coordinate"]);
goog.addDependency("math/long.js", ["goog.math.Long"], []);
goog.addDependency("math/math.js", ["goog.math"], ["goog.array"]);
goog.addDependency("math/matrix.js", ["goog.math.Matrix"], ["goog.array", "goog.math", "goog.math.Size"]);
goog.addDependency("math/range.js", ["goog.math.Range"], []);
goog.addDependency("math/rangeset.js", ["goog.math.RangeSet"], ["goog.array", "goog.iter.Iterator", "goog.iter.StopIteration", "goog.math.Range"]);
goog.addDependency("math/rect.js", ["goog.math.Rect"], ["goog.math.Box", "goog.math.Size"]);
goog.addDependency("math/size.js", ["goog.math.Size"], []);
goog.addDependency("math/tdma.js", ["goog.math.tdma"], []);
goog.addDependency("math/vec2.js", ["goog.math.Vec2"], ["goog.math", "goog.math.Coordinate"]);
goog.addDependency("math/vec3.js", ["goog.math.Vec3"], ["goog.math", "goog.math.Coordinate3"]);
goog.addDependency("memoize/memoize.js", ["goog.memoize"], []);
goog.addDependency("messaging/abstractchannel.js", ["goog.messaging.AbstractChannel"], ["goog.Disposable", "goog.debug", "goog.debug.Logger", "goog.json", "goog.messaging.MessageChannel"]);
goog.addDependency("messaging/bufferedchannel.js", ["goog.messaging.BufferedChannel"], ["goog.Timer", "goog.Uri", "goog.debug.Error", "goog.debug.Logger", "goog.events", "goog.messaging.MessageChannel", "goog.messaging.MultiChannel"]);
goog.addDependency("messaging/deferredchannel.js", ["goog.messaging.DeferredChannel"], ["goog.Disposable", "goog.async.Deferred", "goog.messaging.MessageChannel"]);
goog.addDependency("messaging/loggerclient.js", ["goog.messaging.LoggerClient"], ["goog.Disposable", "goog.debug", "goog.debug.LogManager", "goog.debug.Logger"]);
goog.addDependency("messaging/loggerserver.js", ["goog.messaging.LoggerServer"], ["goog.Disposable", "goog.debug.Logger"]);
goog.addDependency("messaging/messagechannel.js", ["goog.messaging.MessageChannel"], []);
goog.addDependency("messaging/messaging.js", ["goog.messaging"], ["goog.messaging.MessageChannel"]);
goog.addDependency("messaging/multichannel.js", ["goog.messaging.MultiChannel", "goog.messaging.MultiChannel.VirtualChannel"], ["goog.Disposable", "goog.debug.Logger", "goog.events.EventHandler", "goog.messaging.MessageChannel", "goog.object"]);
goog.addDependency("messaging/portcaller.js", ["goog.messaging.PortCaller"], ["goog.Disposable", "goog.async.Deferred", "goog.messaging.DeferredChannel", "goog.messaging.PortChannel", "goog.messaging.PortNetwork", "goog.object"]);
goog.addDependency("messaging/portchannel.js", ["goog.messaging.PortChannel"], ["goog.Timer", "goog.array", "goog.async.Deferred", "goog.debug", "goog.debug.Logger", "goog.dom", "goog.dom.DomHelper", "goog.events", "goog.events.EventType", "goog.json", "goog.messaging.AbstractChannel", "goog.messaging.DeferredChannel", "goog.object", "goog.string"]);
goog.addDependency("messaging/portnetwork.js", ["goog.messaging.PortNetwork"], []);
goog.addDependency("messaging/portoperator.js", ["goog.messaging.PortOperator"], ["goog.Disposable", "goog.asserts", "goog.debug.Logger", "goog.messaging.PortChannel", "goog.messaging.PortNetwork", "goog.object"]);
goog.addDependency("messaging/respondingchannel.js", ["goog.messaging.RespondingChannel"], ["goog.Disposable", "goog.debug.Logger", "goog.messaging.MessageChannel", "goog.messaging.MultiChannel", "goog.messaging.MultiChannel.VirtualChannel"]);
goog.addDependency("messaging/testdata/portchannel_worker.js", ["goog.messaging.testdata.portchannel_worker"], ["goog.messaging.PortChannel"]);
goog.addDependency("messaging/testdata/portnetwork_worker1.js", ["goog.messaging.testdata.portnetwork_worker1"], ["goog.messaging.PortCaller", "goog.messaging.PortChannel"]);
goog.addDependency("messaging/testdata/portnetwork_worker2.js", ["goog.messaging.testdata.portnetwork_worker2"], ["goog.messaging.PortCaller", "goog.messaging.PortChannel"]);
goog.addDependency("module/abstractmoduleloader.js", ["goog.module.AbstractModuleLoader"], []);
goog.addDependency("module/basemodule.js", ["goog.module.BaseModule"], ["goog.Disposable"]);
goog.addDependency("module/loader.js", ["goog.module.Loader"], ["goog.Timer", "goog.array", "goog.dom", "goog.object"]);
goog.addDependency("module/module.js", ["goog.module"], ["goog.array", "goog.module.Loader"]);
goog.addDependency("module/moduleinfo.js", ["goog.module.ModuleInfo"], ["goog.Disposable", "goog.functions", "goog.module.BaseModule", "goog.module.ModuleLoadCallback"]);
goog.addDependency("module/moduleloadcallback.js", ["goog.module.ModuleLoadCallback"], ["goog.debug.entryPointRegistry", "goog.debug.errorHandlerWeakDep"]);
goog.addDependency("module/moduleloader.js", ["goog.module.ModuleLoader"], ["goog.Timer", "goog.array", "goog.debug.Logger", "goog.events", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.module.AbstractModuleLoader", "goog.net.BulkLoader", "goog.net.EventType", "goog.net.jsloader"]);
goog.addDependency("module/modulemanager.js", ["goog.module.ModuleManager", "goog.module.ModuleManager.CallbackType", "goog.module.ModuleManager.FailureType"], ["goog.Disposable", "goog.array", "goog.asserts", "goog.async.Deferred", "goog.debug.Logger", "goog.debug.Trace", "goog.module.ModuleInfo", "goog.module.ModuleLoadCallback", "goog.object"]);
goog.addDependency("module/testdata/modA_1.js", ["goog.module.testdata.modA_1"], []);
goog.addDependency("module/testdata/modA_2.js", ["goog.module.testdata.modA_2"], ["goog.module.ModuleManager"]);
goog.addDependency("module/testdata/modB_1.js", ["goog.module.testdata.modB_1"], ["goog.module.ModuleManager"]);
goog.addDependency("net/browserchannel.js", ["goog.net.BrowserChannel", "goog.net.BrowserChannel.Error", "goog.net.BrowserChannel.Event", "goog.net.BrowserChannel.Handler", "goog.net.BrowserChannel.LogSaver", "goog.net.BrowserChannel.QueuedMap", "goog.net.BrowserChannel.ServerReachability", "goog.net.BrowserChannel.ServerReachabilityEvent", "goog.net.BrowserChannel.Stat", "goog.net.BrowserChannel.StatEvent", "goog.net.BrowserChannel.State", "goog.net.BrowserChannel.TimingEvent"], ["goog.Uri", "goog.array", 
"goog.asserts", "goog.debug.Logger", "goog.debug.TextFormatter", "goog.events.Event", "goog.events.EventTarget", "goog.json", "goog.json.EvalJsonProcessor", "goog.net.BrowserTestChannel", "goog.net.ChannelDebug", "goog.net.ChannelRequest", "goog.net.ChannelRequest.Error", "goog.net.XhrIo", "goog.net.tmpnetwork", "goog.string", "goog.structs", "goog.structs.CircularBuffer", "goog.userAgent"]);
goog.addDependency("net/browsertestchannel.js", ["goog.net.BrowserTestChannel"], ["goog.json.EvalJsonProcessor", "goog.net.ChannelRequest", "goog.net.ChannelRequest.Error", "goog.net.tmpnetwork", "goog.string.Parser", "goog.userAgent"]);
goog.addDependency("net/bulkloader.js", ["goog.net.BulkLoader"], ["goog.debug.Logger", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.net.BulkLoaderHelper", "goog.net.EventType", "goog.net.XhrIo"]);
goog.addDependency("net/bulkloaderhelper.js", ["goog.net.BulkLoaderHelper"], ["goog.Disposable", "goog.debug.Logger"]);
goog.addDependency("net/channeldebug.js", ["goog.net.ChannelDebug"], ["goog.debug.Logger", "goog.json"]);
goog.addDependency("net/channelrequest.js", ["goog.net.ChannelRequest", "goog.net.ChannelRequest.Error"], ["goog.Timer", "goog.async.Throttle", "goog.events", "goog.events.EventHandler", "goog.net.EventType", "goog.net.XmlHttp.ReadyState", "goog.object", "goog.userAgent"]);
goog.addDependency("net/cookies.js", ["goog.net.Cookies", "goog.net.cookies"], []);
goog.addDependency("net/crossdomainrpc.js", ["goog.net.CrossDomainRpc"], ["goog.Uri.QueryData", "goog.debug.Logger", "goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.json", "goog.net.EventType", "goog.net.HttpStatus", "goog.userAgent"]);
goog.addDependency("net/errorcode.js", ["goog.net.ErrorCode"], []);
goog.addDependency("net/eventtype.js", ["goog.net.EventType"], []);
goog.addDependency("net/filedownloader.js", ["goog.net.FileDownloader", "goog.net.FileDownloader.Error"], ["goog.Disposable", "goog.asserts", "goog.async.Deferred", "goog.crypt.hash32", "goog.debug.Error", "goog.events.EventHandler", "goog.fs", "goog.fs.DirectoryEntry.Behavior", "goog.fs.Error.ErrorCode", "goog.fs.FileSaver.EventType", "goog.net.EventType", "goog.net.XhrIo.ResponseType", "goog.net.XhrIoPool"]);
goog.addDependency("net/httpstatus.js", ["goog.net.HttpStatus"], []);
goog.addDependency("net/iframeio.js", ["goog.net.IframeIo", "goog.net.IframeIo.IncrementalDataEvent"], ["goog.Timer", "goog.Uri", "goog.debug", "goog.debug.Logger", "goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.json", "goog.net.ErrorCode", "goog.net.EventType", "goog.reflect", "goog.string", "goog.structs", "goog.userAgent"]);
goog.addDependency("net/iframeloadmonitor.js", ["goog.net.IframeLoadMonitor"], ["goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.userAgent"]);
goog.addDependency("net/imageloader.js", ["goog.net.ImageLoader"], ["goog.array", "goog.dom", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.net.EventType", "goog.object", "goog.userAgent"]);
goog.addDependency("net/ipaddress.js", ["goog.net.IpAddress", "goog.net.Ipv4Address", "goog.net.Ipv6Address"], ["goog.array", "goog.math.Integer", "goog.object", "goog.string"]);
goog.addDependency("net/jsloader.js", ["goog.net.jsloader", "goog.net.jsloader.Error"], ["goog.array", "goog.async.Deferred", "goog.debug.Error", "goog.dom", "goog.userAgent"]);
goog.addDependency("net/jsonp.js", ["goog.net.Jsonp"], ["goog.Uri", "goog.dom", "goog.net.jsloader"]);
goog.addDependency("net/mockiframeio.js", ["goog.net.MockIFrameIo"], ["goog.events.EventTarget", "goog.net.ErrorCode", "goog.net.IframeIo", "goog.net.IframeIo.IncrementalDataEvent"]);
goog.addDependency("net/mockxhrlite.js", ["goog.net.MockXhrLite"], ["goog.testing.net.XhrIo"]);
goog.addDependency("net/multiiframeloadmonitor.js", ["goog.net.MultiIframeLoadMonitor"], ["goog.net.IframeLoadMonitor"]);
goog.addDependency("net/networktester.js", ["goog.net.NetworkTester"], ["goog.Timer", "goog.Uri", "goog.debug.Logger"]);
goog.addDependency("net/testdata/jsloader_test1.js", ["goog.net.testdata.jsloader_test1"], []);
goog.addDependency("net/testdata/jsloader_test2.js", ["goog.net.testdata.jsloader_test2"], []);
goog.addDependency("net/testdata/jsloader_test3.js", ["goog.net.testdata.jsloader_test3"], []);
goog.addDependency("net/testdata/jsloader_test4.js", ["goog.net.testdata.jsloader_test4"], []);
goog.addDependency("net/tmpnetwork.js", ["goog.net.tmpnetwork"], ["goog.Uri", "goog.net.ChannelDebug"]);
goog.addDependency("net/websocket.js", ["goog.net.WebSocket", "goog.net.WebSocket.ErrorEvent", "goog.net.WebSocket.EventType", "goog.net.WebSocket.MessageEvent"], ["goog.Timer", "goog.asserts", "goog.debug.Logger", "goog.debug.entryPointRegistry", "goog.events", "goog.events.Event", "goog.events.EventTarget"]);
goog.addDependency("net/wrapperxmlhttpfactory.js", ["goog.net.WrapperXmlHttpFactory"], ["goog.net.XmlHttpFactory"]);
goog.addDependency("net/xhrio.js", ["goog.net.XhrIo", "goog.net.XhrIo.ResponseType"], ["goog.Timer", "goog.debug.Logger", "goog.debug.entryPointRegistry", "goog.debug.errorHandlerWeakDep", "goog.events.EventTarget", "goog.json", "goog.net.ErrorCode", "goog.net.EventType", "goog.net.HttpStatus", "goog.net.XmlHttp", "goog.object", "goog.structs", "goog.structs.Map", "goog.uri.utils"]);
goog.addDependency("net/xhriopool.js", ["goog.net.XhrIoPool"], ["goog.net.XhrIo", "goog.structs", "goog.structs.PriorityPool"]);
goog.addDependency("net/xhrlite.js", ["goog.net.XhrLite"], ["goog.net.XhrIo"]);
goog.addDependency("net/xhrlitepool.js", ["goog.net.XhrLitePool"], ["goog.net.XhrIoPool"]);
goog.addDependency("net/xhrmanager.js", ["goog.net.XhrManager", "goog.net.XhrManager.Event", "goog.net.XhrManager.Request"], ["goog.Disposable", "goog.events", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.net.EventType", "goog.net.XhrIo", "goog.net.XhrIoPool", "goog.structs.Map"]);
goog.addDependency("net/xmlhttp.js", ["goog.net.DefaultXmlHttpFactory", "goog.net.XmlHttp", "goog.net.XmlHttp.OptionType", "goog.net.XmlHttp.ReadyState"], ["goog.net.WrapperXmlHttpFactory", "goog.net.XmlHttpFactory"]);
goog.addDependency("net/xmlhttpfactory.js", ["goog.net.XmlHttpFactory"], []);
goog.addDependency("net/xpc/crosspagechannel.js", ["goog.net.xpc.CrossPageChannel"], ["goog.Disposable", "goog.Uri", "goog.async.Deferred", "goog.async.Delay", "goog.dom", "goog.events", "goog.events.EventHandler", "goog.json", "goog.messaging.AbstractChannel", "goog.net.xpc", "goog.net.xpc.CrossPageChannelRole", "goog.net.xpc.FrameElementMethodTransport", "goog.net.xpc.IframePollingTransport", "goog.net.xpc.IframeRelayTransport", "goog.net.xpc.NativeMessagingTransport", "goog.net.xpc.NixTransport", 
"goog.net.xpc.Transport", "goog.userAgent"]);
goog.addDependency("net/xpc/crosspagechannelrole.js", ["goog.net.xpc.CrossPageChannelRole"], []);
goog.addDependency("net/xpc/frameelementmethodtransport.js", ["goog.net.xpc.FrameElementMethodTransport"], ["goog.net.xpc", "goog.net.xpc.CrossPageChannelRole", "goog.net.xpc.Transport"]);
goog.addDependency("net/xpc/iframepollingtransport.js", ["goog.net.xpc.IframePollingTransport", "goog.net.xpc.IframePollingTransport.Receiver", "goog.net.xpc.IframePollingTransport.Sender"], ["goog.array", "goog.dom", "goog.net.xpc", "goog.net.xpc.CrossPageChannelRole", "goog.net.xpc.Transport", "goog.userAgent"]);
goog.addDependency("net/xpc/iframerelaytransport.js", ["goog.net.xpc.IframeRelayTransport"], ["goog.dom", "goog.events", "goog.net.xpc", "goog.net.xpc.Transport", "goog.userAgent"]);
goog.addDependency("net/xpc/nativemessagingtransport.js", ["goog.net.xpc.NativeMessagingTransport"], ["goog.Timer", "goog.asserts", "goog.async.Deferred", "goog.events", "goog.events.EventHandler", "goog.net.xpc", "goog.net.xpc.CrossPageChannelRole", "goog.net.xpc.Transport"]);
goog.addDependency("net/xpc/nixtransport.js", ["goog.net.xpc.NixTransport"], ["goog.net.xpc", "goog.net.xpc.CrossPageChannelRole", "goog.net.xpc.Transport", "goog.reflect"]);
goog.addDependency("net/xpc/relay.js", ["goog.net.xpc.relay"], []);
goog.addDependency("net/xpc/transport.js", ["goog.net.xpc.Transport"], ["goog.Disposable", "goog.dom", "goog.net.xpc"]);
goog.addDependency("net/xpc/xpc.js", ["goog.net.xpc", "goog.net.xpc.CfgFields", "goog.net.xpc.ChannelStates", "goog.net.xpc.TransportNames", "goog.net.xpc.TransportTypes", "goog.net.xpc.UriCfgFields"], ["goog.debug.Logger"]);
goog.addDependency("object/object.js", ["goog.object"], []);
goog.addDependency("positioning/absoluteposition.js", ["goog.positioning.AbsolutePosition"], ["goog.math.Box", "goog.math.Coordinate", "goog.math.Size", "goog.positioning", "goog.positioning.AbstractPosition"]);
goog.addDependency("positioning/abstractposition.js", ["goog.positioning.AbstractPosition"], ["goog.math.Box", "goog.math.Size", "goog.positioning.Corner"]);
goog.addDependency("positioning/anchoredposition.js", ["goog.positioning.AnchoredPosition"], ["goog.math.Box", "goog.positioning", "goog.positioning.AbstractPosition"]);
goog.addDependency("positioning/anchoredviewportposition.js", ["goog.positioning.AnchoredViewportPosition"], ["goog.math.Box", "goog.positioning", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.positioning.Overflow", "goog.positioning.OverflowStatus"]);
goog.addDependency("positioning/clientposition.js", ["goog.positioning.ClientPosition"], ["goog.asserts", "goog.math.Box", "goog.math.Coordinate", "goog.math.Size", "goog.positioning", "goog.positioning.AbstractPosition", "goog.style"]);
goog.addDependency("positioning/clientposition_test.js", ["goog.positioning.clientPositionTest"], ["goog.dom", "goog.positioning.ClientPosition", "goog.style", "goog.testing.jsunit"]);
goog.addDependency("positioning/menuanchoredposition.js", ["goog.positioning.MenuAnchoredPosition"], ["goog.math.Box", "goog.math.Size", "goog.positioning", "goog.positioning.AnchoredViewportPosition", "goog.positioning.Corner", "goog.positioning.Overflow"]);
goog.addDependency("positioning/positioning.js", ["goog.positioning", "goog.positioning.Corner", "goog.positioning.CornerBit", "goog.positioning.Overflow", "goog.positioning.OverflowStatus"], ["goog.asserts", "goog.dom", "goog.dom.TagName", "goog.math.Box", "goog.math.Coordinate", "goog.math.Size", "goog.style", "goog.style.bidi"]);
goog.addDependency("positioning/viewportclientposition.js", ["goog.positioning.ViewportClientPosition"], ["goog.math.Box", "goog.math.Coordinate", "goog.math.Size", "goog.positioning.ClientPosition"]);
goog.addDependency("positioning/viewportposition.js", ["goog.positioning.ViewportPosition"], ["goog.math.Box", "goog.math.Coordinate", "goog.math.Size", "goog.positioning.AbstractPosition"]);
goog.addDependency("proto/proto.js", ["goog.proto"], ["goog.proto.Serializer"]);
goog.addDependency("proto/serializer.js", ["goog.proto.Serializer"], ["goog.json.Serializer", "goog.string"]);
goog.addDependency("proto2/descriptor.js", ["goog.proto2.Descriptor", "goog.proto2.Metadata"], ["goog.array", "goog.object", "goog.proto2.Util"]);
goog.addDependency("proto2/fielddescriptor.js", ["goog.proto2.FieldDescriptor"], ["goog.proto2.Util", "goog.string"]);
goog.addDependency("proto2/lazydeserializer.js", ["goog.proto2.LazyDeserializer"], ["goog.proto2.Serializer", "goog.proto2.Util"]);
goog.addDependency("proto2/message.js", ["goog.proto2.Message"], ["goog.proto2.Descriptor", "goog.proto2.FieldDescriptor", "goog.proto2.Util", "goog.string"]);
goog.addDependency("proto2/objectserializer.js", ["goog.proto2.ObjectSerializer"], ["goog.proto2.Serializer", "goog.proto2.Util", "goog.string"]);
goog.addDependency("proto2/package_test.pb.js", ["someprotopackage.TestPackageTypes"], ["goog.proto2.Message", "proto2.TestAllTypes"]);
goog.addDependency("proto2/pbliteserializer.js", ["goog.proto2.PbLiteSerializer"], ["goog.proto2.LazyDeserializer", "goog.proto2.Util"]);
goog.addDependency("proto2/serializer.js", ["goog.proto2.Serializer"], ["goog.proto2.Descriptor", "goog.proto2.FieldDescriptor", "goog.proto2.Message", "goog.proto2.Util"]);
goog.addDependency("proto2/test.pb.js", ["proto2.TestAllTypes", "proto2.TestAllTypes.NestedEnum", "proto2.TestAllTypes.NestedMessage", "proto2.TestAllTypes.OptionalGroup", "proto2.TestAllTypes.RepeatedGroup"], ["goog.proto2.Message"]);
goog.addDependency("proto2/textformatserializer.js", ["goog.proto2.TextFormatSerializer", "goog.proto2.TextFormatSerializer.Parser"], ["goog.array", "goog.asserts", "goog.json", "goog.proto2.Serializer", "goog.proto2.Util", "goog.string"]);
goog.addDependency("proto2/textformatserializer_test.js", ["goog.proto2.TextFormatSerializerTest"], ["goog.proto2.TextFormatSerializer", "goog.testing.jsunit", "goog.testing.recordFunction", "proto2.TestAllTypes"]);
goog.addDependency("proto2/util.js", ["goog.proto2.Util"], ["goog.asserts"]);
goog.addDependency("pubsub/pubsub.js", ["goog.pubsub.PubSub"], ["goog.Disposable", "goog.array"]);
goog.addDependency("reflect/reflect.js", ["goog.reflect"], []);
goog.addDependency("result/deferredadaptor.js", ["goog.result.DeferredAdaptor"], ["goog.async.Deferred", "goog.result", "goog.result.Result"]);
goog.addDependency("result/result_interface.js", ["goog.result.Result"], ["goog.debug.Error"]);
goog.addDependency("result/resultutil.js", ["goog.result"], ["goog.array", "goog.result.Result", "goog.result.SimpleResult"]);
goog.addDependency("result/simpleresult.js", ["goog.result.SimpleResult", "goog.result.SimpleResult.StateError"], ["goog.debug.Error", "goog.result.Result"]);
goog.addDependency("soy/renderer.js", ["goog.soy.InjectedDataSupplier", "goog.soy.Renderer"], ["goog.dom", "goog.soy"]);
goog.addDependency("soy/soy.js", ["goog.soy"], ["goog.dom", "goog.dom.NodeType", "goog.dom.TagName"]);
goog.addDependency("soy/soy_test.js", ["goog.soy.testHelper"], ["goog.dom", "goog.string", "goog.userAgent"]);
goog.addDependency("spell/spellcheck.js", ["goog.spell.SpellCheck", "goog.spell.SpellCheck.WordChangedEvent"], ["goog.Timer", "goog.events.EventTarget", "goog.structs.Set"]);
goog.addDependency("stats/basicstat.js", ["goog.stats.BasicStat"], ["goog.array", "goog.debug.Logger", "goog.iter", "goog.object", "goog.string.format", "goog.structs.CircularBuffer"]);
goog.addDependency("storage/collectablestorage.js", ["goog.storage.CollectableStorage"], ["goog.array", "goog.asserts", "goog.iter", "goog.storage.ErrorCode", "goog.storage.ExpiringStorage", "goog.storage.RichStorage.Wrapper", "goog.storage.mechanism.IterableMechanism"]);
goog.addDependency("storage/encryptedstorage.js", ["goog.storage.EncryptedStorage"], ["goog.crypt", "goog.crypt.Arc4", "goog.crypt.Sha1", "goog.crypt.base64", "goog.json", "goog.json.Serializer", "goog.storage.CollectableStorage", "goog.storage.ErrorCode", "goog.storage.RichStorage", "goog.storage.RichStorage.Wrapper", "goog.storage.mechanism.IterableMechanism"]);
goog.addDependency("storage/errorcode.js", ["goog.storage.ErrorCode"], []);
goog.addDependency("storage/expiringstorage.js", ["goog.storage.ExpiringStorage"], ["goog.storage.RichStorage", "goog.storage.RichStorage.Wrapper", "goog.storage.mechanism.Mechanism"]);
goog.addDependency("storage/mechanism/errorcode.js", ["goog.storage.mechanism.ErrorCode"], []);
goog.addDependency("storage/mechanism/html5localstorage.js", ["goog.storage.mechanism.HTML5LocalStorage"], ["goog.storage.mechanism.HTML5WebStorage"]);
goog.addDependency("storage/mechanism/html5sessionstorage.js", ["goog.storage.mechanism.HTML5SessionStorage"], ["goog.storage.mechanism.HTML5WebStorage"]);
goog.addDependency("storage/mechanism/html5webstorage.js", ["goog.storage.mechanism.HTML5WebStorage"], ["goog.asserts", "goog.iter.Iterator", "goog.iter.StopIteration", "goog.storage.mechanism.ErrorCode", "goog.storage.mechanism.IterableMechanism"]);
goog.addDependency("storage/mechanism/ieuserdata.js", ["goog.storage.mechanism.IEUserData"], ["goog.asserts", "goog.iter.Iterator", "goog.iter.StopIteration", "goog.storage.mechanism.ErrorCode", "goog.storage.mechanism.IterableMechanism", "goog.structs.Map", "goog.userAgent"]);
goog.addDependency("storage/mechanism/iterablemechanism.js", ["goog.storage.mechanism.IterableMechanism"], ["goog.array", "goog.asserts", "goog.iter", "goog.iter.Iterator", "goog.storage.mechanism.Mechanism"]);
goog.addDependency("storage/mechanism/iterablemechanism_test.js", ["goog.storage.mechanism.iterablemechanism_test"], ["goog.iter.Iterator", "goog.storage.mechanism.IterableMechanism", "goog.testing.asserts"]);
goog.addDependency("storage/mechanism/mechanism.js", ["goog.storage.mechanism.Mechanism"], []);
goog.addDependency("storage/mechanism/mechanism_separation_test.js", ["goog.storage.mechanism.mechanism_separation_test"], ["goog.iter.Iterator", "goog.storage.mechanism.IterableMechanism", "goog.testing.asserts"]);
goog.addDependency("storage/mechanism/mechanism_sharing_test.js", ["goog.storage.mechanism.mechanism_sharing_test"], ["goog.iter.Iterator", "goog.storage.mechanism.IterableMechanism", "goog.testing.asserts"]);
goog.addDependency("storage/mechanism/mechanism_test.js", ["goog.storage.mechanism.mechanism_test"], ["goog.storage.mechanism.ErrorCode", "goog.storage.mechanism.HTML5LocalStorage", "goog.storage.mechanism.Mechanism", "goog.testing.asserts", "goog.userAgent.product", "goog.userAgent.product.isVersion"]);
goog.addDependency("storage/mechanism/mechanismfactory.js", ["goog.storage.mechanism.mechanismfactory"], ["goog.storage.mechanism.HTML5LocalStorage", "goog.storage.mechanism.HTML5SessionStorage", "goog.storage.mechanism.IEUserData", "goog.storage.mechanism.IterableMechanism", "goog.storage.mechanism.PrefixedMechanism"]);
goog.addDependency("storage/mechanism/prefixedmechanism.js", ["goog.storage.mechanism.PrefixedMechanism"], ["goog.iter.Iterator", "goog.storage.mechanism.IterableMechanism"]);
goog.addDependency("storage/richstorage.js", ["goog.storage.RichStorage", "goog.storage.RichStorage.Wrapper"], ["goog.storage.ErrorCode", "goog.storage.Storage", "goog.storage.mechanism.Mechanism"]);
goog.addDependency("storage/storage.js", ["goog.storage.Storage"], ["goog.json", "goog.json.Serializer", "goog.storage.ErrorCode", "goog.storage.mechanism.Mechanism"]);
goog.addDependency("storage/storage_test.js", ["goog.storage.storage_test"], ["goog.storage.Storage", "goog.structs.Map", "goog.testing.asserts"]);
goog.addDependency("string/linkify.js", ["goog.string.linkify"], ["goog.string"]);
goog.addDependency("string/parser.js", ["goog.string.Parser"], []);
goog.addDependency("string/path.js", ["goog.string.path"], ["goog.array", "goog.string"]);
goog.addDependency("string/string.js", ["goog.string", "goog.string.Unicode"], []);
goog.addDependency("string/stringbuffer.js", ["goog.string.StringBuffer"], []);
goog.addDependency("string/stringformat.js", ["goog.string.format"], ["goog.string"]);
goog.addDependency("string/stringifier.js", ["goog.string.Stringifier"], []);
goog.addDependency("structs/avltree.js", ["goog.structs.AvlTree", "goog.structs.AvlTree.Node"], ["goog.structs", "goog.structs.Collection"]);
goog.addDependency("structs/circularbuffer.js", ["goog.structs.CircularBuffer"], []);
goog.addDependency("structs/collection.js", ["goog.structs.Collection"], []);
goog.addDependency("structs/heap.js", ["goog.structs.Heap"], ["goog.array", "goog.object", "goog.structs.Node"]);
goog.addDependency("structs/inversionmap.js", ["goog.structs.InversionMap"], ["goog.array"]);
goog.addDependency("structs/linkedmap.js", ["goog.structs.LinkedMap"], ["goog.structs.Map"]);
goog.addDependency("structs/map.js", ["goog.structs.Map"], ["goog.iter.Iterator", "goog.iter.StopIteration", "goog.object", "goog.structs"]);
goog.addDependency("structs/node.js", ["goog.structs.Node"], []);
goog.addDependency("structs/pool.js", ["goog.structs.Pool"], ["goog.Disposable", "goog.structs.Queue", "goog.structs.Set"]);
goog.addDependency("structs/prioritypool.js", ["goog.structs.PriorityPool"], ["goog.structs.Pool", "goog.structs.PriorityQueue"]);
goog.addDependency("structs/priorityqueue.js", ["goog.structs.PriorityQueue"], ["goog.structs", "goog.structs.Heap"]);
goog.addDependency("structs/quadtree.js", ["goog.structs.QuadTree", "goog.structs.QuadTree.Node", "goog.structs.QuadTree.Point"], ["goog.math.Coordinate"]);
goog.addDependency("structs/queue.js", ["goog.structs.Queue"], ["goog.array"]);
goog.addDependency("structs/set.js", ["goog.structs.Set"], ["goog.structs", "goog.structs.Collection", "goog.structs.Map"]);
goog.addDependency("structs/simplepool.js", ["goog.structs.SimplePool"], ["goog.Disposable"]);
goog.addDependency("structs/stringset.js", ["goog.structs.StringSet"], ["goog.iter"]);
goog.addDependency("structs/structs.js", ["goog.structs"], ["goog.array", "goog.object"]);
goog.addDependency("structs/treenode.js", ["goog.structs.TreeNode"], ["goog.array", "goog.asserts", "goog.structs.Node"]);
goog.addDependency("structs/trie.js", ["goog.structs.Trie"], ["goog.object", "goog.structs"]);
goog.addDependency("style/bidi.js", ["goog.style.bidi"], ["goog.dom", "goog.style", "goog.userAgent"]);
goog.addDependency("style/cursor.js", ["goog.style.cursor"], ["goog.userAgent"]);
goog.addDependency("style/style.js", ["goog.style"], ["goog.array", "goog.dom", "goog.math.Box", "goog.math.Coordinate", "goog.math.Rect", "goog.math.Size", "goog.object", "goog.string", "goog.userAgent"]);
goog.addDependency("style/style_test.js", ["goog.style_test"], ["goog.dom", "goog.style", "goog.testing.asserts"]);
goog.addDependency("style/transition.js", ["goog.style.transition", "goog.style.transition.Css3Property"], ["goog.array", "goog.asserts", "goog.userAgent"]);
goog.addDependency("testing/asserts.js", ["goog.testing.JsUnitException", "goog.testing.asserts"], ["goog.testing.stacktrace"]);
goog.addDependency("testing/async/mockcontrol.js", ["goog.testing.async.MockControl"], ["goog.asserts", "goog.async.Deferred", "goog.debug", "goog.testing.asserts", "goog.testing.mockmatchers.IgnoreArgument"]);
goog.addDependency("testing/asynctestcase.js", ["goog.testing.AsyncTestCase", "goog.testing.AsyncTestCase.ControlBreakingException"], ["goog.testing.TestCase", "goog.testing.TestCase.Test", "goog.testing.asserts"]);
goog.addDependency("testing/benchmark.js", ["goog.testing.benchmark"], ["goog.dom", "goog.dom.TagName", "goog.testing.PerformanceTable", "goog.testing.PerformanceTimer", "goog.testing.TestCase"]);
goog.addDependency("testing/benchmarks/jsbinarysizebutton.js", ["goog.ui.benchmarks.jsbinarysizebutton"], ["goog.array", "goog.dom", "goog.events", "goog.ui.Button", "goog.ui.ButtonSide", "goog.ui.Component.EventType", "goog.ui.CustomButton"]);
goog.addDependency("testing/benchmarks/jsbinarysizetoolbar.js", ["goog.ui.benchmarks.jsbinarysizetoolbar"], ["goog.array", "goog.dom", "goog.events", "goog.object", "goog.ui.Component.EventType", "goog.ui.Option", "goog.ui.Toolbar", "goog.ui.ToolbarButton", "goog.ui.ToolbarSelect", "goog.ui.ToolbarSeparator"]);
goog.addDependency("testing/continuationtestcase.js", ["goog.testing.ContinuationTestCase", "goog.testing.ContinuationTestCase.Step", "goog.testing.ContinuationTestCase.Test"], ["goog.array", "goog.events.EventHandler", "goog.testing.TestCase", "goog.testing.TestCase.Test", "goog.testing.asserts"]);
goog.addDependency("testing/deferredtestcase.js", ["goog.testing.DeferredTestCase"], ["goog.async.Deferred", "goog.testing.AsyncTestCase", "goog.testing.TestCase"]);
goog.addDependency("testing/dom.js", ["goog.testing.dom"], ["goog.dom", "goog.dom.NodeIterator", "goog.dom.NodeType", "goog.dom.TagIterator", "goog.dom.TagName", "goog.dom.classes", "goog.iter", "goog.object", "goog.string", "goog.style", "goog.testing.asserts", "goog.userAgent"]);
goog.addDependency("testing/editor/dom.js", ["goog.testing.editor.dom"], ["goog.dom.NodeType", "goog.dom.TagIterator", "goog.dom.TagWalkType", "goog.iter", "goog.string", "goog.testing.asserts"]);
goog.addDependency("testing/editor/fieldmock.js", ["goog.testing.editor.FieldMock"], ["goog.dom", "goog.dom.Range", "goog.editor.Field", "goog.testing.LooseMock"]);
goog.addDependency("testing/editor/testhelper.js", ["goog.testing.editor.TestHelper"], ["goog.Disposable", "goog.dom", "goog.dom.Range", "goog.editor.BrowserFeature", "goog.editor.node", "goog.testing.dom"]);
goog.addDependency("testing/events/eventobserver.js", ["goog.testing.events.EventObserver"], ["goog.array"]);
goog.addDependency("testing/events/events.js", ["goog.testing.events", "goog.testing.events.Event"], ["goog.events", "goog.events.BrowserEvent", "goog.events.BrowserEvent.MouseButton", "goog.events.BrowserFeature", "goog.events.EventType", "goog.events.KeyCodes", "goog.object", "goog.style", "goog.userAgent"]);
goog.addDependency("testing/events/matchers.js", ["goog.testing.events.EventMatcher"], ["goog.events.Event", "goog.testing.mockmatchers.ArgumentMatcher"]);
goog.addDependency("testing/events/onlinehandler.js", ["goog.testing.events.OnlineHandler"], ["goog.events.EventTarget", "goog.events.OnlineHandler.EventType"]);
goog.addDependency("testing/expectedfailures.js", ["goog.testing.ExpectedFailures"], ["goog.debug.DivConsole", "goog.debug.Logger", "goog.dom", "goog.dom.TagName", "goog.events", "goog.events.EventType", "goog.style", "goog.testing.JsUnitException", "goog.testing.TestCase", "goog.testing.asserts"]);
goog.addDependency("testing/fs/blob.js", ["goog.testing.fs.Blob"], ["goog.crypt.base64"]);
goog.addDependency("testing/fs/entry.js", ["goog.testing.fs.DirectoryEntry", "goog.testing.fs.Entry", "goog.testing.fs.FileEntry"], ["goog.Timer", "goog.array", "goog.async.Deferred", "goog.fs.DirectoryEntry", "goog.fs.DirectoryEntry.Behavior", "goog.fs.Error", "goog.functions", "goog.object", "goog.string", "goog.testing.fs.File", "goog.testing.fs.FileWriter"]);
goog.addDependency("testing/fs/file.js", ["goog.testing.fs.File"], ["goog.testing.fs.Blob"]);
goog.addDependency("testing/fs/filereader.js", ["goog.testing.fs.FileReader"], ["goog.Timer", "goog.events.EventTarget", "goog.fs.Error", "goog.fs.FileReader.EventType", "goog.fs.FileReader.ReadyState", "goog.testing.fs.File", "goog.testing.fs.ProgressEvent"]);
goog.addDependency("testing/fs/filesystem.js", ["goog.testing.fs.FileSystem"], ["goog.testing.fs.DirectoryEntry"]);
goog.addDependency("testing/fs/filewriter.js", ["goog.testing.fs.FileWriter"], ["goog.Timer", "goog.events.Event", "goog.events.EventTarget", "goog.fs.Error", "goog.fs.FileSaver.EventType", "goog.fs.FileSaver.ReadyState", "goog.string", "goog.testing.fs.File", "goog.testing.fs.ProgressEvent"]);
goog.addDependency("testing/fs/fs.js", ["goog.testing.fs"], ["goog.Timer", "goog.array", "goog.fs", "goog.testing.fs.Blob", "goog.testing.fs.FileSystem"]);
goog.addDependency("testing/fs/progressevent.js", ["goog.testing.fs.ProgressEvent"], ["goog.events.Event"]);
goog.addDependency("testing/functionmock.js", ["goog.testing", "goog.testing.FunctionMock", "goog.testing.GlobalFunctionMock", "goog.testing.MethodMock"], ["goog.object", "goog.testing.LooseMock", "goog.testing.Mock", "goog.testing.MockInterface", "goog.testing.PropertyReplacer", "goog.testing.StrictMock"]);
goog.addDependency("testing/graphics.js", ["goog.testing.graphics"], ["goog.graphics.Path.Segment", "goog.testing.asserts"]);
goog.addDependency("testing/jsunit.js", ["goog.testing.jsunit"], ["goog.testing.TestCase", "goog.testing.TestRunner"]);
goog.addDependency("testing/loosemock.js", ["goog.testing.LooseExpectationCollection", "goog.testing.LooseMock"], ["goog.array", "goog.structs.Map", "goog.testing.Mock"]);
goog.addDependency("testing/messaging/mockmessagechannel.js", ["goog.testing.messaging.MockMessageChannel"], ["goog.messaging.AbstractChannel", "goog.testing.asserts"]);
goog.addDependency("testing/messaging/mockmessageevent.js", ["goog.testing.messaging.MockMessageEvent"], ["goog.events.BrowserEvent", "goog.events.EventType", "goog.testing.events"]);
goog.addDependency("testing/messaging/mockmessageport.js", ["goog.testing.messaging.MockMessagePort"], ["goog.events.EventTarget"]);
goog.addDependency("testing/messaging/mockportnetwork.js", ["goog.testing.messaging.MockPortNetwork"], ["goog.messaging.PortNetwork", "goog.testing.messaging.MockMessageChannel"]);
goog.addDependency("testing/mock.js", ["goog.testing.Mock", "goog.testing.MockExpectation"], ["goog.array", "goog.object", "goog.testing.JsUnitException", "goog.testing.MockInterface", "goog.testing.mockmatchers"]);
goog.addDependency("testing/mockclassfactory.js", ["goog.testing.MockClassFactory", "goog.testing.MockClassRecord"], ["goog.array", "goog.object", "goog.testing.LooseMock", "goog.testing.StrictMock", "goog.testing.TestCase", "goog.testing.mockmatchers"]);
goog.addDependency("testing/mockclock.js", ["goog.testing.MockClock"], ["goog.Disposable", "goog.testing.PropertyReplacer", "goog.testing.events", "goog.testing.events.Event"]);
goog.addDependency("testing/mockcontrol.js", ["goog.testing.MockControl"], ["goog.array", "goog.testing", "goog.testing.LooseMock", "goog.testing.MockInterface", "goog.testing.StrictMock"]);
goog.addDependency("testing/mockinterface.js", ["goog.testing.MockInterface"], []);
goog.addDependency("testing/mockmatchers.js", ["goog.testing.mockmatchers", "goog.testing.mockmatchers.ArgumentMatcher", "goog.testing.mockmatchers.IgnoreArgument", "goog.testing.mockmatchers.InstanceOf", "goog.testing.mockmatchers.ObjectEquals", "goog.testing.mockmatchers.RegexpMatch", "goog.testing.mockmatchers.SaveArgument", "goog.testing.mockmatchers.TypeOf"], ["goog.array", "goog.dom", "goog.testing.asserts"]);
goog.addDependency("testing/mockrandom.js", ["goog.testing.MockRandom"], ["goog.Disposable"]);
goog.addDependency("testing/mockrange.js", ["goog.testing.MockRange"], ["goog.dom.AbstractRange", "goog.testing.LooseMock"]);
goog.addDependency("testing/mockstorage.js", ["goog.testing.MockStorage"], ["goog.structs.Map"]);
goog.addDependency("testing/mockuseragent.js", ["goog.testing.MockUserAgent"], ["goog.Disposable", "goog.userAgent"]);
goog.addDependency("testing/multitestrunner.js", ["goog.testing.MultiTestRunner", "goog.testing.MultiTestRunner.TestFrame"], ["goog.Timer", "goog.array", "goog.dom", "goog.dom.classes", "goog.events.EventHandler", "goog.functions", "goog.string", "goog.ui.Component", "goog.ui.ServerChart", "goog.ui.ServerChart.ChartType", "goog.ui.TableSorter"]);
goog.addDependency("testing/net/xhrio.js", ["goog.testing.net.XhrIo"], ["goog.array", "goog.dom.xml", "goog.events", "goog.events.EventTarget", "goog.json", "goog.net.ErrorCode", "goog.net.EventType", "goog.net.HttpStatus", "goog.net.XhrIo.ResponseType", "goog.net.XmlHttp", "goog.object", "goog.structs.Map", "goog.uri.utils"]);
goog.addDependency("testing/net/xhriopool.js", ["goog.testing.net.XhrIoPool"], ["goog.net.XhrIoPool", "goog.testing.net.XhrIo"]);
goog.addDependency("testing/objectpropertystring.js", ["goog.testing.ObjectPropertyString"], []);
goog.addDependency("testing/performancetable.js", ["goog.testing.PerformanceTable"], ["goog.dom", "goog.testing.PerformanceTimer"]);
goog.addDependency("testing/performancetimer.js", ["goog.testing.PerformanceTimer", "goog.testing.PerformanceTimer.Task"], ["goog.array", "goog.math"]);
goog.addDependency("testing/propertyreplacer.js", ["goog.testing.PropertyReplacer"], ["goog.userAgent"]);
goog.addDependency("testing/proto2/proto2.js", ["goog.testing.proto2"], ["goog.proto2.Message", "goog.testing.asserts"]);
goog.addDependency("testing/pseudorandom.js", ["goog.testing.PseudoRandom"], ["goog.Disposable"]);
goog.addDependency("testing/recordfunction.js", ["goog.testing.FunctionCall", "goog.testing.recordConstructor", "goog.testing.recordFunction"], []);
goog.addDependency("testing/shardingtestcase.js", ["goog.testing.ShardingTestCase"], ["goog.asserts", "goog.testing.TestCase"]);
goog.addDependency("testing/singleton.js", ["goog.testing.singleton"], []);
goog.addDependency("testing/stacktrace.js", ["goog.testing.stacktrace", "goog.testing.stacktrace.Frame"], []);
goog.addDependency("testing/storage/fakemechanism.js", ["goog.testing.storage.FakeMechanism"], ["goog.storage.mechanism.IterableMechanism", "goog.structs.Map"]);
goog.addDependency("testing/strictmock.js", ["goog.testing.StrictMock"], ["goog.array", "goog.testing.Mock"]);
goog.addDependency("testing/style/layoutasserts.js", ["goog.testing.style.layoutasserts"], ["goog.style", "goog.testing.asserts", "goog.testing.style"]);
goog.addDependency("testing/style/style.js", ["goog.testing.style"], ["goog.dom", "goog.math.Rect", "goog.style"]);
goog.addDependency("testing/testcase.js", ["goog.testing.TestCase", "goog.testing.TestCase.Error", "goog.testing.TestCase.Order", "goog.testing.TestCase.Result", "goog.testing.TestCase.Test"], ["goog.object", "goog.testing.asserts", "goog.testing.stacktrace"]);
goog.addDependency("testing/testqueue.js", ["goog.testing.TestQueue"], []);
goog.addDependency("testing/testrunner.js", ["goog.testing.TestRunner"], ["goog.testing.TestCase"]);
goog.addDependency("testing/ui/rendererasserts.js", ["goog.testing.ui.rendererasserts"], ["goog.testing.asserts"]);
goog.addDependency("testing/ui/rendererharness.js", ["goog.testing.ui.RendererHarness"], ["goog.Disposable", "goog.dom.NodeType", "goog.testing.asserts"]);
goog.addDependency("testing/ui/style.js", ["goog.testing.ui.style"], ["goog.array", "goog.dom", "goog.dom.classes", "goog.testing.asserts"]);
goog.addDependency("timer/timer.js", ["goog.Timer"], ["goog.events.EventTarget"]);
goog.addDependency("tweak/entries.js", ["goog.tweak.BaseEntry", "goog.tweak.BasePrimitiveSetting", "goog.tweak.BaseSetting", "goog.tweak.BooleanGroup", "goog.tweak.BooleanInGroupSetting", "goog.tweak.BooleanSetting", "goog.tweak.ButtonAction", "goog.tweak.NumericSetting", "goog.tweak.StringSetting"], ["goog.array", "goog.asserts", "goog.debug.Logger", "goog.object"]);
goog.addDependency("tweak/registry.js", ["goog.tweak.Registry"], ["goog.asserts", "goog.debug.Logger", "goog.object", "goog.string", "goog.tweak.BaseEntry", "goog.uri.utils"]);
goog.addDependency("tweak/testhelpers.js", ["goog.tweak.testhelpers"], ["goog.tweak"]);
goog.addDependency("tweak/tweak.js", ["goog.tweak", "goog.tweak.ConfigParams"], ["goog.asserts", "goog.tweak.BooleanGroup", "goog.tweak.BooleanInGroupSetting", "goog.tweak.BooleanSetting", "goog.tweak.ButtonAction", "goog.tweak.NumericSetting", "goog.tweak.Registry", "goog.tweak.StringSetting"]);
goog.addDependency("tweak/tweakui.js", ["goog.tweak.EntriesPanel", "goog.tweak.TweakUi"], ["goog.array", "goog.asserts", "goog.dom.DomHelper", "goog.object", "goog.style", "goog.tweak", "goog.ui.Zippy", "goog.userAgent"]);
goog.addDependency("ui/abstractspellchecker.js", ["goog.ui.AbstractSpellChecker", "goog.ui.AbstractSpellChecker.AsyncResult"], ["goog.asserts", "goog.dom", "goog.dom.classes", "goog.dom.selection", "goog.events.EventType", "goog.math.Coordinate", "goog.spell.SpellCheck", "goog.structs.Set", "goog.style", "goog.ui.MenuItem", "goog.ui.MenuSeparator", "goog.ui.PopupMenu"]);
goog.addDependency("ui/ac/ac.js", ["goog.ui.ac"], ["goog.ui.ac.ArrayMatcher", "goog.ui.ac.AutoComplete", "goog.ui.ac.InputHandler", "goog.ui.ac.Renderer"]);
goog.addDependency("ui/ac/arraymatcher.js", ["goog.ui.ac.ArrayMatcher"], ["goog.iter", "goog.string"]);
goog.addDependency("ui/ac/autocomplete.js", ["goog.ui.ac.AutoComplete", "goog.ui.ac.AutoComplete.EventType"], ["goog.events", "goog.events.EventTarget"]);
goog.addDependency("ui/ac/inputhandler.js", ["goog.ui.ac.InputHandler"], ["goog.Disposable", "goog.Timer", "goog.dom", "goog.dom.a11y", "goog.dom.selection", "goog.events.EventHandler", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.string", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("ui/ac/remote.js", ["goog.ui.ac.Remote"], ["goog.ui.ac.AutoComplete", "goog.ui.ac.InputHandler", "goog.ui.ac.RemoteArrayMatcher", "goog.ui.ac.Renderer"]);
goog.addDependency("ui/ac/remotearraymatcher.js", ["goog.ui.ac.RemoteArrayMatcher"], ["goog.Disposable", "goog.Uri", "goog.events", "goog.json", "goog.net.XhrIo"]);
goog.addDependency("ui/ac/renderer.js", ["goog.ui.ac.Renderer", "goog.ui.ac.Renderer.CustomRenderer"], ["goog.dispose", "goog.dom", "goog.dom.a11y", "goog.dom.classes", "goog.events.Event", "goog.events.EventTarget", "goog.events.EventType", "goog.fx.dom.FadeInAndShow", "goog.fx.dom.FadeOutAndHide", "goog.iter", "goog.positioning", "goog.positioning.Corner", "goog.positioning.Overflow", "goog.string", "goog.style", "goog.ui.IdGenerator", "goog.ui.ac.AutoComplete.EventType", "goog.userAgent"]);
goog.addDependency("ui/ac/renderoptions.js", ["goog.ui.ac.RenderOptions"], []);
goog.addDependency("ui/ac/richinputhandler.js", ["goog.ui.ac.RichInputHandler"], ["goog.ui.ac.InputHandler"]);
goog.addDependency("ui/ac/richremote.js", ["goog.ui.ac.RichRemote"], ["goog.ui.ac.AutoComplete", "goog.ui.ac.Remote", "goog.ui.ac.Renderer", "goog.ui.ac.RichInputHandler", "goog.ui.ac.RichRemoteArrayMatcher"]);
goog.addDependency("ui/ac/richremotearraymatcher.js", ["goog.ui.ac.RichRemoteArrayMatcher"], ["goog.ui.ac.RemoteArrayMatcher"]);
goog.addDependency("ui/activitymonitor.js", ["goog.ui.ActivityMonitor"], ["goog.array", "goog.dom", "goog.events", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType"]);
goog.addDependency("ui/advancedtooltip.js", ["goog.ui.AdvancedTooltip"], ["goog.events.EventType", "goog.math.Coordinate", "goog.ui.Tooltip", "goog.userAgent"]);
goog.addDependency("ui/animatedzippy.js", ["goog.ui.AnimatedZippy"], ["goog.dom", "goog.events", "goog.fx.Animation", "goog.fx.Animation.EventType", "goog.fx.Transition.EventType", "goog.fx.easing", "goog.ui.Zippy", "goog.ui.ZippyEvent"]);
goog.addDependency("ui/attachablemenu.js", ["goog.ui.AttachableMenu"], ["goog.dom.a11y", "goog.dom.a11y.State", "goog.events.KeyCodes", "goog.ui.ItemEvent", "goog.ui.MenuBase"]);
goog.addDependency("ui/bidiinput.js", ["goog.ui.BidiInput"], ["goog.events", "goog.events.InputHandler", "goog.i18n.bidi", "goog.ui.Component"]);
goog.addDependency("ui/bubble.js", ["goog.ui.Bubble"], ["goog.Timer", "goog.dom", "goog.events", "goog.events.Event", "goog.events.EventType", "goog.math.Box", "goog.positioning", "goog.positioning.AbsolutePosition", "goog.positioning.AbstractPosition", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.style", "goog.ui.Component", "goog.ui.Popup", "goog.ui.Popup.AnchoredPosition"]);
goog.addDependency("ui/button.js", ["goog.ui.Button", "goog.ui.Button.Side"], ["goog.events.KeyCodes", "goog.ui.ButtonRenderer", "goog.ui.ButtonSide", "goog.ui.Control", "goog.ui.ControlContent", "goog.ui.NativeButtonRenderer"]);
goog.addDependency("ui/buttonrenderer.js", ["goog.ui.ButtonRenderer"], ["goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.ui.ButtonSide", "goog.ui.Component.State", "goog.ui.ControlRenderer"]);
goog.addDependency("ui/buttonside.js", ["goog.ui.ButtonSide"], []);
goog.addDependency("ui/charcounter.js", ["goog.ui.CharCounter", "goog.ui.CharCounter.Display"], ["goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.InputHandler"]);
goog.addDependency("ui/charpicker.js", ["goog.ui.CharPicker"], ["goog.array", "goog.dom", "goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.events.InputHandler", "goog.events.KeyHandler", "goog.i18n.CharListDecompressor", "goog.i18n.uChar", "goog.i18n.uChar.NameFetcher", "goog.structs.Set", "goog.style", "goog.ui.Button", "goog.ui.Component", "goog.ui.ContainerScroller", "goog.ui.FlatButtonRenderer", "goog.ui.HoverCard", "goog.ui.LabelInput", "goog.ui.Menu", "goog.ui.MenuButton", 
"goog.ui.MenuItem", "goog.ui.Tooltip.ElementTooltipPosition"]);
goog.addDependency("ui/checkbox.js", ["goog.ui.Checkbox", "goog.ui.Checkbox.State"], ["goog.dom.a11y", "goog.dom.a11y.State", "goog.events.EventType", "goog.events.KeyCodes", "goog.ui.CheckboxRenderer", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.Control", "goog.ui.registry"]);
goog.addDependency("ui/checkboxmenuitem.js", ["goog.ui.CheckBoxMenuItem"], ["goog.ui.ControlContent", "goog.ui.MenuItem", "goog.ui.registry"]);
goog.addDependency("ui/checkboxrenderer.js", ["goog.ui.CheckboxRenderer"], ["goog.array", "goog.asserts", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.dom.classes", "goog.object", "goog.ui.ControlRenderer"]);
goog.addDependency("ui/colorbutton.js", ["goog.ui.ColorButton"], ["goog.ui.Button", "goog.ui.ColorButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/colorbuttonrenderer.js", ["goog.ui.ColorButtonRenderer"], ["goog.dom.classes", "goog.functions", "goog.ui.ColorMenuButtonRenderer"]);
goog.addDependency("ui/colormenubutton.js", ["goog.ui.ColorMenuButton"], ["goog.array", "goog.object", "goog.ui.ColorMenuButtonRenderer", "goog.ui.ColorPalette", "goog.ui.Component.EventType", "goog.ui.ControlContent", "goog.ui.Menu", "goog.ui.MenuButton", "goog.ui.registry"]);
goog.addDependency("ui/colormenubuttonrenderer.js", ["goog.ui.ColorMenuButtonRenderer"], ["goog.color", "goog.dom.classes", "goog.ui.ControlContent", "goog.ui.MenuButtonRenderer", "goog.userAgent"]);
goog.addDependency("ui/colorpalette.js", ["goog.ui.ColorPalette"], ["goog.array", "goog.color", "goog.dom", "goog.style", "goog.ui.Palette", "goog.ui.PaletteRenderer"]);
goog.addDependency("ui/colorpicker.js", ["goog.ui.ColorPicker", "goog.ui.ColorPicker.EventType"], ["goog.ui.ColorPalette", "goog.ui.Component", "goog.ui.Component.State"]);
goog.addDependency("ui/colorsplitbehavior.js", ["goog.ui.ColorSplitBehavior"], ["goog.ui.ColorButton", "goog.ui.ColorMenuButton", "goog.ui.SplitBehavior"]);
goog.addDependency("ui/combobox.js", ["goog.ui.ComboBox", "goog.ui.ComboBoxItem"], ["goog.Timer", "goog.debug.Logger", "goog.dom.classes", "goog.events", "goog.events.InputHandler", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.positioning.Corner", "goog.positioning.MenuAnchoredPosition", "goog.string", "goog.style", "goog.ui.Component", "goog.ui.ItemEvent", "goog.ui.LabelInput", "goog.ui.Menu", "goog.ui.MenuItem", "goog.ui.registry", "goog.userAgent"]);
goog.addDependency("ui/component.js", ["goog.ui.Component", "goog.ui.Component.Error", "goog.ui.Component.EventType", "goog.ui.Component.State"], ["goog.array", "goog.array.ArrayLike", "goog.dom", "goog.events.EventHandler", "goog.events.EventTarget", "goog.object", "goog.style", "goog.ui.IdGenerator"]);
goog.addDependency("ui/container.js", ["goog.ui.Container", "goog.ui.Container.EventType", "goog.ui.Container.Orientation"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.State", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.style", "goog.ui.Component", "goog.ui.Component.Error", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.ContainerRenderer", "goog.ui.Control"]);
goog.addDependency("ui/containerrenderer.js", ["goog.ui.ContainerRenderer"], ["goog.array", "goog.dom", "goog.dom.a11y", "goog.dom.classes", "goog.string", "goog.style", "goog.ui.Separator", "goog.ui.registry", "goog.userAgent"]);
goog.addDependency("ui/containerscroller.js", ["goog.ui.ContainerScroller"], ["goog.Timer", "goog.events.EventHandler", "goog.style", "goog.ui.Component", "goog.ui.Component.EventType", "goog.ui.Container.EventType"]);
goog.addDependency("ui/control.js", ["goog.ui.Control"], ["goog.array", "goog.dom", "goog.events.BrowserEvent.MouseButton", "goog.events.Event", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.string", "goog.ui.Component", "goog.ui.Component.Error", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.ui.ControlRenderer", "goog.ui.decorate", "goog.ui.registry", "goog.userAgent"]);
goog.addDependency("ui/controlcontent.js", ["goog.ui.ControlContent"], []);
goog.addDependency("ui/controlrenderer.js", ["goog.ui.ControlRenderer"], ["goog.array", "goog.dom", "goog.dom.a11y", "goog.dom.a11y.State", "goog.dom.classes", "goog.object", "goog.style", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.userAgent"]);
goog.addDependency("ui/cookieeditor.js", ["goog.ui.CookieEditor"], ["goog.dom", "goog.dom.TagName", "goog.events.EventType", "goog.net.cookies", "goog.string", "goog.style", "goog.ui.Component"]);
goog.addDependency("ui/css3buttonrenderer.js", ["goog.ui.Css3ButtonRenderer"], ["goog.dom", "goog.dom.TagName", "goog.dom.classes", "goog.ui.Button", "goog.ui.ButtonRenderer", "goog.ui.ControlContent", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.registry"]);
goog.addDependency("ui/css3menubuttonrenderer.js", ["goog.ui.Css3MenuButtonRenderer"], ["goog.dom", "goog.dom.TagName", "goog.ui.ControlContent", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.MenuButton", "goog.ui.MenuButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/cssnames.js", ["goog.ui.INLINE_BLOCK_CLASSNAME"], []);
goog.addDependency("ui/custombutton.js", ["goog.ui.CustomButton"], ["goog.ui.Button", "goog.ui.ControlContent", "goog.ui.CustomButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/custombuttonrenderer.js", ["goog.ui.CustomButtonRenderer"], ["goog.dom", "goog.dom.classes", "goog.string", "goog.ui.ButtonRenderer", "goog.ui.ControlContent", "goog.ui.INLINE_BLOCK_CLASSNAME"]);
goog.addDependency("ui/customcolorpalette.js", ["goog.ui.CustomColorPalette"], ["goog.color", "goog.dom", "goog.ui.ColorPalette"]);
goog.addDependency("ui/datepicker.js", ["goog.ui.DatePicker", "goog.ui.DatePicker.Events", "goog.ui.DatePickerEvent"], ["goog.date", "goog.date.Date", "goog.date.Interval", "goog.dom", "goog.dom.a11y", "goog.dom.classes", "goog.events", "goog.events.Event", "goog.events.EventType", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.i18n.DateTimeFormat", "goog.i18n.DateTimeSymbols", "goog.style", "goog.ui.Component", "goog.ui.IdGenerator"]);
goog.addDependency("ui/decorate.js", ["goog.ui.decorate"], ["goog.ui.registry"]);
goog.addDependency("ui/dialog.js", ["goog.ui.Dialog", "goog.ui.Dialog.ButtonSet", "goog.ui.Dialog.ButtonSet.DefaultButtons", "goog.ui.Dialog.DefaultButtonCaptions", "goog.ui.Dialog.DefaultButtonKeys", "goog.ui.Dialog.Event", "goog.ui.Dialog.EventType"], ["goog.asserts", "goog.dom", "goog.dom.NodeType", "goog.dom.TagName", "goog.dom.a11y", "goog.dom.classes", "goog.events.Event", "goog.events.EventType", "goog.events.KeyCodes", "goog.fx.Dragger", "goog.math.Rect", "goog.structs", "goog.structs.Map", 
"goog.style", "goog.ui.ModalPopup", "goog.userAgent"]);
goog.addDependency("ui/dimensionpicker.js", ["goog.ui.DimensionPicker"], ["goog.events.EventType", "goog.math.Size", "goog.ui.Control", "goog.ui.DimensionPickerRenderer", "goog.ui.registry"]);
goog.addDependency("ui/dimensionpickerrenderer.js", ["goog.ui.DimensionPickerRenderer"], ["goog.dom", "goog.dom.TagName", "goog.i18n.bidi", "goog.style", "goog.ui.ControlRenderer", "goog.userAgent"]);
goog.addDependency("ui/dragdropdetector.js", ["goog.ui.DragDropDetector", "goog.ui.DragDropDetector.EventType", "goog.ui.DragDropDetector.ImageDropEvent", "goog.ui.DragDropDetector.LinkDropEvent"], ["goog.dom", "goog.dom.TagName", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.math.Coordinate", "goog.string", "goog.style", "goog.userAgent"]);
goog.addDependency("ui/drilldownrow.js", ["goog.ui.DrilldownRow"], ["goog.dom", "goog.dom.classes", "goog.events", "goog.ui.Component"]);
goog.addDependency("ui/editor/abstractdialog.js", ["goog.ui.editor.AbstractDialog", "goog.ui.editor.AbstractDialog.Builder", "goog.ui.editor.AbstractDialog.EventType"], ["goog.dom", "goog.dom.classes", "goog.events.EventTarget", "goog.ui.Dialog", "goog.ui.Dialog.ButtonSet", "goog.ui.Dialog.DefaultButtonKeys", "goog.ui.Dialog.Event", "goog.ui.Dialog.EventType"]);
goog.addDependency("ui/editor/bubble.js", ["goog.ui.editor.Bubble"], ["goog.debug.Logger", "goog.dom", "goog.dom.ViewportSizeMonitor", "goog.editor.style", "goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.math.Box", "goog.positioning", "goog.string", "goog.style", "goog.ui.Component.EventType", "goog.ui.PopupBase", "goog.ui.PopupBase.EventType", "goog.userAgent"]);
goog.addDependency("ui/editor/defaulttoolbar.js", ["goog.ui.editor.DefaultToolbar"], ["goog.dom", "goog.dom.TagName", "goog.dom.classes", "goog.editor.Command", "goog.style", "goog.ui.ControlContent", "goog.ui.editor.ToolbarFactory", "goog.ui.editor.messages"]);
goog.addDependency("ui/editor/equationeditordialog.js", ["goog.ui.editor.EquationEditorDialog"], ["goog.editor.Command", "goog.ui.editor.AbstractDialog", "goog.ui.editor.EquationEditorOkEvent", "goog.ui.equation.ChangeEvent", "goog.ui.equation.TexEditor"]);
goog.addDependency("ui/editor/equationeditorokevent.js", ["goog.ui.editor.EquationEditorOkEvent"], ["goog.events.Event", "goog.ui.editor.AbstractDialog"]);
goog.addDependency("ui/editor/linkdialog.js", ["goog.ui.editor.LinkDialog", "goog.ui.editor.LinkDialog.BeforeTestLinkEvent", "goog.ui.editor.LinkDialog.EventType", "goog.ui.editor.LinkDialog.OkEvent"], ["goog.dom", "goog.dom.DomHelper", "goog.dom.TagName", "goog.dom.classes", "goog.dom.selection", "goog.editor.BrowserFeature", "goog.editor.Link", "goog.editor.focus", "goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.events.InputHandler", "goog.events.InputHandler.EventType", 
"goog.string", "goog.style", "goog.ui.Button", "goog.ui.LinkButtonRenderer", "goog.ui.editor.AbstractDialog", "goog.ui.editor.AbstractDialog.Builder", "goog.ui.editor.AbstractDialog.EventType", "goog.ui.editor.TabPane", "goog.ui.editor.messages", "goog.userAgent", "goog.window"]);
goog.addDependency("ui/editor/messages.js", ["goog.ui.editor.messages"], []);
goog.addDependency("ui/editor/tabpane.js", ["goog.ui.editor.TabPane"], ["goog.dom.TagName", "goog.events.EventHandler", "goog.ui.Component", "goog.ui.Control", "goog.ui.Tab", "goog.ui.TabBar"]);
goog.addDependency("ui/editor/toolbarcontroller.js", ["goog.ui.editor.ToolbarController"], ["goog.editor.Field.EventType", "goog.events.EventHandler", "goog.events.EventTarget", "goog.ui.Component.EventType"]);
goog.addDependency("ui/editor/toolbarfactory.js", ["goog.ui.editor.ToolbarFactory"], ["goog.array", "goog.dom", "goog.string", "goog.string.Unicode", "goog.style", "goog.ui.Component.State", "goog.ui.Container.Orientation", "goog.ui.ControlContent", "goog.ui.Option", "goog.ui.Toolbar", "goog.ui.ToolbarButton", "goog.ui.ToolbarColorMenuButton", "goog.ui.ToolbarMenuButton", "goog.ui.ToolbarRenderer", "goog.ui.ToolbarSelect", "goog.userAgent"]);
goog.addDependency("ui/emoji/emoji.js", ["goog.ui.emoji.Emoji"], []);
goog.addDependency("ui/emoji/emojipalette.js", ["goog.ui.emoji.EmojiPalette"], ["goog.events.Event", "goog.events.EventType", "goog.net.ImageLoader", "goog.ui.Palette", "goog.ui.emoji.Emoji", "goog.ui.emoji.EmojiPaletteRenderer"]);
goog.addDependency("ui/emoji/emojipaletterenderer.js", ["goog.ui.emoji.EmojiPaletteRenderer"], ["goog.dom", "goog.dom.a11y", "goog.ui.PaletteRenderer", "goog.ui.emoji.Emoji", "goog.ui.emoji.SpriteInfo"]);
goog.addDependency("ui/emoji/emojipicker.js", ["goog.ui.emoji.EmojiPicker"], ["goog.debug.Logger", "goog.dom", "goog.ui.Component", "goog.ui.TabPane", "goog.ui.TabPane.TabPage", "goog.ui.emoji.Emoji", "goog.ui.emoji.EmojiPalette", "goog.ui.emoji.EmojiPaletteRenderer", "goog.ui.emoji.ProgressiveEmojiPaletteRenderer"]);
goog.addDependency("ui/emoji/popupemojipicker.js", ["goog.ui.emoji.PopupEmojiPicker"], ["goog.dom", "goog.events.EventType", "goog.positioning.AnchoredPosition", "goog.ui.Component", "goog.ui.Popup", "goog.ui.emoji.EmojiPicker"]);
goog.addDependency("ui/emoji/progressiveemojipaletterenderer.js", ["goog.ui.emoji.ProgressiveEmojiPaletteRenderer"], ["goog.ui.emoji.EmojiPaletteRenderer"]);
goog.addDependency("ui/emoji/spriteinfo.js", ["goog.ui.emoji.SpriteInfo"], []);
goog.addDependency("ui/equation/arrowpalette.js", ["goog.ui.equation.ArrowPalette"], ["goog.math.Size", "goog.ui.equation.Palette"]);
goog.addDependency("ui/equation/changeevent.js", ["goog.ui.equation.ChangeEvent"], ["goog.events.Event", "goog.events.EventType"]);
goog.addDependency("ui/equation/comparisonpalette.js", ["goog.ui.equation.ComparisonPalette"], ["goog.math.Size", "goog.ui.equation.Palette"]);
goog.addDependency("ui/equation/editorpane.js", ["goog.ui.equation.EditorPane"], ["goog.dom", "goog.style", "goog.ui.Component"]);
goog.addDependency("ui/equation/equationeditor.js", ["goog.ui.equation.EquationEditor"], ["goog.dom", "goog.events", "goog.ui.Component", "goog.ui.Tab", "goog.ui.TabBar", "goog.ui.equation.EditorPane", "goog.ui.equation.ImageRenderer", "goog.ui.equation.TexPane"]);
goog.addDependency("ui/equation/equationeditordialog.js", ["goog.ui.equation.EquationEditorDialog"], ["goog.dom", "goog.ui.Dialog", "goog.ui.Dialog.ButtonSet", "goog.ui.equation.EquationEditor", "goog.ui.equation.ImageRenderer", "goog.ui.equation.TexEditor"]);
goog.addDependency("ui/equation/greekpalette.js", ["goog.ui.equation.GreekPalette"], ["goog.math.Size", "goog.ui.equation.Palette"]);
goog.addDependency("ui/equation/imagerenderer.js", ["goog.ui.equation.ImageRenderer"], ["goog.dom.TagName", "goog.dom.classes", "goog.string", "goog.uri.utils"]);
goog.addDependency("ui/equation/mathpalette.js", ["goog.ui.equation.MathPalette"], ["goog.math.Size", "goog.ui.equation.Palette"]);
goog.addDependency("ui/equation/menupalette.js", ["goog.ui.equation.MenuPalette", "goog.ui.equation.MenuPaletteRenderer"], ["goog.math.Size", "goog.style", "goog.ui.equation.Palette", "goog.ui.equation.PaletteRenderer"]);
goog.addDependency("ui/equation/palette.js", ["goog.ui.equation.Palette", "goog.ui.equation.PaletteEvent", "goog.ui.equation.PaletteRenderer"], ["goog.dom", "goog.dom.TagName", "goog.ui.Palette", "goog.ui.equation.ImageRenderer"]);
goog.addDependency("ui/equation/palettemanager.js", ["goog.ui.equation.PaletteManager"], ["goog.Timer", "goog.events.EventTarget", "goog.ui.equation.ArrowPalette", "goog.ui.equation.ComparisonPalette", "goog.ui.equation.GreekPalette", "goog.ui.equation.MathPalette", "goog.ui.equation.MenuPalette", "goog.ui.equation.Palette", "goog.ui.equation.SymbolPalette"]);
goog.addDependency("ui/equation/symbolpalette.js", ["goog.ui.equation.SymbolPalette"], ["goog.math.Size", "goog.ui.equation.Palette"]);
goog.addDependency("ui/equation/texeditor.js", ["goog.ui.equation.TexEditor"], ["goog.dom", "goog.ui.Component", "goog.ui.equation.ImageRenderer", "goog.ui.equation.TexPane"]);
goog.addDependency("ui/equation/texpane.js", ["goog.ui.equation.TexPane"], ["goog.Timer", "goog.dom", "goog.dom.TagName", "goog.dom.selection", "goog.events", "goog.events.EventType", "goog.events.InputHandler", "goog.string", "goog.style", "goog.ui.Component", "goog.ui.equation.ChangeEvent", "goog.ui.equation.EditorPane", "goog.ui.equation.ImageRenderer", "goog.ui.equation.PaletteManager"]);
goog.addDependency("ui/filteredmenu.js", ["goog.ui.FilteredMenu"], ["goog.dom", "goog.events.EventType", "goog.events.InputHandler", "goog.events.KeyCodes", "goog.string", "goog.ui.FilterObservingMenuItem", "goog.ui.Menu"]);
goog.addDependency("ui/filterobservingmenuitem.js", ["goog.ui.FilterObservingMenuItem"], ["goog.ui.ControlContent", "goog.ui.FilterObservingMenuItemRenderer", "goog.ui.MenuItem", "goog.ui.registry"]);
goog.addDependency("ui/filterobservingmenuitemrenderer.js", ["goog.ui.FilterObservingMenuItemRenderer"], ["goog.ui.MenuItemRenderer"]);
goog.addDependency("ui/flatbuttonrenderer.js", ["goog.ui.FlatButtonRenderer"], ["goog.dom.classes", "goog.ui.Button", "goog.ui.ButtonRenderer", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.registry"]);
goog.addDependency("ui/flatmenubuttonrenderer.js", ["goog.ui.FlatMenuButtonRenderer"], ["goog.style", "goog.ui.ControlContent", "goog.ui.FlatButtonRenderer", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.Menu", "goog.ui.MenuButton", "goog.ui.MenuRenderer", "goog.ui.registry"]);
goog.addDependency("ui/formpost.js", ["goog.ui.FormPost"], ["goog.array", "goog.dom.TagName", "goog.string", "goog.string.StringBuffer", "goog.ui.Component"]);
goog.addDependency("ui/gauge.js", ["goog.ui.Gauge", "goog.ui.GaugeColoredRange"], ["goog.dom", "goog.dom.a11y", "goog.fx.Animation", "goog.fx.Animation.EventType", "goog.fx.Transition.EventType", "goog.fx.easing", "goog.graphics", "goog.graphics.Font", "goog.graphics.Path", "goog.graphics.SolidFill", "goog.ui.Component", "goog.ui.GaugeTheme"]);
goog.addDependency("ui/gaugetheme.js", ["goog.ui.GaugeTheme"], ["goog.graphics.LinearGradient", "goog.graphics.SolidFill", "goog.graphics.Stroke"]);
goog.addDependency("ui/hovercard.js", ["goog.ui.HoverCard", "goog.ui.HoverCard.EventType", "goog.ui.HoverCard.TriggerEvent"], ["goog.dom", "goog.events", "goog.events.EventType", "goog.ui.AdvancedTooltip"]);
goog.addDependency("ui/hsvapalette.js", ["goog.ui.HsvaPalette"], ["goog.array", "goog.color", "goog.color.alpha", "goog.events.EventType", "goog.ui.Component.EventType", "goog.ui.HsvPalette"]);
goog.addDependency("ui/hsvpalette.js", ["goog.ui.HsvPalette"], ["goog.color", "goog.dom", "goog.dom.DomHelper", "goog.events", "goog.events.Event", "goog.events.EventType", "goog.events.InputHandler", "goog.style", "goog.style.bidi", "goog.ui.Component", "goog.ui.Component.EventType", "goog.userAgent"]);
goog.addDependency("ui/idgenerator.js", ["goog.ui.IdGenerator"], []);
goog.addDependency("ui/idletimer.js", ["goog.ui.IdleTimer"], ["goog.Timer", "goog.events", "goog.events.EventTarget", "goog.structs.Set", "goog.ui.ActivityMonitor"]);
goog.addDependency("ui/iframemask.js", ["goog.ui.IframeMask"], ["goog.Disposable", "goog.Timer", "goog.dom", "goog.dom.DomHelper", "goog.dom.iframe", "goog.events.EventHandler", "goog.events.EventTarget", "goog.style"]);
goog.addDependency("ui/imagelessbuttonrenderer.js", ["goog.ui.ImagelessButtonRenderer"], ["goog.dom.classes", "goog.ui.Button", "goog.ui.ControlContent", "goog.ui.CustomButtonRenderer", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.registry"]);
goog.addDependency("ui/imagelessmenubuttonrenderer.js", ["goog.ui.ImagelessMenuButtonRenderer"], ["goog.dom", "goog.dom.TagName", "goog.dom.classes", "goog.ui.ControlContent", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.MenuButton", "goog.ui.MenuButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/inputdatepicker.js", ["goog.ui.InputDatePicker"], ["goog.date.DateTime", "goog.dom", "goog.string", "goog.ui.Component", "goog.ui.DatePicker", "goog.ui.PopupBase", "goog.ui.PopupDatePicker"]);
goog.addDependency("ui/itemevent.js", ["goog.ui.ItemEvent"], ["goog.events.Event"]);
goog.addDependency("ui/keyboardshortcuthandler.js", ["goog.ui.KeyboardShortcutEvent", "goog.ui.KeyboardShortcutHandler", "goog.ui.KeyboardShortcutHandler.EventType"], ["goog.Timer", "goog.events", "goog.events.Event", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyNames", "goog.object"]);
goog.addDependency("ui/labelinput.js", ["goog.ui.LabelInput"], ["goog.Timer", "goog.dom", "goog.dom.a11y", "goog.dom.a11y.State", "goog.dom.classes", "goog.events.EventHandler", "goog.events.EventType", "goog.ui.Component", "goog.userAgent"]);
goog.addDependency("ui/linkbuttonrenderer.js", ["goog.ui.LinkButtonRenderer"], ["goog.ui.Button", "goog.ui.FlatButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/media/flashobject.js", ["goog.ui.media.FlashObject", "goog.ui.media.FlashObject.ScriptAccessLevel", "goog.ui.media.FlashObject.Wmodes"], ["goog.asserts", "goog.debug.Logger", "goog.events.EventHandler", "goog.string", "goog.structs.Map", "goog.style", "goog.ui.Component", "goog.ui.Component.Error", "goog.userAgent", "goog.userAgent.flash"]);
goog.addDependency("ui/media/flickr.js", ["goog.ui.media.FlickrSet", "goog.ui.media.FlickrSetModel"], ["goog.object", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaRenderer"]);
goog.addDependency("ui/media/googlevideo.js", ["goog.ui.media.GoogleVideo", "goog.ui.media.GoogleVideoModel"], ["goog.string", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaRenderer"]);
goog.addDependency("ui/media/media.js", ["goog.ui.media.Media", "goog.ui.media.MediaRenderer"], ["goog.style", "goog.ui.Component.State", "goog.ui.Control", "goog.ui.ControlRenderer"]);
goog.addDependency("ui/media/mediamodel.js", ["goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Category", "goog.ui.media.MediaModel.Credit", "goog.ui.media.MediaModel.Credit.Role", "goog.ui.media.MediaModel.Credit.Scheme", "goog.ui.media.MediaModel.Medium", "goog.ui.media.MediaModel.MimeType", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaModel.SubTitle", "goog.ui.media.MediaModel.Thumbnail"], ["goog.array"]);
goog.addDependency("ui/media/mp3.js", ["goog.ui.media.Mp3"], ["goog.string", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaRenderer"]);
goog.addDependency("ui/media/photo.js", ["goog.ui.media.Photo"], ["goog.ui.media.Media", "goog.ui.media.MediaRenderer"]);
goog.addDependency("ui/media/picasa.js", ["goog.ui.media.PicasaAlbum", "goog.ui.media.PicasaAlbumModel"], ["goog.object", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaRenderer"]);
goog.addDependency("ui/media/vimeo.js", ["goog.ui.media.Vimeo", "goog.ui.media.VimeoModel"], ["goog.string", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaRenderer"]);
goog.addDependency("ui/media/youtube.js", ["goog.ui.media.Youtube", "goog.ui.media.YoutubeModel"], ["goog.string", "goog.ui.Component.Error", "goog.ui.Component.State", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaModel.Thumbnail", "goog.ui.media.MediaRenderer"]);
goog.addDependency("ui/menu.js", ["goog.ui.Menu", "goog.ui.Menu.EventType"], ["goog.math.Coordinate", "goog.string", "goog.style", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.Container", "goog.ui.Container.Orientation", "goog.ui.MenuHeader", "goog.ui.MenuItem", "goog.ui.MenuRenderer", "goog.ui.MenuSeparator"]);
goog.addDependency("ui/menubar.js", ["goog.ui.menuBar"], ["goog.ui.MenuBarRenderer"]);
goog.addDependency("ui/menubardecorator.js", ["goog.ui.menuBarDecorator"], ["goog.ui.Container", "goog.ui.menuBar"]);
goog.addDependency("ui/menubarrenderer.js", ["goog.ui.MenuBarRenderer"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.ui.ContainerRenderer"]);
goog.addDependency("ui/menubase.js", ["goog.ui.MenuBase"], ["goog.events.EventHandler", "goog.events.EventType", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.ui.Popup"]);
goog.addDependency("ui/menubutton.js", ["goog.ui.MenuButton"], ["goog.Timer", "goog.dom", "goog.dom.a11y", "goog.dom.a11y.State", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler.EventType", "goog.math.Box", "goog.math.Rect", "goog.positioning", "goog.positioning.Corner", "goog.positioning.MenuAnchoredPosition", "goog.style", "goog.ui.Button", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.Menu", "goog.ui.MenuButtonRenderer", "goog.ui.registry", "goog.userAgent", 
"goog.userAgent.product"]);
goog.addDependency("ui/menubuttonrenderer.js", ["goog.ui.MenuButtonRenderer"], ["goog.dom", "goog.style", "goog.ui.CustomButtonRenderer", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.Menu", "goog.ui.MenuRenderer", "goog.userAgent"]);
goog.addDependency("ui/menuheader.js", ["goog.ui.MenuHeader"], ["goog.ui.Component.State", "goog.ui.Control", "goog.ui.MenuHeaderRenderer", "goog.ui.registry"]);
goog.addDependency("ui/menuheaderrenderer.js", ["goog.ui.MenuHeaderRenderer"], ["goog.dom", "goog.dom.classes", "goog.ui.ControlRenderer"]);
goog.addDependency("ui/menuitem.js", ["goog.ui.MenuItem"], ["goog.array", "goog.dom", "goog.dom.classes", "goog.events.KeyCodes", "goog.math.Coordinate", "goog.string", "goog.ui.Component.State", "goog.ui.Control", "goog.ui.ControlContent", "goog.ui.MenuItemRenderer", "goog.ui.registry"]);
goog.addDependency("ui/menuitemrenderer.js", ["goog.ui.MenuItemRenderer"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.classes", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.ui.ControlRenderer"]);
goog.addDependency("ui/menurenderer.js", ["goog.ui.MenuRenderer"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.ui.ContainerRenderer", "goog.ui.Separator"]);
goog.addDependency("ui/menuseparator.js", ["goog.ui.MenuSeparator"], ["goog.ui.MenuSeparatorRenderer", "goog.ui.Separator", "goog.ui.registry"]);
goog.addDependency("ui/menuseparatorrenderer.js", ["goog.ui.MenuSeparatorRenderer"], ["goog.dom", "goog.dom.classes", "goog.ui.ControlContent", "goog.ui.ControlRenderer"]);
goog.addDependency("ui/mockactivitymonitor.js", ["goog.ui.MockActivityMonitor"], ["goog.events.EventType", "goog.ui.ActivityMonitor"]);
goog.addDependency("ui/modalpopup.js", ["goog.ui.ModalPopup"], ["goog.Timer", "goog.asserts", "goog.dom", "goog.dom.TagName", "goog.dom.classes", "goog.dom.iframe", "goog.events", "goog.events.EventType", "goog.events.FocusHandler", "goog.fx.Transition", "goog.style", "goog.ui.Component", "goog.ui.PopupBase.EventType", "goog.userAgent"]);
goog.addDependency("ui/nativebuttonrenderer.js", ["goog.ui.NativeButtonRenderer"], ["goog.dom.classes", "goog.events.EventType", "goog.ui.ButtonRenderer", "goog.ui.Component.State"]);
goog.addDependency("ui/offlineinstalldialog.js", ["goog.ui.OfflineInstallDialog", "goog.ui.OfflineInstallDialog.ButtonKeyType", "goog.ui.OfflineInstallDialog.EnableScreen", "goog.ui.OfflineInstallDialog.InstallScreen", "goog.ui.OfflineInstallDialog.InstallingGearsScreen", "goog.ui.OfflineInstallDialog.ScreenType", "goog.ui.OfflineInstallDialog.UpgradeScreen", "goog.ui.OfflineInstallDialogScreen"], ["goog.Disposable", "goog.dom.classes", "goog.gears", "goog.string", "goog.string.StringBuffer", "goog.ui.Dialog", 
"goog.ui.Dialog.ButtonSet", "goog.ui.Dialog.EventType", "goog.window"]);
goog.addDependency("ui/offlinestatuscard.js", ["goog.ui.OfflineStatusCard", "goog.ui.OfflineStatusCard.EventType"], ["goog.dom", "goog.events.EventType", "goog.gears.StatusType", "goog.structs.Map", "goog.style", "goog.ui.Component", "goog.ui.Component.EventType", "goog.ui.ProgressBar"]);
goog.addDependency("ui/offlinestatuscomponent.js", ["goog.ui.OfflineStatusComponent", "goog.ui.OfflineStatusComponent.StatusClassNames"], ["goog.dom.classes", "goog.events.EventType", "goog.gears.StatusType", "goog.positioning", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.positioning.Overflow", "goog.ui.Component", "goog.ui.OfflineStatusCard.EventType", "goog.ui.Popup"]);
goog.addDependency("ui/option.js", ["goog.ui.Option"], ["goog.ui.Component.EventType", "goog.ui.ControlContent", "goog.ui.MenuItem", "goog.ui.registry"]);
goog.addDependency("ui/palette.js", ["goog.ui.Palette"], ["goog.array", "goog.dom", "goog.events.EventType", "goog.events.KeyCodes", "goog.math.Size", "goog.ui.Component.Error", "goog.ui.Component.EventType", "goog.ui.Control", "goog.ui.PaletteRenderer", "goog.ui.SelectionModel"]);
goog.addDependency("ui/paletterenderer.js", ["goog.ui.PaletteRenderer"], ["goog.array", "goog.dom", "goog.dom.NodeType", "goog.dom.a11y", "goog.dom.classes", "goog.style", "goog.ui.ControlRenderer", "goog.userAgent"]);
goog.addDependency("ui/plaintextspellchecker.js", ["goog.ui.PlainTextSpellChecker"], ["goog.Timer", "goog.dom", "goog.dom.a11y", "goog.events.EventHandler", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.style", "goog.ui.AbstractSpellChecker", "goog.ui.AbstractSpellChecker.AsyncResult", "goog.ui.Component.EventType", "goog.userAgent"]);
goog.addDependency("ui/popup.js", ["goog.ui.Popup", "goog.ui.Popup.AbsolutePosition", "goog.ui.Popup.AnchoredPosition", "goog.ui.Popup.AnchoredViewPortPosition", "goog.ui.Popup.ClientPosition", "goog.ui.Popup.Corner", "goog.ui.Popup.Overflow", "goog.ui.Popup.ViewPortClientPosition", "goog.ui.Popup.ViewPortPosition"], ["goog.math.Box", "goog.positioning", "goog.positioning.AbsolutePosition", "goog.positioning.AnchoredPosition", "goog.positioning.AnchoredViewportPosition", "goog.positioning.ClientPosition", 
"goog.positioning.Corner", "goog.positioning.Overflow", "goog.positioning.OverflowStatus", "goog.positioning.ViewportClientPosition", "goog.positioning.ViewportPosition", "goog.style", "goog.ui.PopupBase"]);
goog.addDependency("ui/popupbase.js", ["goog.ui.PopupBase", "goog.ui.PopupBase.EventType", "goog.ui.PopupBase.Type"], ["goog.Timer", "goog.dom", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.fx.Transition", "goog.fx.Transition.EventType", "goog.style", "goog.userAgent"]);
goog.addDependency("ui/popupcolorpicker.js", ["goog.ui.PopupColorPicker"], ["goog.dom.classes", "goog.events.EventType", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.ui.ColorPicker", "goog.ui.ColorPicker.EventType", "goog.ui.Component", "goog.ui.Popup"]);
goog.addDependency("ui/popupdatepicker.js", ["goog.ui.PopupDatePicker"], ["goog.events.EventType", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.style", "goog.ui.Component", "goog.ui.DatePicker", "goog.ui.DatePicker.Events", "goog.ui.Popup", "goog.ui.PopupBase.EventType"]);
goog.addDependency("ui/popupmenu.js", ["goog.ui.PopupMenu"], ["goog.events.EventType", "goog.positioning.AnchoredViewportPosition", "goog.positioning.Corner", "goog.positioning.MenuAnchoredPosition", "goog.positioning.ViewportClientPosition", "goog.structs", "goog.structs.Map", "goog.style", "goog.ui.Component.EventType", "goog.ui.Menu", "goog.ui.PopupBase", "goog.userAgent"]);
goog.addDependency("ui/progressbar.js", ["goog.ui.ProgressBar", "goog.ui.ProgressBar.Orientation"], ["goog.dom", "goog.dom.a11y", "goog.dom.classes", "goog.events", "goog.events.EventType", "goog.ui.Component", "goog.ui.Component.EventType", "goog.ui.RangeModel", "goog.userAgent"]);
goog.addDependency("ui/prompt.js", ["goog.ui.Prompt"], ["goog.Timer", "goog.dom", "goog.events", "goog.events.EventType", "goog.functions", "goog.ui.Component.Error", "goog.ui.Dialog", "goog.ui.Dialog.ButtonSet", "goog.ui.Dialog.DefaultButtonKeys", "goog.ui.Dialog.EventType", "goog.userAgent"]);
goog.addDependency("ui/rangemodel.js", ["goog.ui.RangeModel"], ["goog.events.EventTarget", "goog.ui.Component.EventType"]);
goog.addDependency("ui/ratings.js", ["goog.ui.Ratings", "goog.ui.Ratings.EventType"], ["goog.dom.a11y", "goog.dom.classes", "goog.events.EventType", "goog.ui.Component"]);
goog.addDependency("ui/registry.js", ["goog.ui.registry"], ["goog.dom.classes"]);
goog.addDependency("ui/richtextspellchecker.js", ["goog.ui.RichTextSpellChecker"], ["goog.Timer", "goog.dom", "goog.dom.NodeType", "goog.events", "goog.events.EventType", "goog.string.StringBuffer", "goog.ui.AbstractSpellChecker", "goog.ui.AbstractSpellChecker.AsyncResult"]);
goog.addDependency("ui/roundedpanel.js", ["goog.ui.BaseRoundedPanel", "goog.ui.CssRoundedPanel", "goog.ui.GraphicsRoundedPanel", "goog.ui.RoundedPanel", "goog.ui.RoundedPanel.Corner"], ["goog.dom", "goog.dom.classes", "goog.graphics", "goog.graphics.SolidFill", "goog.graphics.Stroke", "goog.math.Coordinate", "goog.style", "goog.ui.Component", "goog.userAgent"]);
goog.addDependency("ui/roundedtabrenderer.js", ["goog.ui.RoundedTabRenderer"], ["goog.dom", "goog.ui.Tab", "goog.ui.TabBar.Location", "goog.ui.TabRenderer", "goog.ui.registry"]);
goog.addDependency("ui/scrollfloater.js", ["goog.ui.ScrollFloater", "goog.ui.ScrollFloater.EventType"], ["goog.dom", "goog.dom.classes", "goog.events.EventType", "goog.object", "goog.style", "goog.ui.Component", "goog.userAgent"]);
goog.addDependency("ui/select.js", ["goog.ui.Select"], ["goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.events.EventType", "goog.ui.Component.EventType", "goog.ui.ControlContent", "goog.ui.MenuButton", "goog.ui.SelectionModel", "goog.ui.registry"]);
goog.addDependency("ui/selectionmenubutton.js", ["goog.ui.SelectionMenuButton", "goog.ui.SelectionMenuButton.SelectionState"], ["goog.events.EventType", "goog.ui.Component.EventType", "goog.ui.Menu", "goog.ui.MenuButton", "goog.ui.MenuItem"]);
goog.addDependency("ui/selectionmodel.js", ["goog.ui.SelectionModel"], ["goog.array", "goog.events.EventTarget", "goog.events.EventType"]);
goog.addDependency("ui/separator.js", ["goog.ui.Separator"], ["goog.dom.a11y", "goog.ui.Component.State", "goog.ui.Control", "goog.ui.MenuSeparatorRenderer", "goog.ui.registry"]);
goog.addDependency("ui/serverchart.js", ["goog.ui.ServerChart", "goog.ui.ServerChart.AxisDisplayType", "goog.ui.ServerChart.ChartType", "goog.ui.ServerChart.EncodingType", "goog.ui.ServerChart.Event", "goog.ui.ServerChart.LegendPosition", "goog.ui.ServerChart.MaximumValue", "goog.ui.ServerChart.MultiAxisAlignment", "goog.ui.ServerChart.MultiAxisType", "goog.ui.ServerChart.UriParam", "goog.ui.ServerChart.UriTooLongEvent"], ["goog.Uri", "goog.array", "goog.asserts", "goog.events.Event", "goog.string", 
"goog.ui.Component"]);
goog.addDependency("ui/slider.js", ["goog.ui.Slider", "goog.ui.Slider.Orientation"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.ui.SliderBase", "goog.ui.SliderBase.Orientation"]);
goog.addDependency("ui/sliderbase.js", ["goog.ui.SliderBase", "goog.ui.SliderBase.Orientation"], ["goog.Timer", "goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.dom.classes", "goog.events", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.events.MouseWheelHandler", "goog.events.MouseWheelHandler.EventType", "goog.fx.AnimationParallelQueue", "goog.fx.Dragger", "goog.fx.Dragger.EventType", "goog.fx.Transition.EventType", 
"goog.fx.dom.ResizeHeight", "goog.fx.dom.ResizeWidth", "goog.fx.dom.Slide", "goog.math", "goog.math.Coordinate", "goog.style", "goog.style.bidi", "goog.ui.Component", "goog.ui.Component.EventType", "goog.ui.RangeModel"]);
goog.addDependency("ui/splitbehavior.js", ["goog.ui.SplitBehavior", "goog.ui.SplitBehavior.DefaultHandlers"], ["goog.Disposable", "goog.array", "goog.dispose", "goog.dom", "goog.dom.DomHelper", "goog.dom.classes", "goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.string", "goog.ui.ButtonSide", "goog.ui.Component", "goog.ui.Component.Error", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.decorate", "goog.ui.registry"]);
goog.addDependency("ui/splitpane.js", ["goog.ui.SplitPane", "goog.ui.SplitPane.Orientation"], ["goog.dom", "goog.dom.classes", "goog.events.EventType", "goog.fx.Dragger", "goog.fx.Dragger.EventType", "goog.math.Rect", "goog.math.Size", "goog.style", "goog.ui.Component", "goog.ui.Component.EventType", "goog.userAgent"]);
goog.addDependency("ui/style/app/buttonrenderer.js", ["goog.ui.style.app.ButtonRenderer"], ["goog.dom.classes", "goog.ui.Button", "goog.ui.ControlContent", "goog.ui.CustomButtonRenderer", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.registry"]);
goog.addDependency("ui/style/app/menubuttonrenderer.js", ["goog.ui.style.app.MenuButtonRenderer"], ["goog.array", "goog.dom", "goog.dom.a11y.Role", "goog.style", "goog.ui.ControlContent", "goog.ui.Menu", "goog.ui.MenuRenderer", "goog.ui.style.app.ButtonRenderer"]);
goog.addDependency("ui/style/app/primaryactionbuttonrenderer.js", ["goog.ui.style.app.PrimaryActionButtonRenderer"], ["goog.ui.Button", "goog.ui.registry", "goog.ui.style.app.ButtonRenderer"]);
goog.addDependency("ui/submenu.js", ["goog.ui.SubMenu"], ["goog.Timer", "goog.dom", "goog.dom.classes", "goog.events.KeyCodes", "goog.positioning.AnchoredViewportPosition", "goog.positioning.Corner", "goog.style", "goog.ui.Component", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.ui.Menu", "goog.ui.MenuItem", "goog.ui.SubMenuRenderer", "goog.ui.registry"]);
goog.addDependency("ui/submenurenderer.js", ["goog.ui.SubMenuRenderer"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.State", "goog.dom.classes", "goog.style", "goog.ui.Menu", "goog.ui.MenuItemRenderer"]);
goog.addDependency("ui/tab.js", ["goog.ui.Tab"], ["goog.ui.Component.State", "goog.ui.Control", "goog.ui.ControlContent", "goog.ui.TabRenderer", "goog.ui.registry"]);
goog.addDependency("ui/tabbar.js", ["goog.ui.TabBar", "goog.ui.TabBar.Location"], ["goog.ui.Component.EventType", "goog.ui.Container", "goog.ui.Container.Orientation", "goog.ui.Tab", "goog.ui.TabBarRenderer", "goog.ui.registry"]);
goog.addDependency("ui/tabbarrenderer.js", ["goog.ui.TabBarRenderer"], ["goog.dom.a11y.Role", "goog.object", "goog.ui.ContainerRenderer"]);
goog.addDependency("ui/tablesorter.js", ["goog.ui.TableSorter", "goog.ui.TableSorter.EventType"], ["goog.array", "goog.dom", "goog.dom.TagName", "goog.dom.classes", "goog.events", "goog.events.EventType", "goog.functions", "goog.ui.Component"]);
goog.addDependency("ui/tabpane.js", ["goog.ui.TabPane", "goog.ui.TabPane.Events", "goog.ui.TabPane.TabLocation", "goog.ui.TabPane.TabPage", "goog.ui.TabPaneEvent"], ["goog.dom", "goog.dom.classes", "goog.events", "goog.events.Event", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.style"]);
goog.addDependency("ui/tabrenderer.js", ["goog.ui.TabRenderer"], ["goog.dom.a11y.Role", "goog.ui.Component.State", "goog.ui.ControlRenderer"]);
goog.addDependency("ui/textarea.js", ["goog.ui.Textarea", "goog.ui.Textarea.EventType"], ["goog.Timer", "goog.events.EventType", "goog.events.KeyCodes", "goog.style", "goog.ui.Control", "goog.ui.TextareaRenderer", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("ui/textarearenderer.js", ["goog.ui.TextareaRenderer"], ["goog.ui.Component.State", "goog.ui.ControlRenderer"]);
goog.addDependency("ui/togglebutton.js", ["goog.ui.ToggleButton"], ["goog.ui.Button", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.ui.CustomButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/toolbar.js", ["goog.ui.Toolbar"], ["goog.ui.Container", "goog.ui.ToolbarRenderer"]);
goog.addDependency("ui/toolbarbutton.js", ["goog.ui.ToolbarButton"], ["goog.ui.Button", "goog.ui.ControlContent", "goog.ui.ToolbarButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/toolbarbuttonrenderer.js", ["goog.ui.ToolbarButtonRenderer"], ["goog.ui.CustomButtonRenderer"]);
goog.addDependency("ui/toolbarcolormenubutton.js", ["goog.ui.ToolbarColorMenuButton"], ["goog.ui.ColorMenuButton", "goog.ui.ControlContent", "goog.ui.ToolbarColorMenuButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/toolbarcolormenubuttonrenderer.js", ["goog.ui.ToolbarColorMenuButtonRenderer"], ["goog.dom.classes", "goog.ui.ColorMenuButtonRenderer", "goog.ui.ControlContent", "goog.ui.MenuButtonRenderer", "goog.ui.ToolbarMenuButtonRenderer"]);
goog.addDependency("ui/toolbarmenubutton.js", ["goog.ui.ToolbarMenuButton"], ["goog.ui.ControlContent", "goog.ui.MenuButton", "goog.ui.ToolbarMenuButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/toolbarmenubuttonrenderer.js", ["goog.ui.ToolbarMenuButtonRenderer"], ["goog.ui.MenuButtonRenderer"]);
goog.addDependency("ui/toolbarrenderer.js", ["goog.ui.ToolbarRenderer"], ["goog.dom.a11y.Role", "goog.ui.Container.Orientation", "goog.ui.ContainerRenderer", "goog.ui.Separator", "goog.ui.ToolbarSeparatorRenderer"]);
goog.addDependency("ui/toolbarselect.js", ["goog.ui.ToolbarSelect"], ["goog.ui.ControlContent", "goog.ui.Select", "goog.ui.ToolbarMenuButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/toolbarseparator.js", ["goog.ui.ToolbarSeparator"], ["goog.ui.Separator", "goog.ui.ToolbarSeparatorRenderer", "goog.ui.registry"]);
goog.addDependency("ui/toolbarseparatorrenderer.js", ["goog.ui.ToolbarSeparatorRenderer"], ["goog.dom.classes", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.MenuSeparatorRenderer"]);
goog.addDependency("ui/toolbartogglebutton.js", ["goog.ui.ToolbarToggleButton"], ["goog.ui.ControlContent", "goog.ui.ToggleButton", "goog.ui.ToolbarButtonRenderer", "goog.ui.registry"]);
goog.addDependency("ui/tooltip.js", ["goog.ui.Tooltip", "goog.ui.Tooltip.CursorTooltipPosition", "goog.ui.Tooltip.ElementTooltipPosition", "goog.ui.Tooltip.State"], ["goog.Timer", "goog.array", "goog.dom", "goog.events", "goog.events.EventType", "goog.math.Box", "goog.math.Coordinate", "goog.positioning", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.positioning.Overflow", "goog.positioning.OverflowStatus", "goog.positioning.ViewportPosition", "goog.structs.Set", "goog.style", 
"goog.ui.Popup", "goog.ui.PopupBase"]);
goog.addDependency("ui/tree/basenode.js", ["goog.ui.tree.BaseNode", "goog.ui.tree.BaseNode.EventType"], ["goog.Timer", "goog.asserts", "goog.dom.a11y", "goog.events.KeyCodes", "goog.string", "goog.string.StringBuffer", "goog.style", "goog.ui.Component", "goog.userAgent"]);
goog.addDependency("ui/tree/treecontrol.js", ["goog.ui.tree.TreeControl"], ["goog.debug.Logger", "goog.dom.a11y", "goog.dom.classes", "goog.events.EventType", "goog.events.FocusHandler", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.ui.tree.BaseNode", "goog.ui.tree.TreeNode", "goog.ui.tree.TypeAhead", "goog.userAgent"]);
goog.addDependency("ui/tree/treenode.js", ["goog.ui.tree.TreeNode"], ["goog.ui.tree.BaseNode"]);
goog.addDependency("ui/tree/typeahead.js", ["goog.ui.tree.TypeAhead", "goog.ui.tree.TypeAhead.Offset"], ["goog.array", "goog.events.KeyCodes", "goog.string", "goog.structs.Trie"]);
goog.addDependency("ui/tristatemenuitem.js", ["goog.ui.TriStateMenuItem", "goog.ui.TriStateMenuItem.State"], ["goog.dom.classes", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.ui.MenuItem", "goog.ui.TriStateMenuItemRenderer", "goog.ui.registry"]);
goog.addDependency("ui/tristatemenuitemrenderer.js", ["goog.ui.TriStateMenuItemRenderer"], ["goog.dom.classes", "goog.ui.MenuItemRenderer"]);
goog.addDependency("ui/twothumbslider.js", ["goog.ui.TwoThumbSlider"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.ui.SliderBase"]);
goog.addDependency("ui/zippy.js", ["goog.ui.Zippy", "goog.ui.Zippy.Events", "goog.ui.ZippyEvent"], ["goog.dom", "goog.dom.a11y", "goog.dom.classes", "goog.events", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.style"]);
goog.addDependency("uri/uri.js", ["goog.Uri", "goog.Uri.QueryData"], ["goog.array", "goog.string", "goog.structs", "goog.structs.Map", "goog.uri.utils", "goog.uri.utils.ComponentIndex"]);
goog.addDependency("uri/utils.js", ["goog.uri.utils", "goog.uri.utils.ComponentIndex", "goog.uri.utils.QueryArray", "goog.uri.utils.QueryValue", "goog.uri.utils.StandardQueryParam"], ["goog.asserts", "goog.string", "goog.userAgent"]);
goog.addDependency("useragent/adobereader.js", ["goog.userAgent.adobeReader"], ["goog.string", "goog.userAgent"]);
goog.addDependency("useragent/flash.js", ["goog.userAgent.flash"], ["goog.string"]);
goog.addDependency("useragent/iphoto.js", ["goog.userAgent.iphoto"], ["goog.string", "goog.userAgent"]);
goog.addDependency("useragent/jscript.js", ["goog.userAgent.jscript"], ["goog.string"]);
goog.addDependency("useragent/picasa.js", ["goog.userAgent.picasa"], ["goog.string", "goog.userAgent"]);
goog.addDependency("useragent/platform.js", ["goog.userAgent.platform"], ["goog.userAgent"]);
goog.addDependency("useragent/product.js", ["goog.userAgent.product"], ["goog.userAgent"]);
goog.addDependency("useragent/product_isversion.js", ["goog.userAgent.product.isVersion"], ["goog.userAgent.product"]);
goog.addDependency("useragent/useragent.js", ["goog.userAgent"], ["goog.string"]);
goog.addDependency("vec/float32array.js", ["goog.vec.Float32Array"], []);
goog.addDependency("vec/float64array.js", ["goog.vec.Float64Array"], []);
goog.addDependency("vec/mat3.js", ["goog.vec.Mat3"], ["goog.vec", "goog.vec.Vec3"]);
goog.addDependency("vec/mat4.js", ["goog.vec.Mat4"], ["goog.vec", "goog.vec.Vec3", "goog.vec.Vec4"]);
goog.addDependency("vec/matrix3.js", ["goog.vec.Matrix3"], ["goog.vec"]);
goog.addDependency("vec/matrix4.js", ["goog.vec.Matrix4"], ["goog.vec", "goog.vec.Vec3", "goog.vec.Vec4"]);
goog.addDependency("vec/quaternion.js", ["goog.vec.Quaternion"], ["goog.vec", "goog.vec.Vec3", "goog.vec.Vec4"]);
goog.addDependency("vec/ray.js", ["goog.vec.Ray"], ["goog.vec.Vec3"]);
goog.addDependency("vec/vec.js", ["goog.vec"], ["goog.vec.Float32Array", "goog.vec.Float64Array"]);
goog.addDependency("vec/vec2.js", ["goog.vec.Vec2"], ["goog.vec"]);
goog.addDependency("vec/vec3.js", ["goog.vec.Vec3"], ["goog.vec"]);
goog.addDependency("vec/vec4.js", ["goog.vec.Vec4"], ["goog.vec"]);
goog.addDependency("webgl/webgl.js", ["goog.webgl"], []);
goog.addDependency("window/window.js", ["goog.window"], ["goog.string", "goog.userAgent"]);

