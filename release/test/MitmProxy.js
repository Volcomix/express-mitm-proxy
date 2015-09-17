/// <reference path="../../typings/tsd.d.ts"/>
var fs = require('fs');
var should = require('chai').should();
var Q = require('q');
var request = require('request');
var CA = require('certificate-authority');
var MitmProxy = require('../MitmProxy');
describe('MitmProxy', function () {
    var ca;
    before(function () {
        ca = new CA('FR', 'Some-State', 'TestMitmProxy', 'TestMitmProxy');
    });
    context('when no target host speficied', function () {
        var mitmProxy;
        describe('#listen()', function () {
            it('should start', function (done) {
                mitmProxy = new MitmProxy(undefined, undefined, ca).listen(13132, 13133, done);
            });
            it('should proxy HTTP requests', function () {
                return Q.nfcall(request, 'http://example.com/', {
                    proxy: 'http://localhost:13132'
                }).spread(function (response, body) {
                    response.statusCode.should.be.equal(200);
                    body.indexOf('Example Domain').should.be.above(0);
                });
            });
            it('should proxy HTTPS requests', function () {
                return ca.caCertificate.then(function (caCert) {
                    return Q.nfcall(request, 'https://example.com/', {
                        proxy: 'http://localhost:13132',
                        ca: caCert.certificate
                    });
                }).spread(function (response, body) {
                    response.statusCode.should.be.equal(200);
                    body.indexOf('Example Domain').should.be.above(0);
                });
            });
        });
        describe('#close()', function () {
            it('should stop', function (done) {
                mitmProxy.close(done);
            });
            it('should not proxy HTTP requests anymore', function (done) {
                return request('http://example.com/', {
                    proxy: 'http://localhost:13132'
                }, function (error, response, body) {
                    should.exist(error, 'no error');
                    done();
                });
            });
            it('should not proxy HTTPS requests anymore', function (done) {
                return ca.caCertificate.then(function (caCert) {
                    request('https://example.com/', {
                        proxy: 'http://localhost:13132',
                        ca: caCert.certificate
                    }, function (error, response, body) {
                        should.exist(error, 'no error');
                        done();
                    });
                });
            });
        });
    });
    context('when target host speficied', function () {
        var mitmProxy;
        describe('#listen()', function () {
            it('should start', function (done) {
                mitmProxy = new MitmProxy(undefined, 'example.com', ca)
                    .listen(13134, 13135, done);
            });
            it('should proxy HTTP requests', function () {
                return Q.nfcall(request, 'http://localhost:13134/', {
                    proxy: null
                }).spread(function (response, body) {
                    response.statusCode.should.be.equal(200);
                    body.indexOf('Example Domain').should.be.above(0);
                });
            });
            it('should proxy HTTPS requests', function () {
                return ca.caCertificate.then(function (caCert) {
                    return Q.nfcall(request, 'https://localhost:13135/', {
                        proxy: null,
                        ca: caCert.certificate
                    });
                }).spread(function (response, body) {
                    response.statusCode.should.be.equal(200);
                    body.indexOf('Example Domain').should.be.above(0);
                });
            });
        });
        describe('#close()', function () {
            it('should stop', function (done) {
                mitmProxy.close(done);
            });
            it('should not proxy HTTP requests anymore', function (done) {
                return request('http://localhost:13134/', {
                    proxy: null
                }, function (error, response, body) {
                    should.exist(error, 'no error');
                    done();
                });
            });
            it('should not proxy HTTPS requests anymore', function (done) {
                return ca.caCertificate.then(function (caCert) {
                    request('https://localhost:13134/', {
                        proxy: null,
                        ca: caCert.certificate
                    }, function (error, response, body) {
                        should.exist(error, 'no error');
                        done();
                    });
                });
            });
        });
    });
    after(function () {
        return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-key.pem').finally(function () {
            return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-CA-cert.pem');
        }).finally(function () {
            return Q.nfcall(fs.unlink, 'keys/TestMitmProxy-CA-cert.srl');
        }).catch(function () { });
    });
});
