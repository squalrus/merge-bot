module.exports = `### merge bot test mode
> triggered by: foo

#### integration requirements
required label(s): [\"ready\",\"merge\"]
blocking label(s): [\"do not merge\"]
reviewers required: true
merge method: squash

#### pull request stats
labels: [\"foo\",\"bar\",\"ready\"]
requested reviewers: [\"squalrus\",\"timgrove\"]
reviewers: []
checks: {}

#### result
eligible for merge: false`;
