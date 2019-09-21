const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    try {
        const debug = core.getInput('debug');
        console.log(`Debug mode: ${debug}`);

        const requiredLabels = core.getInput('labels');
        console.log(`Required labels: ${JSON.stringify(requiredLabels)}`);

        const payload = github.context.payload;
        console.log(`The event payload: ${JSON.stringify(github.context.payload, undefined, 2)}`);

        // check if labeled change
        if (payload.action == 'labeled' || payload.action == 'unlabeled') {
            console.log("LABEL CHANGE");
        }

        // create a GitHub client
        const token = core.getInput('GITHUB_TOKEN');
        const octokit = new github.GitHub(token);

        // get requested reviewer list

        console.log(`Reviewers: ${JSON.stringify(payload.pull_request.requested_reviewers)}`);
        console.log(`Labels: ${JSON.stringify(payload.pull_request.labels)}`);

        await octokit.issues.createComment({
            owner: 'squalrus',
            repo: payload.repository.name,
            issue_number: payload.number,
            body: `howdy: ${payload.label.name}`
        });
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
