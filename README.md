### 初始化

  http://git.qfang.com/qfang-frontend/bi
  
```
cd bi
npm i
rm -rf .happypack dist && npm start
```

### 配置接口地址

修改 webpack-config/dev-server.js 中 target 的地址。
若使用本机模拟数据，则需要在本机启动另外一个 web 服务访问 data/ 目录下的相关 mock 数据。

```
cd data
anywhere
```

### 访问

http://localhost:8080/stat-pc-front/xxxxxx.html
  
### 打包

生成打包文件于 dist 目录下

```
rm -rf .happypack dist && npm run build
```

### 合并

提交打包后的文件（dist 目录中所有文件和目录）至 BI 项目 SVN 仓库

https://192.168.0.250/svn/product/trunk/yunfang/bi/stat-front/stat-pc-front

### api 文档

http://bi.qfang.com:9100/swagger-ui.html
