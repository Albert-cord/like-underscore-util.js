// Karma configuration
// Generated on Sun Jun 02 2019 14:28:04 GMT+0800 (中国标准时间)

module.exports = function(config) {
    var configuration = {

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['qunit'],
        // plugins: ['karma-qunit', 'karma-chrome-launcher', 'karma-phantomjs-launcher'],
        plugins: ['karma-qunit', 'karma-phantomjs-launcher', 'karma-coverage'],

        // list of files / patterns to load in the browser
        files: [
            // 'test/vendor/qunit-extras.js',
            'test/qunit-setup.js',
            'like-underscore-util.js',
            'test/*.js'
        ],


        // list of files / patterns to exclude
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'coverage'],


        // web server port
        port: 9876,

        client: {
            clearContext: false,
            qunit: {
                showUI: true,
                testTimeout: 5000
            }
        },

        coverageReporter: {
            reporters: [
                {
                    type: 'text-summary', subdir: ''
                },
                {
                    type: 'lcov', subdir: '', dir: 'coverage/'
                }
            ]
        },

        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],
        // browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,
        // customLaunchers: {
        //     Chrome_travis_ci: {
        //         base: 'Chrome',
        //         flags: ['--no-sandbox']
        //     }
        // },

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    }

    // if (process.env.TRAVIS) {
    //     configuration.browsers = ['Chrome_travis_ci'];
    // }
     
    config.set(configuration);
}
