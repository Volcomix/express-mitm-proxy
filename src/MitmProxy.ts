/// <reference path="../typings/tsd.d.ts"/>

import url = require('url');
import http = require('http');
import stream = require('stream');

import express = require('express');
import request = require('request');
import Q = require('q');

import CA = require('certificate-authority');
import MitmServer = require('./MitmServer');
import ProxyServer = require('./ProxyServer');

class MitmProxy {

	private mitmServer: MitmServer;
	private proxyServer: ProxyServer;

	get server(): http.Server {
		return this.proxyServer.server;
	}

	constructor(app?: express.Express, private targetHost?: string, ca?: CA,
		private verbose?: boolean, proxyVerbose?: boolean, mitmVerbose?: boolean) {

		var externalApp = !!app;

		if (!externalApp) {
			app = express();
		}

		app.use((req: express.Request, res: express.Response, next: Function) => {
			if (req.secure) {
				req.url = url.resolve(req.protocol + '://' + req.header('host'), req.url);
			}
			next();
		});

		if (!externalApp) {
			app.use((req: express.Request, res: express.Response, next: Function) => {
				return this.proxy(req, res, next);
			});
		}

		this.mitmServer = new MitmServer(app, ca, mitmVerbose);
		this.proxyServer = new ProxyServer(app, this.mitmServer, proxyVerbose)
	}

	proxy(req: express.Request, res: express.Response, next: Function,
		  cb?: (error: any, response: http.IncomingMessage, body: any) => void) {
		var targetUrl;
		if (this.targetHost) {
			targetUrl = url.resolve(req.protocol + '://' + this.targetHost, req.originalUrl);
		} else {
			targetUrl = req.url;
		}
		
		var passThrough = new stream.PassThrough();
		var proxiedRequest = req.pipe(
			request(targetUrl, { followRedirect: false }, cb || (() => {
				next();
			}))
		);
		proxiedRequest.pipe(passThrough);
		if (!cb) {
			proxiedRequest.pipe(res);
		}
		return passThrough;
	}

	listen(proxyPort = 3128, mitmPort = 3129, listeningListener?: () => void): MitmProxy {
		Q.all([
			Q.Promise((resolve) => {
				this.mitmServer.listen(mitmPort, 'localhost', () => {
					var host = this.mitmServer.address.address;
					var port = this.mitmServer.address.port;

					if (this.verbose) {
						console.log('MITM server listening at https://%s:%s', host, port);
					}

					resolve({});
				});
			}),
			Q.Promise((resolve) => {
				this.proxyServer.listen(proxyPort, 'localhost', () => {
					var host = this.proxyServer.address.address;
					var port = this.proxyServer.address.port;

					if (this.verbose) {
						console.log('Proxy listening at http://%s:%s', host, port);
					}

					resolve({});
				});
			})
		]).done(() => {
			if (listeningListener) {
				listeningListener();
			}
		});

		return this;
	}

	close(listeningListener?: () => void) {
		Q.all([
			Q.Promise((resolve) => {
				this.proxyServer.close().on('close', resolve);
			}),
			Q.Promise((resolve) => {
				this.mitmServer.close().on('close', resolve);
			})
		]).done(() => {
			if (listeningListener) {
				listeningListener();
			}
		});
	}
}

export = MitmProxy;