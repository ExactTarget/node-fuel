var fuel = require('../lib/fuel.js');

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

exports['module basics'] = {
	'initializes': function (test) {
		test.expect(4);
		test.equal(typeof fuel, 'function', 'fuel should be a function');
		test.equal(typeof fuel.configure, 'function', 'fuel.configure should be a function');
		test.equal(typeof fuel.token, 'function', 'fuel.token should be a function');
		test.equal(typeof fuel.token.configure, 'function', 'fuel.token should be a function');
		test.done();
	},

	'validates options': function (test) {
		test.expect(2);
		fuel({}, function (error) {
			test.ok(error instanceof Error, 'should call callback with error object');
			test.equal(typeof error.message, 'string', 'error should contain a string message');
			test.done();
		});
	}
};

exports['module validation'] = {
	setUp: function (done) {
		stubCallback.callbackCount = 0;
		stubCallback.error = null;
		done();
	},

	tearDown: function (done) {
		stubCallback.callbackCount = 0;
		stubCallback.error = null;
		done();
	},

	'validates null options': function (test) {
		var valid = fuel._validateOptions(null, stubCallback);

		test.ok(stubCallback.error instanceof Error, 'should call callback with error object');
		test.strictEqual(stubCallback.error.message, 'options object is required', 'should return expected message');
		test.strictEqual(stubCallback.callbackCount, 1, 'should call the callback once');
		test.strictEqual(valid, false, 'should indicate validation failure');
		test.done();
	},

	'validates empty options': function (test) {
		var valid = fuel._validateOptions({}, stubCallback);

		test.ok(stubCallback.error instanceof Error, 'should call callback with error object');
		test.strictEqual(stubCallback.error.message, 'authUrl is required', 'should return expected message');
		test.strictEqual(stubCallback.callbackCount, 1, 'should call the callback once');
		test.strictEqual(valid, false, 'should indicate validation failure');
		test.done();
	},

	'validates missing clientId': function (test) {
		var valid = fuel._validateOptions({ authUrl: 'a' }, stubCallback);

		test.ok(stubCallback.error instanceof Error, 'should call callback with error object');
		test.strictEqual(stubCallback.error.message, 'clientId is missing or invalid', 'should return expected message');
		test.strictEqual(stubCallback.callbackCount, 1, 'should call the callback once');
		test.strictEqual(valid, false, 'should indicate validation failure');
		test.done();
	},

	'validates invalid clientId': function (test) {
		var valid = fuel._validateOptions({ authUrl: 'a', clientId: [] }, stubCallback);

		test.ok(stubCallback.error instanceof Error, 'should call callback with error object');
		test.strictEqual(stubCallback.error.message, 'clientId is missing or invalid', 'should return expected message');
		test.strictEqual(stubCallback.callbackCount, 1, 'should call the callback once');
		test.strictEqual(valid, false, 'should indicate validation failure');
		test.done();
	},

	'validates missing clientSecret': function (test) {
		var valid = fuel._validateOptions({ authUrl: 'a', clientId: 'iiiiiiiiiiiiiiiiiiiiiiii' }, stubCallback);

		test.ok(stubCallback.error instanceof Error, 'should call callback with error object');
		test.strictEqual(stubCallback.error.message, 'clientSecret is missing or invalid', 'should return expected message');
		test.strictEqual(stubCallback.callbackCount, 1, 'should call the callback once');
		test.strictEqual(valid, false, 'should indicate validation failure');
		test.done();
	},

	'validates invalid clientSecret': function (test) {
		var valid = fuel._validateOptions({ authUrl: 'a', clientId: 'iiiiiiiiiiiiiiiiiiiiiiii', clientSecret: [] }, stubCallback);

		test.ok(stubCallback.error instanceof Error, 'should call callback with error object');
		test.strictEqual(stubCallback.error.message, 'clientSecret is missing or invalid', 'should return expected message');
		test.strictEqual(stubCallback.callbackCount, 1, 'should call the callback once');
		test.strictEqual(valid, false, 'should indicate validation failure');
		test.done();
	},

	'validates valid options': function (test) {
		var valid = fuel._validateOptions({
			authUrl: 'a',
			clientId: 'iiiiiiiiiiiiiiiiiiiiiiii',
			clientSecret: 'ssssssssssssssssssssssss'
		}, stubCallback);

		test.strictEqual(stubCallback.callbackCount, 0, 'should not call the callback');
		test.strictEqual(valid, true, 'should indicate validation success');
		test.done();
	}
};

