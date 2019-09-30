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
        "requested_reviewers": ["squalrus"],
        "user": {
            "login": "squalrus"
        }
    },
    "repository":{
        "name": "merge-bot"
    }
};
