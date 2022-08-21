const express = require('express');


const router = express.Router();

const glob = require("glob");
const fs = require("fs");
const sha1 = require("sha1-file");
const chokidar = require('chokidar');
const delay = require('delay');

let fileList = [];
let triggered = false;
let forgeTriggered = false;
let watcher = chokidar.watch('public/resources', { ignored: /^\./, persistent: true });

let forgeWatcher = chokidar.watch('public/forge', { ignored: /^\./, persistent: true });

let farbricWatcher = chokidar.watch('public/fabric', { ignored: /^\./, persistent: true });


router.get('/getFilesManifest', function (req, res, next) {
    if (triggered) {
        let loop = setInterval((res) => {
            if (!triggered) {
                res.json(fileList);
                clearInterval(loop);
            }
        }, 10, res);
    } else
        res.json(fileList);

});


router.get('/getForgeManifest/:version', function (req, res, next) {
    let version = req.params.version
    if (version == null) {
        res.status(400);
        res.send()
    } else {
        if (fs.existsSync(`public/forge/${version}`)) {
            let manifest = JSON.parse(fs.readFileSync(`public/forge/${version}/manifest.json`));
            for (let lib of manifest.libraries) {
                if (!lib.downloads.artifact.url) {
                    let splited = lib.downloads.artifact.path.split('/')
                    let name = splited[splited.length - 1]
                    lib.downloads.artifact.url = `/forge/${version}/${name}`
                }
            }
            res.json(manifest);
        } else {
            res.status(404);
            res.send()
        }
    }

});

router.get('/getFabicManifest/:version', function (req, res, next) {
    let version = req.params.version
    if (version == null) {
        res.status(400);
        res.send()
    } else {
        if (fs.existsSync(`public/fabric/${version}`)) {
            let manifest = JSON.parse(fs.readFileSync(`public/forge/${version}/manifest.json`));
            for (let lib of manifest.libraries) {
                if (lib.downloads && !lib.downloads.artifact.url) {
                    let splited = lib.downloads.artifact.path.split('/')
                    let name = splited[splited.length - 1]
                    lib.downloads.artifact.url = `/forge/${version}/${name}`
                }
            }
            res.json(manifest);
        } else {
            res.status(404);
            res.send()
        }
    }

});

watcher
    .on('add', listener)
    .on('change', listener)
    .on('unlink', listener)
    .on('error', function (error) {
        console.error('Error happened', error);
    });


function listener() {
    if (!triggered) {
        console.log("Trigger! Waiting...");
        triggered = true;
        setTimeout(listFile, 5000);
    }
}

forgeWatcher
    .on('add', frogeListener)
    .on('change', frogeListener)
    .on('unlink', frogeListener)
    .on('error', function (error) {
        console.error('Error happened', error);
    });

function frogeListener() {
    if (!forgeTriggered) {
        console.log("Trigger forge! Waiting...");
        forgeTriggered = true;
        setTimeout(buildForgeManifest, 5000);
    }
}


farbricWatcher
    .on('add', fabricListener)
    .on('change', fabricListener)
    .on('unlink', fabricListener)
    .on('error', function (error) {
        console.error('Error happened', error);
    });

// function fabricListener() {
//     if (!forgeTriggered) {
//         console.log("Trigger fabric! Waiting...");
//         forgeTriggered = true;
//         setTimeout(buildForgeManifest, 5000);
//     }
// }

// function buildLoaderManifest(subfolder) {
//     let dir = fs.readdirSync(`public/${subfolder}`);
//     for (let folder of dir) {
//         console.log(`Check forge for ${folder} ...`)
//         if (fs.existsSync(`public/${subfolder}/${folder}/manifest.json`)) {
//             let manifest = JSON.parse(fs.readFileSync(`public/forge/${folder}/manifest.json`));
//             let libNames = []
//             for(let lib of manifest["libraries"]){
//                 libNames.push(lib.name);
//             }
//             glob(`public/${subfolder}/${folder}/**`, { nodir: true }, (er, files) => {
//                 files.forEach((file) => {
//                     let fileName = file.slice(file.lastIndexOf('/') + 1);
//                     if(!fileName.includes("json") && !libNames.includes(fileName)){
//                         let filePath;
//                         if(file.includes("client"))
//                             filePath = file.replace(`public/forge/${dir}/`, 'net/minecraft/')
//                         else
//                             filePath = `net/minecraftforge/forge/${dir}/${file.slice(file.lastIndexOf('/') + 1)}`;
//                         let hash = sha1(file);
//                         let size = fs.statSync(file).size;

//                         manifest["libraries"].push({
//                             name: fileName,
//                             downloads:
//                                 {
//                                     artifact: {
//                                         path: filePath,
//                                         url: file.replace("public/", "/"),
//                                         sha1: hash,
//                                         size: size
//                                     }
//                                 }
//                         })
//                     }
//                 });
//                 fs.writeFileSync(`public/forge/${folder}/manifest.json`, JSON.stringify(manifest, null, 2));
//                 console.log(`...Done`)
//             })
//         } else {
//             console.log(`...No manifest found`)
//         }
//     }
// }


function listFile() {
    fileList = [];
    triggered = false;
    glob("public/resources/**", { nodir: true }, (er, files) => {
        console.log("Listing Files...");
        files.forEach((file) => {
            let fileName = file.slice(file.lastIndexOf('/') + 1);
            let hash = sha1(file);
            let size = fs.statSync(file).size;
            fileList.push({ id: fileName, path: file.replace("public/resources/", ""), hash: hash, size: size });


        });

        console.log("...Done");
    });
}

module.exports = router;
