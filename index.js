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

        console.log(`Reviewers: ${JSON.stringify(payload.pull_request.requested_reviewers)}`);
        console.log(`Labels: ${JSON.stringify(labels)}`);

        if (debug){
            await octokit.issues.createComment({
                owner: 'squalrus',
                repo: payload.repository.name,
                issue_number: payload.number,
                body: `### merge bot test mode
> triggered by: ${change}

required labels: ${requiredLabels}

labels: ${JSON.stringify(labels)}
reviewers: ${JSON.stringify(payload.pull_request.requested_reviewers)}

eligible for merge: ${labels.includes(requiredLabels)}`

            });
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