exports['fuel requests and config'] = {
	setUp: function (done) {
		this._performRequest = fuel._performRequest;
		fuel._performRequest = stubEchoRequest;
		this._performTokenRequest = fuel._performTokenRequest;
		fuel._performTokenRequest = stubTokenRequest;
		done();
	},

	tearDown: function (done) {
		fuel._performRequest = this._performRequest;
		fuel._performTokenRequest = this._performTokenRequest;
		done();
	},

	'handles a basic request': function (test) {
		test.expect(2);

		fuel({
			url: 'apiurl',
			method: 'PATCH',
			authUrl: 'auth',
			clientId: 'yyyyyyyyyyyyyyyyyyyyyyyy',
			clientSecret: 'zzzzzzzzzzzzzzzzzzzzzzzz',
			body: 'zzzzz',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		}, function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'apiurl',
				method: 'PATCH',
				json: true,
				headers: {
					authorization: 'Bearer stubtoken'
				},
				body: 'zzzzz'
			}, 'should construct the appropriate request');

			test.done();
		});
	},

	'handles invalid token response': function (test) {
		test.expect(2);

		fuel({
			url: 'apiurl',
			method: 'PATCH',
			authUrl: 'authbad',
			clientId: 'yyyyyyyyyyyyyyyyyyyyyyyy',
			clientSecret: 'zzzzzzzzzzzzzzzzzzzzzzzz',
			body: 'zzzzz',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		}, function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'apiurl',
				method: 'PATCH',
				json: true,
				headers: {
					authorization: 'Bearer stubtoken'
				},
				body: 'zzzzz'
			}, 'should construct the appropriate request');

			test.done();
		});
	},

	'manages separate configurations': function (test) {
		test.expect(4);

		var fuela = fuel.configure({
			authUrl: 'auth',
			clientId: 'yyyyyyyyyyyyyyyyyyyyyyyy',
			clientSecret: 'zzzzzzzzzzzzzzzzzzzzzzzz',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		});

		var fuelx = fuel.configure({
			authUrl: 'auth2',
			clientId: 'yyyyyyyyyyyyyyyyyyyyyyyy',
			clientSecret: 'zzzzzzzzzzzzzzzzzzzzzzzz',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		});

		fuela({ url: 'apiurla', method: 'PATCH', body: 'zzzzz' }, function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'apiurla',
				method: 'PATCH',
				json: true,
				headers: {
					authorization: 'Bearer stubtoken'
				},
				body: 'zzzzz'
			}, 'should construct the appropriate fuela request');
		});

		fuelx({ url: 'apiurlx', method: 'PATCH', body: 'zzzzz' }, function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'apiurlx',
				method: 'PATCH',
				json: true,
				headers: {
					authorization: 'Bearer stubtoken2'
				},
				body: 'zzzzz'
			}, 'should construct the appropriate fuelx request');

			test.done();
		});
	},

	'manages multiple requests without colliding': function (test) {
		test.expect(4);

		var fuela = fuel.configure({
			authUrl: 'auth',
			clientId: 'yyyyyyyyyyyyyyyyyyyyyyyy',
			clientSecret: 'zzzzzzzzzzzzzzzzzzzzzzzz',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		});

		fuela({ url: 'apiurla', method: 'PATCH', body: { one: true } }, function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'apiurla',
				method: 'PATCH',
				json: true,
				headers: {
					authorization: 'Bearer stubtoken'
				},
				body: { one: true }
			}, 'should construct the appropriate fuela request');
		});

		fuela({ url: 'apiurla', method: 'PATCH', body: { two: true } }, function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'apiurla',
				method: 'PATCH',
				json: true,
				headers: {
					authorization: 'Bearer stubtoken'
				},
				body: { two: true }
			}, 'should construct the appropriate fuela request');
		});

		test.done();
	},

	'handles token request 500 error': function (test) {
		test.expect(2);

		fuel({
			url: 'apiurl',
			method: 'PATCH',
			authUrl: 'auth500',
			clientId: 'yyyyyyyyyyyyyyyyyyyyyyyy',
			clientSecret: 'zzzzzzzzzzzzzzzzzzzzzzzz',
			body: 'zzzzz',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		}, function (error) {
			test.ok(error, 'should get error');
			test.equal(error.message, 'Error requesting token: Internal Server Error', 'should be expected error');
			test.done();
		});
	},

	'handles token request non-200': function (test) {
		test.expect(2);

		fuel({
			url: 'apiurl',
			method: 'PATCH',
			authUrl: 'auth503',
			clientId: 'yyyyyyyyyyyyyyyyyyyyyyyy',
			clientSecret: 'zzzzzzzzzzzzzzzzzzzzzzzz',
			body: 'zzzzz',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		}, function (error) {
			test.ok(error, 'should get error');
			test.equal(error.message, 'Error requesting token: 503 Service Unavailable', 'should be expected error');
			test.done();
		});
	},

	'handles token request bad response': function (test) {
		test.expect(2);

		fuel({
			url: 'apiurl',
			method: 'PATCH',
			authUrl: 'authempty',
			clientId: 'yyyyyyyyyyyyyyyyyyyyyyyy',
			clientSecret: 'zzzzzzzzzzzzzzzzzzzzzzzz',
			body: 'zzzzz',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		}, function (error) {
			test.ok(error, 'should get error');
			test.equal(error.message, 'Error requesting token: Token Missing', 'should be expected error');
			test.done();
		});
	}
};

