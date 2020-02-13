# puppeteer-comic

基于[puppeteer](https://github.com/puppeteer/puppeteer)的漫画爬取脚本

## Install

```shell
npm i puppeteer-comic -g
```

## Usage

- 全局安装使用`pupic`；
- 非全局安装使用`node_modules/.bin/pupic`

#### 列出掷出的漫画站点

```shell
pupic -l
```

#### 爬取漫画

```shell
pupic -s <漫画站点名字> -c <要下载漫画的目录url>
```

###### 指定范围下载

章节名字以麻花目录页面为准。优先读取元素`title`属性，然后是`innerText`。

```
pupic -s <漫画站点名字> -c <要下载漫画的目录url> -r <漫画章节>
```

- 下载单话
  ```shell
  -r 第10话
  ```

- 下载范围
  ```shell
  -r 第10话,第30话
  ```


#### 更多命令

```shell
pupic -h
```

## Contributing

Feel free to dive in! [Open an issue](https://github.com/isaaxite/puppeteer-comic/issues) or submit PRs.

## License

[MIT](https://github.com/isaaxite/puppeteer-comic/blob/master/LICENSE)


