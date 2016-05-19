/*
 * grunt-changelog
 *
 * Copyright (c) 2014 Matthew Borgman
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      }
    },

    // Generate changelog from commits
    changelog: {
      dist: {
        options: {
          dest: './changelog.md',
          files: ['./changelog.md', './package.json'],
          version: require('./package.json').version
        }
      }
    }
  });

  // Load plugin's tasks
  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['jshint', 'changelog']);
};