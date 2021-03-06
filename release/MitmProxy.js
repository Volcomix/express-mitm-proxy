/// <reference path="../typings/tsd.d.ts"/>
var url = require('url');
var stream = require('stream');
var express = require('express');
var request = require('request');
var Q = require('q');
var MitmServer = require('./MitmServer');
var ProxyServer = require('./ProxyServer');
var MitmProxy = (function () {
    function MitmProxy(app, targetHost, ca, verbose, proxyVerbose, mitmVerbose) {
        var _this = this;
        this.targetHost = targetHost;
        this.verbose = verbose;
        var externalApp = !!app;
        if (!externalApp) {
            app = express();
        }
        app.use(function (req, res, next) {
            if (req.secure) {
                req.url = url.resolve(req.protocol + '://' + req.header('host'), req.url);
            }
            next();
        });
        if (!externalApp) {
            app.use(function (req, res, next) {
                return _this.proxy(req, res, next);
            });
        }
        this.mitmServer = new MitmServer(app, ca, mitmVerbose);
        this.proxyServer = new ProxyServer(app, this.mitmServer, proxyVerbose);
    }
    Object.defineProperty(MitmProxy.prototype, "server", {
        get: function () {
            return this.proxyServer.server;
        },
        enumerable: true,
        configurable: true
    });
    MitmProxy.prototype.proxy = function (req, res, next, cb) {
        var targetUrl;
        if (this.targetHost) {
            targetUrl = url.resolve(req.protocol + '://' + this.targetHost, req.originalUrl);
        }
        else {
            targetUrl = req.url;
        }
        var passThrough = new stream.PassThrough();
        var proxiedRequest = req.pipe(request(targetUrl, { followRedirect: false }, cb || (function () {
            next();
        })));
        proxiedRequest.pipe(passThrough);
        if (!cb) {
            proxiedRequest.pipe(res);
        }
        return passThrough;
    };
    MitmProxy.prototype.listen = function (proxyPort, mitmPort, listeningListener) {
        var _this = this;
        if (proxyPort === void 0) { proxyPort = 3128; }
        if (mitmPort === void 0) { mitmPort = 3129; }
        Q.all([
            Q.Promise(function (resolve) {
                _this.mitmServer.listen(mitmPort, 'localhost', function () {
                    var host = _this.mitmServer.address.address;
                    var port = _this.mitmServer.address.port;
                    if (_this.verbose) {
                        console.log('MITM server listening at https://%s:%s', host, port);
                    }
                    resolve({});
                });
            }),
            Q.Promise(function (resolve) {
                _this.proxyServer.listen(proxyPort, 'localhost', function () {
                    var host = _this.proxyServer.address.address;
                    var port = _this.proxyServer.address.port;
                    if (_this.verbose) {
                        console.log('Proxy listening at http://%s:%s', host, port);
                    }
                    resolve({});
                });
            })
        ]).done(function () {
            if (listeningListener) {
                listeningListener();
            }
        });
        return this;
    };
    MitmProxy.prototype.close = function (listeningListener) {
        var _this = this;
        Q.all([
            Q.Promise(function (resolve) {
                _this.proxyServer.close().on('close', resolve);
            }),
            Q.Promise(function (resolve) {
                _this.mitmServer.close().on('close', resolve);
            })
        ]).done(function () {
            if (listeningListener) {
                listeningListener();
            }
        });
    };
    return MitmProxy;
})();
module.exports = MitmProxy;
