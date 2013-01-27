/*
 * fuel
 * https://github.com/ExactTarget/node-fuel
 *
 * Copyright (c) 2013 ExactTarget
 * Licensed under the MIT license.
 */

var request = require('request');

function fuel(options, callback) {

	fuel.token(options, function (error, response, body) {
		if (error) {
			callback(error);
		} else {
			options.json = true;
			options.headers = options.headers || {};
			options.headers.authorization = 'Bearer ' + body.accessToken;

			fuel._performRequest(options, callback);
		}
	});
}

fuel.token = function (options, callback) {

	if (!fuel._validateOptions(options, callback)) return;

	var authOptions = {
		url: options.authUrl,
		method: 'POST',
		json: true,
		body: {
			clientId: options.clientId,
			clientSecret: options.clientSecret
		}
	};

	if (options.accessType) authOptions.body.accessType = options.accessType;
	if (options.refreshToken) authOptions.body.refreshToken = options.refreshToken;
	if (options.scope) authOptions.body.scope = options.scope;

	var authOptionsHash = fuel._authOptionsHash(authOptions);

	if (fuel._refreshTokenCache[authOptionsHash]) {
		authOptions.body.refreshToken = fuel._refreshTokenCache[authOptionsHash];
	}

	fuel._performTokenRequest(authOptions, function (error, response, body) {
		if (error) {
			callback(error);
		} else {
			if (body.refreshToken) {
				fuel._refreshTokenCache[authOptionsHash] = body.refreshToken;
			}
			callback(error, response, body);
		}
	});
};

fuel.configure = createConfigurationWrapper(fuel);
fuel.token.configure = createConfigurationWrapper(fuel.token);

fuel._validateOptions = function (options, callback) {
	var message = null;

	// When validating, handle the negations first
	if( options == null ) {
		message = 'options object is required';
	} else if( !options.authUrl) {
		message = 'authUrl is required';
	} else if( !options.clientId || !fuel._verifyAPIKey( 'clientId', options.clientId ) ) {
		message = 'clientId is missing or invalid';
	} else if( !options.clientSecret || !fuel._verifyAPIKey( 'clientSecret', options.clientSecret )) {
		message = 'clientSecret is missing or invalid';
	}
	
	// Something is wrong, notifiy the user
	if( null !== message ) {
		callback( new Error( message ) );
		return false;
	} else {
		// Should only be here if all is well
		return true;
	}
};

fuel._verifyAPIKey = function( APIKeyType, key ) {
	var message = null;
	var check = false;
	var idPattern = /^[a-z0-9]{24}$/;
	var secretPattern = /^[a-zA-Z0-9]{24}$/;
	if( 'clientId' == APIKeyType ) {
		check = idPattern.test( key );
	} else if( 'clientSecret' == APIKeyType ) {
		check = secretPattern.test( key );
	}
	
	return check;
};

fuel._removeAuthOptions = function (options) {
	options = deepExtend({}, options);
	delete options.clientId;
	delete options.clientSecret;
	delete options.refreshToken;
	delete options.accessType;
	delete options.authUrl;
	delete options.scope;
	return options;
};

fuel._performRequest = function (options, callback) {
	return request(fuel._removeAuthOptions(options), callback);
};

fuel._performTokenRequest = memoize(fuel._performRequest, function (options) {
	return fuel._authOptionsHash(options);
}, function (error, response, body) {
	if (!error) return (body.expiresIn - 30) * 1000;
});

fuel._authOptionsHash = function (options) {
	return options.url + options.body.clientId + options.body.scope;
};

fuel._refreshTokenCache = {};

module.exports = fuel;


// Utility

function deepExtend(dest, source) {
	for (var prop in source) {
		if (Object.prototype.toString.call(source[prop]) === "[object Array]") {
			dest[prop] = dest[prop] || [];
			source[prop].forEach(function(value, index) {
				if (typeof value === 'object') {
					dest[prop][index] = deepExtend({}, value);
				} else {
					dest[prop][index] = value;
				}
			});
		} else if (typeof source[prop] === 'object' && source[prop] !== null ) {
			dest[prop] = dest[prop] || {};
			deepExtend(dest[prop], source[prop]);
		} else {
			dest[prop] = source[prop];
		}
	}
	return dest;
}

function createConfigurationWrapper(func) {
	return function (storedOptions) {
		return function (options, callback) {
			if (!callback) {
				callback = options;
				options = {};
			}
			return func(deepExtend(storedOptions, options), callback);
		};
	};
}

function memoize(fn, hasher, invalidator) {
	var memo = {};
	var queues = {};
	hasher = hasher || function (x) {
		return x;
	};
	invalidator = invalidator || function () {};
	var memoized = function () {
		var args = Array.prototype.slice.call(arguments);
		var callback = args.pop();
		var key = hasher.apply(null, args);
		if (key in memo) {
			callback.apply(null, memo[key]);
		}
		else if (key in queues) {
			queues[key].push(callback);
		}
		else {
			queues[key] = [callback];
			fn.apply(null, args.concat([function () {
				var timeout = invalidator.apply(null, arguments);
				if (timeout) {
					setTimeout(function () {
						delete memo[key];
					}, timeout);
				}
				memo[key] = arguments;
				var q = queues[key];
				delete queues[key];
				for (var i = 0, l = q.length; i < l; i++) {
					q[i].apply(null, arguments);
				}
			}]));
		}
	};
	memoized.unmemoized = fn;
	return memoized;
}
