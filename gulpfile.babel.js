import gulp from 'gulp'
import plumber from 'gulp-plumber'
import pug from 'gulp-pug'
import browserSync from 'browser-sync'
import sass from 'gulp-sass'
import postcss from 'gulp-postcss'
import cssnano from 'cssnano'
import autoprefixer from 'gulp-autoprefixer'
import mincss from 'gulp-minify-css'
import purgecss from 'gulp-purgecss'
import rename from 'gulp-rename'
import browserify from 'browserify'
import babelify from 'babelify'
import source from 'vinyl-source-stream'
import sourcemaps from 'gulp-sourcemaps'
import buffer from 'vinyl-buffer'
import minify from 'gulp-minify'
import imagemin from 'gulp-imagemin'
import tinypng from 'gulp-tinypng'
import sitemap from 'gulp-sitemap'
import cachebust from 'gulp-cache-bust'
import tildeImporter from 'node-sass-tilde-importer'


const server = browserSync.create()

const postcssPlugins = [
    cssnano({
        core: true,
        zindex: false,
        autoprefixer: {
            add: true,
            browsers: '> 1%, last 2 versions, Firefox ESR, Opera 12.1'
        }
    })
]

gulp.task('styles-dev', () => {
    return gulp.src('./src/scss/style.scss')        
        .pipe(sourcemaps.init({ loadMaps : true }))
        .pipe(plumber())
        .pipe(sass({
            importer: tildeImporter,
            outputStyle: 'expanded',
            includePaths: ['./node_modules']
        }))
        .pipe(postcss(postcssPlugins))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/assets/css/'))   
        .pipe(server.stream({ match : '**/*.css' }))
})

gulp.task('styles-build', () => {
    return gulp.src('./src/scss/style.scss')
        // Desarrollo
        .pipe(plumber())
        .pipe(sass({
            importer: tildeImporter,
            outputStyle: 'expanded',
            includePaths: ['./node_modules']
        }))
        .pipe(autoprefixer())
        .pipe(gulp.dest('./public/assets/css/'))
        
        // Producción
        .pipe(mincss())
        .pipe(rename({ extname : '.min.css' }))
        .pipe(gulp.dest('./public/assets/css/'))
})

gulp.task('pug-dev', () => (
    gulp.src('./src/pug/pages/**/*.pug')
        .pipe(plumber())
        .pipe(pug({
            pretty: true,
            basedir: './src/pug'
        }))
        .pipe(gulp.dest('./public'))
))

gulp.task('pug-build', () => (
    gulp.src('./src/pug/pages/**/*.pug')
        .pipe(plumber())
        .pipe(pug({
            basedir: './src/pug'
        }))
        .pipe(gulp.dest('./public'))
))

gulp.task('scripts-dev', () => (
    browserify('./src/js/index.js')
        .transform(babelify, {
            global: true // permite importar desde afuera (como node_modules)
        })
        .bundle()
        .on('error', function (err) {
            console.error(err)
            this.emit('end')
        })
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(minify({
            ext: {
                src: '.min.js',
                min: '.js'
            }
        }))
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/assets/js'))
))

gulp.task('scripts-build', () => (
    browserify('./src/js/index.js')
        .transform(babelify, {
            global: true // permite importar desde afuera (como node_modules)
        })
        .bundle()
        .on('error', function (err) {
            console.error(err)
            this.emit('end')
        })
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(minify({
            ext: {
                min: '.min.js',
                src: '.js'
            }
        }))
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/assets/js'))
))

gulp.task('images-build', () => {
    return gulp.src('./src/img/**/**')
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 50}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo()
        ]))
        .pipe(gulp.dest('./public/assets/img'))
})

gulp.task('images-dev', () => {
    return gulp.src('./src/img/**/**')
        .pipe(gulp.dest('./public/assets/img'))
})

gulp.task('sitemap', () => {
    return gulp.src('./public/**/*.html', {
        read: false
    })
        .pipe(sitemap({
            siteUrl: 'https://example.com' // remplazar el dominio
        }))
        .pipe(gulp.dest('./public'))
})

gulp.task('dev', () => {
    server.init({
        server: {
            baseDir: './public'
        }
    })

    gulp.watch('./src/scss/**/*.scss', gulp.series('styles-dev'))
    gulp.watch('./src/js/**/*.js', gulp.series('scripts-dev')).on('change', server.reload)
    gulp.watch('./src/pug/**/*.pug', gulp.series('pug-dev')).on('change', server.reload)
    gulp.watch('./src/img/**/**', gulp.series('images-dev'))

    return
})

gulp.task('cache', () => {
    return gulp.src('./public/**/*.html')
        .pipe(cachebust({
            type: 'timestamp'
        }))
        .pipe(gulp.dest('./public'))
})

gulp.task('build', gulp.series(
    gulp.parallel([
        'styles-build', 
        'pug-build', 
        'scripts-build', 
        'images-build', 
        'cache', 
        'sitemap'
    ])
))
