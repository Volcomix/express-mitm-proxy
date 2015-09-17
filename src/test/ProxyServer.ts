/// <reference path="../../typings/tsd.d.ts"/>

import net = require('net');
import http = require('http');
import fs = require('fs');

require('chai').should();
import Q = require('q');
import request = require('request');

import CA = require('certificate-authority');
import MitmServer = require('../MitmServer');
import ProxyServer = require('../ProxyServer');

describe('ProxyServer', function() {
	var ca: CA;
	var mitmServer: MitmServer;
	var proxyServer: ProxyServer;

	before(function(done) {
		ca = new CA('FR', 'Some-State', 'TestProxy', 'TestProxy');
		mitmServer = new MitmServer(function(request, response) {
			response.writeHead(200, { 'Content-Type': 'text/plain' });
			response.end('MitmServer OK');
		}, ca).listen(13130, 'localhost', done);
	});
	describe('#listen()', function() {
		it('should start', function(done) {
			proxyServer = new ProxyServer(function(request, response) {
				response.writeHead(200, { 'Content-Type': 'text/plain' });
				response.end('ProxyServer OK');
			}, mitmServer).listen(13131, 'localhost', done);
		});
		it('should be listening', function(done) {
			proxyServer.address.port.should.be.equal(13131);
			var client = net.connect(13131, 'localhost', function() {
				client.end();
			});
			client.on('error', done);
			client.on('end', done);
		});
		it('should proxy HTTP through ProxyServer', function() {
			return Q.nfcall(request, 'http://test.proxy.server/', {
				proxy: 'http://localhost:13131'
			}).spread(function(response: http.IncomingMessage, body: any) {
				response.statusCode.should.be.equal(200);
				body.should.be.equal('ProxyServer OK');
			});
		});
		it('should proxy HTTPS through MitmServer', function() {
			return ca.caCertificate.then(function(caCert) {
				return Q.nfcall(request, 'https://test.mitm.server/', {
					proxy: 'http://localhost:13131',
					ca: caCert.certificate
				});
			}).spread(function(response: http.IncomingMessage, body: any) {
				response.statusCode.should.be.equal(200);
				body.should.be.equal('MitmServer OK');
			});
		});
	});
	describe('#close()', function() {
		it('should stop', function(done) {
			proxyServer.close().on('close', done);
		});
		it('should not be listening anymore', function(done) {
			var client = net.connect(13131, 'localhost', function() {
				client.end();
				done(new Error('ProxyServer is still listening on port 13131'));
			});
			client.on('error', function() { done(); });
		});
	});
	after(function() {
		Q.Promise(function(resolve) {
			mitmServer.close().on('close', resolve);
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestProxy-key.pem');
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestProxy-CA-cert.pem');
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestProxy-CA-cert.srl');
		}).done();
	});
});