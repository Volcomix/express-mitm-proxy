declare module "express-mitm-proxy" {
    
    import http = require('http');    
    import stream = require('stream');    
    import express = require('express');    
    import CA = require('certificate-authority');    
    class MitmProxy {    
        private targetHost;    
        private verbose;    
        private mitmServer;    
        private proxyServer;    
        server: http.Server;    
        constructor(app?: express.Express, targetHost?: string, ca?: CA, verbose?: boolean, proxyVerbose?: boolean, mitmVerbose?: boolean);    
        proxy(req: express.Request, res: express.Response, next: Function): stream.PassThrough;    
        listen(proxyPort?: number, mitmPort?: number, listeningListener?: () => void): MitmProxy;    
        close(listeningListener?: () => void): void;    
    }    
    export = MitmProxy;    
    
}