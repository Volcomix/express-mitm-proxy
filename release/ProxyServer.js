/// <reference path="../typings/tsd.d.ts"/>
var http = require('http');
var net = require('net');
var MitmServer = require('./MitmServer');
var ProxyServer = (function () {
    function ProxyServer(requestListener, mitmServer, verbose) {
        if (mitmServer === void 0) { mitmServer = new MitmServer(requestListener); }
        this.requestListener = requestListener;
        this.mitmServer = mitmServer;
        this.verbose = verbose;
        this._server = http.createServer(requestListener);
    }
    Object.defineProperty(ProxyServer.prototype, "server", {
        get: function () {
            return this._server;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ProxyServer.prototype, "address", {
        get: function () {
            return this._server.address();
        },
        enumerable: true,
        configurable: true
    });
    ProxyServer.prototype.listen = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        this._server.listen.apply(this._server, args).on('connect', function (req, cltSocket, head) {
            if (_this.verbose) {
                console.log('Piping to MITM server: ' + req.url);
            }
            var mitmSocket = net.connect(_this.mitmServer.address.port, _this.mitmServer.address.address, function () {
                cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    '\r\n');
                mitmSocket.write(head);
                mitmSocket.pipe(cltSocket);
                cltSocket.pipe(mitmSocket);
            });
            mitmSocket.on('error', function (err) {
                console.error(err);
            });
        });
        return this;
    };
    ProxyServer.prototype.close = function () {
        return this._server.close();
    };
    return ProxyServer;
})();
module.exports = ProxyServer;
