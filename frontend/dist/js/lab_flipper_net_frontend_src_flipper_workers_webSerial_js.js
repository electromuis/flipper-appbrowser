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

/***/ "./lab.flipper.net/frontend/src/flipper/workers/webSerial.js":
/*!*******************************************************************!*\
  !*** ./lab.flipper.net/frontend/src/flipper/workers/webSerial.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

eval("__webpack_require__(/*! core-js/modules/es.array.push.js */ \"./node_modules/core-js/modules/es.array.push.js\");\nonmessage = function (event) {\n  switch (event.data.operation) {\n    case 'connect':\n      connect();\n      break;\n    case 'disconnect':\n      disconnect();\n      break;\n    case 'read':\n      read(event.data.data);\n      break;\n    case 'stop reading':\n      reader.cancel();\n      break;\n    case 'write':\n      enqueue(event.data.data);\n      break;\n  }\n};\nlet port,\n  reader,\n  readComplete = false,\n  writerIdle = true;\nconst writeQueue = [];\nasync function connect() {\n  const filters = [{\n    usbVendorId: 0x0483,\n    usbProductId: 0x5740\n  }];\n  const ports = await navigator.serial.getPorts({\n    filters\n  });\n  port = ports[0];\n  port.open({\n    baudRate: 1\n  }).then(() => {\n    self.postMessage({\n      operation: 'connect',\n      status: 1\n    });\n  }).catch(async error => {\n    if (error.toString().includes('The port is already open')) {\n      await port.close();\n      return connect();\n    } else {\n      self.postMessage({\n        operation: 'connect',\n        status: 0,\n        error: error\n      });\n    }\n  });\n}\nfunction disconnect() {\n  if (port && !port.closed) {\n    port.close().then(() => {\n      self.postMessage({\n        operation: 'disconnect',\n        status: 1\n      });\n    }).catch(error => {\n      if (!error.toString().includes('The port is already closed.')) {\n        self.postMessage({\n          operation: 'disconnect',\n          status: 0,\n          error: error\n        });\n      }\n    });\n  }\n}\nfunction enqueue(entry) {\n  writeQueue.push(entry);\n  if (writerIdle) {\n    write();\n  }\n}\nasync function write() {\n  writerIdle = false;\n  while (writeQueue.length) {\n    const entry = writeQueue[0];\n    if (!port.writable) {\n      self.postMessage({\n        operation: 'write',\n        status: 0,\n        error: 'Writable stream closed'\n      });\n      return;\n    }\n    const writer = port.writable.getWriter();\n    if (entry.mode.startsWith('cli')) {\n      if (entry.mode === 'cli/delimited') {\n        entry.data.push('\\r\\n');\n      }\n      const encoder = new TextEncoder();\n      entry.data.forEach(async (line, i) => {\n        let message = line;\n        if (entry.data[i + 1]) {\n          message = line + '\\r\\n';\n        }\n        await writer.write(encoder.encode(message).buffer);\n      });\n    } else if (entry.mode === 'raw') {\n      await writer.write(entry.data[0].buffer);\n    } else {\n      throw new Error('Unknown write mode:', entry.mode);\n    }\n    await writer.close().then(() => {\n      writeQueue.shift();\n      self.postMessage({\n        operation: 'write/end'\n      });\n      self.postMessage({\n        operation: 'write',\n        status: 1\n      });\n    }).catch(error => {\n      self.postMessage({\n        operation: 'write',\n        status: 0,\n        error: error\n      });\n    });\n  }\n  writerIdle = true;\n}\nasync function read(mode) {\n  try {\n    reader = port.readable.getReader();\n  } catch (error) {\n    self.postMessage({\n      operation: 'read',\n      status: 0,\n      error: error\n    });\n    if (!error.toString().includes('locked to a reader')) {\n      throw error;\n    }\n  }\n  const decoder = new TextDecoder();\n  let buffer = new Uint8Array(0);\n  readComplete = false;\n  while (!readComplete) {\n    await reader.read().then(({\n      done,\n      value\n    }) => {\n      if (done) {\n        readComplete = true;\n      } else {\n        if (mode) {\n          self.postMessage({\n            operation: mode + ' output',\n            data: value\n          });\n        } else {\n          const newBuffer = new Uint8Array(buffer.length + value.length);\n          newBuffer.set(buffer);\n          newBuffer.set(value, buffer.length);\n          buffer = newBuffer;\n          if (decoder.decode(buffer.slice(-12)).replace(/\\s/g, '').endsWith('>:\\x07')) {\n            readComplete = true;\n            self.postMessage({\n              operation: 'read',\n              data: 'read',\n              status: 1\n            });\n          }\n        }\n      }\n    }).catch(error => {\n      if (error.toString().includes('The device has been lost.')) {\n        readComplete = true;\n      } else {\n        throw error;\n      }\n    });\n  }\n  await reader.cancel().then(() => {\n    self.postMessage({\n      operation: 'read',\n      status: 1,\n      data: buffer\n    });\n  }).catch(error => {\n    self.postMessage({\n      operation: 'read',\n      status: 0,\n      error: error\n    });\n  });\n}\n\n//# sourceURL=webpack://flipper-appbrowser/./lab.flipper.net/frontend/src/flipper/workers/webSerial.js?");

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
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["node_modules_core-js_modules_es_array_push_js"], function() { return __webpack_require__("./lab.flipper.net/frontend/src/flipper/workers/webSerial.js"); })
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
/******/ 			"lab_flipper_net_frontend_src_flipper_workers_webSerial_js": 1
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