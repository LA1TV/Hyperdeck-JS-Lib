var jshint = require('gulp-jshint');
var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('lint', function() {
  return gulp.src(['src/*.js', 'src/**/*.js', 'test/*.js', 'test/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('test', function() {
  return gulp.src(['test/*.js', 'test/**/*.js'], {read: false})
    // gulp-mocha needs filepaths so you can't have any plugins before it 
    .pipe(mocha({
        reporter: 'spec',
        require: ['should']
    }));
});

gulp.task('default', gulp.parallel('lint', 'test'));
