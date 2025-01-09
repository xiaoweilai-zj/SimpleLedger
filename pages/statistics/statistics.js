import DB from '../../utils/db'
import eventBus from '../../utils/eventBus'
import * as echarts from '../../ec-canvas/echarts'

// 定义分类配置
const categoryConfig = {
  '餐饮': { color: '#F3A95D' },
  '交通': { color: '#60A17C' },
  '购物': { color: '#B87A5A' },
  '居住': { color: '#B36D61' },
  '娱乐': { color: '#7B9AC5' },
  '医疗': { color: '#5470c6' },
  '教育': { color: '#91cc75' },
  '人情': { color: '#fac858' },
  '其他': { color: '#999999' }
}

function initChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  })
  canvas.setChart(chart)
  return chart
}

Page({
  data: {
    currentTab: 0,
    contentHeight: 0,
    statistics: null,
    categoryStats: [],
    categoryList: [],
    memberStats: [],
    currentBook: null,
    loading: false,
    categoryConfig: categoryConfig,
    pieEc: {
      lazyLoad: true
    },
    lineEc: {
      lazyLoad: true
    }
  },

  onLoad() {
    // 获取系统信息设置内容高度
    const systemInfo = wx.getSystemInfoSync()
    const contentHeight = systemInfo.windowHeight - 180 // 减去头部和导航的高度
    this.setData({ contentHeight })
  },

  async onShow() {
    const app = getApp()
    const currentBook = app.globalData.currentBook
    
    if (!currentBook) {
      wx.showToast({
        title: '请先选择账本',
        icon: 'none'
      })
      return
    }

    this.setData({ 
      loading: true,
      currentBook: currentBook
    })
    
    try {
      // 获取基础统计数据
      const statistics = await DB.getStatistics(currentBook._id)
      
      // 获取账单列表用于分类统计
      const bills = await DB.getBills(currentBook._id)
      
      // 计算分类统计
      const categoryStats = this.calculateCategoryStats(bills)
      
      // 计算日期统计（支出趋势）
      const dateStats = this.calculateDateStats(bills)
      console.log('日期统计数据:', dateStats)
      
      // 获取成员统计
      const memberStats = await DB.getMemberStats(currentBook._id)

      // 转换为列表格式
      const categoryList = Object.entries(categoryStats).map(([name, data]) => ({
        name,
        amount: data.amount.toFixed(2),
        percent: data.percent.toFixed(1)
      })).sort((a, b) => b.amount - a.amount)

      // 更新数据
      this.setData({
        statistics,
        categoryStats,
        categoryList,
        dateStats,
        memberStats,
        loading: false,
        lineEc: {
          lazyLoad: true
        }
      })

    } catch (err) {
      console.error('获取统计数据失败:', err)
      wx.showToast({
        title: '获取统计数据失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  calculateCategoryStats(bills) {
    const stats = {}
    const total = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0)

    bills.forEach(bill => {
      if (!stats[bill.category]) {
        stats[bill.category] = {
          amount: 0,
          count: 0,
          percent: 0
        }
      }
      stats[bill.category].amount += Number(bill.amount || 0)
      stats[bill.category].count += 1
    })

    // 计算百分比
    Object.values(stats).forEach(stat => {
      stat.percent = (stat.amount / total) * 100
    })

    return stats
  },

  updateCharts() {
    if (this.chart) {
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          data: this.data.categoryStats.map(item => ({
            name: item.category,
            value: item.amount,
            itemStyle: {
              color: item.color
            }
          }))
        }]
      }
      this.chart.setOption(option)
    }
  },

  onChartInit(e) {
    this.chart = e.detail.chart
    this.updateCharts()
  },

  switchTab(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentTab: index
    })
  },

  swiperChange(e) {
    this.setData({
      currentTab: e.detail.current
    })
  },

  // 计算日期统计
  calculateDateStats(bills) {
    const stats = {}
    
    // 确保账单按日期排序
    bills.sort((a, b) => new Date(a.date) - new Date(b.date))
    
    bills.forEach(bill => {
      const date = bill.date.split(' ')[0] // 只取日期部分
      if (!stats[date]) {
        stats[date] = 0
      }
      stats[date] += Number(bill.amount || 0)
    })

    // 转换为数组并排序
    const result = Object.entries(stats)
      .map(([date, amount]) => ({
        date,
        amount: Number(amount.toFixed(2))
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    console.log('处理后的日期统计:', result)
    return result
  }
}) 