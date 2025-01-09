import * as echarts from '../../ec-canvas/echarts'

Component({
  properties: {
    dateStats: {
      type: Array,
      observer: function(newVal) {
        if (newVal && this.chart) {
          this.updateChart()
        }
      }
    },
    lineEc: Object
  },
  
  data: {
    chart: null
  },

  lifetimes: {
    attached() {
      this.initChart()
    }
  },

  methods: {
    initChart() {
      this.setData({
        'lineEc.onInit': (canvas, width, height, dpr) => {
          console.log('初始化折线图:', { width, height, dpr })
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: dpr
          })
          canvas.setChart(chart)
          this.chart = chart
          
          if (this.data.dateStats) {
            console.log('有数据，立即更新图表')
            setTimeout(() => {
              this.updateChart()
            }, 100)
          }
          return chart
        }
      })
    },

    updateChart() {
      if (!this.chart || !this.data.dateStats) return

      const option = {
        backgroundColor: '#fff',
        grid: {
          left: '5%',
          right: '5%',
          top: '10%',
          bottom: '15%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}\n支出: ¥{c}'
        },
        xAxis: {
          type: 'category',
          data: this.data.dateStats.map(item => item.date),
          axisLabel: {
            interval: 0,
            rotate: 30,
            fontSize: 10,
            color: '#666'
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        series: [{
          type: 'line',
          smooth: true,
          data: this.data.dateStats.map(item => item.amount),
          itemStyle: {
            color: '#1296db'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
              offset: 0,
              color: 'rgba(18,150,219,0.3)'
            }, {
              offset: 1,
              color: 'rgba(18,150,219,0.1)'
            }])
          }
        }]
      }

      this.chart.setOption(option)
    }
  }
}) 