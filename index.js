const core = require('@actions/core');
const github = require('@actions/github');

const Config = require('./lib/config')
const Pull = require('./lib/pull');
const renderMessage = require('./lib/message');

async function run() {
    try {
        const config = new Config(core);
        console.log(`config: ${JSON.stringify(config)}`);

        const pull = new Pull(github.context.payload);
        console.log(`pull: ${JSON.stringify(pull)}`);

        const token = core.getInput('GITHUB_TOKEN');
        const octokit = new github.GitHub(token);

        const reviews = await octokit.pulls.listReviews({
            owner: pull.owner,
            repo: pull.repo,
            pull_number: pull.pull_number
        });

        pull.compileReviews(reviews);

        if (config.test_mode) {

            // comment in test mode
            await octokit.issues.createComment({
                owner: pull.owner,
                repo: pull.repo,
                issue_number: pull.pull_number,
                body: renderMessage(github.context.payload.action, config, pull)
            });

        } else {
            if (pull.canMerge(config)) {

                // merge the pull request
                octokit.pulls.merge({
                    owner: pull.owner,
                    repo: pull.repo,
                    pull_number: pull.pull_number,
                    merge_method: config.merge_method
                });

                // delete the branch
                octokit.git.deleteRef({
                    owner: pull.owner,
                    repo: pull.repo,
                    ref: pull.ref
                });
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
