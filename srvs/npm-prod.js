'use strict';

var redisIP = process.env.REDIS_IP || 'localhost';
var beanstakIP = process.env.BEANSTALK_IP || 'localhost';
var influxIP = process.env.INFLUX_IP || 'localhost';

require('seneca')()
  .use('redis-transport')
  .use('beanstalk-transport')
  // disabled as not compatible with seneca 0.6 yet
  //.use('jsonfile-store')
  .use('mem-store',{web:{dump:true}})
  .use('collector', { host: influxIP, database: 'stats', seriesName: 'actions' })
  .use('../npm.js')
  .add('role:info,req:part',function(args,done){
    done();
    this.act('role:npm,cmd:get', {name:args.name}, function(err,mod){
      if( err ) { return done(err); }
      this.act('role:info,res:part,part:npm', {name:args.name,data:mod.data$()});
    });
  })
  .listen({host: redisIP, type:'redis',pin:'role:npm,req:part'})
  .client({host: redisIP, type:'redis',pin:'role:search,res:part'})
  .listen({host: beanstakIP, port: 1130, type: 'beanstalk', pin: 'role:npm,cmd:*'})
  .client({host: beanstakIP, port: 1130, type: 'beanstalk', pin: 'role:search,cmd:*'});

