/// <reference path="typings/tsd.d.ts" />

var gulp = require('gulp');
var tsc = require('gulp-typescript');
var mocha = require('gulp-mocha');
var merge = require('merge2');
var del = require('del');

var tsProject = tsc.createProject('tsconfig.json');

gulp.task('clean', function (cb) {
	del('release', cb);
});

gulp.task('build:js', function () {
	var tscResult = gulp.src(['src/**/*.ts', '!src/test/**']).pipe(tsc(tsProject));

	return merge([
		tscResult.js.pipe(gulp.dest('release')),
		tscResult.dts.pipe(gulp.dest('release/definitions'))
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
		tscResult.dts.pipe(gulp.dest('release/definitions'))
	]);
});

gulp.task('test', ['build'], function () {
	return gulp.src('release/test/**/*.js')
		.pipe(mocha());
});