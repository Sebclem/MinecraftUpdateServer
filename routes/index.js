const express = require('express');


const router = express.Router();

const glob = require("glob");
const fs = require("fs");
const sha1 = require("sha1-file");
const chokidar = require('chokidar');
const delay = require('delay');

let fileList = [];
let triggered = false;
let watcher = chokidar.watch('public/', {ignored: /^\./, persistent: true});


router.get('/getFilesManifest', function (req, res, next) {
    if(triggered){
        let loop = setInterval((res) =>{
            if(!triggered){
                res.json(fileList);
                clearInterval(loop);
            }
        }, 10, res);
    }
    else
        res.json(fileList);

});

watcher
    .on('add', listener)
    .on('change', listener)
    .on('unlink', listener)
    .on('error', function(error) {console.error('Error happened', error);});


function listener() {
    if (!triggered){
        console.log("Trigger! Waiting...");
        triggered = true;
        setTimeout(listFile, 5000);
    }
}



function listFile() {
    fileList = [];
    triggered = false;
    glob("public/**", {nodir:true},(er, files) =>{
        console.log("Listing Files...");
        files.forEach((file) => {
            let fileName = file.slice(file.lastIndexOf('/')+1);
            let hash = sha1(file);
            let size = fs.statSync(file).size;
            fileList.push({id: fileName, path: file.replace("public/", ""), hash: hash, size: size});


        });

        console.log("...Done");
    });
}

module.exports = router;
