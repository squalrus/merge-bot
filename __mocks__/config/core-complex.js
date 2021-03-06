class CoreComplex {
    getInput(key) {
        switch (key) {
            case 'blocking_labels':
                return 'hold,  stop,no';

            case 'labels':
                return 'good-n-ready,nice,  okay';

            case 'method':
                return 'squash';

            case 'reviewers':
                return 'false';

            case 'checks_enabled':
                return 'true';

            case 'test':
                return 'false';

            default:
                break;
        }
    }
}

module.exports = CoreComplex;
