class CoreComplex {
    getInput(key) {
        switch (key) {
            case 'blocking-labels':
                return 'hold,  stop,no';

            case 'labels':
                return 'good-n-ready,nice,  okay';

            case 'method':
                return 'squash';

            case 'reviewers':
                return 'false';

            case 'test':
                return 'false';

            default:
                break;
        }
    }
}

module.exports = CoreComplex;
