const core = require('@actions/core');
const github = require('@actions/github');

const Config = require('./lib/config')
const Pull = require('./lib/pull');
const renderMessage = require('./lib/message');

async function run() {
    try {
        console.log(`action: ${github.context.payload.action}`);
        console.log(`[data] payload: ${JSON.stringify(github.context.payload)}`);

        const config = new Config(core);
        console.log(`[data] config: ${JSON.stringify(config)}`);

        const pull = new Pull(github.context.payload);
        console.log(`[data] pull (payload): ${JSON.stringify(pull)}`);

        const token = core.getInput('GITHUB_TOKEN');
        const octokit = new github.GitHub(token);

        console.log(`[info] get reviews`);
        const reviews = await octokit.pulls.listReviews({
            owner: pull.owner,
            repo: pull.repo,
            pull_number: pull.pull_number
        });

        console.log(`[info] get checks`);
        const checks = await octokit.checks.listForRef({
            owner: pull.owner,
            repo: pull.repo,
            ref: pull.branch_name
        });

        pull.compileReviews(reviews);
        pull.compileChecks(checks);
        console.log(`[data] pull (checks + reviews): ${JSON.stringify(pull)}`);

        console.log(`merge: ${pull.canMerge(config)}`);

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
                console.log(`[info] merge start`);
                await octokit.pulls.merge({
                    owner: pull.owner,
                    repo: pull.repo,
                    pull_number: pull.pull_number,
                    merge_method: config.merge_method
                });
                console.log(`[info] merge complete`);

                if (config.delete_source_branch) {
                    // delete the branch
                    console.log(`[info] delete start`);
                    await octokit.git.deleteRef({
                        owner: pull.owner,
                        repo: pull.repo,
                        ref: pull.ref
                    });
                    console.log(`[info] delete complete`);
                }
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
