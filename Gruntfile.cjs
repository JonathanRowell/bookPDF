module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
	
	clean: {
		build: {
			src: ['tmp','pdf','fonts']
		}
	},
	
	mkdir: {
		all: {
			options: {
				create: ['data','src', 'pdf','fonts']
			},
		},
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
		build: "node makePDF.js"
    }
  });

  // Load the plugins.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks("grunt-exec");
  
  // Default task.
  grunt.registerTask('build', ['exec:build','copy:back']);
  grunt.registerTask('default', ['clean:build', 'mkdir','copy:main','copy:spell','copy:fonts','exec:spell']);

};