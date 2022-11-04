const core = require('@actions/core');
const github = require('@actions/github');

const Config = require('./lib/config')
const Pull = require('./lib/pull');
const renderMessage = require('./lib/message');

async function run() {
    try {
        const payload = github.context.payload;
        console.log(`action: ${payload.action}`);
        console.log(`[data] payload: ${JSON.stringify(payload)}`);

        const config = new Config(core);
        console.log(`[data] config: ${JSON.stringify(config)}`);

        const token = core.getInput('GITHUB_TOKEN');
        const octokit = new github.getOctokit(token);

        if (payload.issue) {
            // invoked by pull request comment
            const response = await octokit.pulls.get({
                owner: payload.repository.owner.login,
                repo: payload.repository.name,
                pull_number: payload.issue.number,
            });
            payload.pull_request = response.data;
            console.log(`pull request retrieved from ${this.owner}/${this.repo}/issues/${payload.issue.number})`);
        }

        const pull = new Pull(payload);
        console.log(`[data] pull (payload): ${JSON.stringify(pull)}`);

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
                    if (pull.headRepoId !== pull.baseRepoId) {
                        console.log(`[warning] unable to delete branch from fork, branch retained`);
                    } else {
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
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
