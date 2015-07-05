/// <reference path="../typings/tsd.d.ts"/>

import net = require('net');
import http = require('http');
import fs = require('fs');

require('chai').should();
import Q = require('q');
import request = require('request');

import CA = require('certificate-authority');
import MitmServer = require('../src/MitmServer');

describe('MitmServer', function() {
	var ca: CA;
	var mitmServer: MitmServer;

	describe('#listen()', function() {
		before(function() {
			ca = new CA('FR', 'Some-State', 'TestMitm', 'TestMitm');
		});
		it('should start', function(done) {
			mitmServer = new MitmServer(function(request, response) {
				response.writeHead(200, { 'Content-Type': 'text/plain' });
				response.end('OK');
			}, ca).listen(13129, done);
		});
		it('should be listening', function(done) {
			mitmServer.address.port.should.be.equal(13129);
			var client = net.connect(13129, 'localhost', function() {
				client.end();
			});
			client.on('error', done);
			client.on('end', done);
		});
		it('should serve with self signed certificate', function() {
			return ca.caCertificate.then(function(caCert) {
				return Q.nfcall(request, 'https://localhost:13129', {
					ca: caCert.certificate
				});
			}).spread(function(response: http.IncomingMessage, body: any) {
				response.statusCode.should.be.equal(200);
				body.should.be.equal('OK');
			});
		});
	});
	describe('#close()', function() {
		it('should stop', function(done) {
			mitmServer.close().on('close', done);
		});
		it('should not be listening anymore', function(done) {
			var client = net.connect(13129, 'localhost', function() {
				client.end();
				done(new Error('MitmServer is still listening on port 13129'));
			});
			client.on('error', function() { done(); });
		});
	});
	after(function() {
		return Q.nfcall(fs.unlink, 'keys/TestMitm-key.pem').finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestMitm-CA-cert.pem');
		}).finally(function() {
			return Q.nfcall(fs.unlink, 'keys/TestMitm-CA-cert.srl');
		}).done();
	});
});