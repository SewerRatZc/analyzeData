<template>
  <div id="app">
    <div>
      <h1>Analyze Data</h1>
      <input type="file" @change="onFileSelected" accept=".txt">
      <button @click="processFile">Process File</button>
    </div>
    <!-- ECharts 容器 -->
    <div ref="echartsContainer" style="width: 100%; height: calc(100vh - 200px);"></div>

    <!-- <div>
      <p>Total Labels: {{ labels.length }}</p>
    </div> -->
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  data() {
    return {
      labels: [
        'CH-07--GDSP1',
        'CH-07--GDSP0',
        'CH-01--GDCLK1',
        'CH-01--GDCLK0',
        'CH-08--SDOE1',
        'CH-08--SDOE0',
        'CH-04--GDOE1',
        'CH-04--GDOE0',
        'CH-05--SDCLK1',
        'CH-05--SDCLK0',
        'CH-10--SDLE1',
        'CH-10--SDLE0',
        'CH-02--SDSP1',
        'CH-02--SDSP0',
        'CH-13--D01',
        'CH-13--D00'
      ],
      chartData: [], // 存储文件里解析出来的数据
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
        // this.labels = headers;
        this.chartData = results;
        this.drawChart();
      } catch (error) {
        console.error('解析文件时出错', error);
        alert('解析文件时出错');
      }
    },
    drawChart() {
      const chart = echarts.init(this.$refs.echartsContainer);
      const xData = this.chartData.map(item => item.timestamp);
      const seriesData = this.labels.map(() => []);

      this.chartData.forEach(item => {
        item.values.forEach((value, index) => {
          if (index < this.labels.length) {
            seriesData[index].push(value);
          }
        });
      });

      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { 
          type: 'category', 
          data: xData 
        },
        yAxis: { 
          type: 'category', 
          data: this.labels, 
          axisLabel: {
            fontSize: 12,  // 调整字体大小
            interval: 0    // 确保每个标签都显示
          },
          splitLine: { show: false } // 关闭 y 轴的分隔线
        },
        grid: {
          left: '10%',   // 控制图表左边距
          right: '10%', 
          top: '10%',    
          bottom: '10%', 
          containLabel: true // 防止标签溢出容器
        },
        series: this.labels.map((label, index) => ({
          name: label,
          type: 'line',
          data: seriesData[index]
        })),
        dataZoom: [{ type: 'inside' }, { type: 'slider' }]
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
  background-color: #FFC107;
  color: white;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}
</style>
