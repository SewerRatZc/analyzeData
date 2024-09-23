<template>
  <div id="app">
    <div>
      <h1>Analyze Data</h1>
      <input type="file" @change="onFileSelected" accept=".txt" />
      <button @click="processFile">解析文件</button>
    </div>
    <div>
      <input v-model="timestampInput" placeholder="输入时间戳" />
      <button @click="findBlockByTimestamp">通过时间戳查找数据块</button>
    </div>
    <div>
      <input v-model="blockInput" placeholder="输入块号" />
      <button @click="findDataByBlock">通过块号查找数据</button>
    </div>
    <div>
      <p>
        当前加载的块号：{{ currentBlockNumber }}
      </p>
    </div>
    <div>
      <button @click="toggleRefresh">{{ isRefreshing ? '暂停自动刷新' : '恢复自动刷新' }}</button>
    </div>
    <div class="echarts-container" ref="echartsContainer"></div>
    <!-- <div>
      <p>Total Labels: {{ labels.length }}</p>
    </div> -->
    <!-- 滑动进度条控制块文件加载 -->
    <!-- <div class="progress-container">
      <p>当前加载的块文件：{{ currentBlockNumber }}</p>
      <input type="range"
       ref="blockSlider"
      :min="cacheStartBlock"
      :max="cacheEndBlock" 
      v-model="currentBlockNumber"
      @input="onBlockNumberChanged" />
    </div> -->
    <div class="progress-container">
      <input type="range" ref="blockSlider" :min="0" :max="maxBlockNumber" v-model="currentBlockNumber"
        @input="onBlockNumberChanged" />
    </div>

  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  data() {
    return {
      chart: null,
      labels: [
        'CH-07--GDSP',
        'CH-01--GDCLK',
        'CH-08--SDOE',
        'CH-04--GDOE',
        'CH-05--SDCLK',
        'CH-10--SDLE',
        'CH-02--SDSP',
        'CH-13--D0'
      ],
      chartData: [], // 存储每个通道的0和1数据
      filePath: null, // 上传文件路径
      timestampInput: '', // 输入时间戳
      blockInput: '', // 输入块号
      intervalId: null, // 用于动态刷新
      isRefreshing: true, // 是否开启自动刷新
      currentBlockData: [], // 当前块数据
      currentDataIndex: 0, // 当前块中读取到的数据索引
      blockCache: [], // 缓存前后五个块
      currentBlockNumber: 0, // 当前显示的块号

      // cacheStartBlock: 0, // 缓存的起始块号
      // cacheEndBlock: 4, // 缓存的结束块号，初始设为5块
    };
  },
  methods: {
    // 处理文件选择
    onFileSelected(event) {
      let file = event.target.files[0];
      if (!file) {
        return;
      }
      this.filePath = file.path; // 获取文件路径
      console.log(`文件路径被选定为: ${this.filePath}`);
    },

    // 解析文件
    async processFile() {
      if (!this.filePath) {
        alert('请选择一个文件');
        return;
      }
      try {
        console.log(`------${this.filePath}------`);
        console.log('Sending file for processing:', this.filePath);
        const result = await window.api.startProcessing(this.filePath);

        if (!result || !result.success) {
          throw new Error('文件处理失败');
        }
        console.log('文件处理成功');
        this.maxBlockNumber = result.processedData.length - 1;
        // this.cacheStartBlock=0;
        // this.cacheEndBlock=Math.min(this.maxBlockNumber,4);
        // this.currentBlockNumber = this.cacheStartBlock; // 从第一个块号开始
        this.currentBlockNumber = 0;
        this.startAutoRefresh(); // 开启自动刷新
      } catch (error) {
        console.error('解析文件时出错:', error.message);
        alert(`解析文件时出错: ${error.message}`);
      }
    },

    // 自动刷新
    async startAutoRefresh() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      this.currentDataIndex = 0;
      this.intervalId = setInterval(async () => {
        if (this.currentBlockData.length === 0 || this.currentDataIndex >= this.currentBlockData.length) {
          // 如果当前块数据加载完毕，获取下一个块
          await this.loadAdjacentBlocks();
          this.currentDataIndex = 0; // 重置数据索引
          this.currentBlockNumber += 1; // 更新块号
        }
        this.updateChartWithNextData(); // 更新图表
      }, 1000); // 每秒钟更新
    },

    // 从当前块中提取接下来的30组数据并更新图表
    updateChartWithNextData() {
      const nextData = this.currentBlockData.slice(this.currentDataIndex, this.currentDataIndex + 30);
      this.currentDataIndex += 30; // 更新索引
      this.drawChart(nextData); // 传入新数据绘制图表
    },

    // 绘制图表，动态加载数据
    drawChart(dataSlice) {
      // if(chart){
      //   chart.dispose(); // 清空之前的图表数据
      // }

      const existingChart = echarts.getInstanceByDom(this.$refs.echartsContainer);
      if (existingChart) {
        existingChart.dispose(); // 销毁之前的图表实例
      }

      const chart = echarts.init(this.$refs.echartsContainer);

      const xData = dataSlice.map(item => item.timestamp); // 将时间戳加入xData
      const seriesData = this.labels.map(() => []); // 清空每个通道的数据

      dataSlice.forEach(item => {
        item.values.forEach((value, index) => {
          if (index < this.labels.length) {
            seriesData[index].push(value); // 只显示0或1的值
          }
        });
      });

      chart.setOption({
        animation: false,//关闭动画
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          formatter: function (params) {
            const tooltipLines = params.map(param => {
              const value = param.value % 2; // 确保展示的是0或1
              return `${param.marker} ${param.seriesName}: ${value}`;
            });
            return params[0].axisValue + '<br />' + tooltipLines.join('<br />');
          }
        },
        legend: {
          type: 'scroll',
          data: this.labels,
          top: '5%'
        },
        xAxis: {
          type: 'category',
          data: xData, // 显示时间戳作为横坐标
          axisLabel: {
            rotate: 45,
            interval: 0,
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: this.labels.length * 2, // 每个通道的0和1在不同的位置显示
          interval: 2,
          axisLabel: {
            formatter: (value) => {
              const labelIndex = Math.floor(value / 2);
              return value % 2 === 0 && labelIndex < this.labels.length ? this.labels[labelIndex] : '';
            },
            fontSize: 12
          },
          splitLine: { show: false }
        },
        grid: {
          left: '5%',
          right: '5%',
          top: '20%',
          bottom: '15%',
          containLabel: true
        },
        series: this.labels.map((label, index) => ({
          name: label,
          type: 'line',
          step: 'end',
          data: seriesData[index].map(val => val + index * 2), // 错开每个通道的线
          showSymbol: false,
          lineStyle: {
            width: 2
          }
        })),
        dataZoom: [
          { type: 'inside' },
          { type: 'slider' }
        ]
      });

      window.addEventListener('resize', () => {
        chart.resize(); // 当窗口调整大小时，重新调整图表大小
      });
    },

    // 根据进度条拖动事件更新当前块号
    async onBlockNumberChanged() {
      // const relativeIndex = this.currentBlockNumber - this.cacheStartBlock;
      // if (relativeIndex >= 0 && relativeIndex < this.cacheBlocks.length) {
      // this.currentBlockNumber = this.blockCache[relativeIndex].blockData;
      // this.currentDataIndex = 0;
      this.currentBlockNumber = parseInt(this.$refs.blockSlider.value, 10);
      this.loadAdjacentBlocks();
      // }
    },

    // 加载当前块和相邻的块
    async loadAdjacentBlocks(signal) {
      let isManual =null;
      if(signal === 1){//通过块号查询
        isManual =true;
      }else{//自动加载
        isManual = false;
      }
      const blockData = await this.getBlockData(this.currentBlockNumber, isManual);
      if (blockData) {
        this.currentBlockData = blockData.blockData;
        this.currentDataIndex = 0;
        this.updateChartWithNextData();
      }
      this.cacheBlocks(); // 缓存相邻块
    },




    async findDataByBlock() {
      this.currentBlockNumber = parseInt(this.blockInput, 10); // 设置当前块号
      const signal=1;
      await this.loadAdjacentBlocks(signal);
      this.currentDataIndex = 0;
      this.updateChartWithNextData(); // 开始展示数据
    },

    // async findDataByBlock() {
    //   clearInterval(this.intervalId); // 暂停自动刷新
    //   const blockNumber = parseInt(this.blockInput, 10); // 获取输入的块号
    //   if (isNaN(blockNumber)) {
    //     alert("请输入有效的块号");
    //     return;
    //   }

    //   // 传递 isManual = true，表示手动查询
    //   const blockData = await this.getBlockData(blockNumber, true);
    //   if (blockData) {
    //     this.currentBlockData = blockData.blockData;
    //     this.currentDataIndex = 0;
    //     this.updateChartWithNextData(); // 开始展示数据
    //     this.startAutoRefresh();
    //   }
    // },




    async cacheBlocks() {
      // 确保 currentBlockNumber 在合法范围内
      if (this.currentBlockNumber < 0 || this.currentBlockNumber >= this.totalBlocks) {
        console.error('Invalid current block number:', this.currentBlockNumber);
        return;
      }

      const prevBlockNumber = this.currentBlockNumber - 1;
      const nextBlockNumber = this.currentBlockNumber + 1;

      // 避免下标越界的块号
      if (prevBlockNumber >= 0) {
        try {
          const prevBlock = await this.getBlockData(prevBlockNumber,false);
          if (prevBlock) {
            this.blockCache.unshift(prevBlock);
            console.log(`Cached previous block number: ${prevBlockNumber}`);
          }
        } catch (err) {
          console.error(`Error caching previous block number: ${prevBlockNumber}`, err);
        }
      }

      if (nextBlockNumber < this.totalBlocks) {
        try {
          const nextBlock = await this.getBlockData(nextBlockNumber, false);
          if (nextBlock) {
            this.blockCache.push(nextBlock);
            console.log(`Cached next block number: ${nextBlockNumber}`);
          }
        } catch (err) {
          console.error(`Error caching next block number: ${nextBlockNumber}`, err);
        }
      }

      // 保持缓存区最多5个块文件
      if (this.blockCache.length > 5) {
        this.blockCache.shift(); // 删除最旧的块
        console.log('Removed the oldest block from cache to maintain 5-block limit.');
      }

      // 更新进度条的最小值和最大值，只允许操作缓存区的块
      if (this.blockCache.length > 0) {
        this.cacheStartBlock = Math.max(0, this.currentBlockNumber - 2); // 确保起始块号不小于0
        this.cacheEndBlock = Math.min(this.totalBlocks - 1, this.currentBlockNumber + 2); // 确保结束块号不大于总块数
        console.log(`Cache range updated: Start = ${this.cacheStartBlock}, End = ${this.cacheEndBlock}`);
      }

      // 限制进度条的范围
      this.$refs.blockSlider.min = this.cacheStartBlock;
      this.$refs.blockSlider.max = this.cacheEndBlock;
    },

    // 从 API 获取块数据
    async getBlockData(blockNumber, isManual) {

      // console.log(`========isManual in getBlockData :${isManual}========`);
      // console.log(`===this.filePath:${this.filePath}`);

      const filePath = this.filePath;

      // console.log(`===filePath:${filePath}`);
      // console.log(`-----${filePath.length}`);

      // console.log(`filePath 类型: ${typeof filePath}`);
      // console.log(`filePath 值: ${filePath}`);

      // console.log(`filePath empty check: ${!filePath}`);
      // console.log(`filePath length check: ${!filePath.length}`);

      // if (!filePath||!filePath.length) {
        // console.log("进if分支了吗");
        // if (isManual) {
        //   {
        //     alert("请先选择并解析文件");
        //   }
        //   return null;  // 终止块号查询
        // }

        try {
          const result = await window.api.getBlockData({ blockNumber, filePath });

          // console.log(`===result: ${JSON.stringify(result, null, 2)}`);

          if (result && result.blockData && result.blockData.length > 0) {

            // console.log(`====进来trycatch===`);
            if (isManual) {
              alert("块号加载成功");
            }
            return result;
          } else {
            if (isManual) {
              alert("块号未找到，加载失败");
            }
          }
        } catch (error) {
          console.error('Error fetching block data:', error);
          if (isManual) {
            alert("查询块号时发生错误，请重试");
          }
        }
        return null;
      // }
    },

    // 如果是通过按钮来查询的，就显示提示信息
    onSearchByBlockNumber() {
      const blockNumber = parseInt(this.inputBlockNumber, 10);
      if (isNaN(blockNumber)) {
        alert("请输入有效的块号");
        return;
      }

      this.getBlockData(blockNumber, true);
    },

    // 根据时间戳查找块
    async findBlockByTimestamp() {
      try {
        const blockNumber = await window.api.getBlockByTimestamp(parseInt(this.timestampInput, 10));
        this.blockInput = blockNumber;
        this.currentBlockNumber = blockNumber;
        await this.loadAdjacentBlocks();
      } catch (error) {
        console.error('查找块号时出错:', error);
        alert('查找块号时出错');
      }
    },

    // 切换自动刷新
    toggleRefresh() {
      this.isRefreshing = !this.isRefreshing;
      if (this.isRefreshing) {
        this.startAutoRefresh();
      } else {
        clearInterval(this.intervalId);
      }
    }
  },

  mounted() {
    this.drawChart([]); // 初始化时绘制空图表
  },

  beforeUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
};
</script>

<style scoped>
#app {
  text-align: center;
  background-color: #FFC107;
  color: white;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  height: 100vh;
  width: 100vw;
}

.echarts-container {
  width: 100%;
  height: 85vh;
  margin: 0 auto;
  background-color: transparent;
}

/* 进度条容器 */
.progress-container {
  width: 80%;
  /* 设置宽度为整个页面的80% */
  /* margin: 10px auto; 居中对齐 */
  right: 0%;
}

/* 调整进度条的样式 */
input[type="range"] {
  /* -webkit-appearance: none; */
  width: 100%;
  height: 8px;
  background: #ccc;
  outline: none;
  border-radius: 5px;
  opacity: 0.7;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  background: #1e88e5;
  cursor: pointer;
  border-radius: 50%;
}

input[type="range"]::-moz-range-thumb {
  width: 15px;
  height: 15px;
  background: #1e88e5;
  cursor: pointer;
  border-radius: 50%;
}
</style>