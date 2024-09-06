<template>
  <div id="app">
    <div>
      <h1>Analyze Data</h1>
      <input type="file" @change="onFileSelected" accept=".txt" />
      <button @click="processFile">Process File</button>
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
      filePath: null,
      intervalId: null // 用于动态刷新
    };
  },
  methods: {
    onFileSelected(event) {
      let file = event.target.files[0];
      if (!file) {
        return;
      }
      this.filePath = file.path; // 获取文件路径
    },
    async processFile() {
      if (!this.filePath) {
        alert('请选择一个文件');
        return;
      }
      try {
        const { headers, results } = await window.api.startProcessing(this.filePath);
        this.labels = headers;
        this.chartData = results;

        // 开始动态更新
        if (this.intervalId) {
          clearInterval(this.intervalId); // 清除之前的定时器
        }
        let currentIndex = 0;
        this.intervalId = setInterval(() => {
          const sliceData = this.chartData.slice(currentIndex, currentIndex + 30); // 每次展示30个点
          this.drawChart(sliceData);
          currentIndex += 30;
          if (currentIndex >= this.chartData.length) {
            currentIndex = 0; // 循环展示
          }
        }, 1000);
      } catch (error) {
        console.error('解析文件时出错', error);
        alert('解析文件时出错');
      }
    },
    drawChart(sliceData) {
      const chart = echarts.init(this.$refs.echartsContainer);
      const xData = sliceData.map(item => item.timestamp); // 时间戳作为横坐标
      const seriesData = this.labels.map(() => []);

      sliceData.forEach(item => {
        item.values.forEach((value, index) => {
          if (index < this.labels.length) {
            seriesData[index].push(value); // 保证只显示0或1的值
          }
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
          data: xData,
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
        dataZoom: [{ type: 'inside' }, { type: 'slider' }]
      });

      window.addEventListener('resize', () => {
        chart.resize(); // 当窗口调整大小时，重新调整图表大小
      });
    }
  },
  mounted() {
    this.drawChart([]); // 页面加载时绘制空图表
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
</style>
