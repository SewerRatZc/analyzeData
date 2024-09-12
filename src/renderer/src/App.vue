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
      <button @click="toggleRefresh">{{ isRefreshing ? '暂停自动刷新' : '恢复自动刷新' }}</button>
    </div>
    <!-- ECharts 容器 -->
    <div class="echarts-container" ref="echartsContainer"></div>
    <!-- 展示当前标签长度 -->
    <div>
      <p>Total Labels: {{ labels.length }}</p>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  data() {
    return {
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
      isRefreshing: true // 是否开启自动刷新
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
    },
    
    // 解析文件
    async processFile() {
      if (!this.filePath) {
        alert('请选择一个文件');
        return;
      }
      try {
        console.log('Sending file for processing:', this.filePath);
        const result = await window.api.startProcessing(this.filePath);
        
        if (!result || !result.success) {
          throw new Error('文件处理失败');
        }

        console.log('文件处理成功');
        this.drawChart([]);  // 成功后画图
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
      this.intervalId = setInterval(async () => {
        await this.findDataByBlock();  // 每秒自动获取数据
      }, 1000);
    },
    
    // 绘制图表，动态加载多个数据块
    drawChart(blocksData) {
      const chart = echarts.init(this.$refs.echartsContainer);

      const xData = [];
      const seriesData = this.labels.map(() => []);

      blocksData.forEach(block => {
        block.blockData.forEach(item => {
          xData.push(item.timestamp); // 将时间戳加入xData
          item.values.forEach((value, index) => {
            if (index < this.labels.length) {
              seriesData[index].push(value); // 保证只显示0或1的值
            }
          });
        });
      });

      const that = this;

      chart.setOption({
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
            formatter: function (value) {
              const labelIndex = Math.floor(value / 2);
              return value % 2 === 0 && labelIndex < that.labels.length ? that.labels[labelIndex] : '';
            },
            fontSize: 12,
            interval: 0
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
          data: seriesData[index].map(val => val + index * 2), // 通过index错开每个通道，且只保留0或1的数值
          showSymbol: false,
          lineStyle: {
            width: 2
          }
        })),
        dataZoom: [
          { 
            type: 'inside' 
          }, 
          { 
            type: 'slider' 
          }
        ]
      });

      // 当窗口调整大小时，重新调整图表大小
      window.addEventListener('resize', () => {
        chart.resize();
      });
    },

    // 根据时间戳查找块
    async findBlockByTimestamp() {
      try {
        const blockNumber = await window.api.getBlockByTimestamp(parseInt(this.timestampInput, 10));
        if (!blockNumber) {
          alert('找不到对应的块');
        } else {
          this.blockInput = blockNumber.blockNumber;
          this.findDataByBlock(); // 查找到块后展示数据
        }
      } catch (error) {
        console.error('查找块号时出错:', error);
        alert('查找块号时出错');
      }
    },

    // 根据块号查找数据
    async findDataByBlock() {
      try {
        const currentBlockData = await window.api.getBlockData(parseInt(this.blockInput, 10));

        if (!currentBlockData || !currentBlockData.blockData) {
          alert('找不到块数据');
          return;
        }

        const blocksData = [currentBlockData]; // 初始化为当前块的数据

        // 预加载前后两个块的数据
        const prevBlock = await window.api.getBlockData(currentBlockData.blockNumber - 1);
        const nextBlock = await window.api.getBlockData(currentBlockData.blockNumber + 1);

        if (prevBlock && prevBlock.blockData) {
          blocksData.unshift(prevBlock);
        }
        if (nextBlock && nextBlock.blockData) {
          blocksData.push(nextBlock);
        }

        this.drawChart(blocksData);

      } catch (error) {
        console.error('查找数据时出错:', error);
        alert('查找数据时出错');
      }
    },

    // 开启或暂停自动刷新
    toggleRefresh() {
      this.isRefreshing = !this.isRefreshing;
      if (this.isRefreshing) {
        this.startAutoRefresh();
      } else {
        clearInterval(this.intervalId);
      }
    }
  },

  // 在组件挂载时，绘制空图表
  mounted() {
    this.drawChart([]); 
  },

  // 组件销毁前清除定时器
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
</style>
