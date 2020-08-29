const fs = require('fs');
const URL = require('url').URL;
const path = require('path');
const https = require('https');

String.prototype.trimLeft = function (charlist) {
    if (charlist === undefined)
        charlist = "\s";

    return this.replace(new RegExp("^[" + charlist + "]+"), "");
};

String.prototype.trimRight = function (charlist) {
    if (charlist === undefined)
        charlist = "\s";

    return this.replace(new RegExp("[" + charlist + "]+$"), "");
};

String.prototype.trim = function (charlist) {
    return this.trimLeft(charlist).trimRight(charlist);
};

const downloadFile = async (url, name) => {
    const file = fs.createWriteStream(name);
    return new Promise((resolve, reject) => {
        let request = https.get(url, function (response) {
            response.pipe(file);

            file.on('finish', function () {
                file.close();
                resolve(response);
            });
        });

        /* if there's an error, then reject the Promise
             * (can be handled with Promise.prototype.catch) */
        request.on('error', reject);

        request.end();
    });
}

const findTitle = str => {
    let title = str.match(/<title.*?>(.*)<\/title>/)[1];
    if (title) {
        return title.split('|')[0].trim();
    } else {
        return null;
    }
}

/*
* https://github.com/parsakafi/google-font-downloader
*/
const getDownloadDir = async (subDir = null, firstDelete = false) => {
    let dir = __dirname + path.sep + 'Downloads';
    if (subDir) {
        subDir = subDir.trim('.');
        dir += path.sep + subDir;
    }

    if (firstDelete && fs.existsSync(dir))
        fs.rmdirSync(dir, { recursive: true });
    await sleep(500);
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
    return dir;
};

const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// https://stackoverflow.com/a/55585593/3224296
const isValidUrl = (s) => {
    try {
        new URL(s);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

function sanitizeString(str) {
    str = str.replace(/[^a-zA-Z0-9 \._-]/gim, "");
    return str.trim();
}

module.exports = { downloadFile, findTitle, getDownloadDir, sleep, isValidUrl, sanitizeString };