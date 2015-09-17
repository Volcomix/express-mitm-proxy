/// <reference path="../../typings/tsd.d.ts"/>
var net = require('net');
var fs = require('fs');
require('chai').should();
var Q = require('q');
var request = require('request');
var CA = require('certificate-authority');
var MitmServer = require('../MitmServer');
describe('MitmServer', function () {
    var ca;
    var mitmServer;
    describe('#listen()', function () {
        before(function () {
            ca = new CA('FR', 'Some-State', 'TestMitm', 'TestMitm');
        });
        it('should start', function (done) {
            mitmServer = new MitmServer(function (request, response) {
                response.writeHead(200, { 'Content-Type': 'text/plain' });
                response.end('OK');
            }, ca).listen(13129, 'localhost', done);
        });
        it('should be listening', function (done) {
            mitmServer.address.port.should.be.equal(13129);
            var client = net.connect(13129, 'localhost', function () {
                client.end();
            });
            client.on('error', done);
            client.on('end', done);
        });
        it('should serve with self signed certificate', function () {
            return ca.caCertificate.then(function (caCert) {
                return Q.nfcall(request, 'https://localhost:13129', {
                    ca: caCert.certificate,
                    proxy: null
                });
            }).spread(function (response, body) {
                response.statusCode.should.be.equal(200);
                body.should.be.equal('OK');
            });
        });
    });
    describe('#close()', function () {
        it('should stop', function (done) {
            mitmServer.close().on('close', done);
        });
        it('should not be listening anymore', function (done) {
            var client = net.connect(13129, 'localhost', function () {
                client.end();
                done(new Error('MitmServer is still listening on port 13129'));
            });
            client.on('error', function () { done(); });
        });
    });
    after(function () {
        return Q.nfcall(fs.unlink, 'keys/TestMitm-key.pem').finally(function () {
            return Q.nfcall(fs.unlink, 'keys/TestMitm-CA-cert.pem');
        }).finally(function () {
            return Q.nfcall(fs.unlink, 'keys/TestMitm-CA-cert.srl');
        }).done();
    });
});
