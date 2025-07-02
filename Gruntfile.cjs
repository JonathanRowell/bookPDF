module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
	
	clean: {
		start: {
			src: ['tmp','pdf','fonts']
		},
		build: {
			src: ['tmp','pdf']
		}
	},
	
	mkdir: {
		all: {
			options: {
				create: ['data','src', 'pdf','fonts','tmp']
			}
		},
		tmp: {
			options: {
				create: ['tmp']
			}
		},
		pdf: {
			options: {
				create: ['pdf']
			},
		}
	},
	jshint: {
		options: {
			esversion: 6
		},
		all: ['Gruntfile.js', 'src/*.js', 'test/*.js']
	},
	copy: {
		main: {
			// copy into this VM
			expand: true,
			src: 'z:/Poems-fr/*.txt',
			dest: 'data/',
			flatten: true
		},
		spell: {
			expand: true,
			src: 'z:/Poems-fr/ignore.txt',
			dest: 'data/',
			flatten: true
		},
		fonts: {
			expand: true,
			src: 'z:/Poems-fr/*.ttf',
			dest: 'fonts/',
			flatten: true
		},
		back: {
			expend: true,
			src: 'pdf/*.pdf',
			dest: 'z:/Poems-fr/',
			flatten: true
		}
	},
	exec: {
        spell: "node src/spellcheck.js",
		print: "node src/makeprintfile.js",
		check: "node src/checkprintfile.js",
		build: "node src/buildpdf.js"
    }
  });

  // Load the plugins.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks("grunt-exec");
  grunt.loadNpmTasks('grunt-contrib-jshint');
  
  // Default task.
  grunt.registerTask('build',   ['mkdir:pdf','exec:build','copy:back']);
  grunt.registerTask('check',   ['exec:check']);
  grunt.registerTask('print',   ['clean:build','mkdir:tmp','exec:print']);
  grunt.registerTask('default', ['clean:start', 'mkdir:all','copy:main','copy:spell','copy:fonts','exec:spell']);
  grunt.registerTask('hint',    ['jshint']);

};