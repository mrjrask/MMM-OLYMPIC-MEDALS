/* global Module Log moment config */

/* Magic Mirror
 * Module: MMM-OLYMPIC-MEDALS
 *
 * By taylornoss https://github.com/taylornoss/MMM-OLYMPIC-MEDALS
 * MIT Licensed.
 */


Module.register('MMM-OLYMPIC-MEDALS', {

    defaults: {
        season: 'summer', //summer or winter
        year: '2024', //muse be valid for the season (e.g. summer divisible by 4, winter even but not divisible by 4)
        reloadInterval: 60 * 60 * 1000, // every hour
        tableSize: 'xsmall',
        numOfRows: 10,
        useAbbreviations: false,
        pageFlipInterval: 15 * 1000
    },

    getTranslations() {
        return {
            en: 'translations/en.json',
        };
    },

    getStyles() {
        return ['font-awesome.css', 'MMM-OLYMPIC-MEDALS.css'];
    },

    getTemplate() {
        return `templates/${this.name}.njk`;
    },

    getTemplateData() {
        const sortedByGoldRows = this.getRowsSortedByGold();
        return {
            loaded: this.loaded,
            rows: this.rows,
            sortedByGoldRows,
            config: this.config,
            noData: this.noData,
            configError: this.configError,
            activePage: this.activePage,
            fns: { translate: this.translate.bind(this) }
        };
    },

    start() {
        Log.info(`Starting module: ${this.name}`);
        this.loaded = false;
        this.rows = [];
        this.activePage = 1;
        this.config.season = this.config.season.toLowerCase();
        this.getData();
        setInterval(() => {
            console.log("Refreshing Olympics data...");
            this.getData();
        }, this.config.reloadInterval);

        setInterval(() => {
            this.activePage = this.activePage === 1 ? 2 : 1;
            this.updateDom();
        }, this.config.pageFlipInterval);
    },

    suspend() { },

    resume() { },

    getData() {
        var sendData = {
            id: this.identifier,
            config: this.config
        }
        this.sendSocketNotification('GET-Olympic-Data', sendData);
    },


    socketNotificationReceived(notification, payload) {
        if (notification === 'OLYMPIC-DATA' && payload.identifier === this.identifier) {
            this.rows = payload.rows;
            this.noData = (payload.header === "No Medals Data")
            this.loaded = true;
            this.configError = false;
            this.updateDom();
        }
        else if (notification === 'OLYMPIC-CONFIG-ERROR' && payload === this.identifier) {
            this.configError = true;
            this.updateDom();
        }
    },

    getRowsSortedByGold() {
        if (!Array.isArray(this.rows)) {
            return [];
        }

        return [...this.rows].sort((a, b) => {
            const goldDifference = this.toNumber(b.gold) - this.toNumber(a.gold);
            if (goldDifference !== 0) {
                return goldDifference;
            }

            return this.toNumber(b.total) - this.toNumber(a.total);
        });
    },

    toNumber(value) {
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
});
