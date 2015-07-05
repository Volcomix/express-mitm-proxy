/// <reference path="../../typings/tsd.d.ts" />
import http = require('http');
import express = require('express');
import CA = require('certificate-authority');
declare class MitmProxy {
    private verbose;
    private mitmServer;
    private proxyServer;
    server: http.Server;
    constructor(app?: express.Express, ca?: CA, verbose?: boolean, proxyVerbose?: boolean, mitmVerbose?: boolean);
    proxy(req: express.Request, res: express.Response, next: Function): void;
    listen(proxyPort?: number, mitmPort?: number, listeningListener?: () => void): MitmProxy;
    close(listeningListener?: () => void): void;
}
export = MitmProxy;
