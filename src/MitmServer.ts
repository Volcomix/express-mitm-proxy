/// <reference path="../typings/tsd.d.ts"/>

import https = require('https');
import tls = require('tls');
import util = require('util');

import Q = require('q');

import CA = require('certificate-authority');

class MitmServer {

    private sni: { [index: string]: tls.SecureContext } = {};
    private server: https.Server;

    get address() {
        return this.server.address();
    }

    constructor(
        private requestListener: Function,
        private ca = new CA('FR', 'Some-State', 'MitmServer', 'MitmServer'),
        private verbose?: boolean) {
    }

    private getSecureContext(servername: string, callback: Function) {

        var domain: string;
        var domains = servername.split('.');
        if (domains.length > 2) {
            domain = domains.slice(1).join('.');
        } else {
            domain = domains.join('.');
        }

        Q.Promise<tls.SecureContext>((resolve) => {
            var context: tls.SecureContext = this.sni[domain];

            if (context) {
                resolve(context);
            } else {
                var commonName: string, subjectAltName: string;
                if (domains.length == 1) {
                    commonName = domain;
                    subjectAltName = util.format('DNS: %s', domain);
                } else {
                    commonName = '*.' + domain;
                    subjectAltName = util.format('DNS: %s, DNS: %s', commonName, domain);
                }

                if (this.verbose) {
                    console.log('Signing certificate: ' + commonName);
                }

                this.ca.sign(commonName, subjectAltName).then((certificate) => {
                    return [certificate, this.ca.caCertificate];
                }).spread((certificate: string, caCert: CA.CACertificate) => {
                    resolve(this.sni[domain] = tls.createSecureContext({
                        key: caCert.privateKey,
                        cert: certificate,
                        ca: caCert.certificate
                    }));
                });
            }
        }).then((context) => {
            callback(null, context);
        }).done();
    }

    listen(port: number, hostname?: string, backlog?: number, cb?: Function): MitmServer;
    listen(port: number, hostname?: string, cb?: Function): MitmServer;
    listen(path: string, cb?: Function): MitmServer;
    listen(handle: any, listeningListener?: Function): MitmServer;
    listen(...args): MitmServer {
        this.ca.caCertificate.then((caCert) => {

            this.server = https.createServer(<any>{
                key: caCert.privateKey,
                cert: caCert.certificate,
                SNICallback: this.getSecureContext.bind(this)
            }, this.requestListener);

            this.server.listen.apply(this.server, args);

        });

        return this;
    }

    close(): https.Server {
        return this.server.close();
    }
}

export = MitmServer;