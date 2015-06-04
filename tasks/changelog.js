'use strict';

var moment = require('moment');

module.exports = function (grunt) {

	grunt.registerMultiTask('changelog', 'Generate a Markdown-formatted changelog from git commits, grouped by tags', function () {

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
					hash			= commit.substr(0, 7),
					message			= commit.substr(8),
					tag,
					tagRegex		= /\(tag: (.*)\) (.*)/g,
					version;

				// Parse a tag and output new heading
				tag = tagRegex.exec(message);

				if (tag) {

					// Split the tag into an array, but only retrieve the version
					version = (tag[1].split(','))[0];

					changelog += '\n' + version + '\n';
					changelog += new Array((version.length + 1)).join('-') + '\n';

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

        // Output the generated changelog
		function writeChangelog (changelog) {

			grunt.file.write(options.dest, changelog);

			grunt.log.writeln('Changelog generated at '+ options.dest.toString().cyan + '.');
		}

		// Merge task-specific and/or target-specific options with these defaults.
		var	done	= this.async(),
			options	= this.options({
				dest: './changelog.md',
				version: '0.0.0'
			});

        // Return commits
		grunt.util.spawn({
			cmd: 'git',
			args: ['log', '--decorate']
		},
		function (error, result) {

			if (error) {

				grunt.log.error(error);

				return done(false);
			}

			parseCommits(result);

			done();
		});
	});
};