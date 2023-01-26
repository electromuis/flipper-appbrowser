/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./lab.flipper.net/frontend/src/untar/untar-worker.js":
/*!************************************************************!*\
  !*** ./lab.flipper.net/frontend/src/untar/untar-worker.js ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

eval("__webpack_require__(/*! core-js/modules/es.array.push.js */ \"./node_modules/core-js/modules/es.array.push.js\");\nfunction UntarWorker() {}\nUntarWorker.prototype = {\n  onmessage: function (msg) {\n    try {\n      if (msg.data.type === 'extract') {\n        this.untarBuffer(msg.data.buffer);\n      } else {\n        throw new Error('Unknown message type: ' + msg.data.type);\n      }\n    } catch (err) {\n      this.postError(err);\n    }\n  },\n  postError: function (err) {\n    // console.info(\"postError(\" + err.message + \")\" + \" \" + JSON.stringify(err));\n    this.postMessage({\n      type: 'error',\n      data: {\n        message: err.message\n      }\n    });\n  },\n  postLog: function (level, msg) {\n    // console.info(\"postLog\");\n    this.postMessage({\n      type: 'log',\n      data: {\n        level: level,\n        msg: msg\n      }\n    });\n  },\n  untarBuffer: function (arrayBuffer) {\n    try {\n      const tarFileStream = new UntarFileStream(arrayBuffer);\n      while (tarFileStream.hasNext()) {\n        const file = tarFileStream.next();\n        this.postMessage({\n          type: 'extract',\n          data: file\n        }, [file.buffer]);\n      }\n      this.postMessage({\n        type: 'complete'\n      });\n    } catch (err) {\n      this.postError(err);\n    }\n  },\n  postMessage: function (msg, transfers) {\n    // console.info(\"postMessage(\" + msg + \", \" + JSON.stringify(transfers) + \")\");\n    self.postMessage(msg, transfers);\n  }\n};\nif (typeof self !== 'undefined') {\n  // We're running in a worker thread\n  const worker = new UntarWorker();\n  self.onmessage = function (msg) {\n    worker.onmessage(msg);\n  };\n}\n\n// Source: https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330\n// Unmarshals an Uint8Array to string.\nfunction decodeUTF8(bytes) {\n  let s = '';\n  let i = 0;\n  while (i < bytes.length) {\n    let c = bytes[i++];\n    if (c > 127) {\n      if (c > 191 && c < 224) {\n        if (i >= bytes.length) throw new Error('UTF-8 decode: incomplete 2-byte sequence');\n        c = (c & 31) << 6 | bytes[i] & 63;\n      } else if (c > 223 && c < 240) {\n        if (i + 1 >= bytes.length) throw new Error('UTF-8 decode: incomplete 3-byte sequence');\n        c = (c & 15) << 12 | (bytes[i] & 63) << 6 | bytes[++i] & 63;\n      } else if (c > 239 && c < 248) {\n        if (i + 2 >= bytes.length) throw new Error('UTF-8 decode: incomplete 4-byte sequence');\n        c = (c & 7) << 18 | (bytes[i] & 63) << 12 | (bytes[++i] & 63) << 6 | bytes[++i] & 63;\n      } else throw new Error('UTF-8 decode: unknown multibyte start 0x' + c.toString(16) + ' at index ' + (i - 1));\n      ++i;\n    }\n    if (c <= 0xffff) s += String.fromCharCode(c);else if (c <= 0x10ffff) {\n      c -= 0x10000;\n      s += String.fromCharCode(c >> 10 | 0xd800);\n      s += String.fromCharCode(c & 0x3FF | 0xdc00);\n    } else throw new Error('UTF-8 decode: code point 0x' + c.toString(16) + ' exceeds UTF-16 reach');\n  }\n  return s;\n}\nfunction PaxHeader(fields) {\n  this._fields = fields;\n}\nPaxHeader.parse = function (buffer) {\n  // https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.bpxa500/paxex.htm\n  // An extended header shall consist of one or more records, each constructed as follows:\n  // \"%d %s=%s\\n\", <length>, <keyword>, <value>\n\n  // The extended header records shall be encoded according to the ISO/IEC10646-1:2000 standard (UTF-8).\n  // The <length> field, <blank>, equals sign, and <newline> shown shall be limited to the portable character set, as\n  // encoded in UTF-8. The <keyword> and <value> fields can be any UTF-8 characters. The <length> field shall be the\n  // decimal length of the extended header record in octets, including the trailing <newline>.\n\n  let bytes = new Uint8Array(buffer);\n  const fields = [];\n  while (bytes.length > 0) {\n    // Decode bytes up to the first space character; that is the total field length\n    const fieldLength = parseInt(decodeUTF8(bytes.subarray(0, bytes.indexOf(0x20))));\n    const fieldText = decodeUTF8(bytes.subarray(0, fieldLength));\n    const fieldMatch = fieldText.match(/^\\d+ ([^=]+)=(.*)\\n$/);\n    if (fieldMatch === null) {\n      throw new Error('Invalid PAX header data format.');\n    }\n    const fieldName = fieldMatch[1];\n    let fieldValue = fieldMatch[2];\n    if (fieldValue.length === 0) {\n      fieldValue = null;\n    } else if (fieldValue.match(/^\\d+$/) !== null) {\n      // If it's a integer field, parse it as int\n      fieldValue = parseInt(fieldValue);\n    }\n    // Don't parse float values since precision is lost\n\n    const field = {\n      name: fieldName,\n      value: fieldValue\n    };\n    fields.push(field);\n    bytes = bytes.subarray(fieldLength); // Cut off the parsed field data\n  }\n\n  return new PaxHeader(fields);\n};\nPaxHeader.prototype = {\n  applyHeader: function (file) {\n    // Apply fields to the file\n    // If a field is of value null, it should be deleted from the file\n    // https://www.mkssoftware.com/docs/man4/pax.4.asp\n\n    this._fields.forEach(function (field) {\n      let fieldName = field.name;\n      const fieldValue = field.value;\n      if (fieldName === 'path') {\n        // This overrides the name and prefix fields in the following header block.\n        fieldName = 'name';\n        if (file.prefix !== undefined) {\n          delete file.prefix;\n        }\n      } else if (fieldName === 'linkpath') {\n        // This overrides the linkname field in the following header block.\n        fieldName = 'linkname';\n      }\n      if (fieldValue === null) {\n        delete file[fieldName];\n      } else {\n        file[fieldName] = fieldValue;\n      }\n    });\n  }\n};\nfunction LongFieldHeader(fieldName, fieldValue) {\n  this._fieldName = fieldName;\n  this._fieldValue = fieldValue;\n}\nLongFieldHeader.parse = function (fieldName, buffer) {\n  const bytes = new Uint8Array(buffer);\n  return new LongFieldHeader(fieldName, decodeUTF8(bytes));\n};\nLongFieldHeader.prototype = {\n  applyHeader: function (file) {\n    file[this._fieldName] = this._fieldValue;\n  }\n};\nfunction TarFile() {}\nfunction UntarStream(arrayBuffer) {\n  this._bufferView = new DataView(arrayBuffer);\n  this._position = 0;\n}\nUntarStream.prototype = {\n  readString: function (charCount) {\n    // console.log(\"readString: position \" + this.position() + \", \" + charCount + \" chars\");\n    const charSize = 1;\n    const byteCount = charCount * charSize;\n    const charCodes = [];\n    for (let i = 0; i < charCount; ++i) {\n      const charCode = this._bufferView.getUint8(this.position() + i * charSize, true);\n      if (charCode !== 0) {\n        charCodes.push(charCode);\n      } else {\n        break;\n      }\n    }\n    this.seek(byteCount);\n    return String.fromCharCode.apply(null, charCodes);\n  },\n  readBuffer: function (byteCount) {\n    let buf;\n    if (typeof ArrayBuffer.prototype.slice === 'function') {\n      buf = this._bufferView.buffer.slice(this.position(), this.position() + byteCount);\n    } else {\n      buf = new ArrayBuffer(byteCount);\n      const target = new Uint8Array(buf);\n      const src = new Uint8Array(this._bufferView.buffer, this.position(), byteCount);\n      target.set(src);\n    }\n    this.seek(byteCount);\n    return buf;\n  },\n  seek: function (byteCount) {\n    this._position += byteCount;\n  },\n  peekUint32: function () {\n    return this._bufferView.getUint32(this.position(), true);\n  },\n  position: function (newpos) {\n    if (newpos === undefined) {\n      return this._position;\n    } else {\n      this._position = newpos;\n    }\n  },\n  size: function () {\n    return this._bufferView.byteLength;\n  }\n};\nfunction UntarFileStream(arrayBuffer) {\n  this._stream = new UntarStream(arrayBuffer);\n  this._globalPaxHeader = null;\n}\nUntarFileStream.prototype = {\n  hasNext: function () {\n    // A tar file ends with 4 zero bytes\n    return this._stream.position() + 4 < this._stream.size() && this._stream.peekUint32() !== 0;\n  },\n  next: function () {\n    return this._readNextFile();\n  },\n  _readNextFile: function () {\n    const stream = this._stream;\n    let file = new TarFile();\n    let isHeaderFile = false;\n    let header = null;\n    const headerBeginPos = stream.position();\n    const dataBeginPos = headerBeginPos + 512;\n\n    // Read header\n    file.name = stream.readString(100);\n    file.mode = stream.readString(8);\n    file.uid = parseInt(stream.readString(8));\n    file.gid = parseInt(stream.readString(8));\n    file.size = parseInt(stream.readString(12), 8);\n    file.mtime = parseInt(stream.readString(12), 8);\n    file.checksum = parseInt(stream.readString(8));\n    file.type = stream.readString(1);\n    file.linkname = stream.readString(100);\n    file.ustarFormat = stream.readString(6);\n    if (file.ustarFormat.indexOf('ustar') > -1) {\n      file.version = stream.readString(2);\n      file.uname = stream.readString(32);\n      file.gname = stream.readString(32);\n      file.devmajor = parseInt(stream.readString(8));\n      file.devminor = parseInt(stream.readString(8));\n      file.namePrefix = stream.readString(155);\n      if (file.namePrefix.length > 0) {\n        file.name = file.namePrefix + '/' + file.name;\n      }\n    }\n    stream.position(dataBeginPos);\n\n    // Derived from https://www.mkssoftware.com/docs/man4/pax.4.asp\n    // and https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.bpxa500/pxarchfm.htm\n    switch (file.type) {\n      case '0': // Normal file is either \"0\" or \"\\0\".\n      case '':\n        // In case of \"\\0\", readString returns an empty string, that is \"\".\n        file.buffer = stream.readBuffer(file.size);\n        break;\n      case '1':\n        // Link to another file already archived\n        // TODO Should we do anything with these?\n        break;\n      case '2':\n        // Symbolic link\n        // TODO Should we do anything with these?\n        break;\n      case '3':\n        // Character special device (what does this mean??)\n        break;\n      case '4':\n        // Block special device\n        break;\n      case '5':\n        // Directory\n        break;\n      case '6':\n        // FIFO special file\n        break;\n      case '7':\n        // Reserved\n        break;\n      case 'g':\n        // Global PAX header\n        isHeaderFile = true;\n        this._globalHeader = PaxHeader.parse(stream.readBuffer(file.size));\n        break;\n      case 'K':\n        isHeaderFile = true;\n        header = LongFieldHeader.parse('linkname', stream.readBuffer(file.size));\n        break;\n      case 'L':\n        // Indicates that the next file has a long name (over 100 chars), and therefore keeps the name of the file in this block's buffer. http://www.gnu.org/software/tar/manual/html_node/Standard.html\n        isHeaderFile = true;\n        header = LongFieldHeader.parse('name', stream.readBuffer(file.size));\n        break;\n      case 'x':\n        // PAX header\n        isHeaderFile = true;\n        header = PaxHeader.parse(stream.readBuffer(file.size));\n        break;\n      default:\n        // Unknown file type\n        break;\n    }\n    if (file.buffer === undefined) {\n      file.buffer = new ArrayBuffer(0);\n    }\n    let dataEndPos = dataBeginPos + file.size;\n\n    // File data is padded to reach a 512 byte boundary; skip the padded bytes too.\n    if (file.size % 512 !== 0) {\n      dataEndPos += 512 - file.size % 512;\n    }\n    stream.position(dataEndPos);\n    if (isHeaderFile) {\n      file = this._readNextFile();\n    }\n    if (this._globalPaxHeader !== null) {\n      this._globalPaxHeader.applyHeader(file);\n    }\n    if (header !== null) {\n      header.applyHeader(file);\n    }\n    return file;\n  }\n};\n\n//# sourceURL=webpack://flipper-appbrowser/./lab.flipper.net/frontend/src/untar/untar-worker.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = function() {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["node_modules_core-js_modules_es_array_push_js"], function() { return __webpack_require__("./lab.flipper.net/frontend/src/untar/untar-worker.js"); })
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	!function() {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = function(result, chunkIds, fn, priority) {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var chunkIds = deferred[i][0];
/******/ 				var fn = deferred[i][1];
/******/ 				var priority = deferred[i][2];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every(function(key) { return __webpack_require__.O[key](chunkIds[j]); })) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	!function() {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = function(chunkId) {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce(function(promises, key) {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	!function() {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = function(chunkId) {
/******/ 			// return url for filenames based on template
/******/ 			return "js/" + chunkId + ".js";
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	!function() {
/******/ 		__webpack_require__.p = "/";
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	!function() {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"lab_flipper_net_frontend_src_untar_untar-worker_js": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = function(data) {
/******/ 			var chunkIds = data[0];
/******/ 			var moreModules = data[1];
/******/ 			var runtime = data[2];
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = function(chunkId, promises) {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkflipper_appbrowser"] = self["webpackChunkflipper_appbrowser"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	!function() {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = function() {
/******/ 			return __webpack_require__.e("node_modules_core-js_modules_es_array_push_js").then(next);
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	
/******/ })()
;