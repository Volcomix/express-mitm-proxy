/// <reference path="typings/gulp/gulp.d.ts"/>
/// <reference path="typings/gulp-typescript/gulp-typescript.d.ts"/>
/// <reference path="typings/gulp-mocha/gulp-mocha.d.ts" />

var gulp = require('gulp');
var tsc = require('gulp-typescript');
var mocha = require('gulp-mocha');

var tsProject = tsc.createProject('tsconfig.json');

gulp.task('build', function () {
	return gulp.src('src/**/*.ts')
		.pipe(tsc(tsProject))
		.pipe(gulp.dest('build/src'));
});

gulp.task('build:test', function () {
	return gulp.src(['src/**/*.ts', 'test/**/*.ts'], { base: '.' })
		.pipe(tsc(tsProject))
		.pipe(gulp.dest('build'));
});

gulp.task('test', ['build:test'], function () {
	return gulp.src('build/test/**/*.js')
		.pipe(mocha())
		.once('error', function () { process.exit(1); });
});