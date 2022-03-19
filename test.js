const war = require('./index')

let manifestData = [{
    key: 'Manifest-Version', value: '1.0'
}, {
    key: 'Bundle-SymbolicName', value: 'Sourcloud Data Services'
}, {
    key: 'Bundle-Name', value: 'Sourcloud Data Services'
}, {
    key: 'Bundle-Version', value: '0.0.1'
}, {
    key: 'Build', value: '4711'
}, {
    key: 'Web-ContextPath', value: 'bpc-fe-srcldds'
}, {
    key: 'Webapp-Context', value: 'bpc-fe-srcldds'
}, {
    key: 'Bundle-ManifestVersion', value: '2'
}]

let folders = [{
    source: 'build/srcldds',
    target: false
}, {
    source: 'META-INF',
    target: 'META-INF'
}]

war.build('srcldds', 'build', folders, manifestData);