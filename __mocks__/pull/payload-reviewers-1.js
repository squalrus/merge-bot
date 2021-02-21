module.exports = {
    "pull_request": {
        "base": {
            "repo": {
                "id": 123
            }
        },
        "head": {
            "ref": "master",
            "repo": {
                "id": 123
            }
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
        "name": "merge-bot",
        "owner": {
            "login": "squalrus"
        }
    }
};
