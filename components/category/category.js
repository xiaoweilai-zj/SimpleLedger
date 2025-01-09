import * as echarts from '../../ec-canvas/echarts'

Component({
  properties: {
    categoryStats: {
      type: Object,
      observer: function(newVal) {
        if (newVal && this.chart) {
          this.updateCategoryChart()
        }
      }
    },
    categoryList: Array,
    pieEc: Object,
    categoryConfig: Object
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
        'pieEc.onInit': (canvas, width, height, dpr) => {
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: dpr
          })
          canvas.setChart(chart)
          this.chart = chart
          
          if (this.data.categoryStats) {
            setTimeout(() => {
              this.updateCategoryChart()
            }, 100)
          }
          return chart
        }
      })
    },

    updateCategoryChart() {
      if (!this.chart) {
        console.warn('饼图实例未初始化')
        return
      }

      if (!this.data.categoryStats || Object.keys(this.data.categoryStats).length === 0) {
        console.log('没有分类数据')
        return
      }

      const data = Object.entries(this.data.categoryStats)
        .map(([name, value]) => ({
          name,
          value: Number(value)
        }))
        .sort((a, b) => b.value - a.value)

      const option = {
        backgroundColor: '#fff',
        tooltip: {
          trigger: 'item',
          formatter: '{b}: ¥{c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'middle',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: {
            color: '#666',
            fontSize: 12
          }
        },
        series: [{
          name: '支出分类',
          type: 'pie',
          radius: ['35%', '55%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{d}%',
            color: '#666',
            fontSize: 12,
            lineHeight: 16
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 8,
            smooth: true
          },
          data: data.map(item => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: this.data.categoryConfig[item.name]?.color || '#999'
            }
          }))
        }]
      }

      this.chart.setOption(option, true)
    }
  }
}) 