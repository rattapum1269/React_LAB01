const port = 3300;
module.exports = {
    server: true,  // true or false
    protocal: 'http',  // http or https

    productName: 'BeaRiOT',
    sitePrefix: 'BR',
    groupPrefix: 'BG',
    baseName: 'bear_config',
    logName: 'bear_log',
    alarmName: 'bear_alarm',
    updateRate: 4096,  // 1024 = 1mbits/sec
    lowStorageAlert: 51,  // %
    node: 0,
    desktop: true,

    /* Service Port */
    serverPort: port,
    gatewayPort: port+1,
    dbasePort: port+2,
    dbtsPort: port+3,
    queuePort: port+4,
    wsPort: port+5,
    redisPort: port+6,
    interfacePort: port+7,
    
    /* Service IP */
    dbaseIP: 'localhost',
    dbtsIP: 'localhost',
    gatewayIP: 'localhost',
    queueIP: 'localhost',
    redisIP: 'localhost',
    dbaseURL: 'mongodb://127.0.0.1:27017/',    

    corsOrigin: [
        "http://localhost:3000", // dev mode
        "http://localhost:3300", // dev mode
        "http://localhost:8000", // dev mode
    ],

    serverURL: '192.168.2.56',
    socketURL: '192.168.2.56',
    
}
