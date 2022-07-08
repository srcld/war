const fs = require('fs');
const archiver = require('archiver');

const createFolderIfNotPresent = function (dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

const createManifest = function (array = [], dir = './META-INF', name = 'MANIFEST.MF') {
    createFolderIfNotPresent(dir);

    const data = array.map((o) => {
        return o.key + ': ' + o.value;
    }).join('\n');

    fs.writeFileSync([dir, name].join('/'), data);
}

const logLine = function (num = 25) {
    console.log('-'.repeat(num));
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
            console.log(archive.pointer() + ' total bytes');
            resolve({fullPath, fileName, path});
        });

        output.on('end', function () {
            console.log('Data has been drained');
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
                console.log('ADDING: ' + source + ' : ' + target);
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

module.exports = {
    buildByConfig: function (cfg = {}) {
        const {name, targetFolder, sources, manifestArray} = cfg;
        return this.build(name, targetFolder, sources, manifestArray);
    },
    build: function (name, targetFolder, sources, manifestArray = []) {
        logLine();
        if (manifestArray.length) {
            console.log('CREATING MANIFEST')
            createManifest(manifestArray);
        }
        console.log('CREATING ARCHIVE')
        logLine();
        return createArchive(name, targetFolder, sources).then((success) => {
            logLine();
            console.log(success ? 'DONE.' : 'BUILD FAILED.')
            return success;
        });
    },
    createManifest,
    createArchive
}