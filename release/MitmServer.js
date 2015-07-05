/// <reference path="../typings/tsd.d.ts"/>
var https = require('https');
var tls = require('tls');
var util = require('util');
var Q = require('q');
var CA = require('certificate-authority');
var MitmServer = (function () {
    function MitmServer(requestListener, ca, verbose) {
        if (ca === void 0) { ca = new CA('FR', 'Some-State', 'MitmServer', 'MitmServer'); }
        this.requestListener = requestListener;
        this.ca = ca;
        this.verbose = verbose;
        this.sni = {};
    }
    Object.defineProperty(MitmServer.prototype, "address", {
        get: function () {
            return this.server.address();
        },
        enumerable: true,
        configurable: true
    });
    MitmServer.prototype.getSecureContext = function (servername, callback) {
        var _this = this;
        var domain;
        var domains = servername.split('.');
        if (domains.length > 2) {
            domain = domains.slice(1).join('.');
        }
        else {
            domain = domains.join('.');
        }
        Q.Promise(function (resolve) {
            var context = _this.sni[domain];
            if (context) {
                resolve(context);
            }
            else {
                var commonName, subjectAltName;
                if (domains.length == 1) {
                    commonName = domain;
                    subjectAltName = util.format('DNS: %s', domain);
                }
                else {
                    commonName = '*.' + domain;
                    subjectAltName = util.format('DNS: %s, DNS: %s', commonName, domain);
                }
                if (_this.verbose) {
                    console.log('Signing certificate: ' + commonName);
                }
                _this.ca.sign(commonName, subjectAltName).then(function (certificate) {
                    return [certificate, _this.ca.caCertificate];
                }).spread(function (certificate, caCert) {
                    resolve(_this.sni[domain] = tls.createSecureContext({
                        key: caCert.privateKey,
                        cert: certificate,
                        ca: caCert.certificate
                    }));
                });
            }
        }).then(function (context) {
            callback(null, context);
        }).done();
    };
    MitmServer.prototype.listen = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        this.ca.caCertificate.then(function (caCert) {
            _this.server = https.createServer({
                key: caCert.privateKey,
                cert: caCert.certificate,
                SNICallback: _this.getSecureContext.bind(_this)
            }, _this.requestListener);
            _this.server.listen.apply(_this.server, args);
        });
        return this;
    };
    MitmServer.prototype.close = function () {
        return this.server.close();
    };
    return MitmServer;
})();
module.exports = MitmServer;
