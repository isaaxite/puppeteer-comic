const fs = require('fs');
const path = require('path');
const URL = require('url').URL;
const axios = require('axios');
const puppeteer = require('puppeteer');
const siteConf = require('./conf');

module.exports.spider = async (userConf) => {
  const conf = initConf(userConf);
  const catelogUrlIns = new URL(conf.catalog);
  const domain = catelogUrlIns.origin;
  const browser = await puppeteer.launch({ headless: conf.headless });
  const page = await browser.newPage();
  await page.goto(conf.catalog, { timeout: 2 * 60 * 1000 });
  await page.waitFor(conf.selector.catalog.comicName);
  const comicName = await page.$eval(conf.selector.catalog.comicName, (ele) => ele.innerText);
  const comicDir = path.join(process.cwd(), comicName);
  if (!fs.existsSync(comicDir)) { fs.mkdirSync(comicDir); }
  if (conf.selector.catalog.chapterArrParent) {
    await page.waitFor(conf.selector.catalog.chapterArrParent);
  }
  const chapterArr = await page.$$eval(conf.selector.catalog.chapterArr, function(eleArr){
    const chapterArr = [];
    for (const ele of eleArr) {
      chapterArr.push({
        title: ele.getAttribute('title') || ele.innerText,
        href: ele.getAttribute('href')
      });
    }
    return chapterArr;
  });

  const chapterInfoArr = [];
  const downloadFail = {};
  const rangeedChapterArr = getChapterRange(chapterArr, conf.range);
  for (const chapter of rangeedChapterArr) {
    const srcArr = [];
    const dir = path.join(comicDir, chapter.title);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir); }
    for (let i = 0; true; i += 1) {
      let src;
      let pageUrl;
      try {
        pageUrl = conf.selector.chapter.generatePageUrl(domain, chapter.href, i);
        const resp = await page.goto(pageUrl, { timeout: 2 * 60 * 1000 });
        const imgSelector = conf.selector.chapter.img;
        await page.waitFor(imgSelector, { timeout: 60 * 1000 });
        const srcArr = await page.$$eval(imgSelector, (eleArr) => {
          return eleArr.map((ele) => ele.getAttribute('src'));
        });
        for (srcIdx = 0, len = srcArr.length; srcIdx < len; srcIdx += 1) {
          src = srcArr[srcIdx];
          const imgName = len > 1
            ? `${i + 1}.${srcIdx + 1}`
            : i + 1;
          await saveImage(src, pageUrl, `${dir}/${imgName}.${src.split('.').pop()}`);
          srcArr.push(src);
        }
      } catch (error) {
        if (!downloadFail.chapter) downloadFail.chapter = [];
        downloadFail.chapter.push({ pageUrl, src });
        console.log(error);
        console.log('download fail:', { pageUrl, src });
      }

      if (await conf.selector.chapter.isLastPage(page, i)) {
        break;
      }
    }
    chapterInfoArr.push({
      title: chapter.title,
      srcArr
    });
  }
  if (Object.keys(downloadFail).length) {
    console.log('download fail:', downloadFail);
  } 
  await browser.close();
};

async function saveImage(src, referer, savePath) {
  const options = {
    method: 'GET',
    responseType:'stream',
    headers: { 'Referer': referer },
    url: src,
  };
  console.log('download: ', src);
  const imgStream = await axios.request(options).then((resp) => {
    const isValid = resp.statusText === 'OK';
      if (isValid) {
        return Promise.resolve(resp.data);
      } else {
        console.warn(`download fail: ${src}`);
      }
  }).catch((e) => {
    console.error(e.message);
  });
  imgStream && imgStream.pipe(fs.createWriteStream(savePath));
}

function getChapterRange(chapterArr, _range) {
  if (!_range || !_range.length) { return chapterArr; }
  let idx = 0;
  const range = _range.length > 2 ? _range.slice(0, 2) : _range;
  const rangeIdxArr = [];
  for (const item of chapterArr) {
    if (range.includes(item.title)) {
      rangeIdxArr.push(idx)
    }
    if (rangeIdxArr.length === range.length) {
      break;
    }
    idx += 1;
  }
  const sortedRangeIdxArr = rangeIdxArr.sort((p, n) => p - n);
  let rangeedChapterArr;
  switch (sortedRangeIdxArr.length) {
    case 0:
      rangeedChapterArr = chapterArr;
      break;
    case 1:
      rangeedChapterArr = chapterArr.slice(sortedRangeIdxArr[0], sortedRangeIdxArr[0] + 1);
      break;
    case 2:
      rangeedChapterArr = chapterArr.slice(sortedRangeIdxArr[0], sortedRangeIdxArr[1] + 1);
      break;
    default:
      rangeedChapterArr = chapterArr;
  }
  return rangeedChapterArr;
}

function initConf(userConf) {
  const siteNameArr = Object.keys(siteConf);
  if (!userConf.site || !siteNameArr.includes(userConf.site)) {
    throw new Error(`--site <站点名>，${siteNameArr.join(', ')}`);
  }
  const site = siteConf[userConf.site];
  if (!userConf.catalog) {
    throw new Error('--catalog <漫画目录url>');
  }
  if (userConf.range && userConf.range.length) {
    try {
      site.range = userConf.range.slice(0, 2); 
    } catch (error) {
      site.range = [];
    }
  }
  if (!userConf.headless) {
    site.headless = false;
  }
  site.catalog = userConf.catalog;
  return site;
}
