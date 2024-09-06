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
      chartData: [], // 用于存储解析的数据
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
        
        // 合并文件中的 headers 和原始的 labels，确保解析文件后的 labels 保留完整
        this.labels = this.labels.map(label => headers.includes(label) ? label : label);
        
        this.chartData = results;
        this.drawChart();
      } catch (error) {
        console.error('解析文件时出错', error);
        alert('解析文件时出错');
      }
    },
    drawChart() {
      const chart = echarts.init(this.$refs.echartsContainer);
      const xData = this.chartData.map(item => item.timestamp); // 保持时间戳原样不做转换
      const seriesData = this.labels.map(() => []);

      this.chartData.forEach(item => {
        item.values.forEach((value, index) => {
          if (index < this.labels.length) {
            seriesData[index].push(value);
          }
        });
      });

      // 获取横坐标最小值和最大值
      const xMin = Math.min(...xData);
      const xMax = Math.max(...xData);

      chart.setOption({
        backgroundColor: 'transparent', // 设置透明背景，移除多余的颜色层
        tooltip: { trigger: 'axis' },
        xAxis: { 
          type: 'value',  // 使用 'value' 类型
          min: xMin,  // 设置横坐标最小值为数据中的最小时间戳
          max: xMax,  // 设置横坐标最大值为数据中的最大时间戳
          axisLabel: {
            rotate: 45  // 旋转标签以避免重叠
          }
        },
        yAxis: { 
          type: 'category', 
          data: this.labels,
          axisLabel: {
            fontSize: 12,
            interval: 0
          },
          splitLine: { show: false } // 关闭 y 轴分隔线
        },
        grid: {
          left: '5%',  // 减小左右边距以增加绘图区域宽度
          right: '%',
          top: '10%',  // 减少上边距，让图表向上扩展
          bottom: '5%', // 减少下边距，让图表向下扩展
          containLabel: true
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
    this.drawChart(); // 页面加载时绘制空图表
  }
};
</script>

<style scoped>
#app {
  text-align: center;
  background-color: #FFC107; /* 使用单一的背景色 */
  color: white;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  height: 100vh; /* 确保整个页面高度自适应 */
  width: 100vw;
}

.echarts-container {
  width: 100%;    /* 宽度增加到 100% */
  height: 90vh;  /* 高度增加到 90vh 占据更多页面 */
  margin: 0 auto; /* 居中 */
  background-color: transparent; /* 图表背景透明，避免额外颜色层 */
}
</style>
