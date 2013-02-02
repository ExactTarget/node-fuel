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
		var valid = fuel._validateOptions({ authUrl: 'a', clientId: 'i' }, stubCallback);

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
		var valid = fuel._validateOptions({ authUrl: 'a', clientId: 'iiiiiiiiiiiiiiiiiiiiiiii', clientSecret: 's' }, stubCallback);

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
		fuel._performRequest = stubRequest;
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
	}
};

exports['fuel token and config'] = {
	setUp: function (done) {
		this._performRequest = fuel._performRequest;
		fuel._performRequest = stubRequest;
		this._performTokenRequest = fuel._performTokenRequest;
		fuel._performTokenRequest = stubTokenRequest;
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
	stubCallback.callbackCount++;
	stubCallback.error = error;
}

function stubRequest(options, callback) {
	options = fuel._removeAuthOptions(options);
	callback(null, {}, options);
}

function stubTokenRequest(options, callback) {
	if (options.url === 'auth') options.accessToken = 'stubtoken';
	if (options.url === 'auth2') options.accessToken = 'stubtoken2';
	callback(null, {}, options);
}
