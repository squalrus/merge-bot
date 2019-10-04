module.exports = {
    "pull_request": {
        "head": {
            "ref": "master"
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
        "number": "20",
        "requested_reviewers": ["squalrus"]
    },
    "repository":{
        "name": "merge-bot",
        "owner": {
            "login": "squalrus"
        }
    }
};
