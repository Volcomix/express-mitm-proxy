/// <reference path="../../typings/tsd.d.ts" />
import http = require('http');
import MitmServer = require('./MitmServer');
declare class ProxyServer {
    private requestListener;
    private mitmServer;
    private verbose;
    private _server;
    server: http.Server;
    address: {
        port: number;
        family: string;
        address: string;
    };
    constructor(requestListener: (request: http.IncomingMessage, response: http.ServerResponse) => void, mitmServer?: MitmServer, verbose?: boolean);
    listen(port: number, hostname?: string, backlog?: number, cb?: Function): ProxyServer;
    listen(port: number, hostname?: string, cb?: Function): ProxyServer;
    listen(path: string, cb?: Function): ProxyServer;
    listen(handle: any, listeningListener?: Function): ProxyServer;
    close(): http.Server;
}
export = ProxyServer;
