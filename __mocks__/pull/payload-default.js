module.exports = {
    "pull_request": {
        "head": {
            "ref": "master",
            "sha": "1234724d27c4fae27b402212182b64fda77040b5"
        },
        "labels": [
            {
                "name": "foo"
            },
            {
                "name": "bar"
            },
            {
                "name": "ready"
            }
        ],
        "number": 20,
        "requested_reviewers": ["squalrus", "timgrove"],
        "user": {
            "login": "squalrus"
        }
    },
    "repository":{
        "name": "merge-bot",
        "owner": {
            "login": "squalrus"
        }
    }
};
