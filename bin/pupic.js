#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const program = require('commander');
const siteConf = require('../conf');
const core = require('../core');
const conf = {
  site: '',
  catalog: '',
  range: '',
  headless: true
};
let needToRun = true;
program
  .option('-s --site <string>', '站点名字', setComicSite)
  .option('-l --list', '列出站点名字', showComicSite)
  .option('-c --catalog <string>', '设定漫画目录地址', setCatalog)
  .option('-r --range <string>', '指定下载范围，以半角逗号分隔，exp：-r 2话,18话，实际范围参考漫画目录页面', setRange)
  .option('-i --init', '生成siteConf模板文件', initSiteConfFile)
  .option('--headless <boolean>', '默认使用headless模式', setHeadless);
program.parse(process.argv);
needToRun && core.spider(conf);

function setComicSite(val) {
  conf.site = val;
}

function showComicSite() {
  needToRun = false;
  const list = Object.entries(siteConf).map(([key, item]) => {
    return `${key}: ${item.homePage}`;
  });
  console.log(list.join('\n'));
}

function setCatalog(val) {
  conf.catalog = val;
}

function setRange(val) {
  try {
    conf.range = val.split(','); 
  } catch (error) {
    conf.range = [];
  }
}

function setHeadless (val) {
  conf.headless = val === 'true';
}

function initSiteConfFile() {
  needToRun = false;
  const tempPath = path.resolve(__dirname, '../.pupic.site.temp');
  const userSiteConfPath = path.join(process.cwd(), 'pupic.site.js');
  if (fs.existsSync(userSiteConfPath)) {
    throw new Error('pupic.site.js 文件已存在');
  }
  fs.createReadStream(tempPath).pipe(
    fs.createWriteStream(userSiteConfPath)
  );
}
