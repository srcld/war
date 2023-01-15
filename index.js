const fs = require('fs');
const archiver = require('archiver');

const tempBuildFolder = './build-tmp';

const log = function (text, level = 'i') {
    const now = new Date().toISOString();
    const messageData = [now, level, text];
    console.log(messageData.join(' : '));
}

const createFolderIfNotPresent = function (dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

const createManifest = function (array = [], dir = '/META-INF', name = 'MANIFEST.MF') {
    dir = tempBuildFolder + dir;
    createFolderIfNotPresent(dir);

    const data = array.map((o) => {
        return o.key + ': ' + o.value;
    }).join('\n');

    const logMessage = 'MANIFEST CREATED\n' + data;
    log(logMessage);

    fs.writeFileSync([dir, name].join('/'), data);
}

const logLine = function (num = 25) {
    log('-'.repeat(num));
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const createArchive = function (name, folder, sources = [], format = 'zip', ending = '.war') {
    const path = './' + folder ? (folder.endsWith('/') ? folder : (folder + '/')) : '';
    createFolderIfNotPresent(path);
    const fileName = name + ending,
        fullPath = path + fileName,
        output = fs.createWriteStream(fullPath),
        archive = archiver(format, {});
    return new Promise(async (resolve) => {
        // check quickstart -> https://www.npmjs.com/package/archiver
        output.on('close', () => {
            log(archive.pointer() + ' total bytes');
            resolve({fullPath, fileName, path});
        });

        output.on('end', function () {
            log('Data has been drained');
        });

        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') { // log warning
            } else {
                resolve(false); // throw err;
            }
        });

        archive.on('error', function (err) {
            resolve(false);//throw err;
        });

        archive.pipe(output);


        for (let sourceCfg of sources) {
            let {source, target} = sourceCfg || {};
            if (typeof source !== 'undefined' && typeof target !== 'undefined') {
                log('ADDING: ' + source + ' : ' + target);
                archive.directory(source, target);
                await wait(20)

                // to ensure the order, we delay here ... not good but working
                // otherwise ie karaf fileinstall will complain

                // can be checked use jar tool
                // jar tf build/generatedJarWar.war

                // expected output starting like:
                // META-INF/
                // META-INF/MANIFEST.MF

            }
        }

        await archive.finalize();
    });

}

const build = function (name, targetFolder, sources, manifestArray = []) {
    createFolderIfNotPresent('./build-tmp')
    logLine();
    if (manifestArray.length) {
        log('CREATING MANIFEST')
        createManifest(manifestArray);
        sources.push({
            source: tempBuildFolder,
            target: false
        })
        sources.reverse();
    } else {
        log('NO MANIFEST DATA FOUND.')
    }
    log('CREATING ARCHIVE')
    logLine();
    return createArchive(name, targetFolder, sources).then((success) => {
        logLine();
        log(success ? 'DONE.' : 'BUILD FAILED.')
        return success;
    });
};

const buildByConfig = function (config = {}) {
    const {name, targetFolder, sources, manifestArray} = config;
    return build(name, targetFolder, sources, manifestArray);
}

module.exports = {
    createFolderIfNotPresent,
    buildByConfig,
    build,
    createManifest,
    createArchive
}