module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        eslint: {
            target: [
                "./index.js",
                "./lib/*.js"
            ]
        }
    });
    grunt.registerTask('default', ['eslint']);
    grunt.registerTask('lint', ['eslint']);
};
