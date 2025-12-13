const { createRequire } = require('node:module');
require = createRequire(__filename); 

const fs = require('fs')
const https = require('https'); 
const http = require("http");  
const path = require('path');
const passport = require('passport');
const express = require('express');
const { ThrottleGroup } = require("stream-throttle");

const {
  sleep,
  readcfg,
  redisInit,
  redisConnect,
  grpcInit,
  getOnlineSites,
  writeActivate,
  checkActivate,
  isDbReady,
  getValue,
  writeServiceBuffer,
  writeFile,
  checkFile,
  writeImage,
  getServiceMessage,
  readConfigs,
  readGroups,
  readDevices,
} = require('./common')
let cfg = readcfg(true);
const client = redisInit(cfg.redisIP, cfg.redisPort)  

// const { dbase, dbts, gateway, onvif } = grpcInit()
const { dbase, dbts, gateway, } = grpcInit()

async function main () {

  const ready = await isDbReady(dbase)
  if (ready && ready.status)  {
    console.log('db is ready ->', ready.status)
  }
  else  {
    console.log('db is not ready ->', ready)
    await sleep(1e3*10)
    main()
    return
  }

  await client.connect()

/*   if (cfg.server)  {
    const servers = await readGroups(dbase)
    await redisSet('GROUPS', servers)
  }
  const sites = await readConfigs(dbase)
  await redisSet('SITES', sites) */

  const app = express();
  
  const interfaces = require('./routes/interfaces').router;
  const interfaceInit = require('./routes/interfaces').interfaceInit
  interfaceInit(
    readcfg, 
    dbase, 
    gateway, 
    dbts, 
    client, 
    redisConnect,
    getValue,
    getServiceMessage,
    readConfigs,
    readGroups,
    readDevices,
    // isDbReady,
    sleep,
  );
  
  const preferences = require('./routes/preferences').router
  require('./routes/preferences').restInit(
    readcfg, 
    dbase, 
    dbts,
    getOnlineSites,
    writeActivate,
    checkActivate,
    client,
    redisConnect,
    writeFile,
    writeImage,
    checkFile,
  )
  
  const privateKey = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIOpyGWVPkvyZ4rlasjabX0RhSh2QUuVNMkPr6FHa3mMKoAoGCCqGSM49
AwEHoUQDQgAEBiW5dvc7OchCg1jWu7oGMOXUtQOzQN766o7+us8DZ5nRcuCHxjWD
xgwGEMbQsQsaMrwk3CT3jDCb3Kh9UoYsWA==
-----END EC PRIVATE KEY-----`
 
  app.use(passport.initialize());
  require('./libs/passport')(passport, dbase, privateKey)

  const users = require('./routes/users').router;
  require('./routes/users').userInit(dbase, dbts, privateKey ); 

  /* Since express 4.16.0, you can also do: */
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  app.use('/api/preferences', preferences);
  app.use('/api/users', users);
  app.use('/api/interfaces', interfaces);
  
  /*  */  
  const process = require('process');
  const cdir = process.cwd();
  console.log('cdir / _dir ->', cdir, __dirname)
  app.use(express.static(path.join(cdir, 'build')));
  // app.use(express.static(path.join(__dirname, 'build')));
  app.get('/*', function(req, res) {
    // res.sendFile(path.join(__dirname, 'build', 'index.html'));
    res.sendFile(path.join(cdir, 'build', 'index.html'));
  });  
  /*  */
      
  /* 
    MODBUS arm
  */
  app.post('/files_download/modbus_arm.sh', function(req, res) {
    console.log(cdir, __dirname);
    console.log(req.body);
    if (!cfg.server)  {
      res.send(JSON.stringify({ text: 'Hello'}));
      return
    } 
    res.sendFile(cdir+'/files_download/modbus_arm.sh');
  });
  
  /* 
    Light arm
  */
    app.post('/files_download/light_arm.sh', function(req, res) {
      console.log(cdir, __dirname);
      console.log(req.body);
      if (!cfg.server)  {
        res.send(JSON.stringify({ text: 'Hello'}));
        return
      } 
      res.sendFile(cdir+'/files_download/light_arm.sh');
    });

    app.post('/files_download/systemd_light.sh', function(req, res) {
      console.log(cdir, __dirname);
      console.log(req.body);
      if (!cfg.server)  {
        res.send(JSON.stringify({ text: 'Hello'}));
        return
      } 
      res.sendFile(cdir+'/files_download/systemd_light.sh');
    });
    
  /* 
    beariot arm
  */

  app.post('/files_download/beariot_arm.sh', function(req, res) {
    console.log(cdir, __dirname);
    console.log(req.body);
    if (!cfg.server)  {
      res.send(JSON.stringify({ text: 'Hello'}));
      return
    } 
    res.sendFile(cdir+'/files_download/beariot_arm.sh');
  });

  app.post('/files_download/systemd_arm.sh', function(req, res) {
    console.log(cdir, __dirname);
    console.log(req.body);
    if (!cfg.server)  {
      res.send(JSON.stringify({ text: 'Hello'}));
      return
    } 
    res.sendFile(cdir+'/files_download/systemd_arm.sh');
  });
  
  /* 
    beariot x86
  */

  app.post('/files_download/beariot_x86.sh', function(req, res) {
    console.log(cdir, __dirname);
    console.log(req.body);
    if (!cfg.server)  {
      res.send(JSON.stringify({ text: 'Hello'}));
      return
    } 
    res.sendFile(cdir+'/files_download/beariot_x86.sh');
  });

  app.post('/files_download/systemd_x86.sh', function(req, res) {
    console.log(cdir, __dirname);
    console.log(req.body);
    if (!cfg.server)  {
      res.send(JSON.stringify({ text: 'Hello'}));
      return
    } 
    res.sendFile(cdir+'/files_download/systemd_x86.sh');
  });

  /* 
    Common used
  */
  app.post('/files_download/download.sh', function(req, res) {
    // console.log(cdir, __dirname);
    console.log('POST Body ->', req.body);
    if (!cfg.server)  {
      res.send(JSON.stringify({ text: 'Hello'}));
      return
    } 
    let request = req.body
    if (request.filename)  {
      res.sendFile(cdir+request.filename);
      return    
    }
    console.log('File not found!')
    res.send(JSON.stringify({ text: 'File not found!'}));
  });
  
/*   app.get('/files_download/update', function(req, res) {
    let query = req.query;
    console.log('GET Query ->', query,);
    if (query.filename)  {
      if (fs.existsSync(cdir+/files_download/+query.filename)) {
        res.sendFile(cdir+/files_download/+query.filename);
        return
      }
    }
    console.log('File not found!')
    res.send(JSON.stringify({ text: 'File not found!'}));
  }); */

  /* 
    update program (post)
  */
  app.post('/files_download/update', function(req, res) {
    let query = req.query;
    let rate = 1024
    cfg = readcfg(false);
    if (cfg.updateRate)  rate = cfg.updateRate
    console.log('\nupdate ->', query, rate, 'kBps');
    if (query.filename)  {
      if (fs.existsSync(cdir+/files_download/+query.filename)) {
  
        const tg = new ThrottleGroup({rate: rate*1024}); // 1 MiB (or 1024 k) per sec by default
        const rstream = fs.createReadStream(cdir+/files_download/+query.filename);

        rstream  //throttle here
        .pipe(tg.throttle()) 
        .pipe(res,);
        
        rstream  //define event 
        .on('open', ()=>{
          console.log('Open ->', new Date()+'')
        })        
        .on('data', (chunk) => {
          // process.stdout.write("\rStreaming -> " + rate + 'kBps / ' + new Date() + ' / ' + chunk.length);
          // process.stdout.write("\rstream -> " + new Date() + ' / ' + chunk.length +'\r');
          // process.stdout.write("\rstream -> " +  query.filename + ' / ' + chunk.length +' -> ')
        })
        .on('error', () => {
          console.log('Error ->', new Date()+'')
        })
        .on('close', () => {
          console.log('Close ->', new Date()+'')
        })
        /* res.sendFile(cdir+/files_download/+query.filename); */
        return
      }
    }
    console.log('File to be downloaded not found!')
    res.send(JSON.stringify({ text: 'File not found!'}));  
  });
  
  const PORT = process.env.PORT || cfg.serverPort;
  let dateTime = new Date();
  
  let options = null
  
  if (fs.existsSync('../secret/beariot.key') && fs.existsSync('../secret/beariot.crt'))  {
    console.log('cert key -> ../secret/')
    options = {
      key: fs.readFileSync('../secret/beariot.key'),
      cert: fs.readFileSync('../secret/beariot.crt'),
    }
  }
  
  // console.log('https options ->', options)
  
  if ((cfg.protocal === 'https'  || cfg.protocal === 'HTTPS') && options)  {
    const server = https.createServer(options, app);
    server.listen(PORT, () => {
      console.log('Program is running as HTTPS on PORT', PORT, 'Start at ->', dateTime.getDate()+'/'+(dateTime.getMonth()+1)+'/'+dateTime.getFullYear(), 
                   dateTime.getHours()+':'+dateTime.getMinutes()+':'+dateTime.getSeconds());
    });
    const socketInit = require('./libs/socket.js').socketInit
    socketInit(
      sleep,
      server, 
      readcfg, 
      dbts, 
      client, 
      redisConnect,
      getOnlineSites,
      getValue,
      writeServiceBuffer,
    );
  }
  else  {

    if (cfg.protocal === 'http'  || cfg.protocal === 'HTTP')  {
      const server = http.createServer(app);
      server.listen(PORT, () => {
        console.log('Program is running as HTTP on PORT', PORT, 'Start at ->', dateTime.getDate()+'/'+(dateTime.getMonth()+1)+'/'+dateTime.getFullYear(), 
                     dateTime.getHours()+':'+dateTime.getMinutes()+':'+dateTime.getSeconds());
      });    
      const socketInit = require('./libs/socket.js').socketInit
      socketInit(
        sleep,
        server, 
        readcfg, 
        dbts, 
        client, 
        redisConnect,
        getOnlineSites,      
        getValue,
        writeServiceBuffer,
      );
    }  

  } 
    
/*   const iface = http.createServer(app);
  iface.listen(cfg.interfacePort, () => {
    console.log('Interface is running as HTTP on PORT', cfg.interfacePort, 'Start at ->', dateTime.getDate()+'/'+(dateTime.getMonth()+1)+'/'+dateTime.getFullYear(), 
                  dateTime.getHours()+':'+dateTime.getMinutes()+':'+dateTime.getSeconds());
  }) */

}

if (require.main === module) {
  main()
}
