const fs = require('fs');
const path = require('path');
const conf = {
  chuixue: {
    homePage: 'http://www.chuixue.net',
    catalog: '',
    range: [],
    headless: true,
    selector: {
      catalog: {
        comicName: '#intro_l > div.title > h1',
        chapterArrParent: '#play_0',
        chapterArr: '#play_0 li > a'
      },
      chapter: {
        img: '#viewimg',
        async isLastPage(page, idx) {
          const len = await page.$$eval('#selectpage1 > select > option', (elArr) => elArr.length);
          return idx + 1 >= len;
        },
        generatePageUrl(domain, chapterHref, idx) {
          return `${domain}${chapterHref}?page=${idx + 1}`;
        }
      }
    }
  },
  fzdm: {
    homePage: 'https://manhua.fzdm.com',
    catalog: '',
    range: [],
    headless: true,
    selector: {
      catalog: {
        comicName: '#content > h2',
        chapterArrParent: '',
        chapterArr: '#content > li > a'
      },
      chapter: {
        img: '#mhpic',
        async isLastPage(page) {
          const isLast = await page.$$eval('#pjax-container > div.navigation > a', (elArr) => {
            const href = elArr[elArr.length - 1].getAttribute('href');
            return href.startsWith('../');
          });
          return isLast;
        },
        generatePageUrl(domain, chapterHref, idx) {
          return `${fzdm.catalog}${chapterHref}index_${idx}.html`;
        }
      }
    }
  },
  manhuafen: {
    homePage: 'https://www.manhuafen.com',
    catalog: '',
    range: [],
    headless: true,
    selector: {
      catalog: {
        comicName: 'body > div.wrap.autoHeight > div.wrap_intro_l.widthEigLeft.con_left > div.wrap_intro_l_comic.autoHeight > div.comic_deCon.autoHeight > h1',
        chapterArrParent: '',
        chapterArr: '#chapter-list-1 > li > a'
      },
      chapter: {
        img: '#images > img',
        async isLastPage(page, idx) {
          let isLast = true;
          try {
            const len = await page.$$eval('#page_select > option', (elArr) => elArr.length);
            isLast = idx + 1 >= len; 
          } catch (error) {
            isLast = false;
          }
          return isLast;
        },
        generatePageUrl(domain, chapterHref, idx) {
          const url = `${domain}${chapterHref}?p=${idx + 1}`;
          return url;
        }
      }
    }
  },
  bidongmh: {
    homePage: 'https://www.bidongmh.com',
    catalog: '',
    range: [],
    headless: true,
    selector: {
      catalog: {
        comicName: 'body > div.container > div.container.top-padding > div:nth-child(2) > div.detail-main > div > div.comic-intro > div.title-warper > h1',
        chapterArrParent: '',
        chapterArr: '#chapterList > li > a'
      },
      chapter: {
        img: '#content > div.comiclist > div > img',
        async isLastPage() {
          return true;
        },
        generatePageUrl(domain, chapterHref) {
          const url = `${domain}${chapterHref}`;
          return url;
        }
      }
    }
  }
};

function getConf() {
  let userSiteConf;
  const userSiteConfPath = path.join(process.cwd(), 'pupic.site.js');
  if (fs.existsSync(userSiteConfPath)) {
    try {
      userSiteConf = require(userSiteConfPath); 
    } catch (error) {
      userSiteConf = {};
    }
  }
  const siteConf = Object.assign(conf, userSiteConf);
  return siteConf;
}

module.exports = getConf();
