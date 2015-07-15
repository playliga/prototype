module.exports = function(grunt){
  var RENDERER_ROOT = './renderer';
  var DIST_ROOT = '../dist/linux-x64/resources/app';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      develop: {
        src: RENDERER_ROOT + '/main.js',
        dest: RENDERER_ROOT + '/static/bundle.js',
        options: {
          transform: ['reactify']
        }
      }
    },
    less: {
      develop: {
        options: {
          paths: [RENDERER_ROOT + '/less'],
          compress: true
        },
        files: {
          './renderer/static/bundle.css': RENDERER_ROOT + '/less/main.less'
        }
      }
    },
    postcss: {
      develop: {
        options: {
          map: true,
          processors: [
            require('autoprefixer-core')({browsers: 'last 2 versions'})
          ]
        },
        dist: {
          src: RENDERER_ROOT + '/static/bundle.css'
        }
      }
    },
    shell: {
      prunePrev: {
        command: [
          'rm -rf ' + DIST_ROOT,
          'mkdir ' + DIST_ROOT
        ].join('&&')
      },
      copySrc: {
        command: [
          'cp ./package.json ' + DIST_ROOT,
          'cp ./main.js ' + DIST_ROOT,
          'cp -r ' + RENDERER_ROOT + '/static ' + DIST_ROOT,
        ].join('&&')
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('build', [
    'browserify:develop','less:develop','postcss:develop','shell:prunePrev','shell:copySrc'
  ]);
}
