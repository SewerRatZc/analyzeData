<template>
  <div id="app">
    <div>
      <h1>Analyze Data</h1>
      <input type="file" @change="onFileSelected" accept=".txt">
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
      filePath: null
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
        
        // 更新 labels，确保纵坐标每个通道有0和1
        this.labels = headers;

        this.chartData = results;
        this.drawChart();
      } catch (error) {
        console.error('解析文件时出错', error);
        alert('解析文件时出错');
      }
    },
    drawChart() {
      const chart = echarts.init(this.$refs.echartsContainer);
      const xData = this.chartData.map(item => item.timestamp); // 时间戳作为横坐标
      const seriesData = this.labels.map(() => []);

      this.chartData.forEach(item => {
        item.values.forEach((value, index) => {
          if (index < this.labels.length) {
            seriesData[index].push(value);
          }
        });
      });

      const that = this;

      chart.setOption({
        backgroundColor: 'transparent', // 设置透明背景，确保与页面背景一致
        tooltip: { 
          trigger: 'axis',
          formatter: function (params) {
            // 根据params显示原始数据
            let tooltipText = params[0].axisValueLabel + '<br/>';
            params.forEach(param => {
              tooltipText += `${param.seriesName}: ${param.data % 2}<br/>`; // 显示 0 或 1
            });
            return tooltipText;
          }
        },
        legend: {
          type: 'scroll',
          data: this.labels,  // 通过图例控制通道的显示和隐藏
          top: '5%'
        },
        xAxis: {
          type: 'category',  // 使用 category 类型，保持时间戳原样
          data: xData, // 时间戳数据
          axisLabel: {
            rotate: 45,
            interval: 0,
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: this.labels.length * 2, // 每个通道占用两个单位
          interval: 2, // 每个通道间隔 2
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
          step: 'end', // 设置为阶梯线图的样式
          data: seriesData[index].map(value => value === 1 ? (index * 2 + 1) : index * 2), // 0 和 1 对应的y坐标区间
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
    this.drawChart(); // 页面加载时绘制图表
  }
};
</script>

<style scoped>
#app {
  text-align: center;
  background-color: #FFC107; /* 设置页面的背景颜色 */
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
  background-color: transparent; /* 让背景色与页面一致 */
}
</style>
