const request = require('request')
const { URL } = require('url')
const url = require('url')
const { ArachniScanOptions } = require('./arachni-scan-options')


class ArachniAPI {
    constructor(baseURL = "http://" + process.env.ARACHNI_URL + ":" + process.env.ARACHNI_PORT) {
        /**
         * Base URL for perform SCANs
         * @type {URL}
         */
        this.baseURL = (new URL(baseURL)).href;
        this.scanID = null;
        /**
         * @type {ArachniScanOptions}
         */
        this.scanOpts = new ArachniScanOptions();
        this.user = 'arachni';
        this.pass = 'arachni';
        this.init = false;
    }
    pingArachni(cb) {
        try {
            request.get(url.resolve(this.baseURL, '/scans'), {
                'json': true,
                'auth': {
                    'user': this.user,
                    'pass': this.pass,
                    'sendImmediately': false
                }
            }, (err, res, body) => {
                if (err)
                    cb(processError(err));
                else {
                    try {
                        body = JSON.parse(body)
                    } catch (err) { }
                    if (body.error) {
                        if (body.error.length > 100) {
                            cb(body.error.slice(0, 100))
                        } else {
                            cb(body.error)
                        }
                    } else {
                        cb(null, body);
                    }
                }
            })
        } catch (err) {
            cb(err)
        }

    }
    setScanOptions(opts) {
        this.scanOpts = opts;
    }
    setScanChecks(checks) {
        if (checks.length > 0)
            this.scanOpts.checks = checks;
        else
            this.scanOpts.checks = ['*'];
    }
    startNewScan(scanURL, cb) {
        if (this.init)
            return;
        this.init = true;
        this.scanOpts.url = scanURL;
        console.log("Seted scan URL: " + scanURL)
        request.post(url.resolve(this.baseURL, '/scans'), {
            'json': true,
            'body': this.scanOpts,
            'auth': {
                'user': this.user,
                'pass': this.pass,
                'sendImmediately': false
            }
        }, (err, res, body) => {
            if (err) {
                cb(processError(err));
            }
            else {
                try {
                    body = JSON.parse(body)
                } catch (err) { }
                if (body.id) {
                    this.scanID = body.id;
                    cb(null, body);
                } else {
                    if (body.error) {
                        if (body.error.length > 100) {
                            cb(body.error.slice(0, 100))
                        } else {
                            cb(body.error)
                        }
                    } else {
                        cb(new Error("Some error"));
                    }
                }

            }
        })
    }
    pauseScan(cb) {
        request.put(url.resolve(url.resolve(this.baseURL, '/scans/' + this.scanID + '/pause')), {
            'json': true,
            'auth': {
                'user': this.user,
                'pass': this.pass,
                'sendImmediately': false
            }
        }, (err, res, body) => {
            if (err)
                cb(processError(err));
            else {
                cb(null, body);
            }
        })
    }
    resumeScan(cb) {
        request.put(url.resolve(this.baseURL, '/scans/' + this.scanID + '/resume'), {
            'json': true,
            'auth': {
                'user': this.user,
                'pass': this.pass,
                'sendImmediately': false
            }
        }, (err, res, body) => {
            if (err)
                cb(processError(err));
            else {
                cb(null, body);
            }
        })
    }
    getProgress(cb) {
        request.get(url.resolve(this.baseURL, '/scans/' + this.scanID), {
            'json': true,
            'auth': {
                'user': this.user,
                'pass': this.pass,
                'sendImmediately': false
            }
        }, (err, res, body) => {
            if (err)
                cb(processError(err));
            else {
                try {
                    if (typeof body === 'string')
                        body = JSON.parse(body)
                    if (body.status)
                        cb(null, body);
                    else
                        cb(new Error("No valid response"));

                } catch (err) {
                    cb(err);
                }

            }
        })
    }
    getSummary(cb) {
        request.get(url.resolve(this.baseURL, '/scans/' + this.scanID + '/summary'), {
            'json': true,
            'auth': {
                'user': this.user,
                'pass': this.pass,
                'sendImmediately': false
            }
        }, (err, res, body) => {
            if (err)
                cb(processError(err));
            else {
                cb(null, body);
            }
        })
    }
    /**
     * Returns a simple scan report with the next parameters:
     * {
            "name" : val.name,
            "severity" : val.severity,
            "check" : val.check & val.check.name ? val.check.name : "",
            "vector" : ((val.vector && val.vector.type) ?  val.vector.type : "")+ ((val.vector && val.vector.class) ?  val.vector.class : "") + ((val.vector && val.vector.action) ?  val.vector.action : ""),
            "url" : ((val.page && val.page.dom && val.page.dom.url) ?  val.page.dom.url : "")
        }
     * @param {} cb 
     */
    getReport(cb) {
        request.get(url.resolve(this.baseURL, '/scans/' + this.scanID + '/report.json'), {
            'json': true,
            'auth': {
                'user': this.user,
                'pass': this.pass,
                'sendImmediately': false
            }
        }, (err, res, body) => {
            if (err)
                cb(processError(err));
            else {
                console.log(body)
                if(body.error){
                    cb(body.error)
                }else if (body.issues && body.issues.length > 0) {
                    cb(null, {
                        "url": body.options && body.options.url ? body.options.url : "",
                        "issues": body.issues.map((val, i, arr) => {
                            return {
                                "name": val.name,
                                "severity": val.severity,
                                "check": val.check & val.check.name ? val.check.name : "",
                                "vector": ((val.vector && val.vector.type) ? val.vector.type : "") + ((val.vector && val.vector.class) ? val.vector.class : "") + ((val.vector && val.vector.action) ? val.vector.action : ""),
                                "url": ((val.page && val.page.dom && val.page.dom.url) ? val.page.dom.url : "")
                            }
                        }),
                        "delta_time" : body.delta_time ? body.delta_time : "0:0:1",
                        "start_datetime" : body.start_datetime ? body.start_datetime : (new Date()).toISOString(),
                        "finish_datetime" : body.finish_datetime ? body.finish_datetime : (new Date()).toISOString(),
                    })
                } else if (body.options && body.options.url) {
                    cb(null, {
                        "url": body.options && body.options.url ? body.options.url : "",
                        "issues": [],
                        "delta_time" : body.delta_time ? body.delta_time : "0:0:1",
                        "start_datetime" : body.start_datetime ? body.start_datetime : (new Date()).toISOString(),
                        "finish_datetime" : body.finish_datetime ? body.finish_datetime : (new Date()).toISOString(),
                    });
                } else {
                    cb(new Error("Scan not found"));
                }
            }
        })
    }
    /**
     * Like getReport() but with all posibilities
     */
    getJSONReport(cb) {
        request.get(url.resolve(this.baseURL, '/scans/' + this.scanID + '/report.json'), {
            'json': true,
            'auth': {
                'user': this.user,
                'pass': this.pass,
                'sendImmediately': false
            }
        }, (err, res, body) => {
            if (err)
                cb(processError(err));
            else {
                if (body) {
                    cb(null, body)
                } else {
                    cb(null, {'url' : '',"issues": []});
                }
            }
        })
    }
    getHTMLReport(cb) {
        request.get(url.resolve(this.baseURL, '/scans/' + this.scanID + '/report.html.zip'), {
            'json': true,
            'auth': {
                'user': this.user,
                'pass': this.pass,
                'sendImmediately': false
            }
        }, (err, res, body) => {
            if (err)
                cb(processError(err));
            else {
                cb(null, body);
            }
        })
    }
    shutdownScan(cb) {
        request.delete(url.resolve(this.baseURL, '/scans/' + this.scanID), {
            'json': true,
            'auth': {
                'user': this.user,
                'pass': this.pass,
                'sendImmediately': false
            }
        }, (err, res, body) => {
            if (err)
                cb(processError(err));
            else {
                cb(null, body);
            }
        })
    }
}

function processError(err) {
    if (err.code) {
        err.message = (err.code ? err.code + " " : "ECONNREFUSED ") + (err.address ? err.address + ":" : "¿¿??:") + (err.port ? err.port : "¿¿??") + "";
    }
    return err;
}

exports.ArachniAPI = ArachniAPI;
