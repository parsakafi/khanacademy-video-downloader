const https = require('https');
const path = require('path');
const fs = require('fs');
const F = require('./functions');
const config = require('./config');

if (process.argv.length < 3) {
    console.log(`Usage: node khanacademy-downloader.js {Course Link}`);
    return;
}

let pageURL = process.argv[2];

if (F.isValidUrl(pageURL))
    startDownload(pageURL);
else
    console.error('URL is not valid!');

async function startDownload(pageURL) {
    let videosInfo = await getPage(pageURL);

    if (videosInfo) {
        let courseDirName = F.sanitizeString(videosInfo.title),
            catNumber = 1, videoContinuousNumber = 1;

        await F.getDownloadDir(courseDirName);

        for (cat of videosInfo.info) {
            let catDir = await F.getDownloadDir(courseDirName + path.sep + catNumber + '- ' + F.sanitizeString(cat.catTitle)),
                videoNumber = 1;

            for (video of cat.items) {
                let videoTitle = video.title,
                    fileName = videoTitle.replace(/[^a-zA-Z0-9 ]/g, "") + '.mp4',
                    filePath = catDir + path.sep + (config.fileContinuousNumber ? videoContinuousNumber : videoNumber) + '- ' + fileName;

                videoNumber++;
                videoContinuousNumber++;

                if (config.skipExistsFile && fs.existsSync(filePath)) {
                    console.log(fileName + ' exists, Skip download.');
                    continue;
                }

                await F.downloadFile(video.downloadURL, filePath).then(function gotData(data) {
                    console.log(videoTitle + ', Download Complete.');
                }, reason => {
                    console.log('Error, ' + reason);
                });
            }

            catNumber++;
        }
    }
}

async function getPage(pageURL) {
    return new Promise(function (resolve, reject) {
        https.get(pageURL, res => {
            res.setEncoding("utf8");
            let body = "";
            res.on("data", data => {
                body += data;
            });
            res.on("end", () => {
                resolve({
                    info: getCourseInfo(body),
                    title: F.findTitle(body)
                });
            });
            res.on('error', (e) => {
                reject(e)
            });
        });
    })
}

function getCourseInfo(str) {
    let info = [];
    const regex = /(?:app-entry.js"] = )(?:\{)(.*(\n.*?)*)(?:\"\})/gm;
    let res = regex.exec(str);
    if (res !== null) {
        if (typeof res[0] !== "undefined") {
            let data = res[0].replace('app-entry.js"] = ', '') + '}}';
            data = JSON.parse(data);
            data = data.dataCache['content-en'];
            data = data[Object.keys(data)[0]];
            tutorials = data.data.tabs[0].modules[0].tutorials;

            for (tutorial of tutorials) {
                let items = [];
                for (item of tutorial.contentItems) {
                    if (item.kind === 'Video') {
                        items.push({
                            title: item.title,
                            slug: item.slug,
                            url: item.nodeUrl,
                            description: item.description,
                            youtubeId: item.youtubeId,
                            downloadURL: item.downloadUrls.mp4
                        });
                    }
                }

                if (items.length === 0)
                    continue;

                info.push({
                    catSlug: tutorial.slug,
                    catTitle: tutorial.title,
                    items: items
                });
            }

            return info;
        }
    }
    return null;
}