exports['fuel token and config'] = {
	setUp: function (done) {
		this._performRequest = fuel._performRequest;
		fuel._performRequest = stubEchoRequest;
		this._performTokenRequest = fuel._performTokenRequest;
		fuel._performTokenRequest = stubEchoTokenRequest;
		done();
	},

	tearDown: function (done) {
		fuel._performRequest = this._performRequest;
		fuel._performTokenRequest = this._performTokenRequest;
		done();
	},

	'handles a token request': function (test) {
		test.expect(2);

		fuel.token({
			authUrl: 'auth3',
			clientId: 'yyyyyyyyyyyyyyyyyyyyyyyy',
			clientSecret: 'zzzzzzzzzzzzzzzzzzzzzzzz',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		}, function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'auth3',
				method: 'POST',
				json: true,
				body: {
					clientId: 'yyyyyyyyyyyyyyyyyyyyyyyy',
					clientSecret: 'zzzzzzzzzzzzzzzzzzzzzzzz',
					accessType: 'aaaa',
					refreshToken: 'rrrr',
					scope: 'ssss'
				}
			}, 'should construct the appropriate request');

			test.done();
		});
	},

	'manages separate configurations': function (test) {
		test.expect(4);

		var tokena = fuel.token.configure({
			authUrl: 'auth3',
			clientId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
			clientSecret: 'bbbbbbbbbbbbbbbbbbbbbbbb',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		});

		var tokenx = fuel.token.configure({
			authUrl: 'auth4',
			clientId: 'xxxxxxxxxxxxxxxxxxxxxxxx',
			clientSecret: 'yyyyyyyyyyyyyyyyyyyyyyyy',
			accessType: 'aaaa',
			refreshToken: 'rrrr',
			scope: 'ssss'
		});

		tokena(function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'auth3',
				method: 'POST',
				json: true,
				body: {
					clientId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
					clientSecret: 'bbbbbbbbbbbbbbbbbbbbbbbb',
					accessType: 'aaaa',
					refreshToken: 'rrrr',
					scope: 'ssss'
				}
			}, 'should construct the appropriate tokena request');
		});

		tokenx(function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'auth4',
				method: 'POST',
				json: true,
				body: {
					clientId: 'xxxxxxxxxxxxxxxxxxxxxxxx',
					clientSecret: 'yyyyyyyyyyyyyyyyyyyyyyyy',
					accessType: 'aaaa',
					refreshToken: 'rrrr',
					scope: 'ssss'
				}
			}, 'should construct the appropriate tokenx request');

			test.done();
		});
	}
};


// Stub logic

function stubCallback(error) {
	stubCallback.callbackCount += 1;
	stubCallback.error = error;
}

function stubEchoRequest(options, callback) {
	var body = fuel._removeAuthOptions(options);
	var res = {"statusCode":200};

	if (options.headers.authorization === 'Bearer badtoken') {
		body = {};
		res.statusCode = 401;
		res.headers = {"www-authenticate":"Bearer realm=\"test\", error=\"invalid_token\""};
		options.authUrl = 'auth'; // Set back to good authentication
	}

	callback(null, res, body);
}

function stubEchoTokenRequest(options, callback) {
	callback(null, {}, options);
}

function stubTokenRequest(options, callback) {
	var body = {};
	var res = {"statusCode":200};

	switch (options.url) {
		case 'auth':
			body.accessToken = 'stubtoken';
			body.expiresIn = 1;
			break;
		case 'auth2':
			body.accessToken = 'stubtoken2';
			body.expiresIn = 1;
			break;
		case 'auth500':
			body.documentation = 'https://code.docs.exacttarget.com/rest/errors/500';
			body.errorcode = 0;
			body.message = 'Internal Server Error';
			res.statusCode = 500;
			break;
		case 'auth503':
			body = null;
			res.statusCode = 503;
			break;
		case 'authbad':
			body.accessToken = 'badtoken';
			body.expiresIn = 1;
			break;
		case 'authempty':
			break;
	}

	callback(null, res, body);
}
