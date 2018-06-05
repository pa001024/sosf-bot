'use strict';
var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var nodemon = require('gulp-nodemon');

var tsProject = ts.createProject('tsconfig.json');

gulp.task('compile', function () {
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['compile'], function () {
    return nodemon({
        script: 'dist/lib/index.js',  // 服务的启动文件
        watch: 'lib',    // 源代码目录
        tasks: ['compile'], // 在重启服务前需要执行的任务
        ext: 'ts', // 监听.ts结尾的文件 必须
        env: {
            'NODE_ENV': 'development'
        },
        exec: 'node --inspect'
    });
});

gulp.task('default', ['compile']);
