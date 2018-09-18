import * as fs from "fs";

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var loadRouter = require('./routes/load');

var app = express();

app.use(logger('dev'));
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use("/load", loadRouter);

module.exports = app;

let platform = process.platform;
console.log(`This platform is ${platform}.`);

function saveData(name, data) {
    fs.writeFileSync(`${name}.out`, `${new Date().toString()}\n${data}\n\n\n`, "utf-8");
}

function logWindows(name) {
    var spawn = require('child_process').spawn,child;
    child = spawn(`powershell.exe -file ${path.resolve(__dirname, "../scripts/get-process.ps1")} -processName ${name}`);

    child.stdout.on("data", function(data) {
        saveData(name, data);
    });
    child.stderr.on("data",function(data) {
        console.log(`Powershell Errors: ${data}`);
    });
    child.on("exit",function() {
        console.log("Powershell Script finished.");
    });
    child.stdin.end();
}

let processNames = process.env.PROCESS_NAMES ? JSON.parse(process.env.PROCESS_NAMES)  : ["openfin"];
let memoryLog = () => {
    processNames.forEach(name => {
        switch (platform.toUpperCase()) {
            case "WIN32":
                logWindows(name);
                break;
            case "DARWIN":
                //TO-DO
                break;
            case "LINUX":
                //TO-DO
                break;
        }
    });
};

setInterval(memoryLog, 1000);