const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    try {
        const test = core.getInput('test');
        console.log(`test mode: ${test}`);

        const requiredReviewers = core.getInput('reviewers');
        console.log(`required reviewers: ${requiredReviewers}`);

        const requiredLabels = core.getInput('labels').split(',').map(x => x.trim());
        console.log(`required labels: ${JSON.stringify(requiredLabels)}`);

        const method = core.getInput('method');
        console.log(`merge method: ${method}`);

        const payload = github.context.payload;
        console.log(`the event payload: ${JSON.stringify(github.context.payload, undefined, 2)}`);

        let change = 'unknown';

        // check if labeled change
        if (payload.action == 'labeled') {
            change = `Label '${payload.label.name}' added`
        }
        if (payload.action == 'unlabeled') {
            change = `Label '${payload.label.name}' removed`
        }

        // create a GitHub client
        const token = core.getInput('GITHUB_TOKEN');
        const octokit = new github.GitHub(token);

        const labels = payload.pull_request.labels.map(x => x.name);

        console.log(`reviewers: ${JSON.stringify(payload.pull_request.requested_reviewers)}`);
        console.log(`labels: ${JSON.stringify(labels)}`);

        if (test == 'true') {
            await octokit.issues.createComment({
                owner: payload.pull_request.user.login,
                repo: payload.repository.name,
                issue_number: payload.number,
                body: `### merge bot test mode
> triggered by: ${change}

#### integration requirements
required label(s): ${JSON.stringify(requiredLabels)}
reviewers required: ${requiredReviewers}
merge method: ${method}

#### pull request stats
labels: ${JSON.stringify(labels)}
reviewers: ${JSON.stringify(payload.pull_request.requested_reviewers)}

#### result
eligible for merge: ${requiredLabels.every(x => labels.includes(x))}`

            });
        } else {
            octokit.pulls.merge({
                owner: payload.pull_request.user.login,
                repo: payload.repository.name,
                pull_number: payload.number,
                merge_method: method
            });
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
