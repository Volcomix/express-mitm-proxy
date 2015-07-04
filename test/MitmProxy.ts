/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/chai/chai.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>
/// <reference path="../typings/request/request.d.ts"/>

import http = require('http');
import fs = require('fs');

var should = require('chai').should();
import Q = require('q');
import request = require('request');

import CA = require('../src/CertificateAuthority');
import MitmProxy = require('../src/MitmProxy');

describe('MitmProxy', function() {
	var ca: CA;
	var mitmProxy: MitmProxy;

	describe('#listen()', function() {
		before(function() {
			ca = new CA('FR', 'Some-State', 'TestMitmProxy', 'TestMitmProxy');
		});
		it('should start', function(done) {
			mitmProxy = new MitmProxy(undefined, ca).listen(13132, 13133, done);
		});
		it('should proxy HTTP requests', function() {
			return Q.nfcall(request, 'http://example.com/', {
				proxy: 'http://localhost:13132'
			}).spread(function(response: http.IncomingMessage, body: any) {
				response.statusCode.should.be.equal(200);
				body.indexOf('Example Domain').should.be.above(0);
			});
		});
		it('should proxy HTTPS requests', function() {
			return ca.caCertificate.then(function(caCert) {
				return Q.nfcall(request, 'https://example.com/', {
					proxy: 'http://localhost:13132',
					ca: caCert.certificate
				});
			}).spread(function(response: http.IncomingMessage, body: any) {
				response.statusCode.should.be.equal(200);
				body.indexOf('Example Domain').should.be.above(0);
			});
		});
	});
	describe('#close()', function() {
		it('should stop', function(done) {
			mitmProxy.close(done);
		});
		it('should not proxy HTTP requests anymore', function(done) {
			return request('http://example.com/', {
				proxy: 'http://localhost:13132'
			}, function(error: any, response: http.IncomingMessage, body: any) {
				should.exist(error, 'no error');
				done();
			});
		});
		it('should not proxy HTTPS requests anymore', function(done) {
			return ca.caCertificate.then(function(caCert) {
				request('https://example.com/', {
					proxy: 'http://localhost:13132',
					ca: caCert.certificate
				}, function(error: any, response: http.IncomingMessage, body: any) {
					should.exist(error, 'no error');
					done();
				});
			});
		});
	});
	after(function() {
		return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-key.pem').finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-CA-cert.pem');
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-CA-cert.srl');
		}).catch(function() { });
	});
});