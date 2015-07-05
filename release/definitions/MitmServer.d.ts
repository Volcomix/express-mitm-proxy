/// <reference path="../../typings/tsd.d.ts" />
import https = require('https');
import CA = require('certificate-authority');
declare class MitmServer {
    private requestListener;
    private ca;
    private verbose;
    private sni;
    private server;
    address: {
        port: number;
        family: string;
        address: string;
    };
    constructor(requestListener: Function, ca?: CA, verbose?: boolean);
    private getSecureContext(servername, callback);
    listen(port: number, hostname?: string, backlog?: number, cb?: Function): MitmServer;
    listen(port: number, hostname?: string, cb?: Function): MitmServer;
    listen(path: string, cb?: Function): MitmServer;
    listen(handle: any, listeningListener?: Function): MitmServer;
    close(): https.Server;
}
export = MitmServer;
