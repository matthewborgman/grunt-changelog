'use strict';

var moment	= require('moment'),
	path	= require('path'),
	_		= require('underscore');

module.exports = function (grunt) {

	grunt.registerMultiTask('changelog', 'Generate a Markdown-formatted changelog from git commits, grouped by tags', function () {

		// Stage the remaining files in Git
		function addBuiltFilesToIndex () {

			grunt.util.spawn({
				cmd: 'git',
				args: ['add', '.']
			},
			function (error, result) {

				if (error)	handleError(error);
				else		commitBuiltFiles();
			});
		}

		// Stage the changelog-related files in Git
		function addChangelogFilesToIndex () {

			grunt.util.spawn({
				cmd: 'git',
				args: ['add'].concat(options.files)
			},
			function (error, result) {

				if (error)	handleError(error);
				else		commitChangelogFiles();
			});
		}

		// Commit the built files to Git
		function commitBuiltFiles () {

			grunt.util.spawn({
				cmd: 'git',
				args: ['commit', '--message', 'Generate Build for v' + options.version]
			},
			function (error, result) {

				if (error && -1 === result.stdout.indexOf('clean'))	handleError(error);
				else												tagLastCommit();
			});
		}

		// Commit the changelog-related files to Git
		function commitChangelogFiles () {

			grunt.util.spawn({
				cmd: 'git',
				args: ['commit', '--message', 'Increment Version Number and Update Changelog']
			},
			function (error, result) {

				if (error)	handleError(error);
				else		addBuiltFilesToIndex();
			});
		}

		// Handle any errors encountered in the task
		function handleError (error) {

			grunt.log.error(error);

			done(false);
		}

        // Parse the commits and format the changelog
		function parseCommits (commits) {

			var	changelog = 'Changelog\n=========\n\nv' + options.version + ' (' + moment().format('YYYY-MM-DD') + ')\n' + new Array((options.version.length + 15)).join('-') + '\n';

			commits = commits.toString().split(/\n/g);

			commits.forEach(function (commit, index) {

				var	branches,
					branchesRegex	= /^\((.*)\) /,
					branchRegex		= /development|head|origin|production|staging/i,
					buildRegex		= /^Generate Build.*/i,
					changelogRegex	= /^Increment Version|^Update Changelog.*/im,
					date			= commit.substr(8, 10),
					hash			= commit.substr(0, 7),
					message			= commit.substr(20).trim(),
					tag,
					tagRegex		= /tag: (.*),?\) (.*)/g,
					version;

				// Parse a tag and output new heading
				tag = tagRegex.exec(message);

				if (tag) {

					// Split the tag into an array, but only retrieve the version
					version = (tag[1].split(','))[0];

					changelog += '\n' + version + ' (' + date + ')' + '\n';
					changelog += new Array((version.length + 1 + 13)).join('-') + '\n';

					message = tag[2];
				}

				// Remove the branch name(s) from the message
				branches = branchesRegex.exec(message);

				if (branches && branchRegex.test(branches[1]))
					message = message.replace(branches[0], '');

				// Ensure the commit's not from bumping the version or generating a build
				if (!buildRegex.test(message) && !changelogRegex.test(message))
					changelog += '- ' + message + ' (' + hash + ')\n';
			});

			writeChangelog(changelog.trim());
		}

		// Tag the last commit in Git
		function tagLastCommit () {

			grunt.util.spawn({
				cmd: 'git',
				args: ['tag', '-a', 'v' + options.version, '-m', 'v' + options.version]
			},
			function (error, result) {

				if (error)
					return handleError(error);

				grunt.log.writeln('Changelog generated at '+ options.dest.toString().cyan + '.');

				done();
			});
		}

        // Output the generated changelog
		function writeChangelog (changelog) {

			grunt.file.write(options.dest, changelog);

			addChangelogFilesToIndex();
		}

		// Merge task-specific and/or target-specific options with these defaults.
		var	done	= this.async(),
			options	= this.options({
				dest: './changelog.md',
				files: ['./changelog.md', './package.json'],
				version: '0.0.0'
			});

		// Normalize the paths to the changelog-related files, then deduplicate
		options.files = _.map(options.files, function (file) {

			return path.resolve(file);
		});

		options.files = _.unique(options.files, false);

        // Return commits
		grunt.util.spawn({
			cmd: 'git',
			args: ['log', '--date=short', "--pretty=%h %cd %d %s"]
		},
		function (error, result) {

			if (error)	handleError(error);
			else		parseCommits(result);
		});
	});
};