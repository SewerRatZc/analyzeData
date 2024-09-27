# 屏幕刷新电频分析工具

## 项目介绍

该项目是我在实习期间为公司墨水屏阅读器的刷新频率校准测试开发的辅助工具。工具通过采集并分析电频数据，帮助工程师校准墨水屏幕的刷新频率，确保产品性能优化。该工具支持自动与手动的校准模式，并通过图表实时展示屏幕刷新过程中的电频信号，方便工程师分析。此外，项目中使用了 ChatGPT 进行智能辅助开发，帮助快速生成代码模板并优化性能，使得项目在短时间内高效完成。

#### 文件结构

```javascript
analyzeData         // 项目名称
├── src              // 源代码
│   ├── main         // 主进程
│   │   └── index.js // 主入口文件
│   ├── preload      // 预加载脚本
│   │   └── index.js // 预加载入口文件
│   ├── renderer      // 渲染进程
│   │   └── src      // 渲染相关资源
│   │       ├── assets // 静态资源
│   │       │   ├── base.css
│   │       │   ├── electron.svg
│   │       │   └── wavy-lines.svg
│   │       ├── components // 组件
│   │       │   └── Versions.vue
│   │       ├── App.vue // 主应用组件
│   │       └── main.js // 渲染进程入口文件
│   └── index.html   // HTML 入口文件
├── .editorconfig     // 编辑器配置
├── eslintrc.cjs      // ESLint 配置
├── .gitignore        // Git 忽略文件
├── npmrc             // npm 配置
├── .prettierignore   // Prettier 忽略文件
├── .prettierrc.yaml  // Prettier 配置
├── dev-app-update.yml // 应用更新配置
├── electron-builder.yml // Electron 构建配置
├── electron-vite.config.mjs // Electron Vite 配置
├── package.json      // 项目配置文件
└── README.md         // 项目说明文件

```

## 环境部署

### 准备工作

```bash
nodejs >= v20.15.1
npm >= 10.7.0
visual studio 里的c++编译和windows jdk
依赖版本：
├── @electron-toolkit/eslint-config@1.0.2
├── @electron-toolkit/preload@3.0.1
├── @electron-toolkit/utils@3.0.0
├── @rushstack/eslint-patch@1.10.4
├── @vitejs/plugin-vue@5.1.4
├── @vue/eslint-config-prettier@9.0.0
├── axios@1.7.7
├── better-sqlite3@11.3.0
├── chart.js@4.4.4
├── chartjs-adapter-date-fns@3.0.0
├── chartjs-plugin-datalabels@2.2.0
├── echarts@5.5.1
├── electron-builder@24.13.3
├── electron-rebuild@3.2.9
├── electron-updater@6.3.4
├── electron-vite@2.3.0
├── electron@31.6.0
├── eslint-plugin-vue@9.28.0
├── eslint@8.57.1
├── prettier@3.3.3
├── sqlite3@5.1.7
├── vite@5.4.6
├── vue-chartjs@5.3.1
└── vue@3.5.6
```

### 运行系统

#### 安装

```bash
$ npm install
```

#### 运行

```bash
$ npm run dev
```

#### 环境搭建

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac
```

## 项目展示

1.选择功能上传，解析文件后自动刷新

每秒刷新一次，每次通过数字电路图展示三十组电频信息

![image](https://i.ibb.co/rMjWj72/image.png "image")

2.暂停，恢复自动刷新

![image](https://i.ibb.co/w0bfFZD/image.png "image")

3.打开，关闭展示具体通道解析的信息

点击想关闭或开启的通道按钮，关闭展示对应的通道曲线

![image-20240927165903702](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20240927165903702.png)

4.放大缩小数字电路图像

拖拽缩放尺标，放大看图像

![image(5)](C:\Users\Administrator\Downloads\有道云笔记_files\image(5).png)

5.拖拽进度条调整加载到的块文件

![image-20240927170102642](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20240927170102642.png)

6.根据时间戳查找数据块

输入要查找的时间戳，展示查找到的时间戳所在的数据块

![image-20240927170145431](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20240927170145431.png)

7.根据块号查找文件

在前端输入块号，查找到对应的块文件

![image-20240927170208556](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20240927170208556.png)

![image-20240927170248595](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20240927170248595.png)

8.展示具体图像内具体信息

监听到鼠标指针聚焦到图像内某点上时，展示该时间戳每个通道电频详细信息

![image-20240927170313503](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20240927170313503.png)



## 技术栈：

**前端：** Vue.js、ECharts、JavaScript、HTML、CSS&#x20;

**后端：**Electron-vite、Node.js&#x20;

**数据库：**SQLite，基于解析的文件生成独立数据库存储块数据和时间戳索引&#x20;

**AI工具：**ChatGPT 辅助开发&#x20;

## 项目职责：

**数据采集模块：**设计并实现了通过路径选择加载测试数据的功能，并结合缓存机制优化了块文件的加载效率。&#x20;

**图表展示与实时刷新：**使用 ECharts图表库进行数据的实时动态展示，结合 Vue.js 的生命周期函数确保数据在前端的顺利展示与实时更新。&#x20;

**进度条与缓存管理：**实现了进度条与块号数据的动态绑定，同时设计了一个缓存系统来管理当前块和相邻块的加载，提升了工具的运行效率。&#x20;

**性能优化:** 通过 ChatGPT 辅助生成的代码模板与算法优化建议，提升了图表绘制与块文件管理的性能，显著减少了延迟与卡顿现象。&#x20;

## 项目亮点：

**智能开发支持：**整合GPT-4.0进行代码初步生成，使用浏览器开发者模式调试之后根据调试结果和vscode终端返回的错误日志使用GPT-4.0进行代码调优&#x20;

**大文件解析：**该工具需要处理十几个GB的原始数据，解析速度和内存占用是技术难点之一。通过分块处理和多线程机制，解决了大文件解析过程中性能瓶颈的问题。

**高效缓存机制：**实现块文件缓存管理，确保当前块及相邻块数据的高效加载，缓存控制最多保存5个块，支持前后文件数据的高效读取。在解析大文件的场景下也能保持低运行内存，不占用过多后台资源。&#x20;

**屏幕刷新数据实时分析：**工具能够通过数字电路图展示电频信号波形，并实时分析电频数据，帮助工程师通过图像形式查看墨水屏的电频细节优化屏幕刷新性能。&#x20;

**自定义块文件管理与数据库存储：**支持根据解析的文件不同，生成不同的 SQLite 数据库文件并存储块数据，所有解析的文件根据文件名存储在独立的数据库中。&#x20;

**自动刷新与手动校准模式：**工具支持自动刷新功能，能够在指定的时间间隔内动态加载屏幕电频数据。同时也支持手动块号查找校准，保证灵活的调试体验。
