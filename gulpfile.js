var gulp        = require('gulp');
var browserSync = require('browser-sync');
// var sass        = require('gulp-sass');
var less        = require('gulp-less');
var prefixer    = require('gulp-autoprefixer');
var cp          = require('child_process');
var uglify      = require('gulp-uglify');
var concat      = require('gulp-concat');
var runsequence = require('run-sequence');
var gutil       = require('gulp-util');
var plumber     = require('gulp-plumber');
var notify      = require('gulp-notify');
var del         = require('del');
var cssnano     = require('gulp-cssnano');
var rename      = require('gulp-rename');
var imagemin    = require('gulp-imagemin');

var distPath = './dist/';
var frontendPath = './frontend/';


/**
 * Wait for other task, then launch the Server
 */
gulp.task('browser-sync', ['less'], function() {
  browserSync({
    server: {
        baseDir: frontendPath
    },
    browser: "google chrome",
    open: true,
    ghostMode: false
  });
});


/**
 * Compile files from less
 */
gulp.task('less', function () {
  return gulp.src(frontendPath + 'less/style.less')
    .pipe(plumber({errorHandler: reportError}))
    .pipe(less())
    .pipe(prefixer({'browserslist': 'not ie <= 8'}))
    .on('error', function(error) {
      gutil.log(error);
      this.emit('end');
    })
    .pipe(gulp.dest(frontendPath + 'css'))
    .pipe(browserSync.reload({stream:true}));
});


/**
 * Copy files from js into both _site/js (for live injecting) and site (for future jekyll builds)
 */
gulp.task('js', function () {
  return gulp.src([frontendPath + 'js/main.js', frontendPath + 'js/app.js'])
    .pipe(browserSync.reload({stream:true}))
});


/**
 * Watch scss files for changes & recompile
 * Watch html/md files, reload BrowserSync
 */
gulp.task('watch', function () {
  gulp.watch(frontendPath + 'less/*.less', ['less']);
  gulp.watch(frontendPath + 'js/**/*.js', ['js']);
  gulp.watch(frontendPath + 'js/**/*.json', ['js']);
  gulp.watch([frontendPath + '*.html', frontendPath + 'img/**/*.+(png|jpg|gif|svg)'])
    .on('change', browserSync.reload);
});


/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);


/***********************************************/
/* Only Plugins (into .NET Project)            */
/***********************************************/

gulp.task('plugins-js', function () {
  var fep = frontendPath;
  return gulp.src([
    fep + 'bower_components/jquery/dist/jquery.js',
    fep + 'bower_components/bootstrap/dist/js/bootstrap.js',
    fep + 'bower_components/magnific-popup/dist/jquery.magnific-popup.js',
    ])
    .pipe(concat('plugins.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(fep + 'js'));
});

gulp.task('build-plugins', function(callback) {
  runsequence(['plugins-js'], callback);
});



/***********************************************/
/* Distribution                                */
/***********************************************/

// Distribution LESS, Auto Prefixer, Nano
gulp.task('dist-style', function() {
  gulp.src([
    frontendPath + 'less/style.less'
    ])
    .pipe(less())
    .pipe(prefixer())
    .pipe(cssnano())
    .pipe(rename('style.css'))
    .pipe(gulp.dest(distPath + 'css'));
});

// Distribution JS
gulp.task('dist-js', function() {
  gulp.src(frontendPath + 'js/**/*')
    .pipe(uglify())
    .pipe(gulp.dest(distPath + 'js'));
});

// Distribution TEMPLATES
gulp.task('dist-template', function() {
  gulp.src(frontendPath + 'templates/**/*')
    .pipe(gulp.dest(distPath + 'templates'));
});

// Distribution HTML
gulp.task('dist-html', function() {
  gulp.src(frontendPath + '*.html')
    .pipe(gulp.dest(distPath));
});

// Distribution PHP
gulp.task('dist-php', function() {
  gulp.src(frontendPath + '*.php')
    .pipe(gulp.dest(distPath));
});

// Distribution Fonts
gulp.task('dist-fonts', function() {
  gulp.src(frontendPath + 'fonts/**/*')
    .pipe(gulp.dest(distPath + 'fonts'));
});

// Distribution Icons
gulp.task('dist-ico', function() {
  gulp.src(frontendPath + 'ico/**/*')
    .pipe(gulp.dest(distPath + 'ico'));
});

// Distribution Images
gulp.task('dist-img', function() {
  gulp.src(frontendPath + 'img/**/*.+(png|jpg)')
    .pipe(imagemin({
      progressive: true,
      verbose: true
    }))
    .pipe(gulp.dest(distPath + 'img'));

  gulp.src(frontendPath + 'img/**/*.+(gif|svg)')
    .pipe(gulp.dest(distPath + 'img'));
});

// Distribution (Clean)
gulp.task('clean:dist', function() {
  del.sync([distPath + 'templates/**/*', distPath + '*.html', distPath + '*.php', distPath + 'css/**/*', distPath + 'js/**/*', distPath + 'fonts/**/*', distPath + 'ico/**/*', distPath + 'img/**/*'], {force: true});
});

// Distribution Total
gulp.task('build', function(callback) {
  runsequence('clean:dist', ['dist-template', 'dist-js', 'dist-html', 'dist-php', 'dist-fonts', 'dist-ico', 'dist-img'], 'dist-style',  callback);
});




/***********************************************/
/* Notification and Callbacks                  */
/***********************************************/

var reportError = function (error) {
  var lineNumber = (error.lineNumber) ? 'LINE ' + error.lineNumber + ' -- ' : '';

  notify({
    title: 'Task Failed [' + error.plugin + ']',
    message: lineNumber + 'See console.',
    sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
  }).write(error);

  gutil.beep(); // Beep 'sosumi' again

  // Inspect the error object
  //console.log(error);

  // Easy error reporting
  //console.log(error.toString());

  // Pretty error reporting
  var report = '';
  var chalk = gutil.colors.white.bgRed;

  report += chalk('TASK:') + ' [' + error.plugin + ']\n';
  report += chalk('PROB:') + ' ' + error.message + '\n';
  if (error.lineNumber) { report += chalk('LINE:') + ' ' + error.lineNumber + '\n'; }
  if (error.fileName)   { report += chalk('FILE:') + ' ' + error.fileName + '\n'; }
  console.error(report);

  // Prevent the 'watch' task from stopping
  this.emit('end');
}