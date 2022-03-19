const fs = require('fs');
const archiver = require('archiver');

// script basically
// copied from https://www.npmjs.com/package/archiver

const createFolderIfNotPresent = function (dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

const createManifest = function (array = [], dir = './META-INF', name = 'MANIFEST.MF') {
    const data = array.map((o) => {
        return o.key + ': ' + o.value;
    }).join('\n');
    createFolderIfNotPresent(dir);
    fs.writeFileSync([dir, name].join('/'), data);
}

const createArchive = function (name, folder, sources = [], format = 'zip', ending = '.war') {
    const path = './' + folder ? (folder.endsWith('/') ? folder : (folder + '/')) : '';
    createFolderIfNotPresent(path);
    const output = fs.createWriteStream(path + name + ending);
    const archive = archiver('zip', {});
    return new Promise((resolve) => {
        output.on('close', function () {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            resolve(true);
        });

        output.on('end', function () {
            console.log('Data has been drained');
        });

        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
            } else {
                resolve(false); // throw err;
            }
        });

        archive.on('error', function (err) {
            resolve(false);//throw err;
        });

        archive.pipe(output);

        sources.map((sourceCfg) => {
            archive.directory(sourceCfg.source, sourceCfg.target);
        });

        archive.finalize();
    });

}

module.exports = {
    createManifest,
    createArchive,
    build: function (name, targetFolder, sources, manifestArray = []) {
        if (manifestArray.length) {
            console.log('CREATING MANIFEST')
            createManifest(manifestArray);
        }
        console.log('CREATING ARCHIVE')
        createArchive(name, targetFolder, sources);
        console.log('DONE.')
    }
}