const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    try {
        const nameToGreet = core.getInput('who-to-greet');
        console.log(`Hello ${nameToGreet}!`);

        const time = (new Date()).toDateString();
        core.setOutput('time', time);

        const payload = github.context.payload;
        console.log(`The event payload: ${JSON.stringify(github.context.payload, undefined, 2)}`);

        // check if labeled change
        if (payload.action == 'labeled') {
            console.log("LABELED");
        }

        if (payload.action == 'unlabeled') {
            console.log("UNLABELED");
        }

        // create a GitHub client
        const token = core.getInput('GITHUB_TOKEN');
        const octokit = new github.GitHub(token);

        // get requested reviewer list
        const reviewers = await octokit.pulls.listReviews({
            owner: payload.pull_request.user.login,
            repo: payload.repository.name,
            pull_number: payload.number
        });

        console.log(`Reviewers: ${JSON.stringify(reviewers)}`);

        const labels = octokit.issues.listLabelsOnIssue({
            owner: payload.pull_request.user.login,
            repo: payload.repository.name,
            issue_number: payload.number
        });

        console.log(`Labels: ${JSON.stringify(labels)}`);

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
