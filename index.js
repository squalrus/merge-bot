const core = require('@actions/core');
const github = require('@actions/github');

function reviewsCompleted(required, requests, reviews) {
    // review not required
    if (required === 'false') {
        return true;
    }

    // pending reviews
    if (requests.length > 0) {
        return false;
    }

    if (Object.keys(reviews).length == 0) {
        return false;
    }

    // reviews all approved
    for (let [key, value] of Object.entries(reviews)) {
        console.log(key, value);
        if (value.state !== "APPROVED"){
            return false;
        }
    }

    return true;
}

function getReviews(reviews) {
    const data = reviews.data;
    let compiled = {};

    data.forEach(element => {
        const user = element.user.login;
        const date = element.submitted_at;
        const state = element.state;

        if (typeof(compiled[user]) !== 'undefined') {
            if (date > compiled[user].date) {
                compiled[user] = {
                    date: date,
                    state: state
                }
            }
        } else {
            compiled[user] = {
                date: date,
                state: state
            }
        }
    });

    return compiled;
}

async function run() {
    try {
        const test = core.getInput('test');
        console.log(`test mode: ${test}`);

        const reviewRequired = core.getInput('reviewers');
        console.log(`required reviewers: ${reviewRequired}`);

        const requiredLabels = core.getInput('labels').split(',').map(x => x.trim());
        console.log(`required labels: ${JSON.stringify(requiredLabels)}`);

        const blockingLabels = core.getInput('blocking-labels').split(',').map(x => x.trim());
        console.log(`blocking labels: ${JSON.stringify(blockingLabels)}`);

        const method = core.getInput('method');
        console.log(`merge method: ${method}`);

        const payload = github.context.payload;
        // console.log(`the event payload: ${JSON.stringify(payload, undefined, 2)}`);

        const ref = `heads/${payload.pull_request.head.ref}`
        let change = 'unknown';

        // check if labeled change
        if (payload.action == 'labeled') {
            change = `label '${payload.label.name}' added`
        }
        if (payload.action == 'unlabeled') {
            change = `label '${payload.label.name}' removed`
        }

        // create a GitHub client
        const token = core.getInput('GITHUB_TOKEN');
        const octokit = new github.GitHub(token);

        const labels = payload.pull_request.labels.map(x => x.name);

        const requestedReviewers = payload.pull_request.requested_reviewers;
        const reviews = await octokit.pulls.listReviews({
            owner: payload.pull_request.user.login,
            repo: payload.repository.name,
            pull_number: payload.pull_request.number
        });
        const compiledReviews = getReviews(reviews);

        console.log(`reviews: ${JSON.stringify(compiledReviews)}`);
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
blocking label(s): ${JSON.stringify(blockingLabels)}
reviewers required: ${reviewRequired}
merge method: ${method}

#### pull request stats
labels: ${JSON.stringify(labels)}
requested reviewers: ${JSON.stringify(requestedReviewers.map(x => x.login))}
reviewers: ${JSON.stringify(compiledReviews)}

#### result
eligible for merge: ${(requiredLabels.every(x => labels.includes(x)) &&
                        !blockingLabels.every(x => labels.includes(x))) &&
                        reviewsCompleted(reviewRequired, requestedReviewers, compiledReviews)}`
            });
        } else {
            if ((requiredLabels.every(x => labels.includes(x)) &&
                !blockingLabels.every(x => labels.includes(x))) &&
                reviewsCompleted(reviewRequired, requestedReviewers, compiledReviews)) {
                // merge the pull request
                octokit.pulls.merge({
                    owner: payload.pull_request.user.login,
                    repo: payload.repository.name,
                    pull_number: payload.number,
                    merge_method: method
                });

                // delete the branch
                octokit.git.deleteRef({
                    owner: payload.pull_request.user.login,
                    repo: payload.repository.name,
                    ref: ref
                });
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
