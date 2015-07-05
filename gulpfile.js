/// <reference path="typings/tsd.d.ts" />

var gulp = require('gulp');
var tsc = require('gulp-typescript');
var mocha = require('gulp-mocha');
var merge = require('merge2');
var del = require('del');
var through2 = require('through2');
var minimatch = require('minimatch');

var tsProject = tsc.createProject('tsconfig.json');

function ambientModule(moduleName) {
	return through2.obj(function (chunk, enc, callback) {
		if (minimatch(chunk.relative, 'MitmProxy.d.ts')) {
			chunk.contents = new Buffer(
				chunk.contents.toString()
					.replace(/declare /g, '')
					.replace(/(.*)/g, '    $1')
					.replace(
					/^\s*\/\/\/\s*<reference[^>]*\/>/,
					'declare module "' + moduleName + '" {\n')
				+ "\n}");

			this.push(chunk);
		}
		callback();
	});
}

gulp.task('clean', function (cb) {
	del('release', cb);
});

gulp.task('build:js', function () {
	var tscResult = gulp.src(['src/**/*.ts', '!src/test/**']).pipe(tsc(tsProject));

	return merge([
		tscResult.js.pipe(gulp.dest('release')),
		tscResult.dts
			.pipe(ambientModule('express-mitm-proxy'))
			.pipe(gulp.dest('release/definitions'))
	]);
});

gulp.task('build:test', function () {
	return gulp.src('src/test/**/*.ts').pipe(tsc({
		target: 'ES5',
		module: 'commonjs'
	})).js.pipe(gulp.dest('release/test'));
});

gulp.task('build', ['clean'], function () {
	var tscResult = gulp.src('src/**/*.ts').pipe(tsc(tsProject));

	return merge([
		tscResult.js.pipe(gulp.dest('release')),
		tscResult.dts
			.pipe(ambientModule('express-mitm-proxy'))
			.pipe(gulp.dest('release/definitions'))
	]);
});

gulp.task('test', ['build'], function () {
	return gulp.src('release/test/**/*.js')
		.pipe(mocha());
});