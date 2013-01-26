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

		fuel({ url: 'apiurl', method: 'PATCH', authUrl: 'auth', clientId: 'yyy', clientSecret: 'zzz', body: 'zzzzz', accessType: 'aaaa', refreshToken: 'rrrr', scope: 'ssss' }, function (error, response, body) {
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

		var fuela = fuel.configure({ authUrl: 'auth', clientId: 'yyy', clientSecret: 'zzz', accessType: 'aaaa', refreshToken: 'rrrr', scope: 'ssss' });
		var fuelx = fuel.configure({ authUrl: 'auth2', clientId: 'yyy', clientSecret: 'zzz', accessType: 'aaaa', refreshToken: 'rrrr', scope: 'ssss' });

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

		fuel.token({ authUrl: 'auth3', clientId: 'yyy', clientSecret: 'zzz', accessType: 'aaaa', refreshToken: 'rrrr', scope: 'ssss' }, function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'auth3',
				method: 'POST',
				json: true,
				body: {
					clientId: 'yyy',
					clientSecret: 'zzz',
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

		var tokena = fuel.token.configure({ authUrl: 'auth3', clientId: 'aaa', clientSecret: 'bbb', accessType: 'aaaa', refreshToken: 'rrrr', scope: 'ssss' });
		var tokenx = fuel.token.configure({ authUrl: 'auth4', clientId: 'xxx', clientSecret: 'yyy', accessType: 'aaaa', refreshToken: 'rrrr', scope: 'ssss' });

		tokena(function (error, response, body) {
			test.ifError(error);

			test.deepEqual(body, {
				url: 'auth3',
				method: 'POST',
				json: true,
				body: {
					clientId: 'aaa',
					clientSecret: 'bbb',
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
					clientId: 'xxx',
					clientSecret: 'yyy',
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

function stubRequest(options, callback) {
	options = fuel._removeAuthOptions(options);
	callback(null, {}, options);
}

function stubTokenRequest(options, callback) {
	if (options.url === 'auth') options.accessToken = 'stubtoken';
	if (options.url === 'auth2') options.accessToken = 'stubtoken2';
	callback(null, {}, options);
}